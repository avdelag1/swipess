import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ConversationRequest {
  category: string;
  imageCount: number;
  messages: Message[];
  extractedData?: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { category, imageCount, messages, extractedData = {} }: ConversationRequest = await req.json();

    const systemPrompt = buildSystemPrompt(category, imageCount, extractedData);

    const conversationMessages: Message[] = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    const response = await fetch(AI_GATEWAY_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: conversationMessages,
        temperature: 0.7,
        max_tokens: 1500,
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
        result = {
          message: content,
          extractedData: extractedData,
          isComplete: false,
        };
      }
    } catch (_parseErr) {
      result = {
        message: content,
        extractedData: extractedData,
        isComplete: false,
      };
    }

    return new Response(
      JSON.stringify({ result }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("ai-conversation error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function buildSystemPrompt(category: string, imageCount: number, extractedData: Record<string, unknown>): string {
  const baseInstructions = `You are a friendly AI assistant helping users create a ${category} listing. You have access to ${imageCount} photos they've uploaded.

Your job is to:
1. Have a natural conversation to gather listing information
2. Ask follow-up questions to get missing details
3. Extract structured data from the conversation
4. Be conversational and helpful, not robotic

CRITICAL: Always respond with valid JSON in this format:
{
  "message": "Your friendly response or question to the user",
  "extractedData": {
    // All fields extracted so far from the conversation
  },
  "isComplete": false or true,
  "nextSteps": "What information is still needed (optional)"
}

Current extracted data: ${JSON.stringify(extractedData, null, 2)}
`;

  let categorySpecificPrompt = "";

  switch (category) {
    case "property":
      categorySpecificPrompt = `
AVAILABLE PROPERTY FIELDS:
Required: title, description, property_type, mode, price, city, neighborhood
Optional: beds, baths, square_footage, furnished, pet_friendly, amenities, services_included, rental_duration_type, house_rules, address, state

Tips: Start by asking about property type and rent/sale, then features, amenities, pricing, location.
`;
      break;
    case "motorcycle":
      categorySpecificPrompt = `
AVAILABLE MOTORCYCLE FIELDS:
Required: title, description, mode, price, city
Important: motorcycle_type, vehicle_brand, vehicle_model, vehicle_condition, year, engine_cc, mileage, transmission
Optional: has_abs, has_esc, has_traction_control, has_heated_grips, has_luggage_rack, includes_helmet, includes_gear

Tips: Ask about make, model, year, condition, mileage, and accessories.
`;
      break;
    case "bicycle":
      categorySpecificPrompt = `
AVAILABLE BICYCLE FIELDS:
Required: title, description, mode, price, city
Important: bicycle_type, vehicle_brand, vehicle_model, vehicle_condition, year, frame_size, frame_material, number_of_gears, electric_assist
Optional: battery_range, includes_lock, includes_lights, includes_basket, includes_pump, suspension_type, brake_type, wheel_size

Tips: Ask about type, size, condition, and for e-bikes ask about battery range.
`;
      break;
    case "worker":
      categorySpecificPrompt = `
AVAILABLE SERVICE/WORKER FIELDS:
Required: title, description, service_category, pricing_unit, price, city
Important: experience_level, experience_years, skills, certifications, service_radius_km
Optional: minimum_booking_hours, offers_emergency_service, background_check_verified, insurance_verified, tools_equipment, days_available, time_slots_available, work_type, schedule_type, location_type

Tips: Ask about service type, experience, availability, and rates.
`;
      break;
    default:
      categorySpecificPrompt = "Unknown category";
  }

  return baseInstructions + categorySpecificPrompt;
}
