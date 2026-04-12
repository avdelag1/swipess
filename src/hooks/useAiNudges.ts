import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useConciergeAI } from './useConciergeAI';
import { useLocation } from 'react-router-dom';

/**
 * PROACTIVE AI NUDGES
 * This hook runs in the background and lets the AI persona 
 * "nudge" the user about matches, messages, or profile tips.
 */
export function useAiNudges() {
  const { user } = useAuth();
  const { addSystemMessage, sendMessage } = useConciergeAI();
  const location = useLocation();
  const lastNudgeRef = useRef<number>(Date.now());
  const nudgeCooldown = 1000 * 60 * 30; // 30 minutes

  useEffect(() => {
    if (!user || location.pathname !== '/concierge') return;

    const checkNudges = async () => {
      const now = Date.now();
      if (now - lastNudgeRef.current < nudgeCooldown) return;

      try {
        // 1. Check for unread messages
        const { count: unreadCount } = await supabase
          .from('conversation_messages')
          .select('*', { count: 'exact', head: true })
          .neq('sender_id', user.id)
          .is('read_at', null);

        if (unreadCount && unreadCount > 0) {
          addSystemMessage(`You have ${unreadCount} unread messages waiting for you.`);
          lastNudgeRef.current = now;
          return;
        }

        // 2. Check for recent matches (last 24h)
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { count: newMatches } = await supabase
          .from('matches')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', yesterday);

        if (newMatches && newMatches > 0) {
          sendMessage(`Hey, I noticed you have ${newMatches} new matches in the last 24 hours. Should I help you start a conversation with any of them?`);
          lastNudgeRef.current = now;
        }
      } catch (err) {
        console.error('[AI Nudge] Error:', err);
      }
    };

    const timer = setInterval(checkNudges, 60000); // Check every minute
    checkNudges(); // Initial check

    return () => clearInterval(timer);
  }, [user, location.pathname, addSystemMessage, sendMessage]);
}
