// AI Listing Extractor — non-streaming, returns structured JSON via prompt
// Used by AIListingWizard for the "extract" and "refine" tasks.
// Detects the listing category from the user's words and returns
// category-specific fields that map 1:1 onto the listing form inputs.

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

// Canonical chip vocabulary — must mirror src/constants/listingTaxonomies.ts
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

// Exact values used by the listing form selects — the AI must return these verbatim.
const PROPERTY_TYPES = ['penthouse','house','apartment','loft','studio','mobile_home','camper','land','building','glamping','bungalow','mezzanine','room','commercial'];
const MOTORCYCLE_TYPES = ['Sport Bike','Cruiser','Touring','Adventure','Dual-Sport','Dirt Bike','Standard','Cafe Racer','Chopper','Scooter','Electric','Other'];
const BICYCLE_TYPES = ['road','mountain','hybrid','electric','cruiser','bmx'];
const SERVICE_CATEGORIES = ['house_cleaner','handyman','maintenance_tech','house_painter','plumber','electrician','gardener','pool_cleaner','massage_therapist','yoga','meditation_coach','holistic_therapist','personal_trainer','beauty','nutritionist','nanny','pet_care','pet_groomer','driver','mechanic','chef','bartender','event_planner','language_teacher','music_teacher','dance_instructor','scuba_instructor','surf_instructor','snorkeling_guide','sailing_instructor','fishing_guide','photographer','videographer','graphic_designer','it_support','translator','accountant','security','other'];

// Cap input size — DoS + Groq cost guard. 50KB fits any listing description.
const MAX_PROMPT_BYTES = 50 * 1024;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const declaredLen = Number(req.headers.get("content-length") || "0");
  if (declaredLen > MAX_PROMPT_BYTES * 2) return json(413, { error: "Payload too large" });

  try {
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) return json(500, { error: "GROQ_API_KEY not configured" });

    const body = (await req.json().catch(() => ({}))) as Body;
    const task = body.task ?? "extract";
    const prompt = (body.prompt || "").trim();
    if (!prompt) return json(400, { error: "Missing prompt" });
    if (prompt.length > MAX_PROMPT_BYTES) return json(413, { error: "Prompt too long" });

    async function callGroq(systemContent: string, userContent: string, jsonMode = true) {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemContent },
            { role: "user", content: userContent },
          ],
          temperature: 0.2,
          max_tokens: 1500,
          ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        console.error("[ai-listing-extract] groq error", res.status, t);
        if (res.status === 429) throw new Error("Rate limit");
        throw new Error(`Groq ${res.status}: ${t}`);
      }
      const data = await res.json();
      return data?.choices?.[0]?.message?.content?.trim() ?? "";
    }

    if (task === "refine") {
      const text = await callGroq(
        "You are an elite listing copywriter for Swipess. Rewrite the user's raw spoken input into a sharp, professional, high-converting listing description. Keep it concise (2-4 sentences), confident, and factual. Do not invent details. Do not add placeholders. Return ONLY the rewritten description, no preamble.",
        prompt,
        false
      );
      return json(200, { text: text || prompt });
    }

    // task === "extract"
    const hintCategory = body.category || "property";

    const sys = `You parse natural-language listing descriptions (often dictated by voice, any language) into structured JSON for a Swipess marketplace listing.

STEP 1 — Detect the category from the user's words:
- "property": penthouse, hotel, apartment, studio, house, condo, villa, room, land, office, any real estate for rent or sale
- "motorcycle": motorcycle, motorbike, scooter, moped
- "bicycle": bicycle, bike, e-bike, BMX, mountain bike
- "worker": a person offering a job, service, or skill (cleaner, plumber, chef, teacher, photographer, massage, etc.)
The user pre-selected "${hintCategory}" — only override it if their words CLEARLY describe a different category.

STEP 2 — Step-by-Step Thinking:
Before assigning any properties, write out your logic inside the "think" property. Analyze what category fits best, map out the amenities, evaluate vehicle specs or worker skills, and determine the optimal title and description based ONLY on the provided text.

STEP 3 — Extract the fields for the detected category. Be faithful to the user's words. NEVER invent specifics (price, beds, year, brand, model) that were not stated. Use null for anything not mentioned.

Base price: ${body.price ?? "(unknown)"} — if this is a number, you MUST return it as "price"; it is the seller's chosen price, do not change it.
Base city: ${body.city ?? "(unknown)"}

Field rules:
- "property_type" must be EXACTLY one of: ${JSON.stringify(PROPERTY_TYPES)} (a hotel/villa/condo maps to the closest: building, house, apartment...)
- "motorcycle_type" must be EXACTLY one of: ${JSON.stringify(MOTORCYCLE_TYPES)}
- "bicycle_type" must be EXACTLY one of: ${JSON.stringify(BICYCLE_TYPES)}
- "service_category" must be EXACTLY one of: ${JSON.stringify(SERVICE_CATEGORIES)}
- "pricing_unit" one of: hourly, daily, weekly, monthly, project
- "transmission" one of: manual, automatic, semi-automatic; "fuel_type" one of: gasoline, electric, hybrid; "condition" one of: excellent, good, fair, poor
- "amenities": choose ONLY from the list below matching the detected category, copied verbatim (no paraphrasing, no translating, no new entries). Include every entry the description clearly implies, omit the rest:
  property: ${JSON.stringify(AMENITY_VOCAB.property)}
  motorcycle: ${JSON.stringify(AMENITY_VOCAB.motorcycle)}
  bicycle: ${JSON.stringify(AMENITY_VOCAB.bicycle)}
  worker: ${JSON.stringify(AMENITY_VOCAB.worker)}
- "title": Create a highly fitting, attractive title depending entirely on the description (<= 70 chars). Focus on the core offering.
- "description": A concise, professional paragraph in English. Do NOT create bloated, overly long descriptions; organize the facts instead of inventing a narrative. Weave in the user's details and chosen amenities confidently.

Return ONLY valid JSON with ALL of these keys (null when not applicable):
{
  "think": string,
  "category": "property" | "motorcycle" | "bicycle" | "worker",
  "title": string,
  "description": string,
  "price": number,
  "city": string or null,
  "beds": number or null,
  "baths": number or null,
  "square_footage": number or null,
  "property_type": string or null,
  "furnished": boolean or null,
  "pet_friendly": boolean or null,
  "year": number or null,
  "make": string or null,
  "model": string or null,
  "engine_cc": number or null,
  "mileage": number or null,
  "motorcycle_type": string or null,
  "bicycle_type": string or null,
  "transmission": string or null,
  "fuel_type": string or null,
  "condition": string or null,
  "service_category": string or null,
  "pricing_unit": string or null,
  "experience_years": number or null,
  "skills": [],
  "amenities": []
}`;

    const result = await callGroq(sys, prompt);

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(result);
    } catch {
      console.error("[ai-listing-extract] failed to parse groq JSON:", result);
      return json(500, { error: "Extract failed" });
    }

    // Only accept a detected category we actually support.
    const validCategories = ["property", "motorcycle", "bicycle", "worker"];
    if (!validCategories.includes(parsed.category as string)) {
      parsed.category = hintCategory;
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
