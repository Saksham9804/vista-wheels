import { useState, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import {
  Fuel,
  Gauge,
  Star,
  Filter,
  Grid3X3,
  List,
  ChevronDown,
  X,
  Bike,
  Car,
  Zap,
  MapPin,
} from "lucide-react";

// Mock vehicle data
const allVehicles = [
  {
    id: 1,
    name: "Royal Enfield Classic 350",
    type: "bike",
    brand: "Royal Enfield",
    image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600&q=80",
    price: 899,
    rating: 4.8,
    reviews: 156,
    specs: { engine: "350cc", mileage: "35 kmpl", fuelType: "Petrol" },
    features: ["Helmet Included", "Insured"],
    city: "delhi",
    popular: true,
  },
  {
    id: 2,
    name: "Honda Activa 6G",
    type: "scooty",
    brand: "Honda",
    image: "https://images.unsplash.com/photo-1622185135505-2d795003f628?w=600&q=80",
    price: 499,
    rating: 4.9,
    reviews: 243,
    specs: { engine: "110cc", mileage: "50 kmpl", fuelType: "Petrol" },
    features: ["Helmet Included", "Insured"],
    city: "mumbai",
    popular: true,
  },
  {
    id: 3,
    name: "Maruti Swift",
    type: "car",
    brand: "Maruti Suzuki",
    image: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=600&q=80",
    price: 1499,
    rating: 4.7,
    reviews: 89,
    specs: { engine: "1.2L", mileage: "22 kmpl", fuelType: "Petrol" },
    features: ["AC", "Insured", "Unlimited KM"],
    city: "bangalore",
    popular: false,
  },
  {
    id: 4,
    name: "KTM Duke 200",
    type: "bike",
    brand: "KTM",
    image: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=600&q=80",
    price: 1199,
    rating: 4.9,
    reviews: 112,
    specs: { engine: "200cc", mileage: "30 kmpl", fuelType: "Petrol" },
    features: ["Helmet Included", "Insured"],
    city: "delhi",
    popular: true,
  },
  {
    id: 5,
    name: "Ather 450X",
    type: "scooty",
    brand: "Ather",
    image: "https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=600&q=80",
    price: 699,
    rating: 4.8,
    reviews: 78,
    specs: { engine: "Electric", mileage: "85 km range", fuelType: "Electric" },
    features: ["Helmet Included", "Insured", "Free Charging"],
    city: "bangalore",
    popular: false,
  },
  {
    id: 6,
    name: "Hyundai i20",
    type: "car",
    brand: "Hyundai",
    image: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=600&q=80",
    price: 1799,
    rating: 4.6,
    reviews: 67,
    specs: { engine: "1.2L", mileage: "20 kmpl", fuelType: "Petrol" },
    features: ["AC", "Insured", "Unlimited KM"],
    city: "mumbai",
    popular: false,
  },
  {
    id: 7,
    name: "Bajaj Pulsar NS200",
    type: "bike",
    brand: "Bajaj",
    image: "https://images.unsplash.com/photo-1558981359-219d6364c9c8?w=600&q=80",
    price: 999,
    rating: 4.7,
    reviews: 134,
    specs: { engine: "200cc", mileage: "35 kmpl", fuelType: "Petrol" },
    features: ["Helmet Included", "Insured"],
    city: "chennai",
    popular: true,
  },
  {
    id: 8,
    name: "TVS Jupiter",
    type: "scooty",
    brand: "TVS",
    image: "https://images.unsplash.com/photo-1571188654248-7a89213915f7?w=600&q=80",
    price: 399,
    rating: 4.6,
    reviews: 198,
    specs: { engine: "110cc", mileage: "55 kmpl", fuelType: "Petrol" },
    features: ["Helmet Included", "Insured"],
    city: "hyderabad",
    popular: false,
  },
];

const cities = ["All Cities", "Delhi", "Mumbai", "Bangalore", "Chennai", "Hyderabad", "Pune", "Goa"];
const vehicleTypes = [
  { id: "all", name: "All Types", icon: null },
  { id: "bike", name: "Bikes", icon: Bike },
  { id: "scooty", name: "Scooters", icon: Zap },
  { id: "car", name: "Cars", icon: Car },
];
const priceRanges = [
  { id: "all", name: "All Prices" },
  { id: "0-500", name: "Under ₹500" },
  { id: "500-1000", name: "₹500 - ₹1000" },
  { id: "1000-2000", name: "₹1000 - ₹2000" },
  { id: "2000+", name: "Above ₹2000" },
];
const sortOptions = [
  { id: "popular", name: "Most Popular" },
  { id: "price-low", name: "Price: Low to High" },
  { id: "price-high", name: "Price: High to Low" },
  { id: "rating", name: "Highest Rated" },
];

export default function Vehicles() {
  const [searchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  // Filter states
  const [selectedCity, setSelectedCity] = useState(searchParams.get("city") || "All Cities");
  const [selectedType, setSelectedType] = useState(searchParams.get("type") || "all");
  const [selectedPrice, setSelectedPrice] = useState("all");
  const [sortBy, setSortBy] = useState("popular");

  // Filter and sort vehicles
  const filteredVehicles = useMemo(() => {
    let result = [...allVehicles];

    // Filter by city
    if (selectedCity !== "All Cities") {
      result = result.filter((v) => v.city === selectedCity.toLowerCase());
    }

    // Filter by type
    if (selectedType !== "all") {
      result = result.filter((v) => v.type === selectedType);
    }

    // Filter by price
    if (selectedPrice !== "all") {
      const [min, max] = selectedPrice.split("-").map((p) => parseInt(p) || Infinity);
      result = result.filter((v) => v.price >= min && v.price <= (max || Infinity));
    }

    // Sort
    switch (sortBy) {
      case "price-low":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        result.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      default:
        result.sort((a, b) => (b.popular ? 1 : 0) - (a.popular ? 1 : 0));
    }

    return result;
  }, [selectedCity, selectedType, selectedPrice, sortBy]);

  const activeFiltersCount = [
    selectedCity !== "All Cities",
    selectedType !== "all",
    selectedPrice !== "all",
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20 lg:pt-24">
        {/* Header */}
        <section className="bg-secondary/30 py-10">
          <div className="container mx-auto px-4 lg:px-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Find Your Perfect Ride
            </h1>
            <p className="text-muted-foreground">
              {filteredVehicles.length} vehicles available
            </p>
          </div>
        </section>

        {/* Filters & Results */}
        <section className="py-8">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Sidebar Filters - Desktop */}
              <aside className="hidden lg:block w-72 flex-shrink-0">
                <div className="sticky top-24 space-y-6">
                  {/* City Filter */}
                  <div className="bg-card rounded-xl border border-border p-5">
                    <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      City
                    </h3>
                    <div className="space-y-2">
                      {cities.map((city) => (
                        <button
                          key={city}
                          onClick={() => setSelectedCity(city)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                            selectedCity === city
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-accent"
                          }`}
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Vehicle Type Filter */}
                  <div className="bg-card rounded-xl border border-border p-5">
                    <h3 className="font-semibold text-foreground mb-4">Vehicle Type</h3>
                    <div className="space-y-2">
                      {vehicleTypes.map((type) => (
                        <button
                          key={type.id}
                          onClick={() => setSelectedType(type.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                            selectedType === type.id
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-accent"
                          }`}
                        >
                          {type.icon && <type.icon className="w-4 h-4" />}
                          {type.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price Range Filter */}
                  <div className="bg-card rounded-xl border border-border p-5">
                    <h3 className="font-semibold text-foreground mb-4">Price Range (per day)</h3>
                    <div className="space-y-2">
                      {priceRanges.map((range) => (
                        <button
                          key={range.id}
                          onClick={() => setSelectedPrice(range.id)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                            selectedPrice === range.id
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-accent"
                          }`}
                        >
                          {range.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </aside>

              {/* Main Content */}
              <div className="flex-1">
                {/* Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  {/* Mobile Filter Button */}
                  <Button
                    variant="outline"
                    className="lg:hidden"
                    onClick={() => setShowFilters(true)}
                  >
                    <Filter className="w-4 h-4" />
                    Filters
                    {activeFiltersCount > 0 && (
                      <span className="ml-2 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                        {activeFiltersCount}
                      </span>
                    )}
                  </Button>

                  {/* Sort Dropdown */}
                  <div className="relative group">
                    <button className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg text-sm font-medium hover:border-primary/50 transition-colors">
                      Sort: {sortOptions.find((s) => s.id === sortBy)?.name}
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <div className="absolute top-full right-0 mt-2 bg-card border border-border rounded-xl shadow-float opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 min-w-[180px]">
                      {sortOptions.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => setSortBy(option.id)}
                          className={`w-full text-left px-4 py-3 text-sm first:rounded-t-xl last:rounded-b-xl transition-colors ${
                            sortBy === option.id
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-accent"
                          }`}
                        >
                          {option.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* View Toggle */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-2 rounded-lg transition-colors ${
                        viewMode === "grid" ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                      }`}
                    >
                      <Grid3X3 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-2 rounded-lg transition-colors ${
                        viewMode === "list" ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                      }`}
                    >
                      <List className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Vehicle Grid */}
                <div
                  className={`grid gap-6 ${
                    viewMode === "grid"
                      ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
                      : "grid-cols-1"
                  }`}
                >
                  {filteredVehicles.map((vehicle, index) => (
                    <motion.div
                      key={vehicle.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                    >
                      <Link
                        to={`/vehicles/${vehicle.id}`}
                        className={`group block bg-card rounded-2xl overflow-hidden border border-border card-hover ${
                          viewMode === "list" ? "flex" : ""
                        }`}
                      >
                        {/* Image */}
                        <div
                          className={`relative overflow-hidden bg-muted ${
                            viewMode === "list" ? "w-72 flex-shrink-0" : "aspect-[4/3]"
                          }`}
                        >
                          <img
                            src={vehicle.image}
                            alt={vehicle.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          <div className="absolute top-4 left-4 flex gap-2">
                            <span className="px-3 py-1 bg-card/90 backdrop-blur-sm rounded-full text-xs font-medium capitalize">
                              {vehicle.type}
                            </span>
                            {vehicle.popular && (
                              <span className="px-3 py-1 bg-primary text-primary-foreground rounded-full text-xs font-medium">
                                Popular
                              </span>
                            )}
                          </div>
                          <div className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1 bg-card/90 backdrop-blur-sm rounded-full">
                            <Star className="w-3.5 h-3.5 fill-warning text-warning" />
                            <span className="text-xs font-medium">{vehicle.rating}</span>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-5 flex-1">
                          <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                            {vehicle.name}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-3">{vehicle.brand}</p>

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

                          {/* Features */}
                          <div className="flex flex-wrap gap-2 mb-4">
                            {vehicle.features.slice(0, 3).map((feature) => (
                              <span
                                key={feature}
                                className="px-2 py-1 bg-accent text-accent-foreground rounded text-xs"
                              >
                                {feature}
                              </span>
                            ))}
                          </div>

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

                {filteredVehicles.length === 0 && (
                  <div className="text-center py-20">
                    <p className="text-muted-foreground mb-4">No vehicles found matching your filters.</p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedCity("All Cities");
                        setSelectedType("all");
                        setSelectedPrice("all");
                      }}
                    >
                      Clear Filters
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Mobile Filter Modal */}
      {showFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-foreground/50" onClick={() => setShowFilters(false)} />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            className="absolute right-0 top-0 bottom-0 w-80 bg-background overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">Filters</h2>
                <button onClick={() => setShowFilters(false)}>
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* City Filter */}
                <div>
                  <h3 className="font-semibold mb-3">City</h3>
                  <div className="space-y-2">
                    {cities.map((city) => (
                      <button
                        key={city}
                        onClick={() => setSelectedCity(city)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedCity === city
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-accent"
                        }`}
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Vehicle Type */}
                <div>
                  <h3 className="font-semibold mb-3">Vehicle Type</h3>
                  <div className="space-y-2">
                    {vehicleTypes.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setSelectedType(type.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedType === type.id
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-accent"
                        }`}
                      >
                        {type.icon && <type.icon className="w-4 h-4" />}
                        {type.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <h3 className="font-semibold mb-3">Price Range</h3>
                  <div className="space-y-2">
                    {priceRanges.map((range) => (
                      <button
                        key={range.id}
                        onClick={() => setSelectedPrice(range.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedPrice === range.id
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-accent"
                        }`}
                      >
                        {range.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 space-y-3">
                <Button className="w-full" onClick={() => setShowFilters(false)}>
                  Show {filteredVehicles.length} Results
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSelectedCity("All Cities");
                    setSelectedType("all");
                    setSelectedPrice("all");
                  }}
                >
                  Clear All
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <Footer />
    </div>
  );
}
