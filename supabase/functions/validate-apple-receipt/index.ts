import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const ALLOWED_ORIGIN = '*';
const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const PROD_URL = 'https://buy.itunes.apple.com/verifyReceipt';
const SANDBOX_URL = 'https://sandbox.itunes.apple.com/verifyReceipt';

const SUBSCRIPTION_PRODUCTS = new Set([
  'Swipess.plus.monthly.v3',
  'Swipess.plus.semestral.v3',
  'Swipess.plus.annual.v3',
]);

const TOKEN_PRODUCTS: Record<string, number> = {
  'Swipess.tokens.20.v2': 20,
  'Swipess.tokens.50.v2': 50,
  'Swipess.tokens.100.v2': 100,
  'Swipess.tokens.150.v2': 150,
};

/** Event promotion durations in days, keyed by Apple product id. */
const EVENT_PROMO_PRODUCTS: Record<string, number> = {
  'Swipess.promo.event.week.v3': 7,
  'Swipess.promo.event.month.v3': 30,
  'Swipess.promo.event.quarter.v3': 90,
};

async function verify(receipt: string, sharedSecret: string) {
  const body = JSON.stringify({
    'receipt-data': receipt,
    password: sharedSecret,
    'exclude-old-transactions': true,
  });

  let res = await fetch(PROD_URL, { method: 'POST', body });
  let json: any = await res.json();
  if (json.status === 21007) {
    res = await fetch(SANDBOX_URL, { method: 'POST', body });
    json = await res.json();
    json.environment = 'Sandbox';
  } else {
    json.environment = json.environment ?? 'Production';
  }
  return json;
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

    const { receipt, productId, transactionId } = await req.json();
    if (!receipt || !productId) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing receipt or productId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sharedSecret = Deno.env.get('APPLE_SHARED_SECRET');
    if (!sharedSecret) {
      return new Response(JSON.stringify({ ok: false, error: 'APPLE_SHARED_SECRET not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const verified = await verify(receipt, sharedSecret);
    if (verified.status !== 0) {
      return new Response(JSON.stringify({ ok: false, error: `Apple status ${verified.status}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find latest transaction for this product
    const allTx: any[] = [
      ...(verified.latest_receipt_info ?? []),
      ...(verified.receipt?.in_app ?? []),
    ];
    const tx = allTx
      .filter((t) => t.product_id === productId)
      .sort((a, b) => Number(b.purchase_date_ms) - Number(a.purchase_date_ms))[0];

    if (!tx) {
      return new Response(JSON.stringify({ ok: false, error: 'Transaction not found in receipt' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const originalTxId = tx.original_transaction_id ?? tx.transaction_id;
    const purchaseDate = new Date(Number(tx.purchase_date_ms)).toISOString();
    const expiresDate = tx.expires_date_ms
      ? new Date(Number(tx.expires_date_ms)).toISOString()
      : null;

    // Idempotent record of the transaction
    const { error: txErr } = await supabase.from('apple_transactions').upsert(
      {
        user_id: userId,
        product_id: productId,
        original_transaction_id: originalTxId,
        transaction_id: tx.transaction_id ?? transactionId ?? null,
        purchase_date: purchaseDate,
        expires_date: expiresDate,
        environment: verified.environment,
        raw: tx,
      },
      { onConflict: 'original_transaction_id' }
    );
    if (txErr) throw new Error(`Transaction record failed: ${txErr.message}`);

    // Look up package from DB to get the integer ID and attributes
    const { data: pkg, error: pkgErr } = await supabase
      .from('subscription_packages')
      .select('id, tokens, duration_days')
      .eq('apple_product_id', productId)
      .maybeSingle();
    if (pkgErr) throw new Error(`Package lookup failed: ${pkgErr.message}`);

    // Grant entitlement
    if (SUBSCRIPTION_PRODUCTS.has(productId)) {
      const { error: subErr } = await supabase
        .from('user_subscriptions')
        .upsert(
          {
            user_id: userId,
            package_id: pkg?.id,
            is_active: expiresDate && new Date(expiresDate) > new Date() ? true : false,
            payment_status: 'paid',
            starts_at: purchaseDate,
            expires_at: expiresDate,
          },
          { onConflict: 'user_id' }
        );
      if (subErr) throw new Error(`Subscription grant failed: ${subErr.message}`);
    } else if (TOKEN_PRODUCTS[productId]) {
      const amount = pkg?.tokens ?? TOKEN_PRODUCTS[productId];
      const expiryDays = pkg?.duration_days ?? 30;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiryDays);

      const { error: tokErr } = await supabase.from('tokens').insert({
        user_id: userId,
        total_activations: amount,
        remaining_activations: amount,
        activation_type: 'purchase',
        expires_at: expiresAt.toISOString(),
        notes: `Apple IAP: ${productId}`,
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
        original_transaction_id: originalTxId,
      });
      if (promoErr) throw new Error(`Promo grant failed: ${promoErr.message}`);
    }

    return new Response(
      JSON.stringify({ ok: true, environment: verified.environment, productId }),
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
