import { createClient } from '@supabase/supabase-js';

const url = 'https://vplgtcguxujxwrgguxqq.supabase.co';
const key = 'sb_publishable_FA0BseFSS6zM7Y8K3w8zLQ_d8BXqEuV'; // the publishable key
const supabase = createClient(url, key);

async function testQuery() {
  const { data, error } = await supabase.from('expert_knowledge').select('id').limit(1);
  console.log('Error:', JSON.stringify(error));
}

testQuery();
