import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/prodLogger';

export type UserRole = 'client' | 'owner' | 'admin';

/**
 * Validates if a user has the required role
 * Uses the security definer function for safe role checking
 */
export async function validateUserRole(
  userId: string,
  requiredRole: UserRole
): Promise<boolean> {
  const { data, error } = await supabase.rpc('validate_user_role_access', {
    p_user_id: userId,
    p_required_role: requiredRole,
  });

  if (error) {
    logger.error('Role validation error:', error);
    return false;
  }

  return data === true;
}

/**
 * Gets the user's role from the user_roles table
 */
export async function getUserRole(userId: string): Promise<UserRole | null> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    logger.error('Error fetching user role:', error);
    return null;
  }

  return data?.role as UserRole | null;
}

/**
 * Error messages for role validation failures
 */
export const ROLE_ERROR_MESSAGES = {
  CLIENT_ON_OWNER: 'These credentials are for a client account. Please use the client login page.',
  OWNER_ON_CLIENT: 'These credentials are for an owner account. Please use the owner login page.',
  NO_ROLE: 'Your account setup is incomplete. Please contact support.',
  INVALID_ROLE: 'Invalid role detected. Please contact support.',
} as const;
