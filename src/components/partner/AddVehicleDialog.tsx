import { useState } from "react";
import { Upload, X, Loader2, ImagePlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AddVehicleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const INITIAL_FORM = {
  name: "",
  brand: "",
  vehicleType: "",
  registrationNumber: "",
  color: "",
  fuelType: "petrol",
  transmission: "manual",
  seatCapacity: "2",
  pricePerDay: "",
};

export function AddVehicleDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddVehicleDialogProps) {
  const { user, partner } = useAuth();
  const { toast } = useToast();

  const [form, setForm] = useState({ ...INITIAL_FORM });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);

  const set = (key: string, value: string) => {
    setForm((p) => ({ ...p, [key]: value }));
    if (errors[key]) setErrors((p) => ({ ...p, [key]: "" }));
  };

  // ── Icon upload ──
  const onIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ variant: "destructive", title: "Icon must be under 2 MB" });
      return;
    }
    setIconFile(file);
    setIconPreview(URL.createObjectURL(file));
    if (errors.icon) setErrors((p) => ({ ...p, icon: "" }));
  };

  const removeIcon = () => {
    setIconFile(null);
    setIconPreview(null);
  };

  // ── Gallery upload ──
  const onGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(e.target.files || []);
    if (galleryFiles.length + incoming.length > 10) {
      toast({ variant: "destructive", title: "Maximum 10 gallery images" });
      return;
    }
    const valid = incoming.filter((f) => {
      if (f.size > 5 * 1024 * 1024) {
        toast({ variant: "destructive", title: `${f.name} exceeds 5 MB` });
        return false;
      }
      return true;
    });
    setGalleryFiles((p) => [...p, ...valid]);
    setGalleryPreviews((p) => [...p, ...valid.map((f) => URL.createObjectURL(f))]);
    if (errors.gallery) setErrors((p) => ({ ...p, gallery: "" }));
  };

  const removeGallery = (i: number) => {
    setGalleryFiles((p) => p.filter((_, idx) => idx !== i));
    setGalleryPreviews((p) => p.filter((_, idx) => idx !== i));
  };

  // ── Validation ──
  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Vehicle name is required";
    if (!form.brand.trim()) e.brand = "Brand is required";
    if (!form.vehicleType) e.vehicleType = "Select a vehicle type";
    if (!form.registrationNumber.trim()) e.registrationNumber = "Registration number is required";

    const price = Number(form.pricePerDay);
    if (!price || price < 200 || price > 10000) e.pricePerDay = "Price must be ₹200–₹10,000";

    if (!iconFile) e.icon = "Icon image is required (1:1 ratio)";

    if (galleryFiles.length < 3) e.gallery = "Upload at least 3 gallery images";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── File upload helper ──
  const uploadFile = async (file: File, path: string): Promise<string> => {
    const { data, error } = await supabase.storage
      .from("vehicle-photos")
      .upload(path, file, { upsert: true });
    if (error) throw new Error(`Upload failed: ${error.message}`);
    const { data: urlData } = supabase.storage
      .from("vehicle-photos")
      .getPublicUrl(data.path);
    return urlData.publicUrl;
  };

  // ── Submit ──
  const handleSubmit = async () => {
    if (!validate()) return;
    if (!user || !partner) {
      toast({ variant: "destructive", title: "Authentication error", description: "Please log in again." });
      return;
    }

    setIsSubmitting(true);
    try {
      const ts = Date.now();
      const photoUrls: string[] = [];

      // 1. Upload icon
      const iconUrl = await uploadFile(
        iconFile!,
        `${user.id}/icon-${ts}.${iconFile!.name.split(".").pop()}`
      );
      photoUrls.push(iconUrl);

      // 2. Upload gallery
      for (let i = 0; i < galleryFiles.length; i++) {
        const f = galleryFiles[i];
        const url = await uploadFile(
          f,
          `${user.id}/gallery-${ts}-${i}.${f.name.split(".").pop()}`
        );
        photoUrls.push(url);
      }

      // 3. Insert vehicle record
      const { error: dbError } = await supabase.from("vehicles").insert({
        partner_id: partner.id,
        name: form.name.trim(),
        brand: form.brand.trim(),
        vehicle_type: form.vehicleType,
        registration_number: form.registrationNumber.trim(),
        color: form.color.trim() || null,
        fuel_type: form.fuelType,
        transmission: form.transmission,
        seat_capacity: Number(form.seatCapacity) || 2,
        price_per_day: Number(form.pricePerDay),
        security_deposit: 0,
        photos: photoUrls,
        status: "approved",
        available: true,
      });

      if (dbError) throw new Error(dbError.message);

      // 4. Success
      toast({
        title: "✅ Vehicle added successfully!",
        description: "Your vehicle is now live and available for booking.",
      });

      onOpenChange(false);
      await onSuccess();

      // Reset everything
      setForm({ ...INITIAL_FORM });
      setIconFile(null);
      setIconPreview(null);
      setGalleryFiles([]);
      setGalleryPreviews([]);
      setErrors({});
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "❌ Failed to add vehicle. Please try again.",
        description: err.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render ──
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
              {[
                { value: "car", icon: "🚗", label: "Car" },
                { value: "bike", icon: "🏍️", label: "Bike" },
                { value: "scooty", icon: "🛵", label: "Scooty" },
              ].map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => set("vehicleType", t.value)}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    form.vehicleType === t.value
                      ? "border-primary bg-accent"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <span className="text-2xl block mb-1">{t.icon}</span>
                  <span className="text-sm font-medium">{t.label}</span>
                </button>
              ))}
            </div>
            {errors.vehicleType && (
              <p className="text-sm text-destructive">{errors.vehicleType}</p>
            )}
          </div>

          {/* Name & Brand */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Vehicle Name *</Label>
              <Input
                placeholder="e.g. Honda Activa 6G"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label>Brand *</Label>
              <Input
                placeholder="e.g. Honda"
                value={form.brand}
                onChange={(e) => set("brand", e.target.value)}
                className={errors.brand ? "border-destructive" : ""}
              />
              {errors.brand && <p className="text-sm text-destructive">{errors.brand}</p>}
            </div>
          </div>

          {/* Registration */}
          <div className="space-y-2">
            <Label>Registration Number *</Label>
            <Input
              placeholder="e.g. DL-01-AB-1234"
              value={form.registrationNumber}
              onChange={(e) => set("registrationNumber", e.target.value.toUpperCase())}
              className={errors.registrationNumber ? "border-destructive" : ""}
            />
            {errors.registrationNumber && (
              <p className="text-sm text-destructive">{errors.registrationNumber}</p>
            )}
          </div>

          {/* Specs: Color, Fuel, Transmission, Seats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Color</Label>
              <Input
                placeholder="e.g. Red"
                value={form.color}
                onChange={(e) => set("color", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Fuel Type</Label>
              <Select value={form.fuelType} onValueChange={(v) => set("fuelType", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="petrol">Petrol</SelectItem>
                  <SelectItem value="diesel">Diesel</SelectItem>
                  <SelectItem value="electric">Electric</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="cng">CNG</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Transmission</Label>
              <Select value={form.transmission} onValueChange={(v) => set("transmission", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="automatic">Automatic</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Seats</Label>
              <Input
                type="number"
                min={1}
                max={50}
                value={form.seatCapacity}
                onChange={(e) => set("seatCapacity", e.target.value)}
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-2">
            <Label>Rent Per Day ₹ *</Label>
            <Input
              type="number"
              min={200}
              max={10000}
              placeholder="₹500"
              value={form.pricePerDay}
              onChange={(e) => set("pricePerDay", e.target.value)}
              className={errors.pricePerDay ? "border-destructive" : ""}
            />
            {errors.pricePerDay && (
              <p className="text-sm text-destructive">{errors.pricePerDay}</p>
            )}
          </div>

          {/* Icon Image */}
          <div className="space-y-2">
            <Label>Icon Image * (max 2 MB, 1:1 ratio)</Label>
            <div className="flex items-center gap-4">
              {iconPreview ? (
                <div className="relative w-20 h-20">
                  <img
                    src={iconPreview}
                    alt="Icon"
                    className="w-20 h-20 rounded-xl object-cover border border-border"
                  />
                  <button
                    type="button"
                    onClick={removeIcon}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <label className="w-20 h-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                  <ImagePlus className="w-6 h-6 text-muted-foreground" />
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={onIconChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            {errors.icon && <p className="text-sm text-destructive">{errors.icon}</p>}
          </div>

          {/* Gallery Images */}
          <div className="space-y-2">
            <Label>Gallery Images * (min 3, max 10, max 5 MB each)</Label>
            <div className="flex flex-wrap gap-3">
              {galleryPreviews.map((src, i) => (
                <div key={i} className="relative w-20 h-20">
                  <img
                    src={src}
                    alt={`Gallery ${i + 1}`}
                    className="w-20 h-20 rounded-xl object-cover border border-border"
                  />
                  <button
                    type="button"
                    onClick={() => removeGallery(i)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {galleryFiles.length < 10 && (
                <label className="w-20 h-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                  <Upload className="w-6 h-6 text-muted-foreground" />
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={onGalleryChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {galleryFiles.length}/10 images uploaded
            </p>
            {errors.gallery && (
              <p className="text-sm text-destructive">{errors.gallery}</p>
            )}
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Adding...
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
