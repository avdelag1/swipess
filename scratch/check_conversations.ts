
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConversations() {
  const { data: conversations, error: convError } = await supabase
    .from('conversations')
    .select('*')
    .limit(10);

  if (convError) {
    console.error('Error fetching conversations:', convError);
    return;
  }

  console.log('Sample Conversations:', conversations);

  for (const conv of conversations || []) {
    const { data: profiles, error: profError } = await supabase
      .from('profiles')
      .select('user_id, full_name')
      .in('user_id', [conv.client_id, conv.owner_id]);
    
    console.log(`Conv ${conv.id} profiles:`, profiles, profError);
  }
}

checkConversations();
