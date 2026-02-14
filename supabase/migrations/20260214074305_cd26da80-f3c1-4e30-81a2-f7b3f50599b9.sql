
-- 1. Storage bucket for vehicle photos
INSERT INTO storage.buckets (id, name, public) VALUES ('vehicle-photos', 'vehicle-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for vehicle photos
CREATE POLICY "Anyone can view vehicle photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'vehicle-photos');

CREATE POLICY "Partners can upload vehicle photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'vehicle-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Partners can update their vehicle photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'vehicle-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Partners can delete their vehicle photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'vehicle-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 2. Admin RLS policies - allow admins to view all data for document management
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all profiles"
ON public.profiles FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all partners"
ON public.partners FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all partners"
ON public.partners FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all partner documents"
ON public.partner_documents FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update partner documents"
ON public.partner_documents FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all bookings"
ON public.bookings FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all vehicles"
ON public.vehicles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- 3. Enable realtime on bookings and vehicles tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicles;

-- 4. Add delivery_charge and pricing fields to bookings table
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS platform_fee numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS gateway_fee numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS delivery_charge numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS pickup_type text DEFAULT 'center',
ADD COLUMN IF NOT EXISTS delivery_address text,
ADD COLUMN IF NOT EXISTS billed_days integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS actual_hours numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS base_rent numeric DEFAULT 0;
