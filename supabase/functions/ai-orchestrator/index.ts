import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const payload = await req.json().catch(() => ({}));
    // Accept messages from 'data' property or top level
    const rawMessages = payload.data?.messages || payload.messages || [];
    const minimaxKey = Deno.env.get("MINIMAX_API_KEY");

    if (!minimaxKey) throw new Error("MINIMAX_API_KEY is missing.");

    // Mapping messages correctly to MiniMax format
    const formattedMessages = rawMessages.map((m: any) => ({
      role: (m.role === "assistant" || m.role === "model") ? "assistant" : "user",
      content: m.content || m.text || ""
    })).filter((m: any) => m.content.trim() !== "");

    // Default system prompt
    const systemMessage = { 
      role: "system", 
      content: "You are the Swipess AI Concierge. You helping people find property and services in Tulum. Be short, professional, and sophisticated." 
    };

    const res = await fetch("https://api.minimax.io/v1/text/chatcompletion_v2", {
      method: "POST",
      headers: { "Authorization": `Bearer ${minimaxKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ 
        model: "abab6.5s-chat", // The gold standard for MiniMax v2
        messages: [systemMessage, ...formattedMessages],
        temperature: 0.1, // Lower temperature for more stable responses
      }),
    });

    const data = await res.json();
    
    // Support multiple MiniMax response formats
    const aiText = data.choices?.[0]?.message?.content || 
                   data.choices?.[0]?.text || 
                   data.reply || 
                   "";

    if (!aiText) {
        console.error("MiniMax Empty Response:", JSON.stringify(data));
        return new Response(JSON.stringify({ 
            result: { text: "I'm here, but I'm having trouble thinking of the right words. Try asking again!" } 
        }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({
      result: { text: aiText.trim() },
      status: "success"
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});
