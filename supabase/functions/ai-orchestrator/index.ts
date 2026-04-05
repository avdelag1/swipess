import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * 🛰️ SWIPESS AI CONCIERGE: MINIMALIST RESET
 * ─────────────────────────────────────────────────────────────────────────────
 * HUB: minimax-text-01 (High-Performance Chat Completion V2)
 * SCHEMA: Logic-only - No fallbacks, no filler, maximum speed.
 * ─────────────────────────────────────────────────────────────────────────────
 */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const payload = await req.json().catch(() => ({}));
    const { task, data } = payload;
    const rawMessages = data?.messages || payload.messages || [];
    const minimaxKey = Deno.env.get("MINIMAX_API_KEY");
    const group_id = Deno.env.get("MINIMAX_GROUP_ID") || "2019874926051205377";

    if (!minimaxKey) throw new Error("MiniMax API key is missing.");
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

    const response = await fetch("https://api.minimax.io/v1/text/chatcompletion_v2", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${minimaxKey}`,
        "Content-Type": "application/json",
        "GroupId": group_id,
      },
      body: JSON.stringify({
        model: "minimax-text-01",
        messages: [{ role: "system", content: systemPrompt }, ...formattedMessages.slice(-10)],
        temperature: 0.7,
        stream: true, // ALWAYS stream for instant UX
        max_tokens: 1024
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`MiniMax Engine Error: ${errText.substring(0, 50)}`);
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
      status: 200, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});
