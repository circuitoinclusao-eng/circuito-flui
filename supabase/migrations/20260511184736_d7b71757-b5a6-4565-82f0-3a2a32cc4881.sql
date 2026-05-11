
-- Remover policies de SELECT amplas dos buckets públicos
DROP POLICY IF EXISTS "fotos_public_object_read" ON storage.objects;
DROP POLICY IF EXISTS "atendidos_public_object_read" ON storage.objects;

-- Converter funções para SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path TO 'public' AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_coord(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path TO 'public' AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('administrador','coordenador'))
$$;

CREATE OR REPLACE FUNCTION public.can_edit(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path TO 'public' AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('administrador','coordenador','colaborador'))
$$;
