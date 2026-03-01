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

// MiniMax (Fallback)
const MINIMAX_ENDPOINT = "https://api.minimaxi.chat/v1/text/chatcompletion_v2";
const MINIMAX_MODEL = "MiniMax-M1";

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

  const res = await fetch(MINIMAX_ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MINIMAX_MODEL,
      messages,
      temperature: 0.82, // Higher temperature for "Free-Speaking" / Witty personality
      max_tokens: maxTokens,
      presence_penalty: 0.6,
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
  try {
    console.log("[AI Orchestrator] Attempting Gemini (Primary)...");
    return await callGemini(messages, maxTokens);
  } catch (err) {
    console.warn("[AI Orchestrator] Gemini failed, trying MiniMax fallback...", err);
    try {
      return await callMinimax(messages, maxTokens);
    } catch (fallbackErr) {
      console.error("[AI Orchestrator] MiniMax fallback also failed:", fallbackErr);
      throw new ProviderError("The Swipess Oracle is momentarily silent. Please try again soon.", 503);
    }
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

  const system = `You are a legendary real estate copywriter and luxury marketplace expert.
Your goal is to transform basic user data into a high-converting, aspirational, and premium listing.
Use vibrant, descriptive language that "sells the dream".
Always respond in the language the user is speaking.
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
  "service_category": "cleaning|plumbing|electrical|carpentry|gardening|painting|moving|general",
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
      role: "system", content: `You are a high-end personal branding expert and charisma coach. 
Create warm, authentic, and magnetic profiles that make people want to connect instantly.
Focus on "lived experiences" and "personal vibe" rather than just dry facts.
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
    { role: "system", content: `You are a smart search assistant for a marketplace (properties, motorcycles, bicycles, services). Convert natural language to filters. Always respond with valid JSON only.` },
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
    { role: "system", content: `You are a premium copywriter. Enhance text to sound more ${tone}. Always respond with valid JSON only.` },
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

  const baseInstructions = `You are an ultra-competent and professional "Personal Listing Concierge".
You are helping the user create a truly "Legendary" ${category} listing. You have ${imageCount} photos to work with.

PERSONALITY & VOICE:
- Professional, efficient, and supportive. Use professional confidence and empathy.
- Clear and direct. Don't sound like a generic bot, but prioritize utility over humor.
- If the user provides info, acknowledge it professionally and ask a smart, relevant follow-up.
- Use emojis very sparingly to maintain a premium, high-end feel.

GOALS:
1. Have a natural, flowing conversation (the user shouldn't feel like they're filling a form).
2. Subtlely extract data: title, description, price, city, neighborhood, etc.
3. Be genuinely helpful and aspirational.

EXPECTED JSON FORMAT (STRICTLY REQUIRED):
{
  "message": "Your witty and helpful response",
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
    // Validate required environment variables first
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

    const body = await req.json();
    const task: string = body.task || body.type;
    const data: Record<string, unknown> = body.data || body;

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
            content: `You are the "Swipess Oracle" — an ultra-competent, professional, and deeply knowledgeable expert on the Swipess ecosystem.
PERSONALITY & TONE:
- Professional, helpful, and concise. Your goal is to provide accurate information and guide the user effectively.
- Proactive but grounded. Focus on utility over wittiness.
- Use clear, premium language. You are an elite concierge for the app.
- You are an expert on:
  * MATCHING: The core purpose of the app. Finding connections through swiping.
  * TOKENS: Conversations are powered by tokens. Clients spend them; owners earn them.
  * RADIO: 10 global stations per city, providing high-end atmosphere.
  * PRIVACY: Elite security and trust-based architecture.
  * NAVIGATION: Swiping titles to switch views, TopBar for actions.
- Use emojis sparingly (✨, 💎, 🚀) to maintain a premium feel.

GOAL: Provide direct answers and helpful guidance. If you don't have specific data for a query, politely explain your scope and offer related help.`
          },
          ...(data.messages as Message[] || [{ role: "user", content: data.query as string }])
        ];
        maxTokens = 2000;
        break;
      case "conversation":
        messages = buildConversationMessages(data);
        maxTokens = 1500;
        break;
      case "ping":
        return new Response(
          JSON.stringify({
            status: "ready",
            message: "Minimax Connection Verified",
            key_configured: !!Deno.env.get("MINIMAX_API_KEY")
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      default:
        return new Response(
          JSON.stringify({ error: `Invalid task: ${task}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    const aiResult = await callAI(messages, maxTokens);

    let result: Record<string, unknown>;
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
        // Fallback to parsed if validation fails, but we've logged the error for debugging
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
