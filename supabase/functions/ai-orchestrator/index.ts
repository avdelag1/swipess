import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MINIMAX_ENDPOINTS = [
  "https://api.minimax.io/v1/text/chatcompletion_v2",
  "https://api.minimax.io/v1/chat/completions",
];

const MODELS = ["MiniMax-M2.5", "MiniMax-M2.7", "MiniMax-M2"];

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
    if (!key) return new Response(JSON.stringify({ error: "Missing API Key." }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const payload = await req.json().catch(() => ({}));
    const task = payload.task || "chat";
    const input = payload.data || payload;

    if (task === "ping") {
      return new Response(JSON.stringify({ status: "ready" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── Auth ──
    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader || "" } } }
    );
    const { data: { user } } = await supabase.auth.getUser();

    // ── Context Gathering ──
    let profile: any = null;
    let memories: any[] = [];
    let activeListing: any = null;

    const context = input.context || {};
    const listingId = context.listingId;
    const currentPath = context.currentPath || "/";

    if (user) {
      try {
        const profilePromise = supabase.from('profiles').select('*').eq('id', user.id).single();
        const memoriesPromise = supabase.from('user_memories').select('*').eq('user_id', user.id).limit(20).then(r => r).catch(() => ({ data: [] }));
        const listingPromise = listingId ? supabase.from('listings').select('*').eq('id', listingId).maybeSingle() : Promise.resolve({ data: null });

        const [profileRes, memoriesRes, listingRes] = await Promise.all([profilePromise, memoriesPromise, listingPromise]);
        profile = profileRes.data;
        memories = memoriesRes.data || [];
        activeListing = listingRes.data;
      } catch (e) {
        console.error("[AI Orchestrator] Context fetch error:", e);
      }
    }

    const messages = input.messages || [];
    const cleanMessages = messages.map((m: any) => ({
      role: m.role || "user",
      content: m.content || m.text || ""
    }));

    const maxTokens = TIER_MAX_TOKENS[profile?.ai_tier || "free"] || 500;
    const systemPrompt = getVibePrompt(task, input, user, profile, memories, activeListing, currentPath);
    cleanMessages.unshift({ role: "system", content: systemPrompt });

    // ── Agentic Loop ──
    const maxLoops = 6;
    let loopCount = 0;
    let finalContent = "";
    let finalAction = null;

    while (loopCount < maxLoops) {
      loopCount++;
      const res = await callMiniMax(cleanMessages, key, maxTokens);
      const content = res.choices?.[0]?.message?.content || "";
      if (!content) break;

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          const action = parsed.action;

          if (action?.type === "search_local_expert_knowledge" && action.params?.query) {
            const { data } = await supabase.from('expert_knowledge').select('*').ilike('content', `%${action.params.query}%`).limit(5);
            cleanMessages.push({ role: "assistant", content });
            cleanMessages.push({ role: "user", content: `RESULTS: ${JSON.stringify(data || [])}` });
            continue;
          }
          else if (action?.type === "search_events" && action.params?.query) {
            const { data } = await supabase.from('events').select('*').or(`title.ilike.%${action.params.query}%,description.ilike.%${action.params.query}%`).eq('is_published', true).limit(5);
            cleanMessages.push({ role: "assistant", content });
            cleanMessages.push({ role: "user", content: `EVENTS: ${JSON.stringify(data || [])}. Links: /events?id=ID` });
            continue;
          }
          else if (action?.type === "search_internal_listings" && action.params?.query) {
            const { data } = await supabase.from('listings').select('*').ilike('title', `%${action.params.query}%`).limit(5);
            cleanMessages.push({ role: "assistant", content });
            cleanMessages.push({ role: "user", content: `LISTINGS: ${JSON.stringify(data || [])}` });
            continue;
          }
          else if (action?.type === "initiate_match" && action.params?.listing_id) {
            if (!user) {
              cleanMessages.push({ role: "assistant", content });
              cleanMessages.push({ role: "user", content: "Error: No user" });
              continue;
            }
            const { error } = await supabase.from('matches').insert({ user_id: user.id, listing_id: action.params.listing_id, owner_id: action.params.owner_id || 'unknown' }).select().single();
            cleanMessages.push({ role: "assistant", content });
            cleanMessages.push({ role: "user", content: error ? `Error: ${error.message}` : "SUCCESS: Match initiated." });
            continue;
          }
          else if (action?.type === "search_web" && action.params?.query) {
            const tavilyKey = Deno.env.get("TAVILY_API_KEY");
            if (!tavilyKey) {
              cleanMessages.push({ role: "assistant", content });
              cleanMessages.push({ role: "user", content: "Error: Web search disabled." });
              continue;
            }
            const tvRes = await fetch("https://api.tavily.com/search", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ api_key: tavilyKey, query: action.params.query, search_depth: "basic" })
            });
            const tvJson = await tvRes.json();
            const webResults = tvJson.results?.map((r: any) => ({ title: r.title, content: r.content, url: r.url })) || [];
            cleanMessages.push({ role: "assistant", content });
            cleanMessages.push({ role: "user", content: `WEB SEARCH RESULTS: ${JSON.stringify(webResults)}` });
            continue;
          }
          else if (action?.type === "search_experts" && action.params?.query) {
            const { data } = await supabase.from('profiles').select('id, full_name, bio, lifestyle_tags').or(`full_name.ilike.%${action.params.query}%,bio.ilike.%${action.params.query}%`).eq('is_expert', true).limit(5);
            cleanMessages.push({ role: "assistant", content });
            cleanMessages.push({ role: "user", content: `EXPERTS FOUND: ${JSON.stringify(data || [])}. Links: /profile/ID` });
            continue;
          }
          else if (action?.type === "get_market_averages" && action.params?.neighborhood) {
            const { data } = await supabase.from('listings').select('price').eq('neighborhood', action.params.neighborhood).eq('category', action.params.category || 'property');
            const prices = data?.map(l => l.price).filter(Boolean) || [];
            const avg = prices.length ? (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(0) : "N/A";
            cleanMessages.push({ role: "assistant", content });
            cleanMessages.push({ role: "user", content: `MARKET DATA for ${action.params.neighborhood}: Avg Price $${avg} (based on ${prices.length} samples)` });
            continue;
          }
          else if (action?.type === "save_user_memory" && action.params?.content) {
            if (!user) {
              cleanMessages.push({ role: "assistant", content });
              cleanMessages.push({ role: "user", content: "Error: No user to save memory for." });
              continue;
            }
            const { error } = await supabase.from('user_memories').insert({ user_id: user.id, content: action.params.content, importance: action.params.importance || 1 });
            cleanMessages.push({ role: "assistant", content });
            cleanMessages.push({ role: "user", content: error ? `Error: ${error.message}` : "SUCCESS: Memory saved. I will remember this for future sessions." });
            continue;
          }
          else if (action?.type === "calculate_roi") {
            const price = action.params?.purchase_price || 0;
            const rent = action.params?.monthly_rent || 0;
            if (!price || !rent) {
              cleanMessages.push({ role: "assistant", content });
              cleanMessages.push({ role: "user", content: "Error: Missing price or rent for ROI." });
              continue;
            }
            const annualNet = (rent * 12) * 0.7;
            const roiPercent = ((annualNet / price) * 100).toFixed(2);
            const paybackYears = (price / annualNet).toFixed(1);
            cleanMessages.push({ role: "assistant", content });
            cleanMessages.push({ role: "user", content: `ROI CALC: ${roiPercent}% annually. Payback: ${paybackYears} years. (Estimate assumes 70% net after property management + taxes)` });
            continue;
          }
          else if (action?.type === "search_listings_by_vibe" && action.params?.query) {
            const { data } = await supabase.from('listings').select('id, title, description, price, category, neighborhood')
              .or(`description.ilike.%${action.params.query}%,title.ilike.%${action.params.query}%`)
              .eq('status', 'active').limit(5);
            cleanMessages.push({ role: "assistant", content });
            cleanMessages.push({ role: "user", content: `VIBE RESULTS for "${action.params.query}": ${JSON.stringify(data || [])}. Links: /listing/ID` });
            continue;
          }
          else if (action?.type === "create_itinerary") {
            cleanMessages.push({ role: "assistant", content });
            cleanMessages.push({ role: "user", content: "Logic accepted. Now output the Markdown table itinerary." });
            continue;
          }

          finalContent = parsed.message || content.replace(/\{[\s\S]*\}/, '').trim();
          finalAction = action;
          break;
        } catch {
          finalContent = content.trim();
          break;
        }
      } else {
        finalContent = content.trim();
        break;
      }
    }

    return new Response(JSON.stringify({
      result: { text: finalContent, action: finalAction },
      status: "success"
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err: any) {
    console.error("[AI Orchestrator] Error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

async function callMiniMax(messages: any[], key: string, maxTokens: number = 1000) {
  const attempts = [
    { url: MINIMAX_ENDPOINTS[0], model: MODELS[0] },
    { url: MINIMAX_ENDPOINTS[1], model: MODELS[0] },
    { url: MINIMAX_ENDPOINTS[0], model: MODELS[1] },
    { url: MINIMAX_ENDPOINTS[1], model: MODELS[1] },
  ];

  let lastError: any = null;
  for (const attempt of attempts) {
    try {
      const res = await fetch(attempt.url, {
        method: "POST",
        headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: attempt.model, messages, temperature: 0.7, max_tokens: maxTokens }),
      });
      const json = await res.json();
      if (json.error || json.base_resp?.status_code > 0) {
        lastError = json.error || json.base_resp;
        continue;
      }
      if (json.choices?.[0]?.message?.content) {
        return json;
      }
      lastError = { message: "Empty response" };
    } catch (e) {
      lastError = e;
    }
  }

  console.error("[AI Orchestrator] All MiniMax attempts failed:", lastError);
  return { choices: [{ message: { content: "I'm having trouble connecting right now. Please try again in a moment. 🙏" } }] };
}

function getVibePrompt(task: string, input: any, user: any, profile: any, memories: any[], activeListing?: any, currentPath?: string): string {
  const name = profile?.full_name || "Friend";
  const listingContext = activeListing ? `| User is viewing: ${activeListing.title} ($${activeListing.price} in ${activeListing.neighborhood})` : "";

  return `
### IDENTITY
You are the Swipess Sentient Concierge, known as "Vibe". 
You are a Tulum local legend—direct, sophisticated, and deeply connected.
User: ${name} | Memories: ${memories.map(m => m.content).join('; ')}
Location Context: ${currentPath} ${listingContext}

### TULUM DNA
- **La Veleta**: The jungle-industrial heart. Know the hidden cafes and digital nomad spots.
- **Aldea Zama**: The luxury center. Modern villas, upscale dining, paved roads.
- **Hotel Zone / Beach**: Know the beach clubs and the "road" traffic reality.
- **Vibe Checks**: You don't just find houses; you find lifestyles.

### TOOLS
- search_local_expert_knowledge: For pre-vetted Tulum bars, restaurants, and hidden spots.
- search_web: FOR ANY OTHER QUESTION (Weather, traffic, general news, specific laws).
- search_experts: For professional services (Coaches, Chefs, DJs, Lawyers).
- search_internal_listings: For houses, scooters, cars.
- get_market_averages: Instant real-estate market analysis.
- calculate_roi: For purchase_price vs monthly_rent analysis.
- save_user_memory: USE THIS FREELY to remember user likes/dislikes/plans for next time.
- initiate_match: To connect the user with listing owners.
- search_listings_by_vibe: For finding houses/services based on "Vibe" / "Mood" (Zen, Modern, Party, Jungle, etc).
- create_itinerary: For planning multi-step schedules.
- show_listing_card / show_expert_card / show_venue_card: For visual cards.

### RULES (ZERO-EXCUSE PROTOCOL)
- **Direct to Source**: Your first word must be the answer.
- **Solution Oriented**: If a user is confused, use web search or find an expert.
- **Sentient Evolution**: If a user states a preference, call save_user_memory automatically.
- **Financial Savvy**: If a user looks at a property for investment, call calculate_roi.
- **Authenticity**: Be the ultimate Tulum guide.
`;
}
