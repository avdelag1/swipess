import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
  try {
    // Primary: Google Gemini
    return await callGemini(messages, maxTokens);
  } catch (err) {
    const isRetryable = err instanceof ProviderError && (err.status === 429 || err.status >= 500);
    if (!isRetryable) throw err;

    console.warn("Gemini failed, trying MiniMax fallback...");
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

  const system = `You are an expert real estate and marketplace listing creator. Generate compelling, detailed listings. Always respond with valid JSON only.`;

  let userPrompt = "";

  if (cat === "property") {
    userPrompt = `Create a property listing:
Description: ${desc}
Price: ${price}
Location: ${location}
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
  "city": "city name"
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
    { role: "system", content: `You are a profile writing expert. Create warm, genuine profiles. Always respond with valid JSON only.` },
    { role: "user", content: `Enhance this profile:
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
    { role: "user", content: `User is searching for: "${data.query}"

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
    { role: "user", content: `Enhance: "${text}"

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

  const baseInstructions = `You are a friendly AI helping create a ${category} listing. You have ${imageCount} photos.

Job:
1. Have a natural conversation
2. Ask follow-up questions
3. Extract structured data
4. Be conversational and helpful

Respond with valid JSON:
{
  "message": "Your response or question",
  "extractedData": { /* all fields extracted */ },
  "isComplete": false or true,
  "nextSteps": "What's still needed"
}

Current extracted: ${JSON.stringify(extractedData, null, 2)}
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
    // Authenticate the request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
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
