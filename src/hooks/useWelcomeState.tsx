import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/prodLogger';

/**
 * SPEED OF LIGHT: Welcome state with SERVER-SIDE persistence
 *
 * Problem: localStorage can be reset by Lovable preview URLs, causing
 * welcome to show on every login instead of just first signup.
 *
 * Solution: Use profiles.created_at to determine if user is new
 * - If created_at is within 2 minutes, user is new → show welcome once
 * - Use localStorage as a backup to prevent showing again in same session
 * - ALSO save welcome notification to database for notification history
 *
 * The welcome should ONLY show once per user, ever.
 */
export function useWelcomeState(userId: string | undefined) {
  const [shouldShowWelcome, setShouldShowWelcome] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!userId) {
      setIsChecking(false);
      return;
    }

    const checkWelcomeStatus = async () => {
      try {
        // Check localStorage first - if marked as seen, skip DB check
        const localKey = `welcome_seen_${userId}`;
        if (localStorage.getItem(localKey) === 'true') {
          setIsChecking(false);
          setShouldShowWelcome(false);
          return;
        }

        // Check server-side created_at to determine if user is truly new
        // Use maybeSingle() to handle case where profile doesn't exist yet (async creation)
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('created_at')
          .eq('id', userId)
          .maybeSingle();

        if (error) {
          // On error, don't show welcome (fail safe)
          logger.warn('[Welcome] Profile check error:', error);
          setIsChecking(false);
          setShouldShowWelcome(false);
          return;
        }

        // Profile doesn't exist yet (async creation in progress) - don't show welcome yet
        if (!profile) {
          setIsChecking(false);
          setShouldShowWelcome(false);
          return;
        }

        // Check if user is "new" (created within 2 minutes)
        if (profile?.created_at) {
          const createdAt = new Date(profile.created_at);
          const now = new Date();
          const ageMs = now.getTime() - createdAt.getTime();
          const twoMinutesMs = 2 * 60 * 1000;

          if (ageMs > twoMinutesMs) {
            // User is not new - mark as seen and don't show
            localStorage.setItem(localKey, 'true');
            setIsChecking(false);
            setShouldShowWelcome(false);
            return;
          }
        }

        // User is new - show welcome once
        // Mark as seen IMMEDIATELY (optimistic) to prevent double-showing
        localStorage.setItem(localKey, 'true');
        
        // Save welcome notification to database for history
        await saveWelcomeNotification(userId);
        
        setIsChecking(false);
        setShouldShowWelcome(true);

      } catch {
        // On any error, don't show welcome (fail safe)
        setIsChecking(false);
        setShouldShowWelcome(false);
      }
    };

    checkWelcomeStatus();
  }, [userId]);

  const dismissWelcome = useCallback(() => {
    if (userId) {
      // Mark as seen in localStorage
      localStorage.setItem(`welcome_seen_${userId}`, 'true');
    }
    setShouldShowWelcome(false);
  }, [userId]);

  return {
    shouldShowWelcome,
    isChecking,
    dismissWelcome,
  };
}

/**
 * Save welcome notification to database so it appears in notification history
 */
async function saveWelcomeNotification(userId: string) {
  try {
    // Check if welcome notification already exists
    const { data: existing } = await (supabase as any)
      .from('notifications')
      .select('id')
      .eq('user_id', userId)
      .eq('notification_type', 'system_announcement')
      .maybeSingle();

    if (existing) {
      // Already saved, skip
      return;
    }

    // Insert welcome notification with correct schema
    const notificationData = {
      user_id: userId,
      notification_type: 'system_announcement' as const,
      title: 'Welcome to Swipess! 🎉',
      message: 'Your journey to finding the perfect match starts now!',
      is_read: false
    };

    await (supabase as any).from('notifications').insert([notificationData]);

    logger.log('[Welcome] Saved welcome notification to database');
  } catch (error) {
    // Silent fail - this is not critical
    logger.error('[Welcome] Failed to save welcome notification:', error);
  }
}
