#!/usr/bin/env node
/**
 * APPLE SIGN-IN CLIENT SECRET GENERATOR
 * ======================================
 * Generates the JWT client secret required by Supabase for Apple OAuth.
 *
 * Apple requires a JWT signed with ES256 using your .p8 private key.
 * This JWT is what Supabase calls the "Secret Key (for OAuth)".
 *
 * PREREQUISITES:
 *   1. npm install jsonwebtoken   (run in this project root)
 *   2. Fill in your Apple Developer credentials below
 *   3. Paste your .p8 key content below (between the BEGIN/END markers)
 *
 * USAGE:
 *   node execution/generate_apple_secret.js
 *
 * The output JWT should be pasted into Supabase Dashboard →
 *   Authentication → Providers → Apple → Secret Key (for OAuth)
 *
 * NOTE: Apple client secrets expire after max 6 months.
 *       Re-run this script every 6 months and update Supabase.
 */

const jwt = require('jsonwebtoken');

// ═══════════════════════════════════════════════════════════════
//  🔧 FILL THESE IN FROM YOUR APPLE DEVELOPER ACCOUNT
// ═══════════════════════════════════════════════════════════════

// 1. TEAM ID — Apple Developer → Account → Membership → Team ID
//    Example: "6WYW52MXDF" (10-character alphanumeric string)
const TEAM_ID = "6WYW52MXDF";

// 2. KEY ID — Apple Developer → Keys → "APPLE LOGING" key
const KEY_ID = "HWYG5MTPZ6";

// 3. SERVICE ID (Client ID for web OAuth)
//    For web Sign in with Apple, you need a "Services ID" from Apple Developer.
//    Go to: Identifiers → "+" → Services IDs → create one (e.g. "com.swipess.auth")
//    Then enable "Sign in with Apple" on it and add the Supabase callback URL.
//    ⚠️  UPDATE THIS once you create the Service ID!
const SERVICE_ID = "com.swipess.app"; // Using App ID temporarily to generate code and verify. MUST update to Service ID for web.

// 4. YOUR .p8 PRIVATE KEY — Paste the ENTIRE content of your .p8 file
//    (including the -----BEGIN PRIVATE KEY----- and -----END PRIVATE KEY----- lines)
//    You downloaded this file when you created the key in Apple Developer → Keys
const PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgiUfkDywWRjP7kNuj
EUUR1iuDXlygaVPyuzdL+Kxnmb+gCgYIKoZIzj0DAQehRANCAARqiueyTJV8Dm4s
sa3xQDlVCY2fEnXory4bQzdXbezhGlxEg0BOYKOzQ0tdMBH/uaTp/iNHFe3c3V+H
LTKu8+kr
-----END PRIVATE KEY-----`;

// ═══════════════════════════════════════════════════════════════
//  🚀 GENERATION (don't modify below)
// ═══════════════════════════════════════════════════════════════

// Validate inputs
const errors = [];
if (!KEY_ID || KEY_ID === "PASTE_YOUR_KEY_ID_HERE") {
  errors.push("❌ KEY_ID is not set. Find it at https://developer.apple.com/account/resources/authkeys/list");
}
if (SERVICE_ID === "PASTE_YOUR_SERVICE_ID_HERE") {
  errors.push("❌ SERVICE_ID is not set. Find it at Apple Developer → Identifiers → Services IDs");
}
if (!TEAM_ID || TEAM_ID.length !== 10) {
  errors.push(`❌ TEAM_ID "${TEAM_ID}" looks invalid. Should be 10 alphanumeric characters.`);
}
if (!PRIVATE_KEY.includes("BEGIN PRIVATE KEY")) {
  errors.push("❌ PRIVATE_KEY doesn't look like a valid .p8 key. Include the BEGIN/END markers.");
}

if (errors.length > 0) {
  console.error("\n🚫 Configuration errors:\n");
  errors.forEach(e => console.error("  " + e));
  console.error("\n📖 Instructions:");
  console.error("  1. Go to https://developer.apple.com/account");
  console.error("  2. Find your Team ID under Membership");
  console.error("  3. Find your Key ID under Keys → Sign in with Apple key");
  console.error("  4. Find/create your Service ID under Identifiers → Services IDs");
  console.error("  5. Update this script with those values and re-run\n");
  process.exit(1);
}

// Generate a JWT valid for 6 months (maximum Apple allows)
const now = Math.floor(Date.now() / 1000);
const sixMonthsInSeconds = 15777000; // ~6 months

const payload = {
  iss: TEAM_ID,
  iat: now,
  exp: now + sixMonthsInSeconds,
  aud: "https://appleid.apple.com",
  sub: SERVICE_ID,
};

const headers = {
  algorithm: "ES256",
  header: {
    alg: "ES256",
    kid: KEY_ID,
  },
};

try {
  const clientSecret = jwt.sign(payload, PRIVATE_KEY, headers);

  console.log("\n✅ Apple Client Secret JWT generated successfully!\n");
  console.log("═══════════════════════════════════════════════════\n");
  console.log(clientSecret);
  console.log("\n═══════════════════════════════════════════════════\n");
  console.log("📋 NEXT STEPS:");
  console.log("  1. Copy the JWT above (the long string between the lines)");
  console.log("  2. Go to Supabase Dashboard → Authentication → Providers → Apple");
  console.log("  3. Paste it in the 'Secret Key (for OAuth)' field");
  console.log("  4. Click Save");
  console.log("");
  console.log(`⏰ This secret EXPIRES on: ${new Date((now + sixMonthsInSeconds) * 1000).toISOString().split('T')[0]}`);
  console.log("   Set a reminder to re-run this script before that date!\n");
} catch (err) {
  console.error("\n❌ Failed to generate JWT:", err.message);
  console.error("\n🔍 Common causes:");
  console.error("  - Invalid .p8 key content (make sure you pasted the complete key)");
  console.error("  - Missing jsonwebtoken package (run: npm install jsonwebtoken)");
  process.exit(1);
}
