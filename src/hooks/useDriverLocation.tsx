import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useDriverLocationPush(bookingId: string | null) {
  const { partner } = useAuth();
  const [isTracking, setIsTracking] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  const startTracking = useCallback(async () => {
    if (!bookingId || !partner || !navigator.geolocation) return;

    setIsTracking(true);

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        await supabase.from("driver_locations").upsert(
          {
            booking_id: bookingId,
            driver_id: partner.id,
            lat,
            lng,
            updated_at: new Date().toISOString(),
            is_active: true,
          },
          { onConflict: "booking_id" }
        );
      },
      (err) => console.error("GPS error:", err),
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    );
  }, [bookingId, partner]);

  const stopTracking = useCallback(async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);

    if (bookingId) {
      await supabase
        .from("driver_locations")
        .update({ is_active: false })
        .eq("booking_id", bookingId);
    }
  }, [bookingId]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return { isTracking, startTracking, stopTracking };
}

export function useDriverLocationSubscription(bookingId: string | null) {
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!bookingId) return;

    // Fetch initial location
    const fetchInitial = async () => {
      const { data } = await supabase
        .from("driver_locations")
        .select("lat, lng, is_active")
        .eq("booking_id", bookingId)
        .maybeSingle();

      if (data) {
        setDriverLocation({ lat: data.lat, lng: data.lng });
        setIsActive(data.is_active);
      }
    };
    fetchInitial();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`driver_loc_${bookingId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "driver_locations",
          filter: `booking_id=eq.${bookingId}`,
        },
        (payload: any) => {
          const newData = payload.new;
          if (newData) {
            setDriverLocation({ lat: newData.lat, lng: newData.lng });
            setIsActive(newData.is_active);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId]);

  return { driverLocation, isActive };
}

export function useBookingStatusSubscription(bookingId: string | null) {
  const [status, setStatus] = useState<string | null>(null);
  const [bookingDetails, setBookingDetails] = useState<any>(null);

  useEffect(() => {
    if (!bookingId) return;

    const fetchInitial = async () => {
      const { data } = await supabase
        .from("active_bookings")
        .select("*")
        .eq("booking_id", bookingId)
        .maybeSingle();

      if (data) {
        setStatus(data.status);
        setBookingDetails(data);
      }
    };
    fetchInitial();

    const channel = supabase
      .channel(`booking_status_${bookingId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "active_bookings",
          filter: `booking_id=eq.${bookingId}`,
        },
        (payload: any) => {
          const newData = payload.new;
          if (newData) {
            setStatus(newData.status);
            setBookingDetails(newData);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId]);

  return { status, bookingDetails };
}
