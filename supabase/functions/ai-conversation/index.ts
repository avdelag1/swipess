/**
 * ai-conversation – Proxy to ai-orchestrator
 *
 * Conversational listing creation is now handled inside ai-orchestrator
 * using task='conversation'. This proxy provides backward compatibility.
 *
 * Do NOT call this function directly in new code — use ai-orchestrator instead.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const body = await req.json();

    // Forward as a conversation task to ai-orchestrator
    const normalized = {
      task: "conversation",
      data: body,
    };

    const orchestratorUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/ai-orchestrator`;

    const response = await fetch(orchestratorUrl, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
        apikey: Deno.env.get("SUPABASE_ANON_KEY") || "",
      },
      body: JSON.stringify(normalized),
    });

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("ai-conversation proxy error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
