/**
 * Raw Fetch AI Test
 * -----------------
 * Bypasses supabase-js to see exact response details.
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function testRaw() {
    const url = `${supabaseUrl}/functions/v1/ai-orchestrator?task=ping`;
    console.log(`🌐 Fetching: ${url}`);

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseAnonKey
            }
        });

        console.log(`📊 Status: ${response.status} ${response.statusText}`);
        console.log(`📝 Headers:`, Object.fromEntries(response.headers.entries()));

        const text = await response.text();
        console.log(`📄 Body: ${text}`);

    } catch (err) {
        console.error('💥 Fetch Error:', err);
    }
}

testRaw();
