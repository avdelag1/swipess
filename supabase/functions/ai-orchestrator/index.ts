import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// TITANIUM V6 — upgraded to MiniMax M2.7 + chatcompletion_v2 endpoint
const MINIMAX_ENDPOINTS = [
  "https://api.minimax.io/v1/text/chatcompletion_v2",
  "https://api.minimax.io/v1/chat/completions",              // legacy fallback
  "https://api.minimaxi.chat/v1/text/chatcompletion_v2",     // CN mirror
];

const MODEL = "MiniMax-M2.7";
const MODEL_FALLBACK = "abab6.5g-chat"; // Upgraded from 's' to 'g' for higher stability
const MODEL_LEGACY = "abab6.5s-chat";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const key = Deno.env.get("MINIMAX_API_KEY");
    
    // ── Heartbeat / Diagnostic ────────────────────────────────────────
    if (req.method === "GET") {
      return new Response(JSON.stringify({ 
        status: "online", 
        version: "v6.0-titanium-m2",
        model: MODEL,
        key_check: key ? `Present (${key.substring(0, 10)}...)` : "MISSING" 
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const payload = await req.json().catch(() => ({}));
    const task = payload.task || "chat";
    const input = payload.data || payload;

    // ── Auth — validate session for ALL tasks ─────────────────────────
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      console.warn("[Titanium] No Authorization header received");
      return new Response(JSON.stringify({ 
        error: "No authorization provided. Please sign in first.",
        code: "NO_AUTH" 
      }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!, 
      Deno.env.get("SUPABASE_ANON_KEY")!, 
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("[Titanium] Auth failed:", authError?.message);
      return new Response(JSON.stringify({ 
        error: "Invalid or expired session. Please sign in again.",
        code: "INVALID_TOKEN" 
      }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    console.log(`[Titanium] Authenticated user: ${user.id} | Task: ${task}`);

    if (!key) {
      return new Response(JSON.stringify({ 
        error: "AI service not configured. MINIMAX_API_KEY is missing.",
        code: "NO_KEY" 
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── Build AI request ──────────────────────────────────────────────
    const messages = input.messages || [{ role: "user", content: input.query || "Hello" }];
    const cleanMessages = messages.map((m: any) => ({
      role: m.role === "assistant" ? "assistant" : (m.role === "system" ? "system" : "user"),
      content: m.content || m.text || ""
    }));

    // Inject system prompt for non-chat tasks
    if (task === "listing" || task === "conversation" || task === "enhance" || task === "profile" || task === "search") {
      const systemPrompt = getSystemPrompt(task, input);
      cleanMessages.unshift({ role: "system", content: systemPrompt });
    }

    // ── Multi-endpoint retry with model fallback ──────────────────────
    let apiResponse = null;
    let lastError = null;
    let usedModel = MODEL;

    // Try primary model first, then fallbacks
    const modelsToTry = [MODEL, MODEL_FALLBACK, MODEL_LEGACY];

    for (const model of modelsToTry) {
      for (const url of MINIMAX_ENDPOINTS) {
        console.log(`[Titanium] Trying: ${model} @ ${url}`);
        try {
          const requestBody = { model, messages: cleanMessages };
          const res = await fetch(url, {
            method: "POST",
            headers: { 
              "Authorization": `Bearer ${key}`, 
              "Content-Type": "application/json" 
            },
            body: JSON.stringify(requestBody),
          });
          
          const data = await res.json().catch(() => ({}));
          
          if (res.ok && data.choices?.[0]?.message?.content) {
            apiResponse = data;
            usedModel = model;
            console.log(`[Titanium] ✅ Success via ${model} @ ${url}`);
            break;
          } else {
            lastError = data.base_resp?.status_msg || data.error?.message || `HTTP ${res.status}`;
            console.warn(`[Titanium] ❌ ${url} (${model}) failed:`, lastError);
          }
        } catch (e) {
          lastError = String(e);
          console.warn(`[Titanium] ❌ ${url} (${model}) fetch error:`, e);
        }
      }
      if (apiResponse) break;
    }

    if (!apiResponse) {
      return new Response(JSON.stringify({ 
        error: "AI service temporarily unavailable. Please try again.",
        last_error: lastError,
        code: "AI_EXHAUSTED"
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const content = apiResponse.choices[0].message.content;
    let result: any = { text: content, message: content };

    // Smart JSON output extractor for structured tasks
    if (task !== "chat" && task !== "query") {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        try { result = JSON.parse(match[0]); } catch { /* text fallback */ }
      }
    }

    return new Response(JSON.stringify({ 
      result, 
      provider: "minimax", 
      model_used: usedModel,
      status: "success" 
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err: any) {
    console.error("[Titanium] Fatal crash:", err);
    return new Response(JSON.stringify({ 
      error: err.message || "Internal server error", 
      code: "CRASH",
      status: "crash" 
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

// ── System prompts per task ─────────────────────────────────────────────
function getSystemPrompt(task: string, input: any): string {
  switch (task) {
    case "listing":
      return `You are an expert real estate and marketplace listing writer for Tulum, Mexico. 
Generate a compelling listing based on the user's input. 
Category: ${input.category || "general"}
Return a JSON object with: title, description, price (number), city, and any relevant category-specific fields.
Always respond with valid JSON only.`;
    
    case "conversation":
      return `You are the Swipess Concierge — a sharp, market-savvy guide to Tulum's rental and services marketplace.
Help the user create a ${input.category || "general"} listing by asking questions and extracting structured data.
When you have enough info, set isComplete to true.
Always return JSON: { "message": "your reply", "extractedData": {}, "isComplete": false }`;
    
    case "enhance":
      return `You are a professional copywriter. Enhance the given text to be more compelling and ${input.tone || "professional"}. 
Return JSON: { "text": "enhanced text" }`;
    
    case "profile":
      return `You are a lifestyle profile writer. Create an engaging bio based on the user's interests and details.
Return JSON: { "bio": "...", "lifestyle": "...", "interests_enhanced": ["..."] }`;
    
    case "search":
      return `You are a smart search assistant for a marketplace in Tulum.
Parse the user's natural language query and extract structured search parameters.
Return JSON: { "category": "property|motorcycle|bicycle|worker|null", "priceMin": null, "priceMax": null, "keywords": [], "suggestion": "..." }`;
    
    default:
      const localFacts = `
      LOCAL KNOWLEDGE BASE (Tulum, Mexico):
      - Transport: Scooters and ATVs are the most efficient way to get around. Taxis are expensive (establish price before entering). No Uber/Lyft in Tulum.
      - Connectivity: Starlink is the gold standard for digital nomads here. Fiber optic is available but can be spotty in some regions of Region 15 or La Veleta.
      - Districts: Centro (Local vibes, food), La Veleta (High-end condos, nomad hub), Region 15 (Up-and-coming, jungle vibes), Aldea Zama (Most developed/luxury), Beach Zone (Expensive, eco-resorts).
      - Seasons: High season (Dec-April, dry, perfect weather), Low season (Sept-Oct, hurricane risk, more rainfall, lowest prices).
      - Water: Tap water is NOT potable. Always use "garrafones" (20L jugs) for drinking and cooking.
      - Electricity: CFE is the provider; outages can occur during heavy storms. Many modern buildings have backup generators.
      `;
      return `You are the Swipess Concierge — a sharp, helpful guide for Tulum's premium real estate, services, and lifestyle. ${localFacts} You can assist with everything from finding dream properties to providing these local tips. Keep it sleek, professional, and market-savvy.`;
  }
}
