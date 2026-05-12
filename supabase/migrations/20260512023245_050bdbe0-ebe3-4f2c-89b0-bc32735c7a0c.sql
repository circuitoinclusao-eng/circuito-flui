
-- 1. Lock down SECURITY DEFINER functions: revoke from PUBLIC/anon, grant only where needed
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_admin_or_coord(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.can_edit(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_approved(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_profile_status() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_or_coord(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_edit(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_approved(uuid) TO authenticated;

-- 2. Force-rotate the leaked admin password to a random value.
-- The administrator must use the password-reset email flow to set a new password.
DO $$
BEGIN
  UPDATE auth.users
     SET encrypted_password = crypt(encode(gen_random_bytes(32), 'hex'), gen_salt('bf'))
   WHERE email = 'circuitoinclusao@gmail.com';
END $$;
