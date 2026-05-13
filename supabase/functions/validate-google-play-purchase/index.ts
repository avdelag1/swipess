import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
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

// ─── Google OAuth2 via Service Account ──────────────────────────────────────

async function getGoogleAccessToken(serviceAccountJsonB64: string): Promise<string> {
  const sa = JSON.parse(atob(serviceAccountJsonB64));
  const now = Math.floor(Date.now() / 1000);
  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const claim = btoa(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/androidpublisher',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const unsigned = `${header}.${claim}`;
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToDer(sa.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const jwt = `${unsigned}.${sigB64}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) throw new Error('Failed to get Google access token');
  return tokenData.access_token;
}

function pemToDer(pem: string): ArrayBuffer {
  const b64 = pem.replace(/-----[^-]+-----/g, '').replace(/\s/g, '');
  const binary = atob(b64);
  const buf = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) buf[i] = binary.charCodeAt(i);
  return buf.buffer;
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

    // Identify caller
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

    // Google Play gives us purchaseToken, productId, and optionally orderId
    const { purchaseToken, productId, orderId, rawData } = await req.json();
    if (!purchaseToken || !productId) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing purchaseToken or productId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Google Play Developer API verification ────────────────────────────────
    // Requires GOOGLE_SERVICE_ACCOUNT_JSON env var (base64-encoded service account JSON)
    // and GOOGLE_PLAY_PACKAGE_NAME env var (e.g. "com.swipess.app")
    const serviceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');
    const packageName = Deno.env.get('GOOGLE_PLAY_PACKAGE_NAME');

    if (!serviceAccountJson || !packageName) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Google Play validation not configured on server. Purchase rejected.' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const accessToken = await getGoogleAccessToken(serviceAccountJson);
    const isSubscription = SUBSCRIPTION_PRODUCTS.has(productId);
    const playApiUrl = isSubscription
      ? `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/subscriptions/${productId}/tokens/${purchaseToken}`
      : `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/products/${productId}/tokens/${purchaseToken}`;

    const playRes = await fetch(playApiUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!playRes.ok) {
      const errBody = await playRes.text();
      console.error('Google Play API error:', playRes.status, errBody);
      return new Response(
        JSON.stringify({ ok: false, error: 'Purchase could not be verified with Google Play.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const playData = await playRes.json();

    // For one-time products: purchaseState must be 0 (purchased)
    if (!isSubscription && playData.purchaseState !== 0) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Purchase not in purchased state.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For subscriptions: paymentState must be 1 (received) and not expired
    if (isSubscription) {
      if (playData.paymentState !== 1) {
        return new Response(
          JSON.stringify({ ok: false, error: 'Subscription payment not received.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (playData.expiryTimeMillis && Number(playData.expiryTimeMillis) < Date.now()) {
        return new Response(
          JSON.stringify({ ok: false, error: 'Subscription already expired.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const purchaseDate = new Date().toISOString();
    let expiresDate: string | null = null;

    if (isSubscription && playData.expiryTimeMillis) {
      expiresDate = new Date(Number(playData.expiryTimeMillis)).toISOString();
    } else if (isSubscription) {
      // Fallback if API doesn't return expiry (shouldn't happen in production)
      if (productId.includes('monthly')) expiresDate = new Date(Date.now() + 30*24*60*60*1000).toISOString();
      if (productId.includes('semestral')) expiresDate = new Date(Date.now() + 180*24*60*60*1000).toISOString();
      if (productId.includes('annual')) expiresDate = new Date(Date.now() + 365*24*60*60*1000).toISOString();
    }

    // Idempotent record
    await supabase.from('google_play_transactions').upsert(
      {
        user_id: userId,
        product_id: productId,
        purchase_token: purchaseToken,
        order_id: orderId || null,
        purchase_time: purchaseDate,
        environment: 'Production',
        raw: rawData || { purchaseToken, productId },
      },
      { onConflict: 'purchase_token' }
    );

    // Grant entitlement
    if (SUBSCRIPTION_PRODUCTS.has(productId)) {
      await supabase
        .from('subscriptions')
        .upsert(
          {
            user_id: userId,
            plan_id: productId,
            status: 'active',
            current_period_end: expiresDate,
            provider: 'google_play',
          },
          { onConflict: 'user_id' }
        );
    } else if (TOKEN_PRODUCTS[productId]) {
      const amount = TOKEN_PRODUCTS[productId];
      await supabase.from('message_activations').insert({
        user_id: userId,
        activations_remaining: amount,
        package_id: productId,
        source: 'google_play_iap',
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
        original_transaction_id: purchaseToken, // Using token as a unique identifier
      });
    }

    return new Response(
      JSON.stringify({ ok: true, environment: 'Production', productId }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message ?? 'Server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
