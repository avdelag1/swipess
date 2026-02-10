import { supabase } from '@/integrations/supabase/client';

interface OAuthDiagnostics {
  googleEnabled: boolean;
  facebookEnabled: boolean;
  googleConfigured: boolean;
  facebookConfigured: boolean;
  redirectUrlConfigured: boolean;
  siteUrlConfigured: boolean;
  sessionStorageAvailable: boolean;
  localStorageAvailable: boolean;
  sessionPersistenceEnabled: boolean;
  errors: string[];
  warnings: string[];
  recommendations: string[];
}

/**
 * Diagnostic tool to check OAuth configuration status
 * Run this to identify issues with Google/Facebook OAuth
 */
export async function diagnoseOAuthSetup(): Promise<OAuthDiagnostics> {
  const diagnostics: OAuthDiagnostics = {
    googleEnabled: false,
    facebookEnabled: false,
    googleConfigured: false,
    facebookConfigured: false,
    redirectUrlConfigured: false,
    siteUrlConfigured: false,
    sessionStorageAvailable: false,
    localStorageAvailable: false,
    sessionPersistenceEnabled: false,
    errors: [],
    warnings: [],
    recommendations: [],
  };

  try {
    // Check session persistence and storage availability
    try {
      localStorage.setItem('__test__', 'test');
      const testValue = localStorage.getItem('__test__');
      diagnostics.localStorageAvailable = testValue === 'test';
      localStorage.removeItem('__test__');

      if (!diagnostics.localStorageAvailable) {
        diagnostics.errors.push('localStorage is not working properly. Session persistence will fail.');
        diagnostics.recommendations.push('Check browser settings: Private/Incognito mode may disable localStorage. Clear browser cache and cookies.');
      }
    } catch (e) {
      diagnostics.localStorageAvailable = false;
      diagnostics.errors.push('localStorage is not accessible. This will prevent session persistence.');
      diagnostics.recommendations.push('Enable localStorage in browser settings or check if you\'re in private/incognito mode.');
    }

    try {
      sessionStorage.setItem('__test__', 'test');
      const testValue = sessionStorage.getItem('__test__');
      diagnostics.sessionStorageAvailable = testValue === 'test';
      sessionStorage.removeItem('__test__');
    } catch (e) {
      diagnostics.sessionStorageAvailable = false;
      diagnostics.warnings.push('sessionStorage is not accessible.');
    }

    // Supabase is configured with persistSession: true and localStorage
    diagnostics.sessionPersistenceEnabled = diagnostics.localStorageAvailable;
    if (!diagnostics.sessionPersistenceEnabled) {
      diagnostics.errors.push('Session persistence is not working due to localStorage issues.');
    }
    // Test Google OAuth
    try {
      const { error: googleError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          skipBrowserRedirect: true, // Don't actually redirect
        },
      });

      if (!googleError) {
        diagnostics.googleEnabled = true;
        diagnostics.googleConfigured = true;
      } else {
        if (googleError.message?.includes('not enabled') || googleError.message?.includes('Provider not enabled')) {
          diagnostics.errors.push('Google OAuth provider is not enabled in Supabase dashboard');
          diagnostics.recommendations.push(
            'Enable Google OAuth in Supabase dashboard under Authentication > Providers'
          );
        } else if (googleError.message?.includes('credentials')) {
          diagnostics.googleEnabled = true;
          diagnostics.errors.push('Google OAuth credentials are missing or invalid');
          diagnostics.recommendations.push(
            'Add Google Client ID and Secret in Supabase Auth Providers settings'
          );
        } else {
          diagnostics.warnings.push(`Google OAuth check returned: ${googleError.message}`);
        }
      }
    } catch (e: any) {
      diagnostics.warnings.push(`Google OAuth test failed: ${e.message}`);
    }

    // Test Facebook OAuth
    try {
      const { error: facebookError } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: window.location.origin,
          skipBrowserRedirect: true, // Don't actually redirect
        },
      });

      if (!facebookError) {
        diagnostics.facebookEnabled = true;
        diagnostics.facebookConfigured = true;
      } else {
        if (facebookError.message?.includes('not enabled') || facebookError.message?.includes('Provider not enabled')) {
          diagnostics.errors.push('Facebook OAuth provider is not enabled in Supabase dashboard');
          diagnostics.recommendations.push(
            'Enable Facebook OAuth in Supabase dashboard under Authentication > Providers'
          );
        } else if (facebookError.message?.includes('credentials')) {
          diagnostics.facebookEnabled = true;
          diagnostics.errors.push('Facebook OAuth credentials are missing or invalid');
          diagnostics.recommendations.push(
            'Add Facebook App ID and Secret in Supabase Auth Providers settings'
          );
        } else {
          diagnostics.warnings.push(`Facebook OAuth check returned: ${facebookError.message}`);
        }
      }
    } catch (e: any) {
      diagnostics.warnings.push(`Facebook OAuth test failed: ${e.message}`);
    }

    // Check current URL configuration
    const currentUrl = window.location.origin;

    diagnostics.warnings.push(
      `Current URL: ${currentUrl}. Ensure this is added to Supabase redirect URLs.`
    );

    // Add general recommendations
    if (!diagnostics.googleConfigured || !diagnostics.facebookConfigured) {
      diagnostics.recommendations.push(
        'Follow the complete setup guide in OAUTH_SETUP_GUIDE.md'
      );
    }

    if (diagnostics.errors.length === 0 && diagnostics.warnings.length === 0) {
      diagnostics.recommendations.push('OAuth configuration appears to be correct!');
    }

  } catch (error: any) {
    diagnostics.errors.push(`Diagnostic failed: ${error.message}`);
  }

  return diagnostics;
}

/**
 * Run OAuth diagnostics and display results in console
 */
export async function runOAuthDiagnostics() {
  const results = await diagnoseOAuthSetup();


  // Results contain errors, warnings, and recommendations arrays
  // that can be inspected programmatically
  return results;
}

// FIX: Only expose globally in development mode (security)
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as any).runOAuthDiagnostics = runOAuthDiagnostics;
  (window as any).diagnoseOAuthSetup = diagnoseOAuthSetup;
}
