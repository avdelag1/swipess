import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const key = Deno.env.get("MINIMAX_API_KEY");
    
    // Heartbeat
    if (req.method === "GET") {
      return new Response(JSON.stringify({ 
        status: "online", 
        key_check: key ? `Present (${key.substring(0, 8)}...)` : "MISSING" 
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const payload = await req.json();
    const task = payload.task || "chat";
    const input = payload.data || payload;

    // Auth Hardening
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.warn("[Concierge] No Authorization header present");
      return new Response(JSON.stringify({ error: "No authorization provided" }), { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!supabaseUrl || !supabaseAnon) {
       console.error("[Concierge] Project environment variables missing");
       return new Response(JSON.stringify({ error: "Internal Configuration Error" }), { status: 500, headers: corsHeaders });
    }

    const supabase = createClient(supabaseUrl, supabaseAnon, { 
      global: { headers: { Authorization: authHeader } } 
    });

    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData?.user) {
       console.warn("[Concierge] Auth validation failed:", authError?.message);
       return new Response(JSON.stringify({ error: "Unauthorized access" }), { status: 401, headers: corsHeaders });
    }

    const user = authData.user;
    console.log(`[Concierge] Processing ${task} for ${user.id}`);

    if (!key) {
      return new Response(JSON.stringify({ error: "MiniMax API key is not configured in Supabase secrets" }), { status: 200, headers: corsHeaders });
    }

    // Call MiniMax
    const messages = input.messages || [{ role: "user", content: input.query || "Hello" }];
    const minimaxRes = await fetch("https://api.minimax.io/v1/chat/completions", {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${key}`, 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({
        model: "abab6.5s-chat",
        messages: messages.map((m: any) => ({
          role: m.role === "assistant" ? "assistant" : (m.role === "system" ? "system" : "user"),
          content: m.content || m.text || ""
        }))
      })
    });

    const aiData = await minimaxRes.json();
    
    if (!minimaxRes.ok) {
      console.error("[MiniMax] Error:", aiData);
      return new Response(JSON.stringify({ 
        error: aiData.base_resp?.status_msg || "MiniMax API Error", 
        details: aiData 
      }), { status: 200, headers: corsHeaders });
    }

    const content = aiData.choices?.[0]?.message?.content || "";
    let finalResult: any = { text: content, message: content };

    // Try parsing if it's supposed to be JSON
    if (task !== "chat" && task !== "query") {
      try {
        const braceMatch = content.match(/\{[\s\S]*\}/);
        if (braceMatch) finalResult = JSON.parse(braceMatch[0]);
      } catch { /* fallback to text */ }
    }

    return new Response(JSON.stringify({ 
      result: finalResult, 
      provider: "minimax",
      status: "success" 
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err: any) {
    console.error("[Fatal] Orchestrator Crash:", err);
    return new Response(JSON.stringify({ 
      error: err.message || "An unexpected error occurred",
      status: "crash",
      diagnostic: "Check your Supabase secrets and function imports."
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
