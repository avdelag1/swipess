import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * 🛰️ SWIPESS AI CONCIERGE: MINIMALIST RESET
 * ─────────────────────────────────────────────────────────────────────────────
 * HUB: minimax-text-01 (High-Performance Chat Completion V2)
 * SCHEMA: Logic-only - No fallbacks, no filler, maximum speed.
 * ─────────────────────────────────────────────────────────────────────────────
 */

serve(async (req) => {
  // 🛡️ Preflight handler
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  try {
    // 🛡️ Method check
    if (req.method !== "POST" && req.method !== "GET") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const payload = await req.json().catch(() => ({}));
    const { task, data } = payload;
    const rawMessages = data?.messages || payload.messages || [];
    const minimaxKey = Deno.env.get("MINIMAX_API_KEY");
    const group_id = Deno.env.get("MINIMAX_GROUP_ID") || "2019874926051205377";

    if (!minimaxKey) {
      console.error("[ERROR] MiniMax API key is missing.");
      throw new Error("AI service configuration error.");
    }

    if (task === 'ping') {
      return new Response(JSON.stringify({ status: "ready", timestamp: Date.now() }), { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // Role mapping for MiniMax v2
    const formattedMessages = rawMessages.map((m: any) => ({
      role: (m.role === "assistant" || m.role === "ai" || m.role === "model") ? "assistant" : "user",
      content: m.content || m.text || ""
    })).filter((m: any) => m.content.trim() !== "");

    // ── CORE IDENTITY RESET ───────────────────────────────────────
    let systemPrompt = `You are the Swipess AI Concierge. 
Professional, premium, and helpful. 
You help users find local properties and vibes in Tulum.
If asked to generate an itinerary or card, include a single JSON action block at the end (e.g. {"action": {"type": "show_listing_card", "params": {...}}}).
Keep it extremely concise.`;

    if (task === "conversation") {
       systemPrompt = `You are the Swipess Listing Builder. Return ONLY a JSON object mapping out listing details.`;
    }

    console.log(`[AI] Processing task: ${task || 'chat'} with ${formattedMessages.length} messages`);

    const response = await fetch("https://api.minimax.io/v1/text/chatcompletion_v2", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${minimaxKey}`,
        "Content-Type": "application/json",
        "GroupId": group_id,
      },
      body: JSON.stringify({
        model: "minimax-text-01",
        messages: [{ role: "system", content: systemPrompt }, ...formattedMessages.slice(-20)], // Increased context
        temperature: 0.7,
        stream: true, // ALWAYS stream for instant UX
        max_tokens: 1024
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[AI ENGINE ERROR] ${response.status}: ${errText}`);
      throw new Error(`MiniMax Engine Error: ${response.status}`);
    }

    // Direct SSE Stream Bridge
    return new Response(response.body, {
      headers: { 
        ...corsHeaders, 
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      }
    });

  } catch (err: any) {
    console.error("[CRITICAL]", err);
    return new Response(JSON.stringify({ error: err.message, status: "error" }), { 
      status: 200, // Return 200 so the frontend can display the error gracefully
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});

