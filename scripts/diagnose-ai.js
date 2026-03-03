/**
 * Swipess AI Diagnostic Script
 * ----------------------------
 * Tests the `ai-orchestrator` Edge Function directly from Node.js.
 * This script allows testing "inside" without a browser.
 * 
 * Usage: node scripts/diagnose-ai.js [test_query]
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Error: VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY missing in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runDiagnostic() {
    const query = process.argv[2] || "Hello Swipess Oracle, are you online? Respond with 'Ready for matches! ✨'";

    console.log('🚀 Starting AI Diagnostic...');
    console.log(`🔗 URL: ${supabaseUrl}`);
    console.log(`🤖 Query: "${query}"`);

    // 1. Create a temporary test user
    const testEmail = `diagnostic-${Date.now()}@swipess.test`;
    const testPassword = 'diagnostic-pwd-123';

    console.log(`👤 Creating temporary user: ${testEmail}...`);

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
            data: { role: 'client' }
        }
    });

    if (signUpError) {
        console.error('❌ Sign-up failed:', signUpError.message);
        return;
    }

    console.log('✅ User created (Auto-confirmed)');

    // 2. Invoke AI Orchestrator
    console.log('📡 Calling ai-orchestrator...');

    const startTime = Date.now();

    try {
        const { data, error: invokeError } = await supabase.functions.invoke('ai-orchestrator', {
            body: {
                task: 'ping',
                data: {}
            }
        });

        const duration = Date.now() - startTime;

        if (invokeError) {
            console.error('❌ AI Invocation failed:');
            console.error(invokeError);
            if (invokeError.status === 401) console.log('💡 Tip: Ensure the Edge Function supports the current auth session.');
            return;
        }

        // 3. Report Results
        console.log('\n✨ --- AI RESPONSE --- ✨');
        console.log(data?.result?.text || data?.result?.message || JSON.stringify(data, null, 2));
        console.log('-------------------------');
        console.log(`⏱️  Duration: ${duration}ms`);
        console.log(`🛡️  Provider: ${data?.provider_used || 'Unknown'}`);
        console.log('✅ Diagnostic Complete!');
    } catch (err) {
        console.error('❌ Fetch or Invocation crash:');
        console.error(err);
    }
}

runDiagnostic().catch(err => {
    console.error('💥 Critical script error:', err);
    process.exit(1);
});
