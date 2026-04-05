import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/utils/prodLogger';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatResponse {
  text: string;
  action?: {
    type: string;
    label?: string;
    route?: string;
    params?: any;
  };
}

export function useSentientChat() {
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 2;

  const sendMessage = useCallback(async (
    query: string, 
    history: ChatMessage[], 
    userName: string = 'User'
  ): Promise<ChatResponse | null> => {
    setIsSearching(true);
    setError(null);
    
    const attemptSend = async (count: number): Promise<ChatResponse | null> => {
      // 🛡️ SENTIENT WATCHDOG: 25s race to prevent UI deadlocks during congestion
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      try {
        const { data, error: funcError } = await supabase.functions.invoke('ai-orchestrator', {
          body: {
            task: 'chat',
            data: {
              query,
              userName,
              messages: history,
              currentPath: window.location.pathname
            },
            stream: false
          },
          headers: {
            'x-client-timeout': '25000'
          }
        });

        clearTimeout(timeoutId);
        if (funcError) throw funcError;
        if (data?.error) throw new Error(data.error);

        // Reset retry count on success
        retryCountRef.current = 0;
        
        const rawContent = data?.result?.text || data?.result?.message || '';
        const action = data?.result?.action;

        return {
          text: rawContent.replace(/\{\s*"action"\s*:[\s\S]*?\}\s*$/m, '').trim() || rawContent,
          action: action ? {
            type: action.type,
            label: action.label,
            route: action.params?.path || action.route,
            params: action.params
          } : undefined
        };
      } catch (err: any) {
        clearTimeout(timeoutId);
        const isTimeout = err.name === 'AbortError' || err.message?.includes('timeout');
        logger.error(`[SentientChat] Attempt ${count + 1} failed ${isTimeout ? '(TIMEOUT)' : ''}:`, err);
        
        if (count < MAX_RETRIES && !isTimeout) {
          // Linear backoff: 1s, 2s
          await new Promise(resolve => setTimeout(resolve, (count + 1) * 1000));
          return attemptSend(count + 1);
        }
        
        throw err;
      }
    };

    try {
      return await attemptSend(0);
    } catch (err: any) {
      const msg = "I'm having trouble connecting to the Swipess network. Please check your signal and try again.";
      setError(msg);
      toast.error(msg);
      return null;
    } finally {
      setIsSearching(false);
    }
  }, []);

  return {
    sendMessage,
    isSearching,
    error,
    clearError: () => setError(null)
  };
}
