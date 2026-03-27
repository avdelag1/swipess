import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// MULTI-ENDPOINT TITANIUM BRIDGE
const MINIMAX_ENDPOINTS = [
  "https://api.minimax.io/v1/chat/completions",
  "https://api.minimaxi.chat/v1/chat/completions"
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const key = Deno.env.get("MINIMAX_API_KEY");
    
    // Heartbeat / Diagnostic
    if (req.method === "GET") {
      return new Response(JSON.stringify({ 
        status: "online", 
        version: "v5.2-titanium-plus",
        key_check: key ? `Present (${key.substring(0, 10)}...)` : "MISSING" 
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const payload = await req.json().catch(() => ({}));
    const task = payload.task || "chat";
    const input = payload.data || payload;

    // Supabase Auth validation
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Missing Auth" }), { status: 401, headers: corsHeaders });

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    if (!key) return new Response(JSON.stringify({ error: "No Key Configured" }), { status: 200, headers: corsHeaders });

    // AI Call with Multi-Endpoint Retry
    const messages = input.messages || [{ role: "user", content: input.query || "Hello" }];
    const requestBody = {
      model: "abab6.5s-chat",
      messages: messages.map((m: any) => ({
        role: m.role === "assistant" ? "assistant" : (m.role === "system" ? "system" : "user"),
        content: m.content || m.text || ""
      }))
    };

    let apiResponse = null;
    let lastError = null;

    for (const url of MINIMAX_ENDPOINTS) {
      console.log(`[Titanium] Trying endpoint: ${url}`);
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });
        
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.choices?.[0]?.message?.content) {
          apiResponse = data;
          break;
        } else {
          lastError = data.base_resp?.status_msg || data.error?.message || "Endpoint error";
          console.warn(`[Titanium] ${url} failed:`, lastError);
        }
      } catch (e) {
        lastError = String(e);
        console.warn(`[Titanium] ${url} fetch failed:`, e);
      }
    }

    if (!apiResponse) {
      return new Response(JSON.stringify({ 
        error: "Exhausted all MiniMax endpoints", 
        last_error: lastError 
      }), { status: 200, headers: corsHeaders });
    }

    const content = apiResponse.choices[0].message.content;
    let result: any = { text: content, message: content };

    // Smart JSON output extractor
    if (task !== "chat" && task !== "query") {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        try { result = JSON.parse(match[0]); } catch { /* text fallback */ }
      }
    }

    return new Response(JSON.stringify({ result, provider: "minimax", status: "success" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err: any) {
    console.error("[Fatal] Crash:", err);
    return new Response(JSON.stringify({ error: err.message, status: "crash" }), { status: 200, headers: corsHeaders });
  }
});
