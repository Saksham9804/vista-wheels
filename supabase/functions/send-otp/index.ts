const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone } = await req.json();

    if (!phone || !/^\+91[0-9]{10}$/.test(phone)) {
      return new Response(
        JSON.stringify({ success: false, error: "Valid Indian phone number required (e.g., +919876543210)" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const MSG91_AUTHKEY = Deno.env.get("MSG91_AUTHKEY");
    if (!MSG91_AUTHKEY) {
      console.error("MSG91_AUTHKEY is not configured");
      return new Response(
        JSON.stringify({ success: false, error: "OTP service is not configured. Please contact support." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const MSG91_WIDGET_ID = Deno.env.get("MSG91_WIDGET_ID");
    if (!MSG91_WIDGET_ID) {
      console.error("MSG91_WIDGET_ID is not configured");
      return new Response(
        JSON.stringify({ success: false, error: "OTP service is not configured. Please contact support." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Strip the + prefix for MSG91 (expects 91XXXXXXXXXX)
    const mobileNumber = phone.replace("+", "");

    const url = `https://control.msg91.com/api/v5/otp?mobile=${mobileNumber}&authkey=${MSG91_AUTHKEY}&otp_length=6&template_id=${MSG91_WIDGET_ID}`;

    console.log("Sending OTP to mobile:", mobileNumber);

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();
    console.log("MSG91 send OTP response:", JSON.stringify(data), "HTTP status:", response.status);

    if (data.type === "error" || !response.ok) {
      const msg = data.message || JSON.stringify(data);
      console.error("MSG91 error:", msg);
      return new Response(
        JSON.stringify({ success: false, error: `Failed to send OTP: ${msg}` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "OTP sent successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error sending OTP:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Something went wrong. Please try again." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
