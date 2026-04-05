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

    // 🚀 Using official .io endpoint for International v2 (sk-cp keys)
    const minimaxUrl = "https://api.minimax.io/v1/text/chatcompletion_v2";
    const group_id = minimaxGroupId;
    
    console.log(`[AI Orchestrator] Triggering task: ${task || 'chat'} for model: MiniMax-M2.7`);

    const headers: Record<string, string> = {
      "Authorization": `Bearer ${minimaxKey}`,
      "Content-Type": "application/json",
      "x-group-id": group_id, // 🛡️ Ensure header-based routing for specific plan types
    };
    
    const body = { 
      model: "MiniMax-M2.7",
      group_id: group_id, // 🛡️ Also include in body for v2 parity
      messages: [{ role: "system", content: systemPrompt }, ...formattedMessages.slice(-10)],
      temperature: task === "conversation" ? 0 : 0.6,
      stream: task === "chat" || !task,
      max_tokens: 1024
    };

    const res = await fetch(minimaxUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
        const errorText = await res.text();
        console.error(`[AI Orchestrator] MiniMax error ${res.status}:`, errorText);
        throw new Error(`AI Engine HTTP error: ${res.status} - ${errorText}`);
    }

    // 🌊 STREAMING HANDLER: For Concierge Chat
    if (body.stream) {
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      const reader = res.body?.getReader();
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("Could not initialize stream reader");

      (async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const dataStr = line.slice(6).trim();
                if (dataStr === '[DONE]') continue;
                
                try {
                  const data = JSON.parse(dataStr);
                  const content = data.choices?.[0]?.delta?.content || "";
                  if (content) {
                    await writer.write(encoder.encode(content));
                  }
                } catch (e) {
                  // Skip invalid JSON lines (might be HEARTBEAT or partial chunks)
                }
              }
            }
          }
        } catch (e) {
          console.error("[AI Orchestrator] Streaming Error:", e);
        } finally {
          await writer.close();
        }
      })();

      return new Response(readable, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" }
      });
    }

    // 🧊 NON-STREAMING: For conversation/Listing Architect
    const aiRes = await res.json();
    if (aiRes.base_resp && aiRes.base_resp.status_code !== 0) {
      throw new Error(`AI API Error: ${aiRes.base_resp.status_msg || aiRes.base_resp.status_code}`);
    }

    const rawAiText = aiRes.choices?.[0]?.message?.content || "";
    let finalResult: any;

    if (task === "conversation") {
        try {
            const cleaned = rawAiText.trim().replace(/^```json/, '').replace(/```$/, '').trim();
            finalResult = JSON.parse(cleaned);
        } catch (e) {
            finalResult = { 
                message: "I'm having a technical glitch. Could you repeat that?",
                extractedData: data?.extractedData || {},
                isComplete: false
            };
        }
    } else {
        const actionMatch = rawAiText.match(/(\{\s*"action"\s*:[\s\S]*?\}\s*)$/m);
        const aiText = actionMatch ? rawAiText.substring(0, actionMatch.index).trim() : rawAiText.trim();
        let aiAction = null;
        if (actionMatch) {
            try {
                aiAction = JSON.parse(actionMatch[0])?.action;
            } catch (e) {}
        }
        finalResult = { text: aiText, action: aiAction };
    }

    return new Response(JSON.stringify({ result: finalResult, status: "success" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err: any) {
    console.error("Orchestrator Error:", err);
    return new Response(JSON.stringify({ error: err.message, status: "error" }), { 
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});

