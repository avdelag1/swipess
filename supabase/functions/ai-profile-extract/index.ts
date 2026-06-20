// AI Profile Extract — turns spoken/written narrative into structured profile fields
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') || '*';
const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Cap input size — DoS + Groq cost guard. 50KB fits any reasonable narrative.
const MAX_NARRATIVE_BYTES = 50 * 1024;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const declaredLen = Number(req.headers.get("content-length") || "0");
  if (declaredLen > MAX_NARRATIVE_BYTES * 2) {
    return new Response(
      JSON.stringify({ error: "Payload too large." }),
      { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) {
      return new Response(
        JSON.stringify({ error: "GROQ_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { mode, narrative } = await req.json();
    if (!narrative || typeof narrative !== "string" || narrative.trim().length < 5) {
      return new Response(
        JSON.stringify({ error: "Provide a longer narrative (min 5 chars)." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (narrative.length > MAX_NARRATIVE_BYTES) {
      return new Response(
        JSON.stringify({ error: "Narrative too long." }),
        { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const isOwner = mode === "owner";

    const systemPrompt = isOwner
      ? `You are a profile architect for Swipess hosts/owners. Extract structured fields from the user's description and write a polished business description. Stay faithful to the user's input. Leave fields null/empty if not mentioned. Return ONLY valid JSON with these exact keys:
{
  "business_name": string or null,
  "business_description": string (2-3 sentence polished description),
  "business_location": string or null,
  "contact_email": string or null,
  "contact_phone": string or null,
  "service_offerings": string[]
}`
      : `You are a profile architect for Swipess users. Extract structured fields from the user's description and write a cinematic first-person bio (2-3 sentences). Stay faithful to the user's input. Leave fields null/empty if not mentioned. Return ONLY valid JSON with these exact keys:
{
  "name": string or null,
  "age": number or null,
  "gender": string or null,
  "bio": string (cinematic 2-3 sentence first-person bio),
  "intentions": string[],
  "city": string or null,
  "neighborhood": string or null,
  "country": string or null,
  "nationality": string or null,
  "languages": string[],
  "interests": string[],
  "lifestyle_tags": string[],
  "occupation": string or null,
  "relationship_status": string or null,
  "smoking_habit": string or null,
  "drinking_habit": string or null
}`;

    const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: narrative },
        ],
        temperature: 0.2,
        max_tokens: 1000,
        response_format: { type: "json_object" },
      }),
    });

    if (!resp.ok) {
      const t = await resp.text();
      console.error("[ai-profile-extract] groq error", resp.status, t);
      return new Response(JSON.stringify({ error: "Extraction failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const text = data?.choices?.[0]?.message?.content?.trim() ?? "";

    let profile: Record<string, unknown> | null = null;
    try {
      profile = JSON.parse(text);
    } catch {
      console.error("[ai-profile-extract] failed to parse JSON:", text);
      return new Response(JSON.stringify({ error: "Could not parse profile from response" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!isOwner && profile?.bio) {
      const bio = profile.bio as string;
      if (bio.length > 240) {
        profile.bio = bio.slice(0, 237) + "...";
      }
    }

    return new Response(JSON.stringify({ profile }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[ai-profile-extract]", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
