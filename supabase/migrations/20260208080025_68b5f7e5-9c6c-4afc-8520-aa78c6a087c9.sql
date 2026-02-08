-- Create app_role enum for role-based access control
CREATE TYPE public.app_role AS ENUM ('customer', 'partner', 'admin');

-- Create partner_status enum
CREATE TYPE public.partner_status AS ENUM ('pending_verification', 'approved', 'rejected', 'suspended');

-- Create business_type enum
CREATE TYPE public.business_type AS ENUM ('individual', 'small_business', 'rental_company', 'franchise');

-- Create user_roles table for secure role management (prevents privilege escalation)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create profiles table for customer data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  phone_verified BOOLEAN DEFAULT FALSE,
  profile_photo TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Create partners table for partner/vehicle owner data
CREATE TABLE public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  business_name TEXT NOT NULL,
  business_type public.business_type NOT NULL DEFAULT 'individual',
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  phone_verified BOOLEAN DEFAULT FALSE,
  city TEXT NOT NULL,
  number_of_vehicles INTEGER DEFAULT 0,
  profile_photo TEXT,
  status public.partner_status DEFAULT 'pending_verification',
  rejection_reason TEXT,
  rating DECIMAL(3,2) DEFAULT 0.00,
  total_bookings INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID
);

-- Create partner_documents table
CREATE TABLE public.partner_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE NOT NULL,
  document_type TEXT NOT NULL,
  document_url TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID
);

-- Create vehicles table
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT,
  year INTEGER,
  registration_number TEXT NOT NULL,
  vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('bike', 'scooty', 'car')),
  fuel_type TEXT DEFAULT 'petrol',
  color TEXT,
  engine_capacity INTEGER,
  mileage INTEGER,
  seat_capacity INTEGER DEFAULT 2,
  transmission TEXT DEFAULT 'manual',
  features TEXT[] DEFAULT '{}',
  price_per_day DECIMAL(10,2) NOT NULL,
  price_per_week DECIMAL(10,2),
  price_per_month DECIMAL(10,2),
  security_deposit DECIMAL(10,2) DEFAULT 0,
  available BOOLEAN DEFAULT TRUE,
  min_rental_duration TEXT DEFAULT '1 day',
  max_rental_duration TEXT DEFAULT '30 days',
  pickup_location TEXT,
  photos TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'pending_approval' CHECK (status IN ('pending_approval', 'approved', 'rejected', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL NOT NULL,
  partner_id UUID REFERENCES public.partners(id) ON DELETE SET NULL NOT NULL,
  pickup_time TIMESTAMP WITH TIME ZONE NOT NULL,
  return_time TIMESTAMP WITH TIME ZONE NOT NULL,
  duration TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled', 'overdue')),
  amount DECIMAL(10,2) NOT NULL,
  security_deposit DECIMAL(10,2) DEFAULT 0,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')),
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  pickup_location TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking (prevents recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Get user's partner ID
CREATE OR REPLACE FUNCTION public.get_partner_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.partners WHERE user_id = _user_id LIMIT 1
$$;

-- Get user's profile ID
CREATE OR REPLACE FUNCTION public.get_profile_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own role on signup"
  ON public.user_roles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for partners
CREATE POLICY "Partners can view their own data"
  ON public.partners FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create partner account"
  ON public.partners FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Partners can update their own data"
  ON public.partners FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for partner_documents
CREATE POLICY "Partners can view their own documents"
  ON public.partner_documents FOR SELECT
  USING (partner_id = public.get_partner_id(auth.uid()));

CREATE POLICY "Partners can upload their documents"
  ON public.partner_documents FOR INSERT
  WITH CHECK (partner_id = public.get_partner_id(auth.uid()));

-- RLS Policies for vehicles
CREATE POLICY "Anyone can view approved vehicles"
  ON public.vehicles FOR SELECT
  USING (status = 'approved' AND available = TRUE);

CREATE POLICY "Partners can view their own vehicles"
  ON public.vehicles FOR SELECT
  USING (partner_id = public.get_partner_id(auth.uid()));

CREATE POLICY "Partners can add vehicles"
  ON public.vehicles FOR INSERT
  WITH CHECK (partner_id = public.get_partner_id(auth.uid()));

CREATE POLICY "Partners can update their vehicles"
  ON public.vehicles FOR UPDATE
  USING (partner_id = public.get_partner_id(auth.uid()));

CREATE POLICY "Partners can delete their vehicles"
  ON public.vehicles FOR DELETE
  USING (partner_id = public.get_partner_id(auth.uid()));

-- RLS Policies for bookings
CREATE POLICY "Customers can view their bookings"
  ON public.bookings FOR SELECT
  USING (customer_id = public.get_profile_id(auth.uid()));

CREATE POLICY "Partners can view their bookings"
  ON public.bookings FOR SELECT
  USING (partner_id = public.get_partner_id(auth.uid()));

CREATE POLICY "Authenticated users can create bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Partners can update their bookings"
  ON public.bookings FOR UPDATE
  USING (partner_id = public.get_partner_id(auth.uid()));

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply update triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_partners_updated_at
  BEFORE UPDATE ON public.partners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();