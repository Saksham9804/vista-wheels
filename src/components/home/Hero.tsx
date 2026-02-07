import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Calendar, Clock, Search, Bike, Car, Zap, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const cities = [
  "Delhi", "Mumbai", "Bangalore", "Chennai", "Kolkata", "Hyderabad", "Pune", "Jaipur", "Goa", "Ahmedabad"
];

const vehicleTypes = [
  { id: "all", name: "All Vehicles", icon: null },
  { id: "bike", name: "Bikes", icon: Bike },
  { id: "scooty", name: "Scooters", icon: Zap },
  { id: "car", name: "Cars", icon: Car },
];

export function Hero() {
  const navigate = useNavigate();
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [pickupDate, setPickupDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (selectedCity) params.set("city", selectedCity.toLowerCase());
    if (selectedType !== "all") params.set("type", selectedType);
    if (pickupDate) params.set("pickup", pickupDate);
    if (returnDate) params.set("return", returnDate);
    navigate(`/vehicles?${params.toString()}`);
  };

  const calculateDuration = () => {
    if (pickupDate && returnDate) {
      const pickup = new Date(pickupDate);
      const returnD = new Date(returnDate);
      const diffTime = Math.abs(returnD.getTime() - pickup.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? `${diffDays} day${diffDays > 1 ? 's' : ''}` : null;
    }
    return null;
  };

  return (
    <section className="relative min-h-[90vh] flex items-center bg-gradient-hero overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 lg:px-8 relative z-10 pt-24 lg:pt-32">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-6">
              🚗 Available in 50+ cities across India
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground mb-6 leading-tight"
          >
            Rent Your Perfect Ride{" "}
            <span className="text-gradient">Anywhere in India</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto"
          >
            India's largest fleet of bikes, scooters & cars. Easy booking, doorstep delivery, and 24/7 support at the best prices.
          </motion.p>

          {/* Search Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-card rounded-2xl shadow-float p-6 lg:p-8 border border-border"
          >
            {/* Vehicle Type Tabs */}
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {vehicleTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    selectedType === type.id
                      ? "bg-primary text-primary-foreground shadow-orange"
                      : "bg-secondary text-secondary-foreground hover:bg-accent"
                  }`}
                >
                  {type.icon && <type.icon className="w-4 h-4" />}
                  {type.name}
                </button>
              ))}
            </div>

            {/* Search Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* City Selector */}
              <div className="relative">
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Pickup City
                </label>
                <div className="relative">
                  <button
                    onClick={() => setShowCityDropdown(!showCityDropdown)}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-secondary rounded-xl border border-border hover:border-primary/50 transition-colors text-left"
                  >
                    <MapPin className="w-5 h-5 text-primary" />
                    <span className={selectedCity ? "text-foreground" : "text-muted-foreground"}>
                      {selectedCity || "Select city"}
                    </span>
                    <ChevronDown className="w-4 h-4 ml-auto text-muted-foreground" />
                  </button>
                  
                  {showCityDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-card rounded-xl shadow-float border border-border max-h-60 overflow-y-auto z-20"
                    >
                      {cities.map((city) => (
                        <button
                          key={city}
                          onClick={() => {
                            setSelectedCity(city);
                            setShowCityDropdown(false);
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-accent transition-colors first:rounded-t-xl last:rounded-b-xl"
                        >
                          {city}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Pickup Date */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Pickup Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary pointer-events-none" />
                  <input
                    type="date"
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full pl-12 pr-4 py-3 bg-secondary rounded-xl border border-border hover:border-primary/50 focus:border-primary focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Return Date */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Return Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary pointer-events-none" />
                  <input
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    min={pickupDate || new Date().toISOString().split('T')[0]}
                    className="w-full pl-12 pr-4 py-3 bg-secondary rounded-xl border border-border hover:border-primary/50 focus:border-primary focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Search Button */}
              <div className="flex flex-col justify-end">
                {calculateDuration() && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Clock className="w-4 h-4" />
                    Duration: <span className="font-semibold text-primary">{calculateDuration()}</span>
                  </div>
                )}
                <Button 
                  variant="hero" 
                  size="lg" 
                  className="w-full"
                  onClick={handleSearch}
                >
                  <Search className="w-5 h-5" />
                  Search Vehicles
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Trust Badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-10 flex flex-wrap justify-center gap-8 text-muted-foreground"
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-foreground">10,000+</span>
              <span className="text-sm">Happy Customers</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-foreground">500+</span>
              <span className="text-sm">Vehicles</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-foreground">50+</span>
              <span className="text-sm">Cities</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-foreground">4.8★</span>
              <span className="text-sm">Rating</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
