
import { createClient } from '@supabase/supabase-client';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkListings() {
  console.log('Checking listings in database...');
  
  // Fetch a few listings to see status and owner
  const { data, error } = await supabase
    .from('listings')
    .select('id, title, status, category, owner_id, created_at')
    .limit(10)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching listings:', error);
    return;
  }

  console.log('Recent 10 listings:');
  console.table(data);

  // Check if we can see listings from multiple owners
  const owners = new Set(data.map(l => l.owner_id));
  console.log(`Found listings from ${owners.size} different owners.`);
  
  if (owners.size === 1) {
    console.warn('WARNING: All visible listings belong to the same owner. This might indicate RLS is on and we are only seeing our own listings, OR only one user has uploaded.');
  }
}

checkListings();
