import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  Check,
  MapPin,
  Calendar,
  CreditCard,
  FileCheck,
  ChevronRight,
  Shield,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  ExternalLink,
} from "lucide-react";

const steps = [
  { id: 1, name: "Location & Dates", icon: MapPin },
  { id: 2, name: "Review & Terms", icon: FileCheck },
  { id: 3, name: "Payment", icon: CreditCard },
  { id: 4, name: "Confirm", icon: Check },
];

const pickupLocations = [
  { id: 1, name: "Vista Hub - Connaught Place", address: "Block A, Connaught Place, New Delhi", timing: "8 AM - 10 PM" },
  { id: 2, name: "Vista Hub - Nehru Place", address: "Nehru Place Metro Station, New Delhi", timing: "9 AM - 9 PM" },
  { id: 3, name: "Vista Hub - IGI Airport T3", address: "Terminal 3, IGI Airport, New Delhi", timing: "24 Hours" },
  { id: 4, name: "Doorstep Delivery", address: "We'll deliver to your location", timing: "Available for ₹200 extra" },
];

const vehicle = {
  id: 1,
  name: "Royal Enfield Classic 350",
  image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=400&q=80",
  price: 899,
  securityDeposit: 3000,
};

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

export default function Booking() {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [formData, setFormData] = useState({
    pickupLocation: "",
    pickupDate: "",
    pickupTime: "10:00",
    returnDate: "",
    returnTime: "10:00",
    paymentMethod: "upi",
    agreedToTerms: false,
  });

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
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

  const calculateDays = () => {
    if (formData.pickupDate && formData.returnDate) {
      const pickup = new Date(formData.pickupDate);
      const returnD = new Date(formData.returnDate);
      const days = Math.ceil((returnD.getTime() - pickup.getTime()) / (1000 * 60 * 60 * 24));
      return days > 0 ? days : 0;
    }
    return 0;
  };

  const days = calculateDays();
  const basePrice = days * vehicle.price;
  const tax = Math.round(basePrice * 0.18);
  const total = basePrice + tax + vehicle.securityDeposit;

  const isVerified = profileData?.documents_verified === true;
  const isProfileComplete = profileData?.profile_completed === true;
  const isLicenseExpired = profileData?.driving_license_expiry
    ? new Date(profileData.driving_license_expiry) < new Date()
    : false;

  const canBook = isVerified && isProfileComplete && !isLicenseExpired;

  const nextStep = () => {
    if (currentStep < steps.length) setCurrentStep(currentStep + 1);
  };
  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.pickupLocation !== "" && formData.pickupDate !== "" && formData.returnDate !== "" && days > 0;
      case 2:
        return formData.agreedToTerms && canBook;
      case 3:
        return true;
      default:
        return true;
    }
  };

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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
                    <p className="text-muted-foreground mb-6">Choose where and when you'd like your vehicle</p>

                    <div className="space-y-4 mb-8">
                      {pickupLocations.map((location) => (
                        <button
                          key={location.id}
                          onClick={() => handleInputChange("pickupLocation", location.name)}
                          className={`w-full text-left p-5 rounded-xl border-2 transition-all ${
                            formData.pickupLocation === location.name ? "border-primary bg-accent" : "border-border hover:border-primary/50"
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center ${
                              formData.pickupLocation === location.name ? "border-primary bg-primary" : "border-muted-foreground"
                            }`}>
                              {formData.pickupLocation === location.name && <Check className="w-3 h-3 text-primary-foreground" />}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-foreground">{location.name}</h3>
                              <p className="text-sm text-muted-foreground mt-1">{location.address}</p>
                              <p className="text-sm text-primary mt-1">{location.timing}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>

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
                        <select value={formData.returnTime} onChange={(e) => handleInputChange("returnTime", e.target.value)} className="w-full px-4 py-3 bg-secondary rounded-xl border border-border focus:border-primary focus:outline-none">
                          {Array.from({ length: 24 }, (_, i) => (
                            <option key={i} value={`${i.toString().padStart(2, "0")}:00`}>{`${i.toString().padStart(2, "0")}:00`}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {days > 0 && (
                      <div className="mt-6 p-4 bg-accent rounded-xl">
                        <p className="text-center">
                          <span className="text-muted-foreground">Total rental duration: </span>
                          <span className="font-bold text-primary text-lg">{days} day{days > 1 ? "s" : ""}</span>
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

                    {/* Verification Status */}
                    {!canBook && (
                      <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-xl">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
                          <div>
                            <h3 className="font-semibold text-destructive">Cannot proceed with booking</h3>
                            <ul className="text-sm text-destructive/80 mt-2 space-y-1">
                              {!isProfileComplete && <li>• Your profile is incomplete. Please complete signup.</li>}
                              {!isVerified && isProfileComplete && <li>• Your documents are under verification. You can book once approved.</li>}
                              {isLicenseExpired && <li>• Your driving license has expired. Please update it.</li>}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Profile Details auto-loaded */}
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
                            <div>
                              <span className="text-muted-foreground">Name</span>
                              <p className="font-medium text-foreground">{profileData.full_name}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Phone</span>
                              <p className="font-medium text-foreground">{profileData.phone || "Not provided"}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Email</span>
                              <p className="font-medium text-foreground">{profileData.email}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Address</span>
                              <p className="font-medium text-foreground">{profileData.address_line1 || "Not provided"}{profileData.city ? `, ${profileData.city}` : ""}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Driving License</span>
                              <p className="font-medium text-foreground">{profileData.driving_license_number || "Not provided"}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">License Expiry</span>
                              <p className={`font-medium ${isLicenseExpired ? "text-destructive" : "text-foreground"}`}>
                                {profileData.driving_license_expiry || "Not provided"}
                                {isLicenseExpired && " (Expired)"}
                              </p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Emergency Contact</span>
                              <p className="font-medium text-foreground">{profileData.emergency_contact_name || "Not provided"}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Emergency Phone</span>
                              <p className="font-medium text-foreground">{profileData.emergency_contact_phone || "Not provided"}</p>
                            </div>
                          </div>
                        </div>

                        {/* Terms */}
                        <div className="mt-6 space-y-4">
                          <h3 className="font-semibold text-foreground">Terms & Conditions</h3>
                          <div className="bg-secondary rounded-xl p-4 text-sm text-muted-foreground space-y-2 max-h-40 overflow-y-auto">
                            <p>• Valid driving license required at the time of pickup.</p>
                            <p>• Minimum age: 18 years.</p>
                            <p>• Original ID proof required at pickup.</p>
                            <p>• No inter-state travel without prior approval.</p>
                            <p>• The vehicle must be returned in the same condition.</p>
                            <p>• Any damage or traffic violations are the renter's responsibility.</p>
                            <p>• Cancellation is free up to 24 hours before pickup.</p>
                            <p>• Security deposit of ₹{vehicle.securityDeposit} will be refunded within 24-48 hours after returning the vehicle in good condition.</p>
                          </div>

                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              id="terms"
                              checked={formData.agreedToTerms}
                              onChange={(e) => handleInputChange("agreedToTerms", e.target.checked)}
                              className="mt-1"
                            />
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
                        { id: "upi", name: "UPI (GPay, PhonePe, Paytm)", desc: "Pay instantly using any UPI app" },
                        { id: "card", name: "Credit/Debit Card", desc: "Visa, Mastercard, RuPay accepted" },
                        { id: "netbanking", name: "Net Banking", desc: "All major banks supported" },
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
                            <div>
                              <h3 className="font-semibold text-foreground">{method.name}</h3>
                              <p className="text-sm text-muted-foreground">{method.desc}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 4: Confirmation */}
                {currentStep === 4 && (
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
                      <Check className="w-10 h-10 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">Booking Confirmed!</h2>
                    <p className="text-muted-foreground mb-6">Your booking has been successfully placed. Check your email for details.</p>

                    <div className="bg-secondary rounded-xl p-6 mb-6 max-w-md mx-auto">
                      <div className="text-6xl mb-4">🎉</div>
                      <p className="text-sm text-muted-foreground mb-2">Booking ID</p>
                      <p className="text-2xl font-bold text-primary">VISTA-{Math.random().toString(36).substring(2, 8).toUpperCase()}</p>
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
                    <Button onClick={nextStep} disabled={!isStepValid()} className="flex items-center gap-2">
                      {currentStep === 3 ? "Pay & Confirm" : "Continue"} <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 bg-card rounded-2xl border border-border p-6">
                <h3 className="font-bold text-foreground mb-4">Booking Summary</h3>

                <div className="flex gap-4 pb-4 border-b border-border">
                  <img src={vehicle.image} alt={vehicle.name} className="w-24 h-20 rounded-xl object-cover" />
                  <div>
                    <h4 className="font-semibold text-foreground">{vehicle.name}</h4>
                    <p className="text-sm text-muted-foreground">₹{vehicle.price}/day</p>
                  </div>
                </div>

                {formData.pickupLocation && (
                  <div className="py-4 border-b border-border">
                    <p className="text-sm text-muted-foreground mb-1">Pickup Location</p>
                    <p className="font-medium text-foreground">{formData.pickupLocation}</p>
                  </div>
                )}

                {days > 0 && (
                  <div className="py-4 border-b border-border">
                    <p className="text-sm text-muted-foreground mb-1">Duration</p>
                    <p className="font-medium text-foreground">{formData.pickupDate} to {formData.returnDate}</p>
                    <p className="text-sm text-primary">{days} day{days > 1 ? "s" : ""}</p>
                  </div>
                )}

                {days > 0 && (
                  <div className="pt-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-muted-foreground">₹{vehicle.price} x {days} days</span>
                      <span className="font-medium">₹{basePrice}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-muted-foreground">GST (18%)</span>
                      <span className="font-medium">₹{tax}</span>
                    </div>
                    <div className="flex justify-between mb-4">
                      <span className="text-muted-foreground">Security Deposit</span>
                      <span className="font-medium">₹{vehicle.securityDeposit}</span>
                    </div>
                    <div className="h-px bg-border my-3" />
                    <div className="flex justify-between">
                      <span className="font-bold text-foreground">Total</span>
                      <span className="font-bold text-primary text-xl">₹{total}</span>
                    </div>
                  </div>
                )}

                <div className="mt-6 pt-6 border-t border-border">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Shield className="w-5 h-5 text-primary" />
                    <span>Secure payment powered by Razorpay</span>
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
