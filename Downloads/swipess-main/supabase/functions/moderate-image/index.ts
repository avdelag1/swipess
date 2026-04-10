import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { imageUrl } = await req.json();
    if (!imageUrl) throw new Error("imageUrl is required");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a content moderation AI. Analyze the image and return a JSON verdict.
Check for:
1. Nudity or sexually explicit content
2. Text overlays containing phone numbers, emails, social media handles, or URLs
3. Offensive or violent content

Return ONLY valid JSON: {"safe": true/false, "reasons": ["reason1"], "confidence": 0.0-1.0}`
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this image for content moderation:" },
              { type: "image_url", image_url: { url: imageUrl } }
            ]
          }
        ],
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      // On AI error, default to safe (don't block uploads due to AI failures)
      return new Response(JSON.stringify({ safe: true, reasons: [], confidence: 0, error: "moderation_unavailable" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse the AI response — use outermost braces to handle nested JSON correctly
    try {
      const firstBrace = content.indexOf('{');
      const lastBrace = content.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        const verdict = JSON.parse(content.slice(firstBrace, lastBrace + 1));
        return new Response(JSON.stringify(verdict), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } catch {
      console.error("Failed to parse AI verdict:", content);
    }

    // Default safe if parsing fails
    return new Response(JSON.stringify({ safe: true, reasons: [], confidence: 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("moderate-image error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
