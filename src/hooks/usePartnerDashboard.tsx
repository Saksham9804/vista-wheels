import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface DashboardStats {
  todaysOrders: number;
  activeRentals: number;
  todaysRevenue: number;
  availableVehicles: number;
  totalVehicles: number;
}

interface BookingRow {
  id: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  vehicle_id: string;
  pickup_time: string;
  return_time: string;
  duration: string | null;
  status: string | null;
  amount: number;
  payment_status: string | null;
  created_at: string;
  vehicles?: { name: string; registration_number: string } | null;
}

interface VehicleRow {
  id: string;
  name: string;
  brand: string;
  registration_number: string;
  vehicle_type: string;
  price_per_day: number;
  status: string | null;
  available: boolean | null;
  photos: string[] | null;
}

export function usePartnerDashboard() {
  const { partner } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    todaysOrders: 0,
    activeRentals: 0,
    todaysRevenue: 0,
    availableVehicles: 0,
    totalVehicles: 0,
  });
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [vehicles, setVehicles] = useState<VehicleRow[]>([]);
  const [loading, setLoading] = useState(true);

  const partnerId = partner?.id;

  const fetchData = async () => {
    if (!partnerId) {
      setLoading(false);
      return;
    }

    try {
      // Fetch bookings
      const { data: bookingsData } = await supabase
        .from("bookings")
        .select("*, vehicles(name, registration_number)")
        .eq("partner_id", partnerId)
        .order("created_at", { ascending: false });

      // Fetch vehicles
      const { data: vehiclesData } = await supabase
        .from("vehicles")
        .select("*")
        .eq("partner_id", partnerId);

      const allBookings = (bookingsData || []) as BookingRow[];
      const allVehicles = (vehiclesData || []) as VehicleRow[];

      setBookings(allBookings);
      setVehicles(allVehicles);

      // Calculate stats
      const today = new Date().toISOString().split("T")[0];
      const todaysBookings = allBookings.filter(
        (b) => b.created_at.startsWith(today)
      );
      const activeRentals = allBookings.filter(
        (b) => b.status === "active" || b.status === "picked-up"
      );
      const todaysRevenue = todaysBookings
        .filter((b) => b.payment_status === "completed")
        .reduce((sum, b) => sum + b.amount, 0);
      const availableVehicles = allVehicles.filter(
        (v) => v.available === true && v.status === "approved"
      );

      setStats({
        todaysOrders: todaysBookings.length,
        activeRentals: activeRentals.length,
        todaysRevenue,
        availableVehicles: availableVehicles.length,
        totalVehicles: allVehicles.length,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [partnerId]);

  // Realtime subscriptions
  useEffect(() => {
    if (!partnerId) return;

    const bookingsChannel = supabase
      .channel("partner-bookings")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: `partner_id=eq.${partnerId}`,
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    const vehiclesChannel = supabase
      .channel("partner-vehicles")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "vehicles",
          filter: `partner_id=eq.${partnerId}`,
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(bookingsChannel);
      supabase.removeChannel(vehiclesChannel);
    };
  }, [partnerId]);

  return { stats, bookings, vehicles, loading, refetch: fetchData };
}
