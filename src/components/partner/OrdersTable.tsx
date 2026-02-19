import { useState } from "react";
import { motion } from "framer-motion";
import { MoreHorizontal, Phone, Eye, ChevronLeft, ChevronRight, Play, Square } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDriverLocationPush } from "@/hooks/useDriverLocation";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

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

interface OrdersTableProps {
  bookings: BookingRow[];
}

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  "picked-up": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  upcoming: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  completed: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
  overdue: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  cancelled: "bg-gray-100 text-gray-500 dark:bg-gray-900/30 dark:text-gray-500",
};

export function OrdersTable({ bookings }: OrdersTableProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeRideBookingId, setActiveRideBookingId] = useState<string | null>(null);
  const { isTracking, startTracking, stopTracking } = useDriverLocationPush(activeRideBookingId);
  const { toast } = useToast();
  const ordersPerPage = 5;

  const filteredOrders = bookings.filter((order) => {
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.customer_name || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ordersPerPage,
    currentPage * ordersPerPage
  );

  if (bookings.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
        <Card>
          <CardHeader><CardTitle>Orders</CardTitle></CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <p className="text-muted-foreground">No bookings yet. Orders will appear here once customers book your vehicles.</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle>Orders</CardTitle>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input placeholder="Search orders..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full sm:w-48" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Filter status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Order ID</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Customer</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Vehicle</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">Pickup</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Amount</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.map((order) => (
                  <tr key={order.id} className="border-b border-border hover:bg-accent/50 transition-colors">
                    <td className="py-4 px-4">
                      <span className="font-medium text-foreground text-sm">{order.id.slice(0, 8)}</span>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-foreground">{order.customer_name || "—"}</p>
                        <p className="text-sm text-muted-foreground">{order.customer_phone || ""}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4 hidden md:table-cell">
                      <div>
                        <p className="font-medium text-foreground">{order.vehicles?.name || "—"}</p>
                        <p className="text-sm text-muted-foreground">{order.vehicles?.registration_number || ""}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4 hidden lg:table-cell">
                      <p className="text-sm text-foreground">{format(new Date(order.pickup_time), "dd MMM, hh:mm a")}</p>
                      <p className="text-sm text-muted-foreground">{order.duration || ""}</p>
                    </td>
                    <td className="py-4 px-4">
                      <Badge className={statusColors[order.status || "pending"]} variant="secondary">
                        {(order.status || "pending").charAt(0).toUpperCase() + (order.status || "pending").slice(1)}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="font-semibold text-foreground">₹{order.amount.toLocaleString()}</span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="flex items-center gap-2"><Eye className="w-4 h-4" />View Details</DropdownMenuItem>
                          <DropdownMenuItem className="flex items-center gap-2"><Phone className="w-4 h-4" />Contact Customer</DropdownMenuItem>
                          {(order.status === "confirmed" || order.status === "active") && !isTracking && (
                            <DropdownMenuItem
                              className="flex items-center gap-2 text-primary"
                              onClick={async () => {
                                setActiveRideBookingId(order.id);
                                // Update active_bookings status
                                await supabase.from("active_bookings").update({ status: "in_progress" }).eq("booking_id", order.id);
                                await supabase.from("bookings").update({ status: "active" }).eq("id", order.id);
                                setTimeout(() => startTracking(), 100);
                                toast({ title: "🚗 Ride started!", description: "GPS tracking is now active." });
                              }}
                            >
                              <Play className="w-4 h-4" />Start Ride
                            </DropdownMenuItem>
                          )}
                          {isTracking && activeRideBookingId === order.id && (
                            <DropdownMenuItem
                              className="flex items-center gap-2 text-destructive"
                              onClick={async () => {
                                await stopTracking();
                                await supabase.from("active_bookings").update({ status: "completed" }).eq("booking_id", order.id);
                                await supabase.from("bookings").update({ status: "completed" }).eq("id", order.id);
                                setActiveRideBookingId(null);
                                toast({ title: "✅ Ride completed!", description: "GPS tracking stopped." });
                              }}
                            >
                              <Square className="w-4 h-4" />End Ride
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * ordersPerPage + 1} to {Math.min(currentPage * ordersPerPage, filteredOrders.length)} of {filteredOrders.length}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft className="w-4 h-4" /></Button>
                <span className="text-sm font-medium">Page {currentPage} of {totalPages}</span>
                <Button variant="outline" size="icon" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}><ChevronRight className="w-4 h-4" /></Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
