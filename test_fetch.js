import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase
    .from('conversation_messages')
    .select('id, conversation_id, sender_id, content, message_text, message_type, attachments, is_read, read_at, created_at')
    .limit(1);
  console.log('Error:', error);
}
run();
