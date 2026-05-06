// AI Profile Extract — turns spoken/written narrative into structured profile fields
// using Lovable AI Gateway with tool-calling (deterministic JSON output).
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const CLIENT_TOOL = {
  type: "function",
  function: {
    name: "extract_client_profile",
    description:
      "Extract a Swipess client profile from natural-language input. Be faithful to what the user said. Leave a field empty/null if it was not mentioned.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "First name or display name." },
        age: { type: "number", description: "Age in years, 18-99." },
        gender: { type: "string" },
        bio: {
          type: "string",
          description:
            "Cinematic 2-3 sentence first-person bio. Polished but factual to the user's input.",
        },
        intentions: {
          type: "array",
          items: { type: "string" },
          description:
            "What the user is looking for, e.g. ['rent', 'roommate', 'buy', 'short_stay'].",
        },
        city: { type: "string" },
        neighborhood: { type: "string" },
        country: { type: "string" },
        nationality: { type: "string" },
        languages: {
          type: "array",
          items: { type: "string" },
        },
        interests: {
          type: "array",
          items: { type: "string" },
        },
        lifestyle_tags: {
          type: "array",
          items: { type: "string" },
        },
        occupation: { type: "string" },
        relationship_status: { type: "string" },
        smoking_habit: { type: "string" },
        drinking_habit: { type: "string" },
      },
      required: ["bio"],
      additionalProperties: false,
    },
  },
};

const OWNER_TOOL = {
  type: "function",
  function: {
    name: "extract_owner_profile",
    description:
      "Extract a Swipess owner/host business profile from natural-language input.",
    parameters: {
      type: "object",
      properties: {
        business_name: { type: "string" },
        business_description: {
          type: "string",
          description:
            "Cinematic 2-3 sentence description of what the business offers.",
        },
        business_location: { type: "string" },
        contact_email: { type: "string" },
        contact_phone: { type: "string" },
        service_offerings: {
          type: "array",
          items: { type: "string" },
          description: "List of services / asset types offered.",
        },
      },
      required: ["business_description"],
      additionalProperties: false,
    },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
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
    const tool = isOwner ? OWNER_TOOL : CLIENT_TOOL;
    const systemPrompt = isOwner
      ? "You are a profile architect for Swipess hosts/owners. Extract structured fields and write a polished business description. Stay faithful to the user's input."
      : "You are a profile architect for Swipess users. Extract structured fields and write a cinematic first-person bio (2-3 sentences). Stay faithful to the user's input. Leave fields blank if not mentioned.";

    const resp = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: narrative },
          ],
          tools: [tool],
          tool_choice: { type: "function", function: { name: tool.function.name } },
        }),
      },
    );

    if (!resp.ok) {
      const t = await resp.text();
      console.error("[ai-profile-extract] gateway", resp.status, t);
      if (resp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (resp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Extraction failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const call = data?.choices?.[0]?.message?.tool_calls?.[0];
    let parsed: Record<string, unknown> = {};
    if (call?.function?.arguments) {
      try {
        parsed = JSON.parse(call.function.arguments);
      } catch (e) {
        console.error("[ai-profile-extract] tool args parse failed", e);
      }
    }

    return new Response(JSON.stringify({ profile: parsed }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[ai-profile-extract] error", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});