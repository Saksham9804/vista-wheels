import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  profile_photo: string | null;
}

interface Partner {
  id: string;
  business_name: string;
  business_type: string;
  email: string;
  phone: string;
  city: string;
  number_of_vehicles: number;
  status: string;
  rating: number;
  total_bookings: number;
  profile_photo: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  partner: Partner | null;
  userRole: "customer" | "partner" | "admin" | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, phone?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  partnerSignUp: (data: PartnerSignUpData) => Promise<{ error: Error | null }>;
  partnerSignIn: (email: string, password: string) => Promise<{ error: Error | null; status?: string }>;
}

interface PartnerSignUpData {
  businessName: string;
  businessType: string;
  email: string;
  phone: string;
  city: string;
  numberOfVehicles: number;
  password: string;
  shopAddress?: string;
  state?: string;
  pinCode?: string;
  latitude?: number;
  longitude?: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [userRole, setUserRole] = useState<"customer" | "partner" | "admin" | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer profile/partner fetching with setTimeout
        if (session?.user) {
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setPartner(null);
          setUserRole(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      // Check user role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      if (roleData) {
        setUserRole(roleData.role as "customer" | "partner" | "admin");

        if (roleData.role === "customer") {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", userId)
            .maybeSingle();
          setProfile(profileData);
        } else if (roleData.role === "partner") {
          const { data: partnerData } = await supabase
            .from("partners")
            .select("*")
            .eq("user_id", userId)
            .maybeSingle();
          setPartner(partnerData);
        }
      } else {
        // No role found — this is likely a first-time OAuth user
        // Create a customer role and basic profile
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const fullName = user.user_metadata?.full_name || user.user_metadata?.name || "";
          const email = user.email || "";
          const avatar = user.user_metadata?.avatar_url || null;

          // Create profile
          const { error: profileError } = await supabase.from("profiles").insert({
            user_id: userId,
            full_name: fullName,
            email: email,
            phone: null,
            profile_photo: avatar,
          });

          if (profileError) {
            console.error("Error creating OAuth profile:", profileError);
          } else {
            setProfile({
              id: userId,
              full_name: fullName,
              email: email,
              phone: null,
              profile_photo: avatar,
            });
          }

          // Create role
          const { error: roleError } = await supabase.from("user_roles").insert({
            user_id: userId,
            role: "customer",
          });

          if (roleError) {
            console.error("Error creating OAuth role:", roleError);
          } else {
            setUserRole("customer");
          }
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const signUp = async (email: string, password: string, fullName: string, phone?: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) throw error;

      if (data.user) {
        // Create profile
        const { error: profileError } = await supabase.from("profiles").insert({
          user_id: data.user.id,
          full_name: fullName,
          email: email,
          phone: phone || null,
        });

        if (profileError) throw profileError;

        // Create role
        const { error: roleError } = await supabase.from("user_roles").insert({
          user_id: data.user.id,
          role: "customer",
        });

        if (roleError) throw roleError;
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setPartner(null);
    setUserRole(null);
  };

  const partnerSignUp = async (data: PartnerSignUpData) => {
    try {
      const redirectUrl = `${window.location.origin}/partner/dashboard`;
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Create partner record
        const { error: partnerError } = await supabase.from("partners").insert({
          user_id: authData.user.id,
          business_name: data.businessName,
          business_type: data.businessType as any,
          email: data.email,
          phone: data.phone,
          city: data.city,
          number_of_vehicles: data.numberOfVehicles,
          status: "pending_verification",
          shop_address: data.shopAddress || null,
          state: data.state || null,
          pin_code: data.pinCode || null,
          latitude: data.latitude || null,
          longitude: data.longitude || null,
        });

        if (partnerError) throw partnerError;

        // Create role
        const { error: roleError } = await supabase.from("user_roles").insert({
          user_id: authData.user.id,
          role: "partner",
        });

        if (roleError) throw roleError;
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const partnerSignIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Check partner status
      if (data.user) {
        const { data: partnerData } = await supabase
          .from("partners")
          .select("status")
          .eq("user_id", data.user.id)
          .maybeSingle();

        if (partnerData) {
          if (partnerData.status === "pending_verification") {
            await supabase.auth.signOut();
            return { 
              error: new Error("Your account is under review. We'll notify you once approved."),
              status: "pending_verification"
            };
          } else if (partnerData.status === "rejected") {
            await supabase.auth.signOut();
            return { 
              error: new Error("Your application was not approved. Contact support for details."),
              status: "rejected"
            };
          } else if (partnerData.status === "suspended") {
            await supabase.auth.signOut();
            return { 
              error: new Error("Your account has been suspended. Contact support for assistance."),
              status: "suspended"
            };
          }
        }
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        partner,
        userRole,
        loading,
        signUp,
        signIn,
        signOut,
        partnerSignUp,
        partnerSignIn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
