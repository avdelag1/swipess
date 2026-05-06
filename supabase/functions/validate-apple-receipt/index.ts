import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const PROD_URL = 'https://buy.itunes.apple.com/verifyReceipt';
const SANDBOX_URL = 'https://sandbox.itunes.apple.com/verifyReceipt';

const SUBSCRIPTION_PRODUCTS = new Set([
  'Swipess.premium.monthly',
  'Swipess.premium.semi_annual',
  'Swipess.premium.yearly',
]);

const TOKEN_PRODUCTS: Record<string, number> = {
  'Swipess.tokens.20': 20,
  'Swipess.tokens.50': 50,
  'Swipess.tokens.100': 100,
  'Swipess.tokens.150': 150,
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

    // Idempotent record
    await supabase.from('apple_transactions').upsert(
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

    // Grant entitlement
    if (SUBSCRIPTION_PRODUCTS.has(productId)) {
      await supabase
        .from('subscriptions')
        .upsert(
          {
            user_id: userId,
            plan_id: productId,
            status: expiresDate && new Date(expiresDate) > new Date() ? 'active' : 'expired',
            current_period_end: expiresDate,
            provider: 'apple',
          },
          { onConflict: 'user_id' }
        );
    } else if (TOKEN_PRODUCTS[productId]) {
      const amount = TOKEN_PRODUCTS[productId];
      await supabase.from('message_activations').insert({
        user_id: userId,
        activations_remaining: amount,
        package_id: productId,
        source: 'apple_iap',
      });
    }

    return new Response(
      JSON.stringify({ ok: true, environment: verified.environment, productId }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message ?? 'Server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});