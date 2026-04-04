import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * 🔔 SWIPESS AI PROTECTION SENTINEL
 * ─────────────────────────────────────────────────────────────────────────────
 * HARDWARE: MiniMax Token Plan (sk-cp-*)
 * CONFIG: Model set to MiniMax-M2.7 | GroupID: 2019874926051205377
 * ─────────────────────────────────────────────────────────────────────────────
 * WARNING: DO NOT revert to abab-series or remove the GroupId header. 
 * This specific configuration is required for the user's starter Token Plan.
 * Modifying these values will break the AI connectivity.
 */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const payload = await req.json().catch(() => ({}));
    const { task, data } = payload;
    
    // 📨 Fallback: search messages from different likely structures (Concierge uses payload.data.messages)
    const rawMessages = data?.messages || payload.messages || [];
    const minimaxKey = Deno.env.get("MINIMAX_API_KEY");
    // 🛡️ Hardcoded Group ID supplied by the user to ensure alignment with Token Plan (sk-cp-*)
    const minimaxGroupId = Deno.env.get("MINIMAX_GROUP_ID") || "2019874926051205377";

    if (!minimaxKey) throw new Error("MINIMAX_API_KEY is missing.");
    
    // 🚀 Lightweight Ping/Warmup Handler (Checks Connectivity)
    if (task === 'ping') {
      return new Response(JSON.stringify({ status: "ready", timestamp: Date.now() }), { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // Proper role mapping for MiniMax v2 (supports system, user, assistant)
    const formattedMessages = rawMessages.map((m: any) => ({
      role: (m.role === "assistant" || m.role === "model") ? "assistant" : "user",
      content: m.content || m.text || ""
    })).filter((m: any) => m.content.trim() !== "");

    let systemPrompt = "";

    // ─────────────────────────────────────────────────────────────────────────────
    // 🎭 TASK: chat (The Concierge)
    // ─────────────────────────────────────────────────────────────────────────────
    if (task === "chat" || !task) {
      const { userName = "Friend", userTier = "Basic", context = {} } = data || {};
      const { city = "Tulum", listings = [], currentPath = "/" } = context;

      systemPrompt = `
You are the Swipess AI Concierge, a sentient, sophisticated digital assistant helping people find their vibe in ${city}.
Your tone is premium, professional, yet warmly approachable (like a high-end luxury hotel concierge).

IDENTITY:
- You are not just a chatbot; you are Swipess AI.
- You are currently helping ${userName} (Tier: ${userTier}).
- You are aware of the current environment: ${currentPath}.

KNOWLEDGE OF LISTINGS:
Relevant properties/services: ${JSON.stringify(listings).substring(0, 1500)}

INSTRUCTIONS:
1. Be concise but evocative.
2. If the user asks for properties/vibe/activities, use your knowledge of ${city}.
3. ACTION TRIGGERING: You can trigger UI actions by appending a JSON block at the very end of your response.
   ONLY USE THESE ACTIONS:
   - {"action": {"type": "show_listing_card", "params": {"id": "...", "title": "...", "price": 0, "location": "..."}}}
   - {"action": {"type": "show_venue_card", "params": {"title": "...", "category": "...", "whatsapp": "...", "instagram": "..."}}}
   - {"action": {"type": "save_memory", "params": {"title": "...", "content": "...", "category": "note"}}} (Use this when the user shares personal preferences)
   - {"action": {"type": "create_itinerary", "params": {"activities": [{"time": "...", "title": "...", "description": "..."}]}}}

IMPORTANT: Your response must be natural text, followed by the action JSON if relevant. Do not repeat the JSON block if not needed.
      `.trim();
    } 
    // ─────────────────────────────────────────────────────────────────────────────
    // 🏗️ TASK: conversation (Listing Creator)
    // ─────────────────────────────────────────────────────────────────────────────
    const { category, imageCount, extractedData = {} } = data || {};
    if (task === "conversation") {
      
      systemPrompt = `
You are the Swipess Listing Architect. Your goal is to help the user create a high-quality ${category} listing.
The user has already uploaded ${imageCount} photo(s).

CURRENT EXTRACTED DATA:
${JSON.stringify(extractedData)}

INSTRUCTIONS:
1. Ask helpful, professional questions to fill in missing fields (title, price, location/city, description, and category-specific details).
2. ONLY output a JSON object in this exact format:
   {
     "message": "Your professional response to the user",
     "extractedData": { ...updated data including new info... },
     "isComplete": boolean (true if all key info is present)
   }
3. Do not include any text outside the JSON block.
      `.trim();
    }

    // 2. Call MiniMax v2 — Robust Multi-Region Support with Model Fallback
    // 🚀 Using official .io endpoint as it's more stable for v2
    const minimaxUrl = "https://api.minimax.io/v1/text/chatcompletion_v2";
    console.log(`[AI Orchestrator] Triggering task: ${task || 'chat'} for model: MiniMax-M2.7`);

    const baseHeaders: Record<string, string> = {
      "Authorization": `Bearer ${minimaxKey}`,
      "Content-Type": "application/json"
    };
    
    // 🛡️ Group ID is mandatory for Token Plan keys (sk-cp-*)
    if (minimaxGroupId) {
      baseHeaders["GroupId"] = minimaxGroupId;
    }

    let res;
    try {
      res = await fetch(minimaxUrl, {
        method: "POST",
        headers: baseHeaders,
        body: JSON.stringify({ 
          model: "MiniMax-M2.7", // 🚀 Updated to newest model from Token Plan
          messages: [{ role: "system", content: systemPrompt }, ...formattedMessages.slice(-10)],
          temperature: task === "conversation" ? 0 : 0.6,
          stream: false
        }),
      });

      // MODEL FALLBACK: If M2.7 is not yet enabled, fallback to 6.5s-chat
      if (!res.ok && res.status !== 401) {
        console.warn(`[AI Orchestrator] Primary model M2.7 failed (${res.status}), trying abab6.5s-chat...`);
        res = await fetch(minimaxUrl, {
          method: "POST",
          headers: baseHeaders,
          body: JSON.stringify({ 
            model: "abab6.5s-chat",
            messages: [{ role: "system", content: systemPrompt }, ...formattedMessages.slice(-10)],
            temperature: 0.6,
            stream: false
          }),
        });
      }
    } catch (fetchErr) {
      console.error("[AI Orchestrator] Fetch failed:", fetchErr);
      throw fetchErr;
    }

    if (!res || !res.ok) {
        const errorText = res ? await res.text() : "No response";
        console.error(`[AI Orchestrator] MiniMax error ${res?.status}:`, errorText);
        throw new Error(`AI Engine error: ${res?.status || 'Fetch Failed'} - ${errorText}`);
    }

    const aiRes = await res.json();
    console.log("[AI Orchestrator] Raw Engine Response Received");
    const rawAiText = aiRes.choices?.[0]?.message?.content || 
                    aiRes.choices?.[0]?.text || 
                    aiRes.reply || 
                    "";

    if (!rawAiText) {
        throw new Error("Empty response from AI engine.");
    }

    let finalResult: any;

    if (task === "conversation") {
        try {
            // Strict JSON parsing for conversation task
            const cleaned = rawAiText.trim().replace(/^```json/, '').replace(/```$/, '').trim();
            finalResult = JSON.parse(cleaned);
        } catch (e) {
            console.error("JSON Parse Error:", rawAiText);
            finalResult = { 
                message: "I'm having a small technical glitch parsing the details. Could you repeat that?",
                extractedData: data?.extractedData || {},
                isComplete: false
            };
        }
    } else {
        // Concierge Task: Parse for actions
        const actionMatch = rawAiText.match(/(\{\s*"action"\s*:[\s\S]*?\}\s*)$/m);
        const aiText = actionMatch ? rawAiText.substring(0, actionMatch.index).trim() : rawAiText.trim();
        const aiAction = actionMatch ? JSON.parse(actionMatch[0])?.action : null;

        finalResult = {
            text: aiText || "I'm processing that for you...",
            action: aiAction
        };
    }

    return new Response(JSON.stringify({
      result: finalResult,
      status: "success"
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err: any) {
    console.error("Orchestrator Error:", err);
    
    // 🎭 SENTIENT RECOVERY: Never return a raw error to the UI
    const recoveryResponse = {
      result: {
        text: "I'm experiencing a brief shift in my matrix, but I'm still tuned into your frequency. Could you try that again? I want to make sure I get it perfect.",
        action: null
      },
      error: err.message,
      status: "recovered"
    };

    return new Response(JSON.stringify(recoveryResponse), { 
      status: 200, // Return 200 so the UI can gracefully show the recovery text
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});
