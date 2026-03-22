const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, otp } = await req.json();

    if (!phone || !otp) {
      return new Response(
        JSON.stringify({ verified: false, error: "Phone and OTP are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const MSG91_AUTHKEY = Deno.env.get("MSG91_AUTHKEY");
    if (!MSG91_AUTHKEY) throw new Error("MSG91_AUTHKEY is not configured");

    // Strip the + prefix for MSG91
    const mobileNumber = phone.replace("+", "");

    const url = `https://control.msg91.com/api/v5/otp/verify?mobile=${mobileNumber}&otp=${otp}&authkey=${MSG91_AUTHKEY}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();
    console.log("MSG91 verify OTP response:", JSON.stringify(data));

    if (data.type === "error" || data.type !== "success") {
      return new Response(
        JSON.stringify({ verified: false, error: data.message || "Invalid OTP. Please try again." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ verified: true, message: "Phone number verified successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error verifying OTP:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ verified: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
