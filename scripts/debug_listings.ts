
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkListings() {
  const { data, error } = await supabase
    .from('listings')
    .select('id, owner_id, status, is_active, title')
    .limit(10);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Recent Listings:', data);

  const { count, error: _countError } = await supabase
    .from('listings')
    .select('*', { count: 'exact', head: true });

  console.log('Total Listings count:', count);
}

checkListings();
