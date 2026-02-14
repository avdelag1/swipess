import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MINIMAX_API_URL = "https://api.minimax.io/v1/chat/completions";

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ConversationRequest {
  category: string;
  imageCount: number;
  messages: Message[];
  extractedData?: Record<string, any>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const MINIMAX_API_KEY = Deno.env.get("MINIMAX_API_KEY");
    if (!MINIMAX_API_KEY) {
      return new Response(
        JSON.stringify({ error: "MiniMax API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { category, imageCount, messages, extractedData = {} }: ConversationRequest = await req.json();

    // Build the system prompt based on category with comprehensive field knowledge
    const systemPrompt = buildSystemPrompt(category, imageCount, extractedData);

    // Build conversation history
    const conversationMessages: Message[] = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    // Call MiniMax API with retry logic
    let response;
    let retries = 0;
    const maxRetries = 3;
    const baseDelay = 1000;

    while (retries <= maxRetries) {
      response = await fetch(MINIMAX_API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${MINIMAX_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "MiniMax-Text-01",
          messages: conversationMessages,
          temperature: 0.7,
          max_tokens: 1500,
        }),
      });

      if (response.ok || (response.status !== 429 && response.status !== 503)) {
        break;
      }

      if (retries === maxRetries) {
        break;
      }

      const delay = baseDelay * Math.pow(2, retries);
      console.log(`Rate limited. Retrying in ${delay}ms... (attempt ${retries + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      retries++;
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("MiniMax API error:", response.status, errorText);

      let errorMessage = `AI service error (${response.status})`;
      if (response.status === 429) {
        errorMessage = "AI service is temporarily busy. Please try again in a moment.";
      } else if (response.status === 503) {
        errorMessage = "AI service is temporarily unavailable. Please try again later.";
      }

      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || "";

    // Parse the response - expect JSON with both message and extracted data
    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        // If no JSON, treat entire response as a message
        result = {
          message: content,
          extractedData: extractedData,
          isComplete: false,
        };
      }
    } catch (parseErr) {
      console.error("Failed to parse AI response:", content);
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

function buildSystemPrompt(category: string, imageCount: number, extractedData: Record<string, any>): string {
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
Required:
- title (string, max 60 chars)
- description (string, 2-3 paragraphs)
- property_type (enum: Apartment, House, Villa, Condo, Studio, Penthouse, Townhouse, Room)
- mode (enum: rent, sale)
- price (number)
- city (string)
- neighborhood (string)

Optional but important:
- beds (integer)
- baths (integer)
- square_footage (integer)
- furnished (boolean)
- pet_friendly (boolean)
- amenities (array: Pool, Gym, Parking, AC, Heating, WiFi, Laundry, Balcony, Garden, Security, Elevator, etc.)
- services_included (array: Water, Electricity, Gas, Internet, Cable TV, Cleaning, Maintenance, etc.)
- rental_duration_type (enum: 3-months, 6-months, 1-year, flexible)
- house_rules (string)
- address (string)
- state (string)

Tips for conversation:
- Start by asking about the property type and whether it's for rent or sale
- Ask about key features: bedrooms, bathrooms, size
- Inquire about amenities and what makes it special
- Ask about pricing and location details
- Be friendly: "That sounds lovely! Tell me more about..."
`;
      break;

    case "motorcycle":
      categorySpecificPrompt = `
AVAILABLE MOTORCYCLE FIELDS:
Required:
- title (string, max 60 chars)
- description (string)
- mode (enum: rent, sale)
- price (number)
- city (string)

Important:
- motorcycle_type (enum: sport, cruiser, adventure, scooter, touring, naked)
- vehicle_brand (string: Honda, Yamaha, Suzuki, Kawasaki, BMW, Harley-Davidson, Ducati, etc.)
- vehicle_model (string)
- vehicle_condition (enum: new, excellent, good, fair)
- year (integer)
- engine_cc (integer)
- mileage (integer)
- transmission (enum: manual, automatic)

Optional features:
- has_abs (boolean)
- has_esc (boolean)
- has_traction_control (boolean)
- has_heated_grips (boolean)
- has_luggage_rack (boolean)
- includes_helmet (boolean)
- includes_gear (boolean)

Tips:
- Ask about make, model, and year
- Inquire about condition and mileage
- Ask what type of riding it's best for
- Check if accessories are included
`;
      break;

    case "bicycle":
      categorySpecificPrompt = `
AVAILABLE BICYCLE FIELDS:
Required:
- title (string, max 60 chars)
- description (string)
- mode (enum: rent, sale)
- price (number)
- city (string)

Important:
- bicycle_type (enum: city, mountain, road, electric, hybrid, bmx)
- vehicle_brand (string)
- vehicle_model (string)
- vehicle_condition (enum: new, excellent, good, fair)
- year (integer)
- frame_size (string: XS, S, M, L, XL)
- frame_material (string: aluminum, carbon, steel, titanium)
- number_of_gears (integer)
- electric_assist (boolean)

Electric bike specific:
- battery_range (integer, km)

Optional accessories:
- includes_lock (boolean)
- includes_lights (boolean)
- includes_basket (boolean)
- includes_pump (boolean)
- suspension_type (string: front, full, rigid)
- brake_type (string: disc, rim, hydraulic)
- wheel_size (string)

Tips:
- Ask what type of riding they'll use it for
- Inquire about size and condition
- For e-bikes, ask about battery range
- Check what accessories come with it
`;
      break;

    case "worker":
      categorySpecificPrompt = `
AVAILABLE SERVICE/WORKER FIELDS:
Required:
- title (string, max 60 chars)
- description (string)
- service_category (enum: nanny, chef, cleaner, gardener, tutor, massage_therapist, personal_trainer, dog_walker, mechanic, electrician, plumber, carpenter, painter, photographer, videographer, event_planner, translator, musician, driver, security_guard, bartender, hairstylist, makeup_artist, other)
- pricing_unit (enum: per_hour, per_session, per_day, per_week, per_month, quote)
- price (number)
- city (string)

Important:
- experience_level (enum: entry, mid, senior, expert)
- experience_years (integer)
- skills (array of strings)
- certifications (array of strings)
- service_radius_km (integer)

Optional:
- minimum_booking_hours (integer)
- offers_emergency_service (boolean)
- background_check_verified (boolean)
- insurance_verified (boolean)
- tools_equipment (array)
- days_available (array: monday, tuesday, wednesday, thursday, friday, saturday, sunday)
- time_slots_available (array: morning, afternoon, evening, night)
- work_type (array: full_time, part_time, freelance, contract)
- schedule_type (array: fixed_hours, flexible, on_call, seasonal)
- location_type (array: on_site, remote, hybrid)

Tips:
- Ask what service they provide
- Inquire about experience and qualifications
- Ask about availability and rates
- Check their coverage area
- Ask about certifications or special training
`;
      break;

    default:
      categorySpecificPrompt = "Unknown category";
  }

  return baseInstructions + categorySpecificPrompt;
}
