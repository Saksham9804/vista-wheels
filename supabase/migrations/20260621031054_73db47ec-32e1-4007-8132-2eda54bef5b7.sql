
-- Rebuild view with security_invoker=true so it uses caller's RLS
DROP VIEW IF EXISTS public.public_partners;
CREATE VIEW public.public_partners
WITH (security_invoker = true) AS
SELECT
  id, business_name, business_type, city, state, pin_code,
  shop_address, latitude, longitude, number_of_vehicles,
  profile_photo, rating, total_bookings, status, created_at
FROM public.partners
WHERE status = 'approved'::partner_status;

GRANT SELECT ON public.public_partners TO anon, authenticated;

-- Restore public RLS read for approved partners so the view (security_invoker) can read rows
CREATE POLICY "Anyone can view approved partners"
ON public.partners FOR SELECT TO anon, authenticated
USING (status = 'approved'::partner_status);

-- Column-level access: prevent anon from reading email/phone even though row is approved
REVOKE SELECT ON public.partners FROM anon;
GRANT SELECT (
  id, user_id, business_name, business_type, city, state, pin_code,
  shop_address, latitude, longitude, number_of_vehicles, profile_photo,
  phone_verified, rating, total_bookings, status, created_at, updated_at,
  approved_at, approved_by, rejection_reason
) ON public.partners TO anon;
