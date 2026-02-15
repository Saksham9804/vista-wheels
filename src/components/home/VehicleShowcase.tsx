import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Fuel, Gauge, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface VehicleItem {
  id: string;
  name: string;
  vehicle_type: string;
  photos: string[] | null;
  price_per_day: number;
  fuel_type: string | null;
  engine_capacity: number | null;
}

export function VehicleShowcase() {
  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVehicles = async () => {
      const { data } = await supabase
        .from("vehicles")
        .select("id, name, vehicle_type, photos, price_per_day, fuel_type, engine_capacity")
        .eq("status", "approved")
        .eq("available", true)
        .order("created_at", { ascending: false })
        .limit(6);
      if (data) setVehicles(data as VehicleItem[]);
      setLoading(false);
    };
    fetchVehicles();
  }, []);

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Popular Vehicles</h2>
            <p className="text-muted-foreground">Choose from our most-booked rides</p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/vehicles" className="flex items-center gap-2">
              View All
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {!loading && vehicles.length === 0 && (
          <p className="text-center text-muted-foreground py-12">No vehicles available yet.</p>
        )}

        {!loading && vehicles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((vehicle, index) => (
              <motion.div
                key={vehicle.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link
                  to={`/vehicles/${vehicle.id}`}
                  className="group block bg-card rounded-2xl overflow-hidden border border-border card-hover"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                    <img
                      src={vehicle.photos?.[0] || "/placeholder.svg"}
                      alt={vehicle.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-card/90 backdrop-blur-sm rounded-full text-xs font-medium capitalize">
                        {vehicle.vehicle_type}
                      </span>
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {vehicle.name}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      {vehicle.engine_capacity && (
                        <span className="flex items-center gap-1">
                          <Gauge className="w-4 h-4" />
                          {vehicle.engine_capacity}cc
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Fuel className="w-4 h-4" />
                        {vehicle.fuel_type || "Petrol"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-2xl font-bold text-primary">₹{vehicle.price_per_day}</span>
                        <span className="text-sm text-muted-foreground">/day</span>
                      </div>
                      <Button size="sm">Book Now</Button>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
