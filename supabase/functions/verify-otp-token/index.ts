// Verify MSG91 widget access token server-side
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const { accessToken } = await req.json();
    if (!accessToken) return json({ verified: false, error: "accessToken is required" });

    const authkey = Deno.env.get("MSG91_AUTHKEY");
    if (!authkey) {
      console.error("MSG91_AUTHKEY is not configured");
      return json({ verified: false, error: "Server not configured" });
    }

    const resp = await fetch("https://api.msg91.com/api/v5/widget/verifyAccessToken", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ authkey, "access-token": accessToken }),
    });

    const data = await resp.json().catch(() => ({}));
    console.log("MSG91 verifyAccessToken response:", data);

    // MSG91 returns { type: "success", message: "..." } on success
    const ok = data?.type === "success";
    return json({
      verified: ok,
      message: data?.message ?? null,
      error: ok ? null : (data?.message ?? "Verification failed"),
    });
  } catch (e) {
    console.error("verify-otp-token error:", e);
    return json({ verified: false, error: "Something went wrong" });
  }
});
