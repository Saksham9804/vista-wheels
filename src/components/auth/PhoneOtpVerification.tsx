import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Loader2, CheckCircle2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PhoneOtpVerificationProps {
  phone: string;
  onVerified: () => void;
  onBack?: () => void;
}

export default function PhoneOtpVerification({ phone, onVerified, onBack }: PhoneOtpVerificationProps) {
  const [otpValue, setOtpValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [resendCount, setResendCount] = useState(0);
  const { toast } = useToast();

  const fullPhone = phone.startsWith("+91") ? phone : `+91${phone}`;

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const sendOtp = async () => {
    if (resendCount >= 3) {
      toast({ variant: "destructive", title: "Limit Reached", description: "Maximum resend attempts reached. Please try again later." });
      return;
    }

    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-otp", {
        body: { phone: fullPhone },
      });

      // supabase.functions.invoke sets `error` for non-2xx but the real message is in `data`
      if (data?.error) throw new Error(data.error);
      if (error) throw new Error(error.message);

      setOtpSent(true);
      setCooldown(30);
      setResendCount((c) => c + 1);
      toast({ title: "OTP Sent!", description: `Verification code sent to ${fullPhone}` });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed to send OTP", description: error.message });
    } finally {
      setIsSending(false);
    }
  };

  const verifyOtp = async () => {
    if (otpValue.length !== 6) return;

    setIsVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-otp", {
        body: { phone: fullPhone, otp: otpValue },
      });

      if (data?.error) throw new Error(data.error);
      if (error) throw new Error(error.message);
      if (!data?.verified) throw new Error("Verification failed");

      setVerified(true);
      toast({ title: "Verified! ✅", description: "Phone number verified successfully." });
      setTimeout(onVerified, 1000);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Verification Failed", description: error.message });
      setOtpValue("");
    } finally {
      setIsVerifying(false);
    }
  };

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
        <p className="text-sm text-muted-foreground">Your number {fullPhone} has been verified.</p>
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
          {otpSent
            ? `Enter the 6-digit code sent to ${fullPhone}`
            : `We'll send a verification code to ${fullPhone}`}
        </p>
      </div>

      <AnimatePresence mode="wait">
        {!otpSent ? (
          <motion.div
            key="send"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center gap-4"
          >
            <Button
              onClick={sendOtp}
              disabled={isSending}
              className="w-full"
              size="lg"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending OTP...
                </>
              ) : (
                "Send Verification Code"
              )}
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="verify"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center gap-6"
          >
            <InputOTP
              maxLength={6}
              value={otpValue}
              onChange={setOtpValue}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>

            <Button
              onClick={verifyOtp}
              disabled={isVerifying || otpValue.length !== 6}
              className="w-full"
              size="lg"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify OTP"
              )}
            </Button>

            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Didn't receive the code?</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={sendOtp}
                disabled={cooldown > 0 || isSending || resendCount >= 3}
                className="text-primary p-0 h-auto"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend"}
              </Button>
            </div>

            {resendCount > 0 && (
              <p className="text-xs text-muted-foreground">
                {3 - resendCount} resend{3 - resendCount !== 1 ? "s" : ""} remaining
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {onBack && (
        <Button variant="ghost" onClick={onBack} className="w-full">
          ← Change Phone Number
        </Button>
      )}
    </div>
  );
}
