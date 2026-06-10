import { createClient } from '@supabase/supabase-js';

const url = 'https://vplgtcguxujxwrgguxqq.supabase.co';
const key = 'sb_publishable_FA0BseFSS6zM7Y8K3w8zLQ_d8BXqEuV'; // the publishable key

const supabase = createClient(url, key);

async function test() {
  const { data, error } = await supabase.from('client_profiles').insert({
    user_id: '00000000-0000-0000-0000-000000000000',
    name: 'Test',
  });

  console.log('Result:', JSON.stringify(error, null, 2));
}

test();
