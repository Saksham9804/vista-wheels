import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import {
  Star,
  Fuel,
  Gauge,
  MapPin,
  Shield,
  HardHat,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Info,
} from "lucide-react";

// Mock vehicle data (in real app, fetch by ID)
const vehicleData = {
  id: 1,
  name: "Royal Enfield Classic 350",
  type: "Bike",
  brand: "Royal Enfield",
  images: [
    "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&q=80",
    "https://images.unsplash.com/photo-1558980664-769d59546b3d?w=800&q=80",
    "https://images.unsplash.com/photo-1558981359-219d6364c9c8?w=800&q=80",
  ],
  price: { daily: 899, weekly: 5499, monthly: 18999 },
  rating: 4.8,
  reviews: 156,
  specs: {
    engine: "350cc Single Cylinder",
    power: "20.2 bhp",
    mileage: "35 kmpl",
    fuelType: "Petrol",
    fuelCapacity: "13L",
    kerbWeight: "195 kg",
    seatHeight: "805 mm",
  },
  features: [
    { name: "Helmet Included", icon: HardHat },
    { name: "Fully Insured", icon: Shield },
    { name: "24/7 Support", icon: Clock },
  ],
  description:
    "The Royal Enfield Classic 350 is an iconic motorcycle that combines vintage styling with modern reliability. Perfect for city commutes and highway cruising alike, this bike offers a comfortable ride with its upright seating position and torquey engine.",
  included: ["1 Full Face Helmet", "First Aid Kit", "Toolkit", "Vehicle Documents"],
  notIncluded: ["Fuel", "Toll Charges", "Traffic Fines"],
  securityDeposit: 3000,
  terms: [
    "Valid driving license required",
    "Minimum age: 18 years",
    "Original ID proof required at pickup",
    "No inter-state travel without prior approval",
  ],
};

const relatedVehicles = [
  {
    id: 4,
    name: "KTM Duke 200",
    type: "Bike",
    image: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=600&q=80",
    price: 1199,
    rating: 4.9,
  },
  {
    id: 7,
    name: "Bajaj Pulsar NS200",
    type: "Bike",
    image: "https://images.unsplash.com/photo-1558981359-219d6364c9c8?w=600&q=80",
    price: 999,
    rating: 4.7,
  },
];

const reviews = [
  {
    id: 1,
    name: "Vikram Singh",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80",
    rating: 5,
    date: "2 weeks ago",
    text: "Amazing bike! Smooth ride and excellent condition. The pickup process was very quick. Highly recommended!",
  },
  {
    id: 2,
    name: "Ananya Joshi",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80",
    rating: 4,
    date: "1 month ago",
    text: "Great experience overall. The bike was clean and well-maintained. Minor delay during pickup but support was helpful.",
  },
];

export default function VehicleDetail() {
  const { id } = useParams();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  

  const vehicle = vehicleData; // In real app, fetch by id

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % vehicle.images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + vehicle.images.length) % vehicle.images.length);
  };

  

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
                  src={vehicle.images[currentImageIndex]}
                  alt={vehicle.name}
                  className="w-full h-full object-cover"
                />
                
                {/* Navigation Arrows */}
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

                {/* Thumbnails */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {vehicle.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2.5 h-2.5 rounded-full transition-colors ${
                        index === currentImageIndex ? "bg-primary" : "bg-card/60"
                      }`}
                    />
                  ))}
                </div>
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
                      <span className="px-3 py-1 bg-accent text-accent-foreground rounded-full text-sm font-medium">
                        {vehicle.type}
                      </span>
                      <span className="text-muted-foreground">{vehicle.brand}</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                      {vehicle.name}
                    </h1>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-accent rounded-xl">
                    <Star className="w-5 h-5 fill-warning text-warning" />
                    <span className="font-bold text-lg">{vehicle.rating}</span>
                    <span className="text-muted-foreground">({vehicle.reviews} reviews)</span>
                  </div>
                </div>

                <p className="text-muted-foreground leading-relaxed mb-6">
                  {vehicle.description}
                </p>

                {/* Features */}
                <div className="flex flex-wrap gap-4 mb-8">
                  {vehicle.features.map((feature, index) => (
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
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card rounded-2xl border border-border p-6"
              >
                <h2 className="text-xl font-bold text-foreground mb-6">Specifications</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {Object.entries(vehicle.specs).map(([key, value]) => (
                    <div key={key}>
                      <p className="text-sm text-muted-foreground mb-1 capitalize">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </p>
                      <p className="font-semibold text-foreground">{value}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

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
                    {vehicle.included.map((item, index) => (
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
                    {vehicle.notIncluded.map((item, index) => (
                      <li key={index} className="text-muted-foreground">
                        • {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>

              {/* Reviews */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h2 className="text-xl font-bold text-foreground mb-6">Customer Reviews</h2>
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="bg-card rounded-2xl border border-border p-6">
                      <div className="flex items-start gap-4">
                        <img
                          src={review.avatar}
                          alt={review.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-foreground">{review.name}</h4>
                            <span className="text-sm text-muted-foreground">{review.date}</span>
                          </div>
                          <div className="flex gap-1 mb-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating
                                    ? "fill-warning text-warning"
                                    : "fill-muted text-muted"
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-muted-foreground">{review.text}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Right Column - Booking Card */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="sticky top-24 bg-card rounded-2xl border border-border p-6 shadow-soft"
              >
                {/* Daily Price */}
                <div className="mb-6 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Starting at</p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-3xl font-bold text-foreground">₹{vehicle.price.daily}</span>
                    <span className="text-muted-foreground">/day</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">+ ₹{vehicle.securityDeposit} refundable deposit</p>
                </div>

                {/* Book Button */}
                <Button variant="hero" size="xl" className="w-full mb-4" asChild>
                  <Link to={`/booking/${vehicle.id}`}>Book Now</Link>
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Free cancellation up to 24 hours before pickup
                </p>

                {/* Terms */}
                <div className="mt-6 pt-6 border-t border-border">
                  <h4 className="font-semibold text-foreground mb-3 text-sm">Rental Terms</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {vehicle.terms.map((term, index) => (
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
                      src={v.image}
                      alt={v.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">
                      {v.name}
                    </h3>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-lg font-bold text-primary">₹{v.price}/day</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-warning text-warning" />
                        <span className="text-sm font-medium">{v.rating}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
