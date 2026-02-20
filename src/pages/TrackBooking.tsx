import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import { GOOGLE_MAPS_API_KEY, GOOGLE_MAPS_LIBRARIES } from "@/lib/googleMaps";
import { useDriverLocationSubscription, useBookingStatusSubscription } from "@/hooks/useDriverLocation";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Navigation, Phone, ArrowLeft, Car, Clock, AlertTriangle } from "lucide-react";

const mapContainerStyle = { width: "100%", height: "100%" };

const statusSteps = [
  { key: "confirmed", label: "Confirmed", icon: "✅" },
  { key: "driver_assigned", label: "Driver Assigned", icon: "🏍️" },
  { key: "arriving", label: "Arriving", icon: "🚗" },
  { key: "in_progress", label: "Ride Started", icon: "🛣️" },
  { key: "completed", label: "Completed", icon: "🏁" },
];

const statusColors: Record<string, string> = {
  confirmed: "bg-blue-100 text-blue-700",
  driver_assigned: "bg-yellow-100 text-yellow-700",
  arriving: "bg-orange-100 text-orange-700",
  in_progress: "bg-green-100 text-green-700",
  completed: "bg-gray-100 text-gray-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function TrackBooking() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const { driverLocation, isActive } = useDriverLocationSubscription(bookingId || null);
  const { status, bookingDetails } = useBookingStatusSubscription(bookingId || null);
  const [customerLocation, setCustomerLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [bookingInfo, setBookingInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [eta, setEta] = useState<string | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const prevDriverLocation = useRef<{ lat: number; lng: number } | null>(null);
  const [animatedDriverPos, setAnimatedDriverPos] = useState<{ lat: number; lng: number } | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  // Fetch booking info
  useEffect(() => {
    if (!bookingId) return;
    const fetchBooking = async () => {
      const { data } = await supabase
        .from("bookings")
        .select("*, vehicles(name, brand, vehicle_type, registration_number, photos)")
        .eq("id", bookingId)
        .maybeSingle();
      setBookingInfo(data);
      setLoading(false);
    };
    fetchBooking();
  }, [bookingId]);

  // Set customer location from booking data first, then try GPS
  useEffect(() => {
    // Use booking pickup coordinates as immediate fallback
    if (!customerLocation && bookingInfo) {
      const pickup = bookingInfo.delivery_address ? 
        { lat: bookingInfo.pickup_lat || 10.7905, lng: bookingInfo.pickup_lng || 78.7047 } : null;
      
      if (bookingDetails?.pickup_lat && bookingDetails?.pickup_lng) {
        setCustomerLocation({ lat: bookingDetails.pickup_lat, lng: bookingDetails.pickup_lng });
      } else if (pickup) {
        setCustomerLocation(pickup);
      } else {
        setCustomerLocation({ lat: 10.7905, lng: 78.7047 });
      }
    }

    // Try to get real GPS location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCustomerLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {} // Already have fallback set above
      );
    }
  }, [bookingDetails, bookingInfo]);

  // Smooth marker animation
  useEffect(() => {
    if (!driverLocation) {
      setAnimatedDriverPos(driverLocation);
      return;
    }
    if (!prevDriverLocation.current) {
      setAnimatedDriverPos(driverLocation);
      prevDriverLocation.current = driverLocation;
      return;
    }

    const startLat = prevDriverLocation.current.lat;
    const startLng = prevDriverLocation.current.lng;
    const endLat = driverLocation.lat;
    const endLng = driverLocation.lng;
    const frames = 30;
    let frame = 0;

    const animate = () => {
      frame++;
      const progress = frame / frames;
      setAnimatedDriverPos({
        lat: startLat + (endLat - startLat) * progress,
        lng: startLng + (endLng - startLng) * progress,
      });
      if (frame < frames) {
        animFrameRef.current = requestAnimationFrame(animate);
      }
    };

    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(animate);
    prevDriverLocation.current = driverLocation;

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [driverLocation]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    directionsRendererRef.current = new google.maps.DirectionsRenderer({
      map,
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: "hsl(18, 100%, 55%)",
        strokeOpacity: 0.8,
        strokeWeight: 4,
      },
    });
  }, []);

  // Directions API route + ETA via Distance Matrix
  useEffect(() => {
    if (!mapRef.current || !animatedDriverPos || !customerLocation || !isLoaded) return;

    // Draw route via Directions API
    const directionsService = new google.maps.DirectionsService();
    directionsService.route(
      {
        origin: new google.maps.LatLng(animatedDriverPos.lat, animatedDriverPos.lng),
        destination: new google.maps.LatLng(customerLocation.lat, customerLocation.lng),
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, routeStatus) => {
        if (routeStatus === "OK" && directionsRendererRef.current) {
          directionsRendererRef.current.setDirections(result);
        }
      }
    );

    // ETA via Distance Matrix
    const distanceService = new google.maps.DistanceMatrixService();
    distanceService.getDistanceMatrix(
      {
        origins: [new google.maps.LatLng(animatedDriverPos.lat, animatedDriverPos.lng)],
        destinations: [new google.maps.LatLng(customerLocation.lat, customerLocation.lng)],
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (response, matrixStatus) => {
        if (matrixStatus === "OK" && response) {
          const element = response.rows[0]?.elements[0];
          if (element?.status === "OK") {
            setEta(element.duration?.text || null);
          }
        }
      }
    );
  }, [animatedDriverPos, customerLocation, isLoaded]);

  // Fit bounds when both markers exist
  useEffect(() => {
    if (!mapRef.current || !customerLocation || !animatedDriverPos) return;
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(customerLocation);
    bounds.extend(animatedDriverPos);
    mapRef.current.fitBounds(bounds, 80);
  }, [animatedDriverPos, customerLocation]);

  const currentStepIndex = statusSteps.findIndex((s) => s.key === status);

  if (loading || !isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!bookingInfo) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20 lg:pt-24">
          <div className="container mx-auto px-4 py-20 text-center">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Booking Not Found</h2>
            <p className="text-muted-foreground mb-6">We couldn't find a booking with this ID.</p>
            <Button asChild><Link to="/">Go Home</Link></Button>
          </div>
        </main>
      </div>
    );
  }

  const vehicle = bookingInfo.vehicles;
  const mapCenter = customerLocation || 
    (bookingDetails?.pickup_lat ? { lat: bookingDetails.pickup_lat, lng: bookingDetails.pickup_lng } : null) ||
    { lat: 10.7905, lng: 78.7047 };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="pt-16 lg:pt-20 flex-1 flex flex-col">
        {/* Status Bar */}
        <div className="bg-card border-b border-border px-4 py-3">
          <div className="container mx-auto">
            <div className="flex items-center gap-3 mb-3">
              <Button variant="ghost" size="icon" asChild>
                <Link to="/profile"><ArrowLeft className="w-5 h-5" /></Link>
              </Button>
              <div className="flex-1">
                <h1 className="font-bold text-foreground text-lg">Live Tracking</h1>
                <p className="text-xs text-muted-foreground">Booking #{bookingId?.slice(0, 8)}</p>
              </div>
              <Badge className={statusColors[status || "confirmed"]}>
                {status ? status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Confirmed"}
              </Badge>
            </div>

            {/* ETA Banner */}
            {eta && animatedDriverPos && (
              <div className="bg-primary/10 text-primary rounded-lg px-4 py-2 mb-3 flex items-center gap-2 text-sm font-medium">
                <Clock className="w-4 h-4" />
                Driver arrives in {eta}
              </div>
            )}

            {/* Status Steps */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {statusSteps.map((step, i) => (
                <div key={step.key} className="flex items-center">
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs whitespace-nowrap ${
                    i <= currentStepIndex
                      ? "bg-primary/10 text-primary font-medium"
                      : "bg-secondary text-muted-foreground"
                  }`}>
                    <span>{step.icon}</span>
                    <span className="hidden sm:inline">{step.label}</span>
                  </div>
                  {i < statusSteps.length - 1 && (
                    <div className={`w-4 h-0.5 mx-0.5 ${i < currentStepIndex ? "bg-primary" : "bg-border"}`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative" style={{ minHeight: "60vh" }}>
          {!isActive && driverLocation && (
            <div className="absolute top-4 left-4 right-4 z-10 bg-destructive/90 text-destructive-foreground rounded-xl p-3 flex items-center gap-2 text-sm">
              <AlertTriangle className="w-4 h-4" />
              Driver is currently offline. Last known location shown.
            </div>
          )}

          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={mapCenter}
            zoom={15}
            onLoad={onMapLoad}
            options={{
              disableDefaultUI: true,
              zoomControl: true,
              mapTypeControl: false,
              streetViewControl: false,
              fullscreenControl: true,
            }}
          >
            {/* Customer Marker */}
            {customerLocation && (
              <Marker
                position={customerLocation}
                title="Your Location"
                icon={{
                  url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                  scaledSize: new google.maps.Size(40, 40),
                }}
              />
            )}

            {/* Driver Marker */}
            {animatedDriverPos && (
              <Marker
                position={animatedDriverPos}
                title="Driver Location"
                icon={{
                  url: "https://maps.google.com/mapfiles/ms/icons/cabs/cab.png",
                  scaledSize: new google.maps.Size(40, 40),
                }}
              />
            )}
          </GoogleMap>
        </div>

        {/* Bottom Info Card */}
        <div className="bg-card border-t border-border p-4">
          <div className="container mx-auto max-w-lg">
            {vehicle && (
              <div className="flex items-center gap-4 mb-3">
                <div className="w-16 h-12 rounded-lg bg-secondary overflow-hidden">
                  {vehicle.photos?.[0] ? (
                    <img src={vehicle.photos[0]} alt={vehicle.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Car className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{vehicle.name}</h3>
                  <p className="text-xs text-muted-foreground">{vehicle.registration_number} • {vehicle.vehicle_type}</p>
                </div>
                {bookingInfo.customer_phone && (
                  <a href={`tel:${bookingInfo.customer_phone}`} className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                    <Phone className="w-4 h-4 text-primary-foreground" />
                  </a>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-secondary rounded-lg p-3">
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                  <MapPin className="w-3 h-3" />
                  <span className="text-xs">Pickup</span>
                </div>
                <p className="font-medium text-foreground text-xs">{bookingInfo.pickup_location || "Partner Center"}</p>
              </div>
              <div className="bg-secondary rounded-lg p-3">
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                  <Clock className="w-3 h-3" />
                  <span className="text-xs">Duration</span>
                </div>
                <p className="font-medium text-foreground text-xs">{bookingInfo.duration || "—"}</p>
              </div>
            </div>

            {!driverLocation && (
              <div className="mt-3 p-3 bg-accent rounded-lg text-center">
                <Navigation className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-sm text-foreground font-medium">Waiting for driver location...</p>
                <p className="text-xs text-muted-foreground">The driver's location will appear once the ride starts.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
