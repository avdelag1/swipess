const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * 🛰️ SWIPESS AI CONCIERGE — Powered by Lovable AI
 * ─────────────────────────────────────────────────────────────────────────────
 * Uses Lovable AI gateway (OpenAI-compatible) for reliable, no-key-needed AI.
 * ─────────────────────────────────────────────────────────────────────────────
 */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST" && req.method !== "GET") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const payload = await req.json().catch(() => ({}));
    const { task, data } = payload;
    const rawMessages = data?.messages || payload.messages || [];

    if (task === 'ping') {
      return new Response(JSON.stringify({ status: "ready", timestamp: Date.now() }), { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // Role mapping
    const formattedMessages = rawMessages.map((m: any) => ({
      role: (m.role === "assistant" || m.role === "ai" || m.role === "model") ? "assistant" : "user",
      content: m.content || m.text || ""
    })).filter((m: any) => m.content.trim() !== "");

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

    console.log(`[AI] Processing task: ${task || 'chat'} | messages: ${formattedMessages.length}`);

    // Use Lovable AI gateway — no API key needed, uses LOVABLE_API_KEY secret
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      console.error("[ERROR] LOVABLE_API_KEY is missing.");
      throw new Error("AI service configuration error.");
    }

    const aiResponse = await fetch("https://ai.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: systemPrompt }, ...formattedMessages.slice(-20)],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error(`[AI ENGINE ERROR] ${aiResponse.status}: ${errText}`);
      throw new Error(`AI Engine Error: ${aiResponse.status}`);
    }

    const result = await aiResponse.json();
    const text = result.choices?.[0]?.message?.content || "";
    
    // Extract action block if present
    let cleanText = text;
    let action = null;
    const actionMatch = text.match(/(\{\s*"action"\s*:[\s\S]*?\})\s*$/m);
    if (actionMatch) {
      try {
        action = JSON.parse(actionMatch[0])?.action || null;
        cleanText = text.replace(actionMatch[0], '').trim();
      } catch (e) {
        // keep full text if action parsing fails
      }
    }

    return new Response(JSON.stringify({
      result: { text: cleanText || text, action },
      status: "success"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err: any) {
    console.error("[CRITICAL AI ERROR]", err);
    return new Response(JSON.stringify({ 
      error: err.message, 
      status: "error",
    }), { 
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});
