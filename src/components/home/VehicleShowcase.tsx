import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Fuel, Gauge, Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const vehicles = [
  {
    id: 1,
    name: "Royal Enfield Classic 350",
    type: "Bike",
    image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600&q=80",
    price: 899,
    rating: 4.8,
    reviews: 156,
    specs: { engine: "350cc", mileage: "35 kmpl" },
    popular: true,
  },
  {
    id: 2,
    name: "Honda Activa 6G",
    type: "Scooty",
    image: "https://images.unsplash.com/photo-1622185135505-2d795003f628?w=600&q=80",
    price: 499,
    rating: 4.9,
    reviews: 243,
    specs: { engine: "110cc", mileage: "50 kmpl" },
    popular: true,
  },
  {
    id: 3,
    name: "Maruti Swift",
    type: "Car",
    image: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=600&q=80",
    price: 1499,
    rating: 4.7,
    reviews: 89,
    specs: { engine: "1.2L", mileage: "22 kmpl" },
    popular: false,
  },
  {
    id: 4,
    name: "KTM Duke 200",
    type: "Bike",
    image: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=600&q=80",
    price: 1199,
    rating: 4.9,
    reviews: 112,
    specs: { engine: "200cc", mileage: "30 kmpl" },
    popular: true,
  },
  {
    id: 5,
    name: "Ather 450X",
    type: "Scooty",
    image: "https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=600&q=80",
    price: 699,
    rating: 4.8,
    reviews: 78,
    specs: { engine: "Electric", mileage: "85 km range" },
    popular: false,
  },
  {
    id: 6,
    name: "Hyundai i20",
    type: "Car",
    image: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=600&q=80",
    price: 1799,
    rating: 4.6,
    reviews: 67,
    specs: { engine: "1.2L", mileage: "20 kmpl" },
    popular: false,
  },
];

export function VehicleShowcase() {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Popular Vehicles
            </h2>
            <p className="text-muted-foreground">
              Choose from our most-booked rides
            </p>
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
