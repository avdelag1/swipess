// AI Profile Extract — turns spoken/written narrative into structured profile fields
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') || '*';
const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY not configured" }),
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

    const isOwner = mode === "owner";
    const profileSchema = isOwner
      ? `{
  "business_name": "string",
  "business_description": "Cinematic 2-3 sentence description",
  "business_location": "string",
  "contact_email": "string",
  "contact_phone": "string",
  "service_offerings": "string[]"
}`
      : `{
  "name": "string | null",
  "age": "number | null",
  "gender": "string | null",
  "bio": "Cinematic 2-3 sentence first-person bio",
  "intentions": "string[]",
  "city": "string | null",
  "neighborhood": "string | null",
  "country": "string | null",
  "nationality": "string | null",
  "languages": "string[]",
  "interests": "string[]",
  "lifestyle_tags": "string[]",
  "occupation": "string | null",
  "relationship_status": "string | null",
  "smoking_habit": "string | null",
  "drinking_habit": "string | null"
}`;

    const systemPrompt = isOwner
      ? "You are a profile architect for Swipess hosts/owners. Extract structured fields and write a polished business description. Stay faithful to the user's input. Return ONLY valid JSON matching the schema, no markdown."
      : "You are a profile architect for Swipess users. Extract structured fields and write a cinematic first-person bio (2-3 sentences). Stay faithful to the user's input. Leave fields blank if not mentioned. Return ONLY valid JSON matching the schema, no markdown.";

    const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          { role: "user", parts: [{ text: narrative }] },
        ],
        systemInstruction: {
          parts: [{ text: `${systemPrompt}\n\nJSON schema:\n${profileSchema}` }],
        },
        generationConfig: { temperature: 0.2 },
      }),
    });

    if (!resp.ok) {
      const t = await resp.text();
      console.error("[ai-profile-extract] kimi", resp.status, t);
      return new Response(JSON.stringify({ error: "Extraction failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim?.() ?? "";

    let profile: Record<string, unknown> | null = null;
    try {
      let cleanText = text.trim();
      if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```(json)?\n?/, '').replace(/\n?```$/, '').trim();
      }
      profile = JSON.parse(cleanText);
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
