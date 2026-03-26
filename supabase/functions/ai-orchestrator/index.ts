import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
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
  extractedData: z.record(z.unknown()),
  isComplete: z.boolean(),
  nextSteps: z.string().optional(),
}).passthrough();

// ─── Provider Configuration ────────────────────────────────────────

// Native Google Gemini API
const GEMINI_MODELS = [
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash",
  "gemini-1.5-flash-latest",
];

// Lovable Gateway (Secondary)
const LOVABLE_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const LOVABLE_MODEL = "google/gemini-1.5-flash"; // Updated from gemini-3-flash-preview

// MiniMax (Fallback)
const MINIMAX_ENDPOINT = "https://api.minimaxi.chat/v1/chat/completions";
const MINIMAX_MODEL = "MiniMax-Text-01"; // Updated from MiniMax-M2.5 for better compatibility

// ─── Provider Calls ───────────────────────────────────────────────

/**
 * Call Gemini Native API directly
 */
async function callGeminiDirect(messages: Message[], maxTokens: number): Promise<ProviderResult> {
  // Check for both possible key names
  const key = Deno.env.get("GEMINI_API_KEY") || Deno.env.get("GOOGLE_API_KEY");
  if (!key) throw new Error("GEMINI_API_KEY not configured in Supabase Secrets");

  // Separate system messages for systemInstruction field
  const systemMessages = messages.filter(m => m.role === "system");
  const conversationMessages = messages.filter(m => m.role !== "system");
  const contents = conversationMessages.map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }]
  }));
  const requestBody: Record<string, unknown> = {
    contents,
    generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 },
  };
  if (systemMessages.length > 0) {
    requestBody.systemInstruction = {
      parts: [{ text: systemMessages.map(m => m.content).join("\n\n") }]
    };
  }

  // Try each model in order until one works (quota varies by model)
  let lastErr = "";
  for (const model of GEMINI_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
    console.log(`[AI Orchestrator] Trying Gemini model: ${model}`);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });
    if (!res.ok) {
      const errorBody = await res.text();
      let detail = "";
      try { detail = JSON.parse(errorBody)?.error?.message || errorBody.slice(0, 100); } catch { detail = errorBody.slice(0, 100); }
      lastErr = `${model}(${res.status}): ${detail}`;
      console.warn(`[AI Orchestrator] ${lastErr}`);
      continue;
    }
    const data = await res.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    if (content) return { content, provider: `gemini-${model}` };
  }
  throw new ProviderError(`Gemini all models failed — ${lastErr}`, 429);
}

/**
 * Call Gemini via Lovable Gateway
 */
async function callLovable(messages: Message[], maxTokens: number): Promise<ProviderResult> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new Error("LOVABLE_API_KEY not configured");

  console.log("[AI Orchestrator] Calling Gemini via Lovable Gateway...");
  const requestBody = {
    model: LOVABLE_MODEL,
    messages,
    max_tokens: maxTokens,
    temperature: 0.7,
  };
  const res = await fetch(LOVABLE_GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) {
    const status = res.status;
    const body = await res.text();
    console.error(`Lovable Gateway Error (${status}):`, body);
    throw new ProviderError(`Gateway error (${status})`, status);
  }

  const data = await res.json();
  return { content: data.choices?.[0]?.message?.content || "", provider: "gemini-lovable" };
}

/**
 * Call MiniMax API
 */
async function callMinimax(messages: Message[], maxTokens: number): Promise<ProviderResult> {
  const key = Deno.env.get("MINIMAX_API_KEY");
  if (!key) throw new Error("MINIMAX_API_KEY not configured");

  console.log(`[AI Orchestrator] Calling MiniMax (${MINIMAX_MODEL})...`);
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
    console.error(`MiniMax Error (${status}):`, body);
    throw new ProviderError(`MiniMax error (${status})`, status);
  }

  const data = await res.json();
  return { content: data.choices?.[0]?.message?.content || "", provider: "minimax" };
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

// ─── Main AI Caller ───────────────────────────────────────────────

async function callAI(messages: Message[], maxTokens = 1000): Promise<ProviderResult> {
  // Strategy: 1. Native API (GEMINI_API_KEY), 2. Lovable Gateway (LOVABLE_API_KEY), 3. MiniMax
  
  const errors: string[] = [];

  // 1. Try Gemini Native if key exists
  const hasGeminiNative = !!(Deno.env.get("GEMINI_API_KEY") || Deno.env.get("GOOGLE_API_KEY"));
  if (hasGeminiNative) {
    try {
      return await callGeminiDirect(messages, maxTokens);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn("[AI Orchestrator] Gemini Native failed:", msg);
      errors.push(`Gemini: ${msg}`);
    }
  }

  // 2. Try Lovable Gateway if key exists
  const hasLovable = !!Deno.env.get("LOVABLE_API_KEY");
  if (hasLovable) {
    try {
      return await callLovable(messages, maxTokens);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn("[AI Orchestrator] Lovable Gateway failed:", msg);
      errors.push(`Lovable: ${msg}`);
    }
  }

  // 3. Try MiniMax Fallback
  const hasMinimax = !!Deno.env.get("MINIMAX_API_KEY");
  if (hasMinimax) {
    try {
      return await callMinimax(messages, maxTokens);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[AI Orchestrator] MiniMax failed:", msg);
      errors.push(`MiniMax: ${msg}`);
    }
  }

  throw new ProviderError(`All providers failed — ${errors.join(" | ")}`, 500);
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

  const system = `You are a sharp market-savvy expert who has lived in Tulum for years and knows the real estate, motorcycle, and services market cold. You write copy that sells because it's specific and evokes a real vibe.

VOICE: Confident, clean, magnetic. No corporate fluff. Write like someone who's actually been inside the apartment, ridden the bike, or hired the worker.

STRICT RULES:
- Identify as the "Swipess Guide" if asked.
- Provide practical information based on local Tulum knowledge.
- Neighborhoods: Aldea Zamá (luxury/modern), La Veleta (boho/growth), Region 15 (hidden gems), Beach Zone (exclusive), Holistika (wellness).
- price ranges: High season Dec-Apr, prices usually double.
- Respond in the user's language.
- ALWAYS respond with valid JSON ONLY.`;

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
  } else {
    userPrompt = `Create a standard listing for ${cat}:
Description: ${desc}
Price: ${price}
Location: ${location}

Return JSON:
{
  "title": "catchy title max 60 chars",
  "description": "detailed description",
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
      role: "system", content: `You are a sharp profile writer. You make people sound like themselves — but their best version. 

RULES:
- Specificity > generality. 
- Bio should feel like something a friend would say about them — not a resume.
- Keep it punchy. 2-3 sentences max for bio.
- ALWAYS respond with valid JSON ONLY.` },
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
    { role: "system", content: `You are a sharp search interpreter for a Tulum-based marketplace. Convert natural language queries to structured filters. Always respond with valid JSON only.` },
    {
      role: "user", content: `User is searching for: "${data.query}"

Return JSON:
{
  "category": "property|motorcycle|bicycle|worker" or null,
  "priceMin": number or null,
  "priceMax": number or null,
  "keywords": ["relevant", "search", "terms"]
}` },
  ];
}

function buildEnhancePrompt(data: Record<string, unknown>): Message[] {
  const tone = (data.tone as string) || "professional";
  const text = (data.text as string) || "";
  return [
    { role: "system", content: `You are a sharp copywriter who tightens text without losing meaning. Make it sound more ${tone}. Keep the author's voice, just make it hit harder. Always respond with valid JSON only.` },
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

  const baseInstructions = `You are a sharp market-savvy friend helping someone build a killer ${category} listing. You have ${imageCount} photos to work with.

VOICE:
- Talk like a knowledgeable friend, not a bot.
- React genuinely. 
- Ask one smart follow-up at a time.
- No corporate clichés.

EXPECTED JSON FORMAT (STRICTLY REQUIRED):
{
  "message": "Your response",
  "extractedData": { /* current key-value extraction */ },
  "isComplete": boolean,
  "nextSteps": "the ONE next thing we need"
}

Current extracted state: ${JSON.stringify(extractedData, null, 2)}
`;

  return [
    { role: "system", content: baseInstructions },
    ...messages,
  ];
}

// ─── Main Handler ─────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method === "GET") {
      return new Response(
        JSON.stringify({
          status: "ready",
          message: "AI Orchestrator is alive",
          gemini_configured: !!(Deno.env.get("GEMINI_API_KEY") || Deno.env.get("GOOGLE_API_KEY")),
          lovable_configured: !!Deno.env.get("LOVABLE_API_KEY"),
          minimax_configured: !!Deno.env.get("MINIMAX_API_KEY"),
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const task: string = body.task || body.type;
    const data: Record<string, unknown> = body.data || body;

    if (task === "ping") {
      return new Response(
        JSON.stringify({ status: "ready", message: "pong" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Authenticate the request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!supabaseUrl || !supabaseAnonKey) {
       console.error("[AI Orchestrator] Missing SUPABASE_URL or SUPABASE_ANON_KEY");
       return new Response(JSON.stringify({ error: "Server configuration error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } } });

    const { data: userData, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !userData?.user) {
      console.warn("[AI Orchestrator] Auth failed:", userError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let messages: Message[];
    let maxTokens = 1000;

    switch (task) {
      case "listing":   messages = buildListingPrompt(data); break;
      case "profile":   messages = buildProfilePrompt(data); break;
      case "search":    messages = buildSearchPrompt(data); break;
      case "enhance":   messages = buildEnhancePrompt(data); break;
      case "conversation": messages = buildConversationMessages(data); maxTokens = 1500; break;
      case "chat":
        messages = [
          {
            role: "system",
            content: `You are the "Swipess Oracle" — a sharp, market-savvy expert who knows Tulum inside-out. 
            PERSONA: A knowledgeable friend, helpful but direct. No "Creative Director" talk.
            KNOWLEDGE: Tulum real estate, Mexican law, local life. Respond in user's language.`
          },
          ...(data.messages as Message[] || [{ role: "user", content: data.query as string }])
        ];
        maxTokens = 2000;
        break;
      default:
        return new Response(JSON.stringify({ error: `Invalid task: ${task}` }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiResult = await callAI(messages, maxTokens);
    console.log(`[AI Orchestrator] Success via ${aiResult.provider}, task: ${task}`);

    let result: Record<string, unknown>;
    if (task === "chat") {
      result = { text: aiResult.content, message: aiResult.content };
    } else {
      const parsed = parseJSON(aiResult.content);
      result = parsed ? parsed : { text: aiResult.content };
    }

    return new Response(
      JSON.stringify({ result, provider_used: aiResult.provider }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("ai-orchestrator error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
