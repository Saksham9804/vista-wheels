import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, MoreHorizontal, Edit, Trash2, Eye, Grid, List } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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

interface VehiclesListProps {
  vehicles: VehicleRow[];
  onAddVehicle?: () => void;
  onRefetch?: () => void;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  approved: { label: "Approved", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  pending_approval: { label: "Pending", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  rejected: { label: "Rejected", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

const vehicleTypeIcons: Record<string, string> = {
  bike: "🏍️",
  scooty: "🛵",
  car: "🚗",
};

export function VehiclesList({ vehicles, onAddVehicle, onRefetch }: VehiclesListProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const filteredVehicles = vehicles.filter(
    (v) =>
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.registration_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAvailabilityToggle = async (vehicleId: string, available: boolean) => {
    const { error } = await supabase
      .from("vehicles")
      .update({ available })
      .eq("id", vehicleId);

    if (error) {
      toast({ variant: "destructive", title: "Failed to update availability" });
      return;
    }
    toast({
      title: available ? "Vehicle Available" : "Vehicle Unavailable",
      description: `Vehicle marked as ${available ? "available" : "unavailable"}.`,
    });
    onRefetch?.();
  };

  const handleDelete = async (vehicleId: string) => {
    const { error } = await supabase.from("vehicles").delete().eq("id", vehicleId);
    if (error) {
      toast({ variant: "destructive", title: "Failed to delete vehicle" });
      return;
    }
    toast({ title: "Vehicle deleted" });
    onRefetch?.();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.3 }}>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle>My Vehicles</CardTitle>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input placeholder="Search vehicles..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full sm:w-48" />
            <div className="flex items-center gap-2">
              <div className="flex items-center border border-border rounded-lg p-1">
                <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="icon" className="h-8 w-8" onClick={() => setViewMode("grid")}><Grid className="w-4 h-4" /></Button>
                <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="icon" className="h-8 w-8" onClick={() => setViewMode("list")}><List className="w-4 h-4" /></Button>
              </div>
              <Button onClick={onAddVehicle}><Plus className="w-4 h-4 mr-2" />Add Vehicle</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVehicles.map((vehicle) => (
                <div key={vehicle.id} className="border border-border rounded-xl p-4 hover:shadow-lg transition-shadow">
                  <div className="w-full h-32 bg-accent rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                    {vehicle.photos && vehicle.photos.length > 0 ? (
                      <img src={vehicle.photos[0]} alt={vehicle.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl">{vehicleTypeIcons[vehicle.vehicle_type] || "🚗"}</span>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground">{vehicle.name}</h3>
                        <p className="text-sm text-muted-foreground">{vehicle.registration_number}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="flex items-center gap-2"><Edit className="w-4 h-4" />Edit</DropdownMenuItem>
                          <DropdownMenuItem className="flex items-center gap-2"><Eye className="w-4 h-4" />View Stats</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="flex items-center gap-2 text-destructive" onClick={() => handleDelete(vehicle.id)}><Trash2 className="w-4 h-4" />Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <Badge className={statusConfig[vehicle.status || "pending_approval"]?.className} variant="secondary">
                      {statusConfig[vehicle.status || "pending_approval"]?.label}
                    </Badge>
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <span className="font-semibold text-foreground">₹{vehicle.price_per_day}/day</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Available</span>
                        <Switch checked={vehicle.available ?? false} onCheckedChange={(checked) => handleAvailabilityToggle(vehicle.id, checked)} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredVehicles.map((vehicle) => (
                <div key={vehicle.id} className="flex items-center gap-4 p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="w-16 h-16 bg-accent rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                    {vehicle.photos && vehicle.photos.length > 0 ? (
                      <img src={vehicle.photos[0]} alt={vehicle.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl">{vehicleTypeIcons[vehicle.vehicle_type] || "🚗"}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-foreground truncate">{vehicle.name}</h3>
                      <Badge className={statusConfig[vehicle.status || "pending_approval"]?.className} variant="secondary">
                        {statusConfig[vehicle.status || "pending_approval"]?.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{vehicle.registration_number}</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="font-semibold text-foreground">₹{vehicle.price_per_day}/day</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch checked={vehicle.available ?? false} onCheckedChange={(checked) => handleAvailabilityToggle(vehicle.id, checked)} />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="flex items-center gap-2"><Edit className="w-4 h-4" />Edit</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="flex items-center gap-2 text-destructive" onClick={() => handleDelete(vehicle.id)}><Trash2 className="w-4 h-4" />Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredVehicles.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No vehicles found.</p>
              <Button variant="outline" className="mt-4" onClick={onAddVehicle}>
                <Plus className="w-4 h-4 mr-2" />Add Your First Vehicle
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
