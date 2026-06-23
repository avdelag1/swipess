// Server-side validator for the web AccessCodeGate.
//
// The secret access code lives ONLY here — in the SWIPESS_ACCESS_CODE env var
// (or, if set, the CMS site_content row read with the service role). It is never
// shipped in the client bundle, so an intruder reading the JS can't discover it.
// The browser sends the code the user typed; we answer { valid: boolean }.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
  Deno.env.get("SUPABASE_ANON_KEY") ??
  "";
// Fallback keeps the gate functional if the secret hasn't been configured yet.
// Set SWIPESS_ACCESS_CODE in the function's secrets to override it.
const ENV_CODE = Deno.env.get("SWIPESS_ACCESS_CODE") ?? "URDBEST";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function normalizeCode(value: string): string {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/[^a-z0-9]/gi, "")
    .toUpperCase();
}

async function resolveExpectedCode(): Promise<string> {
  // Optional CMS override so the owner can rotate the code without a redeploy.
  // Read server-side with the service role so it stays off the client.
  if (SUPABASE_URL && SERVICE_KEY) {
    try {
      const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
      const { data } = await supabase
        .from("site_content")
        .select("text_value")
        .eq("page_key", "swipess_gate")
        .eq("section_key", "secret_code")
        .maybeSingle();
      const cms = (data as { text_value?: string } | null)?.text_value;
      if (cms && cms.trim()) return cms.trim();
    } catch (_e) {
      // fall through to env code
    }
  }
  return ENV_CODE;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ valid: false, error: "method_not_allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let submitted = "";
  try {
    const body = await req.json();
    submitted = typeof body?.code === "string" ? body.code : "";
  } catch {
    submitted = "";
  }

  const expected = await resolveExpectedCode();
  const valid = !!submitted && normalizeCode(submitted) === normalizeCode(expected);

  return new Response(JSON.stringify({ valid }), {
    headers: { ...corsHeaders, "Content-Type": "application/json", "cache-control": "no-store" },
  });
});
