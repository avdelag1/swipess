
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vplgtcguxujxwrgguxqq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwbGd0Y2d1eHVqeHdyZ2d1eHFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwMDI5MDIsImV4cCI6MjA2MzU3ODkwMn0.-TzSQ-nDho4J6TftVF4RNjbhr5cKbknQxxUT-AaSIJU';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testAi() {
  console.log('🚀 TESTING PRODUCTION AI ORCHESTRATOR...');
  console.log('Project:', SUPABASE_URL);

  try {
    const { data, error } = await supabase.functions.invoke('ai-orchestrator', {
      body: {
        task: 'chat',
        data: {
          query: 'Who are you and what model are you using?',
          userName: 'OwnerTest',
          messages: []
        }
      }
    });

    if (error) {
      console.error('❌ BACKEND ERROR:', error);
    } else {
      console.log('✅ BACKEND SUCCESS!');
      console.log('-----------------------------------');
      console.log('AI RESPONSE:', data.result?.text || data.result?.message);
      console.log('MODEL USED:', data.model || 'Unknown (Check edge function code)');
      console.log('-----------------------------------');
    }
  } catch (err) {
    console.error('❌ NETWORK ERROR:', err.message);
  }
}

testAi();
