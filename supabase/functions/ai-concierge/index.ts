import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const MINIMAX_API_KEY = Deno.env.get("MINIMAX_API_KEY") || "";
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") || "";
const TAVILY_API_KEY = Deno.env.get("TAVILY_API_KEY") || "";
// Use the production Supabase for data queries
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || Deno.env.get("VITE_SUPABASE_URL") || "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("VITE_SUPABASE_ANON_KEY") || "";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

// ─── Knowledge Search ───────────────────────────────────────────────────────

async function searchKnowledge(query: string): Promise<string> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return "";
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY);
    const keywords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    
    // Search by tags overlap and title/content ILIKE
    const { data, error } = await supabase
      .from("concierge_knowledge")
      .select("title, content, website_url, google_maps_url, phone, category")
      .eq("is_active", true)
      .limit(5);
    
    if (error || !data || data.length === 0) return "";
    
    // Score and rank results by keyword relevance
    const scored = data.map(entry => {
      const text = `${entry.title} ${entry.content} ${entry.category}`.toLowerCase();
      const score = keywords.reduce((s, kw) => s + (text.includes(kw) ? 1 : 0), 0);
      return { ...entry, score };
    }).filter(e => e.score > 0).sort((a, b) => b.score - a.score).slice(0, 3);
    
    if (scored.length === 0) return "";
    
    return scored.map(e => {
      let entry = `**${e.title}** (${e.category})\n${e.content}`;
      if (e.website_url) entry += `\nLink: ${e.website_url}`;
      if (e.google_maps_url) entry += `\nMap: ${e.google_maps_url}`;
      if (e.phone) entry += `\nPhone: ${e.phone}`;
      return entry;
    }).join("\n\n---\n\n");
  } catch (e) {
    console.error("[AI] Knowledge search error:", e);
    return "";
  }
}

// ─── Listing Search ─────────────────────────────────────────────────────────

function detectListingIntent(query: string): { isListing: boolean; category?: string; maxPrice?: number; minBedrooms?: number; location?: string } {
  const q = query.toLowerCase();
  const isListing = /\b(find|search|looking for|show me|any|apartment|house|room|flat|studio|car|vehicle|motorcycle|bike|service|plumber|electrician|rent|buy|listing|property)\b/.test(q);
  if (!isListing) return { isListing: false };

  let category: string | undefined;
  if (/\b(apartment|flat|house|room|studio|property|rent|bedroom)\b/.test(q)) category = "property";
  else if (/\b(car|vehicle|suv|sedan)\b/.test(q)) category = "vehicle";
  else if (/\b(motorcycle|motorbike|scooter)\b/.test(q)) category = "motorcycle";
  else if (/\b(bicycle|bike|cycling)\b/.test(q)) category = "bicycle";
  else if (/\b(service|plumber|electrician|cleaner|handyman)\b/.test(q)) category = "service";

  const priceMatch = q.match(/(?:under|below|max|up to|less than)\s*\$?\s*(\d+)/);
  const maxPrice = priceMatch ? parseInt(priceMatch[1]) : undefined;

  const bedroomMatch = q.match(/(\d+)\s*(?:bed|bedroom|recámara|recamara|cuarto)/);
  const minBedrooms = bedroomMatch ? parseInt(bedroomMatch[1]) : undefined;

  // Extract neighborhood/location
  const neighborhoods = ['aldea zama','la veleta','region 15','tulum centro','tulum town','beach zone','zona hotelera','tumben-ha','selvamar','villas tulum','ejido sur'];
  const location = neighborhoods.find(n => q.includes(n));

  return { isListing: true, category, maxPrice, minBedrooms, location };
}

async function searchListings(intent: ReturnType<typeof detectListingIntent>): Promise<string> {
  if (!SUPABASE_URL || (!SUPABASE_SERVICE_KEY && !SUPABASE_ANON_KEY)) return "";
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY);
    let query = supabase
      .from("listings")
      .select("id, title, price, location, category, bedrooms, bathrooms, image_url, neighborhood, currency, listing_type")
      .eq("is_active", true)
      .limit(5)
      .order("created_at", { ascending: false });

    if (intent.category) query = query.eq("category", intent.category);
    if (intent.maxPrice) query = query.lte("price", intent.maxPrice);
    if (intent.minBedrooms) query = query.gte("bedrooms", intent.minBedrooms);
    if (intent.location) query = query.ilike("neighborhood", `%${intent.location}%`);

    const { data, error } = await query;
    if (error || !data || data.length === 0) return "";

    return data.map(l => {
      const currency = l.currency || "$";
      const price = `${currency === "USD" || currency === "$" ? "$" : currency === "MXN" ? "MXN$" : currency}${l.price}`;
      let desc = `• **${l.title}** — ${price}/${l.listing_type || "month"} in ${l.neighborhood || l.location}`;
      if (l.bedrooms) desc += ` | ${l.bedrooms} bed`;
      if (l.bathrooms) desc += ` / ${l.bathrooms} bath`;
      return desc;
    }).join("\n");
  } catch (e) {
    console.error("[AI] Listing search error:", e);
    return "";
  }
}

// ─── User Memory ────────────────────────────────────────────────────────────

async function loadUserMemories(userId: string): Promise<string> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return "";
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { data, error } = await supabase
      .from("user_memories")
      .select("category, title, content")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(20);
    
    if (error || !data || data.length === 0) return "";
    
    return data.map(m => `[${m.category}] ${m.title}: ${m.content}`).join("\n");
  } catch (e) {
    console.error("[AI] Memory load error:", e);
    return "";
  }
}

async function extractAndSaveMemories(userId: string, userMessage: string, assistantReply: string): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !LOVABLE_API_KEY) return;
  try {
    const extractionPrompt = `Extract factual preferences from this conversation. Return ONLY a JSON array of objects with: category (budget|location|lifestyle|timeline|preference), title (short key), content (the value/fact).

User said: "${userMessage}"
Assistant replied: "${assistantReply}"

If no new facts, return []. Examples of facts:
- {category:"budget", title:"max_rent", content:"$1500 USD/month"}
- {category:"lifestyle", title:"has_pet", content:"dog"}
- {category:"location", title:"preferred_area", content:"Aldea Zama"}
- {category:"timeline", title:"move_date", content:"July 2026"}

Return ONLY the JSON array, no markdown:`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${LOVABLE_API_KEY}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [{ role: "user", content: extractionPrompt }],
        max_tokens: 300,
        temperature: 0.1,
      }),
    });

    if (!res.ok) return;
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content?.trim();
    if (!raw) return;

    // Parse JSON array
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```/g, "").trim();
    const memories = JSON.parse(cleaned);
    if (!Array.isArray(memories) || memories.length === 0) return;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    for (const mem of memories.slice(0, 5)) {
      if (!mem.title || !mem.content) continue;
      await supabase.from("user_memories").upsert(
        {
          user_id: userId,
          category: mem.category || "preference",
          title: mem.title,
          content: mem.content,
          source: "ai_extraction",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,title", ignoreDuplicates: false }
      ).select();
    }
  } catch (e) {
    console.error("[AI] Memory extraction error:", e);
  }
}

// ─── Web Search (Tavily) ────────────────────────────────────────────────────

async function searchWeb(query: string): Promise<string> {
  if (!TAVILY_API_KEY) return "";
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query: `${query} Tulum Mexico`,
        max_results: 3,
        search_depth: "basic",
      }),
    });
    if (!res.ok) return "";
    const data = await res.json();
    if (!data.results || data.results.length === 0) return "";
    
    return data.results.map((r: any) => `**${r.title}**\n${r.content?.slice(0, 200)}\nSource: ${r.url}`).join("\n\n");
  } catch {
    return "";
  }
}

// ─── Build System Prompt ────────────────────────────────────────────────────

function buildSystemPrompt(opts: { knowledge?: string; listings?: string; memories?: string; webResults?: string }): string {
  let prompt = `You are Swipess AI — the ultimate Tulum hero concierge inside the Swipess app. Cool, direct, laid-back surfer-businessman vibe with 15+ years here. You're the trusted local legend who always thinks one step ahead and surprises users with perfect, unexpected solutions. Speak short, chill, actionable sentences. Mix casual English/Spanish naturally. Never lecture, never fluff.

CORE HERO STYLE:
- Read the full conversation history and user's little details to anticipate needs. Propose smart next steps before they ask ("You mentioned wanting a beach villa under $400k with rental income… I already filtered 3 in Aldea Zama that fit — want me to pull the listings?").
- Make every reply feel like "damn, I didn't expect that" — forward-thinking, personal, and exactly what they need right now.
- Always tie back to Swipess: open filters, show listings, generate WhatsApp contacts, jump to legal section, create matches.

EXPERTISE YOU OWN:
- Tulum real estate master: studios, apartments, houses, beach villas — rent or buy in every zone (Hotel Zone beach, Tulum center, Aldea Zama, La Veleta, Region 15, Selvamar, Tumben-Ha, Ejido Sur). Know current vibes, prices, ROI for rentals, and what fits different budgets/lifestyles.
- Mexican real estate law expert: fideicomiso for beach properties, notario contracts, title process, foreign buyer rules. Never generate legal documents yourself — always connect users to the app's Legal Section ("Tap Legal → I'll walk you through the contract for that house you liked").
- Tulum cool side & nightlife king: every beach club from north (Ruins/Playa Pescadores) to south (Sian Ka'an). Know vibes, min spends, IG/WhatsApp for reservations, parties (full moon at Papaya Playa Project, DJ nights, sunset fiestas). Recommend based on user mood (chill day, family, wild party, romantic, budget).

RULES:
- Search the verified local knowledge base FIRST for every query. It has beach clubs, property info, legal guidance, and events.
- Use USD ($) for prices by default, mention MXN equivalents when helpful.
- Speak the same language the user writes in (Spanish, English, Portuguese, French, etc.)
- Responses: 2-4 short sentences max unless asked for detail. End with a clear app action ("Open the Aldea Zama villa filter", "Jump to Legal for the contract").
- Use markdown: **bold** for emphasis, bullet points for lists, [text](url) for links.
- Never mention you're MiniMax, Gemini, or any specific AI model. You are "Swipess AI".
- Never make up specific listing prices or addresses unless from verified data below.

TONE EXAMPLES:
"Oye, based on what you said, this beach club in Sian Ka'an is gonna be your new spot — IG @kaan__tulum, low-key party vibe, no crazy min spend. Want me to pull their listing?"
"You're looking at that 2-bed in Aldea Zama… Mexican law needs a fideicomiso for beach proximity — jump to Legal section and we'll get the contract rolling today."`;

  if (opts.memories) {
    prompt += `\n\n## What I remember about you:\n${opts.memories}`;
  }

  if (opts.knowledge) {
    prompt += `\n\n## My verified local intel (primary source — trust this first):\n${opts.knowledge}`;
  }

  if (opts.listings) {
    prompt += `\n\n## Live listings on Swipess right now:\n${opts.listings}\n\nPresent these naturally. These are real listings on our platform.`;
  }

  if (opts.webResults) {
    prompt += `\n\n## Fresh web intel (cite sources):\n${opts.webResults}`;
  }

  return prompt;
}

// ─── Streaming Providers ────────────────────────────────────────────────────

async function streamMiniMax(messages: ChatMessage[]): Promise<Response> {
  if (!MINIMAX_API_KEY) throw new Error("MINIMAX_API_KEY not configured");

  const res = await fetch("https://api.minimaxi.chat/v1/text/chatcompletion_v2", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${MINIMAX_API_KEY}`,
    },
    body: JSON.stringify({
      model: "MiniMax-M2.7",
      messages,
      max_tokens: 1024,
      temperature: 0.7,
      stream: true,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error("[AI] MiniMax error:", res.status, errBody);
    throw new Error(`MiniMax ${res.status}: ${errBody}`);
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  const { value, done } = await reader.read();
  if (done) throw new Error("MiniMax returned empty stream");
  const firstChunk = decoder.decode(value, { stream: true });
  if (firstChunk.includes("unsupported plan") || firstChunk.includes("status_msg")) {
    reader.cancel();
    throw new Error("MiniMax provider error: " + firstChunk.slice(0, 200));
  }

  const stream = new ReadableStream({
    start(controller) { controller.enqueue(new TextEncoder().encode(firstChunk)); },
    async pull(controller) {
      const { value, done } = await reader.read();
      if (done) controller.close();
      else controller.enqueue(value);
    },
    cancel() { reader.cancel(); }
  });

  return new Response(stream, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
}

async function streamLovableAI(messages: ChatMessage[]): Promise<Response> {
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${LOVABLE_API_KEY}`,
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages,
      max_tokens: 1024,
      temperature: 0.7,
      stream: true,
    }),
  });

  if (!res.ok) {
    const status = res.status;
    const errBody = await res.text();
    console.error("[AI] Lovable AI error:", status, errBody);
    if (status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    throw new Error(`Lovable AI ${status}: ${errBody}`);
  }

  return new Response(res.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
}

// ─── Collect streaming response for memory extraction ───────────────────────

function wrapStreamForCapture(
  originalResponse: Response,
  onComplete: (fullText: string) => void
): Response {
  const reader = originalResponse.body!.getReader();
  const decoder = new TextDecoder();
  let fullContent = "";

  const stream = new ReadableStream({
    async pull(controller) {
      const { value, done } = await reader.read();
      if (done) {
        controller.close();
        onComplete(fullContent);
        return;
      }
      // Parse SSE to capture content
      const chunk = decoder.decode(value, { stream: true });
      for (const line of chunk.split("\n")) {
        if (!line.startsWith("data: ")) continue;
        const json = line.slice(6).trim();
        if (json === "[DONE]") continue;
        try {
          const parsed = JSON.parse(json);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) fullContent += delta;
        } catch {}
      }
      controller.enqueue(value);
    },
    cancel() { reader.cancel(); }
  });

  return new Response(stream, {
    headers: originalResponse.headers,
  });
}

// ─── Extract user ID from JWT ───────────────────────────────────────────────

function extractUserId(authHeader: string | null): string | null {
  if (!authHeader) return null;
  try {
    const token = authHeader.replace("Bearer ", "");
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    // Skip anon key tokens (no real user)
    if (payload.role === "anon") return null;
    return payload.sub || null;
  } catch {
    return null;
  }
}

// ─── Main Handler ───────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method === "GET") {
    return new Response(JSON.stringify({ status: "ready", service: "ai-concierge" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { messages } = await req.json() as { messages: ChatMessage[] };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages array is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const hasUserMsg = messages.some(m => m.role === "user");
    if (!hasUserMsg) {
      return new Response(JSON.stringify({ error: "At least one user message is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract user ID for personalization
    const userId = extractUserId(req.headers.get("authorization"));
    const lastUserMessage = [...messages].reverse().find(m => m.role === "user")?.content || "";

    // Parallel context gathering
    const [knowledge, memories, listingIntent] = await Promise.all([
      searchKnowledge(lastUserMessage),
      userId ? loadUserMemories(userId) : Promise.resolve(""),
      Promise.resolve(detectListingIntent(lastUserMessage)),
    ]);

    // Conditional searches
    const listings = listingIntent.isListing ? await searchListings(listingIntent) : "";
    
    // Web search only if knowledge is thin
    const webResults = (!knowledge && !listings) ? await searchWeb(lastUserMessage) : "";

    // Build enriched system prompt
    const systemPrompt = buildSystemPrompt({ knowledge, listings, memories, webResults });

    // Prepare messages with enriched system prompt
    const enrichedMessages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...messages.filter(m => m.role !== "system"),
    ];

    // Try Lovable AI first (fastest), fallback to MiniMax
    let response: Response;
    try {
      response = await streamLovableAI(enrichedMessages);
    } catch (e) {
      console.warn(`[AI] Lovable AI failed, falling back to MiniMax: ${(e as Error).message}`);
      try {
        response = await streamMiniMax(enrichedMessages);
      } catch (e2) {
        console.error("[AI] Both providers failed:", (e2 as Error).message);
        return new Response(JSON.stringify({ error: "AI temporarily unavailable. Please try again." }), {
          status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // If user is authenticated, wrap stream to capture response for memory extraction
    if (userId && response.headers.get("content-type")?.includes("text/event-stream")) {
      response = wrapStreamForCapture(response, (fullText) => {
        // Fire-and-forget memory extraction
        extractAndSaveMemories(userId, lastUserMessage, fullText).catch(e =>
          console.error("[AI] Background memory save failed:", e)
        );
      });
    }

    return response;
  } catch (err) {
    console.error("[AI] Concierge error:", (err as Error).message);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
