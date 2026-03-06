import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { messages } = await req.json();

        if (!messages || !Array.isArray(messages)) {
            throw new Error("Invalid request body. 'messages' array is required.");
        }

        const apiKey = Deno.env.get("MINIMAX_API_KEY");
        if (!apiKey) {
            throw new Error("Missing MINIMAX_API_KEY environment variable");
        }

        console.log(`[minimax-chat] Forwarding ${messages.length} messages to Minimax`);

        // Minimax Open-AI compatible endpoint
        const response = await fetch("https://api.minimax.chat/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: "abab6.5s-chat",
                messages: Object.values(messages).map((m: any) => ({
                    role: m.role,
                    content: m.content
                })),
                stream: false
            }),
        });

        const data = await response.json();

        if (!response.ok || data.error) {
            const errorMsg = data.error?.message || data.base_resp?.status_msg || "Minimax API Error";
            console.error("[minimax-chat] API Error:", data);

            if (errorMsg.toLowerCase().includes("balance") || data.base_resp?.status_code === 1004) {
                return new Response(
                    JSON.stringify({
                        success: false,
                        error: "Insufficient Minimax account balance. Please add funds to your Minimax account to continue using the AI chat.",
                        details: data
                    }),
                    { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            return new Response(
                JSON.stringify({ success: false, error: errorMsg, details: data }),
                { status: response.status || 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // OpenAI compatible response format data.choices[0].message.content
        return new Response(
            JSON.stringify({ success: true, reply: data.choices[0].message.content }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("[minimax-chat] Exception:", error);
        return new Response(
            JSON.stringify({ success: false, error: String(error) }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
