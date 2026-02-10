import { useState } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/prodLogger';

interface DeleteAccountResult {
  success: boolean;
  error?: string;
}

/**
 * Hook for deleting user account
 * Calls Supabase edge function that:
 * 1. Deletes all user data (profiles, listings, messages, etc.)
 * 2. Deletes storage files (profile images, listing images)
 * 3. Deletes auth user
 */
export function useDeleteAccount() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, signOut } = useAuth();

  const deleteAccount = async (): Promise<DeleteAccountResult> => {
    if (!user) {
      const errorMsg = 'No user logged in';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }

    setIsDeleting(true);
    setError(null);

    try {
      logger.info('[useDeleteAccount] Starting account deletion', { userId: user.id });

      // Get current session token
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('No active session found');
      }

      // Call edge function with user's auth token
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.details || 'Failed to delete account');
      }

      logger.info('[useDeleteAccount] Account deleted successfully', { userId: user.id });

      // Sign out after successful deletion
      await signOut();

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      logger.error('[useDeleteAccount] Account deletion failed', {
        userId: user.id,
        error: errorMessage
      });

      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    deleteAccount,
    isDeleting,
    error,
  };
}
