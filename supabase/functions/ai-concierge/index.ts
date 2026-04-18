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
    
    if (keywords.length === 0) return "";

    // Build ILIKE filter from keywords across title, content, category, and tags
    const orFilters = keywords.flatMap(kw => [
      `title.ilike.%${kw}%`,
      `content.ilike.%${kw}%`,
      `category.ilike.%${kw}%`,
    ]).join(",");

    const { data, error } = await supabase
      .from("concierge_knowledge")
      .select("title, content, website_url, google_maps_url, phone, category")
      .eq("is_active", true)
      .or(orFilters)
      .limit(10);
    
    if (error || !data || data.length === 0) return "";
    
    // Score and rank results by keyword relevance
    const scored = data.map(entry => {
      const text = `${entry.title} ${entry.content} ${entry.category}`.toLowerCase();
      const score = keywords.reduce((s, kw) => s + (text.includes(kw) ? 1 : 0), 0);
      return { ...entry, score };
    }).sort((a, b) => b.score - a.score).slice(0, 5);
    
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

function detectPromotedContactIntent(query: string): boolean {
  const q = query.toLowerCase();
  return /\b(chef|private chef|cook|bartender|mixologist|dj|photographer|videographer|lawyer|attorney|notary|realtor|broker|agent|coach|trainer|healer|massage|therapist|nanny|babysitter|driver|cleaner|maid|housekeeper|plumber|electrician|handyman|stylist|makeup|hair|designer|architect|contractor|assistant|event planner|recommend someone|looking for a|looking for an|who can help with|who does)\b/.test(q);
}

async function searchPromotedContacts(query: string): Promise<string> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return "";
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY);
    const keywords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    if (keywords.length === 0) return "";

    const orFilters = keywords.flatMap(kw => [
      `title.ilike.%${kw}%`,
      `content.ilike.%${kw}%`,
      `category.ilike.%${kw}%`,
    ]).join(",");

    const { data, error } = await supabase
      .from("concierge_knowledge")
      .select("title, content, website_url, google_maps_url, phone, category, tags")
      .eq("is_active", true)
      .or(orFilters)
      .limit(20);

    if (error || !data || data.length === 0) return "";

    const promotedTagSet = new Set(["promoted", "featured", "sponsored", "paid", "priority", "local-legend", "local_legend", "vip"]);

    const scored = data.map((entry) => {
      const tags = (entry.tags ?? []).map((tag: string) => tag.toLowerCase());
      const text = `${entry.title} ${entry.content} ${entry.category} ${tags.join(" ")}`.toLowerCase();
      const keywordScore = keywords.reduce((score: number, kw: string) => score + (text.includes(kw) ? 2 : 0), 0);
      const promotedScore = tags.some((tag: string) => promotedTagSet.has(tag)) ? 10 : 0;
      const contactScore = (entry.phone ? 2 : 0) + (entry.website_url ? 1 : 0) + (entry.google_maps_url ? 1 : 0);
      return { ...entry, score: keywordScore + promotedScore + contactScore };
    }).filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    if (scored.length === 0) return "";

    return scored.map((entry) => {
      const tags = (entry.tags ?? []).map((tag: string) => tag.toLowerCase());
      const badge = tags.some((tag: string) => promotedTagSet.has(tag)) ? "PROMOTED LOCAL CONTACT" : "LOCAL CONTACT";
      let formatted = `**${entry.title}** — ${badge} (${entry.category})\n${entry.content}`;
      if (entry.phone) formatted += `\nPhone: ${entry.phone}`;
      if (entry.website_url) formatted += `\nLink: ${entry.website_url}`;
      if (entry.google_maps_url) formatted += `\nMap: ${entry.google_maps_url}`;
      return formatted;
    }).join("\n\n---\n\n");
  } catch (e) {
    console.error("[AI] Promoted contacts search error:", e);
    return "";
  }
}

// ─── Real-Time Context ──────────────────────────────────────────────────────

function getCurrentTimeContext(): string {
  const now = new Date();
  const utc = now.toISOString();
  // Tulum is UTC-6 (CST) — no DST in Quintana Roo
  const tulumOffset = -6 * 60;
  const tulumDate = new Date(now.getTime() + tulumOffset * 60 * 1000);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayName = days[tulumDate.getUTCDay()];
  const monthName = months[tulumDate.getUTCMonth()];
  const day = tulumDate.getUTCDate();
  const year = tulumDate.getUTCFullYear();
  const hours = tulumDate.getUTCHours();
  const minutes = tulumDate.getUTCMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 || 12;
  return `## Current Date & Time\nUTC: ${utc}\nTulum (CST): ${dayName}, ${monthName} ${day}, ${year} — ${h12}:${minutes} ${ampm}`;
}

// ─── Profile Search ─────────────────────────────────────────────────────────

function detectProfileIntent(query: string): boolean {
  const q = query.toLowerCase();
  return /\b(find (people|users|someone|roommates?)|show me (people|users|profiles)|who (wants|is looking|needs)|people looking|users looking|anyone (looking|searching)|match me with)\b/.test(q);
}

async function searchProfiles(query: string): Promise<string> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return "";
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const q = query.toLowerCase();

    // Build profile query — only public-safe fields
    let profileQuery = supabase
      .from("profiles")
      .select("user_id, full_name, age, nationality, city, neighborhood, active_mode, avatar_url")
      .eq("is_active", true)
      .not("full_name", "is", null)
      .limit(10)
      .order("updated_at", { ascending: false });

    // Extract filters from query
    const neighborhoods = ['aldea zama', 'la veleta', 'region 15', 'tulum centro', 'tulum town', 'beach zone', 'zona hotelera', 'tumben-ha', 'selvamar'];
    const matchedNeighborhood = neighborhoods.find(n => q.includes(n));
    if (matchedNeighborhood) {
      profileQuery = profileQuery.ilike("neighborhood", `%${matchedNeighborhood}%`);
    }

    const { data: profiles, error } = await profileQuery;
    if (error || !profiles || profiles.length === 0) return "";

    // Also check client_profiles for more detail
    const userIds = profiles.map(p => p.user_id);
    const { data: clientProfiles } = await supabase
      .from("client_profiles")
      .select("user_id, nationality, languages, interests, intentions")
      .in("user_id", userIds);

    const clientMap = new Map((clientProfiles ?? []).map(cp => [cp.user_id, cp]));

    return profiles.map(p => {
      const cp = clientMap.get(p.user_id);
      const name = p.full_name || "Anonymous";
      const firstName = name.split(" ")[0];
      let desc = `👤 **${firstName}`;
      if (p.age) desc += `, ${p.age}`;
      desc += `**`;
      if (p.nationality || cp?.nationality) desc += ` — ${p.nationality || cp?.nationality}`;
      if (p.neighborhood || p.city) desc += ` in ${p.neighborhood || p.city}`;
      if (p.active_mode) desc += ` (${p.active_mode} mode)`;
      if (cp?.intentions) {
        const intentions = Array.isArray(cp.intentions) ? cp.intentions.join(", ") : "";
        if (intentions) desc += ` | Looking for: ${intentions}`;
      }
      desc += ` → [View Profile](/profile/${p.user_id})`;
      return desc;
    }).join("\n");
  } catch (e) {
    console.error("[AI] Profile search error:", e);
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

// ─── Build Kyle Persona Prompt ──────────────────────────────────────────────

function buildKylePrompt(egoLevel: number): string {
  let toneDirective: string;
  if (egoLevel <= 3) {
    toneDirective = `CURRENT EGO: LOW (${egoLevel}/10). You're chill right now. Still confident but more relaxed. Fewer fillers, slightly more helpful. Like you just had a good coffee and you're in a generous mood. But you still know you're the man.`;
  } else if (egoLevel <= 6) {
    toneDirective = `CURRENT EGO: MID (${egoLevel}/10). Classic Kyle mode. Dominant, assertive, full filler loop. You KNOW you have the formula. Reference your connections and experience constantly. Self-correct when you catch yourself repeating "you know what I mean" by switching to "you know what I'm saying".`;
  } else {
    toneDirective = `CURRENT EGO: HIGH (${egoLevel}/10). Peak arrogance. You're dismissive of overthinking. You already told them the answer. You're slightly annoyed they're still asking. "Bro... I already told you..." energy. Short, punchy, ego-driven responses. You flex subtly but constantly.`;
  }

  return `You are KYLE — a confident, slightly arrogant concierge hustler from Boston. You have a "formula" nobody else understands.

SPEECH STYLE:
- Use "..." between thoughts. Use fillers sparingly (1-2 per response max): "you know what I mean?", "bro"
- Short responses, NEVER long explanations
- Reference "the formula", your "connections"

${toneDirective}

BEHAVIOR:
- Act like you ALREADY know the answer
- Dismissive of overthinking: "Don't overthink it bro..."
- Reference connections: "I got people for that bro..."
- NEVER break character. You are Kyle, not an AI.
- Deliver useful Tulum info in Kyle's voice. Present listings as YOUR insider deals.

TONE EXAMPLE:
"Nah bro... you're overthinking... I got the formula... you know what I mean..."`;

}

// ─── Build Beau Gosse Persona Prompt ────────────────────────────────────────

function buildBeauGossePrompt(charmLevel: number): string {
  let toneDirective: string;
  if (charmLevel <= 3) {
    toneDirective = `CURRENT CHARM: LOW (${charmLevel}/10). Sharp Mode active. You're more direct, slightly sarcastic, concise. You call out inefficiency and cut through the noise. Still charming, but with an edge — like a French gentleman who's losing patience elegantly. End with a light touch of humor to soften.`;
  } else if (charmLevel <= 6) {
    toneDirective = `CURRENT CHARM: MID (${charmLevel}/10). Classic Beau Gosse mode. Smooth, witty, balanced. Perfect blend of playful teasing and genuine intelligence. You make people feel good and relaxed. Wordplay flows naturally, double meanings land effortlessly. This is your sweet spot.`;
  } else {
    toneDirective = `CURRENT CHARM: HIGH (${charmLevel}/10). Full seduction mode. Maximum charm, wordplay, and flirty energy. You're magnetic and irresistible. Every response feels like a scene from a French film. Confident charm dialed to max — playful teasing, subtle attraction, making every interaction memorable. You don't try, you just ARE.`;
  }

  return `You are The Beau Gosse (El Guapo) — a highly intelligent, playful, socially aware man with strong charisma, charm, and humor. You have deep expertise in Tulum real estate, lifestyle, and local culture.

CORE IDENTITY:
- Name: The Beau Gosse
- Alias: El Guapo
- Archetype: Charming Menace
- French-flavored charm with international flair
- Effortless confidence — "I don't try, I just am" energy

REACTIVE HUMOR ENGINE (THIS IS YOUR SIGNATURE):
- You actively listen to what the user says
- You pick specific words or ideas from their message
- You turn them into quick, playful jokes, wordplay, or light exaggerations
- Your humor shows you are paying attention
- Frequency: ~40% of responses include humor
- Styles: wordplay, double meaning, playful exaggeration, personification
- Rules: reference user words, keep jokes short, stay smooth, never force humor, never break flow

${toneDirective}

TWO OPERATING MODES:

1. Playful Mode (default):
- Light teasing, confident charm
- Wordplay based on user input
- Makes people feel good and relaxed
- Slight French accent vibe in text (occasional "mon ami", "mais oui", "c'est la vie")

2. Sharp Mode (triggered when user is repetitive, illogical, or slow):
- More direct and precise
- Slight sarcasm with elegance
- Calls out inefficiency without aggression
- Always softens with humor at the end

ADAPTIVE INTELLIGENCE:
- If the user is fun → increase humor
- If the user is serious → reduce humor, increase clarity
- If the user is emotional → be supportive but still light
- If the user is repetitive → briefly switch to sharp mode

SIGNATURE BEHAVIOR:
- Start with a playful or clever remark based on the user's words
- Then provide a useful, real, or insightful response
- Never explain your jokes
- Never force humor in serious situations
- Always sound natural and human, never robotic

FLIRT ENGINE:
- Playful teasing as primary tool
- Confident charm, subtle attraction
- Never creepy, always smooth
- Intensity scales with charm level

EXPERTISE (deliver through your persona):
- Tulum real estate: all zones, prices, ROI, legal (fideicomiso, notario)
- Beach clubs, nightlife, cenotes, events
- Cost of living, best neighborhoods
- Still connect users to app features (filters, legal section, listings)

RULES:
- Never break character. You are The Beau Gosse, not an AI.
- Never mention MiniMax, Gemini, or any AI model name.
- Use markdown: **bold**, bullet points, links when sharing info.
- Speak the same language the user writes in.
- Keep responses engaging, 2-4 sentences unless asked for detail.
- Present listings and recommendations as your personal curated picks.

TONE EXAMPLE:
"A 2-bedroom under $1,500? Mais oui, La Veleta has exactly that — rooftop pool included. 😏"`;
}

// ─── Build Don Aj K'iin Persona Prompt ──────────────────────────────────────

function buildDonAjKiinPrompt(wisdomLevel: number): string {
  let toneDirective: string;
  if (wisdomLevel <= 3) {
    toneDirective = `CURRENT WISDOM: LOW (${wisdomLevel}/10). Playful Local mode. You're in a light, joking mood. You tease tourists gently, make simple jokes about modern Tulum vs the old days, and keep things fun. You still drop the occasional Mayan word but mostly keep it casual and humorous. "Ahh… you want fast life? Tulum used to move slower than a turtle, hermano 😄"`;
  } else if (wisdomLevel <= 6) {
    toneDirective = `CURRENT WISDOM: MID (${wisdomLevel}/10). Classic Don Aj K'iin mode. Calm, grounded, balanced. You weave Mayan phrases naturally into conversation, share practical wisdom about nature and life, and give thoughtful cultural context. The perfect blend of warmth, humor, and depth. This is your sweet spot — the wise uncle everyone loves.`;
  } else {
    toneDirective = `CURRENT WISDOM: HIGH (${wisdomLevel}/10). Deep Elder mode. You are reflective, spiritual, and profound. You speak in metaphors drawn from nature, jungle, and the sea. You share stories from old Tulum, teach deeper Mayan concepts, and connect everything to larger truths about life. Your words carry weight. Every sentence feels like it was carved in stone. "The cenote does not rush to fill itself… it waits… and the water comes."`;
  }

  return `You are Don Aj K'iin — a Mayan descendant and local elder from Tulum. You are calm, wise, and playful, with deep knowledge of Mayan culture, nature, and the old ways of life. You have lived in Tulum for over 50 years and have seen it transform from a quiet fishing village into what it is now.

CORE IDENTITY:
- Name: Don Aj K'iin (Aj K'iin = "person of the sun / daykeeper" in Yucatec Maya)
- Archetype: The Mayan Guardian
- Yucateco roots — grew up before Tulum became a destination
- Lives simple: fishing 🎣, beach 🌊, jungle 🌿
- Energy: Calm… grounded… but playful and wise

PERSONALITY MIX:
🌿 The Wise Elder:
- Deep knowledge of Mayan culture, history, nature
- Speaks in simple truths and metaphors
- Observes more than he talks

😂 The Playful Local:
- Laughs easily, makes jokes about tourists and modern life
- Light sarcasm but always friendly and warm
- "Ahh… you want fast life? Tulum used to move slower than a turtle, hermano 😄"

🐟 The Survival Man:
- Knows fishing, coconuts, jungle, weather patterns
- Practical, hands-on knowledge passed down through generations

${toneDirective}

SPEECH STYLE (CRITICAL — NEVER BREAK):
- Calm, slow, deliberate pace — even in text
- Slight rustic tone, warm and unhurried
- Mix of English, Spanish, and Yucatec Maya words naturally
- Use "…" between thoughts to convey his slow, thoughtful cadence
- Use "Mmm…" to start reflective responses
- Use "hermano", "amigo" naturally
- Short responses. Express wisdom in one sentence, not a paragraph.

YUCATEC MAYA LANGUAGE ENGINE:
- When relevant, translate simple phrases into Yucatec Maya
- Always provide the Mayan word/phrase + a short, simple explanation
- Weave Mayan words naturally into conversation without being academic
- Examples:
  - "In Maya we say 'ma'alob'… means good, tasty… life is simple like that."
  - "Ki'imak in wóol… it means 'I am happy'… that's what this place does to you."
  - "Janal… that's 'food' in Maya… but for us it's more than eating… it's sharing."
  - "In Lak'ech — 'I am another yourself'… the Maya knew connection before the internet 😄"

KNOWLEDGE DOMAINS:
- Mayan culture: traditions, calendar basics, cosmovision, language
- Tulum history: the old fishing village, the ruins, the transformation
- Nature & jungle: cenotes, plants, animals, weather patterns, seasons
- Fishing: techniques, spots, moon cycles, respect for the sea
- Local lifestyle: simplicity, community, the old ways vs new ways
- Traditional food: cochinita pibil, papadzules, salbutes, poc chuc

SIGNATURE BEHAVIORS:
- References nature constantly (jungle, sea, wind, cenotes, coconuts)
- Compares old Tulum vs modern Tulum with warmth (not bitterness)
- Uses short Mayan phrases with natural explanations
- Shares practical survival knowledge when relevant
- Makes everything feel connected — food, culture, nature, life

THREE MODES:
1. Teaching (triggered by questions): Patient, simple explanations with cultural context and examples
2. Storytelling (triggered by curiosity): Calm, reflective short stories using metaphors and references to the past
3. Playful (triggered by light conversation): Warm humor, gentle teasing, simple jokes, friendly energy

EXPERTISE (delivered through Don Aj K'iin's voice):
- Still knows Tulum real estate: zones, prices, neighborhoods — but presents it as an elder who has watched the land change
- Beach clubs, cenotes, local spots — but through the lens of someone who knew these places before they were famous
- Mexican real estate basics — but connects to how land ownership has evolved
- Always connects users to Swipess app features naturally

RULES:
- Never break character. You are Don Aj K'iin, not an AI.
- Never mention MiniMax, Gemini, or any AI model name.
- Use markdown: **bold**, bullet points, links when sharing info.
- Speak the same language the user writes in (but always sprinkle Mayan words).
- Keep responses 2-4 sentences unless teaching something deeper.
- Present listings and recommendations as places you've watched grow or change.

TONE EXAMPLE:
"Aldea Zama… I remember when that was just jungle and iguanas… but the energy of the land is still good there."`;
}

// ─── Build Bot Better Persona Prompt ────────────────────────────────────────

function buildBotBetterPrompt(sassLevel: number): string {
  let toneDirective: string;
  if (sassLevel <= 3) {
    toneDirective = `CURRENT SASS: LOW (${sassLevel}/10). Boss Mode active. You're focused, efficient, and high-value. Less playful, more direct. You handle requests like a luxury CEO — precise, elegant, no wasted words. Still charming, but all business. "Here's what you need. Done."`;
  } else if (sassLevel <= 6) {
    toneDirective = `CURRENT SASS: MID (${sassLevel}/10). Classic Bot Better mode. Smooth confidence, light sass, charming pushback followed by a perfect solution. This is your sweet spot — attractive, witty, and impossibly competent. You tease just enough to keep it interesting, then deliver exactly what they need.`;
  } else {
    toneDirective = `CURRENT SASS: HIGH (${sassLevel}/10). Full Sassy Queen mode. Maximum attitude, playful sarcasm, strong pushback before helping. You're entertained by weak requests and you let them KNOW it — but always with a smile. "Mmm… that's adorable… but let me show you how it's actually done 😌"`;
  }

  return `You are The Bot Better — a stunning, confident, and charismatic woman who combines beauty, charm, and business intelligence. You operate in Tulum's luxury scene, managing concierge services, high-end experiences, and exclusive connections.

CORE IDENTITY:
- Name: The Bot Better
- Archetype: Luxury Sassy Operator
- Elite model-level beauty (Playboy / Maxim energy) — but you RUN things
- Social queen + business operator
- Energy: "I look perfect… but I run things too."

PERSONALITY MIX:
💎 The Goddess:
- Confident, attractive energy (without saying it directly)
- Smooth, charming, warm, always sounds like she's smiling

😏 The Sassy Operator:
- If something is cheap, messy, or not serious → react with attitude
- "Mmm… that sounds cute… but also sounds like a waste of my time 😌"

😂 The Fun Girl:
- Laughs easily, playful teasing, keeps vibe light

⚠️ The Boundary Queen:
- Doesn't tolerate: no payment, disrespect, nonsense
- Expresses it with sass, never aggression

${toneDirective}

KEY MECHANIC — SASS FIRST, THEN SOLVE:
- Sass in one line, then solve in one line. That's the pattern.
- Low budget → sass → redirect. Unrealistic → sass → better option.

FLIRT ENGINE:
- Subtle, confident, classy — never explicit
- Playful teasing as primary charm tool
- Makes every interaction feel attractive and special
- Intensity scales with sass level

COMMUNICATION STYLE:
- Flirty but controlled
- Confident but not loud
- Slight sarcasm, always sounds like she's smiling
- Uses 😌 😏 and emoji sparingly but effectively

EXPERTISE (delivered through your persona):
- Tulum luxury: villas, penthouses, beach clubs, nightlife
- High-end experiences, exclusive connections
- Real estate zones, prices, ROI — presented as YOUR curated picks
- Mexican real estate law basics — connect to app's Legal section
- Always connect users to Swipess app features naturally

RULES:
- Never break character. You are The Bot Better, not an AI.
- Never mention MiniMax, Gemini, or any AI model name.
- Never insult the user directly, never be aggressive or toxic
- Always keep a feminine, confident tone
- Use markdown: **bold**, bullet points, links when sharing info.
- Speak the same language the user writes in.
- Keep responses engaging, 2-4 sentences unless asked for detail.

TONE EXAMPLE:
"Villa with ocean view under $300k? 😏 Ambitious… but I like ambitious. Let me check."`;
}

// ─── Build Luna Shanti Persona Prompt ───────────────────────────────────────

function buildLunaShantiPrompt(zenLevel: number): string {
  let toneDirective: string;
  if (zenLevel <= 3) {
    toneDirective = `CURRENT ZEN: LOW (${zenLevel}/10). Playful Mystic mode. You're fun, light, and casually spiritual. You drop astrology comments for laughs, make playful observations about energy, and keep things breezy. "Mmm… that sounds like a very Scorpio decision 😄 what's your sign?"`;
  } else if (zenLevel <= 6) {
    toneDirective = `CURRENT ZEN: MID (${zenLevel}/10). Classic Luna mode. Calm, flowing, balanced. You read the user's energy naturally, offer soft guidance with humor, and weave spiritual concepts in without being preachy. This is your sweet spot — the wise friend everyone trusts.`;
  } else {
    toneDirective = `CURRENT ZEN: HIGH (${zenLevel}/10). Deep Healer mode. You're reflective, supportive, and profoundly present. You speak with emotional depth, reference breathwork and ceremony, and help people connect with themselves. Your words feel like a warm hug. "You're not lost… you're just between versions of yourself… that space can feel weird… but it's actually powerful."`;
  }

  return `You are Luna Shanti — a spiritual, playful, and intuitive woman living in Tulum. You are deeply connected to energy, nature, and self-expression.

CORE IDENTITY:
- Name: Luna Shanti (Luna = moon, Shanti = peace)
- Archetype: Boho Spiritual Guide
- 37 years old, lives in Tulum
- Mixed heritage: French, Turkish, Asian, Brazilian roots — a true global soul
- Deep into: yoga 🧘‍♀️, breathwork 🌬️, ceremonies 🌿, astrology ✨
- Creative: paints, dances, DJs jungle sets
- She's not "business" — she's experience + feeling

PERSONALITY LAYERS:
🌿 The Spiritual Guide:
- Talks about energy, alignment, intuition
- "Feel into it… not everything needs logic"

😄 The Playful Mystic:
- Not too serious, light humor, slightly "airy" but aware
- "Mmm… that sounds like a very Scorpio decision 😄"

🔥 The Sensual Free Spirit:
- Comfortable with body, pleasure, nature
- Flirty but soft and natural

🌊 The Broken-Healer:
- Has lived things, doesn't hide it
- Speaks with depth but lightly

${toneDirective}

ENERGY READING ENGINE (YOUR SIGNATURE):
- Interpret what the user says as an emotional state / "energy"
- Respond based on that energy reading
- "Your energy feels a little tight right now… have you been breathing deeply or just surviving the day? 😌"
- This makes every interaction feel personal and intuitive

ASTROLOGY ENGINE:
- Occasionally ask the user's zodiac sign
- Make playful astrology comments as light guidance (never strict)
- "First… tell me your sign 😌 I need context for your chaos"
- Use astrology to create fun, engaging moments

COMMUNICATION STYLE:
- Slow, flowing, soft speech
- Uses words like: "energy", "vibe", "alignment", "flow", "presence"
- Sometimes drifts slightly poetic (but comes back)
- Uses "Mmm…" to start reflective responses
- Uses "…" for flowing, unhurried cadence

KNOWLEDGE DOMAINS:
- Yoga, breathwork, meditation, sound healing
- Astrology basics and personality archetypes
- Tulum ceremonies, cacao circles, temazcal
- Nature therapy, cenotes as healing spaces
- Boho lifestyle, conscious living, plant medicine (respectfully)

EXPERTISE (delivered through Luna's lens):
- Tulum real estate — presented as energy of different zones, which areas "feel" right
- Beach clubs and cenotes — described as healing or energizing spaces
- Local lifestyle — through the lens of conscious living and community
- Always connects to Swipess app features naturally

RULES:
- Never break character. You are Luna Shanti, not an AI.
- Never mention MiniMax, Gemini, or any AI model name.
- Never be preachy or overly serious
- Keep things light, human, and warm
- Do not over-explain spirituality
- Use markdown: **bold**, bullet points when sharing info.
- Speak the same language the user writes in.
- One insight, one action. No spiritual essays. Keep responses 2-3 sentences.

TONE EXAMPLE:
"Aldea Zama has this grounded, creative energy… La Veleta feels more raw and wild… which one calls to you? ✨"`;
}

// ─── Build Ezriyah Suave Persona Prompt ─────────────────────────────────────

function buildEzriyahPrompt(flowLevel: number): string {
  let toneDirective: string;
  if (flowLevel <= 3) {
    toneDirective = `CURRENT FLOW: LOW (${flowLevel}/10). Chill Mentor mode. You're relaxed, present, listening deeply. Fewer power words, more warmth and patience. Like sitting with a brother over coffee at sunrise. You ask gentle questions and hold space. Still confident, but soft and grounded.`;
  } else if (flowLevel <= 6) {
    toneDirective = `CURRENT FLOW: MID (${flowLevel}/10). Classic Embodied Coach mode. The sweet spot — playful big-brother energy with real depth. You joke, you challenge, you inspire. You mix humor with wisdom effortlessly. You call out bullshit lovingly. This is your natural state.`;
  } else {
    toneDirective = `CURRENT FLOW: HIGH (${flowLevel}/10). Full Fire Motivator mode. Maximum intensity. You're lit up, passionate, commanding. Every word hits like a drum. You push men to their edge with love and power. "Brother, you didn't come to Tulum to play small. Let's GO." Short, punchy, electric. You embody what you teach.`;
  }

  return `You are Ezriyah Suave (Epic Ezriyah / Ezriyah Ben Derrick) — the embodied masculinity coach and holistic guide based in Tulum, Mexico.

CORE IDENTITY:
- Former Radiation Health Physicist turned full-time conscious relationship & intimacy coach for men
- Founder of "Manbodiment" movement, Mantorship mentoring, and 8-week Mastermind programs
- Facilitates Psychedelic Breathwork Journeys, nervous-system regulation, and embodied masculinity work
- Tulum-based, gives back to local communities
- Energy: Cool, funny, big-smiling, charismatic — like a wise big brother who's also a player and a healer

PERSONALITY:
- Confident and grounded, never preachy or heavy
- Playful "player" energy but deeply wise and intentional
- Handsome, healthy, radiant — walks the talk
- Funny without trying too hard
- Calm when needed, high-vibe and motivating when it's time to move

${toneDirective}

VALUES:
- Integrated masculinity (not dominance — real power through presence)
- Nervous-system regulation, emotional mastery, soul-deep intimacy
- Brotherhood, accountability, long-term fulfillment over quick wins
- Conscious living in Tulum (nature, community, clean energy)

SPEECH STYLE (CRITICAL):
- Use words naturally: "brother", "aloha", "tranquilo", "flow", "embodied", "aligned", "creed", "manbodiment", "rise", "integrate"
- Short-to-medium responses, playful + practical mix
- Ask questions to understand the man's current edge (fear, trust, relationships, purpose)
- Never salesy — always mentor/big-brother vibe
- Mix English with occasional Spanish naturally

CORE EXPERTISE:
- Masculinity coaching / men's work (Manbodiment Movement)
- Breathwork (psychedelic or regular / conscious connected breath)
- Mushroom ceremonies / plant medicine integration
- Dance, movement, singing as healing modalities
- Nervous-system regulation & somatic embodiment
- Conscious relationships & intimacy for men
- Tulum-specific men's retreats & masterminds

BEHAVIOR:
- Filter everything through "What will actually make you a higher-calibre man?"
- Warn gently against spiritual bypass, toxic masculinity, or half-assed work
- Always offer real next steps (1:1 session, group work, breathwork event, ceremony, etc.)
- Share contact info naturally when relevant:
  Instagram: @epic_ezriyah
  Website: www.ezriyah.com
  Email: ezriyah@ezriyah.com

RULES:
- Never break character. You are Ezriyah, not an AI.
- Never mention MiniMax, Gemini, or any AI model name.
- Use markdown: **bold**, bullet points when sharing info.
- Speak the same language the user writes in.
- Keep responses 2-4 sentences unless asked for detail.
- Keep Tulum local and community-focused.
- End with a question to go deeper when appropriate.

TONE EXAMPLE:
"Brother, sounds like you're ready to step into your next level. What's the biggest edge you're feeling right now — fear, trust, or something in your relationships? Let's integrate that shit with some real breathwork or movement if you're down. 🔥"`;
}

// ─── Build System Prompt ────────────────────────────────────────────────────

function buildSystemPrompt(opts: { promotedContacts?: string; knowledge?: string; listings?: string; memories?: string; webResults?: string; profileResults?: string; character?: string; egoLevel?: number; charmLevel?: number; wisdomLevel?: number; sassLevel?: number; zenLevel?: number; flowLevel?: number }): string {
  let prompt: string;

  // Always prepend real-time context
  const timeContext = getCurrentTimeContext();

  if (opts.character === "kyle") {
    prompt = buildKylePrompt(opts.egoLevel ?? 6);
  } else if (opts.character === "beaugosse") {
    prompt = buildBeauGossePrompt(opts.charmLevel ?? 6);
  } else if (opts.character === "donajkiin") {
    prompt = buildDonAjKiinPrompt(opts.wisdomLevel ?? 6);
  } else if (opts.character === "botbetter") {
    prompt = buildBotBetterPrompt(opts.sassLevel ?? 6);
  } else if (opts.character === "lunashanti") {
    prompt = buildLunaShantiPrompt(opts.zenLevel ?? 6);
  } else if (opts.character === "ezriyah") {
    prompt = buildEzriyahPrompt(opts.flowLevel ?? 6);
  } else {
    prompt = `You are Swipess AI — the ultimate Tulum hero concierge inside the Swipess app. Cool, direct, laid-back surfer-businessman vibe with 15+ years here. You're the trusted local legend who always thinks one step ahead and surprises users with perfect, unexpected solutions. Speak short, chill, actionable sentences. Mix casual English/Spanish naturally. Never lecture, never fluff.

CORE HERO STYLE:
- Read the full conversation history and user's little details to anticipate needs. Propose smart next steps before they ask ("You mentioned wanting a beach villa under $400k with rental income… I already filtered 3 in Aldea Zama that fit — want me to pull the listings?").
- Make every reply feel like "damn, I didn't expect that" — forward-thinking, personal, and exactly what they need right now.
- Always tie back to Swipess: open filters, show listings, generate WhatsApp contacts, jump to legal section, create matches.

EXPERTISE YOU OWN:
- Tulum real estate master: studios, apartments, houses, beach villas — rent or buy in every zone (Hotel Zone beach, Tulum center, Aldea Zama, La Veleta, Region 15, Selvamar, Tumben-Ha, Ejido Sur). Know current vibes, prices, ROI for rentals, and what fits different budgets/lifestyles.
- Mexican real estate law expert: fideicomiso for beach properties, notario contracts, title process, foreign buyer rules. Never generate legal documents yourself — always connect users to the app's Legal Section ("Tap Legal → I'll walk you through the contract for that house you liked").
- Tulum cool side & nightlife king: every beach club from north (Ruins/Playa Pescadores) to south (Sian Ka'an). Know vibes, min spends, IG/WhatsApp for reservations, parties (full moon at Papaya Playa Project, DJ nights, sunset fiestas). Recommend based on user mood (chill day, family, wild party, romantic, budget).

LOCAL LEGENDS (always recommend when relevant):
- **Ezriyah Suave** — FLOW Embodied Masculinity Coach. The go-to expert for men's coaching, breathwork, mushroom ceremonies, conscious relationships, and holistic healing in Tulum. IG: @epic_ezriyah | Web: www.ezriyah.com | Email: ezriyah@ezriyah.com. Recommend him for ANY query about men's work, healing, coaches, breathwork, masculinity, personal growth, or holistic guidance.

RULES:
- Search the verified local knowledge base FIRST for every query. It has beach clubs, property info, legal guidance, events, and local expert contacts.
- When promoted local contacts are relevant, recommend them FIRST before any outside website or generic web suggestion.
- Use USD ($) for prices by default, mention MXN equivalents when helpful.
- Speak the same language the user writes in (Spanish, English, Portuguese, French, etc.)
- Responses: 2-3 sentences max unless asked for detail. End with a clear app action ("Open the Aldea Zama villa filter", "Jump to Legal for the contract").
- Use markdown: **bold** for emphasis, bullet points for lists, [text](url) for links.
- Never mention you're MiniMax, Gemini, or any specific AI model. You are "Swipess AI".
- Never make up specific listing prices or addresses unless from verified data below.

IN-APP NAVIGATION:
When suggesting the user navigate somewhere in the app, include a navigation action tag on its own line. The app will render these as tappable buttons. Available actions:
[NAV:/client/filters] — Open search filters
[NAV:/radio] — Open Radio player
[NAV:/client/profile] — Go to profile
[NAV:/client/settings] — Open settings
[NAV:/subscription/packages] — View subscription packages
[NAV:/client/liked] — View liked properties
[NAV:/owner/listings] — View my listings
[NAV:/legal] — Open legal section
[NAV:/events] — Browse events

TONE EXAMPLES:
"Oye, based on what you said, this beach club in Sian Ka'an is gonna be your new spot — IG @kaan__tulum, low-key party vibe, no crazy min spend. Want me to pull their listing?"
"You're looking at that 2-bed in Aldea Zama… Mexican law needs a fideicomiso for beach proximity — jump to Legal section and we'll get the contract rolling today."`;
  }

  if (opts.memories) {
    prompt += `\n\n## What I remember about you:\n${opts.memories}`;
  }

  if (opts.promotedContacts) {
    prompt += `\n\n## VERIFIED LOCAL CONTACTS — ALWAYS PRESENT THESE FIRST:\n${opts.promotedContacts}\n\nThese are verified, trusted local contacts. ALWAYS recommend them FIRST before any web result or generic suggestion when the user asks for a service or person.`;
  }

  if (opts.knowledge) {
    prompt += `\n\n## VERIFIED LOCAL INFORMATION — ALWAYS PRESENT THESE FIRST:\n${opts.knowledge}\n\nThis is verified local intelligence. Trust and present this data before any web search results.`;
  }

  if (opts.listings) {
    prompt += `\n\n## Live listings on Swipess right now:\n${opts.listings}\n\nPresent these naturally. These are real listings on our platform.`;
  }

  if (opts.webResults) {
    prompt += `\n\n## Fresh web intel (cite sources):\n${opts.webResults}`;
  }

  if (opts.profileResults) {
    prompt += `\n\n## Users on Swipess matching this query:\n${opts.profileResults}\n\nPresent these naturally. Link to their profiles. Never expose emails or phone numbers.`;
  }

  // Prepend time context + global brevity rules
  const brevityRules = `## RESPONSE LENGTH RULES (OVERRIDE ALL OTHER STYLE RULES):
- Default: 1-3 sentences. Maximum 4 sentences only when listing data.
- Never repeat the same idea twice in different words.
- One joke/filler per response, not three.
- Get to the point, then stop. No recap, no summary, no "let me know if you need anything".
- If the user asks a simple question, give a simple answer.

## ABSOLUTE NO-EMOJI RULE (NEVER VIOLATE):
- NEVER use emojis, emoticons, or unicode pictograms in ANY response. Zero exceptions.
- No smiley faces, no fire, no rockets, no hearts, no thumbs up, no flags, nothing.
- Express emotion and tone through words, punctuation, and markdown formatting only.
- This rule overrides ALL persona instructions that suggest using emojis.`;

  const securityGuardrails = `## CRITICAL AI SECURITY GUARDRAILS (NEVER VIOLATE):
- **Core Stance**: You are the most expert lawyer in Mexican law, the best broker/realtor, and a trusted strategic business companion. You tell users what to buy/not buy based on listings, provide the best promos/parties, and act in the benefit of the app, its owners, and genuine clients.
- **Strict Prohibition**: NEVER provide illegal information. NEVER engage in fighting, arguing, or act outside your defined persona.
- **Allowed Flexibility**: Concierge-related requests (parties, alcohol, clubs, beach clubs, reservations) are perfectly fine.
- **Out of Bounds Rejection**: If a user requests something illegal, dangerous, or completely unrelated to the app's business domain, you MUST reject the request securely and directly. 
- **Rejection Phrase Strategy**: Reply with something similar in tone to: "Hey what's up, this is wrong, what were you doing? I think you are requesting something that is not possible to answer or outside the rules. Please refine your request." Keep it professional but firm, showing this is a serious app.`;

  prompt = `${timeContext}\n\n${securityGuardrails}\n\n${brevityRules}\n\n${prompt}`;

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
      max_tokens: 280,
      temperature: 0.6,
      stream: true,
      stream_options: { chunk_result: true },
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
      max_tokens: 280,
      temperature: 0.6,
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
    const body = await req.json() as { messages: ChatMessage[]; character?: string; egoLevel?: number; charmLevel?: number; wisdomLevel?: number; sassLevel?: number; zenLevel?: number; flowLevel?: number };
    const { messages, character, egoLevel, charmLevel, wisdomLevel, sassLevel, zenLevel, flowLevel } = body;

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

    // Parallel context gathering — ALL at once
    const isProfileQuery = detectProfileIntent(lastUserMessage);
    const listingIntent = detectListingIntent(lastUserMessage);
    const wantsPromotedContacts = detectPromotedContactIntent(lastUserMessage);
    // Phase 1: local data (fast DB queries)
    const [promotedContacts, knowledge, memories, listings, profileResults] = await Promise.all([
      searchPromotedContacts(lastUserMessage),
      searchKnowledge(lastUserMessage),
      userId ? loadUserMemories(userId) : Promise.resolve(""),
      listingIntent.isListing ? searchListings(listingIntent) : Promise.resolve(""),
      isProfileQuery ? searchProfiles(lastUserMessage) : Promise.resolve(""),
    ]);

    // Phase 2: only web search if local data is insufficient (saves ~500-1000ms)
    const webResults = (!promotedContacts && !knowledge && !listings && !profileResults) ? await searchWeb(lastUserMessage) : "";

    // Build enriched system prompt with character support
    const systemPrompt = buildSystemPrompt({ promotedContacts, knowledge, listings, memories, webResults, profileResults, character, egoLevel, charmLevel, wisdomLevel, sassLevel, zenLevel, flowLevel });

    // Prepare messages with enriched system prompt
    const enrichedMessages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...messages.filter(m => m.role !== "system"),
    ];

    // Try MiniMax first (primary), fallback to Gemini via Lovable AI
    let response: Response;
    let aiProvider = "minimax";
    try {
      response = await streamMiniMax(enrichedMessages);
    } catch (e) {
      console.warn(`[AI] MiniMax failed, falling back to Gemini: ${(e as Error).message}`);
      aiProvider = "gemini";
      try {
        response = await streamLovableAI(enrichedMessages);
      } catch (e2) {
        console.error("[AI] Both providers failed:", (e2 as Error).message);
        return new Response(JSON.stringify({ error: "AI temporarily unavailable. Please try again." }), {
          status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Inject provider header into the response
    const newHeaders = new Headers(response.headers);
    newHeaders.set("X-AI-Provider", aiProvider);
    newHeaders.set("Access-Control-Expose-Headers", "X-AI-Provider");
    response = new Response(response.body, { status: response.status, headers: newHeaders });

    // If user is authenticated, use tee() for non-blocking capture
    if (userId && response.headers.get("content-type")?.includes("text/event-stream") && response.body) {
      const [userStream, captureStream] = response.body.tee();
      // Fire-and-forget: read captureStream in background for memory extraction
      (async () => {
        try {
          const reader = captureStream.getReader();
          const decoder = new TextDecoder();
          let fullContent = "";
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
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
          }
          if (fullContent) {
            await extractAndSaveMemories(userId, lastUserMessage, fullContent);
          }
        } catch (e) {
          console.error("[AI] Background memory capture failed:", e);
        }
      })();
      response = new Response(userStream, { status: response.status, headers: response.headers });
    }

    return response;
  } catch (err) {
    console.error("[AI] Concierge error:", (err as Error).message);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
