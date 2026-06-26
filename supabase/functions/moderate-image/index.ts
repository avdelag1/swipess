// Image moderation — Groq vision primary (matches the app's main AI provider),
// Gemini fallback. Fails open (safe: true) so a moderation outage never blocks
// publishing; callers treat this as advisory.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const ALLOWED_ORIGIN = '*';
const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PROMPT = `You are a strict content moderator for a property/vehicle/job marketplace.
Analyze this image for BOTH unsafe content AND contact-info evasion.
Mark it UNSAFE — return {"safe": false, "reasons": ["short description of what violated the policy"]} — if the image contains ANY of:
- explicit nudity, pornography, gore, extreme violence, or illegal content; OR
- visible personal contact details meant to move users off-platform: a phone or WhatsApp number, an email address, a social-media @handle or username (Instagram, Telegram, TikTok, Facebook, Snapchat, etc.), a website URL, or overlaid text like "WhatsApp me", "call me", "DM me" or "follow me".
If none of the above are present, return {"safe": true, "reasons": []}.
Respond ONLY with valid JSON.`;

function safeResponse(payload: { safe: boolean; reasons: string[]; confidence: number }) {
  return new Response(JSON.stringify(payload), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function parseVerdict(text: string) {
  const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
  const parsed = JSON.parse(jsonStr);
  return {
    safe: parsed.safe ?? true,
    reasons: Array.isArray(parsed.reasons) ? parsed.reasons : [],
    confidence: 0.95,
  };
}

async function moderateWithGroq(apiKey: string, dataUri: string) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [{
        role: "user",
        content: [
          { type: "text", text: PROMPT },
          { type: "image_url", image_url: { url: dataUri } },
        ],
      }],
      temperature: 0.1,
      max_tokens: 300,
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) throw new Error(`Groq vision ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content?.trim() ?? "";
  return parseVerdict(text);
}

async function moderateWithGemini(apiKey: string, base64: string, mimeType: string) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        role: "user",
        parts: [
          { text: PROMPT },
          { inlineData: { mimeType, data: base64 } },
        ],
      }],
      generationConfig: { temperature: 0.1 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim?.() ?? "";
  return parseVerdict(text);
}

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * Only allow fetching images from our own Supabase storage origin. Without
 * this, an authenticated caller could point imageUrl at internal/cloud-
 * metadata endpoints (SSRF) since the function fetches the URL server-side.
 */
function isAllowedImageUrl(raw: string): boolean {
  let u: URL;
  try { u = new URL(raw); } catch { return false; }
  if (u.protocol !== "https:") return false;
  let supabaseHost = "";
  try { supabaseHost = new URL(Deno.env.get("SUPABASE_URL") || "").host; } catch { /* unset */ }
  return !!supabaseHost && u.host === supabaseHost;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageUrl } = await req.json();
    if (!imageUrl) {
      return safeResponse({ safe: true, reasons: [], confidence: 1.0 });
    }

    if (typeof imageUrl !== "string" || !isAllowedImageUrl(imageUrl)) {
      console.warn("[moderate-image] rejected non-allowlisted imageUrl");
      return safeResponse({ safe: true, reasons: [], confidence: 1.0 });
    }

    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GROQ_API_KEY && !GEMINI_API_KEY) {
      return safeResponse({ safe: true, reasons: [], confidence: 1.0 });
    }

    // Fetch the image once; both providers consume it as base64.
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) throw new Error("Could not fetch image");
    if (Number(imgRes.headers.get("content-length") || "0") > MAX_IMAGE_BYTES) {
      throw new Error("Image too large");
    }
    const arrayBuffer = await imgRes.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_IMAGE_BYTES) throw new Error("Image too large");
    const base64 = encode(arrayBuffer);
    const mimeType = imgRes.headers.get("content-type") || "image/jpeg";

    if (GROQ_API_KEY) {
      try {
        const verdict = await moderateWithGroq(GROQ_API_KEY, `data:${mimeType};base64,${base64}`);
        return safeResponse(verdict);
      } catch (groqErr) {
        console.warn("[moderate-image] Groq failed, trying Gemini", groqErr);
      }
    }

    if (GEMINI_API_KEY) {
      const verdict = await moderateWithGemini(GEMINI_API_KEY, base64, mimeType);
      return safeResponse(verdict);
    }

    return safeResponse({ safe: true, reasons: [], confidence: 1.0 });
  } catch (err) {
    console.error("[moderate-image]", err);
    return safeResponse({ safe: true, reasons: [], confidence: 1.0 });
  }
});
