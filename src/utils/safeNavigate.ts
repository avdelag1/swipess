import { NavigateFunction } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';

interface SafeNavigateOptions {
  requiresAuth?: boolean;
  replace?: boolean;
  state?: any;
}

/**
 * SAFE NAVIGATION UTILITY
 *
 * Creates a navigation function that performs safety checks before navigating.
 *
 * PURPOSE:
 * - Prevents silent navigation failures when user is logged out
 * - Provides visible error messages when navigation fails
 * - Ensures consistent auth checking across all navigation
 *
 * USAGE:
 * ```typescript
 * const navigate = useNavigate();
 * const { user } = useAuth();
 * const safeNavigate = createSafeNavigate(navigate, user);
 *
 * // Navigate with auth check (default)
 * safeNavigate('/client/dashboard');
 *
 * // Navigate without auth check (e.g., to login page)
 * safeNavigate('/login', { requiresAuth: false });
 *
 * // Navigate with state
 * safeNavigate('/messages', { state: { userId: '123' } });
 * ```
 *
 * BENEFITS:
 * - Fixes "dead button" bugs where buttons do nothing
 * - Shows user-friendly error messages
 * - Prevents blank screens from failed navigation
 * - Centralizes navigation safety logic
 */
export function createSafeNavigate(
  navigate: NavigateFunction,
  user: User | null
) {
  return (path: string, options?: SafeNavigateOptions): boolean => {
    const { requiresAuth = true, replace = false, state } = options || {};

    // Auth check
    if (requiresAuth && !user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to continue.',
        variant: 'destructive',
      });
      navigate('/login', { replace: true });
      return false;
    }

    // Perform navigation
    try {
      navigate(path, { replace, state });
      return true;
    } catch (error) {
      console.error('[SafeNavigate] Navigation error:', error);
      toast({
        title: 'Navigation Failed',
        description: 'Unable to navigate. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  };
}
