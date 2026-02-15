import { useState } from "react";
import { motion } from "framer-motion";
import { Upload, X, Car, Bike, Loader2, ImagePlus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AddVehicleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const vehicleTypes = [
  { value: "car", label: "Car", icon: "🚗" },
  { value: "bike", label: "Bike", icon: "🏍️" },
  { value: "scooty", label: "Scooty", icon: "🛵" },
];

export function AddVehicleDialog({ open, onOpenChange, onSuccess }: AddVehicleDialogProps) {
  const { user, partner } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    vehicleType: "",
    registrationNumber: "",
    pricePerDay: "",
    securityDeposit: "",
    totalQuantity: "1",
    color: "",
    fuelType: "petrol",
    transmission: "manual",
    engineCapacity: "",
    seatCapacity: "2",
    mileage: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ variant: "destructive", title: "Icon must be under 2MB" });
      return;
    }
    setIconFile(file);
    setIconPreview(URL.createObjectURL(file));
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (galleryFiles.length + files.length > 10) {
      toast({ variant: "destructive", title: "Maximum 10 gallery images" });
      return;
    }
    const valid = files.filter((f) => {
      if (f.size > 5 * 1024 * 1024) {
        toast({ variant: "destructive", title: `${f.name} exceeds 5MB limit` });
        return false;
      }
      return true;
    });
    setGalleryFiles((prev) => [...prev, ...valid]);
    setGalleryPreviews((prev) => [...prev, ...valid.map((f) => URL.createObjectURL(f))]);
  };

  const removeGalleryImage = (index: number) => {
    setGalleryFiles((prev) => prev.filter((_, i) => i !== index));
    setGalleryPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = "Vehicle name is required";
    if (!formData.brand.trim()) errs.brand = "Brand is required";
    if (!formData.vehicleType) errs.vehicleType = "Select vehicle type";
    if (!formData.registrationNumber.trim()) errs.registrationNumber = "Registration number is required";
    const price = parseInt(formData.pricePerDay);
    if (!price || price < 200 || price > 10000) errs.pricePerDay = "Price must be ₹200-₹10,000";
    const deposit = parseInt(formData.securityDeposit);
    if (!deposit || deposit < 500) errs.securityDeposit = "Minimum deposit ₹500";
    // Gallery images are optional
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const uploadFile = async (file: File, path: string) => {
    const { data, error } = await supabase.storage.from("vehicle-photos").upload(path, file, { upsert: true });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from("vehicle-photos").getPublicUrl(data.path);
    return urlData.publicUrl;
  };

  const handleSubmit = async () => {
    if (!validate() || !user || !partner) return;
    setIsSubmitting(true);

    try {
      const photoUrls: string[] = [];
      const timestamp = Date.now();

      // Upload icon
      let iconUrl = "";
      if (iconFile) {
        iconUrl = await uploadFile(iconFile, `${user.id}/icon-${timestamp}.${iconFile.name.split(".").pop()}`);
        photoUrls.push(iconUrl);
      }

      // Upload gallery
      for (let i = 0; i < galleryFiles.length; i++) {
        const file = galleryFiles[i];
        const url = await uploadFile(file, `${user.id}/gallery-${timestamp}-${i}.${file.name.split(".").pop()}`);
        photoUrls.push(url);
      }

      const { error } = await supabase.from("vehicles").insert({
        partner_id: partner.id,
        name: formData.name,
        brand: formData.brand,
        vehicle_type: formData.vehicleType,
        registration_number: formData.registrationNumber,
        price_per_day: parseInt(formData.pricePerDay),
        security_deposit: parseInt(formData.securityDeposit),
        color: formData.color || null,
        fuel_type: formData.fuelType,
        transmission: formData.transmission,
        engine_capacity: formData.engineCapacity ? parseInt(formData.engineCapacity) : null,
        seat_capacity: parseInt(formData.seatCapacity),
        mileage: formData.mileage ? parseInt(formData.mileage) : null,
        photos: photoUrls,
        status: "approved",
        available: true,
      });

      if (error) throw error;

      toast({ title: "✅ Vehicle added successfully!", description: "Your vehicle is now live and available for booking." });
      onOpenChange(false);
      await onSuccess();
      // Reset form
      setFormData({ name: "", brand: "", vehicleType: "", registrationNumber: "", pricePerDay: "", securityDeposit: "", totalQuantity: "1", color: "", fuelType: "petrol", transmission: "manual", engineCapacity: "", seatCapacity: "2", mileage: "" });
      setIconFile(null);
      setIconPreview(null);
      setGalleryFiles([]);
      setGalleryPreviews([]);
    } catch (error: any) {
      toast({ variant: "destructive", title: "❌ Failed to add vehicle", description: "Please try again. " + error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Add New Vehicle</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-4">
          {/* Vehicle Type */}
          <div className="space-y-2">
            <Label>Vehicle Type *</Label>
            <div className="grid grid-cols-3 gap-3">
              {vehicleTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => handleChange("vehicleType", type.value)}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    formData.vehicleType === type.value ? "border-primary bg-accent" : "border-border hover:border-primary/50"
                  }`}
                >
                  <span className="text-2xl block mb-1">{type.icon}</span>
                  <span className="text-sm font-medium">{type.label}</span>
                </button>
              ))}
            </div>
            {errors.vehicleType && <p className="text-sm text-destructive">{errors.vehicleType}</p>}
          </div>

          {/* Name & Brand */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Vehicle Name *</Label>
              <Input placeholder="e.g. Honda Activa 6G" value={formData.name} onChange={(e) => handleChange("name", e.target.value)} className={errors.name ? "border-destructive" : ""} />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label>Brand *</Label>
              <Input placeholder="e.g. Honda" value={formData.brand} onChange={(e) => handleChange("brand", e.target.value)} className={errors.brand ? "border-destructive" : ""} />
              {errors.brand && <p className="text-sm text-destructive">{errors.brand}</p>}
            </div>
          </div>

          {/* Registration */}
          <div className="space-y-2">
            <Label>Registration Number *</Label>
            <Input placeholder="e.g. DL-01-AB-1234" value={formData.registrationNumber} onChange={(e) => handleChange("registrationNumber", e.target.value.toUpperCase())} className={errors.registrationNumber ? "border-destructive" : ""} />
            {errors.registrationNumber && <p className="text-sm text-destructive">{errors.registrationNumber}</p>}
          </div>

          {/* Specs Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Color</Label>
              <Input placeholder="e.g. Red" value={formData.color} onChange={(e) => handleChange("color", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Fuel Type</Label>
              <Select value={formData.fuelType} onValueChange={(v) => handleChange("fuelType", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="petrol">Petrol</SelectItem>
                  <SelectItem value="diesel">Diesel</SelectItem>
                  <SelectItem value="electric">Electric</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Transmission</Label>
              <Select value={formData.transmission} onValueChange={(v) => handleChange("transmission", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="automatic">Automatic</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Seats</Label>
              <Input type="number" min={1} value={formData.seatCapacity} onChange={(e) => handleChange("seatCapacity", e.target.value)} />
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Rent Per Day (₹) *</Label>
              <Input type="number" min={200} max={10000} placeholder="₹500" value={formData.pricePerDay} onChange={(e) => handleChange("pricePerDay", e.target.value)} className={errors.pricePerDay ? "border-destructive" : ""} />
              {errors.pricePerDay && <p className="text-sm text-destructive">{errors.pricePerDay}</p>}
            </div>
            <div className="space-y-2">
              <Label>Security Deposit (₹) *</Label>
              <Input type="number" min={500} placeholder="₹1000" value={formData.securityDeposit} onChange={(e) => handleChange("securityDeposit", e.target.value)} className={errors.securityDeposit ? "border-destructive" : ""} />
              {errors.securityDeposit && <p className="text-sm text-destructive">{errors.securityDeposit}</p>}
            </div>
          </div>

          {/* Icon Image */}
          <div className="space-y-2">
            <Label>Icon Image (max 2MB, 1:1 ratio)</Label>
            <div className="flex items-center gap-4">
              {iconPreview ? (
                <div className="relative w-20 h-20">
                  <img src={iconPreview} alt="Icon" className="w-20 h-20 rounded-xl object-cover border border-border" />
                  <button onClick={() => { setIconFile(null); setIconPreview(null); }} className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <label className="w-20 h-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                  <ImagePlus className="w-6 h-6 text-muted-foreground" />
                  <input type="file" accept="image/jpeg,image/png" onChange={handleIconUpload} className="hidden" />
                </label>
              )}
            </div>
          </div>

          {/* Gallery Images */}
          <div className="space-y-2">
            <Label>Gallery Images * (min 3, max 10, max 5MB each)</Label>
            <div className="flex flex-wrap gap-3">
              {galleryPreviews.map((preview, idx) => (
                <div key={idx} className="relative w-20 h-20">
                  <img src={preview} alt={`Gallery ${idx + 1}`} className="w-20 h-20 rounded-xl object-cover border border-border" />
                  <button onClick={() => removeGalleryImage(idx)} className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {galleryFiles.length < 10 && (
                <label className="w-20 h-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                  <Upload className="w-6 h-6 text-muted-foreground" />
                  <input type="file" accept="image/jpeg,image/png" multiple onChange={handleGalleryUpload} className="hidden" />
                </label>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{galleryFiles.length}/10 images uploaded</p>
            {errors.gallery && <p className="text-sm text-destructive">{errors.gallery}</p>}
          </div>

          {/* Submit */}
          <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full" size="lg">
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Adding Vehicle...
              </>
            ) : (
              "Add"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
