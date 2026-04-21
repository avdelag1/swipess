import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/prodLogger';

/**
 * Welcome state with SERVER-SIDE persistence.
 * Shows the welcome once per user based on whether a welcome notification exists.
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
        // Check localStorage first for same-session dedup
        const localKey = `welcome_seen_${userId}`;
        if (localStorage.getItem(localKey) === 'true') {
          setIsChecking(false);
          setShouldShowWelcome(false);
          return;
        }

        // Check if welcome notification already exists in DB
        const { data: existing, error } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', userId)
          .eq('notification_type', 'system_announcement')
          .ilike('title', 'Welcome%')
          .maybeSingle();

        if (error) {
          logger.warn('[Welcome] Check error:', error);
          setIsChecking(false);
          setShouldShowWelcome(false);
          return;
        }

        if (existing) {
          // Already seen welcome — mark localStorage and skip
          localStorage.setItem(localKey, 'true');
          setIsChecking(false);
          setShouldShowWelcome(false);
          return;
        }

        // New user — show welcome, save immediately
        localStorage.setItem(localKey, 'true');
        await saveWelcomeNotification(userId);
        setIsChecking(false);
        setShouldShowWelcome(true);

      } catch {
        setIsChecking(false);
        setShouldShowWelcome(false);
      }
    };

    checkWelcomeStatus();
  }, [userId]);

  const dismissWelcome = useCallback(() => {
    if (userId) {
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

async function saveWelcomeNotification(userId: string) {
  try {
    const notificationData = {
      user_id: userId,
      notification_type: 'system_announcement' as const,
      title: 'Welcome to Nexus Discovery! 🎉',
      message: 'Thank you for choosing us! As one of our first users, you have been granted exclusive BETA PRIVILEGE: free tokens and free AI tools for life! Enjoy the elite discovery experience.',
      is_read: false
    };

    await supabase.from('notifications').insert([notificationData]);
    logger.log('[Welcome] Saved welcome notification to database');
  } catch (error) {
    logger.error('[Welcome] Failed to save welcome notification:', error);
  }
}


