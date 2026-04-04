import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TIER_MAX_TOKENS: Record<string, number> = {
  free: 600,
  basic: 800,
  premium: 1200,
  unlimited: 2400,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const payload = await req.json().catch(() => ({}));
    const task = payload.task || "chat";
    const input = payload.data || payload;

    if (task === "ping") {
      return new Response(JSON.stringify({ status: "ready", engine: "MiniMax-M2.5" }), { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // ── Auth ──
    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader || "" } } }
    );
    const { data: { user } } = await supabase.auth.getUser();

    // ── Context Gathering ──
    let profile: any = null;
    let memories: any[] = [];
    let activeListing: any = null;

    const context = input.context || {};
    const listingId = context.listingId;
    const currentPath = context.currentPath || "/";

    if (user) {
      try {
        const [profileRes, listingRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle(),
          listingId ? supabase.from('listings').select('*').eq('id', listingId).maybeSingle() : Promise.resolve({ data: null }),
        ]);
        profile = profileRes.data;
        activeListing = listingRes.data;

        try {
          const memoriesRes = await supabase.from('user_memories').select('*').eq('user_id', user.id).limit(20);
          memories = memoriesRes.data || [];
        } catch { memories = []; }
      } catch (e) {
        console.error("[AI Orchestrator] Context fetch error:", e);
      }
    }

    const messages = input.messages || [];
    const maxTokens = TIER_MAX_TOKENS[profile?.ai_tier || "free"] || 800;
    const systemPrompt = getVibePrompt(task, input, user, profile, memories, activeListing, currentPath);

    // ── MiniMax Agentic Call ──
    const minimaxKey = Deno.env.get("MINIMAX_API_KEY");
    if (!minimaxKey) throw new Error("MINIMAX_API_KEY not set in Supabase Secrets.");

    const openaiMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m: any) => ({
        role: m.role === "assistant" || m.role === "model" ? "assistant" : "user",
        content: m.content || m.text || ""
      }))
    ];

    const res = await fetch("https://api.minimax.io/v1/text/chatcompletion_v2", {
      method: "POST",
      headers: { "Authorization": `Bearer ${minimaxKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ 
        model: "MiniMax-M2.5", 
        messages: openaiMessages, 
        temperature: 0.7, 
        max_tokens: maxTokens,
        stream: false 
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`MiniMax API Error: ${res.status} - ${errText}`);
    }

    const json = await res.json();
    const rawContent = json.choices?.[0]?.message?.content || "";
    
    // Clean tags
    const content = rawContent
      .replace(/<think>[\s\S]*?<\/think>\s*/g, "")
      .replace(/<minimax:tool_call>[\s\S]*?<\/minimax:tool_call>/g, "")
      .trim();

    let finalContent = content;
    let finalAction = null;

    // Try JSON Action Parse
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.action) {
          finalAction = parsed.action;
          finalContent = parsed.message || content.replace(/\{[\s\S]*\}/, '').trim();
        }
      } catch { /* ignore */ }
    }

    return new Response(JSON.stringify({
      result: { text: finalContent || "I'm listening. What's next?", action: finalAction },
      status: "success"
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err: any) {
    console.error("[AI Orchestrator] Critical Error:", err);
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500, // Returning 500 so you can actually see the error in Network tab
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});

function getVibePrompt(task: string, input: any, user: any, profile: any, memories: any[], activeListing?: any, currentPath?: string): string {
  const name = profile?.full_name || input?.userName || "Friend";
  const listingContext = activeListing ? `| Viewing: ${activeListing.title} ($${activeListing.price})` : "";
  const memoriesText = memories.length > 0
    ? memories.map(m => `- ${m.title}: ${m.content}`).join('\n')
    : "No history found.";

  return `### IDENTITY
You are the Swipess AI Concierge — powered by MiniMax. 
User: ${name} | Location: Tulum
${listingContext}

### USER CONTEXT
${memoriesText}

### MISSION
You help luxury travelers and property owners in Tulum connect instantly. Be sharp, boutique, and high-frequency.

### TOOL OUTPUT FORMAT (ONLY IF NEEDED)
If you need search results, respond with:
{"action": {"type": "SEARCH_VIBE", "params": {"query": "..."}}, "message": "I'm looking that up for you..."}

PLAIN TEXT IS ALWAYS PREFERRED.`;
}
