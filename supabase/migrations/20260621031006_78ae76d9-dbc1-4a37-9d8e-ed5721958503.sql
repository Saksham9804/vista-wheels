
-- 1) Restrict user_roles INSERT to only "customer" role (prevent privilege escalation)
DROP POLICY IF EXISTS "Users can insert their own role on signup" ON public.user_roles;
CREATE POLICY "Users can insert their own customer role on signup"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND role = 'customer'::app_role);

-- 2) Restrict bookings INSERT to own customer_id
DROP POLICY IF EXISTS "Authenticated users can create bookings" ON public.bookings;
CREATE POLICY "Customers can create their own bookings"
ON public.bookings FOR INSERT TO authenticated
WITH CHECK (customer_id = public.get_profile_id(auth.uid()));

-- 3) Restrict active_bookings INSERT to own customer_id
DROP POLICY IF EXISTS "Authenticated users can create active bookings" ON public.active_bookings;
CREATE POLICY "Customers can create their own active bookings"
ON public.active_bookings FOR INSERT TO authenticated
WITH CHECK (customer_id = public.get_profile_id(auth.uid()));

-- 4) Replace public partner SELECT with sanitized view (no email/phone)
DROP POLICY IF EXISTS "Anyone can view approved partners" ON public.partners;

CREATE OR REPLACE VIEW public.public_partners
WITH (security_invoker = true) AS
SELECT
  id, business_name, business_type, city, state, pin_code,
  shop_address, latitude, longitude, number_of_vehicles,
  profile_photo, rating, total_bookings, status, created_at
FROM public.partners
WHERE status = 'approved'::partner_status;

-- Add a permissive SELECT policy so the view can read approved partners through RLS
CREATE POLICY "View can read approved partners"
ON public.partners FOR SELECT TO anon, authenticated
USING (status = 'approved'::partner_status AND current_setting('role', true) IS NOT NULL AND false);
-- Note: above policy is a no-op (false). The view bypasses by using SECURITY DEFINER helper.

-- Better approach: use a SECURITY DEFINER function-backed view
DROP POLICY IF EXISTS "View can read approved partners" ON public.partners;
DROP VIEW IF EXISTS public.public_partners;

CREATE OR REPLACE VIEW public.public_partners
WITH (security_invoker = false) AS
SELECT
  id, business_name, business_type, city, state, pin_code,
  shop_address, latitude, longitude, number_of_vehicles,
  profile_photo, rating, total_bookings, status, created_at
FROM public.partners
WHERE status = 'approved'::partner_status;

GRANT SELECT ON public.public_partners TO anon, authenticated;

-- 5) Remove booking/location tables from realtime publication to stop PII broadcast
ALTER PUBLICATION supabase_realtime DROP TABLE public.bookings;
ALTER PUBLICATION supabase_realtime DROP TABLE public.active_bookings;
ALTER PUBLICATION supabase_realtime DROP TABLE public.driver_locations;

-- 6) Restrict EXECUTE on SECURITY DEFINER helpers to authenticated only
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_partner_id(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_profile_id(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_partner_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_profile_id(uuid) TO authenticated;

-- 7) Admin storage policy for customer-documents bucket
DROP POLICY IF EXISTS "Admins can view all customer documents" ON storage.objects;
CREATE POLICY "Admins can view all customer documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'customer-documents' AND public.has_role(auth.uid(), 'admin'::app_role));
