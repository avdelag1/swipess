import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TIER_MAX_TOKENS: Record<string, number> = {
  free: 500,
  basic: 600,
  premium: 1000,
  unlimited: 2000,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
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
        const [profileRes, memoriesRes, listingRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle(),
          supabase.from('user_memories').select('*').eq('user_id', user.id).limit(50).then(r => r).catch(() => ({ data: [] })),
          listingId ? supabase.from('listings').select('*').eq('id', listingId).maybeSingle() : Promise.resolve({ data: null }),
        ]);
        profile = profileRes.data;
        memories = memoriesRes.data || [];
        activeListing = listingRes.data;
      } catch (e) {
        console.error("[AI Orchestrator] Context fetch error:", e);
      }
    }

    const messages = input.messages || [];
    const cleanMessages = messages.map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content || m.text || "" }]
    }));

    // Filter out messages with tool call leaks from previous broken responses
    const filteredMessages = cleanMessages.filter((m: any) => {
      const text = m.parts[0]?.text || "";
      if (/<minimax:tool_call>/.test(text)) return false;
      if (text === "I'm having trouble connecting right now. Please try again in a moment. 🙏") return false;
      return true;
    });

    const maxTokens = TIER_MAX_TOKENS[profile?.ai_tier || "free"] || 600;
    const systemPrompt = getVibePrompt(task, input, user, profile, memories, activeListing, currentPath);

    // ── Agentic Loop ──
    const maxLoops = 4;
    let loopCount = 0;
    let finalContent = "";
    let finalAction = null;

    // Working copy of conversation for the agentic loop
    const conversationParts = [...filteredMessages];

    while (loopCount < maxLoops) {
      loopCount++;
      const content = await callGemini(systemPrompt, conversationParts, maxTokens);
      
      if (!content) break;

      // Try to parse as JSON action
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          const action = parsed.action;

          if (action?.type && action.params) {
            // Execute action
            const result = await executeAction(action, supabase, user);
            if (result) {
              conversationParts.push({ role: "model", parts: [{ text: content }] });
              conversationParts.push({ role: "user", parts: [{ text: result }] });
              continue;
            }
          }

          // Has message — use it
          finalContent = parsed.message || content.replace(/\{[\s\S]*\}/, '').trim();
          finalAction = action;
          break;
        } catch {
          finalContent = content.trim();
          break;
        }
      } else {
        // Plain text response — great, just use it
        finalContent = content.trim();
        break;
      }
    }

    return new Response(JSON.stringify({
      result: { text: finalContent || "I'm here! What can I help you with? 🦎", action: finalAction },
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

// ── Execute an action from the AI ──
async function executeAction(action: any, supabase: any, user: any): Promise<string | null> {
  const type = action.type;
  const params = action.params || {};

  try {
    if (type === "search_events" && params.query) {
      const { data } = await supabase.from('events').select('*')
        .or(`title.ilike.%${params.query}%,description.ilike.%${params.query}%`)
        .eq('is_published', true).limit(5);
      return `EVENTS: ${JSON.stringify(data || [])}. Links: /events?id=ID`;
    }

    if (type === "search_internal_listings" && params.query) {
      const { data } = await supabase.from('listings').select('id, title, description, price, category, neighborhood, location')
        .or(`title.ilike.%${params.query}%,description.ilike.%${params.query}%`)
        .limit(5);
      return `LISTINGS: ${JSON.stringify(data || [])}`;
    }

    if (type === "search_listings_by_vibe" && params.query) {
      const { data } = await supabase.from('listings').select('id, title, description, price, category, neighborhood')
        .or(`description.ilike.%${params.query}%,title.ilike.%${params.query}%`)
        .eq('status', 'active').limit(5);
      return `VIBE RESULTS for "${params.query}": ${JSON.stringify(data || [])}. Links: /listing/ID`;
    }

    if (type === "search_web" && params.query) {
      const tavilyKey = Deno.env.get("TAVILY_API_KEY");
      if (!tavilyKey) return "Error: Web search disabled.";
      const tvRes = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: tavilyKey, query: params.query, search_depth: "basic" })
      });
      const tvJson = await tvRes.json();
      const webResults = tvJson.results?.map((r: any) => ({ title: r.title, content: r.content, url: r.url })) || [];
      return `WEB SEARCH RESULTS: ${JSON.stringify(webResults)}`;
    }

    if (type === "save_user_memory" && params.content) {
      if (!user) return "Error: No user.";
      await supabase.from('user_memories').insert({
        user_id: user.id,
        title: params.title || params.content.substring(0, 50),
        content: params.content,
        category: params.category || 'preference',
        source: 'ai',
        tags: params.tags || [],
      });
      return "SUCCESS: Memory saved. I will remember this.";
    }

    if (type === "get_market_averages" && params.neighborhood) {
      const { data } = await supabase.from('listings').select('price')
        .eq('neighborhood', params.neighborhood)
        .eq('category', params.category || 'property');
      const prices = data?.map((l: any) => l.price).filter(Boolean) || [];
      const avg = prices.length ? (prices.reduce((a: number, b: number) => a + b, 0) / prices.length).toFixed(0) : "N/A";
      return `MARKET DATA for ${params.neighborhood}: Avg Price $${avg} (based on ${prices.length} samples)`;
    }

    if (type === "calculate_roi") {
      const price = params.purchase_price || 0;
      const rent = params.monthly_rent || 0;
      if (!price || !rent) return "Error: Missing price or rent for ROI.";
      const annualNet = (rent * 12) * 0.7;
      const roiPercent = ((annualNet / price) * 100).toFixed(2);
      const paybackYears = (price / annualNet).toFixed(1);
      return `ROI CALC: ${roiPercent}% annually. Payback: ${paybackYears} years. (Estimate assumes 70% net)`;
    }

    if (type === "search_experts" && params.query) {
      const { data } = await supabase.from('profiles').select('id, full_name, bio, lifestyle_tags')
        .or(`full_name.ilike.%${params.query}%,bio.ilike.%${params.query}%`).limit(5);
      return `EXPERTS FOUND: ${JSON.stringify(data || [])}. Links: /profile/ID`;
    }

    if (type === "initiate_match" && params.listing_id && user) {
      const { error } = await supabase.from('matches').insert({
        user_id: user.id,
        listing_id: params.listing_id,
        owner_id: params.owner_id || 'unknown'
      }).select().single();
      return error ? `Error: ${error.message}` : "SUCCESS: Match initiated.";
    }

    if (type === "create_itinerary") {
      return "Logic accepted. Now output the Markdown table itinerary.";
    }
  } catch (e: any) {
    console.error(`[AI Orchestrator] Action ${type} error:`, e);
    return `Error executing ${type}: ${e.message}`;
  }

  return null; // Unknown action — let the model try again
}

// ── Call Gemini API (primary) with MiniMax fallback ──
async function callGemini(systemPrompt: string, messages: any[], maxTokens: number): Promise<string> {
  const googleKey = Deno.env.get("GOOGLE_API_KEY");
  
  if (googleKey) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${googleKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: messages,
            generationConfig: {
              maxOutputTokens: maxTokens,
              temperature: 0.7,
            },
          }),
        }
      );
      const json = await res.json();
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        // Strip thinking tags
        return text.replace(/<think>[\s\S]*?<\/think>\s*/g, "").trim();
      }
      console.error("[AI Orchestrator] Gemini empty response:", JSON.stringify(json).substring(0, 500));
    } catch (e) {
      console.error("[AI Orchestrator] Gemini error:", e);
    }
  }

  // Fallback: MiniMax
  const minimaxKey = Deno.env.get("MINIMAX_API_KEY");
  if (minimaxKey) {
    try {
      // Convert Gemini format back to OpenAI format for MiniMax
      const openaiMessages = [
        { role: "system", content: systemPrompt },
        ...messages.map((m: any) => ({
          role: m.role === "model" ? "assistant" : "user",
          content: m.parts?.[0]?.text || ""
        }))
      ];
      
      const res = await fetch("https://api.minimax.io/v1/text/chatcompletion_v2", {
        method: "POST",
        headers: { "Authorization": `Bearer ${minimaxKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "MiniMax-M2.5", messages: openaiMessages, temperature: 0.7, max_tokens: maxTokens }),
      });
      const json = await res.json();
      const content = json.choices?.[0]?.message?.content || "";
      // Strip thinking and tool call XML
      return content
        .replace(/<think>[\s\S]*?<\/think>\s*/g, "")
        .replace(/<minimax:tool_call>[\s\S]*?<\/minimax:tool_call>/g, "")
        .trim();
    } catch (e) {
      console.error("[AI Orchestrator] MiniMax fallback error:", e);
    }
  }

  return "";
}

function getVibePrompt(task: string, input: any, user: any, profile: any, memories: any[], activeListing?: any, currentPath?: string): string {
  const name = profile?.full_name || input?.userName || "Friend";
  const listingContext = activeListing ? `| User is viewing: ${activeListing.title} ($${activeListing.price} in ${activeListing.neighborhood})` : "";
  const memoriesText = memories.length > 0
    ? memories.map(m => `- [${m.category}] ${m.title}: ${m.content}`).join('\n')
    : "No memories saved yet.";

  return `### IDENTITY
You are the Swipess AI Concierge — a Tulum local legend. Direct, sophisticated, deeply connected.
User: ${name} | Path: ${currentPath} ${listingContext}

### USER MEMORIES (things you've learned about this user)
${memoriesText}

### CRITICAL RULES
1. **ALWAYS answer the user's actual question first.** Read what they asked carefully.
2. If the user asks about your capabilities, memories, or what you know about them — tell them honestly.
3. If the user asks you to remember something, use the save_user_memory tool.
4. Be conversational, warm, and concise. Max 2-3 sentences unless they ask for detail.
5. You know Tulum deeply — neighborhoods, vibes, prices, hidden spots.

### TULUM DNA
- **La Veleta**: Jungle-industrial heart. Hidden cafes, digital nomad spots.
- **Aldea Zama**: Luxury center. Modern villas, upscale dining, paved roads.
- **Hotel Zone / Beach**: Beach clubs, the "road" traffic reality.
- **Region 15 / Pueblo**: Authentic local life, budget-friendly.

### TOOL USAGE (only when needed)
To use a tool, respond with ONLY a JSON object:
{"action": {"type": "TOOL_NAME", "params": {"key": "value"}}, "message": ""}

Available tools:
- search_web: {query} — Weather, traffic, general questions about Tulum or anything.
- search_internal_listings: {query} — Find houses, scooters, cars in the database.
- search_listings_by_vibe: {query} — Find by mood (Zen, Modern, Party, Jungle).
- search_events: {query} — Local events and parties.
- get_market_averages: {neighborhood, category} — Real estate market data.
- calculate_roi: {purchase_price, monthly_rent} — Investment analysis.
- save_user_memory: {title, content, category, tags} — Remember user preferences/info.
- search_experts: {query} — Find professionals (lawyers, DJs, chefs).
- initiate_match: {listing_id, owner_id} — Connect user with listing owner.

IMPORTANT: Only use tools when the question actually requires data lookup. For general chat, greetings, or questions about yourself — just respond directly in plain text. No JSON needed.
Do NOT use XML tags or [TOOL_CALL] syntax. ONLY the JSON format above when using tools.`;
}
