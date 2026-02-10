import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

/**
 * Draft storage keys
 */
const DRAFT_STORAGE_KEYS = {
  LISTING: 'anonymous_listing_draft',
  PROFILE: 'anonymous_profile_draft',
} as const;

/**
 * Draft interface for listings
 */
export interface AnonymousListingDraft {
  category: string;
  data: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Draft interface for profiles
 */
export interface AnonymousProfileDraft {
  data: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Hook to manage anonymous drafts
 * Handles:
 * - Saving drafts locally
 * - Restoring drafts after signup
 * - Clearing drafts after publish
 */
export function useAnonymousDrafts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [hasListingDraft, setHasListingDraft] = useState(false);
  const [hasProfileDraft, setHasProfileDraft] = useState(false);

  // Check for existing drafts on mount
  useEffect(() => {
    const checkDrafts = () => {
      try {
        const listingDraft = localStorage.getItem(DRAFT_STORAGE_KEYS.LISTING);
        const profileDraft = localStorage.getItem(DRAFT_STORAGE_KEYS.PROFILE);
        setHasListingDraft(!!listingDraft);
        setHasProfileDraft(!!profileDraft);
      } catch {
        setHasListingDraft(false);
        setHasProfileDraft(false);
      }
    };
    checkDrafts();
  }, []);

  // Save listing draft
  const saveListingDraft = useCallback((category: string, data: Record<string, any>) => {
    try {
      const draft: AnonymousListingDraft = {
        category,
        data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(DRAFT_STORAGE_KEYS.LISTING, JSON.stringify(draft));
      setHasListingDraft(true);
    } catch (error) {
      console.error('Failed to save listing draft:', error);
    }
  }, []);

  // Save profile draft
  const saveProfileDraft = useCallback((data: Record<string, any>) => {
    try {
      const draft: AnonymousProfileDraft = {
        data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(DRAFT_STORAGE_KEYS.PROFILE, JSON.stringify(draft));
      setHasProfileDraft(true);
    } catch (error) {
      console.error('Failed to save profile draft:', error);
    }
  }, []);

  // Get listing draft
  const getListingDraft = useCallback((): AnonymousListingDraft | null => {
    try {
      const stored = localStorage.getItem(DRAFT_STORAGE_KEYS.LISTING);
      if (!stored) return null;
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }, []);

  // Get profile draft
  const getProfileDraft = useCallback((): AnonymousProfileDraft | null => {
    try {
      const stored = localStorage.getItem(DRAFT_STORAGE_KEYS.PROFILE);
      if (!stored) return null;
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }, []);

  // Clear listing draft
  const clearListingDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_STORAGE_KEYS.LISTING);
    setHasListingDraft(false);
  }, []);

  // Clear profile draft
  const clearProfileDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_STORAGE_KEYS.PROFILE);
    setHasProfileDraft(false);
  }, []);

  // Restore drafts after signup
  const restoreDrafts = useCallback(async () => {
    if (!user) return;

    const listingDraft = getListingDraft();
    const profileDraft = getProfileDraft();

    let restoredCount = 0;

    // Restore listing draft
    if (listingDraft) {
      try {
        const { error } = await supabase
          .from('listings')
          .insert({
            user_id: user.id,
            category: listingDraft.category,
            ...listingDraft.data,
            status: 'published', // Auto-publish after signup
          });

        if (!error) {
          restoredCount++;
          clearListingDraft();
        }
      } catch (error) {
        console.error('Failed to restore listing draft:', error);
      }
    }

    // Restore profile draft
    if (profileDraft) {
      try {
        const { error } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            ...profileDraft.data,
            onboarding_completed: true,
          });

        if (!error) {
          restoredCount++;
          clearProfileDraft();
        }
      } catch (error) {
        console.error('Failed to restore profile draft:', error);
      }
    }

    // Show notification
    if (restoredCount > 0) {
      toast({
        title: restoredCount === 2 ? 'Your work is restored!' : 'Your work is restored!',
        description: restoredCount === 2
          ? 'Your listing and profile have been published.'
          : restoredCount === 1 && listingDraft
            ? 'Your listing has been published.'
            : 'Your profile is now live.',
        duration: 5000,
      });
    }

    return restoredCount;
  }, [user, getListingDraft, getProfileDraft, clearListingDraft, clearProfileDraft]);

  return {
    hasListingDraft,
    hasProfileDraft,
    saveListingDraft,
    saveProfileDraft,
    getListingDraft,
    getProfileDraft,
    clearListingDraft,
    clearProfileDraft,
    restoreDrafts,
  };
}

/**
 * Hook to trigger auth required modal
 * Returns a function that shows auth modal and handles redirect after login
 */
export function useAuthRequired() {
  const navigate = useNavigate();

  const showAuthRequired = useCallback((
    action: 'save_listing' | 'save_profile' | 'publish_listing',
    onAuthComplete?: () => void
  ) => {
    // Store the pending action
    sessionStorage.setItem('pending_auth_action', JSON.stringify({
      action,
      timestamp: Date.now(),
    }));

    // Show auth modal or redirect to auth
    // This can be customized based on your auth implementation
    if (onAuthComplete) {
      onAuthComplete();
    } else {
      // Default: redirect to login with return URL
      navigate('/auth?returnTo=' + encodeURIComponent(window.location.pathname));
    }
  }, [navigate]);

  return { showAuthRequired };
}

export default useAnonymousDrafts;
