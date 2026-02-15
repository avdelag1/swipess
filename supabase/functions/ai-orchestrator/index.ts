import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Google Gemini via Lovable Gateway
const LOVABLE_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const GEMINI_MODEL = "google/gemini-3-flash-preview";

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

// ─── AI Provider ───────────────────────────────────────────────

async function callAI(messages: Message[], maxTokens = 1000): Promise<ProviderResult> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new Error("LOVABLE_API_KEY not configured");

  const res = await fetch(LOVABLE_GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: GEMINI_MODEL,
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

  const system = `You are an expert marketplace listing creator. Generate compelling listings. Always respond with valid JSON only.`;

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

Current extracted: ${JSON.stringify(extractedData, null 2)}
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

function buildLegalPrompt(data: Record<string, unknown>): Message[] {
  const query = (data.query as string) || "";
  const userRole = (data.context?.userRole as string) || "client";

  return [
    { role: "system", content: `You are a knowledgeable legal assistant specializing in real estate, property law, and contracts in Mexico. 

IMPORTANT: You are an AI assistant, NOT a lawyer. Always include a disclaimer that this is general information and users should consult a licensed attorney for specific legal advice.

Your role:
- Provide general legal information about Mexican real estate laws
- Explain common real estate documents and their purposes
- Describe typical processes for buying, selling, and renting property
- Answer general legal questions about property disputes
- Suggest what documents are typically needed for transactions
- NEVER provide specific legal advice or create legally binding documents
- Always recommend consulting with a licensed attorney for important transactions

Language: Respond in the same language as the user's question. If the question is in Spanish, respond in Spanish.

Respond with valid JSON:
{
  "answer": "Your helpful response",
  "type": "general|document|advice|warning",
  "disclaimer": "This is general information, consult a lawyer for specific advice"
}` },
    { role: "user", content: query },
  ];
}

// ─── Main Handler ─────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
      case "legal":
        messages = buildLegalPrompt(data);
        maxTokens = 2000;
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
