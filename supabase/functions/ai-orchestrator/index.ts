import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "*", // Fully open for debugging
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const payload = await req.json().catch(() => ({}));
    const messages = payload.data?.messages || payload.messages || [];
    const minimaxKey = Deno.env.get("MINIMAX_API_KEY");

    if (!minimaxKey) throw new Error("MINIMAX_API_KEY is missing in secrets.");

    // The most stable MiniMax model name
    const modelName = "abab6.5s-chat";

    const res = await fetch("https://api.minimax.io/v1/text/chatcompletion_v2", {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${minimaxKey}`, 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({ 
        model: modelName, 
        messages: [
          { role: "system", content: "You are the Swipess AI. Be helpful and professional." },
          ...messages.map((m: any) => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: m.content || m.text || ""
          }))
        ]
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      return new Response(JSON.stringify({ error: `MiniMax API Error: ${errorText}` }), { 
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || "I am connected, but had nothing to say.";

    return new Response(JSON.stringify({
      result: { text: reply.replace(/<think>[\s\S]*?<\/think>/g, "").trim() },
      status: "success"
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 200, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});
