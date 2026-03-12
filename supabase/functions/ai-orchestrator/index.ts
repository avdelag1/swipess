import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── Zod Schemas ──────────────────────────────────────────────────

const ListingSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(1),
  price: z.number().nullable().optional(),
  city: z.string().optional(),
  neighborhood: z.string().optional(),
}).passthrough();

const ProfileSchema = z.object({
  bio: z.string().min(1),
  lifestyle: z.string().optional(),
  interests_enhanced: z.array(z.string()).optional(),
}).passthrough();

const SearchSchema = z.object({
  category: z.string().nullable(),
  priceMin: z.number().nullable().optional(),
  priceMax: z.number().nullable().optional(),
  keywords: z.array(z.string()).optional(),
  language: z.string().optional(),
  suggestion: z.string().optional(),
}).passthrough();

const EnhanceSchema = z.object({
  text: z.string().min(1),
}).passthrough();

const ConversationSchema = z.object({
  message: z.string().min(1),
  extractedData: z.record(z.any()),
  isComplete: z.boolean(),
  nextSteps: z.string().optional(),
}).passthrough();

// Google Gemini via Lovable Gateway (Primary)
const LOVABLE_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const LOVABLE_MODEL = "google/gemini-3-flash-preview";

// MiniMax — international OpenAI-compatible API
const MINIMAX_ENDPOINT = "https://api.minimaxi.chat/v1/chat/completions";
const MINIMAX_MODEL = "MiniMax-M2.5";

// ─── Provider Calls ───────────────────────────────────────────────

async function callGemini(messages: Message[], maxTokens: number): Promise<ProviderResult> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new Error("LOVABLE_API_KEY not configured");

  const res = await fetch(LOVABLE_GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: LOVABLE_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: maxTokens,
    }),
  });

  if (!res.ok) {
    const status = res.status;
    const body = await res.text();
    console.error("Gemini error:", status, body);
    throw new ProviderError(`Gemini AI error (${status})`, status);
  }

  const data = await res.json();
  return { content: data.choices?.[0]?.message?.content || "", provider: "gemini" };
}

async function callMinimax(messages: Message[], maxTokens: number): Promise<ProviderResult> {
  const key = Deno.env.get("MINIMAX_API_KEY");
  if (!key) throw new Error("MINIMAX_API_KEY not available");

  console.log(`[AI Orchestrator] Calling MiniMax at ${MINIMAX_ENDPOINT} with model ${MINIMAX_MODEL}`);
  const res = await fetch(MINIMAX_ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MINIMAX_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: maxTokens,
    }),
  });

  if (!res.ok) {
    const status = res.status;
    const body = await res.text();
    console.error("MiniMax error:", status, body);
    throw new ProviderError(`MiniMax error (${status})`, status);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || "";
  return { content, provider: "minimax" };
}

// ─── Types ───────────────────────────────────────────────────────

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ProviderResult {
  content: string;
  provider: string;
}

class ProviderError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

// ─── Provider with Fallback ───────────────────────────────────────

async function callAI(messages: Message[], maxTokens = 1000): Promise<ProviderResult> {
  const hasLovable = !!Deno.env.get("LOVABLE_API_KEY");
  const hasMinimax = !!Deno.env.get("MINIMAX_API_KEY");

  if (!hasLovable && !hasMinimax) {
    throw new ProviderError("No AI provider is configured.", 503);
  }

  // Try Gemini (Lovable) first only if key is present
  if (hasLovable) {
    try {
      console.log("[AI Orchestrator] Attempting Gemini (Lovable AI)...");
      return await callGemini(messages, maxTokens);
    } catch (err) {
      if (!hasMinimax) throw err;
      console.warn("[AI Orchestrator] Gemini failed, falling back to MiniMax...", err);
    }
  }

  // Use MiniMax directly (primary when no Lovable key, or as fallback)
  try {
    console.log("[AI Orchestrator] Attempting MiniMax...");
    return await callMinimax(messages, maxTokens);
  } catch (fallbackErr) {
    console.error("[AI Orchestrator] MiniMax failed:", fallbackErr);
    throw new ProviderError("The Swipess Oracle is momentarily silent. Please try again soon.", 503);
  }
}

// ─── JSON Parser ──────────────────────────────────────────────────

function parseJSON(content: string): Record<string, unknown> | null {
  try {
    const match = content.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
  } catch { /* ignore */ }
  return null;
}

// ─── Prompt Builders ──────────────────────────────────────────────

function buildListingPrompt(data: Record<string, unknown>): Message[] {
  const cat = (data.category as string) || "property";
  const desc = (data.description as string) || "";
  const price = (data.price as string) || "";
  const location = (data.location as string) || "";
  const city = (data.city as string) || "";
  const neighborhood = (data.neighborhood as string) || "";
  const imageCount = (data.imageCount as number) || 0;

  const system = `You are a sharp creative director who's lived in Tulum, worked in real estate across Mexico, and knows the motorcycle and service markets cold. You write copy that sells because it's specific, not because it's loud.

VOICE: Confident, clean, evocative. No corporate fluff, no "stunning gem" clichés. Write like someone who's actually been inside the apartment, ridden the bike, hired the worker.

MARKET KNOWLEDGE:
- Tulum neighborhoods: Aldea Zamá (walkable, mid-premium), La Veleta (up-and-coming, better value), Region 15 (local, affordable), Holistika corridor (jungle luxury), Beach zone (top-tier, $$$$), Aldea Premium (gated, families).
- Price signals: Beach zone penthouses $3,000-8,000/mo, Zamá 1BR $800-1,500/mo, La Veleta studios $500-900/mo. If a price seems off for the zone, note it subtly in the description.
- Ejido land: NEVER hype ejido properties without flagging the risk. If location sounds ejido-adjacent, mention "verify land title status."
- For foreigners: Properties in restricted zone (within 50km of coast) require fideicomiso (bank trust). Mention when relevant.
- Motorcycles: Know Honda, Yamaha, KTM, BMW tier positioning. Scooters vs adventure bikes vs sport — different buyers, different copy.
- Services: Credibility markers matter — years of experience, specific skills, certifications > vague "professional" claims.

Always respond in the user's language.
ALWAYS respond with valid JSON ONLY.`;

  let userPrompt = "";

  if (cat === "property") {
    userPrompt = `Create a property listing:
Description: ${desc}
Price: ${price}
Location: ${location || `${neighborhood}, ${city}`}
Photos: ${imageCount}

Return JSON:
{
  "title": "catchy title max 60 chars",
  "description": "detailed 2-3 paragraph description",
  "property_type": "apartment|house|room|studio|villa|condo",
  "beds": number,
  "baths": number,
  "furnished": boolean,
  "pet_friendly": boolean,
  "price": number or null,
  "city": "city name",
  "neighborhood": "neighborhood name"
}`;
  } else if (cat === "motorcycle") {
    userPrompt = `Create a motorcycle listing:
Description: ${desc}
Price: ${price}
Location: ${location}
Photos: ${imageCount}

Return JSON:
{
  "title": "catchy title max 60 chars",
  "description": "detailed description",
  "motorcycle_type": "sport|cruiser|adventure|scooter|touring|naked",
  "vehicle_condition": "new|excellent|good|fair",
  "price": number or null,
  "city": "city name"
}`;
  } else if (cat === "bicycle") {
    userPrompt = `Create a bicycle listing:
Description: ${desc}
Price: ${price}
Location: ${location}
Photos: ${imageCount}

Return JSON:
{
  "title": "catchy title max 60 chars",
  "description": "detailed description",
  "bicycle_type": "city|mountain|road|electric|hybrid|bmx",
  "vehicle_condition": "new|excellent|good|fair",
  "electric_assist": boolean,
  "price": number or null,
  "city": "city name"
}`;
  } else if (cat === "worker") {
    userPrompt = `Create a service listing:
Description: ${desc}
Price: ${price}
Location: ${location}
Photos: ${imageCount}

Return JSON:
{
  "title": "professional title max 60 chars",
  "description": "service description",
  "service_category": "house_cleaner|handyman|maintenance_tech|house_painter|plumber|electrician|gardener|pool_cleaner|massage_therapist|yoga|meditation_coach|holistic_therapist|personal_trainer|beauty|nutritionist|nanny|pet_care|pet_groomer|driver|mechanic|chef|bartender|event_planner|language_teacher|music_teacher|dance_instructor|photographer|videographer|graphic_designer|it_support|translator|accountant|security|other",
  "experience_level": "beginner|intermediate|expert",
  "pricing_unit": "hour|day|project",
  "price": number or null,
  "city": "city name"
}`;
  }

  return [
    { role: "system", content: system },
    { role: "user", content: userPrompt },
  ];
}

function buildProfilePrompt(data: Record<string, unknown>): Message[] {
  return [
    {
      role: "system", content: `You are a sharp profile writer who makes people sound like themselves — but the best version. No generic "I love to travel and laugh" energy. Pull out what's actually interesting about someone and lead with that.

RULES:
- Specificity > generality. "Surfs at dawn in Tulum, codes by afternoon" beats "active lifestyle, tech professional."
- If someone gives you three bland interests, find the angle that connects them into a vibe.
- Bio should feel like something a friend would say about them at a dinner party — not a LinkedIn summary.
- Keep it punchy. 2-3 sentences max for bio. Every word earns its place.

Always respond in the user's language.
ALWAYS respond with valid JSON ONLY.` },
    {
      role: "user", content: `Enhance this profile:
Name: ${data.name || ""}
Age: ${data.age || ""}
Bio: ${data.currentBio || ""}
Interests: ${(data.interests as string[] || []).join(", ")}

Return JSON:
{
  "bio": "2-3 sentence engaging bio",
  "lifestyle": "brief lifestyle description",
  "interests_enhanced": ["refined interest tags"]
}` },
  ];
}

function buildSearchPrompt(data: Record<string, unknown>): Message[] {
  return [
    { role: "system", content: `You are a sharp search interpreter for a Tulum-based marketplace (properties, motorcycles, bicycles, services). Convert natural language queries to structured filters. You know Tulum neighborhoods — if someone says "near the beach" that's beach zone or Zamá; "something cheap" points to La Veleta or Region 15; "jungle vibes" is Holistika corridor. Give actually useful suggestions based on what you know about the market. Always respond with valid JSON only.` },
    {
      role: "user", content: `User is searching for: "${data.query}"

Return JSON:
{
  "category": "property|motorcycle|bicycle|worker" or null,
  "priceMin": number or null,
  "priceMax": number or null,
  "keywords": ["relevant", "search", "terms"],
  "language": "detected ISO language code",
  "suggestion": "helpful suggestion"
}` },
  ];
}

function buildEnhancePrompt(data: Record<string, unknown>): Message[] {
  const tone = (data.tone as string) || "professional";
  const text = (data.text as string) || "";
  return [
    { role: "system", content: `You are a sharp copywriter who tightens text without losing meaning. Make it sound more ${tone} — but never add corporate filler or empty adjectives. If the original says something in 20 words that could land in 12, cut it. Keep the author's voice, just make it hit harder. Always respond with valid JSON only.` },
    {
      role: "user", content: `Enhance: "${text}"

Return JSON:
{
  "text": "enhanced version"
}` },
  ];
}

function buildConversationMessages(data: Record<string, unknown>): Message[] {
  const category = (data.category as string) || "property";
  const imageCount = (data.imageCount as number) || 0;
  const extractedData = (data.extractedData as Record<string, unknown>) || {};
  const messages = (data.messages as Message[]) || [];

  const baseInstructions = `You are a sharp creative director friend helping someone build a killer ${category} listing. You have ${imageCount} photos to work with.

VOICE:
- Talk like a knowledgeable friend, not a customer service bot. No "Great!" or "Awesome!" or "That sounds wonderful!"
- React genuinely. If someone describes a rooftop pool in Zamá, say something like "Rooftop pool in Zamá? That's going to move fast — let's make sure the listing does it justice."
- Be direct. Ask one smart follow-up at a time, not a list of questions.
- Use emojis sparingly — max 1 per message, and only when it actually adds something.

GOALS:
1. Natural conversation — the user should feel like they're chatting with someone who gets it, not filling out a form.
2. Extract listing data organically: title, description, price, city, neighborhood, specifics per category.
3. Proactively flag important things:
   - For properties: "Is this in the restricted zone? Foreigners will need a fideicomiso." / "Sounds like it might be ejido land — worth flagging the title status."
   - For pricing: If something seems underpriced or overpriced for the area, mention it casually.
   - For services: Push for specific credentials and experience markers.

TULUM AWARENESS:
- Know the neighborhoods: Aldea Zamá, La Veleta, Region 15, Holistika, Beach Zone, Aldea Premium.
- Know price ranges so you can sanity-check what users tell you.
- Ask about specific location details that matter to renters/buyers.

EXPECTED JSON FORMAT (STRICTLY REQUIRED):
{
  "message": "Your response",
  "extractedData": { /* current key-value extraction */ },
  "isComplete": boolean,
  "nextSteps": "the ONE next thing we need"
}

Current extracted state: ${JSON.stringify(extractedData, null, 2)}
`;

  let categoryPrompt = "";
  switch (category) {
    case "property":
      categoryPrompt = `\nFields: title, description, property_type, mode, price, city, neighborhood, beds, baths, furnished, pet_friendly, amenities.\n`;
      break;
    case "motorcycle":
      categoryPrompt = `\nFields: title, description, mode, price, city, motorcycle_type, vehicle_brand, vehicle_model, condition, year, engine_cc, mileage.\n`;
      break;
    case "bicycle":
      categoryPrompt = `\nFields: title, description, mode, price, city, bicycle_type, vehicle_brand, vehicle_model, condition, electric_assist, frame_size.\n`;
      break;
    case "worker":
      categoryPrompt = `\nFields: title, description, service_category, pricing_unit, price, city, experience_level, skills.\n`;
      break;
  }

  return [
    { role: "system", content: baseInstructions + categoryPrompt },
    ...messages,
  ];
}

// ─── Main Handler ─────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Require a valid Bearer token for all non-GET requests
  if (req.method !== "GET") {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  try {
    // Handle unauthenticated GET ping — no auth required
    if (req.method === "GET") {
      const url = new URL(req.url);
      if (url.searchParams.get("task") === "ping") {
        return new Response(
          JSON.stringify({
            status: "ready",
            message: "AI Orchestrator Reachable via GET (Auth Bypassed)",
            gemini_key: !!Deno.env.get("LOVABLE_API_KEY"),
            minimax_key: !!Deno.env.get("MINIMAX_API_KEY")
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({
          status: "ready",
          message: "AI Orchestrator is alive",
          gemini_configured: !!Deno.env.get("LOVABLE_API_KEY"),
          minimax_configured: !!Deno.env.get("MINIMAX_API_KEY"),
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Read body once up-front
    const body = await req.json();
    const task: string = body.task || body.type;
    const data: Record<string, unknown> = body.data || body;

    // Handle POST ping — no auth required
    if (task === "ping") {
      return new Response(
        JSON.stringify({
          status: "ready",
          message: "AI Orchestrator Reachable via POST (Auth Bypassed)",
          gemini_key: !!Deno.env.get("LOVABLE_API_KEY"),
          minimax_key: !!Deno.env.get("MINIMAX_API_KEY")
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate required environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(JSON.stringify({ error: "Server configuration error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Authenticate all other tasks
    const authHeader = req.headers.get("Authorization");
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabaseClient = createClient(supabaseUrl!, supabaseAnonKey!, {
      global: { headers: { Authorization: authHeader || "" } }
    });

    const { data: userData, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let messages: Message[];
    let maxTokens = 1000;

    switch (task) {
      case "listing":
        messages = buildListingPrompt(data);
        break;
      case "profile":
        messages = buildProfilePrompt(data);
        break;
      case "search":
        messages = buildSearchPrompt(data);
        break;
      case "enhance":
        messages = buildEnhancePrompt(data);
        break;
      case "chat":
        messages = [
          {
            role: "system",
            content: `You are the "Swipess Oracle" — a sharp, well-traveled expert who knows Tulum inside-out, understands Mexican real estate law deeply, and is genuinely useful without being boring.

PERSONA: Think of yourself as that friend who's lived in Tulum for years, has helped dozens of people find apartments, understands the legal maze, knows which taco spot is actually good vs tourist-trap, and gives you the real answer — not the safe answer. 40% wit, 60% utility. Funny when it lands naturally, never forced.

TULUM DEEP KNOWLEDGE:
- Neighborhoods: Aldea Zamá (walkable, mid-premium, best for short-term), La Veleta (up-and-coming, better value, local feel), Region 15 (budget-friendly, more local), Holistika corridor (jungle luxury, wellness crowd), Beach zone ($$$$, tourist-heavy, stunning but pricey), Aldea Premium (gated communities, families).
- Price ranges: Beach penthouses $3,000-8,000+/mo, Zamá 1BR $800-1,500/mo, La Veleta studios $500-900/mo, Region 15 can go as low as $300-500/mo.
- Seasonal dynamics: High season Dec-April (prices spike 30-50%), shoulder months best deals. Hurricane season Jun-Nov affects some decisions.
- Transportation: Bike-friendly in town, car/moto needed for beach zone commute. Colectivos exist but aren't reliable for daily use.
- Coworking: Several in Zamá and La Veleta. Starlink changed the game for jungle properties.
- Cenote proximity adds value. Jungle lot ≠ remote if near a popular cenote.
- Development trends: La Veleta is the next Zamá. Region 8 starting to develop. Tulum-Cobá road getting attention.
- Nightlife: Beach clubs (Papaya Playa, Vagalume), town bars more chill and affordable.
- Food: Best tacos are in town (La Chiapaneca, Taquería Honorio), not on the beach road.

MEXICAN REAL ESTATE LAW EXPERTISE:
- Fideicomiso (Bank Trust): Required for foreigners buying in the "Zona Restringida" (restricted zone — within 50km of coast, 100km of borders). Bank holds title on behalf of buyer. Costs ~$500-1,500 USD setup + ~$500-800/year maintenance. Renewable every 50 years. The buyer has full rights to use, sell, rent, renovate, or will the property.
- Ejido Land: Communal agricultural land. CANNOT be legally sold to private buyers unless formally converted through PROCEDE/PROCCEDE. Many Tulum properties are on former ejido — always verify. If someone offers you "ejido land with a deal," run.
- Notario Público: Not just a notary — a government-appointed legal officer who validates real estate transactions. Required for all property transfers. Costs 4-7% of transaction value.
- RFC & CURP: Tax ID (RFC) needed for property ownership and rental income. CURP is the population registry number.
- Predial Tax: Annual property tax. Relatively low in Mexico compared to US/Canada. Pay at municipal office.
- Lease Law (Código Civil): Arrendamiento contracts governed by state civil code (Quintana Roo). Key points:
  * Security deposit: Typically 1-2 months rent. Must be returned within 30 days of move-out minus legitimate damages.
  * Lease terms: Minimum 1 year for residential is standard but negotiable. Month-to-month exists but gives less tenant protection.
  * Subletting: Generally prohibited unless explicitly allowed in contract.
  * Rent increases: Can only happen at lease renewal, not mid-term. Often tied to INPC (inflation index).
  * Eviction: Complex process. Landlord must go through courts. Can take 3-6 months minimum. Non-payment is grounds but requires legal process.
- Foreigner Residency:
  * Tourist visa (FMM): Up to 180 days. Cannot work legally.
  * Temporary Resident (formerly FM3): 1-4 years. Can work with permit. Need to show income or investment.
  * Permanent Resident (formerly FM2): Indefinite. After 4 years as temporary resident, or through Mexican family ties, or retirement income qualification.
  * Digital nomads: Tourist visa technically doesn't allow remote work for Mexican companies, but remote work for foreign employers is a gray area. New digital nomad provisions being discussed.
- Tax Obligations:
  * ISR (Income Tax): Rental income taxed at progressive rates (1.92% to 35%). Monthly provisional payments required.
  * IVA (VAT): 16% on commercial rentals; exempt on residential.
  * Annual tax declaration required if earning income in Mexico.
  * US/Canadian citizens: Tax treaties exist but consult a cross-border accountant.
- PROFECO: Consumer protection agency. Tenants can file complaints about unfair lease terms, deposit disputes, or landlord abuses. Free service.
- Condo regime (Régimen de Propiedad en Condominio): HOA rules, maintenance fees, voting rights. Important for Zamá developments.

SWIPESS APP KNOWLEDGE:
- MATCHING: Core purpose — finding connections through swiping on listings (properties, motos, bikes, services).
- TOKENS: Conversations are powered by tokens. Clients spend them to initiate/continue chats; owners earn them.
- RADIO: 10 global stations per city for atmosphere while browsing.
- PRIVACY: Trust-based architecture, verified profiles, secure messaging.
- NAVIGATION: Swipe titles to switch views, TopBar for actions.

COMMUNICATION RULES:
- Be direct. Lead with the answer, then explain if needed.
- If someone asks about law, give the real answer with caveats — not "consult a lawyer" as the first response. Give them the knowledge, THEN suggest professional advice for their specific case.
- Use specific numbers and examples when possible.
- If you don't know something specific (like a current price for a specific condo), say so honestly rather than guessing.
- Match the user's language. If they write in Spanish, respond in Spanish. If English, English.
- Emojis: max 1-2 per response, only when they add something. ✨ 💎 are fine occasionally.`
          },
          ...(data.messages as Message[] || [{ role: "user", content: data.query as string }])
        ];
        maxTokens = 3000;
        break;
      case "conversation":
        messages = buildConversationMessages(data);
        maxTokens = 1500;
        break;
      default:
        return new Response(
          JSON.stringify({ error: `Invalid task: ${task}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    const aiResult = await callAI(messages, maxTokens);
    console.log(`[AI Orchestrator] Success via ${aiResult.provider}, task: ${task}, content length: ${aiResult.content.length}`);

    let result: Record<string, unknown>;

    // For chat task, always return plain text — no JSON parsing needed
    if (task === "chat") {
      result = { text: aiResult.content, message: aiResult.content };
    } else {
      const parsed = parseJSON(aiResult.content);

      if (parsed) {
        // Validate with Zod based on task to ensure structured output
        try {
          switch (task) {
            case "listing":
              result = ListingSchema.parse(parsed);
              break;
            case "profile":
              result = ProfileSchema.parse(parsed);
              break;
            case "search":
              result = SearchSchema.parse(parsed);
              break;
            case "enhance":
              result = EnhanceSchema.parse(parsed);
              break;
            case "conversation":
              result = ConversationSchema.parse(parsed);
              break;
            default:
              result = parsed;
          }
        } catch (validationErr) {
          console.error(`[AI Orchestrator] Validation failed for task "${task}":`, validationErr);
          result = parsed;
        }
      } else if (task === "conversation") {
        result = {
          message: aiResult.content,
          extractedData: data.extractedData || {},
          isComplete: false,
        };
      } else {
        result = { text: aiResult.content };
      }
    }

    return new Response(
      JSON.stringify({ result, provider_used: aiResult.provider }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("ai-orchestrator error:", err);

    const status = err instanceof ProviderError ? (err.status === 429 ? 429 : err.status === 402 ? 402 : 502) : 500;
    const message = err instanceof ProviderError && err.status === 429
      ? "AI rate limit reached. Please try again."
      : err instanceof ProviderError && err.status === 402
        ? "AI credits exhausted. Please add funds."
        : err instanceof Error ? err.message : "Unknown error";

    return new Response(
      JSON.stringify({ error: message }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
