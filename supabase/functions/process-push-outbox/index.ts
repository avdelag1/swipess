/**
 * process-push-outbox Edge Function
 *
 * Drains pending entries in public.push_outbox by delegating each to the
 * existing send-push-notification function. This guarantees recipients get a
 * push even when their browser was offline at the moment the message was sent.
 *
 * Invocation:
 *   - Cron (recommended): every 30s via supabase scheduled functions
 *   - On-demand: any authenticated client can call this when it receives a
 *     realtime notification it didn't originate.
 *
 * Body parameters (all optional):
 *   limit   – max rows to process per invocation (default 50)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface OutboxRow {
  id: string;
  user_id: string | null;
  title: string | null;
  body: string | null;
  message: string | null;
  data: Record<string, unknown> | null;
  payload: Record<string, unknown> | null;
  url: string | null;
  icon: string | null;
  tag: string | null;
  attempts: number | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceKey);

    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const limit = Math.min(Number(body?.limit) || 50, 200);

    const { data: rows, error } = await adminClient
      .from("push_outbox")
      .select("id, user_id, title, body, message, data, payload, url, icon, tag, attempts")
      .is("processed_at", null)
      .in("status", ["pending", "retry"])
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) {
      console.error("process-push-outbox fetch failed:", error);
      return new Response(
        JSON.stringify({ ok: false, reason: "db_error", error: error.message }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!rows || rows.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, processed: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let success = 0;
    let failed = 0;
    const now = new Date().toISOString();

    for (const row of rows as OutboxRow[]) {
      if (!row.user_id) {
        await adminClient
          .from("push_outbox")
          .update({ processed_at: now, status: "skipped", error: "missing_user_id" })
          .eq("id", row.id);
        continue;
      }

      try {
        const invokeRes = await adminClient.functions.invoke("send-push-notification", {
          body: {
            user_id: row.user_id,
            title: row.title || "New activity",
            body: row.body || row.message || "",
            data: row.data || row.payload || {},
            url: row.url || undefined,
            icon: row.icon || undefined,
          },
        });

        if (invokeRes.error) throw invokeRes.error;

        await adminClient
          .from("push_outbox")
          .update({ processed_at: now, status: "sent", last_attempted_at: now })
          .eq("id", row.id);
        success += 1;
      } catch (err) {
        const attempts = (row.attempts ?? 0) + 1;
        const message = err instanceof Error ? err.message : String(err);
        const finalStatus = attempts >= 5 ? "failed" : "retry";
        await adminClient
          .from("push_outbox")
          .update({
            attempts,
            status: finalStatus,
            error: message.slice(0, 500),
            last_attempted_at: now,
            processed_at: finalStatus === "failed" ? now : null,
          })
          .eq("id", row.id);
        failed += 1;
        console.warn("[process-push-outbox] entry failed:", row.id, message);
      }
    }

    return new Response(
      JSON.stringify({ ok: true, processed: success, failed }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("process-push-outbox error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
