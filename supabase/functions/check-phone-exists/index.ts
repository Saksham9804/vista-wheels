import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const identifier = url.searchParams.get("identifier") ?? "";

    const json = (body: unknown, status = 200) =>
      new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    if (!identifier) {
      return json({ user_found: false, identifier });
    }

    // Normalize: strip non-digits, also keep last 10 digits for India matching
    const digits = identifier.replace(/\D/g, "");
    const last10 = digits.slice(-10);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Try matches against several common stored formats
    const candidates = Array.from(
      new Set([
        identifier,
        digits,
        last10,
        `+${digits}`,
        `+91${last10}`,
        `91${last10}`,
      ].filter(Boolean)),
    );

    const orFilter = candidates.map((c) => `phone.eq.${c}`).join(",");

    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .or(orFilter)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("check-phone-exists query error:", error.message);
      return json({ user_found: false, identifier });
    }

    return json({ user_found: !!data, identifier });
  } catch (e) {
    console.error("check-phone-exists error:", e);
    return new Response(
      JSON.stringify({ user_found: false, identifier: "" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
