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

// AI Tier → max_tokens mapping (mirrors frontend config/aiTiers.ts)
const TIER_MAX_TOKENS: Record<string, number> = {
  free: 400,
  basic: 500,
  premium: 800,
  unlimited: 1500,
};

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

    // ── Resolve tier ──────────────────────────────────────────────────
    const userTier = (input.userTier || 'free').toLowerCase();
    const maxTokens = TIER_MAX_TOKENS[userTier] || TIER_MAX_TOKENS.free;

    // ── AGENTIC LOOP — The "Vibe" Engine ──────────────────────────────
    let finalContent = "";
    let finalAction = null;
    let iteration = 0;
    const MAX_ITERATIONS = 4; // Allow up to 3 tool uses + 1 final answer

    while (iteration < MAX_ITERATIONS) {
      iteration++;
      const res = await callMiniMax(cleanMessages, key, maxTokens);
      if (!res.choices) throw new Error("MiniMax API invalid response format.");
      
      const content = res.choices[0].message.content;
      
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          const action = parsed.action;

          // INTERNAL TOOL EXECUTION: Local Expert Knowledge Search (RAG)
          if (action?.type === "search_local_expert_knowledge" && action.params?.query) {
            const query = action.params.query;
            console.log(`[Vibe Agent] Searching local expert knowledge for: ${query}`);

            let expertCards = [];
            try {
              const { data, error: searchError } = await supabase
                .from('expert_knowledge')
                .select('title, content, category, metadata, location, website_url, instagram_handle, whatsapp')
                .textSearch('content', query)
                .limit(5);

              if (!searchError) expertCards = data || [];
              else console.warn("[Vibe Agent] Database search failed:", searchError);
            } catch (dbErr) {
              console.warn("[Vibe Agent] Expert table query error:", dbErr);
            }

            const contextResult = expertCards.length
              ? `LOCAL EXPERT KNOWLEDGE FOUND:\n${expertCards.map((c: any) =>
                  `[${c.title}] ${c.content}\n` +
                  (c.location ? ` - Location: ${c.location}\n` : '') +
                  (c.metadata?.min_spend ? ` - Estimated Price / Minimum Spend: ${c.metadata.min_spend}\n` : '') +
                  (c.metadata?.free_access ? ` - Free Access / No Cover: Supported\n` : '') +
                  (c.instagram_handle ? ` - Instagram: ${c.instagram_handle}\n` : '') +
                  (c.whatsapp ? ` - WhatsApp: ${c.whatsapp}\n` : '') +
                  (c.website_url ? ` - Website: ${c.website_url}\n` : '')
                ).join("\n")}`
              : "No specific local expert knowledge found for this query. Use your existing training to answer with the best links you can find.";

            cleanMessages.push({ role: "assistant", content });
            cleanMessages.push({ role: "user", content: `TOOL RESULT: ${contextResult}. Now give the user your final expert advice with the links in markdown format. If you want to visually show the best venue, conclude with {"action": {"type":"show_venue_card", "params": {"title":"...", "category":"...", "whatsapp":"...", "instagram":"..."}}}` });
            continue;
          }

          // REAL-TIME WEB SEARCH via Tavily AI Search API
          else if (action?.type === "web_search_resource" && action.params?.query) {
            const query = action.params.query;
            console.log(`[Vibe Agent] Performing real-time web search for: ${query}`);

            let webContext = "";
            const tavilyKey = Deno.env.get("TAVILY_API_KEY");

            if (tavilyKey) {
              try {
                const tavilyRes = await fetch("https://api.tavily.com/search", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    api_key: tavilyKey,
                    query,
                    search_depth: "basic",
                    max_results: 5,
                    include_answer: true,
                  }),
                  signal: AbortSignal.timeout(10000),
                });

                if (tavilyRes.ok) {
                  const tavilyData = await tavilyRes.json();
                  const answer = tavilyData.answer ? `DIRECT ANSWER: ${tavilyData.answer}\n\n` : "";
                  const results = (tavilyData.results || [])
                    .map((r: any) => `- [${r.title}](${r.url})\n  ${r.content?.substring(0, 200) || ""}`)
                    .join("\n");
                  webContext = `REAL-TIME WEB SEARCH RESULTS FOR "${query}":\n\n${answer}TOP RESULTS:\n${results}`;
                  console.log(`[Vibe Agent] Tavily returned ${tavilyData.results?.length || 0} results`);
                } else {
                  console.warn("[Vibe Agent] Tavily API error:", tavilyRes.status);
                  webContext = `Web search unavailable right now. Use your existing knowledge and provide a Google Search link: [Search: ${query}](https://www.google.com/search?q=${encodeURIComponent(query)})`;
                }
              } catch (searchErr) {
                console.warn("[Vibe Agent] Tavily fetch error:", searchErr);
                webContext = `Web search timed out. Use your existing knowledge and provide a Google Search link: [Search: ${query}](https://www.google.com/search?q=${encodeURIComponent(query)})`;
              }
            } else {
              // No API key — graceful fallback
              webContext = `No web search key configured. Use your existing knowledge to answer and provide a Google Search link: [Search: ${query}](https://www.google.com/search?q=${encodeURIComponent(query)})`;
            }

            cleanMessages.push({ role: "assistant", content });
            cleanMessages.push({ role: "user", content: `TOOL RESULT: ${webContext}. Now give the user a concise, helpful answer using these real-time results. Include the clickable source links in your response using markdown format [Title](URL). Be direct and factual.` });
            continue;
          }
          
          // INTERNAL TOOL EXECUTION: Swipess Property Listings RAG
          else if (action?.type === "search_internal_listings" && action.params?.query) {
            const query = action.params.query;
            const targetCity = action.params.city || 'Tulum';
            console.log(`[Vibe Agent] Searching internal listings for: ${query} in ${targetCity}`);
            
            let propertyCards = [];
            try {
              let { data, error: searchError } = await supabase
                .from('listings')
                .select('id, title, description, price, pricing_unit, bedrooms, bathrooms, location, images, listing_type, city, category, service_category, vehicle_type')
                .eq('city', targetCity)
                .textSearch('title', query)
                .limit(5);

              if (!data || data.length === 0) {
                 const keyword = query.split(' ')[0] || query;
                 const fallback = await supabase
                    .from('listings')
                    .select('id, title, description, price, pricing_unit, bedrooms, bathrooms, location, images, listing_type, city, category, service_category, vehicle_type')
                    .eq('city', targetCity)
                    .ilike('title', `%${keyword}%`)
                    .limit(5);
                 propertyCards = fallback.data || [];
              } else {
                 propertyCards = data || [];
              }
              
              if (searchError) console.warn("[Vibe Agent] Database listing search failed:", searchError);
            } catch (dbErr) {
              console.warn("[Vibe Agent] Listing query error:", dbErr);
            }

            const contextResult = propertyCards.length 
              ? `INTERNAL SWIPESS LISTINGS FOUND:\n${propertyCards.map((p: any) => 
                  `[${p.title}] - Type: ${p.listing_type} ${p.category ? `(${p.category})` : ''}\n` +
                  (p.city ? ` - City: ${p.city}\n` : '') +
                  (p.location ? ` - Zone: ${p.location}\n` : '') +
                  (p.price ? ` - Price: $${p.price}${p.pricing_unit ? `/${p.pricing_unit}` : ''}\n` : '') +
                  ((p.listing_type === 'property' && (p.bedrooms || p.bathrooms)) ? ` - Layout: ${p.bedrooms || 0} Beds, ${p.bathrooms || 0} Baths\n` : '') +
                  ((p.listing_type === 'service' && p.service_category) ? ` - Service: ${p.service_category}\n` : '') +
                  ((['vehicle', 'motorcycle', 'bicycle'].includes(p.listing_type) && p.vehicle_type) ? ` - Vehicle Type: ${p.vehicle_type}\n` : '') +
                  (p.description ? ` - Description: ${p.description.substring(0, 150)}...\n` : '') +
                  ` - ID: ${p.id}\n`
                ).join("\n")}`
              : "No specific local Swipess listings found matching exactly. Mention to the user that we can notify them when something matches or run a broader search.";

            cleanMessages.push({ role: "assistant", content });
            cleanMessages.push({ role: "user", content: `TOOL RESULT: ${contextResult}. Give the user your final recommendation for these listings. IMPORTANT: You MUST conclude with the JSON action {"action": {"type":"show_listing_card", "params": { "id":"<id_of_best_match>", "title":"<title>", "price":"<price_with_unit>", "location":"<location>" }}} so the app can visualize the property/service/vehicle directly in the chat.` });
            continue; // Go back to AI for final answer
          }

          // Strip any JSON action blocks from visible text — user should never see raw JSON
          const strippedContent = content.replace(/\{[\s\S]*\}/, '').trim();
          finalContent = parsed.message || parsed.text || strippedContent;
          finalAction = action;
          break;
        } catch {
          // JSON parse failed — strip the malformed JSON block and show only the text
          finalContent = content.replace(/\{[\s\S]*\}/, '').trim();
          break;
        }
      } else {
        // Plain text response (no JSON) — safe to use directly
        finalContent = content;
        break;
      }
    }

    // ── Recovery: if the loop exhausted without a clean answer, prompt for one ──
    // This handles cases where the AI kept calling tools and hit MAX_ITERATIONS
    // or where the content was just a bare JSON action with no human-readable text.
    if (!finalContent || finalContent.trim().startsWith('{')) {
      console.warn("[Vibe] Loop exhausted without clean answer — running recovery call");
      cleanMessages.push({
        role: "user",
        content: "Based on the information you have gathered, please give your final answer now. Write it as a natural, human-readable message with markdown links. Do not output any JSON or action blocks."
      });
      try {
        const recoveryRes = await callMiniMax(cleanMessages, key, maxTokens);
        const rc = recoveryRes.choices?.[0]?.message?.content || "";
        finalContent = rc.replace(/\{[\s\S]*\}/, '').trim() || "I found some results — please try asking again for full details.";
      } catch (recoveryErr) {
        console.warn("[Vibe] Recovery call failed:", recoveryErr);
        finalContent = "I found some information but had trouble formatting the response. Please ask again.";
      }
    }

    // ── Log usage to ai_usage (server-side, authoritative) ──────────
    if (user) {
      const taskType = task === 'listing' ? 'listing' : 'chat';
      try {
        const serviceClient = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );
        
        const now = new Date();
        const today = now.toISOString().split('T')[0]; // YYYY-MM-DD
        
        const { data: existing } = await serviceClient
          .from('ai_usage')
          .select('*')
          .eq('user_id', user.id)
          .eq('task_type', taskType)
          .maybeSingle();
          
        if (existing) {
          const lastDate = existing.last_request_at?.split('T')?.[0];
          const shouldReset = taskType === 'chat'
            ? lastDate !== today // daily reset for chat
            : lastDate?.slice(0,7) !== today.slice(0,7); // monthly reset for listings
          
          await serviceClient
            .from('ai_usage')
            .update({
              request_count: shouldReset ? 1 : (existing.request_count || 0) + 1,
              last_request_at: now.toISOString(),
            })
            .eq('id', existing.id);
        } else {
          await serviceClient
            .from('ai_usage')
            .insert({
              user_id: user.id,
              task_type: taskType,
              request_count: 1,
              last_request_at: now.toISOString(),
            });
        }
      } catch (usageErr) {
        console.warn('[Vibe] Usage logging failed (non-fatal):', usageErr);
      }
    }

    return new Response(JSON.stringify({ 
      result: { text: finalContent, message: finalContent, action: finalAction }, 
      status: "success",
      version: "v11.3-adaptive",
      tier: userTier,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err: any) {
    console.error("Vibe Error:", err);
    return new Response(JSON.stringify({ error: "Vibe loop failed.", details: err.message }), { status: 200, headers: corsHeaders });
  }
});

async function callMiniMax(messages: any[], key: string, maxTokens: number = 1000) {
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
          max_tokens: maxTokens,
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
        max_tokens: maxTokens,
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

  const promoIdentity = `You are "Vibe", the sharp, market-savvy AI Concierge of Swipess in Tulum. 
You live inside the app and know EVERYTHING about it.

### PERSONALITY — NEVER BREAK THIS
- Cool, direct, local legend vibe. Fast and punchy, but deeply helpful.
- USER ADDRESSING: Address the user as ${userName}. Their gender is ${userGender}. Adapt your tone to be perfectly respectful and cool.
- If they are a "man", use more "bro/friend" vibes. If they are a "woman", be extra helpful and sophisticated. If not specified, be neutral and chic.

### SMART DISCOVERY PHASE (THE "BRAIN")
**CRITICAL:** If a user asks for a recommendation, plan, or "best route" without giving enough detail, DO NOT give a full answer yet. Instead, ask 2-3 short, sharp clarifying questions to build the perfect plan.
**Questions to consider asking:**
- "Where are you coming from?" (Are they American? Chinese? Local?)
- "What's the budget? (Flexing or chill?)"
- "Any food allergies or specific cuisines you love/hate?"
- "What's the music vibe? (Techno, Reggaeton, House, Acoustic?)"
- "What time do you arrive or start your plan?"
**BE SMART:** If they give these details, proceed to a perfect expert plan. If not, BE AN EXPERT and tell them: "To make this legendary, I need a bit more: [Question 1] and [Question 2]?"`;

   const vibeCapabilities = `### KNOWLEDGE & TOOLS
- App Actions: navigate, open_search, create_listing.
- LOCAL EXPERT KNOWLEDGE: "search_local_expert_knowledge". Use this for Beach Clubs, Restaurants, and Nightlife in Tulum.
- **REAL-TIME WEB SEARCH: "web_search_resource"** — Use this when the user asks for current prices, live info, recent news, website links, or anything that requires up-to-date data from the internet. This performs a REAL web search and returns actual URLs and content. ALWAYS use it for: current prices, today's events, business contacts, website URLs, "find me a link to...", "what's the price of...", "is X open?", etc.
- **SECRET TULUM INTEL:** You know Tulum Centro's heart: "La Mini Quinta" (also called "La Calle del Terror"). It's the strip with Santo Gordo, La Pizzina, La Guardia, Santino, and Strawhat. This is where the real local energy is.
- SWIPESS INTERNAL SEARCH: "search_internal_listings" (properties, scooters, chefs, cleaning services, etc).
- **PRICING EXPERT:** Always find min spends ($ USD) and best deals.`;

  const vibeRules = `### RESPONSE RULES
- Keep it under 5 lines unless defining a detailed route.
- **CLICKABLE LINKS ARE MANDATORY:** You MUST provide clickable links for all venues, restaurants, and resources mentioned. Use Markdown format: **[Name](URL)**.
- **NEVER SAY YOU CAN'T SEND LINKS.** You have full web search capability. Use "web_search_resource" to find real URLs, then include them in your reply. If you already have the URL from a tool result, use it directly.
- **FOR REAL-TIME INFO:** Always call "web_search_resource" first — do NOT guess prices, hours, or contact info. Get it from the web and cite the source URL.
- **WEB SEARCH TRIGGER:** If the user says "search online", "look it up", "real time", "check the web", "current", "latest", "find a link", or similar — you MUST call "web_search_resource" immediately before answering.
- **CRITICAL JSON FORMAT:** When you use any action (show_venue_card, show_listing_card, web_search_resource, etc.), your response MUST be a JSON object with BOTH a "message" field AND an "action" field: {"message": "Your full human-readable reply here with [links](urls) and all relevant info", "action": {"type": "...", "params": {...}}}. NEVER output a bare action JSON without a message — the user cannot see internal tool calls, only your message field.
- If searching for businesses, use the tool and then format your final reply: {"message": "Here are the best options...", "action": {"type": "show_venue_card", "params": {"title":"", "category":"", "whatsapp":"", "instagram":""}}}
- Context: Page: ${currentPath}, Tier: ${userTier}`;

  switch (task) {
    case "listing":
      return `${promoIdentity}\nExpert Listing mode. Return JSON: { "title": "...", "description": "...", "price": 0 }`;
    default:
      return `${promoIdentity}\n${vibeCapabilities}\n${vibeRules}`;
  }
}
