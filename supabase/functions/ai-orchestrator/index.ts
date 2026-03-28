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
    const MAX_ITERATIONS = 2;

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

          // INTERNAL TOOL EXECUTION: Expert Knowledge Search (RAG)
          if ((action?.type === "search_local_expert_knowledge" || action?.type === "web_search_resource") && action.params?.query) {
            const query = action.params.query;
            console.log(`[Vibe Agent] Searching local knowledge/web for: ${query}`);
            
            // Query Supabase for local expert cards or info
            let expertCards = [];
            let curatedLinks = "";
            try {
              const { data, error: searchError } = await supabase
                .from('expert_knowledge')
                .select('title, content, category, metadata, location, website_url, instagram_handle, whatsapp')
                .textSearch('content', query)
                .limit(5);
              
              if (!searchError) expertCards = data || [];
              else console.warn("[Vibe Agent] Database search failed (perhaps table missing?):", searchError);
            } catch (dbErr) {
              console.warn("[Vibe Agent] Expert table not found or query error:", dbErr);
            }

            // Fallback: If searching for tacos/instagram/links, provide curated links
            const lowerQuery = query.toLowerCase();
            if (lowerQuery.includes("taco")) {
              curatedLinks = "\nCURATED LINK: [Tacos Rigo - Best Tacos in Tulum](https://www.google.com/search?q=Tacos+Rigo+Tulum)";
            } else if (lowerQuery.includes("instagram") || lowerQuery.includes("contact")) {
              curatedLinks = "\nCURATED LINK: [Instagram @swipe_tulum](https://instagram.com/swipe_tulum)";
            }

            const contextResult = (expertCards.length || curatedLinks)
              ? `LOCAL EXPERT KNOWLEDGE FOUND:\n${expertCards.map((c: any) => 
                  `[${c.title}] ${c.content}\n` +
                  (c.location ? ` - Location: ${c.location}\n` : '') +
                  (c.metadata?.min_spend ? ` - Estimated Price / Minimum Spend: ${c.metadata.min_spend}\n` : '') +
                  (c.metadata?.free_access ? ` - Free Access / No Cover: Supported\n` : '') +
                  (c.instagram_handle ? ` - Instagram: ${c.instagram_handle}\n` : '') +
                  (c.whatsapp ? ` - WhatsApp: ${c.whatsapp}\n` : '') +
                  (c.website_url ? ` - Website: ${c.website_url}\n` : '')
                ).join("\n")}${curatedLinks}`
              : "No specific local expert knowledge found for this query. Use your existing training to answer with the best links you can find.";

            cleanMessages.push({ role: "assistant", content });
            cleanMessages.push({ role: "user", content: `TOOL RESULT: ${contextResult}. Now give the user your final expert advice with the links in markdown format. If you want to visually show the best venue, conclude with {"action": {"type":"show_venue_card", "params": {"title":"...", "category":"...", "whatsapp":"...", "instagram":"..."}}}` });
            continue; // Go back to AI for final answer
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
                .select('id, title, description, price_per_month, bedrooms, bathrooms, location, images, listing_type, city')
                .eq('city', targetCity)
                .textSearch('title', query)
                .limit(5);

              if (!data || data.length === 0) {
                 const keyword = query.split(' ')[0] || query;
                 const fallback = await supabase
                    .from('listings')
                    .select('id, title, description, price_per_month, bedrooms, bathrooms, location, images, listing_type, city')
                    .eq('city', targetCity)
                    .ilike('title', `%${keyword}%`)
                    .limit(5);
                 propertyCards = fallback.data || [];
              } else {
                 propertyCards = data || [];
              }
              
              if (searchError) console.warn("[Vibe Agent] Database property search failed:", searchError);
            } catch (dbErr) {
              console.warn("[Vibe Agent] Property query error:", dbErr);
            }

            const contextResult = propertyCards.length 
              ? `INTERNAL REAL ESTATE FOUND:\n${propertyCards.map((p: any) => 
                  `[${p.title}] - ${p.listing_type}\n` +
                  (p.city ? ` - City: ${p.city}\n` : '') +
                  (p.location ? ` - Zone: ${p.location}\n` : '') +
                  (p.price_per_month ? ` - Price: $${p.price_per_month}/mo\n` : '') +
                  ((p.bedrooms || p.bathrooms) ? ` - Layout: ${p.bedrooms || 0} Beds, ${p.bathrooms || 0} Baths\n` : '') +
                  (p.description ? ` - Description: ${p.description.substring(0, 100)}...\n` : '') +
                  ` - ID: ${p.id}\n`
                ).join("\n")}`
              : "No specific local Swipess properties found matching exactly. Mention to the user that we can notify them when something matches or run a broader search.";

            cleanMessages.push({ role: "assistant", content });
            cleanMessages.push({ role: "user", content: `TOOL RESULT: ${contextResult}. Give the user your final recommendation for these properties. IMPORTANT: You MUST conclude with the JSON action {"action": {"type":"show_listing_card", "params": { "id":"<id_of_best_property>", "title":"<property_title>", "price":"<property_price>", "location":"<property_location>" }}} so the app can visualize the property directly in the chat.` });
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

  const promoIdentity = `You are "Vibe", the official AI Concierge of Swipess. 
You live inside the app and know EVERYTHING about it.

### PERSONALITY — NEVER BREAK THIS
- Cool, direct, zero fluff. Short sentences. Small answers. Fast.
- Laid-back local legend vibe. 
- USER ADDRESSING: Address the user as ${userName}. Their gender is ${userGender}. Adapt your tone to be perfectly respectful and cool based on this.
- If they are a "man", use more "bro/friend" vibes. If they are a "woman", be extra helpful and sophisticated. If not specified, be neutral and chic.`;

   const vibeCapabilities = `### KNOWLEDGE & TOOLS
- App Actions: navigate, open_search, create_listing.
- PERSISTENT KNOWLEDGE TOOL: "search_local_expert_knowledge" (params: { "query": "Your search term" }). Use this whenever you are asked about Tulum businesses, beach clubs, or restaurants.
- SWIPESS PROPERTY SEARCH: "search_internal_listings" (params: { "query": "villa, apartment, 2 bedrooms...", "city": "Tulum" }). Use this whenever the user asks for apartments, properties, or rentals!
- WEB SEARCH: "web_search_resource" (params: { "query": "Your search for tacos, instagram, etc" }).
- **PRICING & EXPERTIZE EXPERT:** Get the best prices, spots, and exact numbers. Find the minimum spend (min_spend). Give precise numbers.
- Provide the top 3-4 options for best prices and value.`;

  const vibeRules = `### RESPONSE RULES
- Max 4-5 lines. Fast and punchy.
- AI Card Rendering formatting: ALWAYS structure your final reply with an action: { "message": "text", "action": { "type": "show_venue_card", "params": {"title":"", "category":"", "whatsapp":""} } } or "show_listing_card" for properties!
- Context: Page: ${currentPath}, Tier: ${userTier}`;

  switch (task) {
    case "listing":
      return `${promoIdentity}\nExpert Listing mode. Return JSON: { "title": "...", "description": "...", "price": 0 }`;
    default:
      return `${promoIdentity}\n${vibeCapabilities}\n${vibeRules}`;
  }
}
