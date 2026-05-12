
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS telefone text;

-- Helper function: number of approved administrators
CREATE OR REPLACE FUNCTION public.count_active_admins()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::int
  FROM public.user_roles ur
  JOIN public.profiles p ON p.id = ur.user_id
  WHERE ur.role = 'administrador' AND p.status = 'aprovado';
$$;

REVOKE EXECUTE ON FUNCTION public.count_active_admins() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.count_active_admins() TO authenticated;
