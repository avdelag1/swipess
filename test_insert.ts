import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase
        .from('user_reports')
        .insert({
          reporter_id: '99999999-9999-9999-9999-999999999999',
          reported_user_id: '88888888-8888-8888-8888-888888888888',
          reported_listing_id: null,
          report_type: 'other',
          report_category: 'user_profile',
          description: 'test',
          evidence_urls: [],
          status: 'pending',
        })
        .select()
        .single();
  console.log("Result:", error || data);
}
test();
