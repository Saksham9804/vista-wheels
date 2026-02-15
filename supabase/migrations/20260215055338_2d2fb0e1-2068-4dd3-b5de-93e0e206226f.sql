
-- Drop all existing restrictive SELECT policies on vehicles
DROP POLICY IF EXISTS "Anyone can view approved vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Partners can view their own vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Admins can view all vehicles" ON public.vehicles;

-- Recreate as PERMISSIVE (default) so any ONE matching policy grants access
CREATE POLICY "Anyone can view approved vehicles"
  ON public.vehicles FOR SELECT
  USING (status = 'approved' AND available = true);

CREATE POLICY "Partners can view their own vehicles"
  ON public.vehicles FOR SELECT
  USING (partner_id = get_partner_id(auth.uid()));

CREATE POLICY "Admins can view all vehicles"
  ON public.vehicles FOR SELECT
  USING (has_role(auth.uid(), 'admin'));
