import { useState, useEffect, createContext, useContext, ReactNode, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { useNavigate } from 'react-router-dom';
import { useProfileSetup, resetProfileCreationLock } from './useProfileSetup';
import { useAccountLinking } from './useAccountLinking';
import { useQueryClient } from '@tanstack/react-query';
import { logger } from '@/utils/prodLogger';


interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean; // TRUE after first auth check completes (regardless of user logged in or not)
  signUp: (email: string, password: string, role: 'client' | 'owner', name?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string, role: 'client' | 'owner') => Promise<{ error: any }>;
  signInWithOAuth: (provider: 'google', role: 'client' | 'owner') => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false); // TRUE after first auth check
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { createProfileIfMissing } = useProfileSetup();
  const { handleOAuthUserSetup: linkOAuthAccount, checkExistingAccount } = useAccountLinking();

  // Prevent duplicate OAuth setup calls
  const processingOAuthRef = useRef(false);
  const processedUserIdRef = useRef<string | null>(null);
  // Track OAuth timeout for cleanup on unmount
  const oauthTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let isMounted = true;
    let isInitializing = true;

    // Initialize auth state from Supabase session storage
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          logger.error('[Auth] Session retrieval error:', error);
        }

        if (isMounted) {
          setSession(session);
          setUser(session?.user ?? null);

          // CRITICAL: Set loading to false IMMEDIATELY after getting session
          // Profile/role setup will happen separately via Index.tsx and ProtectedRoute
          setLoading(false);
          setInitialized(true); // Mark auth as initialized
        }
      } catch (error) {
        logger.error('[Auth] Failed to initialize auth:', error);
        if (isMounted) {
          setLoading(false);
          setInitialized(true); // Still mark as initialized even on error
        }
      } finally {
        isInitializing = false;
      }
    };

    // Start initialization immediately
    initializeAuth();

    // Set up auth state listener for subsequent changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Skip processing during initial load (already handled above)
        if (isInitializing) return;

        if (!isMounted) return;

        // SPEED OF LIGHT: TOKEN_REFRESHED should NEVER trigger loading or redirects
        // Just silently update the session/user
        if (event === 'TOKEN_REFRESHED') {
          setSession(session);
          setUser(session?.user ?? null);
          // Do NOT set loading, do NOT navigate, do NOT do anything else
          return;
        }

        logger.log('[Auth] State change:', event, session?.user?.email);

        // Update state immediately
        setSession(session);
        setUser(session?.user ?? null);

        // CRITICAL: Set loading to false immediately
        // Don't wait for profile setup - that's handled by Index/ProtectedRoute
        setLoading(false);
        setInitialized(true); // Mark as initialized on any auth state change

        // Handle profile setup asynchronously on SIGNED_IN for ALL users
        if (event === 'SIGNED_IN' && session?.user) {
          // Reset profile creation lock on every fresh sign-in to prevent
          // stale lockouts from a previous failed attempt or old session
          resetProfileCreationLock(session.user.id);

          const provider = session.user.app_metadata?.provider;
          const isOAuthUser = provider && provider !== 'email';

          if (isOAuthUser && !processingOAuthRef.current && processedUserIdRef.current !== session.user.id) {
            // OAuth user setup (existing logic)
            processingOAuthRef.current = true;
            processedUserIdRef.current = session.user.id;

            oauthTimeoutRef.current = setTimeout(() => {
              if (processingOAuthRef.current) {
                logger.warn('[Auth] OAuth setup timeout - resetting state');
                processingOAuthRef.current = false;
              }
            }, 15000);

            handleOAuthUserSetupAsync(session.user)
              .catch((error) => {
                logger.error('[Auth] OAuth setup failed:', error);
                toast.error('Profile Setup Issue', { description: 'There was an issue setting up your profile. Please try refreshing the page.' });
              })
              .finally(() => {
                if (oauthTimeoutRef.current) {
                  clearTimeout(oauthTimeoutRef.current);
                  oauthTimeoutRef.current = null;
                }
                processingOAuthRef.current = false;
              });
          } else if (!isOAuthUser && processedUserIdRef.current !== session.user.id) {
            // Email user profile setup (e.g. after email confirmation click)
            // Ensures user_roles, client/owner profiles, and onboarding are set up
            processedUserIdRef.current = session.user.id;
            const metadataRole = (session.user.user_metadata?.role as 'client' | 'owner') || 'client';
            createProfileIfMissing(session.user, metadataRole).catch((err) => {
              logger.error('[Auth] Email user profile setup failed:', err);
            });
          }
        }

        // Clear processed user on sign out
        if (event === 'SIGNED_OUT') {
          processedUserIdRef.current = null;
          processingOAuthRef.current = false;
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      // Clean up OAuth timeout on unmount to prevent state updates after unmount
      if (oauthTimeoutRef.current) {
        clearTimeout(oauthTimeoutRef.current);
        oauthTimeoutRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Non-blocking OAuth user setup
  const handleOAuthUserSetupAsync = async (user: User) => {
    try {
      // CACHE RESET: Clear stale profile/role cache before OAuth profile setup
      queryClient.removeQueries({ queryKey: ['user-role'] });
      queryClient.removeQueries({ queryKey: ['profile'] });
      queryClient.removeQueries({ queryKey: ['message_activations'] });
      queryClient.removeQueries({ queryKey: ['client-profile'] });
      queryClient.removeQueries({ queryKey: ['owner-profile'] });

      // Check localStorage first, then URL params
      const pendingRole = localStorage.getItem('pendingOAuthRole') as 'client' | 'owner' | null;
      const urlParams = new URLSearchParams(window.location.search);
      const roleFromUrl = urlParams.get('role') as 'client' | 'owner' | null;

      const roleToUse = pendingRole || roleFromUrl;

      if (roleToUse) {
        // Clear pending role
        localStorage.removeItem('pendingOAuthRole');

        // Use enhanced account linking
        const linkingResult = await linkOAuthAccount(user, roleToUse);

        if (linkingResult.success) {
          // Clear URL params
          if (roleFromUrl) {
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete('role');
            window.history.replaceState({}, '', newUrl.toString());
          }

          const finalRole = linkingResult.existingProfile?.role || roleToUse;

          // Create profile if missing
          await createProfileIfMissing(user, finalRole);

          // Invalidate role cache after OAuth setup
          queryClient.invalidateQueries({ queryKey: ['user-role', user.id] });
        } else {
          logger.error('[Auth] OAuth account linking failed');
        }
      } else {
        // Try metadata role
        const role = user.user_metadata?.role as 'client' | 'owner' | undefined;
        if (role) {
          await createProfileIfMissing(user, role);
          // Invalidate role cache after profile creation
          queryClient.invalidateQueries({ queryKey: ['user-role', user.id] });
        }
      }
    } catch (error) {
      logger.error('[Auth] OAuth setup error:', error);
      toast.error('Profile Setup Failed', { description: 'Failed to complete your profile setup. Please try signing in again.' });
    }
  };

  const signUp = async (email: string, password: string, role: 'client' | 'owner', name?: string) => {
    try {
      // Check existing account (with timeout to prevent slow signup)
      let existingProfile = null;
      try {
        const checkPromise = checkExistingAccount(email);
        const timeoutPromise = new Promise<{ profile: null; hasConflict: false }>((_, reject) =>
          setTimeout(() => reject(new Error('Check timeout')), 5000)
        );
        const result = await Promise.race([checkPromise, timeoutPromise]);
        existingProfile = result.profile;
      } catch (checkError: any) {
        // Log timeout specifically so we can track if this is happening frequently
        if (checkError?.message === 'Check timeout') {
          logger.warn('[Auth] Existing account check timed out after 5s, proceeding with signup');
        } else {
          logger.warn('[Auth] Existing account check failed:', checkError?.message || checkError);
        }
      }

      if (existingProfile) {
        const existingRole = existingProfile.role;

        if (existingRole && existingRole !== role) {
          toast.error("Email Already Registered", { description: `This email is already registered as a ${existingRole.toUpperCase()} account. To use both roles, please create a separate account with a different email address.` });
          return { error: new Error(`Email already registered with ${existingRole} role`) };
        }

        toast.error("Account Already Exists", { description: `An account with this email already exists. Please sign in instead.` });
        return { error: new Error('User already registered') };
      }

      // Use current origin as fallback to support all environments (dev, staging, production)
      const redirectUrl = import.meta.env.VITE_APP_URL || window.location.origin;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            role: role,
            name: name || '',
            full_name: name || ''
          }
        }
      });

      if (error) {
        logger.error('[Auth] Sign up error:', error);
        throw error;
      }

      if (data.user) {
        // Always attempt profile creation regardless of email confirmation status.
        // The DB trigger creates a bare profile, but we need user_roles,
        // client_profiles/owner_profiles, and onboarding_completed=true.
        createProfileIfMissing(data.user, role).catch((err) => {
          logger.error('[Auth] Background profile setup failed:', err);
        });

        // If the signup returned a session, the user is already signed in
        // (email confirmation is disabled or auto-confirmed).
        // If no session, auto-sign in with the same credentials.
        if (!data.session) {
          logger.log('[Auth] No session after signup, attempting auto sign-in...');
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
          });

          if (signInError) {
            // If auto sign-in fails (e.g. email confirmation still required on server),
            // show a helpful message but don't block the flow
            logger.warn('[Auth] Auto sign-in after signup failed:', signInError.message);
            toast.success("Account Created!", { description: "Your account has been created. Please sign in to continue." });
            return { error: null };
          }

          // Auto sign-in succeeded - update local state
          if (signInData.user) {
            setUser(signInData.user);
            setSession(signInData.session);
          }
        }

        // Invalidate role query cache to ensure fresh data
        queryClient.invalidateQueries({ queryKey: ['user-role', data.user.id] });

        // Brief wait for cache invalidation to propagate
        await new Promise(resolve => setTimeout(resolve, 200));

        // Determine dashboard path from role
        const targetPath = role === 'client' ? '/client/dashboard' : '/owner/dashboard';

        // AUTO-REFRESH: Invalidate all queries to force fresh data
        queryClient.invalidateQueries();

        toast.success("Account Created!", { description: "Loading your dashboard..." });

        navigate(targetPath, { replace: true });
      }

      return { error: null };
    } catch (error: any) {
      if (import.meta.env.DEV) logger.error('[Auth] Sign up error:', error);
      let errorMessage = "Failed to create account. Please try again.";

      if (error.message?.includes('User already registered')) {
        errorMessage = "An account with this email already exists. Please sign in instead.";
      } else if (error.message?.includes('Password should be at least')) {
        errorMessage = "Password should be at least 6 characters long.";
      } else if (error.message?.includes('Invalid email')) {
        errorMessage = "Please enter a valid email address.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error("Sign Up Failed", { description: errorMessage });
      return { error };
    }
  };

  const signIn = async (email: string, password: string, role: 'client' | 'owner') => {
    try {
      // Reset profile creation lock to prevent stale lockouts from previous sessions
      resetProfileCreationLock();

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        logger.error('[Auth] Sign in error:', error);
        throw error;
      }

      if (data.user) {
        // CACHE RESET: Clear all stale profile/role data before doing anything.
        // This prevents "profile creation" errors caused by stale React Query cache
        // from a previous session or a previous app version.
        queryClient.removeQueries({ queryKey: ['user-role'] });
        queryClient.removeQueries({ queryKey: ['profile'] });
        queryClient.removeQueries({ queryKey: ['message_activations'] });
        queryClient.removeQueries({ queryKey: ['client-profile'] });
        queryClient.removeQueries({ queryKey: ['owner-profile'] });

        // Quick role check to prevent dashboard flash (max 2 seconds)
        let actualRole: 'client' | 'owner' = role;

        try {
          const roleCheckPromise = supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', data.user.id)
            .maybeSingle();

          const timeoutPromise = new Promise<null>((resolve) =>
            setTimeout(() => resolve(null), 2000)
          );

          const roleResult = await Promise.race([roleCheckPromise, timeoutPromise]);

          if (roleResult && 'data' in roleResult && roleResult.data?.role) {
            actualRole = roleResult.data.role as 'client' | 'owner';
          }
        } catch (roleCheckError) {
          // On error, use the expected role - profile setup will correct later
          logger.warn('[Auth] Quick role check failed, using expected role:', roleCheckError);
        }

        const targetPath = actualRole === 'client' ? '/client/dashboard' : '/owner/dashboard';

        // AUTO-REFRESH: Invalidate all queries to force fresh data on sign-in
        // This ensures the swipe deck and other dashboard data is refreshed
        queryClient.invalidateQueries();

        toast.success("Welcome back!", { description: "Loading your dashboard..." });

        navigate(targetPath, { replace: true });

        // Run profile setup in background (non-blocking)
        setTimeout(() => {
          createProfileIfMissing(data.user!, actualRole);
        }, 0);

        return { error: null };
      }

      return { error: null };
    } catch (error: any) {
      logger.error('[Auth] Sign in error:', error);
      let errorMessage = 'Failed to sign in. Please try again.';

      if (error.message === 'Invalid login credentials') {
        errorMessage = 'Invalid email or password. Please check your credentials and try again.';
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Please check your email and click the confirmation link before signing in.';
      } else if (error.message?.includes('Too many requests')) {
        errorMessage = 'Too many login attempts. Please wait a moment and try again.';
      } else if (error.message?.includes('Account setup incomplete')) {
        errorMessage = error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error("Sign In Failed", { description: errorMessage });
      return { error };
    }
  };

  const signInWithOAuth = async (provider: 'google', role: 'client' | 'owner') => {
    try {
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
        throw new Error('Supabase configuration is missing. Please check your environment variables.');
      }

      // Store role before OAuth redirect
      localStorage.setItem('pendingOAuthRole', role);

      const queryParams: Record<string, string> = {
        prompt: 'consent',
        access_type: 'offline',
      };

      // Use current origin as fallback to support all environments (dev, staging, production)
      const redirectUrl = import.meta.env.VITE_APP_URL || window.location.origin;

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
          queryParams: queryParams,
        },
      });

      if (error) {
        logger.error(`[Auth] ${provider} OAuth error:`, error);
        localStorage.removeItem('pendingOAuthRole');
        throw error;
      }

      return { error: null };
    } catch (error: any) {
      if (import.meta.env.DEV) logger.error(`[Auth] ${provider} OAuth error:`, error);
      localStorage.removeItem('pendingOAuthRole');

      let errorMessage = `Failed to sign in with ${provider}. Please try again.`;

      if (error.message?.includes('Supabase configuration is missing')) {
        errorMessage = error.message;
      } else if (error.message?.includes('Email link is invalid')) {
        errorMessage = 'OAuth link expired. Please try signing in again.';
      } else if (error.message?.includes('access_denied')) {
        errorMessage = `Access denied. Please grant permission to continue with ${provider}.`;
      } else if (error.message?.includes('Provider not enabled') || error.message?.includes('not enabled')) {
        errorMessage = `${provider === 'google' ? 'Google' : 'Facebook'} OAuth is not enabled in Supabase.`;
      } else if (error.message?.includes('redirect_uri_mismatch')) {
        errorMessage = 'Redirect URL configuration error.';
      } else if (error.message?.includes('invalid_client')) {
        errorMessage = 'Invalid OAuth credentials.';
      } else if (error.message?.includes('invalid_grant')) {
        errorMessage = 'Authorization grant error. Please try signing in again.';
      } else if (error.status === 400) {
        errorMessage = 'Bad OAuth request.';
      } else if (error.status === 401 || error.status === 403) {
        errorMessage = `OAuth authentication failed (${error.status}).`;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error("OAuth Sign In Failed", { description: errorMessage });
      return { error };
    }
  };

  const signOut = async () => {
    try {
      // Dispatch sign out event
      window.dispatchEvent(new CustomEvent('user-signout'));

      // Clear localStorage
      localStorage.removeItem('pendingOAuthRole');
      localStorage.removeItem('rememberMe');

      // Clear React Query cache
      queryClient.clear();

      // Clear local state FIRST to ensure UI updates immediately
      setUser(null);
      setSession(null);

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();

      if (error) {
        logger.error('[Auth] Sign out error:', error);
        // Still navigate to home even if there's an error
      }

      toast.success("Signed out", { description: "You have been signed out successfully." });

      // Force navigation to landing page with full page refresh
      // This ensures a clean state and shows the landing page immediately
      window.location.href = '/';
    } catch (error) {
      logger.error('[Auth] Unexpected sign out error:', error);
      toast.error("Sign Out Error", { description: "An unexpected error occurred during sign out." });
      // Even on error, try to redirect to home
      window.location.href = '/';
    }
  };

  const value = {
    user,
    session,
    loading,
    initialized,
    signUp,
    signIn,
    signInWithOAuth,
    signOut
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
