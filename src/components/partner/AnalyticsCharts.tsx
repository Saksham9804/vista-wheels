import { useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { format, subDays, startOfDay } from "date-fns";

interface BookingRow {
  id: string;
  amount: number;
  status: string | null;
  payment_status: string | null;
  created_at: string;
}

interface AnalyticsChartsProps {
  bookings: BookingRow[];
}

export function AnalyticsCharts({ bookings }: AnalyticsChartsProps) {
  const { bookingTrends, revenueTrends } = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      return {
        date: format(date, "MMM dd"),
        dateKey: format(startOfDay(date), "yyyy-MM-dd"),
        bookings: 0,
        revenue: 0,
      };
    });

    bookings.forEach((b) => {
      const day = format(new Date(b.created_at), "yyyy-MM-dd");
      const entry = last7Days.find((d) => d.dateKey === day);
      if (entry) {
        entry.bookings += 1;
        if (b.payment_status === "completed") {
          entry.revenue += b.amount;
        }
      }
    });

    return {
      bookingTrends: last7Days.map(({ date, bookings }) => ({ date, bookings })),
      revenueTrends: last7Days.map(({ date, revenue }) => ({ date, revenue })),
    };
  }, [bookings]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
        <Card>
          <CardHeader><CardTitle className="text-lg">Booking Trends (Last 7 Days)</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={bookingTrends}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                  <Line type="monotone" dataKey="bookings" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
        <Card>
          <CardHeader><CardTitle className="text-lg">Revenue (Last 7 Days)</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueTrends}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} formatter={(value: number) => `₹${value.toLocaleString()}`} />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
