import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import {
  Check,
  MapPin,
  Calendar,
  User,
  CreditCard,
  FileCheck,
  ChevronRight,
  Upload,
  Phone,
  Mail,
  Shield,
} from "lucide-react";

const steps = [
  { id: 1, name: "Location", icon: MapPin },
  { id: 2, name: "Dates", icon: Calendar },
  { id: 3, name: "Details", icon: User },
  { id: 4, name: "Payment", icon: CreditCard },
  { id: 5, name: "Confirm", icon: FileCheck },
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

export default function Booking() {
  const { id } = useParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    pickupLocation: "",
    pickupDate: "",
    pickupTime: "10:00",
    returnDate: "",
    returnTime: "10:00",
    fullName: "",
    phone: "",
    email: "",
    idType: "aadhar",
    idNumber: "",
    idDocument: null as File | null,
    profilePhoto: null as File | null,
    paymentMethod: "upi",
    agreedToTerms: false,
  });

  const handleInputChange = (field: string, value: string | boolean | File | null) => {
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

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.pickupLocation !== "";
      case 2:
        return formData.pickupDate !== "" && formData.returnDate !== "" && days > 0;
      case 3:
        return (
          formData.fullName !== "" &&
          formData.phone.length >= 10 &&
          formData.email.includes("@") &&
          formData.idNumber !== ""
        );
      case 4:
        return formData.agreedToTerms;
      default:
        return true;
    }
  };

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
                  <div
                    className={`flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full transition-all ${
                      currentStep >= step.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {currentStep > step.id ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <step.icon className="w-5 h-5" />
                    )}
                  </div>
                  <span
                    className={`hidden md:block ml-2 font-medium ${
                      currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {step.name}
                  </span>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-8 md:w-16 h-1 mx-2 rounded ${
                        currentStep > step.id ? "bg-primary" : "bg-secondary"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-card rounded-2xl border border-border p-6 md:p-8"
              >
                {/* Step 1: Location */}
                {currentStep === 1 && (
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">Select Pickup Location</h2>
                    <p className="text-muted-foreground mb-6">
                      Choose where you'd like to pick up your vehicle
                    </p>

                    <div className="space-y-4">
                      {pickupLocations.map((location) => (
                        <button
                          key={location.id}
                          onClick={() => handleInputChange("pickupLocation", location.name)}
                          className={`w-full text-left p-5 rounded-xl border-2 transition-all ${
                            formData.pickupLocation === location.name
                              ? "border-primary bg-accent"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <div
                              className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center ${
                                formData.pickupLocation === location.name
                                  ? "border-primary bg-primary"
                                  : "border-muted-foreground"
                              }`}
                            >
                              {formData.pickupLocation === location.name && (
                                <Check className="w-3 h-3 text-primary-foreground" />
                              )}
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
                  </div>
                )}

                {/* Step 2: Dates */}
                {currentStep === 2 && (
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">Select Dates & Time</h2>
                    <p className="text-muted-foreground mb-6">
                      Choose your pickup and return schedule
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Pickup Date
                        </label>
                        <input
                          type="date"
                          value={formData.pickupDate}
                          onChange={(e) => handleInputChange("pickupDate", e.target.value)}
                          min={new Date().toISOString().split("T")[0]}
                          className="w-full px-4 py-3 bg-secondary rounded-xl border border-border focus:border-primary focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Pickup Time
                        </label>
                        <select
                          value={formData.pickupTime}
                          onChange={(e) => handleInputChange("pickupTime", e.target.value)}
                          className="w-full px-4 py-3 bg-secondary rounded-xl border border-border focus:border-primary focus:outline-none"
                        >
                          {Array.from({ length: 24 }, (_, i) => (
                            <option key={i} value={`${i.toString().padStart(2, "0")}:00`}>
                              {`${i.toString().padStart(2, "0")}:00`}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Return Date
                        </label>
                        <input
                          type="date"
                          value={formData.returnDate}
                          onChange={(e) => handleInputChange("returnDate", e.target.value)}
                          min={formData.pickupDate || new Date().toISOString().split("T")[0]}
                          className="w-full px-4 py-3 bg-secondary rounded-xl border border-border focus:border-primary focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Return Time
                        </label>
                        <select
                          value={formData.returnTime}
                          onChange={(e) => handleInputChange("returnTime", e.target.value)}
                          className="w-full px-4 py-3 bg-secondary rounded-xl border border-border focus:border-primary focus:outline-none"
                        >
                          {Array.from({ length: 24 }, (_, i) => (
                            <option key={i} value={`${i.toString().padStart(2, "0")}:00`}>
                              {`${i.toString().padStart(2, "0")}:00`}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {days > 0 && (
                      <div className="mt-6 p-4 bg-accent rounded-xl">
                        <p className="text-center">
                          <span className="text-muted-foreground">Total rental duration: </span>
                          <span className="font-bold text-primary text-lg">
                            {days} day{days > 1 ? "s" : ""}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3: Customer Details */}
                {currentStep === 3 && (
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">Your Details</h2>
                    <p className="text-muted-foreground mb-6">
                      Enter your personal information and upload required documents
                    </p>

                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Full Name (as per ID)
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <input
                            type="text"
                            value={formData.fullName}
                            onChange={(e) => handleInputChange("fullName", e.target.value)}
                            placeholder="Enter your full name"
                            className="w-full pl-10 pr-4 py-3 bg-secondary rounded-xl border border-border focus:border-primary focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Phone Number
                          </label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <input
                              type="tel"
                              value={formData.phone}
                              onChange={(e) => handleInputChange("phone", e.target.value)}
                              placeholder="+91 XXXXX XXXXX"
                              className="w-full pl-10 pr-4 py-3 bg-secondary rounded-xl border border-border focus:border-primary focus:outline-none"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Email Address
                          </label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <input
                              type="email"
                              value={formData.email}
                              onChange={(e) => handleInputChange("email", e.target.value)}
                              placeholder="your@email.com"
                              className="w-full pl-10 pr-4 py-3 bg-secondary rounded-xl border border-border focus:border-primary focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            ID Type
                          </label>
                          <select
                            value={formData.idType}
                            onChange={(e) => handleInputChange("idType", e.target.value)}
                            className="w-full px-4 py-3 bg-secondary rounded-xl border border-border focus:border-primary focus:outline-none"
                          >
                            <option value="aadhar">Aadhar Card</option>
                            <option value="driving">Driving License</option>
                            <option value="passport">Passport</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            ID Number
                          </label>
                          <input
                            type="text"
                            value={formData.idNumber}
                            onChange={(e) => handleInputChange("idNumber", e.target.value)}
                            placeholder="Enter ID number"
                            className="w-full px-4 py-3 bg-secondary rounded-xl border border-border focus:border-primary focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Upload ID Document
                          </label>
                          <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                            <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">
                              Click to upload or drag and drop
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              PNG, JPG up to 5MB
                            </p>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Upload Profile Photo
                          </label>
                          <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                            <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">
                              Click to upload or drag and drop
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Clear face photo required
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Payment */}
                {currentStep === 4 && (
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">Payment Method</h2>
                    <p className="text-muted-foreground mb-6">
                      Select your preferred payment method
                    </p>

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
                            formData.paymentMethod === method.id
                              ? "border-primary bg-accent"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                formData.paymentMethod === method.id
                                  ? "border-primary bg-primary"
                                  : "border-muted-foreground"
                              }`}
                            >
                              {formData.paymentMethod === method.id && (
                                <Check className="w-3 h-3 text-primary-foreground" />
                              )}
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground">{method.name}</h3>
                              <p className="text-sm text-muted-foreground">{method.desc}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-secondary rounded-xl">
                      <input
                        type="checkbox"
                        id="terms"
                        checked={formData.agreedToTerms}
                        onChange={(e) => handleInputChange("agreedToTerms", e.target.checked)}
                        className="mt-1"
                      />
                      <label htmlFor="terms" className="text-sm text-muted-foreground">
                        I agree to the{" "}
                        <Link to="/terms" className="text-primary hover:underline">
                          Terms & Conditions
                        </Link>{" "}
                        and{" "}
                        <Link to="/privacy" className="text-primary hover:underline">
                          Privacy Policy
                        </Link>
                        . I understand that the security deposit of ₹{vehicle.securityDeposit} will be
                        refunded within 24-48 hours after returning the vehicle in good condition.
                      </label>
                    </div>
                  </div>
                )}

                {/* Step 5: Confirmation */}
                {currentStep === 5 && (
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-6">
                      <Check className="w-10 h-10 text-success" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">Booking Confirmed!</h2>
                    <p className="text-muted-foreground mb-6">
                      Your booking has been successfully placed. Check your email for details.
                    </p>

                    <div className="bg-secondary rounded-xl p-6 mb-6 max-w-md mx-auto">
                      <div className="text-6xl mb-4">🎉</div>
                      <p className="text-sm text-muted-foreground mb-2">Booking ID</p>
                      <p className="text-2xl font-bold text-primary">VISTA-{Math.random().toString(36).substring(2, 8).toUpperCase()}</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Button asChild>
                        <Link to="/">Back to Home</Link>
                      </Button>
                      <Button variant="outline" asChild>
                        <Link to="/vehicles">Book Another</Link>
                      </Button>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                {currentStep < 5 && (
                  <div className="flex justify-between mt-8 pt-6 border-t border-border">
                    <Button
                      variant="outline"
                      onClick={prevStep}
                      disabled={currentStep === 1}
                    >
                      Back
                    </Button>
                    <Button
                      onClick={nextStep}
                      disabled={!isStepValid()}
                      className="flex items-center gap-2"
                    >
                      {currentStep === 4 ? "Pay & Confirm" : "Continue"}
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 bg-card rounded-2xl border border-border p-6">
                <h3 className="font-bold text-foreground mb-4">Booking Summary</h3>

                {/* Vehicle */}
                <div className="flex gap-4 pb-4 border-b border-border">
                  <img
                    src={vehicle.image}
                    alt={vehicle.name}
                    className="w-24 h-20 rounded-xl object-cover"
                  />
                  <div>
                    <h4 className="font-semibold text-foreground">{vehicle.name}</h4>
                    <p className="text-sm text-muted-foreground">₹{vehicle.price}/day</p>
                  </div>
                </div>

                {/* Details */}
                {formData.pickupLocation && (
                  <div className="py-4 border-b border-border">
                    <p className="text-sm text-muted-foreground mb-1">Pickup Location</p>
                    <p className="font-medium text-foreground">{formData.pickupLocation}</p>
                  </div>
                )}

                {days > 0 && (
                  <div className="py-4 border-b border-border">
                    <p className="text-sm text-muted-foreground mb-1">Duration</p>
                    <p className="font-medium text-foreground">
                      {formData.pickupDate} to {formData.returnDate}
                    </p>
                    <p className="text-sm text-primary">{days} day{days > 1 ? "s" : ""}</p>
                  </div>
                )}

                {/* Price Breakdown */}
                {days > 0 && (
                  <div className="pt-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-muted-foreground">
                        ₹{vehicle.price} x {days} days
                      </span>
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

                {/* Trust Badge */}
                <div className="mt-6 pt-6 border-t border-border">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Shield className="w-5 h-5 text-success" />
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
