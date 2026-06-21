
DROP VIEW IF EXISTS public.public_partners;

REVOKE SELECT (email, phone) ON public.partners FROM anon;

CREATE VIEW public.public_partners
WITH (security_invoker = true)
AS
SELECT
  id, user_id, business_name, business_type, city, state, pin_code,
  shop_address, latitude, longitude, profile_photo, status, rating,
  total_bookings, number_of_vehicles, approved_at, created_at, updated_at
FROM public.partners
WHERE status = 'approved'::partner_status;

GRANT SELECT ON public.public_partners TO anon, authenticated;

REVOKE ALL ON public.phone_otps FROM anon, authenticated, PUBLIC;
GRANT ALL ON public.phone_otps TO service_role;

DROP POLICY IF EXISTS "Deny all client access to phone_otps" ON public.phone_otps;
CREATE POLICY "Deny all client access to phone_otps"
  ON public.phone_otps
  AS RESTRICTIVE
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_partner_id(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_profile_id(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_partner_id(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_profile_id(uuid) TO authenticated, service_role;
