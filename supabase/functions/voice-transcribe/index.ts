// Voice transcription via Lovable AI Gateway (Gemini multimodal)
// Accepts base64-encoded audio, returns transcribed text.
// Used as a fallback for the AI concierge mic when Web Speech API is unavailable
// (iOS Safari, in-app browsers, native shells).

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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

    const { audio, mimeType, language } = await req.json();
    if (!audio || typeof audio !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing 'audio' (base64 string)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const audioMime = mimeType || "audio/webm";
    const langHint = language ? ` The user is speaking in ${language}.` : "";

    const response = await fetch(
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
            {
              role: "system",
              content:
                "You are a precise speech-to-text engine. Transcribe the user's audio verbatim. Return ONLY the transcribed text, no explanations, no quotes, no formatting." +
                langHint,
            },
            {
              role: "user",
              content: [
                { type: "text", text: "Transcribe this audio." },
                {
                  type: "input_audio",
                  input_audio: { data: audio, format: audioMime.includes("mp4") ? "mp4" : audioMime.includes("wav") ? "wav" : "webm" },
                },
              ],
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("[voice-transcribe] Gateway error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit. Try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Transcription failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const text: string = data?.choices?.[0]?.message?.content?.trim?.() ?? "";

    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[voice-transcribe] Error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});