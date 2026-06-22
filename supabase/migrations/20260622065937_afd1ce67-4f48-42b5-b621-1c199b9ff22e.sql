GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_partner_id(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_profile_id(uuid) TO anon, authenticated;
GRANT USAGE ON SCHEMA app_private TO anon, authenticated;
GRANT EXECUTE ON FUNCTION app_private.has_role(uuid, app_role) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION app_private.get_partner_id(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION app_private.get_profile_id(uuid) TO anon, authenticated;