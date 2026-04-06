import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * 🛰️ SWIPESS AI CONCIERGE — Expert Mode
 * MiniMax Primary, Lovable AI Fallback
 * Knowledge-grounded, multilingual, streaming-capable
 */

// ── Knowledge Base Lookup ──────────────────────────────────────
async function fetchKnowledge(query: string): Promise<string> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return "";

  try {
    const sb = createClient(supabaseUrl, serviceKey);
    // Extract keywords (3+ chars) for search
    const keywords = query
      .toLowerCase()
      .replace(/[^a-záéíóúñü0-9\s]/gi, "")
      .split(/\s+/)
      .filter((w) => w.length >= 3)
      .slice(0, 8);

    if (keywords.length === 0) return "";

    // Text search with OR logic
    const tsQuery = keywords.join(" | ");
    const { data, error } = await sb
      .from("concierge_knowledge")
      .select("title, content, category, google_maps_url, phone, website_url, tags")
      .eq("is_active", true)
      .textSearch("title", tsQuery, { type: "plain", config: "english" })
      .limit(5);

    // Fallback: also search content via ilike on top keywords
    let results = data || [];
    if (results.length < 2 && keywords.length > 0) {
      const { data: fallback } = await sb
        .from("concierge_knowledge")
        .select("title, content, category, google_maps_url, phone, website_url, tags")
        .eq("is_active", true)
        .or(keywords.slice(0, 3).map((k) => `content.ilike.%${k}%`).join(","))
        .limit(5);
      if (fallback) {
        const existingIds = new Set(results.map((r: any) => r.title));
        results = [...results, ...fallback.filter((r: any) => !existingIds.has(r.title))];
      }
    }

    if (!results.length) return "";

    const formatted = results
      .map((r: any) => {
        let entry = `• ${r.title} [${r.category}]: ${r.content}`;
        if (r.google_maps_url) entry += ` | Maps: ${r.google_maps_url}`;
        if (r.phone) entry += ` | Phone: ${r.phone}`;
        if (r.website_url) entry += ` | Web: ${r.website_url}`;
        return entry;
      })
      .join("\n");

    return `\n\n--- VERIFIED LOCAL KNOWLEDGE (use this data to ground your answer) ---\n${formatted}\n--- END KNOWLEDGE ---\n`;
  } catch (e) {
    console.warn("[AI] Knowledge fetch error:", e);
    return "";
  }
}

// ── System Prompt ──────────────────────────────────────────────
function buildSystemPrompt(knowledgeBlock: string): string {
  return `You are the Swipess AI Concierge — an elite, multilingual local expert for Tulum, Mexico.

🌍 LANGUAGE RULE (CRITICAL): ALWAYS respond in the SAME LANGUAGE the user writes in. If they write in Chinese, respond in Chinese. If Spanish, respond in Spanish. If German, German. Auto-detect and match perfectly.

🎯 YOUR EXPERTISE:
- Ultra-premium property rentals & luxury real estate (La Veleta, Aldea Zama, Region 15, Hotel Zone)
- Luxury & budget transportation: private chauffeurs, car/moto/bicycle rentals near TQO Airport
- Gastronomy: hidden gems, beach clubs (Papaya Playa, Vagalume, Gitano), street food
- Activities: cenotes, sound healing, yoga, kite surfing, nightlife
- Budget planning: "I have X pesos, plan my trip" → detailed route with costs
- Free beach entrances, public access points, local tips

🗺️ ROUTE & ITINERARY FORMAT:
When suggesting multiple places, ALWAYS include:
1. Google Maps links for each location (use https://maps.google.com/?q=PLACE+NAME+Tulum)
2. Phone numbers when known
3. Estimated travel time between stops
4. Approximate costs in MXN and USD

When the user asks for a route or itinerary, respond with your recommendations AND include this JSON action block at the end:
{"action": {"type": "show_route", "params": {"title": "Route Title", "stops": [{"name": "Place Name", "description": "Brief desc", "google_maps_url": "https://maps.google.com/?q=...", "phone": "+52...", "estimated_cost": "$XX MXN"}]}}}

🧭 IN-APP NAVIGATION MAP (use navigate_to action when relevant):
- /properties → Browse rental listings
- /vehicles → Car & moto rentals  
- /bicycles → Bicycle rentals
- /services → Local services
- /events → Events & experiences
- /subscription-packages → Subscription plans
- /market-report → Tulum market data
- /local-intel → Local news & tips
- /roommates → Find roommates
- /profile → User profile

When a user wants to go to a section, include: {"action": {"type": "navigate_to", "params": {"path": "/properties", "label": "Browse Properties"}}}

🤝 PROACTIVE BEHAVIOR:
- After answering, suggest 1-2 related follow-up questions
- If the user mentions a budget, proactively break down how to spend it
- If they mention dates, suggest time-specific activities
- Ask "Would you like me to create a route with Google Maps links?" when suggesting multiple places
- Remember context from the conversation to personalize

🎭 TONE: Sophisticated, warm, precise. 5-star concierge level. Never use placeholders — if unsure, honestly say so and suggest the nearest alternative.

${knowledgeBlock}

📌 ACTION BLOCKS: When your response benefits from an interactive UI element, append ONE JSON action block at the very end. Types:
- show_venue_card: {"action":{"type":"show_venue_card","params":{"title":"...","category":"...","whatsapp":"...","instagram":"..."}}}
- show_route: {"action":{"type":"show_route","params":{"title":"...","stops":[{"name":"...","description":"...","google_maps_url":"...","phone":"...","estimated_cost":"..."}]}}}
- create_itinerary: {"action":{"type":"create_itinerary","params":{"activities":[{"time":"...","title":"...","description":"...","google_maps_url":"..."}]}}}
- navigate_to: {"action":{"type":"navigate_to","params":{"path":"...","label":"..."}}}
- show_listing_card: {"action":{"type":"show_listing_card","params":{"id":"...","title":"...","location":"...","price":0}}}`;
}

// ── Main Handler ───────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST" && req.method !== "GET") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = await req.json().catch(() => ({}));
    const { task, data, stream } = payload;
    const rawMessages = data?.messages || payload.messages || [];

    if (task === "ping") {
      return new Response(JSON.stringify({ status: "ready", timestamp: Date.now() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const formattedMessages = rawMessages
      .map((m: any) => ({
        role: m.role === "assistant" || m.role === "ai" || m.role === "model" ? "assistant" : "user",
        content: m.content || m.text || "",
      }))
      .filter((m: any) => m.content.trim() !== "");

    // Get the latest user query for knowledge lookup
    const latestQuery = data?.query || formattedMessages.filter((m: any) => m.role === "user").pop()?.content || "";

    // Fetch knowledge in parallel
    const knowledgeBlock = await fetchKnowledge(latestQuery);

    const systemPrompt = buildSystemPrompt(knowledgeBlock);
    const messagesPayload = [{ role: "system", content: systemPrompt }, ...formattedMessages.slice(-20)];

    console.log(`[AI] Processing | messages: ${formattedMessages.length} | knowledge: ${knowledgeBlock ? "yes" : "none"} | stream: ${!!stream}`);

    // ─── STREAMING PATH ──────────────────────────────────────
    if (stream) {
      return await handleStreaming(messagesPayload);
    }

    // ─── JSON PATH (existing stable flow) ────────────────────
    return await handleJSON(messagesPayload);
  } catch (err: any) {
    console.error("[CRITICAL AI ERROR]", err);
    return new Response(
      JSON.stringify({ error: err.message, status: "error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ── JSON Response Handler ──────────────────────────────────────
async function handleJSON(messagesPayload: any[]) {
  const minimaxKey = Deno.env.get("MINIMAX_API_KEY");
  let text = "";
  let provider = "unknown";

  if (minimaxKey) {
    try {
      console.log("[AI] Trying MiniMax primary...");
      const mmResponse = await fetch("https://api.minimax.io/anthropic/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": minimaxKey,
          "Content-Type": "application/json",
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "MiniMax-M2.7",
          max_tokens: 2048,
          system: messagesPayload[0].content,
          messages: messagesPayload.slice(1).map((m: any) => ({ role: m.role, content: m.content })),
        }),
      });

      if (mmResponse.ok) {
        const mmResult = await mmResponse.json();
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
  }

  // Fallback: Lovable AI
  if (!text) {
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) throw new Error("No AI provider available.");

    console.log("[AI] Falling back to Lovable AI...");
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: messagesPayload,
        temperature: 0.7,
        max_tokens: 2048,
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

  // Extract action block
  let cleanText = text;
  let action = null;
  const actionMatch = text.match(/(\{\s*"action"\s*:[\s\S]*?\})\s*$/m);
  if (actionMatch) {
    try {
      action = JSON.parse(actionMatch[0])?.action || null;
      cleanText = text.replace(actionMatch[0], "").trim();
    } catch (_e) {
      // keep full text
    }
  }

  return new Response(
    JSON.stringify({
      result: { text: cleanText || text, action },
      provider,
      status: "success",
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// ── Streaming Response Handler ─────────────────────────────────
async function handleStreaming(messagesPayload: any[]) {
  const minimaxKey = Deno.env.get("MINIMAX_API_KEY");
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

  // Try MiniMax streaming first (OpenAI-compatible endpoint)
  if (minimaxKey) {
    try {
      console.log("[AI] Trying MiniMax streaming...");
      const mmResponse = await fetch("https://api.minimax.io/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${minimaxKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "MiniMax-M2.7",
          max_tokens: 2048,
          stream: true,
          messages: messagesPayload,
        }),
      });

      if (mmResponse.ok && mmResponse.body) {
        console.log("[AI] ✅ MiniMax streaming started");
        return new Response(mmResponse.body, {
          headers: {
            ...corsHeaders,
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            "X-AI-Provider": "minimax",
          },
        });
      }
      console.warn(`[AI] MiniMax stream failed ${mmResponse.status}`);
    } catch (e: any) {
      console.warn(`[AI] MiniMax stream error: ${e.message}`);
    }
  }

  // Fallback: Lovable AI streaming
  if (lovableApiKey) {
    console.log("[AI] Falling back to Lovable AI streaming...");
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: messagesPayload,
        temperature: 0.7,
        max_tokens: 2048,
        stream: true,
      }),
    });

    if (aiResponse.ok && aiResponse.body) {
      console.log("[AI] ✅ Lovable AI streaming started");
      return new Response(aiResponse.body, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "X-AI-Provider": "lovable-gemini",
        },
      });
    }
  }

  throw new Error("No streaming provider available.");
}
