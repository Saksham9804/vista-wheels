/// <reference types="google.maps" />
import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, MapPin, Star, Navigation, Landmark, Bus, Hotel, Film, UtensilsCrossed, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GOOGLE_MAPS_API_KEY } from "@/lib/googleMaps";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";

declare global {
  interface Window {
    google: typeof google;
  }
}

const CATEGORIES = [
  { id: "attractions", label: "Attractions", icon: Landmark, type: "tourist_attraction", keyword: "tourist attractions" },
  { id: "transport", label: "Transport", icon: Bus, type: "transit_station", keyword: "transport station" },
  { id: "hotels", label: "Hotels", icon: Hotel, type: "lodging", keyword: "hotels" },
  { id: "entertainment", label: "Entertainment", icon: Film, type: "amusement_park", keyword: "entertainment" },
  { id: "restaurants", label: "Restaurants", icon: UtensilsCrossed, type: "restaurant", keyword: "restaurants" },
] as const;

type CategoryId = typeof CATEGORIES[number]["id"];

interface Place {
  id: string;
  name: string;
  address?: string;
  rating?: number;
  userRatingsTotal?: number;
  lat: number;
  lng: number;
}

let mapsLoadPromise: Promise<void> | null = null;
function loadMaps(): Promise<void> {
  if (window.google?.maps?.places) return Promise.resolve();
  if (mapsLoadPromise) return mapsLoadPromise;
  mapsLoadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-gmaps-loader="1"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Maps load failed")));
      return;
    }
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,geometry`;
    s.async = true;
    s.defer = true;
    s.dataset.gmapsLoader = "1";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Maps load failed"));
    document.head.appendChild(s);
  });
  return mapsLoadPromise;
}

export default function ExploreCity() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoRef = useRef<google.maps.InfoWindow | null>(null);

  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [cityName, setCityName] = useState<string>("");
  const [activeCat, setActiveCat] = useState<CategoryId>("attractions");
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Get user location
  useEffect(() => {
    if (!navigator.geolocation) {
      setCenter({ lat: 28.6139, lng: 77.209 });
      setCityName("Delhi");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {
        setCenter({ lat: 28.6139, lng: 77.209 });
        setCityName("Delhi");
      },
    );
  }, []);

  // Init map
  useEffect(() => {
    if (!center) return;
    loadMaps().then(() => {
      if (!mapRef.current) return;
      mapInstance.current = new window.google.maps.Map(mapRef.current, {
        center,
        zoom: 13,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        styles: [{ featureType: "poi", stylers: [{ visibility: "simplified" }] }],
      });
      infoRef.current = new window.google.maps.InfoWindow();
      setMapReady(true);

      // Reverse geocode for city name
      if (!cityName) {
        const geo = new window.google.maps.Geocoder();
        geo.geocode({ location: center }, (results, status) => {
          if (status === "OK" && results && results[0]) {
            const comp = results[0].address_components.find((c) =>
              c.types.includes("locality") || c.types.includes("administrative_area_level_2"),
            );
            if (comp) setCityName(comp.long_name);
          }
        });
      }
    }).catch(() => setMapReady(false));
  }, [center]);

  // Fetch places when category or map changes
  useEffect(() => {
    if (!mapReady || !mapInstance.current || !center) return;
    const cat = CATEGORIES.find((c) => c.id === activeCat)!;
    setLoading(true);
    setPlaces([]);
    const svc = new window.google.maps.places.PlacesService(mapInstance.current);
    svc.nearbySearch(
      {
        location: center,
        radius: 8000,
        type: cat.type,
        keyword: cat.keyword,
      },
      (results, status) => {
        setLoading(false);
        if (status !== window.google.maps.places.PlacesServiceStatus.OK || !results) return;
        const list: Place[] = results
          .filter((p) => p.geometry?.location && p.name)
          .map((p) => ({
            id: p.place_id!,
            name: p.name!,
            address: p.vicinity,
            rating: p.rating,
            userRatingsTotal: p.user_ratings_total,
            lat: p.geometry!.location!.lat(),
            lng: p.geometry!.location!.lng(),
          }))
          .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
          .slice(0, 25);
        setPlaces(list);
      },
    );
  }, [activeCat, mapReady, center]);

  // Render markers
  useEffect(() => {
    if (!mapInstance.current) return;
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    places.forEach((p, idx) => {
      const marker = new window.google.maps.Marker({
        position: { lat: p.lat, lng: p.lng },
        map: mapInstance.current!,
        title: p.name,
        label: { text: String(idx + 1), color: "white", fontWeight: "700", fontSize: "12px" },
        icon: {
          path: "M20 0C8.96 0 0 8.96 0 20c0 15 20 28 20 28s20-13 20-28C40 8.96 31.04 0 20 0z",
          fillColor: "#F97316",
          fillOpacity: 1,
          strokeColor: "#fff",
          strokeWeight: 2,
          scale: 0.8,
          anchor: new window.google.maps.Point(20, 48),
          labelOrigin: new window.google.maps.Point(20, 18),
        },
      });
      marker.addListener("click", () => focusPlace(p));
      markersRef.current.push(marker);
    });

    if (places.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      places.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }));
      mapInstance.current.fitBounds(bounds, 60);
    }
  }, [places]);

  const focusPlace = (p: Place) => {
    setSelectedId(p.id);
    if (mapInstance.current) {
      mapInstance.current.panTo({ lat: p.lat, lng: p.lng });
      mapInstance.current.setZoom(15);
    }
    if (infoRef.current && mapInstance.current) {
      infoRef.current.setContent(`
        <div style="padding:8px;max-width:240px;font-family:system-ui,sans-serif;">
          <h3 style="margin:0 0 4px;font-size:14px;font-weight:700;">${p.name}</h3>
          ${p.address ? `<p style="margin:0 0 4px;font-size:12px;color:#666;">${p.address}</p>` : ""}
          ${p.rating ? `<p style="margin:0;font-size:12px;color:#F97316;font-weight:600;">★ ${p.rating.toFixed(1)} (${p.userRatingsTotal ?? 0})</p>` : ""}
        </div>
      `);
      infoRef.current.setPosition({ lat: p.lat, lng: p.lng });
      infoRef.current.open(mapInstance.current);
    }
  };

  const activeCategory = useMemo(() => CATEGORIES.find((c) => c.id === activeCat)!, [activeCat]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 lg:px-8 pt-24 pb-12">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/">
            <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground">
              Explore {cityName || "the City"}
            </h1>
            <p className="text-sm text-muted-foreground">Top-rated spots near you, powered by Google</p>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-1 border-b border-border mb-6 overflow-x-auto">
          {CATEGORIES.map((c) => {
            const Icon = c.icon;
            const active = c.id === activeCat;
            return (
              <button
                key={c.id}
                onClick={() => setActiveCat(c.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                  active
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {c.label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* List */}
          <div className="space-y-3 lg:max-h-[70vh] lg:overflow-y-auto lg:pr-2">
            {loading && (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Finding the best {activeCategory.label.toLowerCase()}...
              </div>
            )}
            {!loading && places.length === 0 && (
              <p className="text-center py-12 text-muted-foreground">No {activeCategory.label.toLowerCase()} found nearby.</p>
            )}
            {places.map((p, idx) => (
              <button
                key={p.id}
                onClick={() => focusPlace(p)}
                className={`w-full text-left bg-card border rounded-xl p-4 flex items-center gap-3 transition-all hover:shadow-md ${
                  selectedId === p.id ? "border-primary shadow-orange" : "border-border"
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold flex-shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{p.name}</h3>
                  {p.address && <p className="text-xs text-muted-foreground truncate">{p.address}</p>}
                  {p.rating && (
                    <div className="flex items-center gap-1 mt-1 text-xs">
                      <Star className="w-3 h-3 fill-primary text-primary" />
                      <span className="font-semibold text-foreground">{p.rating.toFixed(1)}</span>
                      <span className="text-muted-foreground">({p.userRatingsTotal ?? 0})</span>
                    </div>
                  )}
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name)}&query_place_id=${p.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="px-4 py-2 rounded-lg bg-foreground text-background text-sm font-semibold hover:opacity-90"
                >
                  Go
                </a>
              </button>
            ))}
          </div>

          {/* Map */}
          <div className="relative">
            <div ref={mapRef} className="w-full h-[60vh] lg:h-[70vh] rounded-2xl border border-border overflow-hidden bg-muted" />
            {!mapReady && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            )}
            <Button
              size="sm"
              variant="glass"
              className="absolute bottom-4 right-4 shadow-lg"
              onClick={() => center && mapInstance.current?.panTo(center)}
            >
              <Navigation className="w-4 h-4 mr-1" /> My Location
            </Button>
            <div className="absolute top-4 left-4 bg-card/95 backdrop-blur-sm border border-border rounded-xl px-3 py-2 shadow-lg">
              <span className="text-xs font-medium text-foreground">
                <MapPin className="w-3 h-3 inline mr-1 text-primary" />
                {places.length} {activeCategory.label.toLowerCase()}
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
