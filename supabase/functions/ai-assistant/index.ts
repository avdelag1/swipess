import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { type, data } = await req.json();

    let systemPrompt = "";
    let userPrompt = "";

    switch (type) {
      case "listing": {
        systemPrompt = `You are an expert real estate and marketplace listing creator. Generate compelling, detailed listings that attract renters/buyers. Always respond with valid JSON only, no markdown or extra text.`;
        
        const cat = data.category || "property";
        const desc = data.description || "";
        const price = data.price || "";
        const location = data.location || "";
        const imageCount = data.imageCount || 0;

        if (cat === "property") {
          userPrompt = `Create a property rental/sale listing with this info:
Description: ${desc}
Price: ${price}
Location: ${location}
Photos: ${imageCount} uploaded

Return JSON with these fields:
{
  "title": "catchy title max 60 chars",
  "description": "detailed 2-3 paragraph description highlighting features",
  "property_type": "apartment|house|room|studio|villa|condo",
  "beds": number,
  "baths": number,
  "furnished": boolean,
  "pet_friendly": boolean,
  "amenities": ["wifi", "kitchen", "parking", etc],
  "price": number or null,
  "city": "city name" or null
}`;
        } else if (cat === "motorcycle") {
          userPrompt = `Create a motorcycle listing with this info:
Description: ${desc}
Price: ${price}
Location: ${location}
Photos: ${imageCount} uploaded

Return JSON:
{
  "title": "catchy title max 60 chars",
  "description": "detailed description",
  "motorcycle_type": "sport|cruiser|adventure|scooter|touring|naked",
  "vehicle_condition": "new|excellent|good|fair",
  "includes_helmet": boolean,
  "includes_gear": boolean,
  "price": number or null,
  "city": "city name" or null
}`;
        } else if (cat === "bicycle") {
          userPrompt = `Create a bicycle listing with this info:
Description: ${desc}
Price: ${price}
Location: ${location}
Photos: ${imageCount} uploaded

Return JSON:
{
  "title": "catchy title max 60 chars",
  "description": "detailed description",
  "bicycle_type": "city|mountain|road|electric|hybrid|bmx",
  "vehicle_condition": "new|excellent|good|fair",
  "electric_assist": boolean,
  "includes_lock": boolean,
  "includes_lights": boolean,
  "price": number or null,
  "city": "city name" or null
}`;
        } else if (cat === "worker") {
          userPrompt = `Create a service/worker listing with this info:
Description: ${desc}
Price: ${price}
Location: ${location}
Photos: ${imageCount} uploaded

Return JSON:
{
  "title": "professional title max 60 chars",
  "description": "detailed service description highlighting skills and experience",
  "service_category": "cleaning|plumbing|electrical|carpentry|gardening|painting|moving|general",
  "experience_level": "beginner|intermediate|expert",
  "skills": ["skill1", "skill2"],
  "pricing_unit": "hour|day|project",
  "price": number or null,
  "city": "city name" or null
}`;
        }
        break;
      }

      case "profile": {
        systemPrompt = `You are a profile writing expert. Create warm, genuine, and attractive profile descriptions. Always respond with valid JSON only.`;
        userPrompt = `Enhance this user profile:
Name: ${data.name || ""}
Age: ${data.age || ""}
Bio: ${data.currentBio || ""}
Interests: ${(data.interests || []).join(", ")}
Occupation: ${data.occupation || ""}
Location: ${data.location || ""}

Return JSON:
{
  "bio": "engaging 2-3 sentence bio that sounds natural and friendly",
  "lifestyle": "brief lifestyle description",
  "interests_enhanced": ["refined interest tags"]
}`;
        break;
      }

      case "search": {
        systemPrompt = `You are a smart search assistant for a marketplace app. Help users find what they're looking for by generating search filters. Always respond with valid JSON only.`;
        userPrompt = `User is searching for: "${data.query}"
Available categories: property, motorcycle, bicycle, worker/services

Return JSON with suggested filters:
{
  "category": "property|motorcycle|bicycle|worker" or null,
  "priceMin": number or null,
  "priceMax": number or null,
  "keywords": ["relevant", "search", "terms"],
  "suggestion": "brief helpful suggestion for the user"
}`;
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid type. Use: listing, profile, or search" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    const response = await fetch(AI_GATEWAY_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: `AI service error (${response.status})` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || "";

    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseErr) {
      console.error("Failed to parse AI response:", content);
      return new Response(
        JSON.stringify({ error: "Failed to parse AI response", raw: content }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ result }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("ai-assistant error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
