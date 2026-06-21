import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Loader2, CheckCircle2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    sendOtp?: (identifier: string, success: (data: any) => void, failure: (err: any) => void) => void;
    verifyOtp?: (otp: string | number, success: (data: any) => void, failure: (err: any) => void, reqId?: string) => void;
    retryOtp?: (
      channel: string | null,
      success: (data: any) => void,
      failure: (err: any) => void,
      reqId?: string,
    ) => void;
    getWidgetData?: () => Record<string, any> | null | undefined;
    isCaptchaVerified?: () => boolean;
  }
}

export default function PhoneOtpVerification({ phone, onVerified, onBack }: PhoneOtpVerificationProps) {
  const { toast } = useToast();
  const [phoneInput, setPhoneInput] = useState(phone?.replace(/\D/g, "") ?? "");
  const [otp, setOtp] = useState("");
  const [reqId, setReqId] = useState<string | null>(null);
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);
  const [widgetReady, setWidgetReady] = useState(false);
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [captchaMounted, setCaptchaMounted] = useState(false);
  const initRef = useRef(false);

  const fullPhone = phoneInput.startsWith("91") ? phoneInput : `91${phoneInput}`;

  // Initialize MSG91 widget once script + config are ready
  useEffect(() => {
    let cancelled = false;
    let initInterval: ReturnType<typeof setInterval> | null = null;
    let statusInterval: ReturnType<typeof setInterval> | null = null;

    const syncWidgetStatus = () => {
      if (cancelled) return false;

      const widgetData = typeof window.getWidgetData === "function" ? window.getWidgetData() : null;
      const hasMethods = typeof window.sendOtp === "function";
      const container = document.getElementById("msg91-captcha");
      const hasCaptchaMarkup = Boolean(container?.querySelector("iframe, h-captcha"));
      const isVerified = typeof window.isCaptchaVerified === "function" ? window.isCaptchaVerified() : false;

      setWidgetReady(hasMethods);
      setCaptchaMounted(hasCaptchaMarkup);
      setCaptchaVerified(isVerified);

      if (widgetData) {
        const requiresCaptcha = Boolean(widgetData?.captchaValidations);
        setCaptchaRequired(requiresCaptcha);
        setCaptchaMounted(!requiresCaptcha || hasCaptchaMarkup);
        setCaptchaVerified(!requiresCaptcha || isVerified);
      }

      if (hasMethods) {
        return true;
      }

      return false;
    };

    const startStatusPolling = () => {
      if (statusInterval) return;
      syncWidgetStatus();
      statusInterval = setInterval(syncWidgetStatus, 300);
    };

    const init = async () => {
      if (initRef.current) return;
      const { data, error } = await supabase.functions.invoke("get-msg91-config");
      if (cancelled) return;
      if (error || !data?.success) {
        toast({ variant: "destructive", title: "OTP unavailable", description: "Could not load OTP config." });
        return;
      }

      const tryInit = () => {
        if (typeof window.initSendOTP !== "function") return false;
        initRef.current = true;
        window.initSendOTP({
          widgetId: data.widgetId,
          tokenAuth: data.tokenAuth,
          captchaRenderId: "msg91-captcha",
          exposeMethods: true,
          exposedMethods: true,
          captchaVerified: (isVerified: boolean) => {
            if (!cancelled) setCaptchaVerified(Boolean(isVerified));
          },
          success: () => {},
          failure: () => {},
        });
        startStatusPolling();
        return true;
      };

      if (!tryInit()) {
        initInterval = setInterval(() => {
          if (tryInit() && initInterval) clearInterval(initInterval);
        }, 200);
      }
    };

    init();
    return () => {
      cancelled = true;
      if (initInterval) clearInterval(initInterval);
      if (statusInterval) clearInterval(statusInterval);
    };
  }, [toast]);

  const handleSendOtp = () => {
    if (!/^\d{10,12}$/.test(phoneInput)) {
      toast({ variant: "destructive", title: "Invalid phone", description: "Enter a valid mobile number." });
      return;
    }
    if (!widgetReady || typeof window.sendOtp !== "function") {
      toast({ variant: "destructive", title: "Please wait", description: "OTP service is still loading." });
      return;
    }
    if (captchaRequired && !captchaMounted) {
      toast({ variant: "destructive", title: "Captcha loading", description: "Please wait for captcha to appear." });
      return;
    }
    if (captchaRequired && !captchaVerified) {
      toast({ variant: "destructive", title: "Complete captcha", description: "Please verify the captcha before sending OTP." });
      return;
    }
    setSending(true);
    window.sendOtp(
      fullPhone,
      (data: any) => {
        setSending(false);
        const rid = data?.message ?? data?.reqId ?? data?.request_id ?? null;
        setReqId(typeof rid === "string" ? rid : null);
        setStep("otp");
        toast({ title: "OTP sent", description: `Code sent to +${fullPhone}` });
      },
      (err: any) => {
        console.log('MSG91 sendOtp error:', JSON.stringify(err));
        setSending(false);
        toast({
          variant: "destructive",
          title: "Could not send OTP",
          description: err?.message || "Try again in a moment.",
        });
      },
    );
  };

  const verifyTokenOnServer = async (accessToken: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("verify-otp-token", { body: { accessToken } });
      if (error) throw new Error(error.message);
      if (!data?.verified) throw new Error(data?.error || "Verification failed");
      setVerified(true);
      toast({ title: "Verified! ✅", description: "Phone number verified successfully." });
      setTimeout(onVerified, 900);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Verification Failed", description: e.message });
    } finally {
      setVerifying(false);
    }
  };

  const handleVerify = () => {
    if (otp.length !== 6) {
      toast({ variant: "destructive", title: "Enter 6-digit code" });
      return;
    }
    if (typeof window.verifyOtp !== "function") return;
    setVerifying(true);
    window.verifyOtp(
      otp,
      (data: any) => {
        const accessToken: string | undefined = data?.message ?? data?.["access-token"] ?? data;
        if (!accessToken || typeof accessToken !== "string") {
          setVerifying(false);
          toast({ variant: "destructive", title: "Verification Failed", description: "Missing access token." });
          return;
        }
        verifyTokenOnServer(accessToken);
      },
      (err: any) => {
        setVerifying(false);
        toast({
          variant: "destructive",
          title: "Invalid OTP",
          description: err?.message || "Please check the code and try again.",
        });
      },
      reqId ?? undefined,
    );
  };

  const handleResend = () => {
    if (typeof window.retryOtp !== "function") return;
    setResending(true);
    window.retryOtp(
      null,
      () => {
        setResending(false);
        toast({ title: "OTP resent", description: `New code sent to +${fullPhone}` });
      },
      (err: any) => {
        setResending(false);
        toast({
          variant: "destructive",
          title: "Resend failed",
          description: err?.message || "Try again shortly.",
        });
      },
      reqId ?? undefined,
    );
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
        <p className="text-sm text-muted-foreground">+{fullPhone}</p>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <AnimatePresence mode="wait">
        {step === "phone" ? (
          <motion.div
            key="phone"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-5 order-1"
          >
            <div className="text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Phone className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Verify Your Phone</h3>
              <p className="text-sm text-muted-foreground mt-1">We'll send you a 6-digit code via SMS</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Mobile number</Label>
              <div className="flex gap-2">
                <div className="flex items-center px-3 rounded-md border bg-muted text-sm font-medium">+91</div>
                <Input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  placeholder="98765 43210"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  className="flex-1"
                  autoFocus
                />
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Captcha container — must exist in the DOM before initSendOTP runs and persist across steps */}
      <div
        id="msg91-captcha"
        className={`${step === "phone" ? "flex" : "hidden"} order-2 min-h-[92px] w-full items-center justify-center`}
        aria-label="MSG91 captcha container"
      />

      <AnimatePresence mode="wait">
        {step === "phone" ? (
          <motion.div
            key="phone-actions"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3 order-3"
          >
            <Button
              onClick={handleSendOtp}
              disabled={sending || !widgetReady || (captchaRequired && (!captchaMounted || !captchaVerified))}
              className="w-full"
              size="lg"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending OTP...
                </>
              ) : !widgetReady ? (
                "Loading..."
              ) : captchaRequired && !captchaMounted ? (
                "Loading captcha..."
              ) : captchaRequired && !captchaVerified ? (
                "Complete captcha first"
              ) : (
                "Send OTP"
              )}
            </Button>

            {onBack && (
              <Button variant="ghost" onClick={onBack} className="w-full">
                ← Back
              </Button>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="otp"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-5"
          >
            <div className="text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <KeyRound className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Enter the code</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Sent to +{fullPhone}{" "}
                <button
                  type="button"
                  onClick={() => setStep("phone")}
                  className="text-primary font-medium hover:underline"
                >
                  Change
                </button>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="otp">6-digit code</Label>
              <Input
                id="otp"
                type="text"
                inputMode="numeric"
                placeholder="● ● ● ● ● ●"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="text-center text-2xl tracking-[0.5em] font-semibold"
                maxLength={6}
                autoFocus
              />
            </div>

            <Button
              onClick={handleVerify}
              disabled={verifying || otp.length !== 6}
              className="w-full"
              size="lg"
            >
              {verifying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify"
              )}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Didn't receive it?{" "}
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="text-primary font-medium hover:underline disabled:opacity-50"
              >
                {resending ? "Resending..." : "Resend OTP"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
