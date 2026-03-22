import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import PhoneOtpVerification from "@/components/auth/PhoneOtpVerification";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye, EyeOff, Mail, Lock, User, Phone, Loader2, Check, X,
  Upload, MapPin, Calendar, Shield, FileText, ChevronRight, ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const signupSteps = [
  { id: 1, name: "Basic Info", icon: User },
  { id: 2, name: "Phone Verification", icon: Phone },
  { id: 3, name: "Personal Details", icon: MapPin },
  { id: 4, name: "Driving License", icon: FileText },
  { id: 5, name: "Aadhar Card", icon: Shield },
  { id: 6, name: "Review", icon: Check },
];

const passwordRequirements = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "One number", test: (p: string) => /[0-9]/.test(p) },
  { label: "One special character", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "application/pdf"];

export default function CustomerSignup() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: "", email: "", phone: "", password: "", confirmPassword: "",
    dateOfBirth: "", gender: "",
    addressLine1: "", addressLine2: "", city: "", state: "", postalCode: "",
    emergencyContactName: "", emergencyContactPhone: "",
    drivingLicenseNumber: "", drivingLicenseExpiry: "",
    aadharNumber: "",
    terms: false,
  });
  const [files, setFiles] = useState<{
    licenseFront: File | null; licenseBack: File | null;
    aadharFront: File | null; aadharBack: File | null;
  }>({ licenseFront: null, licenseBack: null, aadharFront: null, aadharBack: null });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({});

  const { signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) return "Only JPG, PNG, or PDF files allowed";
    if (file.size > MAX_FILE_SIZE) return "File must be less than 5MB";
    return null;
  };

  const handleFileChange = (key: keyof typeof files, file: File | null) => {
    if (file) {
      const error = validateFile(file);
      if (error) {
        setFileErrors((prev) => ({ ...prev, [key]: error }));
        return;
      }
      setFileErrors((prev) => ({ ...prev, [key]: "" }));
    }
    setFiles((prev) => ({ ...prev, [key]: file }));
  };

  const getPasswordStrength = () => {
    const passed = passwordRequirements.filter((req) => req.test(formData.password)).length;
    if (passed <= 2) return { label: "Weak", color: "bg-destructive", pct: (passed / 5) * 100 };
    if (passed <= 4) return { label: "Medium", color: "bg-yellow-500", pct: (passed / 5) * 100 };
    return { label: "Strong", color: "bg-green-500", pct: 100 };
  };

  const validateStep = (s: number): boolean => {
    const errs: Record<string, string> = {};
    if (s === 1) {
      if (!formData.fullName || formData.fullName.length < 3) errs.fullName = "Name must be at least 3 characters";
      if (!formData.email || !formData.email.includes("@")) errs.email = "Valid email required";
      if (!formData.phone || !/^[0-9]{10}$/.test(formData.phone)) errs.phone = "Valid 10-digit phone required";
      if (formData.password.length < 8) errs.password = "Password must be at least 8 characters";
      if (formData.password !== formData.confirmPassword) errs.confirmPassword = "Passwords do not match";
    } else if (s === 2) {
      if (!phoneVerified) errs.phone = "Phone verification is required";
    } else if (s === 3) {
      if (!formData.dateOfBirth) errs.dateOfBirth = "Date of birth is required";
      if (!formData.gender) errs.gender = "Gender is required";
      if (!formData.addressLine1) errs.addressLine1 = "Address is required";
      if (!formData.city) errs.city = "City is required";
      if (!formData.state) errs.state = "State is required";
      if (!formData.postalCode || !/^[0-9]{6}$/.test(formData.postalCode)) errs.postalCode = "Valid 6-digit postal code required";
      if (!formData.emergencyContactName) errs.emergencyContactName = "Emergency contact name required";
      if (!formData.emergencyContactPhone || !/^[0-9]{10}$/.test(formData.emergencyContactPhone)) errs.emergencyContactPhone = "Valid 10-digit phone required";
    } else if (s === 4) {
      if (!formData.drivingLicenseNumber) errs.drivingLicenseNumber = "License number is required";
      if (!formData.drivingLicenseExpiry) errs.drivingLicenseExpiry = "Expiry date is required";
      if (!files.licenseFront) errs.licenseFront = "License front image is required";
      if (!files.licenseBack) errs.licenseBack = "License back image is required";
    } else if (s === 5) {
      if (!formData.aadharNumber || !/^[0-9]{12}$/.test(formData.aadharNumber)) errs.aadharNumber = "Valid 12-digit Aadhar number required";
      if (!files.aadharFront) errs.aadharFront = "Aadhar front image is required";
      if (!files.aadharBack) errs.aadharBack = "Aadhar back image is required";
    } else if (s === 6) {
      if (!formData.terms) errs.terms = "You must accept terms";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const nextStep = () => {
    if (step === 2) {
      // Phone verification step - don't allow skipping
      if (!phoneVerified) {
        setErrors({ phone: "Please verify your phone number first" });
        return;
      }
    }
    if (validateStep(step)) setStep((s) => Math.min(s + 1, 6));
  };
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const uploadFile = async (userId: string, file: File, folder: string): Promise<string> => {
    const ext = file.name.split(".").pop();
    const path = `${userId}/${folder}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("customer-documents").upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from("customer-documents").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async () => {
    if (!validateStep(5)) return;
    setIsLoading(true);
    try {
      const { error: signUpError } = await signUp(formData.email, formData.password, formData.fullName, formData.phone);
      if (signUpError) throw signUpError;

      // Get the user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found after signup");

      // Upload documents
      const [licenseFrontUrl, licenseBackUrl, aadharFrontUrl, aadharBackUrl] = await Promise.all([
        uploadFile(user.id, files.licenseFront!, "license-front"),
        uploadFile(user.id, files.licenseBack!, "license-back"),
        uploadFile(user.id, files.aadharFront!, "aadhar-front"),
        uploadFile(user.id, files.aadharBack!, "aadhar-back"),
      ]);

      // Update profile with all additional fields
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          date_of_birth: formData.dateOfBirth,
          gender: formData.gender,
          address_line1: formData.addressLine1,
          address_line2: formData.addressLine2 || null,
          city: formData.city,
          state: formData.state,
          postal_code: formData.postalCode,
          emergency_contact_name: formData.emergencyContactName,
          emergency_contact_phone: formData.emergencyContactPhone,
          driving_license_number: formData.drivingLicenseNumber,
          driving_license_expiry: formData.drivingLicenseExpiry,
          driving_license_front_url: licenseFrontUrl,
          driving_license_back_url: licenseBackUrl,
          aadhar_number: formData.aadharNumber,
          aadhar_front_url: aadharFrontUrl,
          aadhar_back_url: aadharBackUrl,
          verification_status: "pending",
          profile_completed: true,
        } as any)
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      toast({
        title: "Account created!",
        description: "Your documents are being verified. You'll be notified once approved.",
      });
      navigate("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message || "Something went wrong.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const strength = getPasswordStrength();
  const progress = (step / 6) * 100;

  const documentsUploaded = [files.licenseFront, files.licenseBack, files.aadharFront, files.aadharBack].filter(Boolean).length;

  const FileUploadBox = ({ label, fileKey, file }: { label: string; fileKey: keyof typeof files; file: File | null }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    return (
      <div>
        <Label className="mb-2 block">{label} <span className="text-destructive">*</span></Label>
        <div
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
            file ? "border-primary/50 bg-accent" : errors[fileKey] ? "border-destructive" : "border-border hover:border-primary/50"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            className="hidden"
            onChange={(e) => handleFileChange(fileKey, e.target.files?.[0] || null)}
          />
          {file ? (
            <div className="flex items-center gap-3 justify-center">
              <Check className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-foreground truncate max-w-[200px]">{file.name}</span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleFileChange(fileKey, null); }}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
              <p className="text-xs text-muted-foreground mt-1">JPG, PNG, PDF — max 5MB</p>
            </>
          )}
        </div>
        {(errors[fileKey] || fileErrors[fileKey]) && (
          <p className="text-sm text-destructive mt-1">{errors[fileKey] || fileErrors[fileKey]}</p>
        )}
      </div>
    );
  };

  const maskedAadhar = formData.aadharNumber
    ? "XXXX XXXX " + formData.aadharNumber.slice(-4)
    : "";

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg py-8"
        >
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-orange">
              <span className="text-primary-foreground font-bold text-xl">V</span>
            </div>
            <span className="text-2xl font-bold text-foreground">Vista</span>
          </Link>

          <h1 className="text-3xl font-bold text-foreground mb-2">Create your account</h1>
          <p className="text-muted-foreground mb-4">Complete all steps to start booking</p>

          {/* Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Step {step} of 5 — {signupSteps[step - 1].name}</span>
              <span className="font-medium text-foreground">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step indicators */}
          <div className="flex items-center justify-between mb-8">
            {signupSteps.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  step > s.id ? "bg-primary text-primary-foreground" :
                  step === s.id ? "bg-primary text-primary-foreground" :
                  "bg-secondary text-muted-foreground"
                }`}>
                  {step > s.id ? <Check className="w-4 h-4" /> : s.id}
                </div>
                {i < signupSteps.length - 1 && (
                  <div className={`w-6 sm:w-10 h-0.5 mx-1 ${step > s.id ? "bg-primary" : "bg-secondary"}`} />
                )}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              {/* Step 1: Basic Info */}
              {step === 1 && (
                <>
                  <div className="space-y-2">
                    <Label>Full Name <span className="text-destructive">*</span></Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input name="fullName" placeholder="Enter your full name" value={formData.fullName} onChange={handleChange} className={`pl-10 ${errors.fullName ? "border-destructive" : ""}`} />
                    </div>
                    {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Email Address <span className="text-destructive">*</span></Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input name="email" type="email" placeholder="Enter your email" value={formData.email} onChange={handleChange} className={`pl-10 ${errors.email ? "border-destructive" : ""}`} />
                    </div>
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number <span className="text-destructive">*</span></Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <div className="absolute left-10 top-1/2 -translate-y-1/2 text-muted-foreground border-r pr-2">+91</div>
                      <Input name="phone" type="tel" placeholder="10-digit number" value={formData.phone} onChange={handleChange} className={`pl-20 ${errors.phone ? "border-destructive" : ""}`} />
                    </div>
                    {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Password <span className="text-destructive">*</span></Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input name="password" type={showPassword ? "text" : "password"} placeholder="Create a strong password" value={formData.password} onChange={handleChange} className={`pl-10 pr-10 ${errors.password ? "border-destructive" : ""}`} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                    {formData.password && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div className={`h-full ${strength.color} transition-all`} style={{ width: `${strength.pct}%` }} />
                          </div>
                          <span className="text-sm font-medium">{strength.label}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-xs">
                          {passwordRequirements.map((req) => (
                            <div key={req.label} className="flex items-center gap-1">
                              {req.test(formData.password) ? <Check className="w-3 h-3 text-green-500" /> : <X className="w-3 h-3 text-muted-foreground" />}
                              <span className={req.test(formData.password) ? "text-green-500" : "text-muted-foreground"}>{req.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Confirm Password <span className="text-destructive">*</span></Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input name="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="Confirm your password" value={formData.confirmPassword} onChange={handleChange} className={`pl-10 pr-10 ${errors.confirmPassword ? "border-destructive" : ""}`} />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
                  </div>
                </>
              )}

              {/* Step 2: Personal Details */}
              {step === 2 && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Date of Birth <span className="text-destructive">*</span></Label>
                      <Input name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleChange} className={errors.dateOfBirth ? "border-destructive" : ""} />
                      {errors.dateOfBirth && <p className="text-sm text-destructive">{errors.dateOfBirth}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>Gender <span className="text-destructive">*</span></Label>
                      <select name="gender" value={formData.gender} onChange={handleChange} className={`w-full h-10 px-3 rounded-md border bg-background text-sm ${errors.gender ? "border-destructive" : "border-input"}`}>
                        <option value="">Select</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                      {errors.gender && <p className="text-sm text-destructive">{errors.gender}</p>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Address Line 1 <span className="text-destructive">*</span></Label>
                    <Input name="addressLine1" placeholder="Street address" value={formData.addressLine1} onChange={handleChange} className={errors.addressLine1 ? "border-destructive" : ""} />
                    {errors.addressLine1 && <p className="text-sm text-destructive">{errors.addressLine1}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Address Line 2</Label>
                    <Input name="addressLine2" placeholder="Apartment, suite, etc. (optional)" value={formData.addressLine2} onChange={handleChange} />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>City <span className="text-destructive">*</span></Label>
                      <Input name="city" placeholder="City" value={formData.city} onChange={handleChange} className={errors.city ? "border-destructive" : ""} />
                      {errors.city && <p className="text-sm text-destructive">{errors.city}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>State <span className="text-destructive">*</span></Label>
                      <Input name="state" placeholder="State" value={formData.state} onChange={handleChange} className={errors.state ? "border-destructive" : ""} />
                      {errors.state && <p className="text-sm text-destructive">{errors.state}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>Postal Code <span className="text-destructive">*</span></Label>
                      <Input name="postalCode" placeholder="6 digits" value={formData.postalCode} onChange={handleChange} className={errors.postalCode ? "border-destructive" : ""} />
                      {errors.postalCode && <p className="text-sm text-destructive">{errors.postalCode}</p>}
                    </div>
                  </div>
                  <div className="pt-2 border-t border-border">
                    <h3 className="font-semibold text-foreground mb-4">Emergency Contact</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Contact Name <span className="text-destructive">*</span></Label>
                        <Input name="emergencyContactName" placeholder="Full name" value={formData.emergencyContactName} onChange={handleChange} className={errors.emergencyContactName ? "border-destructive" : ""} />
                        {errors.emergencyContactName && <p className="text-sm text-destructive">{errors.emergencyContactName}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label>Contact Phone <span className="text-destructive">*</span></Label>
                        <Input name="emergencyContactPhone" placeholder="10-digit number" value={formData.emergencyContactPhone} onChange={handleChange} className={errors.emergencyContactPhone ? "border-destructive" : ""} />
                        {errors.emergencyContactPhone && <p className="text-sm text-destructive">{errors.emergencyContactPhone}</p>}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Step 3: Driving License */}
              {step === 3 && (
                <>
                  <div className="space-y-2">
                    <Label>Driving License Number <span className="text-destructive">*</span></Label>
                    <Input name="drivingLicenseNumber" placeholder="e.g. DL-1420110012345" value={formData.drivingLicenseNumber} onChange={handleChange} className={errors.drivingLicenseNumber ? "border-destructive" : ""} />
                    {errors.drivingLicenseNumber && <p className="text-sm text-destructive">{errors.drivingLicenseNumber}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>License Expiry Date <span className="text-destructive">*</span></Label>
                    <Input name="drivingLicenseExpiry" type="date" value={formData.drivingLicenseExpiry} onChange={handleChange} className={errors.drivingLicenseExpiry ? "border-destructive" : ""} />
                    {errors.drivingLicenseExpiry && <p className="text-sm text-destructive">{errors.drivingLicenseExpiry}</p>}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FileUploadBox label="License Front" fileKey="licenseFront" file={files.licenseFront} />
                    <FileUploadBox label="License Back" fileKey="licenseBack" file={files.licenseBack} />
                  </div>
                </>
              )}

              {/* Step 4: Aadhar Card */}
              {step === 4 && (
                <>
                  <div className="space-y-2">
                    <Label>Aadhar Card Number <span className="text-destructive">*</span></Label>
                    <Input name="aadharNumber" placeholder="12-digit Aadhar number" value={formData.aadharNumber} onChange={handleChange} className={errors.aadharNumber ? "border-destructive" : ""} maxLength={12} />
                    {errors.aadharNumber && <p className="text-sm text-destructive">{errors.aadharNumber}</p>}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FileUploadBox label="Aadhar Front" fileKey="aadharFront" file={files.aadharFront} />
                    <FileUploadBox label="Aadhar Back" fileKey="aadharBack" file={files.aadharBack} />
                  </div>
                </>
              )}

              {/* Step 5: Review */}
              {step === 5 && (
                <>
                  <div className="space-y-4">
                    {/* Checklist */}
                    <div className="bg-accent rounded-xl p-4 space-y-3">
                      <h3 className="font-semibold text-foreground">Signup Checklist</h3>
                      {[
                        { label: "Personal details", done: !!formData.fullName && !!formData.email && !!formData.phone },
                        { label: "Address & emergency contact", done: !!formData.addressLine1 && !!formData.emergencyContactName },
                        { label: "Driving license uploaded", done: !!files.licenseFront && !!files.licenseBack },
                        { label: "Aadhar card uploaded", done: !!files.aadharFront && !!files.aadharBack },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center gap-2">
                          {item.done ? <Check className="w-4 h-4 text-primary" /> : <X className="w-4 h-4 text-destructive" />}
                          <span className={`text-sm ${item.done ? "text-foreground" : "text-muted-foreground"}`}>{item.label}</span>
                        </div>
                      ))}
                      <p className="text-xs text-muted-foreground mt-2">{documentsUploaded}/4 documents uploaded</p>
                    </div>

                    {/* Summary */}
                    <div className="bg-card rounded-xl border border-border p-4 space-y-3 text-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">{formData.fullName}</span></div>
                        <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{formData.email}</span></div>
                        <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium">+91 {formData.phone}</span></div>
                        <div><span className="text-muted-foreground">DOB:</span> <span className="font-medium">{formData.dateOfBirth}</span></div>
                        <div><span className="text-muted-foreground">City:</span> <span className="font-medium">{formData.city}, {formData.state}</span></div>
                        <div><span className="text-muted-foreground">License:</span> <span className="font-medium">{formData.drivingLicenseNumber}</span></div>
                        <div><span className="text-muted-foreground">Aadhar:</span> <span className="font-medium">{maskedAadhar}</span></div>
                        <div><span className="text-muted-foreground">Emergency:</span> <span className="font-medium">{formData.emergencyContactName}</span></div>
                      </div>
                    </div>

                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="terms"
                        checked={formData.terms}
                        onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, terms: checked as boolean }))}
                        className="mt-1"
                      />
                      <Label htmlFor="terms" className="text-sm font-normal leading-relaxed cursor-pointer">
                        I agree to the <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link> and <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>. I consent to document verification.
                      </Label>
                    </div>
                    {errors.terms && <p className="text-sm text-destructive">{errors.terms}</p>}
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-border">
            <Button variant="outline" onClick={prevStep} disabled={step === 1}>
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            {step < 5 ? (
              <Button onClick={nextStep}>
                Continue <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating account...</> : "Complete Signup"}
              </Button>
            )}
          </div>

          <p className="mt-6 text-center text-muted-foreground">
            Already have an account? <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link>
          </p>
          <div className="mt-4 text-center">
            <Link to="/partner/signup" className="text-sm text-muted-foreground hover:text-primary">
              Want to rent out your vehicles? Become a partner →
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Right Side */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary/10 via-background to-primary/5 items-center justify-center p-12">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.2 }} className="max-w-lg">
          <h2 className="text-2xl font-bold text-foreground mb-8">Why join Vista?</h2>
          <div className="space-y-6">
            {[
              { title: "Book in 30 seconds", desc: "Quick and easy booking process" },
              { title: "Verified vehicles", desc: "All vehicles are inspected and verified" },
              { title: "24/7 support", desc: "Round-the-clock customer assistance" },
              { title: "Best prices", desc: "Competitive rates with no hidden fees" },
            ].map((item, index) => (
              <motion.div key={item.title} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Check className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
