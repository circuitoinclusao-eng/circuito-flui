
-- Harden RLS SELECT policies on sensitive tables: restrict to staff with edit role (admin, coord, professor, colaborador) instead of any authenticated user.
-- Restrict financial data and user roles to admin/coord/self.

-- atendidos: PII (CPF, RG, address, health)
DROP POLICY IF EXISTS view_atendidos ON public.atendidos;
CREATE POLICY view_atendidos ON public.atendidos FOR SELECT TO authenticated
USING (public.can_edit(auth.uid()));

-- historico_atendimentos
DROP POLICY IF EXISTS view_hist_at ON public.historico_atendimentos;
CREATE POLICY view_hist_at ON public.historico_atendimentos FOR SELECT TO authenticated
USING (public.can_edit(auth.uid()));

-- atendido_documentos
DROP POLICY IF EXISTS view_at_doc ON public.atendido_documentos;
CREATE POLICY view_at_doc ON public.atendido_documentos FOR SELECT TO authenticated
USING (public.can_edit(auth.uid()));

-- atendido_marcadores
DROP POLICY IF EXISTS view_at_marc ON public.atendido_marcadores;
CREATE POLICY view_at_marc ON public.atendido_marcadores FOR SELECT TO authenticated
USING (public.can_edit(auth.uid()));

-- atendido_projetos
DROP POLICY IF EXISTS view_at_proj ON public.atendido_projetos;
CREATE POLICY view_at_proj ON public.atendido_projetos FOR SELECT TO authenticated
USING (public.can_edit(auth.uid()));

-- contatos
DROP POLICY IF EXISTS view_contatos ON public.contatos;
CREATE POLICY view_contatos ON public.contatos FOR SELECT TO authenticated
USING (public.can_edit(auth.uid()));

-- atendimentos
DROP POLICY IF EXISTS view_atend ON public.atendimentos;
CREATE POLICY view_atend ON public.atendimentos FOR SELECT TO authenticated
USING (public.can_edit(auth.uid()));

-- presencas / presencas_atividade
DROP POLICY IF EXISTS view_pres ON public.presencas;
CREATE POLICY view_pres ON public.presencas FOR SELECT TO authenticated
USING (public.can_edit(auth.uid()));

DROP POLICY IF EXISTS view_pres_at ON public.presencas_atividade;
CREATE POLICY view_pres_at ON public.presencas_atividade FOR SELECT TO authenticated
USING (public.can_edit(auth.uid()));

-- atividade_inscritos
DROP POLICY IF EXISTS view_at_insc ON public.atividade_inscritos;
CREATE POLICY view_at_insc ON public.atividade_inscritos FOR SELECT TO authenticated
USING (public.can_edit(auth.uid()));

-- documentos
DROP POLICY IF EXISTS view_docs ON public.documentos;
CREATE POLICY view_docs ON public.documentos FOR SELECT TO authenticated
USING (public.can_edit(auth.uid()));

-- projeto_orcamento (financial - admin/coord only)
DROP POLICY IF EXISTS view_po ON public.projeto_orcamento;
CREATE POLICY view_po ON public.projeto_orcamento FOR SELECT TO authenticated
USING (public.is_admin_or_coord(auth.uid()));

-- profiles: own profile or admin/coord (needed for staff selectors)
DROP POLICY IF EXISTS auth_select_profiles ON public.profiles;
CREATE POLICY auth_select_profiles ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = id OR public.is_admin_or_coord(auth.uid()));

-- user_roles: own roles or admin only
DROP POLICY IF EXISTS auth_view_roles ON public.user_roles;
CREATE POLICY auth_view_roles ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'administrador'));

-- Fix race condition in handle_new_user using advisory lock on first-admin assignment
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  any_admin_exists boolean;
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email,'@',1)),
    NEW.email
  );

  -- Serialize first-admin assignment with advisory lock
  PERFORM pg_advisory_xact_lock(hashtext('first_admin_assignment'));

  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE role = 'administrador') INTO any_admin_exists;

  IF NOT any_admin_exists THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'administrador');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'colaborador');
  END IF;

  RETURN NEW;
END;
$function$;
