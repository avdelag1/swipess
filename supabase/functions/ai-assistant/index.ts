/**
 * ai-assistant – Proxy to ai-orchestrator
 * Forwards all requests to ai-orchestrator for backward compatibility.
 * Optimized for streaming vs non-streaming logic.
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

    // 🚀 NEW: Standardize tasks for orchestrator
    const normalized = {
      task: body.task || body.type || 'chat',
      data: body.data || body,
      // Legacy proxies usually want JSON, but they can request stream
      stream: body.stream || false, 
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

    // 🚀 Bridge the stream OR JSON response directly
    return new Response(response.body, {
      status: response.status,
      headers: { 
        ...corsHeaders, 
        "Content-Type": response.headers.get("Content-Type") || "application/json" 
      },
    });

  } catch (err) {
    console.error("ai-assistant proxy error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
