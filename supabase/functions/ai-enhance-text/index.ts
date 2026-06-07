import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') || 'https://swipess.com';
const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY") || "";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not configured.");
    }

    const { text, type = 'profile' } = await req.json();

    if (!text || text.trim().length === 0) {
      throw new Error("No text provided.");
    }

    const systemPrompt = type === 'profile' 
      ? "You are an expert profile optimizer for Swipess. The user has provided a draft profile description (often dictated via voice and messy). Rewrite it to be clear, professional, engaging, and easy to read. Do not invent new facts. Keep it concise. Return ONLY the polished text without any conversational filler."
      : "You are an expert real estate and service listing copywriter for Swipess. The user has provided a draft description (often dictated via voice and messy). Rewrite it to be clear, professional, highly appealing, and structured. Do not invent facts, but make it sound premium. Return ONLY the polished text without any conversational filler.";

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text }
        ],
        temperature: 0.5,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Groq Chat API Error:", err);
      throw new Error("Enhancement failed: " + err);
    }

    const data = await response.json();
    const polishedText = data.choices[0]?.message?.content || text;

    return new Response(
      JSON.stringify({ text: polishedText.trim() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("AI Enhance error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
