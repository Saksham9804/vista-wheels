import { motion } from "framer-motion";
import { MapPin, Bell, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

interface NearbyCity {
  city: string;
  state: string | null;
  partner_count: number;
  vehicle_count: number;
}

interface NoServiceMessageProps {
  cityName: string;
  nearbyCities: NearbyCity[];
  onCityClick: (city: string) => void;
}

export default function NoServiceMessage({ cityName, nearbyCities, onCityClick }: NoServiceMessageProps) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleNotify = () => {
    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    // In production, this would save to a notify_me table
    setSubmitted(true);
    toast.success(`We'll notify you when we launch in ${cityName}!`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto text-center py-16 px-4"
    >
      {/* Illustration */}
      <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-accent flex items-center justify-center">
        <MapPin className="w-12 h-12 text-primary" />
      </div>

      <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
        We're Not in {cityName} Yet!
      </h2>
      <p className="text-muted-foreground mb-8 max-w-md mx-auto">
        We're expanding our services across India and would love to serve you soon. In the meantime, check out nearby cities where we're available.
      </p>

      {/* Nearby Cities */}
      {nearbyCities.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Available Nearby
          </h3>
          <div className="flex flex-wrap justify-center gap-3">
            {nearbyCities.map((nc) => (
              <button
                key={nc.city}
                onClick={() => onCityClick(nc.city)}
                className="group flex items-center gap-2 px-5 py-3 bg-card border border-border rounded-xl hover:border-primary/50 hover:shadow-md transition-all"
              >
                <div className="w-2 h-2 rounded-full bg-success flex-shrink-0" />
                <div className="text-left">
                  <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {nc.city}
                  </span>
                  {nc.state && (
                    <span className="text-xs text-muted-foreground ml-1">
                      {nc.state}
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {nc.vehicle_count} vehicles
                </span>
                <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Notify Me */}
      <div className="bg-card border border-border rounded-2xl p-6 max-w-md mx-auto mb-6">
        <Bell className="w-6 h-6 text-primary mx-auto mb-3" />
        <h3 className="font-semibold text-foreground mb-2">
          Get notified when we launch in {cityName}
        </h3>
        {submitted ? (
          <p className="text-sm text-success font-medium">
            ✓ You'll be the first to know!
          </p>
        ) : (
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
              onKeyDown={(e) => e.key === "Enter" && handleNotify()}
            />
            <Button onClick={handleNotify}>Notify Me</Button>
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-2">
          We'll only contact you about service availability
        </p>
      </div>

      {/* Partner CTA */}
      <div className="flex flex-wrap justify-center gap-3">
        <Link to="/partner/signup">
          <Button variant="outline" className="gap-2">
            <Users className="w-4 h-4" />
            Become a Partner
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}
