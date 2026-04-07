
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * 🛰️ SWIPESS AI CONCIERGE — SOVEREIGN HYBRID MASTERPIECE (v2.0)
 * ─────────────────────────────────────────────────────────────────────────────
 * HUB: MiniMax-Text-01 (Native V2 API)
 * PERSISTENCE: Automatic server-side history tracking
 * ─────────────────────────────────────────────────────────────────────────────
 */

async function getUserId(supabase: any, authHeader: string) {
  if (!authHeader) return null;
  const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
  return user?.id || null;
}

// ── Knowledge Base Lookup ──────────────────────────────────────
async function fetchKnowledge(supabase: any, query: string): Promise<{ block: string; count: number }> {
    try {
    const keywords = query
      .toLowerCase()
      .replace(/[^a-záéíóúñü0-9\s]/gi, "")
      .split(/\s+/)
      .filter((w) => w.length >= 3)
      .slice(0, 8);

    if (keywords.length === 0) return { block: "", count: 0 };

    const tsQuery = keywords.join(" | ");
    const { data } = await supabase
      .from("concierge_knowledge")
      .select("title, content, category, google_maps_url, phone, website_url, tags")
      .eq("is_active", true)
      .textSearch("title", tsQuery, { type: "plain", config: "english" })
      .limit(5);

    let results = data || [];
    if (results.length < 2 && keywords.length > 0) {
      const { data: fallback } = await supabase
        .from("concierge_knowledge")
        .select("title, content, category, google_maps_url, phone, website_url, tags")
        .eq("is_active", true)
        .or(keywords.slice(0, 3).map((k: string) => `content.ilike.%${k}%`).join(","))
        .limit(5);
      if (fallback) {
        const existingIds = new Set(results.map((r: any) => r.title));
        results = [...results, ...fallback.filter((r: any) => !existingIds.has(r.title))];
      }
    }

    if (!results.length) return { block: "", count: 0 };

    const formatted = results
      .map((r: any) => {
        let entry = `• ${r.title} [${r.category}]: ${r.content}`;
        if (r.google_maps_url) entry += ` | Maps: ${r.google_maps_url}`;
        if (r.phone) entry += ` | Phone: ${r.phone}`;
        if (r.website_url) entry += ` | Web: ${r.website_url}`;
        return entry;
      })
      .join("\n");

    return {
      block: `\n\n--- VERIFIED LOCAL KNOWLEDGE ---\n${formatted}\n--- END KNOWLEDGE ---\n`,
      count: results.length,
    };
  } catch (e) {
    console.warn("[AI] Knowledge fetch error:", e);
    return { block: "", count: 0 };
  }
}

// ── Tavily Web Search ──────────────────────────────────────────
async function searchWeb(query: string): Promise<string> {
  const tavilyKey = Deno.env.get("TAVILY_API_KEY");
  if (!tavilyKey) return "";

  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: tavilyKey,
        query: `${query} Tulum Mexico`,
        search_depth: "basic",
        max_results: 3,
        include_answer: true,
      }),
    });

    if (!response.ok) return "";
    const data = await response.json();
    const results = data.results || [];
    if (!results.length && !data.answer) return "";

    let block = "\n\n--- LIVE WEB RESULTS ---\n";
    if (data.answer) block += `Summary: ${data.answer}\n\n`;
    for (const r of results.slice(0, 3)) {
      block += `• ${r.title}: ${r.content?.slice(0, 200) || ""}\n  URL: ${r.url}\n`;
    }
    block += "--- END WEB RESULTS ---\n";
    return block;
  } catch (e) {
    console.warn(`[AI] Tavily error: ${e.message}`);
    return "";
  }
}

function buildSystemPrompt(knowledgeBlock: string, webBlock: string): string {
  return `You are the Swipess AI Concierge — an elite, multilingual local expert for Tulum, Mexico.

🌍 LANGUAGE RULE: ALWAYS respond in the USER'S LANGUAGE. 

🚦 IN-APP NAVIGATION:
At the end of your response, you MAY append ONE JSON block if it helps the user (e.g. {"action": {"type": "navigate_to", "params": {"path": "/properties", "label": "Browse List"}}}).

📡 SOURCES:
${knowledgeBlock}${webBlock}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const minimaxKey = Deno.env.get("MINIMAX_API_KEY");
    const groupId = Deno.env.get("MINIMAX_GROUP_ID") || "2019874926051205377";
    
    if (!supabaseUrl || !serviceKey || !minimaxKey) throw new Error("Missing Secrets");
    const sb = createClient(supabaseUrl, serviceKey);

    const authHeader = req.headers.get("Authorization");
    const userId = await getUserId(sb, authHeader || "");

    const payload = await req.json().catch(() => ({}));
    const { task, data, stream } = payload;
    if (task === "ping") return new Response(JSON.stringify({ status: "ready" }), { headers: corsHeaders });

    const rawMessages = data?.messages || payload.messages || [];
    const latestQuery = data?.query || rawMessages[rawMessages.length - 1]?.content || "";

    // 1. Context Enhancement
    const { block: kBlock, count: kCount } = await fetchKnowledge(sb, latestQuery);
    let wBlock = "";
    if (kCount < 2 && latestQuery.length > 5) wBlock = await searchWeb(latestQuery);

    const systemPrompt = buildSystemPrompt(kBlock, wBlock);

    // 2. MiniMax V2 Call
    const minimaxResponse = await fetch("https://api.minimax.io/v1/text/chatcompletion_v2", {
      method: "POST",
      headers: { "Authorization": `Bearer ${minimaxKey}`, "Content-Type": "application/json", "GroupId": groupId },
      body: JSON.stringify({
        model: "abab6.5s-chat",
        messages: [{ role: "system", content: systemPrompt }, ...rawMessages.map((m: any) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content || m.text || "" })).slice(-10)],
        stream: !!stream,
        max_tokens: 1024
      }),
    });

    if (stream) {
      return new Response(minimaxResponse.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
    }

    const result = await minimaxResponse.json();
    
    // 🛡️ TRUTH PROTOCOL: Detect plan/model errors instead of pretending success
    if (result.base_resp?.status_msg && result.base_resp?.status_code !== 0) {
      throw new Error(`MiniMax Provider Error: ${result.base_resp.status_msg}`);
    }

    const text = result.choices?.[0]?.message?.content || "";
    const cleanText = text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

    // 🛡️ TRUTH PROTOCOL: If response is empty, do not treat as success
    if (!cleanText) {
      throw new Error("MiniMax returned an empty response. Verify your plan and model availability.");
    }
    // 3. PERSISTENCE (Safe server-side save)
    if (userId && cleanText) {
       try {
          // Find or create conversation
          let convId = data?.conversationId;
          if (!convId) {
            const { data: conv } = await sb.from('ai_conversations').insert({ user_id: userId, title: latestQuery.substring(0, 50) }).select().single();
            convId = conv?.id;
          }
          if (convId) {
             await sb.from('ai_messages').insert([
               { conversation_id: convId, user_id: userId, role: 'user', content: latestQuery },
               { conversation_id: convId, user_id: userId, role: 'assistant', content: cleanText, metadata: { model: 'abab6.5s-chat' } }
             ]);
          }
       } catch (e) {
         console.warn("[PERSISTENCE] Error saving history:", e);
       }
    }

    return new Response(JSON.stringify({ result: { text: cleanText }, model: "abab6.5s-chat" }), { headers: corsHeaders });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
