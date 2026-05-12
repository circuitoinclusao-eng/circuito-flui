
-- 1. Status no profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pendente';

-- Validação por trigger (CHECK constraints rígidas evitadas)
CREATE OR REPLACE FUNCTION public.validate_profile_status()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status NOT IN ('pendente','aprovado','bloqueado') THEN
    RAISE EXCEPTION 'status inválido: %', NEW.status;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_validate_profile_status ON public.profiles;
CREATE TRIGGER trg_validate_profile_status
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.validate_profile_status();

-- Backfill: usuários existentes ficam aprovados (não quebrar acesso atual)
UPDATE public.profiles SET status = 'aprovado' WHERE status = 'pendente';

-- 2. Função is_approved
CREATE OR REPLACE FUNCTION public.is_approved(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id AND status = 'aprovado')
$$;

-- 3. Atualiza funções de papel para exigirem aprovação
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.profiles p ON p.id = ur.user_id
    WHERE ur.user_id = _user_id AND ur.role = _role AND p.status = 'aprovado'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_coord(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.profiles p ON p.id = ur.user_id
    WHERE ur.user_id = _user_id
      AND ur.role IN ('administrador','coordenador')
      AND p.status = 'aprovado'
  )
$$;

CREATE OR REPLACE FUNCTION public.can_edit(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.profiles p ON p.id = ur.user_id
    WHERE ur.user_id = _user_id
      AND ur.role IN ('administrador','coordenador','colaborador','professor')
      AND p.status = 'aprovado'
  )
$$;

-- 4. Atualiza handle_new_user: novos usuários ficam pendentes
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  any_admin_exists boolean;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('first_admin_assignment'));

  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE role = 'administrador') INTO any_admin_exists;

  INSERT INTO public.profiles (id, nome, email, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email,'@',1)),
    NEW.email,
    CASE WHEN any_admin_exists THEN 'pendente' ELSE 'aprovado' END
  );

  IF NOT any_admin_exists THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'administrador');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'consulta');
  END IF;

  RETURN NEW;
END $$;

-- Garantir que o trigger existe em auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Buckets privados
UPDATE storage.buckets SET public = false WHERE id IN ('atendidos','fotos');

-- 6. Storage RLS: limpar políticas antigas e criar novas restritas
DO $$
DECLARE p record;
BEGIN
  FOR p IN
    SELECT policyname FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND policyname IN (
        'public_read_atendidos','public_read_fotos',
        'auth_write_atendidos','auth_write_fotos',
        'atendidos_read','fotos_read','atendidos_write','fotos_write',
        'priv_read_at','priv_read_fo','priv_ins_at','priv_ins_fo','priv_upd_at','priv_upd_fo','priv_del_at','priv_del_fo'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', p.policyname);
  END LOOP;
END $$;

CREATE POLICY priv_read_at ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'atendidos' AND public.can_edit(auth.uid()));
CREATE POLICY priv_ins_at ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'atendidos' AND public.can_edit(auth.uid()));
CREATE POLICY priv_upd_at ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'atendidos' AND public.can_edit(auth.uid()));
CREATE POLICY priv_del_at ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'atendidos' AND public.is_admin_or_coord(auth.uid()));

CREATE POLICY priv_read_fo ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'fotos' AND public.can_edit(auth.uid()));
CREATE POLICY priv_ins_fo ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'fotos' AND public.can_edit(auth.uid()));
CREATE POLICY priv_upd_fo ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'fotos' AND public.can_edit(auth.uid()));
CREATE POLICY priv_del_fo ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'fotos' AND public.is_admin_or_coord(auth.uid()));

-- 7. Tabela de auditoria
CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  acao text NOT NULL,
  entidade text,
  entidade_id text,
  detalhes jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS audit_select ON public.audit_log;
CREATE POLICY audit_select ON public.audit_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'administrador'));

DROP POLICY IF EXISTS audit_insert ON public.audit_log;
CREATE POLICY audit_insert ON public.audit_log FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
