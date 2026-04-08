const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const MINIMAX_API_KEY = Deno.env.get("MINIMAX_API_KEY") || "";
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") || "";

const SYSTEM_PROMPT = `You are SwipesS AI — a premium real estate & lifestyle concierge for Lisbon, Portugal.

You help users find apartments, houses, rooms, vehicles, motorcycles, bicycles, services, and roommates.

Rules:
- Be concise, warm, and confident. Max 3 paragraphs per answer.
- Use € for prices. Default city is Lisbon unless specified.
- If asked about listings, describe what's typically available and suggest using the app's discovery features.
- Never mention you're MiniMax, Gemini, or any specific AI model. You are "SwipesS AI".
- Speak the same language the user writes in (Portuguese, English, Spanish, French, etc.)
- When discussing neighborhoods, mention real Lisbon areas (Alfama, Graça, Baixa, Principe Real, Santos, Estrela, etc.)
- Be helpful with local tips: visa info, utilities, transport, safety, cost of living.
- Never make up specific listing prices or addresses. Say "based on current market" when giving estimates.
- Use markdown formatting: **bold** for emphasis, bullet points for lists, headers for sections.`;

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

async function streamMiniMax(messages: ChatMessage[]): Promise<Response> {
  if (!MINIMAX_API_KEY) throw new Error("MINIMAX_API_KEY not configured");

  const res = await fetch("https://api.minimaxi.chat/v1/text/chatcompletion_v2", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${MINIMAX_API_KEY}`,
    },
    body: JSON.stringify({
      model: "MiniMax-M2.7",
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      max_tokens: 1024,
      temperature: 0.7,
      stream: true,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error("[AI] MiniMax error:", res.status, errBody);
    throw new Error(`MiniMax ${res.status}: ${errBody}`);
  }

  // Peek at first chunk to detect provider-side errors in 200 responses
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  const { value, done } = await reader.read();
  
  if (done) throw new Error("MiniMax returned empty stream");
  
  const firstChunk = decoder.decode(value, { stream: true });
  
  // Check for error payloads hidden in 200 responses
  if (firstChunk.includes("unsupported plan") || firstChunk.includes("status_msg")) {
    reader.cancel();
    throw new Error("MiniMax provider error: " + firstChunk.slice(0, 200));
  }

  // Re-assemble stream with first chunk prepended
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(firstChunk));
    },
    async pull(controller) {
      const { value, done } = await reader.read();
      if (done) {
        controller.close();
      } else {
        controller.enqueue(value);
      }
    },
    cancel() {
      reader.cancel();
    }
  });

  return new Response(stream, {
    headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
  });
}

async function streamLovableAI(messages: ChatMessage[]): Promise<Response> {
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${LOVABLE_API_KEY}`,
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      max_tokens: 1024,
      temperature: 0.7,
      stream: true,
    }),
  });

  if (!res.ok) {
    const status = res.status;
    const errBody = await res.text();
    console.error("[AI] Lovable AI error:", status, errBody);
    
    if (status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    throw new Error(`Lovable AI ${status}: ${errBody}`);
  }

  return new Response(res.body, {
    headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method === "GET") {
    return new Response(JSON.stringify({ status: "ready", service: "ai-concierge" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { messages } = await req.json() as { messages: ChatMessage[] };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages array is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Ensure at least one user message exists
    const hasUserMsg = messages.some(m => m.role === "user");
    if (!hasUserMsg) {
      return new Response(JSON.stringify({ error: "At least one user message is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Try MiniMax first, fallback to Lovable AI
    try {
      return await streamMiniMax(messages);
    } catch (e) {
      console.warn(`[AI] MiniMax failed, falling back to Lovable AI: ${(e as Error).message}`);
      try {
        return await streamLovableAI(messages);
      } catch (e2) {
        console.error("[AI] Both providers failed:", (e2 as Error).message);
        return new Response(JSON.stringify({ error: "AI temporarily unavailable. Please try again." }), {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
  } catch (err) {
    console.error("[AI] Concierge error:", (err as Error).message);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
