import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, MoreHorizontal, Edit, Trash2, Eye, Power, Grid, List } from "lucide-react";
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

interface Vehicle {
  id: string;
  name: string;
  brand: string;
  registrationNumber: string;
  vehicleType: "bike" | "scooty" | "car";
  pricePerDay: number;
  status: "available" | "rented" | "maintenance" | "pending_approval";
  available: boolean;
  bookingsToday: number;
  photo?: string;
}

const mockVehicles: Vehicle[] = [
  {
    id: "1",
    name: "Royal Enfield Himalayan",
    brand: "Royal Enfield",
    registrationNumber: "DL-01-AB-1234",
    vehicleType: "bike",
    pricePerDay: 1200,
    status: "available",
    available: true,
    bookingsToday: 2,
  },
  {
    id: "2",
    name: "Honda Activa 6G",
    brand: "Honda",
    registrationNumber: "DL-02-CD-5678",
    vehicleType: "scooty",
    pricePerDay: 400,
    status: "rented",
    available: false,
    bookingsToday: 3,
  },
  {
    id: "3",
    name: "Maruti Swift",
    brand: "Maruti Suzuki",
    registrationNumber: "DL-03-EF-9012",
    vehicleType: "car",
    pricePerDay: 1500,
    status: "available",
    available: true,
    bookingsToday: 1,
  },
  {
    id: "4",
    name: "Yamaha FZ-S",
    brand: "Yamaha",
    registrationNumber: "DL-04-GH-3456",
    vehicleType: "bike",
    pricePerDay: 800,
    status: "maintenance",
    available: false,
    bookingsToday: 0,
  },
];

const statusConfig: Record<Vehicle["status"], { label: string; className: string }> = {
  available: { label: "Available", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  rented: { label: "Rented", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  maintenance: { label: "Maintenance", className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  pending_approval: { label: "Pending", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
};

const vehicleTypeIcons: Record<Vehicle["vehicleType"], string> = {
  bike: "🏍️",
  scooty: "🛵",
  car: "🚗",
};

interface VehiclesListProps {
  onAddVehicle?: () => void;
}

export function VehiclesList({ onAddVehicle }: VehiclesListProps) {
  const [vehicles, setVehicles] = useState(mockVehicles);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const filteredVehicles = vehicles.filter(
    (v) =>
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAvailabilityToggle = (vehicleId: string, available: boolean) => {
    setVehicles((prev) =>
      prev.map((v) =>
        v.id === vehicleId
          ? { ...v, available, status: available ? "available" : "rented" }
          : v
      )
    );
    toast({
      title: available ? "Vehicle Available" : "Vehicle Unavailable",
      description: `Vehicle has been marked as ${available ? "available" : "unavailable"}.`,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
    >
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle>My Vehicles</CardTitle>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Search vehicles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-48"
            />
            <div className="flex items-center gap-2">
              <div className="flex items-center border border-border rounded-lg p-1">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewMode("list")}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
              <Button onClick={onAddVehicle}>
                <Plus className="w-4 h-4 mr-2" />
                Add Vehicle
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVehicles.map((vehicle) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  onAvailabilityToggle={handleAvailabilityToggle}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredVehicles.map((vehicle) => (
                <VehicleRow
                  key={vehicle.id}
                  vehicle={vehicle}
                  onAvailabilityToggle={handleAvailabilityToggle}
                />
              ))}
            </div>
          )}

          {filteredVehicles.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No vehicles found.</p>
              <Button variant="outline" className="mt-4" onClick={onAddVehicle}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Vehicle
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function VehicleCard({
  vehicle,
  onAvailabilityToggle,
}: {
  vehicle: Vehicle;
  onAvailabilityToggle: (id: string, available: boolean) => void;
}) {
  return (
    <div className="border border-border rounded-xl p-4 hover:shadow-lg transition-shadow">
      {/* Vehicle Image Placeholder */}
      <div className="w-full h-32 bg-accent rounded-lg mb-4 flex items-center justify-center text-4xl">
        {vehicleTypeIcons[vehicle.vehicleType]}
      </div>

      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-foreground">{vehicle.name}</h3>
            <p className="text-sm text-muted-foreground">{vehicle.registrationNumber}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="flex items-center gap-2">
                <Edit className="w-4 h-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                View Stats
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex items-center gap-2 text-destructive">
                <Trash2 className="w-4 h-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center justify-between">
          <Badge className={statusConfig[vehicle.status].className} variant="secondary">
            {statusConfig[vehicle.status].label}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {vehicle.bookingsToday} bookings today
          </span>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="font-semibold text-foreground">₹{vehicle.pricePerDay}/day</span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Available</span>
            <Switch
              checked={vehicle.available}
              onCheckedChange={(checked) => onAvailabilityToggle(vehicle.id, checked)}
              disabled={vehicle.status === "maintenance"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function VehicleRow({
  vehicle,
  onAvailabilityToggle,
}: {
  vehicle: Vehicle;
  onAvailabilityToggle: (id: string, available: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-4 p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors">
      <div className="w-16 h-16 bg-accent rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
        {vehicleTypeIcons[vehicle.vehicleType]}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-foreground truncate">{vehicle.name}</h3>
          <Badge className={statusConfig[vehicle.status].className} variant="secondary">
            {statusConfig[vehicle.status].label}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {vehicle.registrationNumber} • {vehicle.bookingsToday} bookings today
        </p>
      </div>

      <div className="text-right hidden sm:block">
        <p className="font-semibold text-foreground">₹{vehicle.pricePerDay}/day</p>
      </div>

      <div className="flex items-center gap-3">
        <Switch
          checked={vehicle.available}
          onCheckedChange={(checked) => onAvailabilityToggle(vehicle.id, checked)}
          disabled={vehicle.status === "maintenance"}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="flex items-center gap-2">
              <Edit className="w-4 h-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              View Stats
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-4 h-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
