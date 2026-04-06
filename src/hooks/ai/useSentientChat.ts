import { useState, useCallback, useRef } from 'react';
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
  const abortRef = useRef<AbortController | null>(null);
  const MAX_RETRIES = 2;

  const sendMessage = useCallback(async (
    query: string, 
    history: ChatMessage[], 
    userName: string = 'User'
  ): Promise<ChatResponse | null> => {
    setIsSearching(true);
    setError(null);

    // Abort any in-flight request
    abortRef.current?.abort();
    
    const attemptSend = async (count: number): Promise<ChatResponse | null> => {
      const controller = new AbortController();
      abortRef.current = controller;
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

        const response = await fetch(`${supabaseUrl}/functions/v1/ai-orchestrator`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
          },
          body: JSON.stringify({
            task: 'chat',
            data: {
              query,
              userName,
              messages: history,
              currentPath: window.location.pathname
            },
            stream: false
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        if (data?.error) throw new Error(data.error);

        let rawContent = data?.result?.text || data?.result?.message || '';
        const action = data?.result?.action;

        // Strip <think> blocks
        rawContent = rawContent.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
        // Strip trailing JSON action blocks
        rawContent = rawContent.replace(/\{\s*"action"\s*:[\s\S]*?\}\s*$/m, '').trim();

        if (!rawContent) {
          throw new Error('Empty response from AI');
        }

        return {
          text: rawContent,
          action: action ? {
            type: action.type,
            label: action.label,
            route: action.params?.path || action.route,
            params: action.params
          } : undefined
        };
      } catch (err: any) {
        clearTimeout(timeoutId);
        const isAbort = err.name === 'AbortError';
        logger.error(`[SentientChat] Attempt ${count + 1} failed ${isAbort ? '(TIMEOUT/ABORT)' : ''}:`, err);
        
        if (count < MAX_RETRIES && !isAbort) {
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
