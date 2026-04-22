import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function usePresence(otherUserId: string | null) {
  const [isOnline, setIsOnline] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id || !otherUserId) return;

    const channel = supabase.channel(`presence-${user.id}-${otherUserId}`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const otherUserPresence = state[otherUserId];
        setIsOnline(!!otherUserPresence);
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        if (key === otherUserId) setIsOnline(true);
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        if (key === otherUserId) setIsOnline(false);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [user?.id, otherUserId]);

  return { isOnline };
}


