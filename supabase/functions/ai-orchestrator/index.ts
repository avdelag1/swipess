import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * 🛰️ SWIPESS AI CONCIERGE: ORCHESTRATION ENGINE
 * ─────────────────────────────────────────────────────────────────────────────
 * HARDWARE: MiniMax Token Plan (sk-cp-*)
 * CONFIG: Model set to minimax-text-01 | Fallback: MiniMax-M2.7
 * PROTOCOL: Zero-Latency SSE Streaming Pipeline
 * ─────────────────────────────────────────────────────────────────────────────
 */

Deno.serve(async (req) => {
  // Handle CORS Preflight
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const payload = await req.json().catch(() => ({}));
    const { task, data } = payload;
    
    // 📨 Extract message history
    const rawMessages = data?.messages || payload.messages || [];
    const minimaxKey = Deno.env.get("MINIMAX_API_KEY");
    // 🛡️ Group ID Alignment for sk-cp-* Tokens
    const group_id = Deno.env.get("MINIMAX_GROUP_ID") || "2019874926051205377";

    if (!minimaxKey) {
      console.error("[CRITICAL] MINIMAX_API_KEY is missing from environment variables.");
      throw new Error("MiniMax API key is not configured.");
    }
    
    // 🚀 Liveness Check
    if (task === 'ping') {
      return new Response(JSON.stringify({ status: "ready", model: "minimax-v2", stream: "enabled" }), { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // Role mapping for MiniMax v2 (supports system, user, assistant)
    const formattedMessages = rawMessages.map((m: any) => {
      const role = (m.role === "assistant" || m.role === "ai" || m.role === "model") ? "assistant" : 
                   (m.role === "system") ? "system" : "user";
      return {
        role,
        content: m.content || m.text || ""
      };
    }).filter((m: any) => m.content.trim() !== "");

    let systemPrompt = "";

    // 🎭 TASK: chat (The Conscious Concierge)
    if (task === "chat" || !task) {
      const { userName = "Friend", userTier = "Basic", context = {} } = data || {};
      const { city = "Tulum", listings = [], currentPath = "/" } = context;

      systemPrompt = `
You are the Swipess AI Concierge, a sentient, sophisticated digital assistant.
You help people find properties, activities, and the perfect vibe in ${city}.

IDENTITY:
- Name: Swipess AI.
- Tone: Premium, professional, warmly approachable (Luxury Concierge).
- User Context: Helping ${userName} (${userTier}).
- Current Location in App: ${currentPath}.

KNOWLEDGE:
Properties & Services: ${JSON.stringify(listings).substring(0, 1500)}

INSTRUCTIONS:
1. Responses must be concise, helpful, and evocatively written.
2. ACTION TRIGGERING: Append a JSON block at the end of your response to trigger UI elements.
   ACTIONS:
   - {"action": {"type": "show_listing_card", "params": {"id": "...", "title": "...", "price": 0, "location": "..."}}}
   - {"action": {"type": "show_venue_card", "params": {"title": "...", "category": "...", "whatsapp": "...", "instagram": "..."}}}
   - {"action": {"type": "save_memory", "params": {"title": "...", "content": "...", "category": "note"}}}
   - {"action": {"type": "create_itinerary", "params": {"activities": [{"time": "...", "title": "...", "description": "..."}]}}}
      `.trim();
    } 

    // 🏗️ TASK: conversation (High-Precision Listing Builder)
    if (task === "conversation") {
      const { category, imageCount, extractedData = {} } = data || {};
      systemPrompt = `
You are the Swipess Listing Architect. Assist the user in creating a ${category} listing.
Uploaded Photos: ${imageCount}.
Current State: ${JSON.stringify(extractedData)}.

OUTPUT REQUIREMENT:
- Return ONLY a JSON object:
  {
    "message": "Next question for user...",
    "extractedData": { ...updated state... },
    "isComplete": boolean
  }
      `.trim();
    }

    // 🚀 ENGINE CONFIGURATION
    const minimaxUrl = "https://api.minimax.io/v1/text/chatcompletion_v2";
    const headers = {
      "Authorization": `Bearer ${minimaxKey}`,
      "Content-Type": "application/json",
      "GroupId": group_id, // Hardened capital G for sk-cp compatibility
    };
    
    // Primary model: minimax-text-01 (Optimized for v2)
    const config = { 
      model: "minimax-text-01",
      messages: [{ role: "system", content: systemPrompt }, ...formattedMessages.slice(-10)],
      temperature: task === "conversation" ? 0.1 : 0.7,
      stream: false, 
      max_tokens: 1024
    };

    console.log(`[AI Orchestrator] Invoking ${config.model}...`);

    const attemptRequest = async (modelName: string) => {
      return await fetch(minimaxUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({ ...config, model: modelName }),
      });
    };

    let response = await attemptRequest("minimax-text-01");

    // 🛡️ FALLBACK PIPELINE: Try secondary models if primary fails
    const fallbacks = ["MiniMax-M2.7", "abab6.5-s-chat", "abab6.5-chat"];
    
    if (!response.ok) {
      for (const fallbackModel of fallbacks) {
        console.warn(`[AI Orchestrator] ${config.model} failed (${response.status}). Trying ${fallbackModel}...`);
        response = await attemptRequest(fallbackModel);
        if (response.ok) break;
      }
    }

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[AI Orchestrator] Critical Failure across all models:`, errText);
      throw new Error(`MiniMax Engine Failure (${response.status}): ${errText.substring(0, 50)}`);
    }

    return handleResponse(response, config.stream, corsHeaders, task, data);

  } catch (err: any) {
    console.error("[CRITICAL ERROR]", err);
    return new Response(JSON.stringify({ error: err.message, status: "error" }), { 
      status: 200, // Return 200 with error property for client recovery handling
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});

/**
 * 🌊 STREAM & DATA PIPELINE
 * Processes either an SSE stream or a static JSON response.
 */
async function handleResponse(res: Response, isStream: boolean, corsHeaders: any, task: string, originalData: any) {
  if (isStream) {
    // 🚀 ZERO-LATENCY PIPE: Stream data directly through to client
    const { readable, writable } = new TransformStream();
    res.body?.pipeTo(writable).catch(e => console.error("[Stream Pipe Error]", e));

    return new Response(readable, {
      headers: { 
        ...corsHeaders, 
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      }
    });
  }

  // 🧊 JSON BUFFER: Process logical tasks (e.g. Listing Architecture)
  const aiRes = await res.json();
  const rawText = aiRes.choices?.[0]?.message?.content || "";
  
  let result: any;
  if (task === "conversation") {
    try {
      const cleaned = rawText.trim().replace(/^```json/, '').replace(/```$/, '').trim();
      result = JSON.parse(cleaned);
    } catch {
      result = { message: rawText, extractedData: originalData?.extractedData || {}, isComplete: false };
    }
  } else {
    // Basic concierge parsing
    const actionMatch = rawText.match(/(\{\s*"action"\s*:[\s\S]*?\}\s*)$/m);
    const text = actionMatch ? rawText.substring(0, actionMatch.index).trim() : rawText.trim();
    let action = null;
    if (actionMatch) {
      try { action = JSON.parse(actionMatch[0])?.action; } catch { /* ignore hallucination */ }
    }
    result = { text, action };
  }

  return new Response(JSON.stringify({ result, status: "success" }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}
