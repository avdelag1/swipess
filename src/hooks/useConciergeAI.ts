import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const STORAGE_KEY = 'swipess-ai-chat-history';

function loadHistory(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
  } catch {
    return [];
  }
}

function saveHistory(messages: ChatMessage[]) {
  try {
    // Keep last 50 messages
    const trimmed = messages.slice(-50);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch { /* quota exceeded — ignore */ }
}

export function useConciergeAI() {
  const [messages, setMessages] = useState<ChatMessage[]>(loadHistory);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    saveHistory(updatedMessages);
    setIsLoading(true);

    try {
      // Build conversation for API (last 10 messages for context)
      const apiMessages = updatedMessages.slice(-10).map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

      const { data, error } = await supabase.functions.invoke('ai-concierge', {
        body: { messages: apiMessages },
      });

      if (error) throw new Error(error.message || 'AI request failed');
      if (data?.error) throw new Error(data.error);

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.reply || 'No response received.',
        timestamp: new Date(),
      };

      const finalMessages = [...updatedMessages, assistantMsg];
      setMessages(finalMessages);
      saveHistory(finalMessages);
    } catch (err) {
      console.error('[ConciergeAI]', err);
      toast.error('AI temporarily unavailable. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading]);

  const clearHistory = useCallback(() => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { messages, isLoading, sendMessage, clearHistory };
}
