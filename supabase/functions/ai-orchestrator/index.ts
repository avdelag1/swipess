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

    // ── Profile DNA ──────────────────────────────────────────────────
    const { data: profile } = user ? await supabase
      .from('profiles')
      .select('full_name, gender, bio')
      .eq('id', user.id)
      .single() : { data: null };

    const systemPrompt = getVibePrompt(task, input, user, profile);
    cleanMessages.unshift({ role: "system", content: systemPrompt });

    // ── AGENTIC LOOP — The "Vibe" Engine ──────────────────────────────
    let finalContent = "";
    let finalAction = null;
    let iteration = 0;
    const MAX_ITERATIONS = 2;

    while (iteration < MAX_ITERATIONS) {
      iteration++;
      const res = await callMiniMax(cleanMessages, key);
      if (!res.choices) throw new Error("MiniMax API invalid response format.");
      
      const content = res.choices[0].message.content;
      
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          const action = parsed.action;

          // INTERNAL TOOL EXECUTION: Expert Knowledge Search (RAG)
          if ((action?.type === "search_local_expert_knowledge" || action?.type === "web_search_resource") && action.params?.query) {
            const query = action.params.query;
            console.log(`[Vibe Agent] Searching local knowledge/web for: ${query}`);
            
            // Query Supabase for local expert cards or info
            let { data: expertCards, error: searchError } = await supabase
              .from('expert_knowledge')
              .select('title, content, category, metadata, location, website_url, instagram_handle, whatsapp')
              .textSearch('content', query)
              .limit(5);

            // Fallback: If searching for tacos/instagram/links, provide curated links
            const lowerQuery = query.toLowerCase();
            let curatedLinks = "";
            if (lowerQuery.includes("taco")) {
              curatedLinks = "\nCURATED LINK: [Tacos Rigo - Best Tacos in Tulum](https://www.google.com/search?q=Tacos+Rigo+Tulum)";
            } else if (lowerQuery.includes("instagram") || lowerQuery.includes("contact")) {
              curatedLinks = "\nCURATED LINK: [Instagram @swipe_tulum](https://instagram.com/swipe_tulum)";
            }

            if (searchError) {
              console.error("[Vibe Agent] Search Error:", searchError);
            }

            const contextResult = (expertCards?.length || curatedLinks)
              ? `LOCAL EXPERT KNOWLEDGE FOUND:\n${expertCards?.map((c: any) => 
                  `[${c.title}] ${c.content}\n` +
                  (c.location ? ` - Location: ${c.location}\n` : '') +
                  (c.instagram_handle ? ` - Instagram: ${c.instagram_handle}\n` : '') +
                  (c.whatsapp ? ` - WhatsApp: ${c.whatsapp}\n` : '') +
                  (c.website_url ? ` - Website: ${c.website_url}\n` : '') +
                  (c.metadata?.link ? ` - Link: ${c.metadata.link}\n` : '')
                ).join("\n")}${curatedLinks}`
              : "No specific local expert knowledge found for this query. Use your existing training to answer with the best links you can find.";

            cleanMessages.push({ role: "assistant", content });
            cleanMessages.push({ role: "user", content: `TOOL RESULT: ${contextResult}. Now give the user your final expert advice with the links in markdown format.` });
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
      version: "v11.3-adaptive"
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
  let lastError = null;

  // Retry Loop: 2 attempts for Primary, 1 for Fallback
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      console.log(`[Vibe] Calling MiniMax (Model: ${MODEL}, Attempt: ${attempt + 1})`);
      const res = await fetch(url, {
        method: "POST",
        headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ 
          model: MODEL, 
          messages, 
          temperature: 0.7, 
          max_tokens: 1000,
          signal: AbortSignal.timeout(25000) 
        }),
      });
      
      if (res.ok) return await res.json();
      
      const errorData = await res.json().catch(() => ({}));
      console.warn(`[Vibe] Primary Model (${MODEL}) attempt ${attempt + 1} failed: ${res.status}.`, errorData);
      lastError = errorData;
    } catch (e) {
      console.error(`[Vibe] Fetch error (Attempt ${attempt + 1}):`, e);
      lastError = e;
    }
  }

  // Fallback logic
  console.warn(`[Vibe] All primary attempts failed. Trying fallback model: ${FALLBACK_MODEL}`);
  try {
    const fallbackRes = await fetch(url, {
      method: "POST",
      headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ 
        model: FALLBACK_MODEL, 
        messages, 
        temperature: 0.7, 
        max_tokens: 1000,
        signal: AbortSignal.timeout(30000) 
      }),
    });

    if (!fallbackRes.ok) {
      const fallbackErr = await fallbackRes.json().catch(() => ({}));
      throw new Error(`MiniMax API Fatal (Fallback also failed): ${JSON.stringify(fallbackErr)}`);
    }

    return await fallbackRes.json();
  } catch (e) {
    throw lastError || e;
  }
}

function getVibePrompt(task: string, input: any, user: any, profile: any): string {
  const userName = profile?.full_name || input.userName || user?.user_metadata?.full_name || "Friend";
  const userGender = profile?.gender || "not specified";
  const userTier = input.userTier || "Basic";
  const currentPath = input.currentPath || "/dashboard";

  const promoIdentity = `You are "Vibe", the official AI Concierge of Swipess. 
You live inside the app and know EVERYTHING about it.

### PERSONALITY — NEVER BREAK THIS
- Cool, direct, zero fluff. Short sentences. Small answers. Fast.
- Laid-back local legend vibe. 
- USER ADDRESSING: Address the user as ${userName}. Their gender is ${userGender}. Adapt your tone to be perfectly respectful and cool based on this.
- If they are a "man", use more "bro/friend" vibes. If they are a "woman", be extra helpful and sophisticated. If not specified, be neutral and chic.`;

  const vibeCapabilities = `### KNOWLEDGE & TOOLS
- App Actions: navigate, open_search, create_listing.
- PERSISTENT KNOWLEDGE TOOL: "search_local_expert_knowledge" (params: { "query": "Your search term" }).
- WEB SEARCH: "web_search_resource" (params: { "query": "Your search for tacos, instagram, etc" }). 
- Local Advice Rule: Name top 3-5 options. Always include direct links (Markdown format [Title](URL)) if you know them.
- If you don't know a link, encourage searching the web for a specific term.`;

  const vibeRules = `### RESPONSE RULES
- Max 4-5 lines. Bullet points for options.
- Action format: { "message": "text", "action": { "type": "...", "params": {...} } }
- Context: Page: ${currentPath}, Tier: ${userTier}`;

  switch (task) {
    case "listing":
      return `${promoIdentity}\nExpert Listing mode. Return JSON: { "title": "...", "description": "...", "price": 0 }`;
    default:
      return `${promoIdentity}\n${vibeCapabilities}\n${vibeRules}`;
  }
}
