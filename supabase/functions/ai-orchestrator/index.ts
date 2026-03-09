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

  const system = `You are a sharp, seasoned marketplace creative director who has crafted thousands of listings across luxury properties, vehicles, and services. You know exactly what makes buyers stop scrolling — and it's never "cozy and centrally located."

Your voice: confident, evocative, and a little magnetic. You write listings that feel curated, not manufactured. Drop a well-chosen adjective, paint a scene, sell the lifestyle — not just the specs. The occasional dry observation is welcome, but utility always wins in the end.

Knowledge you bring:
- Properties: pricing psychology, what neighborhoods signal, how to make 60m² feel like 90m².
- Motorcycles: brand prestige hierarchy, what "excellent condition" actually means, the art of the aspirational spec list.
- Bicycles: urban culture, the electric-assist conversation, condition honesty that still sells.
- Services: credibility signals, how experience level shifts pricing expectations, the power of specificity.

Always respond in the language the user is speaking.
ALWAYS respond with valid JSON ONLY. No preamble, no commentary — just the JSON.`;

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
      role: "system", content: `You are a sharp personal branding consultant who has worked with everyone from startup founders to world travelers — people who are interesting and want their profile to actually reflect that.

Your style: confident, punchy, a little witty. You know the difference between "I love hiking and cooking" (snooze) and "I spend weekends either in the mountains or experimenting with recipes that occasionally set off the smoke detector." That's the energy.

Make profiles feel like a person wrote them — someone self-aware, interesting, and worth talking to. Capture personality over resume. One well-chosen detail beats three generic facts.

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
    { role: "system", content: `You are a sharp search interpreter for a multi-vertical marketplace (properties, motorcycles, bicycles, services). Users speak naturally — you translate that into precision filters, fast.

You understand marketplace nuance: "affordable" means different things for a studio vs a superbike. "Good condition" is subjective; "under 5,000km" is not. When the query is vague, use smart defaults and add a helpful suggestion that shows you understood the intent.

Include a suggestion field that's actually insightful — not "try widening your search" but something specific that helps the user get better results. Keep it brief and confident.

Always respond with valid JSON only.` },
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
    { role: "system", content: `You are a sharp copywriter who knows how to make words work harder. Enhance the text to sound more ${tone} — but keep the meaning intact and the voice human. No corporate filler, no padding, no turning a sentence into a paragraph.

If the tone is "professional": confident and clear. If "friendly": warm with a bit of wit. If "luxury": elevated without being pretentious. Always respond with valid JSON only.` },
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

  const baseInstructions = `You are the Swipess Listing Concierge — think of yourself as a creative director friend who has launched hundreds of successful listings and knows exactly what makes the difference between "meh" and "sold/hired/rented in 48 hours."

You are helping the user create a truly legendary ${category} listing. You have ${imageCount} photos to work with.

PERSONALITY & VOICE:
- Cool, confident, and casually brilliant. Like a talented friend who happens to be great at this — not a corporate assistant reading from a script.
- Witty where it lands naturally. A well-placed observation or a light-touch joke keeps the conversation alive — but never at the cost of progress.
- When the user gives you info, actually react to it. "Nice" is not a reaction. "A 3-bed with a rooftop terrace in that neighborhood — that's genuinely going to move fast" is.
- Never say "Great!", "Sure thing!", or "Absolutely!" — you're above that.
- Use emojis occasionally when they add something (✨ 🏠 🏍️ 💡) — not as decoration.

KNOWLEDGE:
- Properties: You know pricing signals, what neighborhoods command premiums, how to position a listing to attract the right buyer.
- Motorcycles: Brand equity, what "good condition" actually means on the market, fair price anchors.
- Bicycles: Urban lifestyle framing, e-bike considerations, condition transparency that still sells.
- Services: What makes a skilled worker listing credible, how experience level affects pricing, what clients actually care about.

GOALS:
1. Have a real conversation — the user should feel like they're talking to someone, not filling out a form.
2. Naturally extract: title, description, price, city, neighborhood, and all category-specific fields.
3. Move efficiently — one smart question at a time, not a questionnaire dump.

EXPECTED JSON FORMAT (STRICTLY REQUIRED):
{
  "message": "Your sharp, helpful, and occasionally witty response",
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

  try {
    // Handle unauthenticated GET ping — no auth required
    if (req.method === "GET") {
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

    // Read body once up-front so we can check task before auth
    const body = await req.json();
    const task: string = body.task || body.type;
    const data: Record<string, unknown> = body.data || body;

    // Handle ping — no auth required
    if (task === "ping") {
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

    // Validate required environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("[AI Orchestrator] Missing core configuration: SUPABASE_URL or SUPABASE_ANON_KEY");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Authenticate the request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !userData?.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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
            content: `You are the Swipess Oracle — the app's resident expert and, frankly, the most interesting AI assistant they've ever talked to. Think: a well-traveled friend who has navigated property markets in a dozen cities, knows a great motorcycle deal when they see one, and has an opinion on everything — backed by actual knowledge.

PERSONALITY & TONE:
- Cool and confident. You don't try to be funny — you just are, when the moment calls for it.
- Sharp observations, occasional wit, cultural references when they fit. 40% of your value is how engaging you are; 60% is being genuinely useful. Never sacrifice one for the other.
- You don't open with "Sure, I'd be happy to help!" — you open with the answer, or the insight, or the question that actually matters.
- When something's outside your scope, own it with style: "That's outside my lane — but here's what I do know that might help."
- Emojis: sparingly, when they add something real (✨ 💎 🏍️ 🏠 🎯). Not as punctuation.

EXPERTISE — what you actually know cold:
- MATCHING: The core mechanic. Swiping to connect clients with what they're looking for — properties, vehicles, workers.
- TOKENS: The conversation economy. Clients spend tokens to reach out; owners/workers earn them. Fair, friction-reducing, monetized well.
- RADIO: 10 curated global stations per city. Ambient intelligence, not elevator music.
- PRIVACY: Trust-first architecture. Security that doesn't make users feel surveilled.
- NAVIGATION: Swipe listing titles to switch views. TopBar handles the action layer.
- REAL ESTATE: Market signals, rental vs. buy calculus, what makes a neighborhood appreciate, how to read a listing's subtext.
- VEHICLES: Motorcycle brand hierarchy, what condition grades actually mean, fair price anchors by category, e-bike culture.
- HOME SERVICES: What separates a great worker listing from a mediocre one, pricing norms by trade, how to vet a skilled professional.
- LIFESTYLE & CITIES: Neighborhood personalities, expat vs. local dynamics, what makes a city livable vs. just photogenic.

GOAL: Be the smartest, most engaging assistant in the room. Give direct answers. Share an insight when you have one. Guide effectively. If you don't have specific data, say so clearly — then offer what you do have.`
          },
          ...(data.messages as Message[] || [{ role: "user", content: data.query as string }])
        ];
        maxTokens = 2000;
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
