import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/twilio";

async function getTwilioSender(lovableApiKey: string, twilioApiKey: string, configuredSender?: string) {
  const sender = configuredSender?.trim();
  if (sender?.startsWith("MG") || sender?.startsWith("+")) return sender;

  const numbersRes = await fetch(`${GATEWAY_URL}/IncomingPhoneNumbers.json?PageSize=20`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${lovableApiKey}`,
      "X-Connection-Api-Key": twilioApiKey,
    },
  });

  const numbersData = await numbersRes.json();
  if (!numbersRes.ok) {
    console.error("Twilio number lookup failed:", numbersRes.status, JSON.stringify(numbersData));
    return sender;
  }

  return numbersData?.incoming_phone_numbers?.find((number: { phone_number?: string; capabilities?: { sms?: boolean } }) =>
    number.capabilities?.sms && number.phone_number?.startsWith("+"),
  )?.phone_number ?? sender;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { phone } = await req.json();

    if (!phone || !/^\+91[0-9]{10}$/.test(phone)) {
      return new Response(
        JSON.stringify({ success: false, error: "Valid Indian phone number required (e.g., +919876543210)" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const TWILIO_API_KEY = Deno.env.get("TWILIO_API_KEY");
    const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!LOVABLE_API_KEY || !TWILIO_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "OTP service is not configured. Please contact support." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const twilioSender = await getTwilioSender(LOVABLE_API_KEY, TWILIO_API_KEY, TWILIO_PHONE_NUMBER);
    if (!twilioSender?.startsWith("+") && !twilioSender?.startsWith("MG")) {
      return new Response(
        JSON.stringify({ success: false, error: "Twilio sender is invalid. Please configure a Twilio SMS-capable phone number in E.164 format." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Generate 6-digit OTP and store
    const otpCode = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // Clean any prior unverified OTPs for this phone
    await supabase.from("phone_otps").delete().eq("phone", phone).eq("verified", false);

    const { error: insertError } = await supabase.from("phone_otps").insert({
      phone,
      otp_code: otpCode,
      expires_at: expiresAt,
      verified: false,
      attempts: 0,
    });

    if (insertError) {
      console.error("Error storing OTP:", insertError.message);
      return new Response(
        JSON.stringify({ success: false, error: "Could not initiate OTP. Please try again." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Send via Twilio
    const body = `Your GetandGo verification code is ${otpCode}. It expires in 5 minutes.`;
    const messageParams = new URLSearchParams({ To: phone, Body: body });
    if (twilioSender.startsWith("MG")) {
      messageParams.set("MessagingServiceSid", twilioSender);
    } else {
      messageParams.set("From", twilioSender);
    }

    const twilioRes = await fetch(`${GATEWAY_URL}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": TWILIO_API_KEY,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: messageParams,
    });

    const data = await twilioRes.json();
    if (!twilioRes.ok) {
      console.error("Twilio error status:", twilioRes.status, "code:", data?.code, "message:", data?.message);
      return new Response(
        JSON.stringify({ success: false, error: `Failed to send OTP: ${data?.message || "Twilio error"}` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "OTP sent successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    console.error("Error sending OTP:", error instanceof Error ? error.message : error);
    return new Response(
      JSON.stringify({ success: false, error: "Something went wrong. Please try again." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
