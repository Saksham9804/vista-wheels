/// <reference types="google.maps" />
import { useRef, useEffect, useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { GOOGLE_MAPS_API_KEY } from "@/lib/googleMaps";

declare global {
  interface Window {
    google: typeof google;
  }
}

interface PlaceResult {
  address: string;
  city: string;
  state: string;
  pinCode: string;
  latitude: number;
  longitude: number;
}

interface PlacesAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect: (place: PlaceResult) => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
}

let googleMapsLoaded = false;
let googleMapsLoadPromise: Promise<void> | null = null;

function loadGoogleMaps(): Promise<void> {
  if (googleMapsLoaded && window.google?.maps?.places) {
    return Promise.resolve();
  }
  if (googleMapsLoadPromise) return googleMapsLoadPromise;

  googleMapsLoadPromise = new Promise((resolve, reject) => {
    if (window.google?.maps?.places) {
      googleMapsLoaded = true;
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      googleMapsLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });

  return googleMapsLoadPromise;
}

function extractAddressComponent(components: google.maps.GeocoderAddressComponent[], type: string): string {
  const component = components.find((c) => c.types.includes(type));
  return component?.long_name || "";
}

export default function PlacesAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  placeholder = "Search for your business address...",
  className = "",
  error = false,
}: PlacesAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    loadGoogleMaps().then(() => {
      if (!mounted || !inputRef.current) return;
      setIsLoading(false);

      autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: "in" },
        fields: ["address_components", "geometry", "formatted_address"],
        types: ["establishment", "geocode"],
      });

      autocompleteRef.current.addListener("place_changed", () => {
        const place = autocompleteRef.current?.getPlace();
        if (!place?.geometry?.location || !place.address_components) return;

        const result: PlaceResult = {
          address: place.formatted_address || "",
          city:
            extractAddressComponent(place.address_components, "locality") ||
            extractAddressComponent(place.address_components, "administrative_area_level_2"),
          state: extractAddressComponent(place.address_components, "administrative_area_level_1"),
          pinCode: extractAddressComponent(place.address_components, "postal_code"),
          latitude: place.geometry.location.lat(),
          longitude: place.geometry.location.lng(),
        };

        onChange(result.address);
        onPlaceSelect(result);
      });
    }).catch(() => {
      if (mounted) setIsLoading(false);
    });

    return () => { mounted = false; };
  }, []);

  return (
    <div className="relative">
      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
      {isLoading && (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin z-10" />
      )}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={isLoading ? "Loading maps..." : placeholder}
        disabled={isLoading}
        className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 pl-10 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm ${
          error ? "border-destructive" : "border-input"
        } ${className}`}
      />
    </div>
  );
}
