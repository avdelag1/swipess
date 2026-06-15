const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vplgtcguxujxwrgguxqq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_FA0BseFSS6zM7Y8K3w8zLQ_d8BXqEuV';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function signUp() {
  console.log("Signing up...");
  const { data, error } = await supabase.auth.signUp({
    email: 'applereview@swipess.com',
    password: 'Apple123.',
  });
  
  if (error) {
    console.error("Error:", error.message);
  } else {
    console.log("Success! User ID:", data.user?.id);
  }
}

signUp();
