/// <reference types="google.maps" />
import { useEffect, useRef, useState, useCallback } from "react";
import { Loader2, MapPin, Star, Car, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GOOGLE_MAPS_API_KEY } from "@/lib/googleMaps";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

declare global {
  interface Window {
    google: typeof google;
  }
}

interface VendorLocation {
  id: string;
  business_name: string;
  city: string;
  shop_address: string | null;
  latitude: number;
  longitude: number;
  rating: number | null;
  total_bookings: number | null;
  profile_photo: string | null;
  vehicle_count: number;
}

interface VendorMapProps {
  filterType?: string;
  filterPrice?: string;
}

let googleMapsLoaded = false;
let googleMapsLoadPromise: Promise<void> | null = null;

function loadGoogleMapsScript(): Promise<void> {
  if (googleMapsLoaded && window.google?.maps) return Promise.resolve();
  if (googleMapsLoadPromise) return googleMapsLoadPromise;

  googleMapsLoadPromise = new Promise((resolve, reject) => {
    if (window.google?.maps) {
      googleMapsLoaded = true;
      resolve();
      return;
    }
    // Check if script already exists
    const existing = document.querySelector(`script[src*="maps.googleapis.com"]`);
    if (existing) {
      existing.addEventListener("load", () => { googleMapsLoaded = true; resolve(); });
      return;
    }
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => { googleMapsLoaded = true; resolve(); };
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });

  return googleMapsLoadPromise;
}

export default function VendorMap({ filterType, filterPrice }: VendorMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  const [vendors, setVendors] = useState<VendorLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<VendorLocation | null>(null);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {
          // Default to Delhi if permission denied
          setUserLocation({ lat: 28.6139, lng: 77.209 });
        }
      );
    } else {
      setUserLocation({ lat: 28.6139, lng: 77.209 });
    }
  }, []);

  // Fetch vendors with vehicle counts
  useEffect(() => {
    const fetchVendors = async () => {
      const { data: partners, error } = await supabase
        .from("partners")
        .select("id, business_name, city, shop_address, latitude, longitude, rating, total_bookings, profile_photo, status")
        .eq("status", "approved");

      if (error || !partners) {
        setLoading(false);
        return;
      }

      // Get vehicle counts per partner
      const partnerIds = partners.map((p) => p.id);
      const { data: vehicleCounts } = await supabase
        .from("vehicles")
        .select("partner_id")
        .eq("status", "approved")
        .eq("available", true)
        .in("partner_id", partnerIds);

      const countMap: Record<string, number> = {};
      vehicleCounts?.forEach((v) => {
        countMap[v.partner_id] = (countMap[v.partner_id] || 0) + 1;
      });

      const vendorLocations: VendorLocation[] = partners
        .filter((p) => p.latitude && p.longitude)
        .map((p) => ({
          id: p.id,
          business_name: p.business_name,
          city: p.city,
          shop_address: p.shop_address,
          latitude: p.latitude!,
          longitude: p.longitude!,
          rating: p.rating,
          total_bookings: p.total_bookings,
          profile_photo: p.profile_photo,
          vehicle_count: countMap[p.id] || 0,
        }));

      setVendors(vendorLocations);
      setLoading(false);
    };

    fetchVendors();
  }, []);

  // Init map
  useEffect(() => {
    if (!userLocation) return;

    loadGoogleMapsScript().then(() => {
      if (!mapRef.current) return;

      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: userLocation,
        zoom: 12,
        styles: [
          { featureType: "poi", stylers: [{ visibility: "simplified" }] },
        ],
        mapTypeControl: false,
        streetViewControl: true,
        fullscreenControl: true,
      });

      infoWindowRef.current = new window.google.maps.InfoWindow();

      // User location marker
      new window.google.maps.Marker({
        position: userLocation,
        map: mapInstanceRef.current,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#4285F4",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 3,
        },
        title: "Your Location",
        zIndex: 999,
      });

      setMapReady(true);
    });
  }, [userLocation]);

  // Add vendor markers
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    vendors.forEach((vendor) => {
      const marker = new window.google.maps.Marker({
        position: { lat: vendor.latitude, lng: vendor.longitude },
        map: mapInstanceRef.current!,
        title: vendor.business_name,
        icon: {
          url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="48" viewBox="0 0 40 48">
              <path d="M20 0C8.96 0 0 8.96 0 20c0 15 20 28 20 28s20-13 20-28C40 8.96 31.04 0 20 0z" fill="#F97316"/>
              <circle cx="20" cy="18" r="10" fill="white"/>
              <text x="20" y="22" text-anchor="middle" font-size="12" font-weight="bold" fill="#F97316">${vendor.vehicle_count}</text>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(40, 48),
          anchor: new window.google.maps.Point(20, 48),
        },
      });

      marker.addListener("click", () => {
        setSelectedVendor(vendor);

        const distance = userLocation
          ? (
              window.google.maps.geometry?.spherical?.computeDistanceBetween(
                new window.google.maps.LatLng(userLocation.lat, userLocation.lng),
                new window.google.maps.LatLng(vendor.latitude, vendor.longitude)
              ) / 1000
            ).toFixed(1)
          : null;

        const content = `
          <div style="padding: 12px; max-width: 260px; font-family: system-ui, sans-serif;">
            <h3 style="margin: 0 0 6px; font-size: 16px; font-weight: 700; color: #1a1a1a;">${vendor.business_name}</h3>
            <p style="margin: 0 0 4px; font-size: 13px; color: #666;">${vendor.shop_address || vendor.city}</p>
            ${distance ? `<p style="margin: 0 0 4px; font-size: 13px; color: #F97316; font-weight: 600;">📍 ${distance} km away</p>` : ""}
            <div style="display: flex; gap: 12px; margin: 8px 0; font-size: 13px; color: #444;">
              <span>🚗 ${vendor.vehicle_count} vehicles</span>
              <span>⭐ ${vendor.rating?.toFixed(1) || "New"}</span>
            </div>
            <a href="/vehicles?vendor=${vendor.id}" style="display: inline-block; margin-top: 8px; padding: 6px 16px; background: #F97316; color: white; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600;">View Vehicles</a>
          </div>
        `;

        infoWindowRef.current?.setContent(content);
        infoWindowRef.current?.open(mapInstanceRef.current!, marker);
      });

      markersRef.current.push(marker);
    });

    // Fit bounds if vendors exist
    if (vendors.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      if (userLocation) bounds.extend(userLocation);
      vendors.forEach((v) => bounds.extend({ lat: v.latitude, lng: v.longitude }));
      mapInstanceRef.current.fitBounds(bounds, 60);
    }
  }, [vendors, mapReady, userLocation]);

  const centerOnUser = useCallback(() => {
    if (userLocation && mapInstanceRef.current) {
      mapInstanceRef.current.panTo(userLocation);
      mapInstanceRef.current.setZoom(13);
    }
  }, [userLocation]);

  if (loading || !userLocation) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Loading vendor map...</span>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {/* Map Container */}
      <div ref={mapRef} className="w-full h-[500px] md:h-[600px] rounded-2xl border border-border overflow-hidden" />

      {/* Center on user button */}
      <Button
        size="sm"
        variant="glass"
        className="absolute bottom-4 right-4 z-10 shadow-lg"
        onClick={centerOnUser}
      >
        <Navigation className="w-4 h-4 mr-1" />
        My Location
      </Button>

      {/* Vendor count badge */}
      <div className="absolute top-4 left-4 z-10 bg-card/95 backdrop-blur-sm border border-border rounded-xl px-4 py-2 shadow-lg">
        <span className="text-sm font-medium text-foreground">
          <MapPin className="w-4 h-4 inline mr-1 text-primary" />
          {vendors.length} vendor{vendors.length !== 1 ? "s" : ""} near you
        </span>
      </div>

      {/* Selected vendor card (mobile-friendly) */}
      {selectedVendor && (
        <div className="absolute bottom-16 left-4 right-4 md:left-4 md:right-auto md:w-80 z-10 bg-card border border-border rounded-xl p-4 shadow-elevated">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-foreground">{selectedVendor.business_name}</h3>
              <p className="text-sm text-muted-foreground">{selectedVendor.shop_address || selectedVendor.city}</p>
            </div>
            <button onClick={() => setSelectedVendor(null)} className="text-muted-foreground hover:text-foreground">✕</button>
          </div>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Car className="w-4 h-4" />{selectedVendor.vehicle_count} vehicles</span>
            <span className="flex items-center gap-1"><Star className="w-4 h-4" />{selectedVendor.rating?.toFixed(1) || "New"}</span>
          </div>
          <Link to={`/vehicles?vendor=${selectedVendor.id}`}>
            <Button size="sm" className="mt-3 w-full">View Vehicles</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
