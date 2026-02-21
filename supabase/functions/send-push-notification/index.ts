/**
 * send-push-notification Edge Function
 *
 * Sends Web Push (VAPID) notifications to a user's registered devices.
 *
 * Required Supabase Edge Function Secrets:
 *   VAPID_PUBLIC_KEY   – URL-safe base64 EC P-256 public key
 *   VAPID_PRIVATE_KEY  – URL-safe base64 EC P-256 private key
 *   VAPID_SUBJECT      – Contact URI, e.g. "mailto:support@swipess.com"
 *   SUPABASE_SERVICE_ROLE_KEY – Service role key (auto-injected by Supabase)
 *
 * Request body:
 *   user_id  – UUID of the recipient
 *   title    – Notification title
 *   body     – Notification body text
 *   data     – (optional) JSON payload passed to the notification click handler
 *   icon     – (optional) URL for notification icon
 *   url      – (optional) URL to open on notification click
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ─── VAPID helpers ────────────────────────────────────────────────

function urlB64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

function uint8ArrayToBase64Url(arr: Uint8Array): string {
  return btoa(String.fromCharCode(...arr))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

async function buildVapidAuthHeader(
  audience: string,
  subject: string,
  publicKey: string,
  privateKeyBytes: Uint8Array
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 12 * 3600; // 12 hour expiry

  const header = { typ: "JWT", alg: "ES256" };
  const payload = { aud: audience, exp, sub: subject };

  const encode = (obj: object) =>
    uint8ArrayToBase64Url(
      new TextEncoder().encode(JSON.stringify(obj))
    );

  const signingInput = `${encode(header)}.${encode(payload)}`;

  // Import private key for signing
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    privateKeyBytes as unknown as ArrayBuffer,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const signatureBytes = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    cryptoKey,
    new TextEncoder().encode(signingInput)
  );

  const token = `${signingInput}.${uint8ArrayToBase64Url(new Uint8Array(signatureBytes))}`;
  return `vapid t=${token},k=${publicKey}`;
}

// ─── Encrypt payload for web push ────────────────────────────────

async function encryptPayload(
  payload: string,
  p256dhKey: string,
  authKey: string
): Promise<{ body: Uint8Array; salt: string; serverPublicKey: string }> {
  const encoder = new TextEncoder();
  const payloadBytes = encoder.encode(payload);

  // Generate server EC key pair
  const serverKeyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  );

  // Import client's public key
  const clientPublicKey = await crypto.subtle.importKey(
    "raw",
    urlB64ToUint8Array(p256dhKey) as unknown as ArrayBuffer,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );

  // ECDH shared secret
  const sharedBits = await crypto.subtle.deriveBits(
    { name: "ECDH", public: clientPublicKey },
    serverKeyPair.privateKey,
    256
  );

  // Salt (16 random bytes)
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // Export server public key (uncompressed)
  const serverPublicKeyBytes = new Uint8Array(
    await crypto.subtle.exportKey("raw", serverKeyPair.publicKey)
  );

  const authBytes = urlB64ToUint8Array(authKey);

  // HKDF context
  const authInfo = encoder.encode("Content-Encoding: auth\0");
  const keyInfo = new Uint8Array([
    ...encoder.encode("Content-Encoding: aesgcm\0"),
    0x41, // "A"
    ...new Uint8Array(65), // placeholder for receiver public key
    0x41,
    ...new Uint8Array(65), // placeholder for sender public key
  ]);

  // Use Web Crypto HKDF
  const ikm = new Uint8Array([...new Uint8Array(sharedBits), ...authBytes]);
  const baseKey = await crypto.subtle.importKey("raw", ikm as unknown as ArrayBuffer, "HKDF", false, ["deriveBits"]);

  const prk = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt: authBytes, info: authInfo },
    baseKey,
    256
  );

  const prkKey = await crypto.subtle.importKey("raw", prk as unknown as ArrayBuffer, "HKDF", false, ["deriveBits"]);

  const contentEncryptionKey = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt, info: keyInfo },
    prkKey,
    128
  );

  const nonce = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt, info: encoder.encode("Content-Encoding: nonce\0") },
    prkKey,
    96
  );

  // AES-GCM encrypt
  const encKey = await crypto.subtle.importKey("raw", contentEncryptionKey as unknown as ArrayBuffer, "AES-GCM", false, ["encrypt"]);

  // Pad payload to 2048 bytes
  const padded = new Uint8Array(2 + payloadBytes.length);
  padded.set(payloadBytes, 2);

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: nonce },
    encKey,
    padded
  );

  return {
    body: new Uint8Array(encrypted),
    salt: uint8ArrayToBase64Url(salt),
    serverPublicKey: uint8ArrayToBase64Url(serverPublicKeyBytes),
  };
}

// ─── Send a single push ───────────────────────────────────────────

async function sendWebPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: object,
  vapidPublicKey: string,
  vapidPrivateKeyBytes: Uint8Array,
  vapidSubject: string
): Promise<{ ok: boolean; status?: number; error?: string }> {
  try {
    const payloadStr = JSON.stringify(payload);

    const url = new URL(subscription.endpoint);
    const audience = `${url.protocol}//${url.host}`;

    const authHeader = await buildVapidAuthHeader(
      audience,
      vapidSubject,
      vapidPublicKey,
      vapidPrivateKeyBytes
    );

    const { body, salt, serverPublicKey } = await encryptPayload(
      payloadStr,
      subscription.p256dh,
      subscription.auth
    );

    const response = await fetch(subscription.endpoint, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/octet-stream",
        "Content-Encoding": "aesgcm",
        Encryption: `salt=${salt}`,
        "Crypto-Key": `dh=${serverPublicKey}`,
        TTL: "86400",
        Urgency: "normal",
      },
      body: body as unknown as BodyInit,
    });

    return { ok: response.ok || response.status === 201, status: response.status };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ─── Main Handler ─────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check VAPID config
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
    const vapidSubject = Deno.env.get("VAPID_SUBJECT") || "mailto:support@swipess.com";

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.warn("VAPID keys not configured – push notifications disabled");
      return new Response(
        JSON.stringify({ ok: false, reason: "push_not_configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const vapidPrivateKeyBytes = urlB64ToUint8Array(vapidPrivateKey);

    // Admin client to read subscriptions (bypasses RLS)
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { user_id, title, body: msgBody, data = {}, icon, url } = body;

    if (!user_id || !title) {
      return new Response(
        JSON.stringify({ error: "user_id and title are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch all push subscriptions for this user
    const { data: subscriptions, error: subError } = await adminClient
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("user_id", user_id);

    if (subError) {
      console.error("Failed to fetch push subscriptions:", subError);
      return new Response(
        JSON.stringify({ ok: false, reason: "db_error" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      // No subscriptions - not an error, user just hasn't enabled push
      return new Response(
        JSON.stringify({ ok: true, sent: 0, reason: "no_subscriptions" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = {
      title,
      body: msgBody || "",
      icon: icon || "/icons/icon-192x192.png",
      badge: "/icons/badge-72x72.png",
      url: url || "/notifications",
      data,
      timestamp: Date.now(),
    };

    const expiredIds: string[] = [];
    let sent = 0;

    await Promise.all(
      subscriptions.map(async (sub) => {
        const result = await sendWebPush(
          { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
          payload,
          vapidPublicKey,
          vapidPrivateKeyBytes,
          vapidSubject
        );

        if (result.ok) {
          sent++;
        } else if (result.status === 404 || result.status === 410) {
          // Subscription expired or unsubscribed
          expiredIds.push(sub.id);
        } else {
          console.warn("Push failed for subscription:", sub.id, result);
        }
      })
    );

    // Clean up expired subscriptions
    if (expiredIds.length > 0) {
      await adminClient
        .from("push_subscriptions")
        .delete()
        .in("id", expiredIds);
      console.log(`Cleaned up ${expiredIds.length} expired push subscriptions`);
    }

    return new Response(
      JSON.stringify({ ok: true, sent, cleaned: expiredIds.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("send-push-notification error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
