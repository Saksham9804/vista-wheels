import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Phone, ChevronDown, Bike, Car, Zap, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

const vehicleTypes = [
  { name: "Bikes", icon: Bike, href: "/vehicles?type=bike" },
  { name: "Scooters", icon: Zap, href: "/vehicles?type=scooty" },
  { name: "Cars", icon: Car, href: "/vehicles?type=car" },
];

const cities = [
  "Delhi", "Mumbai", "Bangalore", "Chennai", "Kolkata", "Hyderabad", "Pune", "Jaipur"
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showVehicles, setShowVehicles] = useState(false);
  const [showCities, setShowCities] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Vehicles", href: "/vehicles", hasDropdown: true },
    { name: "Cities", href: "#cities", hasDropdown: true },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <nav className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-orange">
              <span className="text-primary-foreground font-bold text-xl">V</span>
            </div>
            <span className="text-2xl font-bold text-foreground">Vista</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <div 
                key={link.name}
                className="relative"
                onMouseEnter={() => {
                  if (link.name === "Vehicles") setShowVehicles(true);
                  if (link.name === "Cities") setShowCities(true);
                }}
                onMouseLeave={() => {
                  setShowVehicles(false);
                  setShowCities(false);
                }}
              >
                <Link
                  to={link.href}
                  className={`flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary ${
                    location.pathname === link.href ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {link.name}
                  {link.hasDropdown && <ChevronDown className="w-4 h-4" />}
                </Link>

                {/* Vehicles Dropdown */}
                <AnimatePresence>
                  {link.name === "Vehicles" && showVehicles && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-0 pt-4"
                    >
                      <div className="bg-card rounded-xl shadow-float border border-border p-4 min-w-[200px]">
                        {vehicleTypes.map((type) => (
                          <Link
                            key={type.name}
                            to={type.href}
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                          >
                            <type.icon className="w-5 h-5 text-primary" />
                            <span className="font-medium">{type.name}</span>
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Cities Dropdown */}
                <AnimatePresence>
                  {link.name === "Cities" && showCities && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-0 pt-4"
                    >
                      <div className="bg-card rounded-xl shadow-float border border-border p-4 min-w-[280px]">
                        <div className="grid grid-cols-2 gap-2">
                          {cities.map((city) => (
                            <Link
                              key={city}
                              to={`/vehicles?city=${city.toLowerCase()}`}
                              className="flex items-center gap-2 p-3 rounded-lg hover:bg-accent transition-colors"
                            >
                              <MapPin className="w-4 h-4 text-primary" />
                              <span className="text-sm font-medium">{city}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-4">
            <a href="tel:+911234567890" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              <Phone className="w-4 h-4" />
              +91 123 456 7890
            </a>
            <Button variant="outline" size="sm" asChild>
              <Link to="/login">Login</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/vehicles">Book Now</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-accent transition-colors"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden overflow-hidden"
            >
              <div className="py-4 space-y-4 border-t border-border">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.href}
                    className="block px-4 py-2 text-base font-medium text-foreground hover:text-primary transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    {link.name}
                  </Link>
                ))}
                <div className="flex flex-col gap-3 px-4 pt-4">
                  <Button variant="outline" asChild className="w-full">
                    <Link to="/login">Login</Link>
                  </Button>
                  <Button asChild className="w-full">
                    <Link to="/vehicles">Book Now</Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}
