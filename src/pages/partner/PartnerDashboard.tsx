import { Package, Bike, DollarSign, CheckCircle } from "lucide-react";
import { PartnerLayout } from "@/components/partner/PartnerLayout";
import { StatsCard } from "@/components/partner/StatsCard";
import { OrdersTable } from "@/components/partner/OrdersTable";
import { VehiclesList } from "@/components/partner/VehiclesList";
import { AnalyticsCharts } from "@/components/partner/AnalyticsCharts";

export default function PartnerDashboard() {
  return (
    <PartnerLayout>
      <div className="space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Today's Orders"
            value={15}
            change={25}
            changeLabel="from yesterday"
            icon={Package}
            delay={0}
          />
          <StatsCard
            title="Active Rentals"
            value={28}
            subtitle="Currently on road"
            icon={Bike}
            delay={0.1}
          />
          <StatsCard
            title="Today's Revenue"
            value="₹12,500"
            change={15}
            changeLabel="from yesterday"
            icon={DollarSign}
            delay={0.2}
          />
          <StatsCard
            title="Available Now"
            value={32}
            subtitle="Out of 60 total"
            icon={CheckCircle}
            delay={0.3}
          />
        </div>

        {/* Orders Table */}
        <OrdersTable />

        {/* Vehicles Overview */}
        <VehiclesList />

        {/* Analytics Charts */}
        <AnalyticsCharts />
      </div>
    </PartnerLayout>
  );
}
