
-- Limpeza completa: remover qualquer policy existente nos buckets fotos/atendidos
DO $$
DECLARE p record;
BEGIN
  FOR p IN
    SELECT polname FROM pg_policy
    WHERE polrelid = 'storage.objects'::regclass
      AND (polname ILIKE '%fotos%' OR polname ILIKE '%atendidos%')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', p.polname);
  END LOOP;
END $$;

-- Leitura pública (por URL direta funciona; listagem ampla não é concedida)
CREATE POLICY "fotos_public_object_read"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'fotos');
CREATE POLICY "atendidos_public_object_read"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'atendidos');

-- Escrita só para autenticados
CREATE POLICY "fotos_auth_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'fotos');
CREATE POLICY "fotos_auth_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'fotos');
CREATE POLICY "fotos_auth_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'fotos');
CREATE POLICY "atendidos_auth_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'atendidos');
CREATE POLICY "atendidos_auth_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'atendidos');
CREATE POLICY "atendidos_auth_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'atendidos');

-- Restringir SECURITY DEFINER
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_admin_or_coord(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_edit(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_or_coord(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_edit(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
