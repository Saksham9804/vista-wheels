/// <reference types="google.maps" />
import { useRef, useEffect, useState, useCallback } from "react";
import { MapPin, Loader2, Navigation, X } from "lucide-react";
import { GOOGLE_MAPS_API_KEY } from "@/lib/googleMaps";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    google: typeof google;
  }
}

export interface LocationData {
  formatted_address: string;
  latitude: number;
  longitude: number;
  place_id: string;
  locality: string;
  administrative_area: string;
  country: string;
  postal_code: string;
}

interface LocationSelectorProps {
  value: string;
  onChange: (value: string) => void;
  onLocationSelect: (location: LocationData | null) => void;
  placeholder?: string;
  className?: string;
}

let googleMapsLoaded = false;
let googleMapsLoadPromise: Promise<void> | null = null;

function loadGoogleMaps(): Promise<void> {
  if (googleMapsLoaded && window.google?.maps?.places) return Promise.resolve();
  if (googleMapsLoadPromise) return googleMapsLoadPromise;

  googleMapsLoadPromise = new Promise((resolve, reject) => {
    if (window.google?.maps?.places) {
      googleMapsLoaded = true;
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => { googleMapsLoaded = true; resolve(); };
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });

  return googleMapsLoadPromise;
}

function extractComponent(components: google.maps.GeocoderAddressComponent[], type: string): string {
  return components.find((c) => c.types.includes(type))?.long_name || "";
}

export default function LocationSelector({
  value,
  onChange,
  onLocationSelect,
  placeholder = "Search for your location...",
  className = "",
}: LocationSelectorProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocating, setIsLocating] = useState(false);
  const [hasSelection, setHasSelection] = useState(false);

  // Initialize Google Places Autocomplete
  useEffect(() => {
    let mounted = true;

    loadGoogleMaps().then(() => {
      if (!mounted || !inputRef.current) return;
      setIsLoading(false);

      autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: "in" },
        fields: ["address_components", "geometry", "formatted_address", "place_id"],
        types: ["geocode", "establishment"],
      });

      autocompleteRef.current.addListener("place_changed", () => {
        const place = autocompleteRef.current?.getPlace();
        if (!place?.geometry?.location || !place.address_components) return;

        const locationData: LocationData = {
          formatted_address: place.formatted_address || "",
          latitude: place.geometry.location.lat(),
          longitude: place.geometry.location.lng(),
          place_id: place.place_id || "",
          locality:
            extractComponent(place.address_components, "locality") ||
            extractComponent(place.address_components, "administrative_area_level_2"),
          administrative_area: extractComponent(place.address_components, "administrative_area_level_1"),
          country: extractComponent(place.address_components, "country"),
          postal_code: extractComponent(place.address_components, "postal_code"),
        };

        onChange(locationData.formatted_address);
        onLocationSelect(locationData);
        setHasSelection(true);
      });
    }).catch(() => {
      if (mounted) setIsLoading(false);
    });

    return () => { mounted = false; };
  }, []);

  // "Use My Location" via browser geolocation + reverse geocoding
  const handleUseMyLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const geocoder = new window.google.maps.Geocoder();
          const result = await geocoder.geocode({ location: { lat: latitude, lng: longitude } });
          const place = result.results?.[0];

          if (place) {
            const locationData: LocationData = {
              formatted_address: place.formatted_address,
              latitude,
              longitude,
              place_id: place.place_id,
              locality:
                extractComponent(place.address_components || [], "locality") ||
                extractComponent(place.address_components || [], "administrative_area_level_2"),
              administrative_area: extractComponent(place.address_components || [], "administrative_area_level_1"),
              country: extractComponent(place.address_components || [], "country"),
              postal_code: extractComponent(place.address_components || [], "postal_code"),
            };
            onChange(locationData.formatted_address);
            onLocationSelect(locationData);
            setHasSelection(true);
          }
        } catch {
          // silently fail
        } finally {
          setIsLocating(false);
        }
      },
      () => setIsLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [onChange, onLocationSelect]);

  const handleClear = () => {
    onChange("");
    onLocationSelect(null);
    setHasSelection(false);
    inputRef.current?.focus();
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative flex-1">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary z-10" />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin z-10" />
        )}
        {hasSelection && !isLoading && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-0.5 rounded-full hover:bg-accent transition-colors"
            aria-label="Clear location"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (hasSelection) setHasSelection(false);
          }}
          placeholder={isLoading ? "Loading maps..." : placeholder}
          disabled={isLoading}
          className="flex h-11 w-full rounded-xl border border-input bg-card px-3 py-2 pl-10 pr-9 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm shadow-sm"
          autoComplete="off"
        />
      </div>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-11 w-11 flex-shrink-0 rounded-xl border-input"
        onClick={handleUseMyLocation}
        disabled={isLoading || isLocating}
        title="Use my current location"
        aria-label="Use my current location"
      >
        {isLocating ? (
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        ) : (
          <Navigation className="w-5 h-5 text-primary" />
        )}
      </Button>
    </div>
  );
}
