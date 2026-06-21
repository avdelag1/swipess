import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') || '*';
const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY") || "";

// Reject oversized audio before buffering/decoding (DoS + Groq cost guard).
// ~10MB base64 ≈ 7.5MB of audio — far more than any short voice note needs.
const MAX_AUDIO_B64_BYTES = 10 * 1024 * 1024;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const declaredLen = Number(req.headers.get("content-length") || "0");
  if (declaredLen > MAX_AUDIO_B64_BYTES) {
    return new Response(
      JSON.stringify({ error: "Audio payload too large." }),
      { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    if (!GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not configured.");
    }

    const { audio, mimeType, language } = await req.json();

    if (!audio) {
      throw new Error("No audio provided.");
    }

    if (typeof audio !== "string" || audio.length > MAX_AUDIO_B64_BYTES) {
      return new Response(
        JSON.stringify({ error: "Audio payload too large or invalid." }),
        { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Convert base64 to binary
    const bytes = decode(audio);
    const fileExt = mimeType?.includes('mp4') ? 'mp4' : mimeType?.includes('wav') ? 'wav' : 'webm';
    const file = new File([bytes], `audio.${fileExt}`, { type: mimeType || 'audio/webm' });

    const formData = new FormData();
    formData.append("file", file);
    formData.append("model", "whisper-large-v3-turbo");

    const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Groq Whisper API Error:", err);
      throw new Error("Transcription failed: " + err);
    }

    const data = await response.json();

    return new Response(
      JSON.stringify({ text: data.text }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Voice transcription error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
