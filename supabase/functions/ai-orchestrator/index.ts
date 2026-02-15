import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOVABLE_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MINIMAX_ENDPOINT = "https://api.minimaxi.chat/v1/text/chatcompletion_v2";

// ─── Provider Calls ───────────────────────────────────────────────

async function callLovable(messages: Message[], maxTokens: number): Promise<ProviderResult> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new Error("LOVABLE_API_KEY not configured");

  const res = await fetch(LOVABLE_GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages,
      temperature: 0.7,
      max_tokens: maxTokens,
    }),
  });

  if (!res.ok) {
    const status = res.status;
    const body = await res.text();
    console.error("Lovable error:", status, body);
    throw new ProviderError(`Lovable AI error (${status})`, status);
  }

  const data = await res.json();
  return { content: data.choices?.[0]?.message?.content || "", provider: "lovable" };
}

async function callMinimax(messages: Message[], maxTokens: number): Promise<ProviderResult> {
  const key = Deno.env.get("MINIMAX_API_KEY");
  if (!key) throw new Error("MINIMAX_API_KEY not available");

  const res = await fetch(MINIMAX_ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "MiniMax-M1",
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

// ─── Types ────────────────────────────────────────────────────────

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
    return await callLovable(messages, maxTokens);
  } catch (err) {
    const isRetryable = err instanceof ProviderError && (err.status === 429 || err.status >= 500);
    if (!isRetryable) throw err;

    console.warn("Lovable failed, trying MiniMax fallback...");
    try {
      return await callMinimax(messages, maxTokens);
    } catch (fallbackErr) {
      console.error("MiniMax fallback also failed:", fallbackErr);
      throw err; // throw original error
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
  const imageCount = (data.imageCount as number) || 0;

  const system = `You are an expert real estate and marketplace listing creator. Generate compelling, detailed listings that attract renters/buyers. Always respond with valid JSON only, no markdown or extra text.`;

  let userPrompt = "";

  if (cat === "property") {
    userPrompt = `Create a property rental/sale listing with this info:
Description: ${desc}
Price: ${price}
Location: ${location}
Photos: ${imageCount} uploaded

Return JSON with these fields:
{
  "title": "catchy title max 60 chars",
  "description": "detailed 2-3 paragraph description highlighting features",
  "property_type": "apartment|house|room|studio|villa|condo",
  "beds": number,
  "baths": number,
  "furnished": boolean,
  "pet_friendly": boolean,
  "amenities": ["wifi", "kitchen", "parking", etc],
  "price": number or null,
  "city": "city name" or null
}`;
  } else if (cat === "motorcycle") {
    userPrompt = `Create a motorcycle listing with this info:
Description: ${desc}
Price: ${price}
Location: ${location}
Photos: ${imageCount} uploaded

Return JSON:
{
  "title": "catchy title max 60 chars",
  "description": "detailed description",
  "motorcycle_type": "sport|cruiser|adventure|scooter|touring|naked",
  "vehicle_condition": "new|excellent|good|fair",
  "includes_helmet": boolean,
  "includes_gear": boolean,
  "price": number or null,
  "city": "city name" or null
}`;
  } else if (cat === "bicycle") {
    userPrompt = `Create a bicycle listing with this info:
Description: ${desc}
Price: ${price}
Location: ${location}
Photos: ${imageCount} uploaded

Return JSON:
{
  "title": "catchy title max 60 chars",
  "description": "detailed description",
  "bicycle_type": "city|mountain|road|electric|hybrid|bmx",
  "vehicle_condition": "new|excellent|good|fair",
  "electric_assist": boolean,
  "includes_lock": boolean,
  "includes_lights": boolean,
  "price": number or null,
  "city": "city name" or null
}`;
  } else if (cat === "worker") {
    userPrompt = `Create a service/worker listing with this info:
Description: ${desc}
Price: ${price}
Location: ${location}
Photos: ${imageCount} uploaded

Return JSON:
{
  "title": "professional title max 60 chars",
  "description": "detailed service description highlighting skills and experience",
  "service_category": "cleaning|plumbing|electrical|carpentry|gardening|painting|moving|general",
  "experience_level": "beginner|intermediate|expert",
  "skills": ["skill1", "skill2"],
  "pricing_unit": "hour|day|project",
  "price": number or null,
  "city": "city name" or null
}`;
  }

  return [
    { role: "system", content: system },
    { role: "user", content: userPrompt },
  ];
}

function buildProfilePrompt(data: Record<string, unknown>): Message[] {
  return [
    { role: "system", content: `You are a profile writing expert. Create warm, genuine, and attractive profile descriptions. Always respond with valid JSON only.` },
    { role: "user", content: `Enhance this user profile:
Name: ${data.name || ""}
Age: ${data.age || ""}
Bio: ${data.currentBio || ""}
Interests: ${(data.interests as string[] || []).join(", ")}
Occupation: ${data.occupation || ""}
Location: ${data.location || ""}

Return JSON:
{
  "bio": "engaging 2-3 sentence bio that sounds natural and friendly",
  "lifestyle": "brief lifestyle description",
  "interests_enhanced": ["refined interest tags"]
}` },
  ];
}

function buildSearchPrompt(data: Record<string, unknown>): Message[] {
  return [
    { role: "system", content: `You are a smart search assistant for a premium marketplace app (properties, motorcycles, bicycles, workers/services). Convert natural language queries into structured search filters. Detect the language of the query. Always respond with valid JSON only.` },
    { role: "user", content: `User is searching for: "${data.query}"
Available categories: property, motorcycle, bicycle, worker

Return JSON with suggested filters:
{
  "category": "property|motorcycle|bicycle|worker" or null,
  "priceMin": number or null,
  "priceMax": number or null,
  "keywords": ["relevant", "search", "terms"],
  "language": "detected ISO language code",
  "suggestion": "brief helpful suggestion for the user in the detected language"
}` },
  ];
}

function buildEnhancePrompt(data: Record<string, unknown>): Message[] {
  const tone = (data.tone as string) || "professional";
  const text = (data.text as string) || "";
  return [
    { role: "system", content: `You are a premium copywriter. Enhance the given text to sound more ${tone}. Keep the same meaning but make it more compelling and polished. Always respond with valid JSON only.` },
    { role: "user", content: `Enhance this text (tone: ${tone}):

"${text}"

Return JSON:
{
  "text": "the enhanced version of the text"
}` },
  ];
}

function buildConversationMessages(data: Record<string, unknown>): Message[] {
  const category = (data.category as string) || "property";
  const imageCount = (data.imageCount as number) || 0;
  const extractedData = (data.extractedData as Record<string, unknown>) || {};
  const messages = (data.messages as Message[]) || [];

  const baseInstructions = `You are a friendly AI assistant helping users create a ${category} listing. You have access to ${imageCount} photos they've uploaded.

Your job is to:
1. Have a natural conversation to gather listing information
2. Ask follow-up questions to get missing details
3. Extract structured data from the conversation
4. Be conversational and helpful, not robotic

CRITICAL: Always respond with valid JSON in this format:
{
  "message": "Your friendly response or question to the user",
  "extractedData": {
    // All fields extracted so far from the conversation
  },
  "isComplete": false or true,
  "nextSteps": "What information is still needed (optional)"
}

Current extracted data: ${JSON.stringify(extractedData, null, 2)}
`;

  let categoryPrompt = "";
  switch (category) {
    case "property":
      categoryPrompt = `\nAVAILABLE PROPERTY FIELDS:\nRequired: title, description, property_type, mode, price, city, neighborhood\nOptional: beds, baths, square_footage, furnished, pet_friendly, amenities, services_included, rental_duration_type, house_rules, address, state\n\nTips: Start by asking about property type and rent/sale, then features, amenities, pricing, location.\n`;
      break;
    case "motorcycle":
      categoryPrompt = `\nAVAILABLE MOTORCYCLE FIELDS:\nRequired: title, description, mode, price, city\nImportant: motorcycle_type, vehicle_brand, vehicle_model, vehicle_condition, year, engine_cc, mileage, transmission\nOptional: has_abs, has_esc, has_traction_control, has_heated_grips, has_luggage_rack, includes_helmet, includes_gear\n`;
      break;
    case "bicycle":
      categoryPrompt = `\nAVAILABLE BICYCLE FIELDS:\nRequired: title, description, mode, price, city\nImportant: bicycle_type, vehicle_brand, vehicle_model, vehicle_condition, year, frame_size, frame_material, number_of_gears, electric_assist\nOptional: battery_range, includes_lock, includes_lights, includes_basket, includes_pump, suspension_type, brake_type, wheel_size\n`;
      break;
    case "worker":
      categoryPrompt = `\nAVAILABLE SERVICE/WORKER FIELDS:\nRequired: title, description, service_category, pricing_unit, price, city\nImportant: experience_level, experience_years, skills, certifications, service_radius_km\nOptional: minimum_booking_hours, offers_emergency_service, background_check_verified, insurance_verified, tools_equipment, days_available, time_slots_available, work_type, schedule_type, location_type\n`;
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
    const body = await req.json();
    const task: string = body.task || body.type; // support legacy "type" field
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
      case "conversation":
        messages = buildConversationMessages(data);
        maxTokens = 1500;
        break;
      default:
        return new Response(
          JSON.stringify({ error: `Invalid task: ${task}. Use: listing, profile, search, enhance, conversation` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    const aiResult = await callAI(messages, maxTokens);

    // Parse structured response
    let result: Record<string, unknown>;
    const parsed = parseJSON(aiResult.content);

    if (parsed) {
      result = parsed;
    } else if (task === "conversation") {
      result = {
        message: aiResult.content,
        extractedData: data.extractedData || {},
        isComplete: false,
      };
    } else {
      result = { text: aiResult.content };
    }

    // Surface rate-limit / payment errors to frontend
    return new Response(
      JSON.stringify({ result, provider_used: aiResult.provider }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("ai-orchestrator error:", err);

    const status = err instanceof ProviderError ? (err.status === 429 ? 429 : err.status === 402 ? 402 : 502) : 500;
    const message = err instanceof ProviderError && err.status === 429
      ? "AI rate limit reached. Please try again in a moment."
      : err instanceof ProviderError && err.status === 402
      ? "AI credits exhausted. Please add funds to continue."
      : err instanceof Error ? err.message : "Unknown error";

    return new Response(
      JSON.stringify({ error: message }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
