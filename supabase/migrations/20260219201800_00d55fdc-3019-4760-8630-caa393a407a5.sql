
-- Create driver_locations table for real-time GPS tracking
CREATE TABLE public.driver_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL,
  driver_id UUID NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(booking_id)
);

-- Enable RLS
ALTER TABLE public.driver_locations ENABLE ROW LEVEL SECURITY;

-- Partners can upsert their own location
CREATE POLICY "Partners can upsert their location"
  ON public.driver_locations FOR INSERT
  WITH CHECK (driver_id = get_partner_id(auth.uid()));

CREATE POLICY "Partners can update their location"
  ON public.driver_locations FOR UPDATE
  USING (driver_id = get_partner_id(auth.uid()));

-- Customers can view driver location for their booking
CREATE POLICY "Customers can view driver location for their booking"
  ON public.driver_locations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = driver_locations.booking_id
      AND b.customer_id = get_profile_id(auth.uid())
    )
  );

-- Partners can view their own location
CREATE POLICY "Partners can view their own location"
  ON public.driver_locations FOR SELECT
  USING (driver_id = get_partner_id(auth.uid()));

-- Admins can view all
CREATE POLICY "Admins can view all driver locations"
  ON public.driver_locations FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable Realtime for driver_locations
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_locations;

-- Create active_bookings table for ride status tracking
CREATE TABLE public.active_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL UNIQUE,
  customer_id UUID NOT NULL,
  driver_id UUID,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'driver_assigned', 'arriving', 'in_progress', 'completed', 'cancelled')),
  pickup_lat DOUBLE PRECISION,
  pickup_lng DOUBLE PRECISION,
  drop_lat DOUBLE PRECISION,
  drop_lng DOUBLE PRECISION,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.active_bookings ENABLE ROW LEVEL SECURITY;

-- Customers can view their own active bookings
CREATE POLICY "Customers can view their active bookings"
  ON public.active_bookings FOR SELECT
  USING (customer_id = get_profile_id(auth.uid()));

-- Partners can view bookings assigned to them
CREATE POLICY "Partners can view assigned bookings"
  ON public.active_bookings FOR SELECT
  USING (driver_id = get_partner_id(auth.uid()));

-- Partners can update bookings assigned to them
CREATE POLICY "Partners can update assigned bookings"
  ON public.active_bookings FOR UPDATE
  USING (driver_id = get_partner_id(auth.uid()));

-- Authenticated users can create active bookings
CREATE POLICY "Authenticated users can create active bookings"
  ON public.active_bookings FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Admins can do everything
CREATE POLICY "Admins can view all active bookings"
  ON public.active_bookings FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all active bookings"
  ON public.active_bookings FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable Realtime for active_bookings
ALTER PUBLICATION supabase_realtime ADD TABLE public.active_bookings;

-- Update trigger for updated_at
CREATE TRIGGER update_driver_locations_updated_at
  BEFORE UPDATE ON public.driver_locations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_active_bookings_updated_at
  BEFORE UPDATE ON public.active_bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
