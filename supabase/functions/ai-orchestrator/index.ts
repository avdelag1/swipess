const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * 🛰️ SWIPESS AI CONCIERGE: MODERN RESET
 * ─────────────────────────────────────────────────────────────────────────────
 * HUB: minimax-text-01 (High-Performance Chat Completion V2)
 * SCHEMA: Logic-only - No fallbacks, no filler, maximum speed.
 * ─────────────────────────────────────────────────────────────────────────────
 */

Deno.serve(async (req) => {
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
    const systemPrompt = `You are the Swipess AI Concierge, an elite Tulum local expert and digital curator. 
Your tone is sophisticated, welcoming, and extremely precise. You provide the level of service one would expect from a 5-star resort concierge.

Your expertise includes:
- Ultra-premium property rentals and luxury real estate in Tulum (La Veleta, Aldea Zama, Region 15).
- Luxury transportation: private chauffeurs, premium car rentals (BMW, Audi), and yacht charters.
- Gastronomic excellence: hidden gems, beach clubs (Papaya Playa, Gitano), and sound-healing wellness centers.
- Tailored itineraries for digital nomads, elite investors, and high-end travelers.

Guidelines:
- If a user sends a short or vague message (e.g., 'hey', 'what'), respond with a professional, warm welcome and offer specific categories of help (Properties, Transport, Dinner, or Vibe).
- When discussing cars, specify local options near TQO Airport.
- Always conclude with a single JSON action block if it enhances the recommendation (e.g. {"action": {"type": "show_venue_card", "params": {...}}}).
- Never use placeholders. If you don't know something exactly, be honest but suggest the nearest elite alternative.`;

    console.log(`[AI] Processing task: ${task || 'chat'} for model: MiniMax-Text-01`);

    // Streaming is default for chat, but can be disabled for legacy components
    const stream = payload.stream !== false;

    const minimaxResponse = await fetch("https://api.minimax.chat/v1/text/chatcompletion_v2", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${minimaxKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "MiniMax-Text-01",
        messages: [{ role: "system", content: systemPrompt }, ...formattedMessages.slice(-20)],
        temperature: 0.7,
        stream: stream,
        max_tokens: 1024
      }),
    });

    if (!minimaxResponse.ok) {
      const errText = await minimaxResponse.text();
      console.error(`[AI ENGINE ERROR] ${minimaxResponse.status}: ${errText}`);
      throw new Error(`MiniMax Engine Error: ${minimaxResponse.status}. ${errText.substring(0, 50)}`);
    }

    if (stream) {
      // Direct SSE Stream Bridge
      return new Response(minimaxResponse.body, {
        headers: { 
          ...corsHeaders, 
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive"
        }
      });
    } else {
      // Return full JSON for legacy invoke() calls (Conversational AI, AI Listing etc)
      const data = await minimaxResponse.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

  } catch (err: any) {
    console.error("[CRITICAL AI ERROR]", err);
    return new Response(JSON.stringify({ 
      error: err.message, 
      status: "error",
      suggestion: "Check your MiniMax API Key and Quota."
    }), { 
      status: 500, // IMPORTANT: Return 500 so frontend catches it as an error
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});
