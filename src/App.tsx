import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Pages
import Index from "./pages/Index";
import Vehicles from "./pages/Vehicles";
import VehicleDetail from "./pages/VehicleDetail";
import Booking from "./pages/Booking";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import TrackBooking from "./pages/TrackBooking";
import CustomerProfile from "./pages/CustomerProfile";

// Auth Pages
import CustomerLogin from "./pages/auth/CustomerLogin";
import CustomerSignup from "./pages/auth/CustomerSignup";
import ForgotPassword from "./pages/auth/ForgotPassword";
import PartnerLogin from "./pages/auth/PartnerLogin";
import PartnerSignup from "./pages/auth/PartnerSignup";

// Partner Dashboard
import PartnerDashboard from "./pages/partner/PartnerDashboard";

// Admin Dashboard
import AdminDashboard from "./pages/admin/AdminDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/vehicles" element={<Vehicles />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/vehicles/:id" element={<VehicleDetail />} />
            
            {/* Customer Auth Routes */}
            <Route path="/login" element={<CustomerLogin />} />
            <Route path="/register" element={<CustomerSignup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            {/* Partner Auth Routes */}
            <Route path="/partner/login" element={<PartnerLogin />} />
            <Route path="/partner/signup" element={<PartnerSignup />} />
            
            {/* Protected Customer Routes */}
            <Route
              path="/booking/:id"
              element={
                <ProtectedRoute allowedRoles={["customer"]}>
                  <Booking />
                </ProtectedRoute>
              }
            />
            <Route
              path="/track/:bookingId"
              element={
                <ProtectedRoute allowedRoles={["customer"]}>
                  <TrackBooking />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute allowedRoles={["customer"]}>
                  <CustomerProfile />
                </ProtectedRoute>
              }
            />
            
            {/* Protected Partner Routes */}
            {[
              "/partner/dashboard",
              "/partner/dashboard/vehicles",
              "/partner/dashboard/bookings",
              "/partner/dashboard/earnings",
              "/partner/dashboard/analytics",
              "/partner/dashboard/settings",
              "/partner/dashboard/support",
            ].map((path) => (
              <Route
                key={path}
                path={path}
                element={
                  <ProtectedRoute allowedRoles={["partner"]} redirectTo="/partner/login">
                    <PartnerDashboard />
                  </ProtectedRoute>
                }
              />
            ))}

            {/* Protected Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={["admin"]} redirectTo="/login">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
