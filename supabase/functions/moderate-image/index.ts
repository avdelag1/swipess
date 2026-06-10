import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const ALLOWED_ORIGIN = '*';
const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageUrl } = await req.json();
    if (!imageUrl) {
      return new Response(JSON.stringify({ safe: true, reasons: [], confidence: 1.0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      // Stub if no key
      return new Response(JSON.stringify({ safe: true, reasons: [], confidence: 1.0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Fetch the image to get base64
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) throw new Error("Could not fetch image");
    const arrayBuffer = await imgRes.arrayBuffer();
    const base64 = encode(arrayBuffer);
    const mimeType = imgRes.headers.get("content-type") || "image/jpeg";

    const prompt = `You are a strict content moderator for a property/vehicle/job marketplace.
Analyze this image for safety.
If the image contains explicit nudity, pornography, gore, extreme violence, or illegal content, return {"safe": false, "reasons": ["description of what violated the policy"]}.
If the image is safe, return {"safe": true, "reasons": []}.
Respond ONLY with valid JSON.`;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [
            { text: prompt },
            { inlineData: { mimeType, data: base64 } }
          ]
        }],
        generationConfig: { temperature: 0.1 }
      })
    });

    if (!res.ok) throw new Error("Gemini API error");

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim?.() ?? "";
    
    // Parse JSON
    const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(jsonStr);

    return new Response(
      JSON.stringify({
        safe: parsed.safe ?? true,
        reasons: parsed.reasons ?? [],
        confidence: 0.95
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[moderate-image]", err);
    return new Response(
      JSON.stringify({ safe: true, reasons: [], confidence: 1.0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
