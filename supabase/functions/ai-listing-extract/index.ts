// AI Listing Extractor — non-streaming, returns structured JSON via tool calling
// Used by AIListingWizard for the "extract" and "refine" tasks.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";

interface Body {
  task?: "extract" | "refine";
  category?: string;
  price?: string | number;
  city?: string;
  prompt?: string;
  images?: string[];
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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json(500, { error: "LOVABLE_API_KEY not configured" });

    const body = (await req.json().catch(() => ({}))) as Body;
    const task = body.task ?? "extract";
    const prompt = (body.prompt || "").trim();
    if (!prompt) return json(400, { error: "Missing prompt" });

    if (task === "refine") {
      const resp = await fetch(GATEWAY_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            {
              role: "system",
              content:
                "You are an elite listing copywriter for Swipess. Rewrite the user's raw spoken input into a sharp, professional, high-converting listing description. Keep it concise (2-4 sentences), confident, and factual. Do not invent details. Do not add placeholders. Return ONLY the rewritten description, no preamble.",
            },
            { role: "user", content: prompt },
          ],
        }),
      });

      if (!resp.ok) {
        if (resp.status === 429) return json(429, { error: "Rate limit. Try again shortly." });
        if (resp.status === 402) return json(402, { error: "AI credits exhausted." });
        const t = await resp.text();
        console.error("[ai-listing-extract] refine gateway error", resp.status, t);
        return json(500, { error: "Refine failed" });
      }
      const data = await resp.json();
      const text: string = data?.choices?.[0]?.message?.content?.trim?.() ?? prompt;
      return json(200, { text });
    }

    // task === "extract"
    const category = body.category || "property";
    const sys = `You parse natural-language listing intel into structured JSON for a Swipess marketplace listing.
Category is "${category}". Use the provided base data when present.
Base price: ${body.price ?? "(unknown)"}
Base city: ${body.city ?? "(unknown)"}
Be faithful to the user's words. Do not invent specifics that were not stated.`;

    const tool = {
      type: "function" as const,
      function: {
        name: "build_listing",
        description: "Return structured listing fields parsed from the user narrative.",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string", description: "Short catchy title (<= 70 chars)" },
            description: { type: "string", description: "Polished listing description (2-5 sentences)" },
            price: { type: "number", description: "Listing price in USD" },
            city: { type: "string", description: "City detected from input" },
            beds: { type: "number" },
            baths: { type: "number" },
            year: { type: "number" },
            make: { type: "string" },
            model: { type: "string" },
            amenities: { type: "array", items: { type: "string" } },
          },
          required: ["title", "description", "price", "city"],
          additionalProperties: false,
        },
      },
    };

    const resp = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: sys },
          { 
            role: "user", 
            content: [
              { type: "text", text: prompt },
              ...(body.images || []).map(url => ({
                type: "image_url",
                image_url: { url }
              }))
            ] 
          },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "build_listing" } },
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) return json(429, { error: "Rate limit. Try again shortly." });
      if (resp.status === 402) return json(402, { error: "AI credits exhausted." });
      const t = await resp.text();
      console.error("[ai-listing-extract] extract gateway error", resp.status, t);
      return json(500, { error: "Extract failed" });
    }

    const data = await resp.json();
    const call = data?.choices?.[0]?.message?.tool_calls?.[0];
    const argStr = call?.function?.arguments;
    if (!argStr) {
      console.error("[ai-listing-extract] no tool call returned", JSON.stringify(data).slice(0, 500));
      return json(500, { error: "AI returned no structured data" });
    }
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(argStr);
    } catch (e) {
      console.error("[ai-listing-extract] tool args parse error", e, argStr);
      return json(500, { error: "AI returned malformed data" });
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