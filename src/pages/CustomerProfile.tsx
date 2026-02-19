import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  User, FileText, MapPin, Calendar, Phone, Mail, Shield, ShieldCheck,
  Clock, Car, Loader2, Navigation, CreditCard, ChevronRight, AlertTriangle,
  Eye, EyeOff, Download
} from "lucide-react";
import { format } from "date-fns";

interface ProfileDetails {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  profile_photo: string | null;
  date_of_birth: string | null;
  gender: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  driving_license_number: string | null;
  driving_license_expiry: string | null;
  driving_license_front_url: string | null;
  driving_license_back_url: string | null;
  aadhar_number: string | null;
  aadhar_front_url: string | null;
  aadhar_back_url: string | null;
  documents_verified: boolean | null;
  verification_status: string | null;
  profile_completed: boolean | null;
}

interface BookingRecord {
  id: string;
  pickup_time: string;
  return_time: string;
  pickup_location: string | null;
  delivery_address: string | null;
  duration: string | null;
  amount: number;
  status: string | null;
  payment_status: string | null;
  created_at: string;
  vehicles: { name: string; brand: string; vehicle_type: string; registration_number: string; photos: string[] | null } | null;
}

interface ActiveBooking {
  id: string;
  booking_id: string;
  status: string;
  driver_id: string | null;
}

const statusBadgeColors: Record<string, string> = {
  confirmed: "bg-blue-100 text-blue-700",
  active: "bg-green-100 text-green-700",
  "picked-up": "bg-green-100 text-green-700",
  in_progress: "bg-green-100 text-green-700",
  completed: "bg-gray-100 text-gray-700",
  cancelled: "bg-red-100 text-red-700",
  pending: "bg-yellow-100 text-yellow-700",
};

const verificationBadge: Record<string, { color: string; label: string }> = {
  verified: { color: "bg-green-100 text-green-700", label: "Verified" },
  pending: { color: "bg-yellow-100 text-yellow-700", label: "Pending" },
  rejected: { color: "bg-red-100 text-red-700", label: "Rejected" },
};

export default function CustomerProfile() {
  const { user, profile: authProfile, signOut } = useAuth();
  const [profileDetails, setProfileDetails] = useState<ProfileDetails | null>(null);
  const [pastBookings, setPastBookings] = useState<BookingRecord[]>([]);
  const [activeBooking, setActiveBooking] = useState<ActiveBooking | null>(null);
  const [activeBookingInfo, setActiveBookingInfo] = useState<BookingRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAadhar, setShowAadhar] = useState(false);
  const [bookingPage, setBookingPage] = useState(1);
  const bookingsPerPage = 5;

  useEffect(() => {
    if (user) fetchAll();
  }, [user]);

  const fetchAll = async () => {
    if (!user) return;
    setLoading(true);

    // Fetch profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    setProfileDetails(profileData as ProfileDetails | null);

    if (profileData) {
      // Fetch past bookings
      const { data: bookings } = await supabase
        .from("bookings")
        .select("id, pickup_time, return_time, pickup_location, delivery_address, duration, amount, status, payment_status, created_at, vehicles(name, brand, vehicle_type, registration_number, photos)")
        .eq("customer_id", profileData.id)
        .order("created_at", { ascending: false });

      setPastBookings((bookings as BookingRecord[]) || []);

      // Fetch active booking
      const { data: active } = await supabase
        .from("active_bookings")
        .select("*")
        .eq("customer_id", profileData.id)
        .neq("status", "completed")
        .neq("status", "cancelled")
        .maybeSingle();

      if (active) {
        setActiveBooking(active as ActiveBooking);
        // Fetch the booking details for the active booking
        const { data: activeInfo } = await supabase
          .from("bookings")
          .select("id, pickup_time, return_time, pickup_location, delivery_address, duration, amount, status, payment_status, created_at, vehicles(name, brand, vehicle_type, registration_number, photos)")
          .eq("id", active.booking_id)
          .maybeSingle();
        setActiveBookingInfo(activeInfo as BookingRecord | null);
      }
    }

    setLoading(false);
  };

  const maskAadhar = (num: string | null) => {
    if (!num) return "Not provided";
    return showAadhar ? num : `XXXX-XXXX-${num.slice(-4)}`;
  };

  const completedBookings = pastBookings.filter((b) => b.status === "completed" || b.status === "cancelled");
  const paginatedBookings = completedBookings.slice(
    (bookingPage - 1) * bookingsPerPage,
    bookingPage * bookingsPerPage
  );
  const totalBookingPages = Math.ceil(completedBookings.length / bookingsPerPage);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 lg:pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-bold text-foreground mb-2">My Profile</h1>
            <p className="text-muted-foreground mb-8">Manage your account, documents, and bookings</p>
          </motion.div>

          {/* Active Booking Card */}
          {activeBooking && activeBookingInfo && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <Card className="mb-6 border-primary/30 bg-primary/5">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Car className="w-5 h-5 text-primary" />
                    Active Booking
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    <div className="w-20 h-14 rounded-lg bg-secondary overflow-hidden flex-shrink-0">
                      {activeBookingInfo.vehicles?.photos?.[0] ? (
                        <img src={activeBookingInfo.vehicles.photos[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Car className="w-6 h-6 text-muted-foreground" /></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground">{activeBookingInfo.vehicles?.name || "Vehicle"}</h3>
                      <p className="text-xs text-muted-foreground">{activeBookingInfo.vehicles?.registration_number} • {activeBookingInfo.duration}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={statusBadgeColors[activeBooking.status] || "bg-secondary"}>
                          {activeBooking.status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                        </Badge>
                        <span className="text-xs text-muted-foreground">#{activeBooking.booking_id.slice(0, 8)}</span>
                      </div>
                    </div>
                    <Button
                      asChild
                      className="flex-shrink-0"
                      disabled={!activeBooking.driver_id && activeBooking.status === "confirmed"}
                    >
                      <Link to={`/track/${activeBooking.booking_id}`}>
                        <Navigation className="w-4 h-4 mr-2" />
                        {activeBooking.driver_id || activeBooking.status !== "confirmed" ? "Track Live" : "Waiting for Driver..."}
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {!activeBooking && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <Card className="mb-6 bg-secondary/50">
                <CardContent className="py-6 text-center">
                  <Car className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground mb-3">No active booking right now</p>
                  <Button asChild><Link to="/vehicles">Book Now</Link></Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Section 1: Personal Details & Documents */}
          {profileDetails && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <User className="w-5 h-5 text-primary" />
                      Personal Details
                    </span>
                    <Badge className={verificationBadge[profileDetails.verification_status || "pending"].color}>
                      {profileDetails.documents_verified ? (
                        <><ShieldCheck className="w-3 h-3 mr-1" />Verified</>
                      ) : (
                        <><Shield className="w-3 h-3 mr-1" />{verificationBadge[profileDetails.verification_status || "pending"].label}</>
                      )}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground block text-xs mb-0.5">Full Name</span>
                      <p className="font-medium text-foreground">{profileDetails.full_name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs mb-0.5">Email</span>
                      <p className="font-medium text-foreground flex items-center gap-1"><Mail className="w-3 h-3" />{profileDetails.email}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs mb-0.5">Phone</span>
                      <p className="font-medium text-foreground flex items-center gap-1"><Phone className="w-3 h-3" />{profileDetails.phone || "Not provided"}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs mb-0.5">Date of Birth</span>
                      <p className="font-medium text-foreground">{profileDetails.date_of_birth || "Not provided"}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-muted-foreground block text-xs mb-0.5">Address</span>
                      <p className="font-medium text-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        {[profileDetails.address_line1, profileDetails.city, profileDetails.state, profileDetails.postal_code].filter(Boolean).join(", ") || "Not provided"}
                      </p>
                    </div>
                  </div>

                  {/* Documents */}
                  <div className="mt-6 pt-6 border-t border-border">
                    <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      Submitted Documents
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div className="bg-secondary rounded-lg p-4">
                        <p className="text-xs text-muted-foreground mb-1">Driving License</p>
                        <p className="font-medium text-foreground">{profileDetails.driving_license_number || "Not provided"}</p>
                        {profileDetails.driving_license_expiry && (
                          <p className={`text-xs mt-1 ${new Date(profileDetails.driving_license_expiry) < new Date() ? "text-destructive" : "text-muted-foreground"}`}>
                            Expires: {profileDetails.driving_license_expiry}
                            {new Date(profileDetails.driving_license_expiry) < new Date() && " (Expired)"}
                          </p>
                        )}
                      </div>
                      <div className="bg-secondary rounded-lg p-4">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs text-muted-foreground">Aadhar Card</p>
                          <button onClick={() => setShowAadhar(!showAadhar)} className="text-xs text-primary hover:underline flex items-center gap-1">
                            {showAadhar ? <><EyeOff className="w-3 h-3" />Hide</> : <><Eye className="w-3 h-3" />Show</>}
                          </button>
                        </div>
                        <p className="font-medium text-foreground">{maskAadhar(profileDetails.aadhar_number)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Section 2: Past Bookings */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Booking History
                  {completedBookings.length > 0 && (
                    <span className="text-sm font-normal text-muted-foreground">({completedBookings.length} bookings)</span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {completedBookings.length === 0 ? (
                  <div className="text-center py-10">
                    <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No booking history yet.</p>
                    <Button asChild className="mt-4" variant="outline"><Link to="/vehicles">Browse Vehicles</Link></Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {paginatedBookings.map((booking) => (
                      <div key={booking.id} className="flex items-center gap-4 p-4 bg-secondary rounded-xl">
                        <div className="w-14 h-10 rounded-lg bg-background overflow-hidden flex-shrink-0">
                          {booking.vehicles?.photos?.[0] ? (
                            <img src={booking.vehicles.photos[0]} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><Car className="w-4 h-4 text-muted-foreground" /></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-foreground text-sm">{booking.vehicles?.name || "Vehicle"}</h4>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(booking.pickup_time), "dd MMM yyyy")} • {booking.duration || "—"}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-semibold text-foreground text-sm">₹{booking.amount.toLocaleString()}</p>
                          <Badge className={`text-xs ${statusBadgeColors[booking.status || "pending"]}`} variant="secondary">
                            {(booking.status || "pending").charAt(0).toUpperCase() + (booking.status || "pending").slice(1)}
                          </Badge>
                        </div>
                      </div>
                    ))}

                    {totalBookingPages > 1 && (
                      <div className="flex items-center justify-between pt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setBookingPage((p) => Math.max(1, p - 1))}
                          disabled={bookingPage === 1}
                        >
                          Previous
                        </Button>
                        <span className="text-sm text-muted-foreground">Page {bookingPage} of {totalBookingPages}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setBookingPage((p) => Math.min(totalBookingPages, p + 1))}
                          disabled={bookingPage === totalBookingPages}
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Sign Out */}
          <div className="mt-8 text-center">
            <Button variant="outline" onClick={signOut}>Sign Out</Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
