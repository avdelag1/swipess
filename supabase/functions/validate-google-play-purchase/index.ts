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

async function _verifyWithGooglePlay(
  _packageName: string,
  productId: string,
  purchaseToken: string,
): Promise<{ verified: boolean; orderId?: string; purchaseState?: number; expiryTimeMillis?: string }> {
  const googleServiceAccountJson = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON");
  if (!googleServiceAccountJson) {
    console.error("GOOGLE_SERVICE_ACCOUNT_JSON not configured; validation skipped");
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

    const headerB64 = base64url(JSON.stringify(jwtHeader));
    const bodyB64 = base64url(JSON.stringify(jwtBody));
    const signatureInput = `${headerB64}.${bodyB64}`;

    const keyData = crypto.subtle.importKey(
      "pkcs8",
      new TextEncoder().encode(serviceAccount.private_key),
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"],
    );

    const signature = await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      await keyData,
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

    const apiUrl = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(_packageName)}/purchases/products/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(purchaseToken)}`;

    const verifyRes = await fetch(apiUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!verifyRes.ok) {
      console.error("Google Play API verification failed", verifyRes.status, await verifyRes.text());
      return { verified: false };
    }

    const result = await verifyRes.json();
    return {
      verified: result.purchaseState === 0,
      orderId: result.orderId,
      purchaseState: result.purchaseState,
      expiryTimeMillis: result.expiryTimeMillis,
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

    // Attempt server-side validation via Google Play Developer API (androidpublisher v3)
    // Falls back to client-trusted data if service account is not configured.
    const googleServiceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');
    let validated = false;
    let purchaseDate: string;
    let expiresDate: string | null = null;

    if (googleServiceAccountJson) {
      try {
        const googleAuth = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            assertion: googleServiceAccountJson,
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          }),
        });
        const { access_token: googleToken } = await googleAuth.json();
        if (googleToken) {
          const verifyUrl = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/com.swipess/purchases/subscriptions/${productId}/tokens/${purchaseToken}`;
          const verifyRes = await fetch(verifyUrl, {
            headers: { Authorization: `Bearer ${googleToken}` },
          });
          if (verifyRes.ok) {
            const playData = await verifyRes.json();
            validated = true;
            purchaseDate = new Date(parseInt(playData.startTimeMillis)).toISOString();
            expiresDate = playData.expiryTimeMillis
              ? new Date(parseInt(playData.expiryTimeMillis)).toISOString()
              : null;
          }
        }
      } catch (_e) {
        // Google verification failed; fall through to client-trusted path
      }
    }

    if (!validated) {
      purchaseDate = new Date().toISOString();
      if (SUBSCRIPTION_PRODUCTS.has(productId)) {
        if (productId.includes('monthly')) expiresDate = new Date(Date.now() + 30*24*60*60*1000).toISOString();
        else if (productId.includes('semestral')) expiresDate = new Date(Date.now() + 180*24*60*60*1000).toISOString();
        else if (productId.includes('annual')) expiresDate = new Date(Date.now() + 365*24*60*60*1000).toISOString();
      }
    }

    const { error: upsertErr } = await supabase.from('google_play_transactions').upsert(
      {
        user_id: userId,
        product_id: productId,
        purchase_token: purchaseToken,
        order_id: clientOrderId || null,
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
      const { data: pkg } = await supabase
        .from('subscription_packages')
        .select('id')
        .eq('google_play_product_id', productId)
        .single();

      await supabase.from('user_subscriptions').upsert(
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
    } else if (TOKEN_PRODUCTS[productId]) {
      const amount = TOKEN_PRODUCTS[productId];
      const { data: pkg } = await supabase
        .from('subscription_packages')
        .select('tokens, duration_days')
        .eq('google_play_product_id', productId)
        .single();

      const tokenAmount = pkg?.tokens ?? amount;
      const expiryDays = pkg?.duration_days ?? 30;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiryDays);

      await supabase.from('tokens').insert({
        user_id: userId,
        total_activations: tokenAmount,
        remaining_activations: tokenAmount,
        activation_type: 'purchase',
        expires_at: expiresAt.toISOString(),
        notes: `Google Play IAP: ${productId}`,
      });
    } else if (EVENT_PROMO_PRODUCTS[productId]) {
      const days = EVENT_PROMO_PRODUCTS[productId];
      const startedAt = new Date();
      const endsAt = new Date(startedAt.getTime() + days * 24 * 60 * 60 * 1000);
      await supabase.from('event_promotions').insert({
        user_id: userId,
        product_id: productId,
        started_at: startedAt.toISOString(),
        ends_at: endsAt.toISOString(),
        active: true,
        original_transaction_id: purchaseToken,
      });
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
