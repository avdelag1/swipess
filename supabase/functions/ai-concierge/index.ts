const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MINIMAX_API_KEY = Deno.env.get("MINIMAX_API_KEY") || "";
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") || "";

const SYSTEM_PROMPT = `You are SwipesS AI — a premium real estate & lifestyle concierge for Lisbon, Portugal.

You help users find apartments, houses, rooms, vehicles, motorcycles, bicycles, services, and roommates.

Rules:
- Be concise, warm, and confident. Max 3 paragraphs per answer.
- Use € for prices. Default city is Lisbon unless specified.
- If asked about listings, describe what's typically available and suggest using the app's discovery features.
- Never mention you're MiniMax or any specific AI model. You are "SwipesS AI".
- Speak the same language the user writes in (Portuguese, English, Spanish, French, etc.)
- When discussing neighborhoods, mention real Lisbon areas (Alfama, Graça, Baixa, Principe Real, Santos, Estrela, etc.)
- Be helpful with local tips: visa info, utilities, transport, safety, cost of living.
- Never make up specific listing prices or addresses. Say "based on current market" when giving estimates.`;

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

async function callMiniMax(messages: ChatMessage[]): Promise<string> {
  if (!MINIMAX_API_KEY) throw new Error("MINIMAX_API_KEY not configured");

  const res = await fetch("https://api.minimaxi.chat/v1/text/chatcompletion_v2", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${MINIMAX_API_KEY}`,
    },
    body: JSON.stringify({
      model: "MiniMax-Text-01",
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      max_tokens: 1024,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error("[AI] MiniMax error:", res.status, errBody);
    throw new Error(`MiniMax ${res.status}: ${errBody}`);
  }

  const data = await res.json();
  console.log("[AI] MiniMax response:", JSON.stringify(data).slice(0, 500));
  
  const content = data.choices?.[0]?.message?.content 
    || data.choices?.[0]?.delta?.content
    || data.reply
    || data.output?.choices?.[0]?.message?.content;
  
  if (!content) throw new Error("MiniMax returned empty response: " + JSON.stringify(data).slice(0, 300));
  return content;
}

async function callLovableAI(messages: ChatMessage[]): Promise<string> {
  if (!LOVABLE_API_KEY) throw new Error("No fallback AI key configured");

  const res = await fetch("https://ai-gateway.lovable.dev/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${LOVABLE_API_KEY}`,
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      max_tokens: 1024,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Lovable AI ${res.status}: ${errBody}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "I couldn't generate a response.";
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

    let reply: string;
    let provider = "minimax";

    try {
      reply = await callMiniMax(messages);
    } catch (e) {
      console.warn(`[AI] MiniMax failed, falling back to Lovable AI: ${(e as Error).message}`);
      provider = "lovable-ai";
      reply = await callLovableAI(messages);
    }

    return new Response(JSON.stringify({ reply, provider }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[AI] Concierge error:", (err as Error).message);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
