import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import {
  Star,
  Fuel,
  Gauge,
  Shield,
  HardHat,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Info,
  Loader2,
} from "lucide-react";
import { PolicySections } from "@/components/vehicles/PolicySection";

interface VehicleData {
  id: string;
  name: string;
  brand: string;
  vehicle_type: string;
  photos: string[] | null;
  price_per_day: number;
  security_deposit: number | null;
  fuel_type: string | null;
  engine_capacity: number | null;
  mileage: number | null;
  transmission: string | null;
  color: string | null;
  seat_capacity: number | null;
  features: string[] | null;
  partner_id: string;
}

interface RelatedVehicle {
  id: string;
  name: string;
  vehicle_type: string;
  photos: string[] | null;
  price_per_day: number;
}

const staticFeatures = [
  { name: "Helmet Included", icon: HardHat },
  { name: "Fully Insured", icon: Shield },
  { name: "24/7 Support", icon: Clock },
];

const included = ["1 Full Face Helmet", "First Aid Kit", "Toolkit", "Vehicle Documents"];
const notIncluded = ["Fuel", "Toll Charges", "Traffic Fines"];
const terms = [
  "Valid driving license required",
  "Minimum age: 18 years",
  "Original ID proof required at pickup",
  "No inter-state travel without prior approval",
];

export default function VehicleDetail() {
  const { id } = useParams();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [vehicle, setVehicle] = useState<VehicleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedVehicles, setRelatedVehicles] = useState<RelatedVehicle[]>([]);

  useEffect(() => {
    if (!id) return;
    const fetchVehicle = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, name, brand, vehicle_type, photos, price_per_day, security_deposit, fuel_type, engine_capacity, mileage, transmission, color, seat_capacity, features, partner_id")
        .eq("id", id)
        .maybeSingle();

      if (!error && data) {
        setVehicle(data as VehicleData);
        // Fetch related vehicles of same type, excluding current
        const { data: related } = await supabase
          .from("vehicles")
          .select("id, name, vehicle_type, photos, price_per_day")
          .eq("status", "approved")
          .eq("available", true)
          .eq("vehicle_type", data.vehicle_type)
          .neq("id", data.id)
          .limit(4);
        if (related) setRelatedVehicles(related as RelatedVehicle[]);
      }
      setLoading(false);
    };
    fetchVehicle();
  }, [id]);

  const images = vehicle?.photos?.length ? vehicle.photos : ["/placeholder.svg"];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };
  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20 lg:pt-24">
          <div className="container mx-auto px-4 lg:px-8 py-8">
            <Skeleton className="h-6 w-64 mb-6" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <Skeleton className="aspect-[16/10] rounded-2xl" />
                <Skeleton className="h-10 w-80" />
                <Skeleton className="h-24 w-full" />
              </div>
              <div>
                <Skeleton className="h-64 rounded-2xl" />
              </div>
            </div>
          </div>
        </main>
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

  const specs: Record<string, string> = {};
  if (vehicle.engine_capacity) specs["Engine"] = `${vehicle.engine_capacity}cc`;
  if (vehicle.fuel_type) specs["Fuel Type"] = vehicle.fuel_type;
  if (vehicle.mileage) specs["Mileage"] = `${vehicle.mileage} kmpl`;
  if (vehicle.transmission) specs["Transmission"] = vehicle.transmission;
  if (vehicle.color) specs["Color"] = vehicle.color;
  if (vehicle.seat_capacity) specs["Seats"] = `${vehicle.seat_capacity}`;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-20 lg:pt-24">
        <div className="container mx-auto px-4 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link to="/" className="hover:text-primary">Home</Link>
            <span>/</span>
            <Link to="/vehicles" className="hover:text-primary">Vehicles</Link>
            <span>/</span>
            <span className="text-foreground">{vehicle.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Images & Details */}
            <div className="lg:col-span-2 space-y-8">
              {/* Image Gallery */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-muted"
              >
                <img
                  src={images[currentImageIndex]}
                  alt={vehicle.name}
                  className="w-full h-full object-cover"
                />
                {images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/90 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/90 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {images.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`w-2.5 h-2.5 rounded-full transition-colors ${
                            index === currentImageIndex ? "bg-primary" : "bg-card/60"
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </motion.div>

              {/* Vehicle Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-3 py-1 bg-accent text-accent-foreground rounded-full text-sm font-medium capitalize">
                        {vehicle.vehicle_type}
                      </span>
                      <span className="text-muted-foreground">{vehicle.brand}</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                      {vehicle.name}
                    </h1>
                  </div>
                </div>

                {/* Features */}
                <div className="flex flex-wrap gap-4 mb-8">
                  {staticFeatures.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 px-4 py-2 bg-card rounded-xl border border-border"
                    >
                      <feature.icon className="w-5 h-5 text-primary" />
                      <span className="font-medium">{feature.name}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Specifications */}
              {Object.keys(specs).length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-card rounded-2xl border border-border p-6"
                >
                  <h2 className="text-xl font-bold text-foreground mb-6">Specifications</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {Object.entries(specs).map(([key, value]) => (
                      <div key={key}>
                        <p className="text-sm text-muted-foreground mb-1">{key}</p>
                        <p className="font-semibold text-foreground capitalize">{value}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* What's Included */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                <div className="bg-card rounded-2xl border border-border p-6">
                  <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                    <Check className="w-5 h-5 text-success" />
                    What's Included
                  </h3>
                  <ul className="space-y-2">
                    {included.map((item, index) => (
                      <li key={index} className="flex items-center gap-2 text-muted-foreground">
                        <Check className="w-4 h-4 text-success" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-card rounded-2xl border border-border p-6">
                  <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                    <Info className="w-5 h-5 text-muted-foreground" />
                    Not Included
                  </h3>
                  <ul className="space-y-2">
                    {notIncluded.map((item, index) => (
                      <li key={index} className="text-muted-foreground">
                        • {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>

              {/* Policy Sections */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
              >
                <PolicySections />
              </motion.div>
            </div>

            {/* Right Column - Booking Card */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="sticky top-24 bg-card rounded-2xl border border-border p-6 shadow-soft"
              >
                <div className="mb-6 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Starting at</p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-3xl font-bold text-foreground">₹{vehicle.price_per_day}</span>
                    <span className="text-muted-foreground">/day</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">+ ₹{vehicle.security_deposit || 0} refundable deposit</p>
                </div>

                <Button variant="hero" size="xl" className="w-full mb-4" asChild>
                  <Link to={`/booking/${vehicle.id}`}>Book Now</Link>
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Free cancellation up to 24 hours before pickup
                </p>

                <div className="mt-6 pt-6 border-t border-border">
                  <h4 className="font-semibold text-foreground mb-3 text-sm">Rental Terms</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {terms.map((term, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        {term}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Related Vehicles */}
          {relatedVehicles.length > 0 && (
            <section className="mt-16">
              <h2 className="text-2xl font-bold text-foreground mb-6">Similar Vehicles</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedVehicles.map((v) => (
                  <Link
                    key={v.id}
                    to={`/vehicles/${v.id}`}
                    className="group bg-card rounded-2xl overflow-hidden border border-border card-hover"
                  >
                    <div className="aspect-[4/3] overflow-hidden bg-muted">
                      <img
                        src={v.photos?.[0] || "/placeholder.svg"}
                        alt={v.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">
                        {v.name}
                      </h3>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-lg font-bold text-primary">₹{v.price_per_day}/day</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
