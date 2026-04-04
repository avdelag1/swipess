import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const payload = await req.json().catch(() => ({}));
    const task = payload.task || "chat";
    const input = payload.data || payload;

    if (task === "ping") {
      return new Response(JSON.stringify({ status: "ready" }), { 
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // ── Strategic Auth (Fixed: Lenient) ──
    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader || "" } } }
    );

    // Try to get user, but don't die if it fails (Anonymous fallback)
    let user = null;
    if (authHeader) {
      const { data } = await supabase.auth.getUser();
      user = data?.user || null;
    }

    // ── Context Gathering ──
    let profile: any = null;
    let memories: any[] = [];
    if (user) {
      try {
        const [pRes, mRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle(),
          supabase.from('user_memories').select('*').eq('user_id', user.id).limit(10)
        ]);
        profile = pRes.data;
        memories = mRes.data || [];
      } catch (e) { console.warn("[AI] Context partial fail:", e); }
    }

    const messages = input.messages || [];
    const name = profile?.full_name || input?.userName || "Friend";
    const historyText = memories.map(m => `- ${m.title}: ${m.content}`).join('\n') || "No history.";

    // ── MiniMax Call ──
    const minimaxKey = Deno.env.get("MINIMAX_API_KEY");
    if (!minimaxKey) throw new Error("MINIMAX_API_KEY is missing from Supabase Secrets.");

    const systemPrompt = `You are the Swipess AI Concierge in Tulum. Powered by MiniMax.
User Name: ${name}
User History:
${historyText}

Be direct, sophisticated, and helpful. Answer the user's question clearly.`;

    const res = await fetch("https://api.minimax.io/v1/text/chatcompletion_v2", {
      method: "POST",
      headers: { "Authorization": `Bearer ${minimaxKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ 
        model: "MiniMax-M2.5", 
        messages: [{ role: "system", content: systemPrompt }, ...messages.map((m: any) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: m.content || m.text || ""
        }))], 
        temperature: 0.7 
      }),
    });

    const json = await res.json();
    const aiText = json.choices?.[0]?.message?.content || "I'm processing... say that again?";

    return new Response(JSON.stringify({
      result: { text: aiText.replace(/<think>[\s\S]*?<\/think>/g, "").trim() },
      status: "success"
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err: any) {
    console.error("[AI Error]:", err);
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 200, // Return 200 with error object so frontend can show a pretty message
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});
