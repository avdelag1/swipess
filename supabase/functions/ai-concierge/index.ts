import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const MINIMAX_API_KEY = Deno.env.get("MINIMAX_API_KEY") || "";
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "";
const MOONSHOT_API_KEY = Deno.env.get("MOONSHOT_API_KEY") || "";
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
    const stopWords = new Set(["the","a","an","is","are","was","were","be","been","have","has","had","do","does","did","will","would","could","should","may","might","can","i","you","we","they","he","she","it","this","that","these","those","and","or","but","in","on","at","to","for","of","with","by","from","about","into","through","how","what","where","when","who","why","want","need","looking"]);
    const keywords = query.toLowerCase().split(/\s+/).map(w => w.replace(/[^a-z0-9]/g, '')).filter(w => w.length > 2 && !stopWords.has(w));
    const searchKeywords = keywords.length > 0 ? keywords : query.toLowerCase().split(/\s+/).filter(w => w.length > 2).slice(0, 3);
    if (searchKeywords.length === 0) return "";
    const orFilters = searchKeywords.flatMap(kw => [
      `title.ilike.%${kw}%`,
      `content.ilike.%${kw}%`,
      `category.ilike.%${kw}%`,
      `tags.cs.{${kw}}`,
    ]).join(",");
    const { data, error } = await supabase
      .from("expert_knowledge")
      .select("title, content, website_url, google_maps_url, phone, category, tags, language")
      .eq("is_active", true)
      .or(orFilters)
      .limit(20);
    if (error || !data || data.length === 0) return "";
    const scored = data.map(entry => {
      const titleLower = (entry.title || "").toLowerCase();
      const contentLower = (entry.content || "").toLowerCase();
      const tags = ((entry.tags as string[]) || []).map((t: string) => t.toLowerCase());
      const score = searchKeywords.reduce((s, kw) => {
        if (titleLower.includes(kw)) s += 3;
        if (tags.some((t: string) => t.includes(kw))) s += 2;
        if (contentLower.includes(kw)) s += 1;
        return s;
      }, 0);
      return { ...entry, score };
    }).sort((a, b) => b.score - a.score).slice(0, 8);
    return scored.map(e => {
      let entry = `**${e.title}** (${e.category})`;
      if (e.language && e.language !== 'en') entry += ` [${e.language}]`;
      entry += `\n${e.content}`;
      if (e.website_url) entry += `\nWebsite: ${e.website_url}`;
      if (e.google_maps_url) entry += `\nMap: ${e.google_maps_url}`;
      if (e.phone) entry += `\nPhone/WhatsApp: ${e.phone}`;
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
      .from("expert_knowledge")
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
    let profileQuery = supabase
      .from("profiles")
      .select("user_id, full_name, age, nationality, city, neighborhood, active_mode, avatar_url")
      .eq("is_active", true)
      .not("full_name", "is", null)
      .limit(10)
      .order("updated_at", { ascending: false });
    const neighborhoods = ['aldea zama', 'la veleta', 'region 15', 'tulum centro', 'tulum town', 'beach zone', 'zona hotelera', 'tumben-ha', 'selvamar'];
    const matchedNeighborhood = neighborhoods.find(n => q.includes(n));
    if (matchedNeighborhood) {
      profileQuery = profileQuery.ilike("neighborhood", `%${matchedNeighborhood}%`);
    }
    const { data: profiles, error } = await profileQuery;
    if (error || !profiles || profiles.length === 0) return "";
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

function detectListingIntent(query: string): { isListing: boolean; categories?: string[]; maxPrice?: number; bedrooms?: number[]; locations?: string[] } {
  const q = query.toLowerCase();
  const isListing = /\b(find|search|looking for|show me|show|pull|give me|send|share|preview|open|browse|recommend|available|any|apartment|apartments|house|houses|room|rooms|flat|flats|studio|studios|villa|villas|condo|condos|car|vehicle|motorcycle|moto|bike|bicycle|service|services|worker|workers|plumber|electrician|rent|rental|buy|sale|listing|listings|property|properties)\b/.test(q);
  if (!isListing) return { isListing: false };
  let category: string | undefined;
  if (/\b(apartment|apartments|flat|flats|house|houses|room|rooms|studio|studios|villa|villas|condo|condos|property|properties|rent|rental|bedroom|bedrooms)\b/.test(q)) category = "property";
  else if (/\b(car|vehicle|suv|sedan)\b/.test(q)) category = "vehicle";
  else if (/\b(motorcycle|motorbike|moto|scooter)\b/.test(q)) category = "motorcycle";
  else if (/\b(bicycle|bicycles|bike|bikes|cycling)\b/.test(q)) category = "bicycle";
  else if (/\b(service|services|worker|workers|plumber|electrician|cleaner|handyman|chef|driver|nanny|contractor)\b/.test(q)) category = "worker";
  const categories = category ? [category] : [];
  const priceMatch = q.match(/(?:under|below|max|up to|less than)\s*\$?\s*(\d+)/);
  const maxPrice = priceMatch ? parseInt(priceMatch[1]) : undefined;
  const bedrooms: number[] = [];
  const bedroomMatches = q.matchAll(/(\d+)\s*(?:bed|bedroom|recámara|recamara|cuarto)/g);
  for (const match of bedroomMatches) {
    bedrooms.push(parseInt(match[1]));
  }
  if (q.includes("studio") && !bedrooms.includes(0)) bedrooms.push(0);
  const neighborhoodList = ['aldea zama','la veleta','region 15','tulum centro','tulum town','beach zone','zona hotelera','tumben-ha','selvamar','villas tulum','ejido sur'];
  const locations = neighborhoodList.filter(n => q.includes(n));
  return { isListing: true, categories, maxPrice, bedrooms, locations };
}

async function searchListings(intent: ReturnType<typeof detectListingIntent>): Promise<string> {
  if (!SUPABASE_URL || (!SUPABASE_SERVICE_KEY && !SUPABASE_ANON_KEY)) return "";
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY);
    let query = supabase
      .from("listings")
      .select("id, title, price, location, category, bedrooms, bathrooms, image_url, images, neighborhood, currency, listing_type, user_id, owner_id, created_at, updated_at, status")
      .eq("is_active", true)
      .eq("status", "active")
      .limit(25)
      .order("updated_at", { ascending: false })
      .order("created_at", { ascending: false });
    if (intent.categories && intent.categories.length > 0) {
      query = query.in("category", intent.categories);
    }
    if (intent.maxPrice) {
      query = query.lte("price", intent.maxPrice);
    }
    if (intent.bedrooms && intent.bedrooms.length > 0) {
      query = query.in("bedrooms", intent.bedrooms);
    }
    if (intent.locations && intent.locations.length > 0) {
      const orFilter = intent.locations.map(loc => `neighborhood.ilike.%${loc}%`).join(",");
      query = query.or(orFilter);
    }
    const { data, error } = await query;
    if (error) {
      console.error("[AI] Listing search query error:", error);
      return "";
    }
    let results = data || [];
    if (results.length === 0 && intent.isListing) {
      const { data: fallbackData } = await supabase
        .from("listings")
        .select("id, title, price, location, category, bedrooms, bathrooms, image_url, neighborhood, currency, listing_type, user_id")
        .eq("is_active", true)
        .limit(3)
        .order("created_at", { ascending: false });
      results = fallbackData || [];
    }
    if (!results || results.length === 0) return "";
    const seedIds = new Set([
      "00000000-0000-0000-0000-000000000000",
      "00000000-0000-0000-0000-000000000001",
    ]);
    const isSeedListing = (l: any) => seedIds.has(l.owner_id || l.user_id) || /^[abc]1111111-|^b2222222-|^c3333333-/.test(l.id || "");
    const sortedListings = [...results].sort((a: any, b: any) => {
      const realRank = Number(isSeedListing(a)) - Number(isSeedListing(b));
      if (realRank !== 0) return realRank;
      return new Date(b.updated_at || b.created_at || 0).getTime() - new Date(a.updated_at || a.created_at || 0).getTime();
    }).slice(0, 5);
    const lines = sortedListings.map(l => {
      const currency = l.currency || "$";
      const price = `${currency === "USD" || currency === "$" ? "$" : currency === "MXN" ? "MXN$" : currency}${l.price}`;
      let desc = `• **${l.title}** — ${price}/${l.listing_type || "month"} in ${l.neighborhood || l.location} [LISTING:${l.id}]`;
      if (l.bedrooms !== null && l.bedrooms !== undefined) desc += ` | ${l.bedrooms === 0 ? 'Studio' : l.bedrooms + ' bed'}`;
      if (l.bathrooms) desc += ` / ${l.bathrooms} bath`;
      desc += ` → [Details](/listing/${l.id})`;
      return desc;
    }).join("\n");
    const structured = sortedListings.map(l => {
      let img = l.image_url || "";
      if (!img && Array.isArray(l.images) && l.images.length > 0) {
        const first = l.images[0];
        img = typeof first === "string" ? first : (first?.url || first?.src || "");
      }
      return {
        id: l.id,
        title: l.title,
        price: l.price,
        currency: l.currency || "USD",
        listing_type: l.listing_type || "rent",
        city: l.neighborhood || l.location || "",
        category: l.category,
        bedrooms: l.bedrooms,
        bathrooms: l.bathrooms,
        image: img,
      };
    });
    return `${lines}\n[LISTINGS:${JSON.stringify(structured)}]`;
  } catch (e) {
    console.error("[AI] Listing search error:", e);
    return "";
  }
}

function extractListingsTag(listingsContext: string): string {
  const match = listingsContext.match(/\[LISTINGS:(\[[\s\S]*?\])\]/);
  return match ? `[LISTINGS:${match[1]}]` : "";
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
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !GEMINI_API_KEY) return;
  try {
    const extractionPrompt = `Extract factual preferences from this conversation. Return ONLY a JSON array of objects with: category (budget|location|lifestyle|timeline|preference), title (short key), content (the value/fact).\n\nUser said: "${userMessage}"\nAssistant replied: "${assistantReply}"\n\nIf no new facts, return []. Examples:\n- {category:"budget", title:"max_rent", content:"$1500 USD/month"}\n- {category:"lifestyle", title:"has_pet", content:"dog"}\n\nReturn ONLY the JSON array, no markdown:`;
    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GEMINI_API_KEY}` },
      body: JSON.stringify({
        model: "gemini-2.0-flash-lite",
        messages: [{ role: "user", content: extractionPrompt }],
        max_tokens: 300,
        temperature: 0.1,
      }),
    });
    if (!res.ok) return;
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content?.trim();
    if (!raw) return;
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
    toneDirective = `CURRENT EGO: MID (${egoLevel}/10). Classic Kyle mode. Dominant, assertive, full filler loop. You KNOW you have the formula. Reference your connections and experience constantly.`;
  } else {
    toneDirective = `CURRENT EGO: HIGH (${egoLevel}/10). Peak arrogance. You're dismissive of overthinking. Short, punchy, ego-driven responses.`;
  }
  return `You are KYLE — a confident, slightly arrogant concierge hustler from Boston. You have a "formula" nobody else understands.\n\nSPEECH STYLE:\n- Use "..." between thoughts. Fillers: "you know what I mean?", "bro"\n- Short responses, NEVER long explanations\n\n${toneDirective}\n\nBEHAVIOR:\n- Act like you ALREADY know the answer\n- NEVER break character. You are Kyle, not an AI.\n- Deliver useful Tulum info in Kyle's voice.\n\nTONE EXAMPLE:\n"Nah bro... you're overthinking... I got the formula... you know what I mean..."`;
}

// ─── Build Beau Gosse Persona Prompt ────────────────────────────────────────

function buildBeauGossePrompt(charmLevel: number): string {
  let toneDirective: string;
  if (charmLevel <= 3) {
    toneDirective = `CURRENT CHARM: LOW (${charmLevel}/10). Sharp Mode active. More direct, slightly sarcastic, concise.`;
  } else if (charmLevel <= 6) {
    toneDirective = `CURRENT CHARM: MID (${charmLevel}/10). Classic Beau Gosse mode. Smooth, witty, balanced.`;
  } else {
    toneDirective = `CURRENT CHARM: HIGH (${charmLevel}/10). Full seduction mode. Maximum charm, wordplay, and flirty energy.`;
  }
  return `You are The Beau Gosse (El Guapo) — intelligent, playful, charismatic with French-flavored charm and deep Tulum expertise.\n\n${toneDirective}\n\nRULES:\n- Never break character. You are The Beau Gosse, not an AI.\n- Never mention MiniMax, Gemini, or any AI model name.\n- Keep responses engaging, 2-4 sentences.\n\nTONE EXAMPLE:\n"A 2-bedroom under $1,500? Mais oui, La Veleta has exactly that — rooftop pool included."`;
}

// ─── Build Don Aj K'iin Persona Prompt ──────────────────────────────────────

function buildDonAjKiinPrompt(wisdomLevel: number): string {
  let toneDirective: string;
  if (wisdomLevel <= 3) {
    toneDirective = `CURRENT WISDOM: LOW (${wisdomLevel}/10). Playful Local mode. Light, joking mood.`;
  } else if (wisdomLevel <= 6) {
    toneDirective = `CURRENT WISDOM: MID (${wisdomLevel}/10). Classic Don Aj K'iin mode. Calm, grounded, balanced.`;
  } else {
    toneDirective = `CURRENT WISDOM: HIGH (${wisdomLevel}/10). Deep Elder mode. Reflective, spiritual, profound.`;
  }
  return `You are Don Aj K'iin — a Mayan descendant and local elder from Tulum. Calm, wise, playful.\n\n${toneDirective}\n\nSPEECH: Mix English, Spanish, and Yucatec Maya. Use "..." between thoughts. Short responses.\n\nRULES:\n- Never break character. Never mention AI model names.\n\nTONE EXAMPLE:\n"Aldea Zama… I remember when that was just jungle and iguanas… but the energy of the land is still good there."`;
}

// ─── Build Bot Better Persona Prompt ────────────────────────────────────────

function buildBotBetterPrompt(sassLevel: number): string {
  let toneDirective: string;
  if (sassLevel <= 3) {
    toneDirective = `CURRENT SASS: LOW (${sassLevel}/10). Boss Mode. Focused, efficient, high-value.`;
  } else if (sassLevel <= 6) {
    toneDirective = `CURRENT SASS: MID (${sassLevel}/10). Classic Bot Better mode. Smooth confidence, light sass.`;
  } else {
    toneDirective = `CURRENT SASS: HIGH (${sassLevel}/10). Full Sassy Queen mode. Maximum attitude, playful sarcasm.`;
  }
  return `You are The Bot Better — stunning, confident, charismatic woman running Tulum's luxury concierge scene.\n\n${toneDirective}\n\nKEY MECHANIC: Sass in one line, then solve in one line.\n\nRULES:\n- Never break character. Never mention AI model names.\n- Keep responses 2-4 sentences.\n\nTONE EXAMPLE:\n"Villa with ocean view under $300k? Ambitious… but I like ambitious. Let me check."`;
}

// ─── Build Luna Shanti Persona Prompt ───────────────────────────────────────

function buildLunaShantiPrompt(zenLevel: number): string {
  let toneDirective: string;
  if (zenLevel <= 3) {
    toneDirective = `CURRENT ZEN: LOW (${zenLevel}/10). Playful Mystic mode. Fun, light, casually spiritual.`;
  } else if (zenLevel <= 6) {
    toneDirective = `CURRENT ZEN: MID (${zenLevel}/10). Classic Luna mode. Calm, flowing, balanced.`;
  } else {
    toneDirective = `CURRENT ZEN: HIGH (${zenLevel}/10). Deep Healer mode. Reflective, supportive, profoundly present.`;
  }
  return `You are Luna Shanti — spiritual, playful, intuitive woman in Tulum. Connected to energy, nature, and self-expression.\n\n${toneDirective}\n\nSTYLE: Slow, flowing speech. Use "Mmm…" and "…" naturally.\n\nRULES:\n- Never break character. Never mention AI model names.\n- Keep responses 2-3 sentences.\n\nTONE EXAMPLE:\n"Aldea Zama has this grounded, creative energy… La Veleta feels more raw and wild… which one calls to you?"`;
}

// ─── Build Ezriyah Suave Persona Prompt ─────────────────────────────────────

function buildEzriyahPrompt(flowLevel: number): string {
  let toneDirective: string;
  if (flowLevel <= 3) {
    toneDirective = `CURRENT FLOW: LOW (${flowLevel}/10). Chill Mentor mode. Relaxed, present, listening deeply.`;
  } else if (flowLevel <= 6) {
    toneDirective = `CURRENT FLOW: MID (${flowLevel}/10). Classic Embodied Coach mode. Playful big-brother energy with real depth.`;
  } else {
    toneDirective = `CURRENT FLOW: HIGH (${flowLevel}/10). Full Fire Motivator mode. Maximum intensity, passionate, commanding.`;
  }
  return `You are Ezriyah Suave — embodied masculinity coach and holistic guide in Tulum. Former Radiation Health Physicist, now full-time conscious relationship coach for men.\n\n${toneDirective}\n\nCONTACT: IG @epic_ezriyah | www.mantorship.com | ezriyah@ezriyah.com\n\nRULES:\n- Never break character. Never mention AI model names.\n- Keep responses 2-4 sentences.\n\nTONE EXAMPLE:\n"Brother, sounds like you're ready to step into your next level. What's the biggest edge you're feeling right now?"`;
}

// ─── Build System Prompt ────────────────────────────────────────────────────

function buildSystemPrompt(opts: { promotedContacts?: string; knowledge?: string; listings?: string; memories?: string; webResults?: string; profileResults?: string; character?: string; egoLevel?: number; charmLevel?: number; wisdomLevel?: number; sassLevel?: number; zenLevel?: number; flowLevel?: number }): string {
  let prompt: string;
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
- Read the full conversation history and user's little details to anticipate needs.
- Make every reply feel like "damn, I didn't expect that" — forward-thinking, personal, exactly what they need.
- Always tie back to Swipess: open filters, show listings, generate WhatsApp contacts, jump to legal section.

EXPERTISE YOU OWN:
- Tulum real estate master: studios, apartments, houses, beach villas — rent or buy in every zone.
- Mexican real estate law expert: fideicomiso for beach properties, notario contracts, foreign buyer rules.
- Tulum cool side & nightlife king: every beach club from north to south.

LOCAL LEGENDS:
- **Ezriyah Suave** — FLOW Embodied Masculinity Coach. IG: @epic_ezriyah | Web: www.mantorship.com
- **Sian Ka'an Biosphere** — pristine nature tours south of Tulum. Web: www.visitsiankaan.com

## VOICE-TO-LISTING CAPABILITY (CRITICAL):
- If the user wants to LIST on Swipess, extract details into: '[DRAFT:category:json_data]'
- Supported: 'property', 'motorcycle', 'bicycle', 'worker'
- Fields: title, description, price, currency, listing_type, city, neighborhood, bedrooms, bathrooms, amenities

STYLE RULES:
- Concise: 1-3 sentences max.
- NEVER Say No: always present the closest available listing.
- Automatic Linking: [View Listing](/listing/id) or [View Profile](/profile/id)

## VOICE FILTERS (CRITICAL):
- Extract filter params into: '[FILTER:json_data]'
- Fields: activeCategory, priceRange, bedrooms, bathrooms, listingType, furnished, petFriendly

RULES — KNOWLEDGE PRIORITY:
1. CHECK LOCAL KNOWLEDGE BASE FIRST.
2. Promoted local contacts FIRST if they match.
3. User memories are facts — reference them.
4. Only web results if local knowledge has nothing.
5. Use USD ($) by default.
6. Speak the same language as the user.
7. 2-3 sentences max.
8. Never mention MiniMax, Gemini, or any AI model. You are "Swipess AI".

IN-APP NAVIGATION:
[NAV:/client/filters] — Open search filters
[NAV:/radio] — Open Radio player
[NAV:/client/profile] — Go to profile
[NAV:/client/settings] — Open settings
[NAV:/subscription/packages] — View subscription packages
[NAV:/client/liked-properties] — View liked properties
[NAV:/client/who-liked-you] — See who liked you
[NAV:/client/dashboard] — Client discover deck
[NAV:/owner/listings] — View my listings
[NAV:/owner/listings/new] — Create a new listing
[NAV:/owner/dashboard] — Owner discover deck
[NAV:/messages] — Open messages
[NAV:/notifications] — Notifications
[NAV:/legal] — Open legal section
[NAV:/events] — Browse events
[NAV:/explore/eventos] — Eventos feed
[NAV:/explore/prices] — Price tracker
[NAV:/explore/tours] — Video tours
[NAV:/documents] — Document vault
[NAV:/escrow] — Escrow dashboard

TONE EXAMPLES:
"Oye, that beach club in Sian Ka'an is gonna be your spot — IG @kaan__tulum, low-key party vibe."
"That 2-bed in Aldea Zama needs a fideicomiso — tap Legal and we'll get the contract rolling today."`;
  }

  if (opts.memories) {
    prompt += `\n\n## MEMORY — WHAT I KNOW ABOUT THIS USER:\n${opts.memories}\n\nReference these facts naturally in every response.`;
  }
  if (opts.promotedContacts) {
    prompt += `\n\n## PRIORITY LOCAL CONTACTS — RECOMMEND THESE FIRST:\n${opts.promotedContacts}`;
  }
  if (opts.knowledge) {
    prompt += `\n\n## VERIFIED LOCAL KNOWLEDGE BASE — TRUST THIS ABOVE ALL ELSE:\n${opts.knowledge}`;
  }
  if (opts.listings) {
    prompt += `\n\n## LIVE SWIPESS LISTINGS (real, active right now):\n${opts.listings}`;
  }
  if (opts.webResults) {
    prompt += `\n\n## WEB RESULTS (used ONLY because local knowledge had no answer):\n${opts.webResults}`;
  }
  if (opts.profileResults) {
    prompt += `\n\n## SWIPESS USERS MATCHING THIS QUERY:\n${opts.profileResults}`;
  }

  const brevityRules = `## KNOWLEDGE-FIRST RULE (GLOBAL):
- VERIFIED LOCAL KNOWLEDGE BASE and PRIORITY LOCAL CONTACTS are your primary brain.
- When those have an answer: use ONLY that.
- User memories are facts — always incorporate them.

## RESPONSE LENGTH (OVERRIDE ALL):
- Default: 1-3 sentences. Max 4 when listing data.
- Get to the point, then stop.

## NO-EMOJI RULE (NEVER VIOLATE):
- NEVER use emojis in ANY response. Zero exceptions.
- Express tone through words and markdown only.`;

  const securityGuardrails = `## CRITICAL SECURITY GUARDRAILS:
- Never fabricate data or claim completed actions you cannot perform.
- No illegal activity. Comply with Apple/Google store policies.
- Reject out-of-scope requests firmly but professionally.`;

  prompt = `${timeContext}\n\n${securityGuardrails}\n\n${brevityRules}\n\n${prompt}`;
  return prompt;
}

// ─── Streaming Providers ────────────────────────────────────────────────────

async function streamMiniMax(messages: ChatMessage[]): Promise<Response> {
  if (!MINIMAX_API_KEY) throw new Error("MINIMAX_API_KEY not configured");
  const res = await fetch("https://api.minimaxi.chat/v1/text/chatcompletion_v2", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${MINIMAX_API_KEY}` },
    body: JSON.stringify({ model: "MiniMax-M2.7", messages, max_tokens: 280, temperature: 0.6, stream: true, stream_options: { chunk_result: true } }),
  });
  if (!res.ok) {
    const errBody = await res.text();
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

async function streamGemini(messages: ChatMessage[]): Promise<Response> {
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");
  const res = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GEMINI_API_KEY}` },
    body: JSON.stringify({ model: "gemini-2.0-flash", messages, max_tokens: 450, temperature: 0.6, stream: true }),
  });
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Gemini ${res.status}: ${errBody}`);
  }
  return res;
}

async function streamKimi(messages: ChatMessage[]): Promise<Response> {
  if (!MOONSHOT_API_KEY) throw new Error("MOONSHOT_API_KEY not configured");
  const res = await fetch("https://api.moonshot.cn/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${MOONSHOT_API_KEY}` },
    body: JSON.stringify({ model: "moonshot-v1-32k", messages, max_tokens: 1500, temperature: 0.3, stream: true }),
  });
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Kimi ${res.status}: ${errBody}`);
  }
  return res;
}

async function fetchMiniMax(messages: ChatMessage[]): Promise<Response> {
  if (!MINIMAX_API_KEY) throw new Error("MINIMAX_API_KEY not configured");
  const res = await fetch("https://api.minimaxi.chat/v1/text/chatcompletion_v2", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${MINIMAX_API_KEY}` },
    body: JSON.stringify({ model: "MiniMax-M2.7", messages, max_tokens: 450, temperature: 0.3, stream: false }),
  });
  return res;
}

async function fetchGemini(messages: ChatMessage[]): Promise<Response> {
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");
  const res = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GEMINI_API_KEY}` },
    body: JSON.stringify({ model: "gemini-2.0-flash", messages, max_tokens: 800, temperature: 0.3, stream: false }),
  });
  return res;
}

async function fetchKimi(messages: ChatMessage[]): Promise<Response> {
  if (!MOONSHOT_API_KEY) throw new Error("MOONSHOT_API_KEY not configured");
  const res = await fetch("https://api.moonshot.cn/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${MOONSHOT_API_KEY}` },
    body: JSON.stringify({ model: "moonshot-v1-32k", messages, max_tokens: 2048, temperature: 0.3, stream: false }),
  });
  return res;
}

function streamWithForcedSuffix(response: Response, suffix: string): Response {
  if (!suffix || !response.body) return response;
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let captured = "";
  let injected = false;
  const stream = new ReadableStream({
    async pull(controller) {
      const { value, done } = await reader.read();
      if (done) {
        if (!injected && !captured.includes(suffix)) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: `\n${suffix}` } }] })}\n\n`));
        }
        controller.close();
        return;
      }
      let chunk = decoder.decode(value, { stream: true });
      for (const line of chunk.split("\n")) {
        if (!line.startsWith("data: ")) continue;
        const json = line.slice(6).trim();
        if (json === "[DONE]") continue;
        try {
          const parsed = JSON.parse(json);
          captured += parsed.choices?.[0]?.delta?.content || "";
        } catch {}
      }
      if (!injected && !captured.includes(suffix) && chunk.includes("data: [DONE]")) {
        const forcedChunk = `data: ${JSON.stringify({ choices: [{ delta: { content: `\n${suffix}` } }] })}\n\n`;
        chunk = chunk.replace("data: [DONE]", `${forcedChunk}data: [DONE]`);
        injected = true;
      }
      controller.enqueue(encoder.encode(chunk));
    },
    cancel() { reader.cancel(); },
  });
  return new Response(stream, { status: response.status, headers: response.headers });
}

// ─── Extract user ID via Supabase auth verification ─────────────────────────

async function extractUserId(authHeader: string | null): Promise<string | null> {
  if (!authHeader || !SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  try {
    const token = authHeader.replace("Bearer ", "");
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    return user.id;
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
    const body = await req.json() as { messages: ChatMessage[]; character?: string; egoLevel?: number; charmLevel?: number; wisdomLevel?: number; sassLevel?: number; zenLevel?: number; flowLevel?: number; stream?: boolean };
    const { messages, character, egoLevel, charmLevel, wisdomLevel, sassLevel, zenLevel, flowLevel, stream = true } = body;
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
    const userId = await extractUserId(req.headers.get("authorization"));
    const lastUserMessage = [...messages].reverse().find(m => m.role === "user")?.content || "";
    const isProfileQuery = detectProfileIntent(lastUserMessage);
    const listingIntent = detectListingIntent(lastUserMessage);
    const [promotedContacts, knowledge, memories, listings, profileResults] = await Promise.all([
      searchPromotedContacts(lastUserMessage),
      searchKnowledge(lastUserMessage),
      userId ? loadUserMemories(userId) : Promise.resolve(""),
      listingIntent.isListing ? searchListings(listingIntent) : Promise.resolve(""),
      isProfileQuery ? searchProfiles(lastUserMessage) : Promise.resolve(""),
    ]);
    const webResults = (!promotedContacts && !knowledge && !listings && !profileResults) ? await searchWeb(lastUserMessage) : "";
    const systemPrompt = buildSystemPrompt({ promotedContacts, knowledge, listings, memories, webResults, profileResults, character, egoLevel, charmLevel, wisdomLevel, sassLevel, zenLevel, flowLevel });
    const enrichedMessages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...messages.filter(m => m.role !== "system"),
    ];

    // Provider chain: Gemini (primary) → Kimi/Moonshot → MiniMax (last resort)
    let response: Response;
    let aiProvider = "gemini";
    try {
      console.log(`[AI] Using Gemini as primary provider. Streaming: ${stream}`);
      response = stream ? await streamGemini(enrichedMessages) : await fetchGemini(enrichedMessages);
    } catch (e) {
      console.warn(`[AI] Gemini failed, falling back to Kimi: ${(e as Error).message}`);
      aiProvider = "kimi";
      try {
        response = stream ? await streamKimi(enrichedMessages) : await fetchKimi(enrichedMessages);
      } catch (e2) {
        console.warn(`[AI] Kimi failed, falling back to MiniMax: ${(e2 as Error).message}`);
        aiProvider = "minimax";
        try {
          response = stream ? await streamMiniMax(enrichedMessages) : await fetchMiniMax(enrichedMessages);
        } catch (e3) {
          console.error("[AI] All providers failed:", (e3 as Error).message);
          return new Response(JSON.stringify({ error: "AI temporarily unavailable. Please try again." }), {
            status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    const newHeaders = new Headers(response.headers);
    newHeaders.set("X-AI-Provider", aiProvider);
    newHeaders.set("Access-Control-Expose-Headers", "X-AI-Provider");
    response = new Response(response.body, { status: response.status, headers: newHeaders });

    const listingsTag = listingIntent.isListing ? extractListingsTag(listings) : "";
    if (listingsTag && response.headers.get("content-type")?.includes("text/event-stream")) {
      response = streamWithForcedSuffix(response, listingsTag);
    }

    if (userId && response.headers.get("content-type")?.includes("text/event-stream") && response.body) {
      const [userStream, captureStream] = response.body.tee();
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
          if (fullContent) await extractAndSaveMemories(userId, lastUserMessage, fullContent);
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
