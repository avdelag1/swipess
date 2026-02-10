import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { User } from '@supabase/supabase-js';
import { logger } from '@/utils/prodLogger';

export interface ExistingProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role?: 'client' | 'owner';
  created_at: string;
}

export interface AccountLinkingResult {
  success: boolean;
  existingProfile?: ExistingProfile;
  isNewAccount?: boolean;
  roleConflict?: boolean;
  suggestedRole?: 'client' | 'owner';
}

export function useAccountLinking() {
  const [isLinking, setIsLinking] = useState(false);

  const checkExistingAccount = async (email: string): Promise<{ profile: ExistingProfile | null; hasConflict: boolean }> => {
    try {
      // Use SECURITY DEFINER RPC so this works in any auth context (including anon
      // before signup).  Direct queries to profiles/user_roles are blocked by RLS
      // for unauthenticated users.
      const { data, error } = await supabase.rpc('check_email_exists', { p_email: email });

      if (error) {
        if (import.meta.env.DEV) {
          logger.error('Error checking existing account:', error);
        }
        return { profile: null, hasConflict: false };
      }

      if (!data?.exists) {
        return { profile: null, hasConflict: false };
      }

      return {
        profile: {
          id: data.id,
          email: data.email,
          full_name: data.full_name,
          role: data.role as 'client' | 'owner' | undefined,
          avatar_url: data.avatar_url,
          created_at: data.created_at,
        } as ExistingProfile,
        hasConflict: false,
      };
    } catch (error) {
      if (import.meta.env.DEV) {
        logger.error('Error in checkExistingAccount:', error);
      }
      return { profile: null, hasConflict: false };
    }
  };

  const linkOAuthToExistingAccount = async (
    oauthUser: User,
    existingProfile: ExistingProfile,
    requestedRole: 'client' | 'owner'
  ): Promise<AccountLinkingResult> => {
    setIsLinking(true);
    
    try {
      // Check for role conflict
      const roleConflict = existingProfile.role !== requestedRole;
      
      if (roleConflict) {
        // SECURITY: Show user the conflict but NEVER change their existing role
        toast({
          title: "Account Found",
          description: `You already have an account as a ${existingProfile.role}. You'll be signed in with your existing role.`,
        });
        // DO NOT modify role - use existing one
      } else {
        // No conflict - ensure role exists in user_roles (idempotent)
        // FIXED: Use 'user_id' as onConflict, not 'user_id,role' to prevent multiple roles per user
        await supabase
          .from('user_roles')
          .upsert([{
            user_id: existingProfile.id,
            role: requestedRole
          }], {
            onConflict: 'user_id'  // ✅ Only one role per user
          });
      }

      // Update the OAuth user's metadata to match existing account
      await supabase.auth.updateUser({
        data: { 
          role: existingProfile.role, // Use existing role
          account_linked: true,
          linked_at: new Date().toISOString()
        }
      });

      // Update existing profile with any new OAuth data if needed
      const profileUpdate: Record<string, unknown> = {
        updated_at: new Date().toISOString()
      };

      // Update name if OAuth provides a better one and current is empty
      if ((!existingProfile.full_name || existingProfile.full_name.trim() === '') && 
          (oauthUser.user_metadata?.name || oauthUser.user_metadata?.full_name)) {
        profileUpdate.full_name = oauthUser.user_metadata?.name || oauthUser.user_metadata?.full_name;
      }

      // Add avatar if available and not already set
      if (oauthUser.user_metadata?.avatar_url && !existingProfile.avatar_url) {
        profileUpdate.avatar_url = oauthUser.user_metadata.avatar_url;
      }

      // Only update if we have changes
      if (Object.keys(profileUpdate).length > 1) {
        await supabase
          .from('profiles')
          .update(profileUpdate)
          .eq('id', existingProfile.id);
      }

      toast({
        title: "Account Linked Successfully",
        description: `Welcome back! Your ${oauthUser.app_metadata?.provider} account has been linked.`,
      });

      return {
        success: true,
        existingProfile: existingProfile,
        isNewAccount: false,
        roleConflict,
        suggestedRole: existingProfile.role
      };

    } catch (error) {
      if (import.meta.env.DEV) {
        logger.error('Error linking OAuth to existing account:', error);
      }
      toast({
        title: "Account Linking Failed",
        description: "Failed to link your account. Please try signing in with your original credentials.",
        variant: "destructive"
      });
      
      return {
        success: false,
        roleConflict: false
      };
    } finally {
      setIsLinking(false);
    }
  };

  const createNewOAuthProfile = async (
    oauthUser: User, 
    role: 'client' | 'owner'
  ): Promise<AccountLinkingResult> => {
    setIsLinking(true);
    
    try {
      const profileData = {
        id: oauthUser.id,
        full_name: oauthUser.user_metadata?.name || oauthUser.user_metadata?.full_name || '',
        email: oauthUser.email || '',
        role: role,
        avatar_url: oauthUser.user_metadata?.avatar_url || null,
        is_active: true,
        onboarding_completed: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: newProfile, error } = await supabase
        .from('profiles')
        .insert([profileData])
        .select()
        .single();

      if (error) {
        if (import.meta.env.DEV) {
          logger.error('Error creating OAuth profile:', error);
        }
        throw error;
      }

      // Create role in user_roles table
      // Use upsert with user_id conflict to ensure only one role per user
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert([{
          user_id: oauthUser.id,
          role
        }], {
          onConflict: 'user_id'
        });

      if (roleError) {
        if (import.meta.env.DEV) {
          logger.error('Error creating role:', roleError);
        }
        throw roleError;
      }

      // Update user metadata
      await supabase.auth.updateUser({
        data: { 
          role: role,
          oauth_signup: true,
          signup_completed_at: new Date().toISOString()
        }
      });

      toast({
        title: "Welcome to Zwipes!",
        description: `Your ${oauthUser.app_metadata?.provider} account has been connected successfully.`,
      });

      return {
        success: true,
        existingProfile: { ...newProfile, role } as ExistingProfile,
        isNewAccount: true,
        roleConflict: false
      };

    } catch (error) {
      if (import.meta.env.DEV) {
        logger.error('Error creating OAuth profile:', error);
      }
      toast({
        title: "Account Creation Failed", 
        description: "Failed to create your profile. Please try again.",
        variant: "destructive"
      });
      
      return {
        success: false,
        isNewAccount: true,
        roleConflict: false
      };
    } finally {
      setIsLinking(false);
    }
  };

  const handleOAuthUserSetup = async (
    oauthUser: User, 
    requestedRole: 'client' | 'owner'
  ): Promise<AccountLinkingResult> => {
    if (!oauthUser.email) {
      toast({
        title: "Email Required",
        description: "We need your email address to create your account. Please check your OAuth provider settings.",
        variant: "destructive"
      });
      return { success: false, roleConflict: false };
    }

    // Check for existing account by email
    const { profile: existingProfile } = await checkExistingAccount(oauthUser.email);

    if (existingProfile) {
      // Link to existing account
      return await linkOAuthToExistingAccount(oauthUser, existingProfile, requestedRole);
    } else {
      // Create new account
      return await createNewOAuthProfile(oauthUser, requestedRole);
    }
  };

  return {
    checkExistingAccount,
    linkOAuthToExistingAccount,
    createNewOAuthProfile,
    handleOAuthUserSetup,
    isLinking
  };
}