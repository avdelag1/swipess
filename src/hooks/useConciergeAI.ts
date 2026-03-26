import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ConciergeMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ConciergeContext {
  city?: string;
  userRole?: 'client' | 'owner';
  listings?: any[];
}

export function useConciergeAI() {
  const [messages, setMessages] = useState<ConciergeMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const sendMessage = useCallback(async (userMessage: string, context?: ConciergeContext) => {
    setIsLoading(true);
    setError(null);

    // Add user message to chat state
    const userMsg: ConciergeMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      // Call the AI Orchestrator via Supabase Edge Function
      const { data, error: funcError } = await supabase.functions.invoke('ai-orchestrator', {
        body: {
          task: 'chat',
          data: {
            query: userMessage,
            messages: messages.map(m => ({
              role: m.role,
              content: m.content
            })),
            context: {
              city: context?.city || 'Tulum',
              userRole: context?.userRole,
              listings: context?.listings?.slice(0, 5)
            }
          }
        }
      });

      if (funcError) throw funcError;

      const aiResponse = data?.result?.text || data?.result?.message || 'I apologize, but I could not generate a response. Please try again.';

      const assistantMsg: ConciergeMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMsg]);

    } catch (err) {
      console.error('Concierge Error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      
      // Add error message to chat
      const errorMsg: ConciergeMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I encountered an error: ${errorMessage}. Please try again.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    isConfigured: true, 
  };
}
