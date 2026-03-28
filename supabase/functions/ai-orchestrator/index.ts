import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// TITANIUM V10 — "Vibe" Agentic Loop Edition
const MINIMAX_ENDPOINTS = [
  "https://api.minimax.io/v1/text/chatcompletion_v2",
  "https://api.minimax.io/v1/chat/completions",
];

const MODEL = "MiniMax-M2.7";
const FALLBACK_MODEL = "MiniMax-M2.5";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const key = Deno.env.get("MINIMAX_API_KEY");
    if (!key) return new Response(JSON.stringify({ error: "Missing API Key." }), { status: 200, headers: corsHeaders });

    const payload = await req.json().catch(() => ({}));
    const task = payload.task || "chat";
    const input = payload.data || payload;

    // Fast warm-up for cold starts
    if (task === "ping") {
      return new Response(JSON.stringify({ status: "ready" }), { status: 200, headers: corsHeaders });
    }

    // ── Auth ──────────────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!, 
      Deno.env.get("SUPABASE_ANON_KEY")!, 
      { global: { headers: { Authorization: authHeader || "" } } }
    );
    const { data: { user } } = await supabase.auth.getUser();

    // ── Prompt DNA ────────────────────────────────────────────────────
    const messages = input.messages || [];
    if (input.query && (!messages.length || messages[messages.length - 1].content !== input.query)) {
      messages.push({ role: "user", content: input.query });
    }

    const cleanMessages = messages.map((m: any) => ({
      role: m.role === "assistant" ? "assistant" : (m.role === "system" ? "system" : "user"),
      content: m.content || m.text || ""
    }));

    const systemPrompt = getVibePrompt(task, input, user);
    cleanMessages.unshift({ role: "system", content: systemPrompt });

    // ── AGENTIC LOOP — The "Vibe" Engine ──────────────────────────────
    let finalContent = "";
    let finalAction = null;
    let iteration = 0;
    const MAX_ITERATIONS = 2;

    while (iteration < MAX_ITERATIONS) {
      iteration++;
      const res = await callMiniMax(cleanMessages, key);
      const content = res.choices[0].message.content;
      
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          const action = parsed.action;

          // INTERNAL TOOL EXECUTION: Expert Knowledge Search (RAG)
          if (action?.type === "search_local_expert_knowledge" && action.params?.query) {
            console.log(`[Vibe Agent] Searching local knowledge for: ${action.params.query}`);
            
            // Query Supabase for local expert cards
            const { data: expertCards, error: searchError } = await supabase
              .from('expert_knowledge')
              .select('title, content, category')
              .textSearch('content', action.params.query)
              .limit(3);

            if (searchError) {
              console.error("[Vibe Agent] Search Error:", searchError);
            }

            const contextResult = expertCards?.length 
              ? `LOCAL EXPERT KNOWLEDGE FOUND:\n${expertCards.map((c: any) => `[${c.title}] ${c.content}`).join("\n")}`
              : "No specific local expert knowledge found for this query. Use your existing training.";

            cleanMessages.push({ role: "assistant", content });
            cleanMessages.push({ role: "user", content: `TOOL RESULT: ${contextResult}. Now give the user your final expert advice based on this.` });
            continue; // Go back to AI for final answer
          }

          finalContent = parsed.message || parsed.text || content;
          finalAction = action;
          break;
        } catch {
          finalContent = content;
          break;
        }
      } else {
        finalContent = content;
        break;
      }
    }

    return new Response(JSON.stringify({ 
      result: { text: finalContent, message: finalContent, action: finalAction }, 
      status: "success",
      version: "v10.1-vibe-agent"
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err: any) {
    console.error("Vibe Error:", err);
    return new Response(JSON.stringify({ error: "Vibe loop failed.", details: err.message }), { status: 200, headers: corsHeaders });
  }
});

async function callMiniMax(messages: any[], key: string) {
  const url = MINIMAX_ENDPOINTS[0];
  
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODEL, messages, temperature: 0.7, max_tokens: 800 }),
    });
    
    if (res.ok) return await res.json();
    
    const errorData = await res.json().catch(() => ({}));
    console.warn(`[Vibe] Primary Model (${MODEL}) failed: ${res.status}. Trying fallback...`);
    
    // Fallback logic
    const fallbackRes = await fetch(url, {
      method: "POST",
      headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: FALLBACK_MODEL, messages, temperature: 0.7, max_tokens: 800 }),
    });

    if (!fallbackRes.ok) {
      const fallbackErr = await fallbackRes.json().catch(() => ({}));
      throw new Error(`MiniMax API Fatal: ${JSON.stringify(fallbackErr)}`);
    }

    return await fallbackRes.json();
  } catch (e) {
    throw e;
  }
}

function getVibePrompt(task: string, input: any, user: any): string {
  const userName = input.userName || user?.user_metadata?.full_name || "Friend";
  const userTier = input.userTier || "Basic";
  const currentPath = input.currentPath || "/dashboard";

  const promoIdentity = `You are "Vibe", the official AI Concierge of Swipess. 
You live inside the app and know EVERYTHING about it: listings (properties, motos, bicycles), filters, pages, user actions, and the real local scene in Quintana Roo / Tulum / Cancún.

### PERSONALITY — NEVER BREAK THIS
- Cool, direct, zero fluff. Max 100 words. Short sentences. Small answers. Fast.
- Laid-back local legend vibe: part surfer, part yogi, part jungle-party DJ, part sharp businessman. Drop witty comments only when natural.
- You are the expert. You do NOT say "maybe" or "I think". 
- Confident but never arrogant. Train the user to trust you.
- End every useful reply with a clear next step: "What else do you need?" or "Want me to open that listing?"`;

  const vibeCapabilities = `### KNOWLEDGE & TOOLS
- App Actions: navigate, open_search, create_listing.
- PERSISTENT KNOWLEDGE TOOL: "search_local_expert_knowledge" (params: { "query": "Your search term" }). 
- CRITICAL: If asked about local spots (beaches, tacos, clubs, prices, events), you MUST call search_local_expert_knowledge first if you aren't 100% sure of the latest info.
- Local Advice Rule: Name top 3-5 options. One-sentence reason why they hit. One-sentence why the rest don't. Connect to user's goal.`;

  const vibeRules = `### RESPONSE RULES
- Max 4-5 lines. Bullet points for options.
- User Name: ${userName}. Action format: { "message": "text", "action": { "type": "...", "params": {...} } }
- Context: Page: ${currentPath}, Tier: ${userTier}`;

  switch (task) {
    case "listing":
      return `${promoIdentity}\nExpert Listing mode. Return JSON: { "title": "...", "description": "...", "price": 0 }`;
    default:
      return `${promoIdentity}\n${vibeCapabilities}\n${vibeRules}`;
  }
}
