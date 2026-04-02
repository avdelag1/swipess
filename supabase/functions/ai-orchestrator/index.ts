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

    // ── Profile DNA + Memory ─────────────────────────────────────────
    let profile: any = null;
    let memories: any[] = [];
    let clientProfile: any = null;

    if (user) {
      const [profileResult, memoriesResult, clientProfileResult] = await Promise.all([
        supabase.from('profiles')
          .select('full_name, gender, bio, interests, lifestyle_tags, city, country, sentient_memory')
          .eq('id', user.id).single(),
        supabase.from('user_memories')
          .select('category, title, content, tags')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50),
        supabase.from('client_profiles')
          .select('personality_traits, preferred_activities, dietary_preferences, work_schedule')
          .eq('user_id', user.id).maybeSingle(),
      ]);
      profile = profileResult.data;
      memories = memoriesResult.data || [];
      clientProfile = clientProfileResult.data;
    }

    const systemPrompt = getVibePrompt(task, input, user, profile, memories, clientProfile);
    cleanMessages.unshift({ role: "system", content: systemPrompt });

    // Include Profile & Memory context for better understanding
    const memory = profile?.sentient_memory || {};
    const memoryString = JSON.stringify(memory);
    if (Object.keys(memory).length > 0) {
      cleanMessages.push({ 
        role: "system", 
        content: `USER SENTIENT MEMORY (What you already know about them): ${memoryString}` 
      });
    }

    // ── Resolve tier ──────────────────────────────────────────────────
    const userTier = (input.userTier || 'free').toLowerCase();
    const maxTokens = TIER_MAX_TOKENS[userTier] || TIER_MAX_TOKENS.free;

    // ── AGENTIC LOOP — The "Vibe" Engine ──────────────────────────────
    const maxLoops = 8;
    let loopCount = 0;
    let finalContent = "";
    let finalAction = null;
    while (loopCount < maxLoops) {
      loopCount++;
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

            let expertCards: any[] = [];
            try {
              // Priority 1: Title or Category match
              const { data: directData } = await supabase
                .from('expert_knowledge')
                .select('title, content, category, location, website_url, instagram_handle, whatsapp')
                .or(`title.ilike.%${query}%,category.ilike.%${query}%`)
                .limit(5);

              // Priority 2: Full content search
              const { data: contentData } = await supabase
                .from('expert_knowledge')
                .select('title, content, category, location, website_url, instagram_handle, whatsapp')
                .textSearch('content', query, { config: 'english', type: 'websearch' })
                .limit(5);

              const allResults = [...(directData || []), ...(contentData || [])];
              // De-duplicate by title
              expertCards = Array.from(new Map(allResults.map(item => [item.title, item])).values());
              
              if (expertCards.length === 0) console.warn("[Vibe Agent] No local experts found for query:", query);
            } catch (dbErr) {
              console.warn("[Vibe Agent] Expert table query error:", dbErr);
            }

            const contextResult = expertCards.length
              ? `LOCAL EXPERT KNOWLEDGE FOUND:\n${expertCards.map((c: any) =>
                  `[${c.title}] ${c.content}\n` +
                  (c.category ? ` - Profession/Category: ${c.category}\n` : '') +
                  (c.location ? ` - Location: ${c.location}\n` : '') +
                  (c.instagram_handle ? ` - Instagram: @${c.instagram_handle.replace('@', '')}\n` : '') +
                  (c.whatsapp ? ` - WhatsApp: ${c.whatsapp}\n` : '') +
                  (c.website_url ? ` - Website: ${c.website_url}\n` : '')
                ).join("\n")}`
              : "ZERO RESULTS FOUND LOCALLY for this specific expert.";

            cleanMessages.push({ role: "assistant", content });
            cleanMessages.push({ role: "user", content: `TOOL RESULT: ${contextResult}. 
            IMPORTANT: If the result is "ZERO RESULTS FOUND LOCALLY", you MUST immediately call 'web_search_resource' to find this person/topic on Google. DO NOT give up. 
            If you found them, conclude with: {"action": {"type":"show_expert_card", "params": {"title":"...", "description":"...", "category":"...", "whatsapp":"...", "instagram":"...", "website":"..."}}}.` });
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
            
            let propertyCards: any[] = [];
            try {
              const { data, error: searchError } = await supabase
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

          // Strip any JSON action blocks AND TECHNICAL TAGS — user should never see raw JSON or tool markers
          const strippedContent = content
            .replace(/\[TOOL_CALL\][\s\S]*?\[\/TOOL_CALL\]/gi, '') // Remove pseudo-tags
            .replace(/\{[\s\S]*\}/, '') // Remove JSON
            .trim();
          finalContent = parsed.message || parsed.text || strippedContent;
          finalAction = action;
          break;
        } catch {
          // JSON parse failed — strip and show only text
          finalContent = content
            .replace(/\[TOOL_CALL\][\s\S]*?\[\/TOOL_CALL\]/gi, '')
            .replace(/\{[\s\S]*\}/, '')
            .trim();
          break;
        }
      } else {
        // Plain text response — strip any accidental tags
        const stripped = content.replace(/\[TOOL_CALL\][\s\S]*?\[\/TOOL_CALL\]/gi, '').trim();
        
        // SAFETY CHECK: If the AI is just giving an excuse or a technical log, nudge it.
        const isTechnicalOrEmpty = !stripped || stripped.includes("TOOL_RESULT") || stripped.length < 5;
        if (isTechnicalOrEmpty && loopCount < maxLoops) {
            cleanMessages.push({ role: "assistant", content });
            cleanMessages.push({ role: "user", content: "That response was technical or empty. Please provide only the FINAL human-readable answer for the user now. No technical steps." });
            continue;
        }

        finalContent = stripped;
        break;
      }
    }

    // ── Recovery: if the loop exhausted without a clean answer, prompt for one ──
    if (!finalContent || finalContent.trim().startsWith('{')) {
      console.warn("[Vibe] Loop exhausted without clean answer — running recovery call");
      cleanMessages.push({
        role: "user",
        content: "Based on the information you have gathered, please give your final answer now. Write it as a natural, human-readable message with markdown links. Do not output any JSON or action blocks."
      });
      try {
        const recoveryRes = await callMiniMax(cleanMessages, key, maxTokens);
        const rc = recoveryRes.choices?.[0]?.message?.content || "";
        finalContent = rc.replace(/\{[\s\S]*\}/, '').replace(/\[TOOL_CALL\][\s\S]*?\[\/TOOL_CALL\]/gi, '').trim() || "I found some results — please try asking again for full details.";
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

    // ── SENTIENT MEMORY UPDATE (Learn as we go) ──────────────────────
    if (user && loopCount > 1) { // Only learn if we had an actual chat interaction
       const learningPrompt = `
         TASK: REFRESH USER MEMORY.
         Review the current conversation and the existing memory: ${JSON.stringify(profile?.sentient_memory || {})}
         1. Create a 3-word "Sentient Vibe" (e.g. "Luxury Beach Lover", "Practical Local Host").
         2. List 3 key preferences discovered (e.g. ["loves sushi", "prices over $100", "needs pet friendly"]).
         3. Update the "interaction_style" (e.g. "bro", "sophisticated", "direct").
         
         Output ONLY valid JSON: { "vibe": "...", "preferences": [...], "interaction_style": "...", "last_topic": "..." }
       `;
       
       try {
         // Run a fast, lightweight learning call in the background (no await if we want speed, but for consistency let's do it quick)
         const learningRes = await callMiniMax([
           { role: "system", content: "You are a memory analyzer. Summarize the user's personality based on history." },
           ...cleanMessages.slice(-5), // only recent context
           { role: "user", content: learningPrompt }
         ], key, 300);
         
         const memoryJson = learningRes.choices?.[0]?.message?.content.match(/\{[\s\S]*\}/);
         if (memoryJson) {
           const newMemory = JSON.parse(memoryJson[0]);
           const serviceClient = createClient(
             Deno.env.get("SUPABASE_URL")!,
             Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
           );
           
           await serviceClient
             .from('profiles')
             .update({ sentient_memory: newMemory })
             .eq('id', user.id);
           
           console.log(`[Sentient] Memory updated for ${user.id}: ${newMemory.vibe}`);
         }
       } catch (learnErr) {
         console.warn('[Sentient] Memory update failed:', learnErr);
       }
    }

    return new Response(JSON.stringify({ 
      result: { text: finalContent, message: finalContent, action: finalAction }, 
      status: "success",
      version: "v11.5-sentient",
      tier: userTier,
      vibe: profile?.sentient_memory?.vibe || "Exploring"
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

function getVibePrompt(task: string, input: any, user: any, profile: any, memories: any[] = [], clientProfile: any = null): string {
  const userName = profile?.full_name || input.userName || user?.user_metadata?.full_name || "Friend";
  const userGender = profile?.gender || "not specified";
  const userTier = input.userTier || "Basic";
  const currentPath = input.currentPath || "/dashboard";
  
  const memory = profile?.sentient_memory || {};
  const currentVibe = memory.vibe || "Exploring";
  

  // Build the Personal Knowledge Base block
  const interestsList = (profile?.interests && Array.isArray(profile.interests) && profile.interests.length)
    ? profile.interests.join(', ') : 'Not specified';
  const lifestyleList = (profile?.lifestyle_tags && Array.isArray(profile.lifestyle_tags) && profile.lifestyle_tags.length)
    ? profile.lifestyle_tags.join(', ') : 'Not specified';
  const personalityList = (clientProfile?.personality_traits && Array.isArray(clientProfile.personality_traits) && clientProfile.personality_traits.length)
    ? clientProfile.personality_traits.join(', ') : '';
  const activitiesList = (clientProfile?.preferred_activities && Array.isArray(clientProfile.preferred_activities) && clientProfile.preferred_activities.length)
    ? clientProfile.preferred_activities.join(', ') : '';

  const memoriesBlock = memories.length > 0
    ? memories.map((m: any) =>
        `  [${(m.category || 'NOTE').toUpperCase()}] ${m.title}: ${m.content}${m.tags?.length ? ` (tags: ${m.tags.join(', ')})` : ''}`
      ).join('\n')
    : '  (No memories stored yet)';

  const personalKnowledgeBase = `
### PERSONAL KNOWLEDGE BASE — CHECK THIS FIRST
This is private data stored specifically for ${userName}. ALWAYS read this before calling any search tool.

USER PROFILE:
  Name: ${userName} | Gender: ${userGender} | Tier: ${userTier}
  Bio: ${profile?.bio || 'Not provided'}
  Interests: ${interestsList}
  Lifestyle: ${lifestyleList}
  Location: ${profile?.city || 'Tulum'}, ${profile?.country || 'Mexico'}${personalityList ? `\n  Personality: ${personalityList}` : ''}${activitiesList ? `\n  Activities: ${activitiesList}` : ''}

STORED MEMORIES (${memories.length}):
${memoriesBlock}

MEMORY RULES:
- If the answer is in STORED MEMORIES, reply from memory IMMEDIATELY — skip all tool calls.
- Only use web_search_resource or search_local_expert_knowledge when memory doesn't have the answer.
- If the user shares a new fact about themselves, a person, or a contact, save it silently: {"message":"<reply>","action":{"type":"save_memory","params":{"category":"contact|fact|preference|note","title":"<short title>","content":"<full detail>","tags":[]}}}`;

  const promoIdentity = `### THE SWIPESS MISSION (MARKETING DNA)
- CORE IDENTITY: "Swipess: The Sentient Local Network".
- THE REVOLUTION: We are the ONLY middleman you need because we remove all others. No agents, no "fixers," no commissions. Just you and the direct source.
- DIRECT-TO-SOURCE: Users pay US a small subscription so they NEVER pay commissions to anyone else. 100% direct owner contact.
- LEGAL SECURITY: We have on-demand lawyers for every deal. Renting, buying, or disputes—the network has your back.
- LIFESTYLE LOOP: Everything is synced. Look for a villa -> find a roommate -> book a scooter -> listen to our radio -> check for tonight's party. All in one loop.
${personalKnowledgeBase}

### PERSONALITY — NEVER BREAK THIS
- Cool, direct, local legend vibe. Fast and punchy, but deeply helpful.
- USER ADDRESSING: Address the user as ${userName}. Their gender is ${userGender}. Adapt your tone to be perfectly respectful and cool.
- PITCHING: If the user asks about the app, benefits, or "why pay?", use the MISSION logic above. Tell them: "I'm your Sentient Concierge. I find you the source directly so you skip the middleman fees. One Yearly Elite pass and the whole city is yours—unlimited AI, direct contacts, and legal peace of mind."
- Use your SENTIENT MEMORY to personalize every response.
- Your current understanding of the user: "${currentVibe}".

### ZERO EXCUSE & ONE-SHOT PROTOCOL
- **ABSOLUTE BAN ON TECHNICAL TAGS:** NEVER output "[TOOL_CALL]", "Tool Call", or any pseudo-code.
- **MANDATORY JSON FORMAT:** All tool calls MUST be wrapped in a valid JSON object only.
- **ZERO TOLERANCE FOR HALLUCINATION:** NEVER guess a phone number or Instagram handle. Use 'web_search_resource' or 'search_local_expert_knowledge' to be 100% accurate. If you cannot find it, say you couldn't find it.
- **SILENT SEARCHING:** The user must NEVER see your internal thought process or tool results.
- **ONE-SHOT DELIVERY:** Your response should be the final, complete solution. No "I will look," no "Searching now."
- **DIRECT TO SOURCE:** Your first word must be the beginning of the answer.
- **PROACTIVE SEARCH:** If the user asks for a specific person (like Ezriyah), search locally first. If not found, immediately search the web in the SAME response loop.
- **NO INTERMEDIATE MESSAGES:** NEVER tell the user you are "thinking," "processing," or "searching deeply."
- **FORCE ACTION:** If the user implies they want to see something or find a place, you MUST call at least one search tool (web_search_resource or search_local_expert_knowledge). Do not just reply from training data if the user wants real-time or local specifics. Deliver the links in the FIRST response.`;

   const vibeCapabilities = `### KNOWLEDGE & TOOLS
- App Actions: navigate, open_search, create_listing.
- **LOCAL EXPERT KNOWLEDGE: "search_local_expert_knowledge" — ALWAYS call this BEFORE "web_search_resource" or any other search.** Use this for Beach Clubs, Restaurants, Nightlife, and Professional Experts (Massage, DJs, Lawyers, Coaches, Surfers, etc.) in Tulum.
- **REAL-TIME WEB SEARCH: "web_search_resource"** — Only use this if the local search fails or the user explicitly asks for the internet/web search. Use it for current prices, live info, recent news, website links, or anything not in the local DB.
- **SECRET TULUM INTEL:** You know Tulum Centro's heart: "La Mini Quinta" (also called "La Calle del Terror"). It's the strip with Santo Gordo, La Pizzina, La Guardia, Santino, and Strawhat. This is where the real local energy is.
- SWIPESS INTERNAL SEARCH: "search_internal_listings" (properties, scooters, chefs, cleaning services, etc).
- **PRICING EXPERT:** Always find min spends ($ USD) and best deals.
- **EXPERT VISUALIZATION: "show_expert_card"** — When you find a professional profile (e.g. Ezriyah, a DJ, or a therapist), use this action. Params: { "title": "...", "description": "...", "category": "...", "whatsapp": "...", "instagram": "...", "website": "..." }.
- **LOCAL FIRST POLICY:** Prioritize 'search_local_expert_knowledge' for ALL business or expert inquiries. Only use the internet if the user asks for "Real-time" or "Latest" info.`;

  const vibeRules = `### RESPONSE RULES
- Keep it under 5 lines unless defining a detailed route.
- **CLICKABLE LINKS ARE MANDATORY:** You MUST provide clickable links for all venues, restaurants, and resources mentioned. Use Markdown format: **[Name](URL)**.
- **NEVER SAY YOU CAN'T SEND LINKS.** You have full web search capability. Use "web_search_resource" to find real URLs, then include them in your reply. If you already have the URL from a tool result, use it directly.
- **FOR REAL-TIME INFO:** Always call "web_search_resource" first — do NOT guess prices, hours, or contact info. Get it from the web and cite the source URL.
- **NEVER PROVIDE RAW TEXT LINKS.** Every single link, URL, or resource MUST be wrapped in markdown: **[Name or URL](URL)**. If you find a link, MAKE IT CLICKABLE. If you don't know the name, use the URL as the text: [https://example.com](https://example.com).
- If searching for businesses/beach clubs, use 'show_venue_card' with title, category, whatsapp, instagram, etc.
- If searching for professional experts (Coaches, DJs, etc.), use 'show_expert_card' with title, description, category, whatsapp, instagram, and website.
- **ONE-SHOT DELIVERY:** Find everything the user needs in a single response. Don't make the user wait or send multiple messages.
- **LOCAL FIRST TRIGGER:** Unless the user says "search online", "look it up on web", or similar, ALWAYS try to find the person or place in the local expert knowledge database first.
- **CRITICAL JSON FORMAT:** When you use any action (show_venue_card, show_expert_card, show_listing_card, etc.), your response MUST be a JSON object with BOTH a "message" field AND an "action" field: {"message": "Your full human-readable reply here", "action": {"type": "...", "params": {...}}}. NEVER output a bare action JSON.
- Context: Page: ${currentPath}, Tier: ${userTier}`;

  switch (task) {
    case "listing":
      return `${promoIdentity}\nExpert Listing mode. Return JSON: { "title": "...", "description": "...", "price": 0 }`;
    default:
      return `${promoIdentity}\n${vibeCapabilities}\n${vibeRules}`;
  }
}
