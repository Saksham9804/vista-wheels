import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import LocationSelector, { type LocationData } from "@/components/maps/LocationSelector";
import {
  Check, MapPin, Calendar, CreditCard, FileCheck, ChevronRight,
  Shield, ShieldCheck, AlertTriangle, Loader2, ExternalLink, Info,
  Navigation, Truck, Banknote,
} from "lucide-react";
import { calculateRentalDays, calculatePriceBreakdown, formatDurationMessage } from "@/lib/pricing";

const steps = [
  { id: 1, name: "Location & Dates", icon: MapPin },
  { id: 2, name: "Review & Terms", icon: FileCheck },
  { id: 3, name: "Payment", icon: CreditCard },
  { id: 4, name: "Confirm", icon: Check },
];

interface NearbyPartner {
  id: string;
  business_name: string;
  shop_address: string | null;
  city: string;
  latitude: number;
  longitude: number;
  distance: number;
}

interface VehicleInfo {
  id: string;
  name: string;
  brand: string;
  vehicle_type: string;
  photos: string[] | null;
  price_per_day: number;
  security_deposit: number | null;
  partner_id: string;
}

interface ProfileData {
  full_name: string;
  email: string;
  phone: string | null;
  city: string | null;
  state: string | null;
  address_line1: string | null;
  driving_license_number: string | null;
  driving_license_expiry: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  documents_verified: boolean | null;
  verification_status: string | null;
  profile_completed: boolean | null;
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function Booking() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [vehicle, setVehicle] = useState<VehicleInfo | null>(null);
  const [loadingVehicle, setLoadingVehicle] = useState(true);
  const [nearbyPartners, setNearbyPartners] = useState<NearbyPartner[]>([]);
  const [loadingPartners, setLoadingPartners] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [doorstepAvailable, setDoorstepAvailable] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState<LocationData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    pickupLocation: "",
    pickupPartnerId: "",
    pickupType: "center",
    pickupDate: "",
    pickupTime: "10:00",
    returnDate: "",
    returnTime: "10:00",
    paymentMethod: "upi",
    agreedToTerms: false,
  });

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setUserLocation({ lat: 28.6139, lng: 77.209 })
      );
    } else {
      setUserLocation({ lat: 28.6139, lng: 77.209 });
    }
  }, []);

  // Fetch vehicle data
  useEffect(() => {
    if (!id) return;
    const fetchVehicle = async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, name, brand, vehicle_type, photos, price_per_day, security_deposit, partner_id")
        .eq("id", id)
        .maybeSingle();

      if (!error && data) {
        setVehicle(data as VehicleInfo);
      }
      setLoadingVehicle(false);
    };
    fetchVehicle();
  }, [id]);

  // Fetch nearest partners within 50km
  useEffect(() => {
    if (!userLocation) return;
    const fetchNearbyPartners = async () => {
      const { data: partners, error } = await supabase
        .from("partners")
        .select("id, business_name, shop_address, city, latitude, longitude, status")
        .eq("status", "approved");

      if (error || !partners) {
        setLoadingPartners(false);
        return;
      }

      const nearby = partners
        .filter((p) => p.latitude && p.longitude)
        .map((p) => ({
          id: p.id,
          business_name: p.business_name,
          shop_address: p.shop_address,
          city: p.city,
          latitude: p.latitude!,
          longitude: p.longitude!,
          distance: haversineDistance(userLocation.lat, userLocation.lng, p.latitude!, p.longitude!),
        }))
        .filter((p) => p.distance <= 50)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 3);

      setNearbyPartners(nearby);
      const hasClosePartner = nearby.some((p) => p.distance <= 15);
      setDoorstepAvailable(hasClosePartner);
      setLoadingPartners(false);
    };
    fetchNearbyPartners();
  }, [userLocation]);

  useEffect(() => {
    if (user) fetchProfileData();
  }, [user]);

  const fetchProfileData = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, email, phone, city, state, address_line1, driving_license_number, driving_license_expiry, emergency_contact_name, emergency_contact_phone, documents_verified, verification_status, profile_completed")
        .eq("user_id", user.id)
        .maybeSingle();
      setProfileData(data as ProfileData | null);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePartnerSelect = (partner: NearbyPartner) => {
    setFormData((prev) => ({
      ...prev,
      pickupLocation: `${partner.business_name} — ${partner.shop_address || partner.city}`,
      pickupPartnerId: partner.id,
      pickupType: "center",
    }));
  };

  const handleDoorstepSelect = () => {
    const closest = nearbyPartners[0];
    setFormData((prev) => ({
      ...prev,
      pickupLocation: "Doorstep Delivery",
      pickupPartnerId: closest?.id || "",
      pickupType: "doorstep",
    }));
  };

  const handleDeliveryLocationSelect = (location: LocationData | null) => {
    setDeliveryLocation(location);
    if (location) {
      setDeliveryAddress(location.formatted_address);
    }
  };

  const pricePerDay = vehicle?.price_per_day || 0;
  const securityDeposit = vehicle?.security_deposit || 0;

  const { hours, days: billedDays } = calculateRentalDays(
    formData.pickupDate, formData.pickupTime, formData.returnDate, formData.returnTime
  );
  const isDoorstep = formData.pickupType === "doorstep";
  const pricing = calculatePriceBreakdown(pricePerDay, billedDays, securityDeposit, isDoorstep);
  const durationMessage = formatDurationMessage(hours, billedDays);

  const isVerified = profileData?.documents_verified === true;
  const isProfileComplete = profileData?.profile_completed === true;
  const isLicenseExpired = profileData?.driving_license_expiry
    ? new Date(profileData.driving_license_expiry) < new Date()
    : false;
  const canBook = isVerified && isProfileComplete && !isLicenseExpired;

  const nextStep = () => { if (currentStep < steps.length) setCurrentStep(currentStep + 1); };
  const prevStep = () => { if (currentStep > 1) setCurrentStep(currentStep - 1); };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        if (formData.pickupType === "doorstep" && !deliveryAddress.trim()) return false;
        return formData.pickupLocation !== "" && formData.pickupDate !== "" && formData.returnDate !== "" && billedDays > 0;
      case 2: return formData.agreedToTerms;
      case 3: return true;
      default: return true;
    }
  };

  // Handle booking submission
  const handleBookingSubmit = async () => {
    if (!vehicle || !user || !profileData) return;
    setIsSubmitting(true);

    try {
      // Get profile id for customer_id
      const { data: profileRow } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      const pickupDateTime = `${formData.pickupDate}T${formData.pickupTime}:00`;
      const returnDateTime = `${formData.returnDate}T${formData.returnTime}:00`;

      const isCOD = formData.paymentMethod === "cod";

      const { data: booking, error } = await supabase
        .from("bookings")
        .insert({
          vehicle_id: vehicle.id,
          partner_id: formData.pickupPartnerId || vehicle.partner_id,
          customer_id: profileRow?.id || null,
          customer_name: profileData.full_name,
          customer_email: profileData.email,
          customer_phone: profileData.phone || null,
          pickup_time: pickupDateTime,
          return_time: returnDateTime,
          pickup_type: formData.pickupType,
          pickup_location: formData.pickupLocation,
          delivery_address: isDoorstep ? deliveryAddress : null,
          amount: pricing.totalPayable,
          base_rent: pricing.baseRent,
          platform_fee: pricing.platformFee,
          gateway_fee: isCOD ? 0 : pricing.gatewayFee,
          delivery_charge: pricing.deliveryCharge,
          security_deposit: securityDeposit,
          billed_days: billedDays,
          actual_hours: hours,
          duration: `${billedDays} day${billedDays > 1 ? "s" : ""}`,
          status: "confirmed",
          payment_status: isCOD ? "cod" : "pending",
          notes: isCOD ? "Cash on Delivery - payment to be collected at pickup/delivery" : null,
        })
        .select("id")
        .single();

      if (error) throw error;

      setBookingId(booking.id);
      toast({ title: "🎉 Booking confirmed!", description: isCOD ? "Pay cash at the time of pickup/delivery." : "Your booking has been placed successfully." });
      nextStep();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Booking failed", description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = loadingProfile || loadingVehicle;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20 lg:pt-24">
          <div className="container mx-auto px-4 py-20 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">Vehicle not found</h2>
            <p className="text-muted-foreground mb-6">The vehicle you're looking for doesn't exist or is no longer available.</p>
            <Button asChild><Link to="/vehicles">Browse Vehicles</Link></Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const vehicleImage = vehicle.photos?.[0] || "/placeholder.svg";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 lg:pt-24">
        <div className="container mx-auto px-4 lg:px-8 py-8">
          {/* Progress Steps */}
          <div className="mb-10">
            <div className="flex items-center justify-center gap-2 md:gap-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full transition-all ${
                    currentStep >= step.id ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                  }`}>
                    {currentStep > step.id ? <Check className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
                  </div>
                  <span className={`hidden md:block ml-2 font-medium ${currentStep >= step.id ? "text-foreground" : "text-muted-foreground"}`}>
                    {step.name}
                  </span>
                  {index < steps.length - 1 && (
                    <div className={`w-8 md:w-16 h-1 mx-2 rounded ${currentStep > step.id ? "bg-primary" : "bg-secondary"}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <motion.div key={currentStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-card rounded-2xl border border-border p-6 md:p-8">

                {/* Step 1: Location & Dates */}
                {currentStep === 1 && (
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">Select Pickup Location & Dates</h2>
                    <p className="text-muted-foreground mb-6">Choose a nearby partner center or opt for doorstep delivery</p>

                    {loadingPartners ? (
                      <div className="flex items-center justify-center py-10">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        <span className="ml-2 text-muted-foreground">Finding nearby partners...</span>
                      </div>
                    ) : (
                      <div className="space-y-4 mb-8">
                        {nearbyPartners.length === 0 && (
                          <div className="p-5 rounded-xl border-2 border-border bg-secondary/50 text-center">
                            <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-muted-foreground">No partner centers found within 50 km of your location.</p>
                          </div>
                        )}

                        {nearbyPartners.map((partner) => (
                          <button
                            key={partner.id}
                            onClick={() => handlePartnerSelect(partner)}
                            className={`w-full text-left p-5 rounded-xl border-2 transition-all ${
                              formData.pickupPartnerId === partner.id && formData.pickupType === "center"
                                ? "border-primary bg-accent"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            <div className="flex items-start gap-4">
                              <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center ${
                                formData.pickupPartnerId === partner.id && formData.pickupType === "center"
                                  ? "border-primary bg-primary"
                                  : "border-muted-foreground"
                              }`}>
                                {formData.pickupPartnerId === partner.id && formData.pickupType === "center" && (
                                  <Check className="w-3 h-3 text-primary-foreground" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <h3 className="font-semibold text-foreground">{partner.business_name}</h3>
                                  <span className="text-sm font-medium text-primary flex items-center gap-1">
                                    <Navigation className="w-3 h-3" />
                                    {partner.distance.toFixed(1)} km
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">{partner.shop_address || partner.city}</p>
                              </div>
                            </div>
                          </button>
                        ))}

                        {/* Doorstep Delivery Option */}
                        <button
                          onClick={doorstepAvailable ? handleDoorstepSelect : undefined}
                          disabled={!doorstepAvailable}
                          className={`w-full text-left p-5 rounded-xl border-2 transition-all ${
                            formData.pickupType === "doorstep"
                              ? "border-primary bg-accent"
                              : doorstepAvailable
                                ? "border-border hover:border-primary/50"
                                : "border-border opacity-50 cursor-not-allowed"
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center ${
                              formData.pickupType === "doorstep"
                                ? "border-primary bg-primary"
                                : "border-muted-foreground"
                            }`}>
                              {formData.pickupType === "doorstep" && (
                                <Check className="w-3 h-3 text-primary-foreground" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-foreground flex items-center gap-2">
                                  <Truck className="w-4 h-4" />
                                  Doorstep Delivery
                                </h3>
                                <span className="text-sm font-semibold text-primary">+ ₹150</span>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {doorstepAvailable
                                  ? "We'll deliver to your location within ~2 hours (available within 15 km)"
                                  : "Not available — no partner center within 15 km of your location"}
                              </p>
                            </div>
                          </div>
                        </button>

                        {/* Delivery address with Google Places autocomplete when doorstep selected */}
                        {formData.pickupType === "doorstep" && (
                          <div className="ml-9 space-y-2">
                            <label className="block text-sm font-medium text-foreground">Delivery Address</label>
                            <LocationSelector
                              value={deliveryAddress}
                              onChange={setDeliveryAddress}
                              onLocationSelect={handleDeliveryLocationSelect}
                              placeholder="Search for your delivery address..."
                            />
                            {deliveryLocation && (
                              <div className="flex items-center gap-2 text-xs text-primary bg-primary/10 rounded-lg px-3 py-2">
                                <MapPin className="w-3 h-3" />
                                <span>Location confirmed: {deliveryLocation.locality || deliveryLocation.formatted_address}</span>
                              </div>
                            )}
                            <p className="text-xs text-muted-foreground">Estimated delivery: ~2 hours from booking confirmation</p>
                          </div>
                        )}
                      </div>
                    )}

                    <h3 className="font-semibold text-foreground mb-4">Select Dates & Time</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Pickup Date</label>
                        <input type="date" value={formData.pickupDate} onChange={(e) => handleInputChange("pickupDate", e.target.value)} min={new Date().toISOString().split("T")[0]} className="w-full px-4 py-3 bg-secondary rounded-xl border border-border focus:border-primary focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Pickup Time</label>
                        <select value={formData.pickupTime} onChange={(e) => handleInputChange("pickupTime", e.target.value)} className="w-full px-4 py-3 bg-secondary rounded-xl border border-border focus:border-primary focus:outline-none">
                          {Array.from({ length: 24 }, (_, i) => (
                            <option key={i} value={`${i.toString().padStart(2, "0")}:00`}>{`${i.toString().padStart(2, "0")}:00`}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Return Date</label>
                        <input type="date" value={formData.returnDate} onChange={(e) => handleInputChange("returnDate", e.target.value)} min={formData.pickupDate || new Date().toISOString().split("T")[0]} className="w-full px-4 py-3 bg-secondary rounded-xl border border-border focus:border-primary focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Return Time</label>
                        <select value={formData.returnTime} onChange={(e) => handleInputChange("returnTime", e.target.value)} className="w-full px-4 py-3 bg-secondary rounded-xl border border-border focus:outline-none">
                          {Array.from({ length: 24 }, (_, i) => (
                            <option key={i} value={`${i.toString().padStart(2, "0")}:00`}>{`${i.toString().padStart(2, "0")}:00`}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {billedDays > 0 && (
                      <div className="mt-6 p-4 bg-accent rounded-xl space-y-1">
                        <p className="text-center">
                          <span className="text-muted-foreground">Rental: </span>
                          <span className="font-bold text-primary text-lg">{billedDays} day{billedDays > 1 ? "s" : ""}</span>
                        </p>
                        <p className="text-center text-sm text-muted-foreground flex items-center justify-center gap-1">
                          <Info className="w-3 h-3" />
                          {durationMessage}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 2: Review & Terms */}
                {currentStep === 2 && (
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">Review & Terms</h2>
                    <p className="text-muted-foreground mb-6">Your details from your profile will be used for this booking</p>

                    {!canBook && (
                      <div className="mb-6 p-4 bg-muted border border-border rounded-xl">
                        <div className="flex items-start gap-3">
                          <Info className="w-5 h-5 text-muted-foreground mt-0.5" />
                          <div>
                            <h3 className="font-semibold text-foreground">Profile verification pending</h3>
                            <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                              {!isProfileComplete && <li>• Your profile is incomplete. Please complete your profile for faster bookings.</li>}
                              {!isVerified && isProfileComplete && <li>• Your documents are under verification. Booking will proceed, but pickup requires verified documents.</li>}
                              {isLicenseExpired && <li>• Your driving license has expired. Please update it before pickup.</li>}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {profileData && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-foreground flex items-center gap-2">
                            {isVerified ? <ShieldCheck className="w-5 h-5 text-primary" /> : <Shield className="w-5 h-5 text-muted-foreground" />}
                            Your Details
                            {isVerified && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Verified</span>}
                          </h3>
                          <Link to="/profile" className="text-sm text-primary hover:underline flex items-center gap-1">
                            Edit Profile <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>

                        <div className="bg-secondary rounded-xl p-5 space-y-3 text-sm">
                          <div className="grid grid-cols-2 gap-4">
                            <div><span className="text-muted-foreground">Name</span><p className="font-medium text-foreground">{profileData.full_name}</p></div>
                            <div><span className="text-muted-foreground">Phone</span><p className="font-medium text-foreground">{profileData.phone || "Not provided"}</p></div>
                            <div><span className="text-muted-foreground">Email</span><p className="font-medium text-foreground">{profileData.email}</p></div>
                            <div><span className="text-muted-foreground">Address</span><p className="font-medium text-foreground">{profileData.address_line1 || "Not provided"}{profileData.city ? `, ${profileData.city}` : ""}</p></div>
                            <div><span className="text-muted-foreground">Driving License</span><p className="font-medium text-foreground">{profileData.driving_license_number || "Not provided"}</p></div>
                            <div>
                              <span className="text-muted-foreground">License Expiry</span>
                              <p className={`font-medium ${isLicenseExpired ? "text-destructive" : "text-foreground"}`}>
                                {profileData.driving_license_expiry || "Not provided"}
                                {isLicenseExpired && " (Expired)"}
                              </p>
                            </div>
                            <div><span className="text-muted-foreground">Emergency Contact</span><p className="font-medium text-foreground">{profileData.emergency_contact_name || "Not provided"}</p></div>
                            <div><span className="text-muted-foreground">Emergency Phone</span><p className="font-medium text-foreground">{profileData.emergency_contact_phone || "Not provided"}</p></div>
                          </div>
                        </div>

                        <div className="mt-6 space-y-4">
                          <h3 className="font-semibold text-foreground">Terms & Conditions</h3>
                          <div className="bg-secondary rounded-xl p-4 text-sm text-muted-foreground space-y-2 max-h-40 overflow-y-auto">
                            <p>• Valid driving license required at the time of pickup.</p>
                            <p>• Minimum rental charge: 1 full day (24 hours).</p>
                            <p>• Platform fee of 10% applies on base rent.</p>
                            <p>• Payment processing fee of 2.5% applies (waived for Cash on Delivery).</p>
                            <p>• Doorstep delivery available for ₹150 extra (within 15 km radius).</p>
                            <p>• Original ID proof required at pickup.</p>
                            <p>• No inter-state travel without prior approval.</p>
                            <p>• Cancellation is free up to 24 hours before pickup.</p>
                            {securityDeposit > 0 && (
                              <p>• Security deposit of ₹{securityDeposit.toLocaleString()} will be refunded within 24-48 hours after return.</p>
                            )}
                          </div>

                          <div className="flex items-start gap-3">
                            <input type="checkbox" id="terms" checked={formData.agreedToTerms} onChange={(e) => handleInputChange("agreedToTerms", e.target.checked)} className="mt-1" />
                            <label htmlFor="terms" className="text-sm text-muted-foreground">
                              I agree to the <Link to="/terms" className="text-primary hover:underline">Terms & Conditions</Link> and <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>. I confirm that my profile details are correct.
                            </label>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3: Payment */}
                {currentStep === 3 && (
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">Payment Method</h2>
                    <p className="text-muted-foreground mb-6">Select your preferred payment method</p>

                    <div className="space-y-4 mb-8">
                      {[
                        { id: "upi", name: "UPI (GPay, PhonePe, Paytm)", desc: "Pay instantly using any UPI app", icon: CreditCard },
                        { id: "card", name: "Credit/Debit Card", desc: "Visa, Mastercard, RuPay accepted", icon: CreditCard },
                        { id: "netbanking", name: "Net Banking", desc: "All major banks supported", icon: CreditCard },
                        { id: "cod", name: "Cash on Delivery", desc: "Pay cash at the time of pickup/delivery. No gateway fee.", icon: Banknote },
                      ].map((method) => (
                        <button
                          key={method.id}
                          onClick={() => handleInputChange("paymentMethod", method.id)}
                          className={`w-full text-left p-5 rounded-xl border-2 transition-all ${
                            formData.paymentMethod === method.id ? "border-primary bg-accent" : "border-border hover:border-primary/50"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              formData.paymentMethod === method.id ? "border-primary bg-primary" : "border-muted-foreground"
                            }`}>
                              {formData.paymentMethod === method.id && <Check className="w-3 h-3 text-primary-foreground" />}
                            </div>
                            <method.icon className="w-5 h-5 text-muted-foreground" />
                            <div>
                              <h3 className="font-semibold text-foreground">{method.name}</h3>
                              <p className="text-sm text-muted-foreground">{method.desc}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>

                    {formData.paymentMethod === "cod" && (
                      <div className="p-4 bg-accent rounded-xl flex items-start gap-3">
                        <Banknote className="w-5 h-5 text-primary mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium text-foreground">Cash on Delivery selected</p>
                          <p className="text-muted-foreground mt-1">
                            Payment gateway fee (2.5%) is waived. Please keep ₹{pricing.totalPayable.toLocaleString()} ready at the time of {isDoorstep ? "delivery" : "pickup"}.
                            {securityDeposit > 0 && ` Security deposit of ₹${securityDeposit.toLocaleString()} is also payable in cash.`}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 4: Confirmation */}
                {currentStep === 4 && (
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
                      <Check className="w-10 h-10 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">Booking Confirmed!</h2>
                    <p className="text-muted-foreground mb-6">
                      {formData.paymentMethod === "cod"
                        ? "Your booking is confirmed. Pay cash at the time of pickup/delivery."
                        : "Your booking has been successfully placed. Check your email for details."}
                    </p>

                    <div className="bg-secondary rounded-xl p-6 mb-6 max-w-md mx-auto">
                      <div className="text-6xl mb-4">🎉</div>
                      <p className="text-sm text-muted-foreground mb-2">Booking ID</p>
                      <p className="text-lg font-bold text-primary break-all">{bookingId || "—"}</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Button asChild><Link to="/">Back to Home</Link></Button>
                      <Button variant="outline" asChild><Link to="/vehicles">Book Another</Link></Button>
                    </div>
                  </div>
                )}

                {/* Navigation */}
                {currentStep < 4 && (
                  <div className="flex justify-between mt-8 pt-6 border-t border-border">
                    <Button variant="outline" onClick={prevStep} disabled={currentStep === 1}>Back</Button>
                    {currentStep === 3 ? (
                      <Button onClick={handleBookingSubmit} disabled={isSubmitting} className="flex items-center gap-2">
                        {isSubmitting ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                        ) : (
                          <>{formData.paymentMethod === "cod" ? "Confirm Booking" : "Pay & Confirm"} <ChevronRight className="w-4 h-4" /></>
                        )}
                      </Button>
                    ) : (
                      <Button onClick={nextStep} disabled={!isStepValid()} className="flex items-center gap-2">
                        Continue <ChevronRight className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </motion.div>
            </div>

            {/* Sidebar - Price Breakdown */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 bg-card rounded-2xl border border-border p-6">
                <h3 className="font-bold text-foreground mb-4">Booking Summary</h3>

                <div className="flex gap-4 pb-4 border-b border-border">
                  <img src={vehicleImage} alt={vehicle.name} className="w-24 h-20 rounded-xl object-cover" />
                  <div>
                    <h4 className="font-semibold text-foreground">{vehicle.name}</h4>
                    <p className="text-sm text-muted-foreground">₹{pricePerDay}/day</p>
                  </div>
                </div>

                {formData.pickupLocation && (
                  <div className="py-4 border-b border-border">
                    <p className="text-sm text-muted-foreground mb-1">Pickup</p>
                    <p className="font-medium text-foreground">{formData.pickupLocation}</p>
                    {isDoorstep && <p className="text-xs text-primary mt-1">+ ₹150 delivery charge</p>}
                    {isDoorstep && deliveryAddress && (
                      <p className="text-xs text-muted-foreground mt-1">📍 {deliveryAddress}</p>
                    )}
                  </div>
                )}

                {billedDays > 0 && (
                  <div className="py-4 border-b border-border">
                    <p className="text-sm text-muted-foreground mb-1">Duration</p>
                    <p className="font-medium text-foreground">{formData.pickupDate} to {formData.returnDate}</p>
                    <p className="text-sm text-primary">{billedDays} day{billedDays > 1 ? "s" : ""}</p>
                  </div>
                )}

                {billedDays > 0 && (
                  <div className="pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Vehicle Rent ({billedDays} day{billedDays > 1 ? "s" : ""} @ ₹{pricePerDay}/day)</span>
                      <span className="font-medium">₹{pricing.baseRent.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Platform Fee (10%)</span>
                      <span className="font-medium">₹{pricing.platformFee.toLocaleString()}</span>
                    </div>
                    {formData.paymentMethod !== "cod" && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Payment Processing (2.5%)</span>
                        <span className="font-medium">₹{pricing.gatewayFee.toLocaleString()}</span>
                      </div>
                    )}
                    {formData.paymentMethod === "cod" && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Payment Processing</span>
                        <span className="font-medium text-primary">Free (COD)</span>
                      </div>
                    )}
                    {isDoorstep && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Doorstep Delivery</span>
                        <span className="font-medium">₹{pricing.deliveryCharge}</span>
                      </div>
                    )}
                    <div className="h-px bg-border my-3" />
                    <div className="flex justify-between">
                      <span className="font-bold text-foreground">Total Payable</span>
                      <span className="font-bold text-primary text-xl">₹{pricing.totalPayable.toLocaleString()}</span>
                    </div>
                    {securityDeposit > 0 && (
                      <div className="flex justify-between text-sm mt-2">
                        <span className="text-muted-foreground">Security Deposit (refundable)</span>
                        <span className="font-medium">₹{securityDeposit.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-6 pt-6 border-t border-border">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Shield className="w-5 h-5 text-primary" />
                    <span>{formData.paymentMethod === "cod" ? "Cash on Delivery — pay at pickup" : "Secure payment powered by Razorpay"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
