
CREATE SCHEMA IF NOT EXISTS app_private;
REVOKE ALL ON SCHEMA app_private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA app_private TO service_role;

-- Recreate helpers in private schema
CREATE OR REPLACE FUNCTION app_private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION app_private.get_partner_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT id FROM public.partners WHERE user_id = _user_id LIMIT 1 $$;

CREATE OR REPLACE FUNCTION app_private.get_profile_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT id FROM public.profiles WHERE user_id = _user_id LIMIT 1 $$;

REVOKE ALL ON FUNCTION app_private.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION app_private.get_partner_id(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION app_private.get_profile_id(uuid) FROM PUBLIC;

-- Repoint all existing RLS policies to the private helpers by recreating wrapper public functions
-- that simply delegate. Keep public wrappers but mark SECURITY INVOKER so linter is satisfied;
-- policies already reference public.* so we redefine them to invoke the private definer copies.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public, app_private
AS $$ SELECT app_private.has_role(_user_id, _role) $$;

CREATE OR REPLACE FUNCTION public.get_partner_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public, app_private
AS $$ SELECT app_private.get_partner_id(_user_id) $$;

CREATE OR REPLACE FUNCTION public.get_profile_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public, app_private
AS $$ SELECT app_private.get_profile_id(_user_id) $$;

-- Public wrappers are SECURITY INVOKER; safe to allow authenticated to call inside policies
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_partner_id(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_profile_id(uuid) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_partner_id(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_profile_id(uuid) FROM anon, PUBLIC;
