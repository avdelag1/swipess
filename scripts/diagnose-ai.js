#!/usr/bin/env node
/**
 * AI Orchestrator Diagnostic Script
 * Run: node scripts/diagnose-ai.js
 *
 * Tests:
 *   1. Unauthenticated GET ping  — verifies the function is deployed and reachable
 *   2. Unauthenticated POST ping — same, via task: "ping"
 *   3. Authenticated chat        — sends a real AI message (requires SUPABASE_AUTH_TOKEN in .env)
 */

import { readFileSync } from "fs";
import { resolve } from "path";

// ─── Load .env ────────────────────────────────────────────────────────────────

function loadEnv() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    console.warn("  ⚠  Could not read .env — using existing environment variables\n");
  }
}

loadEnv();

// ─── Config ───────────────────────────────────────────────────────────────────

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const ANON_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || "";
const AUTH_TOKEN = process.env.SUPABASE_AUTH_TOKEN || ""; // optional: user JWT for chat test

if (!SUPABASE_URL || !ANON_KEY) {
  console.error(
    "ERROR: VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY must be set in .env"
  );
  process.exit(1);
}

const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/ai-orchestrator`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pass(label, extra = "") {
  console.log(`  ✅  ${label}${extra ? "  →  " + extra : ""}`);
}

function fail(label, reason) {
  console.log(`  ❌  ${label}  →  ${reason}`);
}

async function request(method, body, token) {
  const headers = {
    "Content-Type": "application/json",
    apikey: ANON_KEY,
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(FUNCTION_URL, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let json;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  return { status: res.status, json };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

async function testGetPing() {
  console.log("\n[1] GET /ai-orchestrator  (unauthenticated ping)");
  try {
    const { status, json } = await request("GET");
    if (status === 200 && json?.status === "ready") {
      pass("Function reachable", JSON.stringify(json));
    } else {
      fail("Unexpected response", `HTTP ${status}  ${JSON.stringify(json)}`);
    }
  } catch (err) {
    fail("Network error", err.message);
  }
}

async function testPostPing() {
  console.log("\n[2] POST ping task  (unauthenticated)");
  try {
    const { status, json } = await request("POST", { task: "ping" });
    if (status === 200 && json?.status === "ready") {
      pass("Ping task responded", JSON.stringify(json));
    } else {
      fail("Unexpected response", `HTTP ${status}  ${JSON.stringify(json)}`);
    }
  } catch (err) {
    fail("Network error", err.message);
  }
}

async function testAuthenticatedChat() {
  console.log("\n[3] POST chat task  (authenticated AI call)");
  if (!AUTH_TOKEN) {
    console.log(
      "  ⏭   Skipped — add SUPABASE_AUTH_TOKEN=<your-jwt> to .env to run this test"
    );
    return;
  }
  try {
    const { status, json } = await request(
      "POST",
      { task: "chat", data: { messages: [{ role: "user", content: "Say hello in one sentence." }] } },
      AUTH_TOKEN
    );
    if (status === 200 && (json?.result || json?.message)) {
      const reply = json?.result?.message || json?.result?.text || json?.message || "";
      pass(`AI replied via ${json?.provider_used || "?"}`, reply.slice(0, 120));
    } else {
      fail("AI call failed", `HTTP ${status}  ${JSON.stringify(json)}`);
    }
  } catch (err) {
    fail("Network error", err.message);
  }
}

// ─── Run ──────────────────────────────────────────────────────────────────────

console.log("━━━ AI Orchestrator Diagnostics ━━━");
console.log(`Endpoint: ${FUNCTION_URL}`);

(async () => {
  await testGetPing();
  await testPostPing();
  await testAuthenticatedChat();
  console.log("\n━━━ Done ━━━\n");
})();
