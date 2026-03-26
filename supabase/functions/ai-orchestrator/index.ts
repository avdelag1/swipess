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

// Native Google Gemini API — ordered by preference
const GEMINI_MODELS = [
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash",
];

// Lovable Gateway (Secondary)
const LOVABLE_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const LOVABLE_MODEL = "google/gemini-3-flash-preview";

// MiniMax (Fallback)
const MINIMAX_ENDPOINT = "https://api.minimaxi.chat/v1/chat/completions";
const MINIMAX_MODEL = "MiniMax-Text-01";

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

// ─── Provider Calls ───────────────────────────────────────────────

async function callGeminiDirect(messages: Message[], maxTokens: number): Promise<ProviderResult> {
  const key = Deno.env.get("GEMINI_API_KEY") || Deno.env.get("GOOGLE_API_KEY");
  if (!key) throw new Error("GEMINI_API_KEY not configured in Supabase Secrets");

  const systemMessages = messages.filter(m => m.role === "system");
  const conversationMessages = messages.filter(m => m.role !== "system");
  
  const contents = conversationMessages.map(m => ({
    role: (m.role === "assistant" || m.role === "model") ? "model" : "user",
    parts: [{ text: m.content }]
  }));

  const requestBody: Record<string, unknown> = {
    contents,
    generationConfig: { 
      maxOutputTokens: maxTokens, 
      temperature: 0.7,
      responseMimeType: "application/json"
    },
  };

  if (systemMessages.length > 0) {
    requestBody.systemInstruction = {
      parts: [{ text: systemMessages.map(m => m.content).join("\n\n") }]
    };
  }

  const modelErrors: string[] = [];
  for (const model of GEMINI_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
    console.log(`[AI Orchestrator] Trying Gemini model: ${model}`);

    try {
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
        continue;
      }

      const data = await res.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      if (content) return { content, provider: `gemini-${model}` };
    } catch (e) {
      modelErrors.push(`${model}: ${String(e)}`);
      continue;
    }
  }
  throw new ProviderError(`Gemini all models failed — ${modelErrors.join(" | ")}`, 429);
}

async function callLovable(messages: Message[], maxTokens: number): Promise<ProviderResult> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new Error("LOVABLE_API_KEY not configured");

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
    return JSON.parse(content);
  } catch {
    try {
      const markdownMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (markdownMatch) return JSON.parse(markdownMatch[1].trim());

      const braceMatch = content.match(/\{[\s\S]*\}/);
      if (braceMatch) return JSON.parse(braceMatch[0]);
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
       messages = [{ role: "user", content: JSON.stringify(input) }];
    }

    const aiResponse = await callAI(messages, maxTokens);
    
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
