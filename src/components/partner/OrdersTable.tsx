import { useState } from "react";
import { motion } from "framer-motion";
import { MoreHorizontal, Phone, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface Order {
  id: string;
  customer: {
    name: string;
    phone: string;
  };
  vehicle: {
    name: string;
    registrationNumber: string;
  };
  pickupTime: string;
  returnTime: string;
  duration: string;
  status: "active" | "pending" | "upcoming" | "completed" | "overdue" | "cancelled";
  amount: number;
}

const mockOrders: Order[] = [
  {
    id: "ORD-1234",
    customer: { name: "Rahul Sharma", phone: "+91 98765 43210" },
    vehicle: { name: "Royal Enfield Himalayan", registrationNumber: "DL-01-AB-1234" },
    pickupTime: "10:00 AM",
    returnTime: "Tomorrow 10:00 AM",
    duration: "1 day",
    status: "active",
    amount: 1200,
  },
  {
    id: "ORD-1235",
    customer: { name: "Priya Patel", phone: "+91 87654 32109" },
    vehicle: { name: "Honda Activa 6G", registrationNumber: "DL-02-CD-5678" },
    pickupTime: "2:00 PM",
    returnTime: "4:00 PM",
    duration: "2 hours",
    status: "pending",
    amount: 150,
  },
  {
    id: "ORD-1236",
    customer: { name: "Amit Kumar", phone: "+91 76543 21098" },
    vehicle: { name: "Maruti Swift", registrationNumber: "DL-03-EF-9012" },
    pickupTime: "Tomorrow 9:00 AM",
    returnTime: "Feb 12, 5:00 PM",
    duration: "3 days",
    status: "upcoming",
    amount: 4500,
  },
  {
    id: "ORD-1237",
    customer: { name: "Sneha Gupta", phone: "+91 65432 10987" },
    vehicle: { name: "Yamaha FZ-S", registrationNumber: "DL-04-GH-3456" },
    pickupTime: "Yesterday 8:00 AM",
    returnTime: "Today 8:00 AM",
    duration: "1 day",
    status: "completed",
    amount: 800,
  },
  {
    id: "ORD-1238",
    customer: { name: "Vikram Singh", phone: "+91 54321 09876" },
    vehicle: { name: "TVS Jupiter", registrationNumber: "DL-05-IJ-7890" },
    pickupTime: "2 days ago",
    returnTime: "Yesterday 6:00 PM",
    duration: "1 day",
    status: "overdue",
    amount: 500,
  },
];

const statusColors: Record<Order["status"], string> = {
  active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  upcoming: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  completed: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
  overdue: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  cancelled: "bg-gray-100 text-gray-500 dark:bg-gray-900/30 dark:text-gray-500",
};

export function OrdersTable() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 5;

  const filteredOrders = mockOrders.filter((order) => {
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ordersPerPage,
    currentPage * ordersPerPage
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle>Today's Orders</CardTitle>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-48"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Order ID
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Customer
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden md:table-cell">
                    Vehicle
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">
                    Duration
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                    Amount
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-border hover:bg-accent/50 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <span className="font-medium text-foreground">{order.id}</span>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-foreground">{order.customer.name}</p>
                        <p className="text-sm text-muted-foreground">{order.customer.phone}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4 hidden md:table-cell">
                      <div>
                        <p className="font-medium text-foreground">{order.vehicle.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.vehicle.registrationNumber}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-4 hidden lg:table-cell">
                      <div>
                        <p className="text-sm text-foreground">{order.pickupTime}</p>
                        <p className="text-sm text-muted-foreground">{order.duration}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Badge className={statusColors[order.status]} variant="secondary">
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="font-semibold text-foreground">₹{order.amount}</span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="flex items-center gap-2">
                            <Eye className="w-4 h-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            Contact Customer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * ordersPerPage + 1} to{" "}
                {Math.min(currentPage * ordersPerPage, filteredOrders.length)} of{" "}
                {filteredOrders.length} orders
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm font-medium">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
