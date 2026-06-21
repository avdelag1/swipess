import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const ALLOWED_ORIGIN = '*';
const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SUBSCRIPTION_PRODUCTS = new Set([
  'swipess.plus.monthly.v2',
  'swipess.plus.semestral.v2',
  'swipess.plus.annual.v2',
]);

const TOKEN_PRODUCTS: Record<string, number> = {
  'swipess.tokens.20.v1': 20,
  'swipess.tokens.50.v1': 50,
  'swipess.tokens.100.v1': 100,
  'swipess.tokens.150.v1': 150,
};

const EVENT_PROMO_PRODUCTS: Record<string, number> = {
  'swipess.promo.event.week.v2': 7,
  'swipess.promo.event.month.v2': 30,
  'swipess.promo.event.quarter.v2': 90,
};

interface GoogleVerifyResult {
  verified: boolean;
  orderId?: string;
  purchaseState?: number;
  startTimeMillis?: string;
  expiryTimeMillis?: string;
}

/**
 * Verifies a Google Play purchase server-side via the Android Publisher API.
 * Signs a real RS256 service-account JWT, exchanges it for an access token,
 * then queries the subscriptions or products endpoint depending on the SKU.
 * Returns { verified: false } if the service account is not configured or the
 * purchase cannot be confirmed — callers MUST NOT grant on a false result.
 */
async function verifyWithGooglePlay(
  packageName: string,
  productId: string,
  purchaseToken: string,
  isSubscription: boolean,
): Promise<GoogleVerifyResult> {
  const googleServiceAccountJson = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON");
  if (!googleServiceAccountJson) {
    console.error("GOOGLE_SERVICE_ACCOUNT_JSON not configured; cannot verify purchase");
    return { verified: false };
  }

  try {
    const serviceAccount = JSON.parse(googleServiceAccountJson);
    const now = Math.floor(Date.now() / 1000);
    const jwtHeader = { alg: "RS256", typ: "JWT", kid: serviceAccount.private_key_id };
    const jwtBody = {
      iss: serviceAccount.client_email,
      scope: "https://www.googleapis.com/auth/androidpublisher",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    };

    function base64url(s: string): string {
      return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    }

    // The PEM private key must be stripped of its header/footer and base64-
    // decoded to DER bytes before importKey — a raw TextEncoder of the PEM
    // string (the previous bug) is not a valid pkcs8 key.
    const pemBody = String(serviceAccount.private_key)
      .replace(/-----BEGIN PRIVATE KEY-----/, "")
      .replace(/-----END PRIVATE KEY-----/, "")
      .replace(/\s+/g, "");
    const keyBytes = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));

    const headerB64 = base64url(JSON.stringify(jwtHeader));
    const bodyB64 = base64url(JSON.stringify(jwtBody));
    const signatureInput = `${headerB64}.${bodyB64}`;

    const key = await crypto.subtle.importKey(
      "pkcs8",
      keyBytes,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"],
    );

    const signature = await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      key,
      new TextEncoder().encode(signatureInput),
    );
    const sigB64 = base64url(String.fromCharCode(...new Uint8Array(signature)));
    const jwt = `${signatureInput}.${sigB64}`;

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      console.error("Google OAuth token exchange failed", tokenData);
      return { verified: false };
    }

    const accessToken = tokenData.access_token;
    const kind = isSubscription ? "subscriptions" : "products";
    const apiUrl = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(packageName)}/purchases/${kind}/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(purchaseToken)}`;

    const verifyRes = await fetch(apiUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!verifyRes.ok) {
      console.error("Google Play API verification failed", verifyRes.status, await verifyRes.text());
      return { verified: false };
    }

    const result = await verifyRes.json();

    if (isSubscription) {
      // paymentState 0=pending,1=received,2=free trial,3=deferred.
      const paid = result.paymentState === 1 || result.paymentState === 2;
      const notExpired = result.expiryTimeMillis
        ? Number(result.expiryTimeMillis) > Date.now()
        : true;
      return {
        verified: paid && notExpired,
        orderId: result.orderId,
        startTimeMillis: result.startTimeMillis,
        expiryTimeMillis: result.expiryTimeMillis,
      };
    }

    // One-time product: purchaseState 0=purchased,1=cancelled,2=pending.
    return {
      verified: result.purchaseState === 0,
      orderId: result.orderId,
      purchaseState: result.purchaseState,
    };
  } catch (err) {
    console.error("Google Play verification error", err);
    return { verified: false };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const auth = req.headers.get('Authorization') ?? '';
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { global: { headers: { Authorization: auth } } }
    );

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: auth } } }
    );
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = userData.user.id;

    const { purchaseToken, productId, orderId: clientOrderId, rawData } = await req.json();
    if (!purchaseToken || !productId) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing purchaseToken or productId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const isSubscription = SUBSCRIPTION_PRODUCTS.has(productId);
    const isToken = !!TOKEN_PRODUCTS[productId];
    const isPromo = !!EVENT_PROMO_PRODUCTS[productId];
    if (!isSubscription && !isToken && !isPromo) {
      return new Response(JSON.stringify({ ok: false, error: 'Unknown productId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Replay guard: if this purchase token was already recorded, do not grant
    // again. Returns an idempotent success so the client treats it as done.
    const { data: existingTx } = await supabase
      .from('google_play_transactions')
      .select('purchase_token')
      .eq('purchase_token', purchaseToken)
      .maybeSingle();
    if (existingTx) {
      return new Response(
        JSON.stringify({ ok: true, alreadyProcessed: true, productId }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mandatory server-side verification with the Google Play Developer API.
    // No verification => no grant (mirrors validate-apple-receipt).
    const verification = await verifyWithGooglePlay('com.swipess.mobile', productId, purchaseToken, isSubscription);
    if (!verification.verified) {
      return new Response(JSON.stringify({ ok: false, error: 'Purchase could not be verified' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const purchaseDate = verification.startTimeMillis
      ? new Date(Number(verification.startTimeMillis)).toISOString()
      : new Date().toISOString();
    let expiresDate: string | null = verification.expiryTimeMillis
      ? new Date(Number(verification.expiryTimeMillis)).toISOString()
      : null;
    if (isSubscription && !expiresDate) {
      if (productId.includes('monthly')) expiresDate = new Date(Date.now() + 30*24*60*60*1000).toISOString();
      else if (productId.includes('semestral')) expiresDate = new Date(Date.now() + 180*24*60*60*1000).toISOString();
      else if (productId.includes('annual')) expiresDate = new Date(Date.now() + 365*24*60*60*1000).toISOString();
    }

    const { error: upsertErr } = await supabase.from('google_play_transactions').upsert(
      {
        user_id: userId,
        product_id: productId,
        purchase_token: purchaseToken,
        order_id: clientOrderId || verification.orderId || null,
        purchase_time: purchaseDate,
        environment: 'Production',
        verified: true,
        raw: rawData || { purchaseToken, productId },
      },
      { onConflict: 'purchase_token' }
    );

    if (upsertErr) {
      console.error('Failed to record transaction', upsertErr);
      return new Response(JSON.stringify({ ok: false, error: 'Failed to record transaction' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (SUBSCRIPTION_PRODUCTS.has(productId)) {
      const { data: pkg, error: pkgErr } = await supabase
        .from('subscription_packages')
        .select('id')
        .eq('google_play_product_id', productId)
        .maybeSingle();
      if (pkgErr) throw new Error(`Package lookup failed: ${pkgErr.message}`);

      const { error: subErr } = await supabase.from('user_subscriptions').upsert(
        {
          user_id: userId,
          package_id: pkg?.id ?? undefined,
          is_active: true,
          payment_status: 'paid',
          starts_at: purchaseDate,
          expires_at: expiresDate,
        },
        { onConflict: 'user_id' }
      );
      if (subErr) throw new Error(`Subscription grant failed: ${subErr.message}`);
    } else if (TOKEN_PRODUCTS[productId]) {
      const amount = TOKEN_PRODUCTS[productId];
      const { data: pkg, error: pkgErr } = await supabase
        .from('subscription_packages')
        .select('tokens, duration_days')
        .eq('google_play_product_id', productId)
        .maybeSingle();
      if (pkgErr) throw new Error(`Package lookup failed: ${pkgErr.message}`);

      const tokenAmount = pkg?.tokens ?? amount;
      const expiryDays = pkg?.duration_days ?? 30;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiryDays);

      const { error: tokErr } = await supabase.from('tokens').insert({
        user_id: userId,
        total_activations: tokenAmount,
        remaining_activations: tokenAmount,
        activation_type: 'purchase',
        expires_at: expiresAt.toISOString(),
        notes: `Google Play IAP: ${productId}`,
      });
      if (tokErr) throw new Error(`Token grant failed: ${tokErr.message}`);
    } else if (EVENT_PROMO_PRODUCTS[productId]) {
      const days = EVENT_PROMO_PRODUCTS[productId];
      const startedAt = new Date();
      const endsAt = new Date(startedAt.getTime() + days * 24 * 60 * 60 * 1000);
      const { error: promoErr } = await supabase.from('event_promotions').insert({
        user_id: userId,
        product_id: productId,
        started_at: startedAt.toISOString(),
        ends_at: endsAt.toISOString(),
        active: true,
        original_transaction_id: purchaseToken,
      });
      if (promoErr) throw new Error(`Promo grant failed: ${promoErr.message}`);
    }

    return new Response(
      JSON.stringify({ ok: true, environment: 'Production', productId, verified: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Server error';
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
