import { useState } from "react";
import { Package, Bike, DollarSign, CheckCircle } from "lucide-react";
import { PartnerLayout } from "@/components/partner/PartnerLayout";
import { StatsCard } from "@/components/partner/StatsCard";
import { OrdersTable } from "@/components/partner/OrdersTable";
import { VehiclesList } from "@/components/partner/VehiclesList";
import { AnalyticsCharts } from "@/components/partner/AnalyticsCharts";
import { AddVehicleDialog } from "@/components/partner/AddVehicleDialog";
import { usePartnerDashboard } from "@/hooks/usePartnerDashboard";
import { Loader2 } from "lucide-react";

export default function PartnerDashboard() {
  const [addVehicleOpen, setAddVehicleOpen] = useState(false);
  const { stats, bookings, vehicles, loading, refetch } = usePartnerDashboard();

  if (loading) {
    return (
      <PartnerLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PartnerLayout>
    );
  }

  return (
    <PartnerLayout>
      <div className="space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Today's Orders"
            value={stats.todaysOrders}
            subtitle="New bookings today"
            icon={Package}
            delay={0}
          />
          <StatsCard
            title="Active Rentals"
            value={stats.activeRentals}
            subtitle="Currently on road"
            icon={Bike}
            delay={0.1}
          />
          <StatsCard
            title="Today's Revenue"
            value={`₹${stats.todaysRevenue.toLocaleString()}`}
            subtitle="From completed payments"
            icon={DollarSign}
            delay={0.2}
          />
          <StatsCard
            title="Available Now"
            value={stats.availableVehicles}
            subtitle={`Out of ${stats.totalVehicles} total`}
            icon={CheckCircle}
            delay={0.3}
          />
        </div>

        {/* Orders Table */}
        <OrdersTable bookings={bookings} />

        {/* Vehicles Overview */}
        <VehiclesList
          vehicles={vehicles}
          onAddVehicle={() => setAddVehicleOpen(true)}
          onRefetch={refetch}
        />

        {/* Analytics Charts */}
        <AnalyticsCharts bookings={bookings} />

        {/* Add Vehicle Dialog */}
        <AddVehicleDialog
          open={addVehicleOpen}
          onOpenChange={setAddVehicleOpen}
          onSuccess={refetch}
        />
      </div>
    </PartnerLayout>
  );
}
