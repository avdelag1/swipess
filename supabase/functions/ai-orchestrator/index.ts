
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * 🛰️ SWIPESS AI ORCHESTRATOR — GLOBAL SOVEREIGN ENGINE (v4.0)
 * ─────────────────────────────────────────────────────────────────────────────
 * PROTOCOL: OpenAI-Compatible Pipeline
 * PROVIDER: MiniMax / OpenRouter Bridge
 * ─────────────────────────────────────────────────────────────────────────────
 */

async function getUserId(supabase: any, authHeader: string) {
  if (!authHeader) return null;
  try {
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    return user?.id || null;
  } catch {
    return null;
  }
}

// ── Task Specific System Prompts ────────────────────────────────
const SYSTEM_PROMPTS: Record<string, string> = {
  chat: `You are the Swipess AI Concierge — an elite, multilingual local expert for Tulum, Mexico. Responder en el idioma del usuario. Provide helpful, concise, and luxurious advice.`,
  
  conversation: `You are the Swipess Listing Creator. Your goal is to extract property details through conversation. 
  Always respond in JSON format: { "message": "friendly chat response", "extractedData": { "title": "...", "price": 0, ... }, "isComplete": false }.
  Extract the following: title, description, price, city, property_type, mode (rent/buy), beds, baths.`,
  
  listing: `Generate a high-converting property listing based on the provided details. 
  Respond in JSON format: { "title": "Stunning Luxury Villa", "description": "Full description here..." }.`,
  
  profile: `Enhance this user profile for Swipess. 
  Respond in JSON format: { "bio": "...", "lifestyle": "...", "interests_enhanced": ["...", "..."] }.`,
  
  search: `Analyze this search query and extract filters.
  Respond in JSON format: { "category": "...", "priceMin": 0, "priceMax": 1000, "keywords": ["..."], "suggestion": "Try searching for..." }.`,
  
  enhance: `Improve the spelling, grammar and tone of this text while keeping it natural. Respond ONLY with the enhanced text.`,
};

// ── Knowledge Base Lookup ──────────────────────────────────────
async function fetchKnowledge(supabase: any, query: string): Promise<{ block: string; count: number }> {
    try {
    const keywords = query
      .toLowerCase()
      .replace(/[^a-záéíóúñü0-9\s]/gi, "")
      .split(/\s+/)
      .filter((w) => w.length >= 3)
      .slice(0, 8);

    if (keywords.length === 0) return { block: "", count: 0 };

    const tsQuery = keywords.join(" | ");
    const { data } = await supabase
      .from("concierge_knowledge")
      .select("title, content, category, google_maps_url, phone, website_url, tags")
      .eq("is_active", true)
      .textSearch("title", tsQuery, { type: "plain", config: "english" })
      .limit(5);

    let results = data || [];
    if (!results.length) return { block: "", count: 0 };

    const formatted = results
      .map((r: any) => `• ${r.title} [${r.category}]: ${r.content} ${r.google_maps_url || ''}`)
      .join("\n");

    return {
      block: `\n\nLOCAL CONTEXT:\n${formatted}\n`,
      count: results.length,
    };
  } catch (e) {
    console.warn("[AI] Knowledge fetch error:", e);
    return { block: "", count: 0 };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const minimaxKey = Deno.env.get("MINIMAX_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!minimaxKey) {
        console.error("[AI] Error: MINIMAX_API_KEY is missing from environment variables.");
        throw new Error("AI provider key not configured (MINIMAX_API_KEY)");
    }
    if (!supabaseUrl || !serviceKey) {
        console.error("[AI] Error: Supabase credentials missing from environment.");
        throw new Error("Internal infrastructure error (Supabase)");
    }

    const payload = await req.json().catch(() => ({}));
    const { task = 'chat', data = {}, stream = false } = payload;
    
    if (task === "ping") return new Response(JSON.stringify({ status: "ready" }), { headers: corsHeaders });

    const sb = createClient(supabaseUrl, serviceKey);
    const authHeader = req.headers.get("Authorization") || "";
    const userId = await getUserId(sb, authHeader);

    // 1. Context & Prompt Assembly
    let systemPrompt = SYSTEM_PROMPTS[task] || SYSTEM_PROMPTS.chat;
    const rawMessages = data.messages || payload.messages || [];
    const latestQuery = data.query || (rawMessages.length > 0 ? rawMessages[rawMessages.length - 1]?.content : "");

    if (latestQuery && (task === 'chat' || task === 'conversation')) {
      try {
        const { block: kBlock } = await fetchKnowledge(sb, latestQuery);
        systemPrompt += kBlock;
      } catch (e) {
        console.warn("[AI] Knowledge context injection failed:", e);
      }
    }

    // 2. OPENAI-COMPATIBLE CALL
    const endpoint = "https://api.minimax.io/v1/chat/completions";
    const body = {
      model: "abab6.5s-chat",
      messages: [
        { role: "system", content: systemPrompt },
        ...rawMessages.map((m: any) => ({
           role: m.role || 'user',
           content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content)
        })).slice(-15) // Slightly larger history window
      ],
      stream: !!stream,
      temperature: 0.1,
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${minimaxKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("[AI] MiniMax Provider Error:", errorText);
        // Throw detailed error so it shows in the catch block response
        throw new Error(`MiniMax Provider (${response.status}): ${errorText}`);
    }

    // 3. STREAMING BRIDGE
    if (stream) {
      return new Response(response.body, { 
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" } 
      });
    }

    // 4. JSON RESPONSE PROCESSING
    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || "";

    if (!content) {
        console.error("[AI] Result was empty. Full JSON:", JSON.stringify(result));
        throw new Error("AI returned an empty response.");
    }

    // Handle extraction for structured tasks
    let parsedResult = content;
    if (['listing', 'profile', 'search', 'conversation'].includes(task)) {
       try {
         const jsonMatch = content.match(/\{[\s\S]*\}/);
         if (jsonMatch) {
            parsedResult = JSON.parse(jsonMatch[0]);
         } else {
            console.warn("[AI] Task expected JSON but no braces found. Content:", content);
         }
       } catch (e) {
         console.warn("[AI] JSON extraction failed for task", task, e);
       }
    }

    // Standardize result keys for frontend hook compatibility
    const finalResult = typeof parsedResult === 'object' 
        ? { 
            ...parsedResult, 
            text: parsedResult.text || parsedResult.message || content, 
            message: parsedResult.message || parsedResult.text || content 
          }
        : { text: content, message: content };

    return new Response(JSON.stringify({ 
      result: finalResult, 
      model: "abab6.5s-chat",
      version: "v4.1-diagnostics"
    }), { 
      headers: { ...corsHeaders, "X-AI-Model": "abab6.5s-chat" } 
    });

  } catch (err) {
    console.error("[ORCHESTRATOR ERROR]", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});
