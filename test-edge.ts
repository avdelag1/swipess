import { createClient } from '@supabase/supabase-js';

const url = 'https://vplgtcguxujxwrgguxqq.supabase.co';
const key = 'sb_publishable_FA0BseFSS6zM7Y8K3w8zLQ_d8BXqEuV'; // the publishable key
const supabase = createClient(url, key);

async function testEdgeFunction() {
  const { data, error } = await supabase.functions.invoke('ai-enhance-text', {
    body: { text: "Hello, I am testing.", type: "profile" },
  });

  console.log('Result Data:', data);
  console.log('Result Error:', error);
}

testEdgeFunction();
