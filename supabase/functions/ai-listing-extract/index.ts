// AI Listing Extractor — non-streaming, returns structured JSON via prompt
// Used by AIListingWizard for the "extract" and "refine" tasks.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') || '*';
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

    // Canonical chip vocabulary — must mirror src/constants/listingTaxonomies.ts
    // so the AI maps the user's words onto REAL selectable chips (otherwise the
    // amenities it returns never register in the form).
    const AMENITY_VOCAB: Record<string, string[]> = {
      property: [
        'Private Pool','Shared Pool','Gym','Parking','Garage','Carport','AC','WiFi','Security 24/7','Security Cameras','Garden','Balcony','Terrace','Rooftop','Elevator','Storage','Workspace','Office Space','2-in-1 Washer/Dryer','Separate Washer & Dryer','Laundry Room','Washer','Dishwasher','Gas Stove','Water Filter / Osmosis','Smart-home','Solar Panels','Backup water','Sea View','Mountain View','Garden View','Outdoor Kitchen','BBQ','Hot Tub','Sauna','Walk-in Closet','Fireplace','Mosquito Net','Sublease Option',
        'Water','Electricity','Gas','Internet','Cleaning','Maintenance','Trash','Cable TV',
        'Quiet','Lively','Family-friendly','Pet-friendly','Beachfront','Jungle','Downtown','Gated','Eco',
      ],
      motorcycle: ['ABS','ESC','Traction control','Heated grips','Luggage rack','Crash bars','Quick-shifter','Bluetooth','Helmet','Riding gear','Lock','Top case','Charger','Insurance','Roadside assistance'],
      bicycle: ['Front suspension','Full suspension','Disc brakes','Carbon frame','Aluminum frame','Tubeless','Dropper post','Lock','Lights','Basket','Pump','Helmet','Repair kit'],
      worker: ['Punctual','Detail-oriented','English-speaking','Spanish-speaking','Insured','Background-checked','Own tools','Own vehicle','Emergency available'],
    };
    const vocab = AMENITY_VOCAB[category] || AMENITY_VOCAB.property;

    const sys = `You parse natural-language listing intel into structured JSON for a Swipess marketplace listing.
Category is "${category}". Use the provided base data when present.
Base price: ${body.price ?? "(unknown)"}
Base city: ${body.city ?? "(unknown)"}

Rules:
- Be faithful to the user's words. NEVER invent specifics (price, beds, year, brand, model) that were not stated.
- If "Base price" is a number, you MUST return it as "price" — it is the seller's chosen price, do not change it.
- For "amenities": choose ONLY from this exact list, copied verbatim (do not paraphrase, translate, or add new ones). Include every entry the description clearly implies, and omit the rest:
${JSON.stringify(vocab)}
- Write "description" as a polished, professional, high-converting paragraph (2-5 sentences) that naturally weaves in the chosen amenities and the user's own details. Confident and factual — no placeholders, no bullet lists.

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

    // The seller's explicitly entered price always wins over anything the model inferred.
    const userPrice = Number(body.price);
    if (Number.isFinite(userPrice) && userPrice > 0) {
      parsed.price = userPrice;
    } else if (!parsed.price && body.price) {
      parsed.price = Number(body.price) || 0;
    }
    if (!parsed.city && body.city) parsed.city = body.city;

    return json(200, { data: parsed });
  } catch (err) {
    console.error("[ai-listing-extract] unexpected error", err);
    return json(500, { error: err instanceof Error ? err.message : "Unknown error" });
  }
});