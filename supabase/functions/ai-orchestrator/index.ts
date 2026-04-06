const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * 🛰️ SWIPESS AI CONCIERGE — MiniMax Primary, Lovable AI Fallback
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

    const messagesPayload = [{ role: "system", content: systemPrompt }, ...formattedMessages.slice(-20)];

    console.log(`[AI] Processing task: ${task || 'chat'} | messages: ${formattedMessages.length}`);

    // ─── ATTEMPT 1: MiniMax ───
    const minimaxKey = Deno.env.get("MINIMAX_API_KEY");
    let text = "";
    let provider = "unknown";

    if (minimaxKey) {
      try {
        console.log("[AI] Trying MiniMax primary (Anthropic-compatible)...");
        
        // MiniMax Anthropic-compatible API
        const mmResponse = await fetch("https://api.minimax.io/anthropic/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": minimaxKey,
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "MiniMax-M2.7",
            max_tokens: 1024,
            system: messagesPayload[0].content,
            messages: messagesPayload.slice(1).map((m: any) => ({
              role: m.role,
              content: m.content,
            })),
          }),
        });

        if (mmResponse.ok) {
          const mmResult = await mmResponse.json();
          // Anthropic format: result.content[0].text
          text = mmResult.content?.find((b: any) => b.type === "text")?.text || "";
          if (text) {
            provider = "minimax";
            console.log(`[AI] ✅ MiniMax success (${text.length} chars)`);
          }
        } else {
          const errText = await mmResponse.text();
          console.warn(`[AI] ⚠️ MiniMax failed ${mmResponse.status}: ${errText}`);
        }
      } catch (mmErr: any) {
        console.warn(`[AI] ⚠️ MiniMax exception: ${mmErr.message}`);
      }
    } else {
      console.warn("[AI] No MINIMAX_API_KEY set, skipping MiniMax.");
    }

    // ─── ATTEMPT 2: Lovable AI Fallback ───
    if (!text) {
      const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
      if (!lovableApiKey) {
        throw new Error("No AI provider available (both MiniMax and Lovable AI missing).");
      }

      console.log("[AI] Falling back to Lovable AI (Gemini)...");
      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: messagesPayload,
          temperature: 0.7,
          max_tokens: 1024,
        }),
      });

      if (!aiResponse.ok) {
        const errText = await aiResponse.text();
        console.error(`[AI] Lovable AI failed ${aiResponse.status}: ${errText}`);
        throw new Error(`AI Engine Error: ${aiResponse.status}`);
      }

      const result = await aiResponse.json();
      text = result.choices?.[0]?.message?.content || "";
      provider = "lovable-gemini";
      console.log(`[AI] ✅ Lovable AI success (${text.length} chars)`);
    }

    // Extract action block if present
    let cleanText = text;
    let action = null;
    const actionMatch = text.match(/(\{\s*"action"\s*:[\s\S]*?\})\s*$/m);
    if (actionMatch) {
      try {
        action = JSON.parse(actionMatch[0])?.action || null;
        cleanText = text.replace(actionMatch[0], '').trim();
      } catch (_e) {
        // keep full text if action parsing fails
      }
    }

    return new Response(JSON.stringify({
      result: { text: cleanText || text, action },
      provider,
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
