import { useState, useMemo, useEffect, lazy, Suspense } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
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
  Loader2,
  Search,
  Map,
} from "lucide-react";
import { Input } from "@/components/ui/input";

const VendorMap = lazy(() => import("@/components/maps/VendorMap"));

interface VehicleData {
  id: string;
  name: string;
  vehicle_type: string;
  brand: string;
  photos: string[] | null;
  price_per_day: number;
  fuel_type: string | null;
  engine_capacity: number | null;
  mileage: number | null;
  transmission: string | null;
  color: string | null;
  seat_capacity: number | null;
  available: boolean | null;
  status: string | null;
  security_deposit: number | null;
  registration_number: string;
  pickup_location: string | null;
}

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
  { id: "newest", name: "Newest First" },
  { id: "price-low", name: "Price: Low to High" },
  { id: "price-high", name: "Price: High to Low" },
];

export default function Vehicles() {
  const [searchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list" | "map">("grid");
  const [vehicles, setVehicles] = useState<VehicleData[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [selectedCity, setSelectedCity] = useState(searchParams.get("city") || "All Cities");
  const [selectedType, setSelectedType] = useState(searchParams.get("type") || "all");
  const [selectedPrice, setSelectedPrice] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch vehicles from database
  useEffect(() => {
    const fetchVehicles = async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .eq("status", "approved")
        .eq("available", true)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setVehicles(data as VehicleData[]);
      }
      setLoading(false);
    };

    fetchVehicles();

    // Realtime subscription for instant updates
    const channel = supabase
      .channel("public-vehicles")
      .on("postgres_changes", { event: "*", schema: "public", table: "vehicles" }, () => {
        fetchVehicles();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Filter and sort vehicles
  const filteredVehicles = useMemo(() => {
    let result = [...vehicles];

    if (searchQuery.trim()) {
      result = result.filter((v) =>
        v.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedType !== "all") {
      result = result.filter((v) => v.vehicle_type === selectedType);
    }

    if (selectedPrice !== "all") {
      if (selectedPrice === "2000+") {
        result = result.filter((v) => v.price_per_day >= 2000);
      } else {
        const [min, max] = selectedPrice.split("-").map(Number);
        result = result.filter((v) => v.price_per_day >= min && v.price_per_day <= max);
      }
    }

    switch (sortBy) {
      case "price-low":
        result.sort((a, b) => a.price_per_day - b.price_per_day);
        break;
      case "price-high":
        result.sort((a, b) => b.price_per_day - a.price_per_day);
        break;
    }

    return result;
  }, [vehicles, selectedCity, selectedType, selectedPrice, sortBy, searchQuery]);

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
            <p className="text-muted-foreground mb-4">
              {loading ? "Loading..." : `${filteredVehicles.length} vehicles available`}
            </p>
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search vehicles by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </section>

        {/* Filters & Results */}
        <section className="py-8">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Sidebar Filters - Desktop */}
              <aside className="hidden lg:block w-72 flex-shrink-0">
                <div className="sticky top-24 space-y-6">
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
                  <Button variant="outline" className="lg:hidden" onClick={() => setShowFilters(true)}>
                    <Filter className="w-4 h-4" />
                    Filters
                    {activeFiltersCount > 0 && (
                      <span className="ml-2 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                        {activeFiltersCount}
                      </span>
                    )}
                  </Button>

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

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-2 rounded-lg transition-colors ${
                        viewMode === "grid" ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                      }`}
                      title="Grid view"
                    >
                      <Grid3X3 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-2 rounded-lg transition-colors ${
                        viewMode === "list" ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                      }`}
                      title="List view"
                    >
                      <List className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setViewMode("map")}
                      className={`p-2 rounded-lg transition-colors ${
                        viewMode === "map" ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                      }`}
                      title="Map view"
                    >
                      <Map className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Loading */}
                {loading && (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                )}

                {/* Map View */}
                {viewMode === "map" && !loading && (
                  <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
                    <VendorMap filterType={selectedType} filterPrice={selectedPrice} />
                  </Suspense>
                )}

                {/* Vehicle Grid/List */}
                {!loading && viewMode !== "map" && (
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
                              src={vehicle.photos?.[0] || "/placeholder.svg"}
                              alt={vehicle.name}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute top-4 left-4 flex gap-2">
                              <span className="px-3 py-1 bg-card/90 backdrop-blur-sm rounded-full text-xs font-medium capitalize">
                                {vehicle.vehicle_type}
                              </span>
                            </div>
                          </div>

                          {/* Content */}
                          <div className="p-5 flex-1">
                            <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                              {vehicle.name}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-3">{vehicle.brand}</p>

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
                              {vehicle.transmission && (
                                <span className="capitalize text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded">
                                  {vehicle.transmission}
                                </span>
                              )}
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

                {!loading && viewMode !== "map" && filteredVehicles.length === 0 && (
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
