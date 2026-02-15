import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Fuel, Gauge, Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function VehicleShowcase() {
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

        {/* Vehicle Grid */}
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
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                  <img
                    src={vehicle.image}
                    alt={vehicle.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  {/* Badges */}
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="px-3 py-1 bg-card/90 backdrop-blur-sm rounded-full text-xs font-medium">
                      {vehicle.type}
                    </span>
                    {vehicle.popular && (
                      <span className="px-3 py-1 bg-primary text-primary-foreground rounded-full text-xs font-medium">
                        Popular
                      </span>
                    )}
                  </div>
                  {/* Rating */}
                  <div className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1 bg-card/90 backdrop-blur-sm rounded-full">
                    <Star className="w-3.5 h-3.5 fill-warning text-warning" />
                    <span className="text-xs font-medium">{vehicle.rating}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {vehicle.name}
                  </h3>

                  {/* Specs */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <Gauge className="w-4 h-4" />
                      {vehicle.specs.engine}
                    </span>
                    <span className="flex items-center gap-1">
                      <Fuel className="w-4 h-4" />
                      {vehicle.specs.mileage}
                    </span>
                  </div>

                  {/* Price & CTA */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-primary">₹{vehicle.price}</span>
                      <span className="text-sm text-muted-foreground">/day</span>
                    </div>
                    <Button size="sm">Book Now</Button>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
