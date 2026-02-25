import { useState, useEffect, createContext, useContext, ReactNode, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useProfileSetup } from './useProfileSetup';
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

        // Handle OAuth setup asynchronously WITHOUT blocking loading state
        if (event === 'SIGNED_IN' && session?.user) {
          const provider = session.user.app_metadata?.provider;
          const isOAuthUser = provider && provider !== 'email';

          // Only process OAuth users, and only once per user
          if (isOAuthUser && !processingOAuthRef.current && processedUserIdRef.current !== session.user.id) {
            processingOAuthRef.current = true;
            processedUserIdRef.current = session.user.id;

            // Run OAuth setup in background with timeout protection (non-blocking)
            const oauthSetupTimeout = setTimeout(() => {
              if (processingOAuthRef.current) {
                logger.warn('[Auth] OAuth setup timeout - resetting state');
                processingOAuthRef.current = false;
              }
            }, 15000); // 15 second timeout

            handleOAuthUserSetupAsync(session.user)
              .catch((error) => {
                logger.error('[Auth] OAuth setup failed:', error);
                toast({
                  title: 'Profile Setup Issue',
                  description: 'There was an issue setting up your profile. Please try refreshing the page.',
                  variant: 'destructive',
                });
              })
              .finally(() => {
                clearTimeout(oauthSetupTimeout);
                processingOAuthRef.current = false;
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
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Non-blocking OAuth user setup
  const handleOAuthUserSetupAsync = async (user: User) => {
    try {
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
      toast({
        title: 'Profile Setup Failed',
        description: 'Failed to complete your profile setup. Please try signing in again.',
        variant: 'destructive',
      });
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
          toast({
            title: "Email Already Registered",
            description: `This email is already registered as a ${existingRole.toUpperCase()} account. To use both roles, please create a separate account with a different email address.`,
            variant: "destructive"
          });
          return { error: new Error(`Email already registered with ${existingRole} role`) };
        }

        toast({
          title: "Account Already Exists",
          description: `An account with this email already exists. Please sign in instead.`,
          variant: "destructive"
        });
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

      if (data.user && !data.user.email_confirmed_at) {
        toast({
          title: "Check Your Email",
          description: "Please check your email to verify your account.",
        });
        return { error: null };
      } else if (data.user) {
        toast({
          title: "Creating your account...",
          description: "Setting up your profile.",
        });

        // Create profile
        const profileResult = await createProfileIfMissing(data.user, role);

        if (!profileResult) {
          logger.error('[Auth] Profile creation failed');
          await supabase.auth.signOut();
          toast({
            title: "Setup Failed",
            description: "Could not complete account setup. Please try again.",
            variant: "destructive"
          });
          return { error: new Error('Failed to complete account setup') };
        }

        // Invalidate role query cache to ensure fresh data
        queryClient.invalidateQueries({ queryKey: ['user-role', data.user.id] });

        // Brief wait for cache invalidation to propagate
        await new Promise(resolve => setTimeout(resolve, 200));

        toast({
          title: "Account Created!",
          description: "Loading your dashboard...",
        });

        // Navigation will be handled by Index.tsx using metadata role
        // This ensures a single navigation point and prevents race conditions
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

      toast({
        title: "Sign Up Failed",
        description: errorMessage,
        variant: "destructive"
      });
      return { error };
    }
  };

  const signIn = async (email: string, password: string, role: 'client' | 'owner') => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        logger.error('[Auth] Sign in error:', error);
        throw error;
      }

      if (data.user) {
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

        toast({
          title: "Welcome back!",
          description: "Loading your dashboard...",
        });

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

      toast({
        title: "Sign In Failed",
        description: errorMessage,
        variant: "destructive"
      });
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

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
          queryParams,
          skipBrowserRedirect: false
        }
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

      toast({
        title: "OAuth Sign In Failed",
        description: errorMessage,
        variant: "destructive"
      });
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

      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });

      // Force navigation to landing page with full page refresh
      // This ensures a clean state and shows the landing page immediately
      window.location.href = '/';
    } catch (error) {
      logger.error('[Auth] Unexpected sign out error:', error);
      toast({
        title: "Sign Out Error",
        description: "An unexpected error occurred during sign out.",
        variant: "destructive"
      });
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
