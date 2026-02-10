import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { toast as sonnerToast } from 'sonner';
import { User } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { retryWithBackoff } from '@/utils/retryUtils';
import { logger } from '@/utils/prodLogger';
import { STORAGE, REFERRAL } from '@/constants/app';

interface CreateProfileData {
  id: string;
  full_name?: string;
  email?: string;
}

// Track ongoing profile creation to prevent concurrent attempts
const profileCreationInProgress = new Set<string>();

export function useProfileSetup() {
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const queryClient = useQueryClient();

  // Process referral reward for the referrer
  const processReferralReward = useCallback(async (newUserId: string) => {
    try {
      // Get stored referral code
      const storedData = localStorage.getItem(STORAGE.REFERRAL_CODE_KEY);
      if (!storedData) return;

      const referralData = JSON.parse(storedData);
      const referrerId = referralData.code;

      // Validate: not self-referral, referrer exists
      if (!referrerId || referrerId === newUserId) {
        localStorage.removeItem(STORAGE.REFERRAL_CODE_KEY);
        return;
      }

      // Check expiry
      const capturedAt = referralData.capturedAt || 0;
      const expiryMs = REFERRAL.REFERRAL_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
      if (Date.now() - capturedAt > expiryMs) {
        localStorage.removeItem(STORAGE.REFERRAL_CODE_KEY);
        return;
      }

      // Verify referrer exists
      const { data: referrerProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', referrerId)
        .maybeSingle();

      if (!referrerProfile) {
        localStorage.removeItem(STORAGE.REFERRAL_CODE_KEY);
        return;
      }

      // Check if reward already granted (prevent abuse)
      const { data: existingReward } = await supabase
        .from('message_activations')
        .select('id')
        .eq('user_id', referrerId)
        .eq('activation_type', 'referral_bonus')
        .like('notes', `%referred_user:${newUserId}%`)
        .maybeSingle();

      if (existingReward) {
        localStorage.removeItem(STORAGE.REFERRAL_CODE_KEY);
        return;
      }

      // Grant referral bonus activation
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 60);

      const { data: activationData, error: activError } = await supabase
        .from('message_activations')
        .insert({
          user_id: referrerId,
          activation_type: 'referral_bonus',
          total_activations: REFERRAL.FREE_MESSAGES_PER_REFERRAL,
          remaining_activations: REFERRAL.FREE_MESSAGES_PER_REFERRAL,
          used_activations: 0,
          expires_at: expiresAt.toISOString(),
          notes: `Referral reward - referred_user:${newUserId}`,
        })
        .select()
        .single();

      if (!activError && activationData) {
        // Referral tracking - just log since user_referrals table doesn't exist
        logger.info('[ProfileSetup] Referral reward granted:', {
          referrerId,
          newUserId,
          activationId: activationData.id,
        });

        // Create notification for referrer (silent, non-blocking)
        (supabase as any)
          .from('notifications')
          .insert([{
            user_id: referrerId,
            type: 'system',
            title: 'Referral Reward',
            content: 'You earned 1 free message for inviting a new user!',
            is_read: false,
          }])
          .then(() => {});

        if (import.meta.env.DEV) {
          logger.log('[ProfileSetup] Referral reward granted to:', referrerId);
        }
      }

      // Clear referral code
      localStorage.removeItem(STORAGE.REFERRAL_CODE_KEY);

      // Invalidate queries for referrer
      queryClient.invalidateQueries({ queryKey: ['message-activations', referrerId] });
    } catch (error) {
      logger.error('[ProfileSetup] Error processing referral:', error);
      localStorage.removeItem(STORAGE.REFERRAL_CODE_KEY);
    }
  }, [queryClient]);

  const createProfileIfMissing = async (user: User, role: 'client' | 'owner') => {
    if (!user) return null;

    // Prevent concurrent profile creation for the same user
    if (profileCreationInProgress.has(user.id)) {
      if (import.meta.env.DEV) logger.log('[ProfileSetup] Profile creation already in progress for user:', user.id);
      return null;
    }

    profileCreationInProgress.add(user.id);
    setIsCreatingProfile(true);
    
    try {
      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (existingProfile) {
        // Ensure role exists in user_roles table with retry logic
        let roleCreated = false;
        let lastRoleError = null;
        
        for (let attempt = 1; attempt <= 3; attempt++) {
          const { error: roleError } = await supabase.rpc('upsert_user_role', {
            p_user_id: user.id,
            p_role: role
          });
          
          if (!roleError) {
            roleCreated = true;
            break;
          }
          
          lastRoleError = roleError;
          if (import.meta.env.DEV) logger.error(`[ProfileSetup] Role upsert attempt ${attempt}/3 failed:`, roleError.message);
          
          if (attempt < 3) {
            // Exponential backoff: 500ms, 1000ms
            await new Promise(resolve => setTimeout(resolve, attempt * 500));
          }
        }
        
        if (!roleCreated) {
          if (import.meta.env.DEV) logger.error('[ProfileSetup] Failed to upsert role after 3 attempts:', lastRoleError);
          toast({
            title: "Role Update Failed",
            description: "Could not update user role. Please refresh the page.",
            variant: "destructive"
          });
        }
        
        // CRITICAL: Invalidate cache for existing profiles too!
        queryClient.invalidateQueries({ queryKey: ['user-role', user.id] });
        await new Promise(resolve => setTimeout(resolve, 100));
        
        return existingProfile;
      }

      // Create new profile with exponential backoff retry (3 attempts)
      let newProfile = null;
      let lastProfileError = null;
      
      for (let attempt = 1; attempt <= 3; attempt++) {
        const profileData: CreateProfileData = {
          id: user.id,
          full_name: user.user_metadata?.name || user.user_metadata?.full_name || '',
          email: user.email || ''
        };

        const { data, error } = await supabase
          .from('profiles')
          .upsert([{
            ...profileData,
            role: role,  // ✅ CRITICAL FIX: Set role in profiles table!
            is_active: true,
            onboarding_completed: true, // ✅ Set onboarding complete so user appears in swipe deck
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }], {
            onConflict: 'id',
            ignoreDuplicates: false
          })
          .select()
          .single();

        if (!error) {
          newProfile = data;
          break;
        }

        lastProfileError = error;
        if (import.meta.env.DEV) logger.error(`[ProfileSetup] Profile creation attempt ${attempt}/3 failed:`, {
          message: error.message,
          code: error.code,
          details: error.details
        });

        if (attempt < 3) {
          // Exponential backoff: 500ms, 1000ms
          await new Promise(resolve => setTimeout(resolve, attempt * 500));
        }
      }

      if (!newProfile) {
        const errorMsg = lastProfileError?.code === '42501'
          ? 'Permission denied. Please try signing out and back in.'
          : lastProfileError?.message || 'Unknown error';

        if (import.meta.env.DEV) logger.error('[ProfileSetup] Failed to create profile after 3 attempts:', lastProfileError);
        toast({
          title: "Profile Creation Failed",
          description: errorMsg,
          variant: "destructive"
        });
        return null;
      }

      // Add small delay to ensure profile is fully created
      await new Promise(resolve => setTimeout(resolve, 150));

      // Retry logic for role creation (up to 3 attempts with exponential backoff)
      let roleCreated = false;
      let lastRoleError = null;
      
      for (let attempt = 1; attempt <= 3; attempt++) {
        const { error: roleError } = await supabase.rpc('upsert_user_role', {
          p_user_id: user.id,
          p_role: role
        });

        if (!roleError) {
          roleCreated = true;
          break;
        }

        lastRoleError = roleError;
        if (import.meta.env.DEV) logger.error(`[ProfileSetup] Role creation attempt ${attempt}/3 failed:`, {
          message: roleError.message,
          code: roleError.code,
          details: roleError.details
        });

        if (attempt < 3) {
          // Exponential backoff: 500ms, 1000ms
          await new Promise(resolve => setTimeout(resolve, attempt * 500));
        }
      }

      if (!roleCreated) {
        if (import.meta.env.DEV) logger.error('[ProfileSetup] Failed to create role after 3 attempts:', lastRoleError);
        toast({
          title: "Role Setup Failed",
          description: "Profile created but role assignment failed. Please contact support.",
          variant: "destructive"
        });
        return null;
      }
      
      // Invalidate role cache now that role is fully created
      queryClient.invalidateQueries({ queryKey: ['user-role', user.id] });

      // Add small delay to ensure cache invalidation propagates
      await new Promise(resolve => setTimeout(resolve, 150));

      // Grant welcome message activation for the new user
      // This gives them 1 free message to start (or 2 if they signed up via referral)
      const grantWelcomeActivation = async (userId: string) => {
        try {
          // Check if welcome activation already granted - escape deep type inference
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const welcomeResult = await (supabase as any)
            .from('message_activations')
            .select('id')
            .eq('user_id', userId)
            .eq('activation_type', 'welcome')
            .maybeSingle();
          const existingWelcome = welcomeResult?.data;

          if (existingWelcome) return;

          // Check if user signed up via referral code
          const storedData = localStorage.getItem(STORAGE.REFERRAL_CODE_KEY);
          let hasReferralCode = false;

          if (storedData) {
            try {
              const referralData = JSON.parse(storedData);
              const referrerId = referralData.code;

              // Validate referral code is valid (not self, not expired, referrer exists)
              if (referrerId && referrerId !== userId) {
                const capturedAt = referralData.capturedAt || 0;
                const expiryMs = REFERRAL.REFERRAL_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

                if (Date.now() - capturedAt <= expiryMs) {
                  // Verify referrer exists
                  const { data: referrerProfile } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('id', referrerId)
                    .maybeSingle();

                  if (referrerProfile) {
                    hasReferralCode = true;
                  }
                }
              }
            } catch (parseError) {
              // Invalid JSON, ignore
            }
          }

          // Grant free message activations (expires in 90 days)
          // - 2 activations if signed up via referral
          // - 1 activation if normal signup
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 90);

          const activationCount = hasReferralCode ? 2 : 1;
          const notesText = hasReferralCode
            ? 'Welcome bonus - referral signup (2 free messages)'
            : 'Welcome bonus - first message free';

          const insertData = {
            user_id: userId,
            activation_type: 'welcome' as const,
            total_activations: activationCount,
            remaining_activations: activationCount,
            used_activations: 0,
            expires_at: expiresAt.toISOString(),
            notes: notesText,
          };
          const { error: activError } = await supabase
            .from('message_activations')
            .insert(insertData);

          if (!activError) {
            if (import.meta.env.DEV) {
              logger.log(`[ProfileSetup] Welcome activation granted to ${userId}: ${activationCount} message(s)`);
            }
            // Invalidate activations cache
            queryClient.invalidateQueries({ queryKey: ['message-activations', userId] });
          }
        } catch (error) {
          logger.error('[ProfileSetup] Error granting welcome activation:', error);
        }
      };

      // Grant welcome activation (non-blocking)
      grantWelcomeActivation(user.id).catch(() => {
        // Silently handle any errors
      });

      // Process referral reward for the referrer (non-blocking, runs in background)
      // This grants the referrer 1 free message activation for the successful signup
      processReferralReward(user.id).catch(() => {
        // Silently handle any referral processing errors
      });

      return newProfile;

    } catch (error) {
      if (import.meta.env.DEV) logger.error('[ProfileSetup] Unexpected error in profile setup:', error);
      toast({
        title: "Setup Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
      return null;
    } finally {
      profileCreationInProgress.delete(user.id);
      setIsCreatingProfile(false);
    }
  };

  return {
    createProfileIfMissing,
    isCreatingProfile
  };
}