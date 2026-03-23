/* eslint-disable no-console */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(SUPABASE_URL!, SUPABASE_KEY!);

async function checkTables() {
  const tables = ['profiles', 'user_roles', 'client_profiles', 'owner_profiles', 'owner_client_preferences', 'likes', 'events', 'business_promo_submissions'];
  for (const table of tables) {
    const { error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`Table ${table}: ERROR - ${error.message}`);
    } else {
      console.log(`Table ${table}: OK`);
    }
  }
}

checkTables();
