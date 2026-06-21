// Returns MSG91 widget config (widgetId + tokenAuth) to the frontend.
// These values are used by the MSG91 browser widget; keeping them in secrets
// avoids hardcoding them in the repo.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

Deno.serve((req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const widgetId = Deno.env.get("MSG91_WIDGET_ID");
  const tokenAuth = Deno.env.get("MSG91_TOKEN_AUTH");

  if (!widgetId || !tokenAuth) {
    return new Response(
      JSON.stringify({ success: false, error: "MSG91 config missing" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  return new Response(
    JSON.stringify({ success: true, widgetId, tokenAuth }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
