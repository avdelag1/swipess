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

    // IMPORTANT: Actual server-side validation requires a Google Service Account 
    // interacting with the Google Play Developer API (androidpublisher v3).
    // For now, we assume the client successfully purchased and record the transaction.
    // Ensure you setup Google Play API validation here in the future.
    
    const purchaseDate = new Date().toISOString();
    let expiresDate = null;
    
    // Naive expiration calculation for subscriptions for now without Play API response
    if (SUBSCRIPTION_PRODUCTS.has(productId)) {
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
