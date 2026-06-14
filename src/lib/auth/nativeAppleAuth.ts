/**
 * Native "Sign in with Apple" for iOS (Capacitor).
 *
 * The web OAuth redirect flow does NOT work inside a Capacitor WKWebView and
 * Apple App Store Review Guideline 4.8 requires a native Sign in with Apple
 * when the app offers any third-party login. This module performs the real
 * native authorization and returns an identity token that Supabase can
 * exchange for a session via `auth.signInWithIdToken`.
 *
 * Nonce handling (replay protection):
 *   1. generate a random raw nonce
 *   2. pass its SHA-256 hash to Apple (Apple embeds the hash in the token)
 *   3. pass the RAW nonce to Supabase, which re-hashes and compares
 */
// Must match the iOS bundle identifier and be listed as an authorized
// client id on the Apple provider in the Supabase dashboard.
const APPLE_BUNDLE_ID = 'com.swipess.mobile';

export function isNativeAppleAvailable(): boolean {
  // TEMPORARY BYPASS: Since you are on a Personal Team (free account) and cannot add 
  // the "Sign In with Apple" capability in Xcode, we force this to return false. 
  // This tells the app to use the web-based Apple Login instead of the native one, 
  // bypassing Xcode entirely so you can test!
  return false; 
  
  // Original code:
  // return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';
}

function generateRawNonce(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

export interface NativeAppleCredential {
  identityToken: string;
  rawNonce: string;
  /** Apple only returns the name on the very first authorization. */
  fullName: string | null;
}

/** Thrown-error code Apple uses when the user dismisses the sheet. */
export function isUserCancellation(err: unknown): boolean {
  const e = err as { code?: string | number; message?: string } | undefined;
  const code = String(e?.code ?? '');
  const msg = String(e?.message ?? err ?? '');
  // ASAuthorizationError.canceled == 1001
  return code === '1001' || /cancel/i.test(msg);
}

export async function performNativeAppleSignIn(): Promise<NativeAppleCredential> {
  // Dynamic import keeps the native plugin out of the web bundle.
  const { SignInWithApple } = await import('@capacitor-community/apple-sign-in');

  const rawNonce = generateRawNonce();
  const hashedNonce = await sha256Hex(rawNonce);

  const result = await SignInWithApple.authorize({
    clientId: APPLE_BUNDLE_ID,
    // Required by the plugin's type but unused for the native flow.
    redirectURI: 'https://swipess.com/',
    scopes: 'email name',
    nonce: hashedNonce,
  });

  const identityToken = result.response?.identityToken;
  if (!identityToken) {
    throw new Error('Apple did not return an identity token');
  }

  const given = result.response?.givenName ?? '';
  const family = result.response?.familyName ?? '';
  const fullName = [given, family].filter(Boolean).join(' ').trim() || null;

  return { identityToken, rawNonce, fullName };
}
