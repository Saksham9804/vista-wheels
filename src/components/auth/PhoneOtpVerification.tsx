import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Phone, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PhoneOtpVerificationProps {
  phone: string;
  onVerified: () => void;
  onBack?: () => void;
}

declare global {
  interface Window {
    initSendOTP?: (config: Record<string, unknown>) => void;
  }
}

const MSG91_WIDGET_ID = "366675664b41373039323936";
const MSG91_TOKEN_AUTH = "543318TQMuWQUl6a379044P1";

export default function PhoneOtpVerification({ phone, onVerified, onBack }: PhoneOtpVerificationProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const { toast } = useToast();
  const launchedRef = useRef(false);

  const fullPhone = phone.startsWith("+") ? phone.replace(/\D/g, "") : `91${phone.replace(/\D/g, "")}`;

  const verifyTokenOnServer = async (accessToken: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-otp-token", {
        body: { accessToken },
      });
      if (error) throw new Error(error.message);
      if (!data?.verified) throw new Error(data?.error || "Verification failed");

      setVerified(true);
      toast({ title: "Verified! ✅", description: "Phone number verified successfully." });
      setTimeout(onVerified, 1000);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Verification Failed", description: e.message });
      launchedRef.current = false;
    } finally {
      setIsLoading(false);
    }
  };

  const launchWidget = () => {
    if (launchedRef.current) return;
    if (typeof window.initSendOTP !== "function") {
      toast({
        variant: "destructive",
        title: "OTP service unavailable",
        description: "MSG91 widget failed to load. Please refresh and try again.",
      });
      return;
    }

    launchedRef.current = true;
    window.initSendOTP({
      widgetId: MSG91_WIDGET_ID,
      tokenAuth: MSG91_TOKEN_AUTH,
      identifier: fullPhone,
      exposeMethods: false,
      success: (data: any) => {
        const accessToken: string | undefined = data?.message ?? data?.["access-token"] ?? data;
        if (!accessToken || typeof accessToken !== "string") {
          toast({ variant: "destructive", title: "Verification Failed", description: "Missing access token from MSG91." });
          launchedRef.current = false;
          return;
        }
        verifyTokenOnServer(accessToken);
      },
      failure: (error: any) => {
        console.error("MSG91 widget failure:", error);
        toast({
          variant: "destructive",
          title: "OTP Failed",
          description: error?.message || "Could not verify OTP.",
        });
        launchedRef.current = false;
      },
    });
  };

  // Wait for the MSG91 script (loaded from index.html) to be ready
  useEffect(() => {
    if (typeof window.initSendOTP === "function") return;
    const interval = setInterval(() => {
      if (typeof window.initSendOTP === "function") clearInterval(interval);
    }, 200);
    return () => clearInterval(interval);
  }, []);

  if (verified) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4 py-8"
      >
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Phone Verified!</h3>
        <p className="text-sm text-muted-foreground">Your number +{fullPhone} has been verified.</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
          <Phone className="w-7 h-7 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Verify Your Phone Number</h3>
        <p className="text-sm text-muted-foreground mt-1">
          We'll send a verification code to +{fullPhone} via MSG91
        </p>
      </div>

      <Button onClick={launchWidget} disabled={isLoading} className="w-full" size="lg">
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Verifying...
          </>
        ) : (
          "Send & Verify OTP"
        )}
      </Button>

      {onBack && (
        <Button variant="ghost" onClick={onBack} className="w-full">
          ← Change Phone Number
        </Button>
      )}
    </div>
  );
}
