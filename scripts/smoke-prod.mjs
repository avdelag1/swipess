#!/usr/bin/env node
/**
 * Production smoke checks (anon key) — run after deploy.
 * Usage: node scripts/smoke-prod.mjs
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m && !process.env[m[1].trim()]) {
      process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  }
}

const url = process.env.VITE_SUPABASE_URL || 'https://vplgtcguxujxwrgguxqq.supabase.co';
const key =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_FA0BseFSS6zM7Y8K3w8zLQ_d8BXqEuV';

const supabase = createClient(url, key);
const checks = [];

function pass(name, detail = '') {
  checks.push({ name, ok: true, detail });
  console.log(`✓ ${name}${detail ? ` — ${detail}` : ''}`);
}

function fail(name, detail = '') {
  checks.push({ name, ok: false, detail });
  console.error(`✗ ${name}${detail ? ` — ${detail}` : ''}`);
}

async function rpcExists(name, args = {}) {
  const { error } = await supabase.rpc(name, args);
  if (!error) return true;
  const msg = error.message || '';
  if (msg.includes('does not exist') || error.code === '42883') return false;
  // Auth/validation errors mean the function exists
  return true;
}

async function main() {
  if (process.env.CI === 'true' || process.env.CI === '1' || process.env.CI === 'TRUE') {
    console.log('Skipping smoke test on CI environment');
    return;
  }

  console.log('Swipess production smoke test\n');

  const { count: listingCount, error: listingErr } = await supabase
    .from('listings')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  if (listingErr) fail('Active listings', listingErr.message);
  else pass('Active listings', `${listingCount ?? 0} rows`);

  const { count: gpsCount, error: gpsErr } = await supabase
    .from('listings')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)
    .not('latitude', 'is', null)
    .not('longitude', 'is', null);

  if (gpsErr) fail('Listings with GPS', gpsErr.message);
  else pass('Listings with GPS', `${gpsCount ?? 0} / ${listingCount ?? 0}`);

  const rpcs = [
    'get_passport_map_listings',
    'get_passport_map_profiles',
    'get_smart_listings',
    'get_smart_clients',
  ];

  for (const rpc of rpcs) {
    const args =
      rpc === 'get_smart_listings'
        ? { p_user_id: '00000000-0000-0000-0000-000000000000', p_limit: 1, p_offset: 0 }
        : rpc === 'get_smart_clients'
          ? { p_user_id: '00000000-0000-0000-0000-000000000000', p_limit: 1, p_offset: 0 }
          : rpc === 'get_passport_map_listings'
            ? { p_user_lat: 20.21, p_user_lon: -87.47, p_radius_km: 50, p_limit: 5 }
            : { p_user_lat: 20.21, p_user_lon: -87.47, p_radius_km: 50, p_limit: 5 };

    const { data, error } = await supabase.rpc(rpc, args);
    const missing =
      error &&
      (error.code === '42883' ||
        /does not exist/i.test(error.message || '') ||
        /could not find the function/i.test(error.message || ''));
    if (missing) {
      fail(`RPC ${rpc}`, error.message?.slice(0, 80) || 'missing');
    } else if (error) {
      pass(`RPC ${rpc}`, `callable (${error.message?.slice(0, 50) || 'ok'})`);
    } else {
      const n = Array.isArray(data) ? data.length : 0;
      pass(`RPC ${rpc}`, `${n} rows returned`);
    }
  }

  const tokenRpcs = ['rpc_grant_welcome_tokens', 'rpc_get_user_tokens'];
  for (const rpc of tokenRpcs) {
    const exists = await rpcExists(rpc, rpc === 'rpc_grant_welcome_tokens' ? { p_has_referral: false } : {});
    if (exists) pass(`RPC ${rpc}`, 'exists');
    else fail(`RPC ${rpc}`, 'missing');
  }

  const failed = checks.filter((c) => !c.ok);
  console.log(`\n${checks.length - failed.length}/${checks.length} passed`);
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});