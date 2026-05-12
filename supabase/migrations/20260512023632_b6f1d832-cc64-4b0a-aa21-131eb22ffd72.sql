
-- =========================================================
-- 1. STORAGE: limpar políticas duplicadas e restringir a admin
-- =========================================================

-- Drop loose policies (bucket_id only)
DROP POLICY IF EXISTS "atendidos_auth_insert" ON storage.objects;
DROP POLICY IF EXISTS "atendidos_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "atendidos_auth_delete" ON storage.objects;
DROP POLICY IF EXISTS "atendidos_auth_select" ON storage.objects;
DROP POLICY IF EXISTS "fotos_auth_insert"     ON storage.objects;
DROP POLICY IF EXISTS "fotos_auth_update"     ON storage.objects;
DROP POLICY IF EXISTS "fotos_auth_delete"     ON storage.objects;
DROP POLICY IF EXISTS "fotos_auth_select"     ON storage.objects;

-- Drop existing strict policies so we can recreate them admin-only
DROP POLICY IF EXISTS "priv_atendidos_select" ON storage.objects;
DROP POLICY IF EXISTS "priv_atendidos_insert" ON storage.objects;
DROP POLICY IF EXISTS "priv_atendidos_update" ON storage.objects;
DROP POLICY IF EXISTS "priv_atendidos_delete" ON storage.objects;
DROP POLICY IF EXISTS "priv_fotos_select"     ON storage.objects;
DROP POLICY IF EXISTS "priv_fotos_insert"     ON storage.objects;
DROP POLICY IF EXISTS "priv_fotos_update"     ON storage.objects;
DROP POLICY IF EXISTS "priv_fotos_delete"     ON storage.objects;

-- SELECT: usuários aprovados que podem editar (staff) podem ler para gerar signed URLs
CREATE POLICY "priv_atendidos_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'atendidos' AND public.can_edit(auth.uid()));

CREATE POLICY "priv_fotos_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'fotos' AND public.can_edit(auth.uid()));

-- INSERT / UPDATE / DELETE: apenas administradores
CREATE POLICY "priv_atendidos_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'atendidos' AND public.has_role(auth.uid(), 'administrador'));

CREATE POLICY "priv_atendidos_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'atendidos' AND public.has_role(auth.uid(), 'administrador'))
  WITH CHECK (bucket_id = 'atendidos' AND public.has_role(auth.uid(), 'administrador'));

CREATE POLICY "priv_atendidos_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'atendidos' AND public.has_role(auth.uid(), 'administrador'));

CREATE POLICY "priv_fotos_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'fotos' AND public.has_role(auth.uid(), 'administrador'));

CREATE POLICY "priv_fotos_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'fotos' AND public.has_role(auth.uid(), 'administrador'))
  WITH CHECK (bucket_id = 'fotos' AND public.has_role(auth.uid(), 'administrador'));

CREATE POLICY "priv_fotos_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'fotos' AND public.has_role(auth.uid(), 'administrador'));

-- =========================================================
-- 2. PROFILES: impedir auto-promoção
-- =========================================================

DROP POLICY IF EXISTS "self_update_profile" ON public.profiles;

CREATE POLICY "self_update_profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND status = (SELECT p.status FROM public.profiles p WHERE p.id = auth.uid())
    AND email  = (SELECT p.email  FROM public.profiles p WHERE p.id = auth.uid())
  );
