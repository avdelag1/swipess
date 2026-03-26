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

// ─── Provider Configuration ────────────────────────────────────────

<<<<<<< HEAD
// Native Google Gemini API — ordered by preference
// All use v1beta which is the most broadly supported endpoint
const GEMINI_MODELS = [
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash-001",
  "gemini-1.5-flash-002",
  "gemini-1.5-flash",
=======
// Native Google Gemini API Models (Ordered by priority)
const GEMINI_MODELS = [
  "gemini-2.0-flash-exp",   // Fastest, best reasoning
  "gemini-2.0-flash-lite",  // Cheap/fast
  "gemini-1.5-flash",       // Stable
>>>>>>> main
];

// Lovable Gateway (Secondary)
const LOVABLE_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const LOVABLE_MODEL = "google/gemini-1.5-flash";

// MiniMax (Fallback)
const MINIMAX_ENDPOINT = "https://api.minimaxi.chat/v1/chat/completions";
const MINIMAX_MODEL = "MiniMax-Text-01";

// ─── Provider Calls ───────────────────────────────────────────────

/**
 * Call Gemini Native API directly
 */
async function callGeminiDirect(messages: Message[], maxTokens: number): Promise<ProviderResult> {
  const key = Deno.env.get("GEMINI_API_KEY") || Deno.env.get("GOOGLE_API_KEY");
  if (!key) throw new Error("GEMINI_API_KEY not configured in Supabase Secrets");

  // SEVERE FIX: Standardize messages for Gemini API
  // Gemini is extremely strict about the 'contents' array structure.
  // It ONLY allows 'role' (user/model) and 'parts' [{ text: "..." }].
  // Any extra fields (like 'timestamp' from client) will trigger a 400 error.
  const systemMessages = messages.filter(m => m.role === "system");
  const conversationMessages = messages.filter(m => m.role !== "system");
  
  const contents = conversationMessages.map(m => {
    // Standardize role: Gemini uses 'model' instead of 'assistant'
    const role = (m.role === "assistant" || m.role === "model") ? "model" : "user";
    return {
      role,
      parts: [{ text: m.content }]
    };
  });

  const requestBody: Record<string, unknown> = {
    contents,
    generationConfig: { 
      maxOutputTokens: maxTokens, 
      temperature: 0.7,
      responseMimeType: "application/json" // Force JSON mode where supported
    },
  };

  if (systemMessages.length > 0) {
    requestBody.systemInstruction = {
      parts: [{ text: systemMessages.map(m => m.content).join("\n\n") }]
    };
  }

<<<<<<< HEAD
  // Try each model in order until one works (quota varies by model)
  const modelErrors: string[] = [];
=======
  let lastErr = "";
>>>>>>> main
  for (const model of GEMINI_MODELS) {
    // Use v1beta for all models — broadest support for systemInstruction
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
<<<<<<< HEAD
    console.log(`[AI Orchestrator] Trying Gemini model: ${model}`);

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });
    if (!res.ok) {
      const errorBody = await res.text();
      let detail = "";
      try { detail = JSON.parse(errorBody)?.error?.message?.slice(0, 80) || errorBody.slice(0, 80); } catch { detail = errorBody.slice(0, 80); }
      modelErrors.push(`${model}(${res.status}): ${detail}`);
      console.warn(`[AI Orchestrator] ${model} failed (${res.status}): ${detail}`);
=======
    console.log(`[AI Orchestrator] Connecting to ${model}...`);
    
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        const errorBody = await res.text();
        let detail = "";
        try { detail = JSON.parse(errorBody)?.error?.message || errorBody; } catch { detail = errorBody; }
        lastErr = `${model}(${res.status}): ${detail}`;
        console.warn(`[AI Orchestrator] ${model} warning:`, detail);
        
        // If it's a 404 (model not available in this region) or 429, try next model
        continue;
      }

      const data = await res.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      if (content) return { content, provider: `gemini-${model}` };
    } catch (e) {
      lastErr = String(e);
>>>>>>> main
      continue;
    }
  }
<<<<<<< HEAD
  throw new ProviderError(`Gemini all models failed — ${modelErrors.join(" | ")}`, 429);
=======
  throw new ProviderError(`Gemini providers exhausted. Last error: ${lastErr}`, 429);
>>>>>>> main
}

/**
 * Call Gemini via Lovable Gateway
 */
async function callLovable(messages: Message[], maxTokens: number): Promise<ProviderResult> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new Error("LOVABLE_API_KEY not configured");

  // Standardize roles for OpenAI-compatible gateway
  const openaiMessages = messages.map(m => ({
    role: m.role,
    content: m.content
  }));

  const res = await fetch(LOVABLE_GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: LOVABLE_MODEL,
      messages: openaiMessages,
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`Lovable Gateway Error (${res.status}):`, body);
    throw new ProviderError(`Gateway error (${res.status})`, res.status);
  }

  const data = await res.json();
  return { content: data.choices?.[0]?.message?.content || "", provider: "gemini-lovable" };
}

/**
 * Call MiniMax API (The ultimate fallback)
 */
async function callMinimax(messages: Message[], maxTokens: number): Promise<ProviderResult> {
  const key = Deno.env.get("MINIMAX_API_KEY");
  if (!key) throw new Error("MINIMAX_API_KEY not configured");

  const res = await fetch(MINIMAX_ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MINIMAX_MODEL,
      messages: messages.map(m => ({ role: m.role === "system" ? "system" : (m.role === "assistant" ? "assistant" : "user"), content: m.content })),
      temperature: 0.7,
      max_tokens: maxTokens,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`MiniMax Error (${res.status}):`, body);
    throw new ProviderError(`Fallback error (${res.status})`, res.status);
  }

  const data = await res.json();
  return { content: data.choices?.[0]?.message?.content || "", provider: "minimax" };
}

// ─── Types & Errors ─────────────────────────────────────────────

interface Message {
  role: "system" | "user" | "assistant" | "model";
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

// ─── Main AI Caller (Orchestration Logic) ────────────────────────

async function callAI(messages: Message[], maxTokens = 1500): Promise<ProviderResult> {
  const errors: string[] = [];

  // 1. Try Gemini Native (Preferred)
  const hasGeminiNative = !!(Deno.env.get("GEMINI_API_KEY") || Deno.env.get("GOOGLE_API_KEY"));
  if (hasGeminiNative) {
    try {
      return await callGeminiDirect(messages, maxTokens);
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
    }
  }

  // 2. Try Lovable Gateway (High Performance)
  const hasLovable = !!Deno.env.get("LOVABLE_API_KEY");
  if (hasLovable) {
    try {
      return await callLovable(messages, maxTokens);
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
    }
  }

  // 3. MiniMax Fallback (Reliable)
  if (!!Deno.env.get("MINIMAX_API_KEY")) {
    try {
      return await callMinimax(messages, maxTokens);
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
    }
  }

  throw new ProviderError(`AI service exhaustion: ${errors.join(" | ")}`, 503);
}

// ─── Robust JSON Parser ─────────────────────────────────────────

function parseJSON(content: string): Record<string, unknown> | null {
  try {
    // 1. Try direct parse
    return JSON.parse(content);
  } catch {
    try {
      // 2. Try extracting from Markdown blocks (```json ... ```)
      const markdownMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (markdownMatch) return JSON.parse(markdownMatch[1].trim());

      // 3. Try finding the first '{' and last '}'
      const braceMatch = content.match(/\{[\s\S]*\}/);
      if (braceMatch) return JSON.parse(braceMatch[ braceMatch.length - 1 ]);
    } catch { /* ignore */ }
  }
  return null;
}

// ─── Main Handler ────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Heartbeat check
    if (req.method === "GET") {
      return new Response(JSON.stringify({ status: "alive", providers: {
        gemini: !!(Deno.env.get("GEMINI_API_KEY") || Deno.env.get("GOOGLE_API_KEY")),
        lovable: !!Deno.env.get("LOVABLE_API_KEY"),
        minimax: !!Deno.env.get("MINIMAX_API_KEY")
      } }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const payload = await req.json();
    const task = payload.task || payload.type;
    const input = payload.data || payload;

    // Auth Validation
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "No authorization provided" }), { status: 401, headers: corsHeaders });

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseClient = createClient(supabaseUrl!, supabaseAnonKey!, { global: { headers: { Authorization: authHeader } } });
    
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) return new Response(JSON.stringify({ error: "Auth failed" }), { status: 401, headers: corsHeaders });

    let messages: Message[] = [];
    let maxTokens = 1000;

    // AI Task Selection
    if (task === "conversation") {
      const extracted = input.extractedData || {};
      messages = [
        { role: "system", content: `You are a sharp, elite guide for Swipess. Helping build a ${input.category || "listing"}. IMAGE COUNT: ${input.imageCount || 0}. 
        STRICT RULES: Respond ONLY with valid JSON. One short question at a time.
        FORMAT: { "message": "...", "extractedData": {}, "isComplete": boolean, "nextSteps": "..." }
        CONTEXT: ${JSON.stringify(extracted)}` },
        ...(input.messages as Message[] || [])
      ];
      maxTokens = 1500;
    } else if (task === "chat") {
      messages = [
        { role: "system", content: "You are the Swipess Oracle. Sharp, elite expert on Tulum real estate and services." },
        ...(input.messages as Message[] || [{ role: "user", content: input.query }])
      ];
      maxTokens = 2000;
    } else {
       // Fallback for listings, profiles, etc.
       messages = [{ role: "user", content: JSON.stringify(input) }];
    }

    const aiResponse = await callAI(messages, maxTokens);
    
    // Process response
    let finalResult: any;
    if (task === "chat") {
      finalResult = { text: aiResponse.content, message: aiResponse.content };
    } else {
      const parsed = parseJSON(aiResponse.content);
      finalResult = parsed || { text: aiResponse.content, error: "AI returned invalid format" };
    }

    return new Response(JSON.stringify({ result: finalResult, provider: aiResponse.provider }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("[AI Orchestrator] Critical Crash:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Internal Server Error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
