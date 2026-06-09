// AI Listing Extractor — non-streaming, returns structured JSON via prompt
// Used by AIListingWizard for the "extract" and "refine" tasks.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') || 'https://swipess.com';
const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Body {
  task?: "extract" | "refine";
  category?: string;
  price?: string | number;
  city?: string;
  prompt?: string;
}

function json(status: number, payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // AUTH CHECK: Require valid JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json(401, { error: "Unauthorized" });
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) return json(500, { error: "GEMINI_API_KEY not configured" });

    const body = (await req.json().catch(() => ({}))) as Body;
    const task = body.task ?? "extract";
    const prompt = (body.prompt || "").trim();
    if (!prompt) return json(400, { error: "Missing prompt" });

    async function callGemini(messages: { role: string; content: string }[]) {
      const systemMessages = messages.filter(m => m.role === "system");
      const nonSystemMessages = messages.filter(m => m.role !== "system");
      const contents = nonSystemMessages.map(m => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));
      const body: Record<string, unknown> = { contents, generationConfig: { temperature: 0.3 } };
      if (systemMessages.length > 0) {
        body.systemInstruction = { parts: systemMessages.map(m => ({ text: m.content })) };
      }
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const t = await res.text();
        console.error("[ai-listing-extract] gemini error", res.status, t);
        if (res.status === 429) throw new Error("Rate limit");
        throw new Error(`Gemini ${res.status}: ${t}`);
      }
      const data = await res.json();
      return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim?.() ?? "";
    }

    if (task === "refine") {
      const text = await callGemini([
        {
          role: "system",
          content:
            "You are an elite listing copywriter for Swipess. Rewrite the user's raw spoken input into a sharp, professional, high-converting listing description. Keep it concise (2-4 sentences), confident, and factual. Do not invent details. Do not add placeholders. Return ONLY the rewritten description, no preamble.",
        },
        { role: "user", content: prompt },
      ]);
      return json(200, { text: text || prompt });
    }

    // task === "extract"
    const category = body.category || "property";
    const sys = `You parse natural-language listing intel into structured JSON for a Swipess marketplace listing.
Category is "${category}". Use the provided base data when present.
Base price: ${body.price ?? "(unknown)"}
Base city: ${body.city ?? "(unknown)"}
Be faithful to the user's words. Do not invent specifics that were not stated.

Return ONLY valid JSON matching this schema, no markdown:
{
  "title": "Short catchy title (<= 70 chars)",
  "description": "Polished listing description (2-5 sentences)",
  "price": number,
  "city": "string",
  "beds": number | null,
  "baths": number | null,
  "year": number | null,
  "make": "string | null",
  "model": "string | null",
  "amenities": string[]
}`;

    const result = await callGemini([
      { role: "system", content: sys },
      { role: "user", content: prompt },
    ]);

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(result);
    } catch {
      console.error("[ai-listing-extract] failed to parse gemini JSON:", result);
      return json(500, { error: "Extract failed" });
    }

    // Merge fallbacks
    if (!parsed.price && body.price) parsed.price = Number(body.price) || 0;
    if (!parsed.city && body.city) parsed.city = body.city;

    return json(200, { data: parsed });
  } catch (err) {
    console.error("[ai-listing-extract] unexpected error", err);
    return json(500, { error: err instanceof Error ? err.message : "Unknown error" });
  }
});