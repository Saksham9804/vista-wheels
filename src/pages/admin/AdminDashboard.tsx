import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, FileCheck, FileX, Clock, Search, Filter, Download, Eye, Check, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PartnerLayout } from "@/components/partner/PartnerLayout";
import { format } from "date-fns";

interface CustomerDoc {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  verification_status: string | null;
  documents_verified: boolean | null;
  driving_license_number: string | null;
  driving_license_expiry: string | null;
  driving_license_front_url: string | null;
  driving_license_back_url: string | null;
  aadhar_number: string | null;
  aadhar_front_url: string | null;
  aadhar_back_url: string | null;
  created_at: string;
}

interface PartnerDoc {
  id: string;
  user_id: string;
  business_name: string;
  email: string;
  phone: string;
  status: string | null;
  city: string;
  business_type: string;
  created_at: string;
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<CustomerDoc[]>([]);
  const [partners, setPartners] = useState<PartnerDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDoc | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<PartnerDoc | null>(null);
  const [remarks, setRemarks] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [{ data: cData }, { data: pData }] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("partners").select("*").order("created_at", { ascending: false }),
      ]);
      setCustomers((cData || []) as CustomerDoc[]);
      setPartners((pData || []) as PartnerDoc[]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerVerification = async (customerId: string, status: "approved" | "rejected") => {
    if (!remarks.trim() && status === "rejected") {
      toast({ variant: "destructive", title: "Please add remarks for rejection" });
      return;
    }
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          verification_status: status,
          documents_verified: status === "approved",
        })
        .eq("id", customerId);

      if (error) throw error;
      toast({ title: `Customer ${status === "approved" ? "approved" : "rejected"} successfully` });
      setSelectedCustomer(null);
      setRemarks("");
      fetchData();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Action failed", description: error.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handlePartnerVerification = async (partnerId: string, status: "approved" | "rejected") => {
    if (!remarks.trim() && status === "rejected") {
      toast({ variant: "destructive", title: "Please add remarks for rejection" });
      return;
    }
    setActionLoading(true);
    try {
      const updateData: Record<string, any> = { status };
      if (status === "rejected") updateData.rejection_reason = remarks;
      if (status === "approved") updateData.approved_at = new Date().toISOString();

      const { error } = await supabase.from("partners").update(updateData).eq("id", partnerId);
      if (error) throw error;
      toast({ title: `Partner ${status}` });
      setSelectedPartner(null);
      setRemarks("");
      fetchData();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Action failed", description: error.message });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch = c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || c.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.verification_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredPartners = partners.filter((p) => {
    const matchesSearch = p.business_name.toLowerCase().includes(searchQuery.toLowerCase()) || p.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCustomers = customers.filter((c) => c.verification_status === "pending");
  const pendingPartners = partners.filter((p) => p.status === "pending_verification");

  // License expiry alerts
  const expiringLicenses = customers.filter((c) => {
    if (!c.driving_license_expiry) return false;
    const expiry = new Date(c.driving_license_expiry);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return expiry <= thirtyDaysFromNow && expiry > new Date();
  });

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
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Document Management</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">{pendingCustomers.length}</p>
                  <p className="text-sm text-muted-foreground">Pending Customers</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{pendingPartners.length}</p>
                  <p className="text-sm text-muted-foreground">Pending Partners</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <FileCheck className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{customers.filter((c) => c.documents_verified).length}</p>
                  <p className="text-sm text-muted-foreground">Verified Customers</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <FileX className="w-8 h-8 text-destructive" />
                <div>
                  <p className="text-2xl font-bold">{expiringLicenses.length}</p>
                  <p className="text-sm text-muted-foreground">Licenses Expiring Soon</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by name or email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Filter status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="pending_verification">Pending Verification</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="customers">
          <TabsList>
            <TabsTrigger value="customers">Customers ({filteredCustomers.length})</TabsTrigger>
            <TabsTrigger value="partners">Partners ({filteredPartners.length})</TabsTrigger>
            <TabsTrigger value="expiring">Expiring Licenses ({expiringLicenses.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="customers">
            <Card>
              <CardContent className="pt-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Name</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Email</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">License</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCustomers.slice((currentPage - 1) * perPage, currentPage * perPage).map((customer) => (
                        <tr key={customer.id} className="border-b border-border hover:bg-accent/50">
                          <td className="py-4 px-4">
                            <p className="font-medium text-foreground">{customer.full_name}</p>
                            <p className="text-sm text-muted-foreground">{customer.phone || "—"}</p>
                          </td>
                          <td className="py-4 px-4 hidden md:table-cell text-sm text-muted-foreground">{customer.email}</td>
                          <td className="py-4 px-4 hidden lg:table-cell text-sm">
                            {customer.driving_license_number ? (
                              <span className="text-foreground">{customer.driving_license_number}</span>
                            ) : (
                              <span className="text-muted-foreground">Not uploaded</span>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <Badge variant="secondary" className={
                              customer.verification_status === "approved" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                              customer.verification_status === "rejected" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                              "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                            }>
                              {(customer.verification_status || "pending").charAt(0).toUpperCase() + (customer.verification_status || "pending").slice(1)}
                            </Badge>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <Button variant="outline" size="sm" onClick={() => { setSelectedCustomer(customer); setRemarks(""); }}>
                              <Eye className="w-4 h-4 mr-1" /> Review
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="partners">
            <Card>
              <CardContent className="pt-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Business</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden md:table-cell">City</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">Type</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPartners.map((partner) => (
                        <tr key={partner.id} className="border-b border-border hover:bg-accent/50">
                          <td className="py-4 px-4">
                            <p className="font-medium text-foreground">{partner.business_name}</p>
                            <p className="text-sm text-muted-foreground">{partner.email}</p>
                          </td>
                          <td className="py-4 px-4 hidden md:table-cell text-sm text-muted-foreground">{partner.city}</td>
                          <td className="py-4 px-4 hidden lg:table-cell text-sm text-muted-foreground capitalize">{partner.business_type.replace("_", " ")}</td>
                          <td className="py-4 px-4">
                            <Badge variant="secondary" className={
                              partner.status === "approved" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                              partner.status === "rejected" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                              "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                            }>
                              {(partner.status || "pending").replace("_", " ").charAt(0).toUpperCase() + (partner.status || "pending").replace("_", " ").slice(1)}
                            </Badge>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <Button variant="outline" size="sm" onClick={() => { setSelectedPartner(partner); setRemarks(""); }}>
                              <Eye className="w-4 h-4 mr-1" /> Review
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expiring">
            <Card>
              <CardContent className="pt-6">
                {expiringLicenses.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No licenses expiring within 30 days</p>
                ) : (
                  <div className="space-y-3">
                    {expiringLicenses.map((c) => (
                      <div key={c.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div>
                          <p className="font-medium text-foreground">{c.full_name}</p>
                          <p className="text-sm text-muted-foreground">{c.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-destructive font-medium">Expires: {c.driving_license_expiry}</p>
                          <p className="text-xs text-muted-foreground">License: {c.driving_license_number}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Customer Review Dialog */}
        <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Review Customer: {selectedCustomer?.full_name}</DialogTitle>
            </DialogHeader>
            {selectedCustomer && (
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-muted-foreground">Email:</span> <p className="font-medium">{selectedCustomer.email}</p></div>
                  <div><span className="text-muted-foreground">Phone:</span> <p className="font-medium">{selectedCustomer.phone || "—"}</p></div>
                  <div><span className="text-muted-foreground">License #:</span> <p className="font-medium">{selectedCustomer.driving_license_number || "—"}</p></div>
                  <div><span className="text-muted-foreground">License Expiry:</span> <p className="font-medium">{selectedCustomer.driving_license_expiry || "—"}</p></div>
                  <div><span className="text-muted-foreground">Aadhar:</span> <p className="font-medium">{selectedCustomer.aadhar_number ? `XXXX-XXXX-${selectedCustomer.aadhar_number.slice(-4)}` : "—"}</p></div>
                </div>

                {/* Document Previews */}
                <div className="space-y-3">
                  <h3 className="font-semibold">Documents</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: "License Front", url: selectedCustomer.driving_license_front_url },
                      { label: "License Back", url: selectedCustomer.driving_license_back_url },
                      { label: "Aadhar Front", url: selectedCustomer.aadhar_front_url },
                      { label: "Aadhar Back", url: selectedCustomer.aadhar_back_url },
                    ].map((doc) => (
                      <div key={doc.label} className="space-y-1">
                        <p className="text-sm text-muted-foreground">{doc.label}</p>
                        {doc.url ? (
                          <div className="relative group cursor-pointer" onClick={() => setPreviewUrl(doc.url)}>
                            <img src={doc.url} alt={doc.label} className="w-full h-32 object-cover rounded-lg border border-border" />
                            <div className="absolute inset-0 bg-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                              <Eye className="w-6 h-6 text-background" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-32 bg-secondary rounded-lg flex items-center justify-center">
                            <p className="text-sm text-muted-foreground">Not uploaded</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Remarks */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Remarks</label>
                  <Textarea placeholder="Add remarks (required for rejection)..." value={remarks} onChange={(e) => setRemarks(e.target.value)} />
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button className="flex-1" onClick={() => handleCustomerVerification(selectedCustomer.id, "approved")} disabled={actionLoading}>
                    <Check className="w-4 h-4 mr-2" /> Approve
                  </Button>
                  <Button variant="destructive" className="flex-1" onClick={() => handleCustomerVerification(selectedCustomer.id, "rejected")} disabled={actionLoading}>
                    <X className="w-4 h-4 mr-2" /> Reject
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Partner Review Dialog */}
        <Dialog open={!!selectedPartner} onOpenChange={() => setSelectedPartner(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Review Partner: {selectedPartner?.business_name}</DialogTitle>
            </DialogHeader>
            {selectedPartner && (
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-muted-foreground">Email:</span> <p className="font-medium">{selectedPartner.email}</p></div>
                  <div><span className="text-muted-foreground">Phone:</span> <p className="font-medium">{selectedPartner.phone}</p></div>
                  <div><span className="text-muted-foreground">City:</span> <p className="font-medium">{selectedPartner.city}</p></div>
                  <div><span className="text-muted-foreground">Type:</span> <p className="font-medium capitalize">{selectedPartner.business_type.replace("_", " ")}</p></div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Remarks</label>
                  <Textarea placeholder="Add remarks (required for rejection)..." value={remarks} onChange={(e) => setRemarks(e.target.value)} />
                </div>

                <div className="flex gap-3">
                  <Button className="flex-1" onClick={() => handlePartnerVerification(selectedPartner.id, "approved")} disabled={actionLoading}>
                    <Check className="w-4 h-4 mr-2" /> Approve
                  </Button>
                  <Button variant="destructive" className="flex-1" onClick={() => handlePartnerVerification(selectedPartner.id, "rejected")} disabled={actionLoading}>
                    <X className="w-4 h-4 mr-2" /> Reject
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Image Preview Dialog */}
        <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader><DialogTitle>Document Preview</DialogTitle></DialogHeader>
            {previewUrl && (
              <div className="mt-4">
                <img src={previewUrl} alt="Document preview" className="w-full rounded-lg" />
                <div className="flex justify-end mt-4">
                  <Button variant="outline" asChild>
                    <a href={previewUrl} target="_blank" rel="noopener noreferrer" download>
                      <Download className="w-4 h-4 mr-2" /> Download
                    </a>
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </PartnerLayout>
  );
}
