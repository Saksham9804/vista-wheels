// Verify MSG91 widget access token server-side and mark user's phone as verified
import { createClient } from "npm:@supabase/supabase-js@2";

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
    // Require authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ success: false, verified: false, error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return json({ success: false, verified: false, error: "Unauthorized" }, 401);
    }
    const userId = claimsData.claims.sub as string;

    const body = await req.json().catch(() => ({}));
    const accessToken = body?.access_token ?? body?.accessToken;
    if (!accessToken || typeof accessToken !== "string") {
      return json({ success: false, verified: false, error: "access_token is required" });
    }

    const authkey = Deno.env.get("MSG91_AUTHKEY");
    if (!authkey) {
      console.error("MSG91_AUTHKEY is not configured");
      return json({ success: false, verified: false, error: "Server not configured" });
    }

    const resp = await fetch("https://control.msg91.com/api/v5/widget/verifyAccessToken", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ authkey, "access-token": accessToken }),
    });

    const data = await resp.json().catch(() => ({}));
    console.log("MSG91 verifyAccessToken response:", data);

    const ok = data?.type === "success";
    if (!ok) {
      return json({
        success: false,
        verified: false,
        error: data?.message ?? "Verification failed",
      });
    }

    // Mark user's phone as verified using service role (bypass RLS for this trusted update)
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceRoleKey);
    const { error: updateError } = await admin
      .from("profiles")
      .update({ phone_verified: true })
      .eq("user_id", userId);

    if (updateError) {
      console.error("Failed to update phone_verified:", updateError);
      return json({
        success: false,
        verified: true,
        error: "Verified but failed to update profile",
      });
    }

    return json({
      success: true,
      verified: true,
      message: data?.message ?? "Phone verified",
    });
  } catch (e) {
    console.error("verify-otp-token error:", e);
    return json({ success: false, verified: false, error: "Something went wrong" });
  }
});
