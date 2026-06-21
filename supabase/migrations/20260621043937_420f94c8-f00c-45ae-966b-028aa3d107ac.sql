GRANT EXECUTE ON FUNCTION public.get_partner_id(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_profile_id(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated;