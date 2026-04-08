import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from '@/components/ui/sonner';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const STORAGE_KEY = 'swipess-ai-conversations';
const MAX_CONVERSATIONS = 20;
const MAX_MESSAGES = 50;

function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return parsed.map((c: any) => ({
      ...c,
      createdAt: new Date(c.createdAt),
      updatedAt: new Date(c.updatedAt),
      messages: c.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })),
    }));
  } catch {
    return [];
  }
}

function saveConversations(conversations: Conversation[]) {
  try {
    const trimmed = conversations.slice(0, MAX_CONVERSATIONS).map(c => ({
      ...c,
      messages: c.messages.slice(-MAX_MESSAGES),
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch { /* quota exceeded */ }
}

function generateTitle(content: string): string {
  return content.length > 40 ? content.slice(0, 40) + '…' : content;
}

// Strip <think>...</think> blocks from streamed content
function stripThinkBlocks(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
}

// Hardcoded to Lovable Cloud where the edge function is deployed
// (production DB is on vplgtcguxujxwrgguxqq, but the function lives here)
const AI_URL = 'https://qegyisokrxdsszzswsqk.supabase.co/functions/v1/ai-concierge';
const AUTH_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlZ3lpc29rcnhkc3N6enN3c3FrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNjY0NTIsImV4cCI6MjA4NTg0MjQ1Mn0.4tdJ82fDnFXaJ6SHpfveCiGxGm2S4II6NNIbGUnT2ZU';

export function useConciergeAI() {
  const [conversations, setConversations] = useState<Conversation[]>(loadConversations);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    () => loadConversations()[0]?.id ?? null
  );
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  // Throttled streaming: accumulate tokens in a ref, flush to state via RAF
  const streamBufferRef = useRef<{ convoId: string; msgId: string; content: string } | null>(null);
  const rafRef = useRef<number | null>(null);

  const activeConversation = conversations.find(c => c.id === activeConversationId) ?? null;
  const messages = activeConversation?.messages ?? [];

  // Separate state-only updater (no localStorage on every call) for streaming perf
  const updateConversationsLive = useCallback((updater: (prev: Conversation[]) => Conversation[]) => {
    setConversations(prev => updater(prev));
  }, []);

  const updateConversations = useCallback((updater: (prev: Conversation[]) => Conversation[]) => {
    setConversations(prev => {
      const next = updater(prev);
      saveConversations(next);
      return next;
    });
  }, []);

  // RAF-based flush: updates React state at screen refresh rate, not per-token
  const flushStreamBuffer = useCallback(() => {
    const buf = streamBufferRef.current;
    if (!buf) return;
    const { convoId, msgId, content } = buf;
    const cleaned = stripThinkBlocks(content);
    updateConversationsLive(prev =>
      prev.map(c => {
        if (c.id !== convoId) return c;
        return {
          ...c,
          messages: c.messages.map(m =>
            m.id === msgId ? { ...m, content: cleaned } : m
          ),
        };
      })
    );
    rafRef.current = requestAnimationFrame(flushStreamBuffer);
  }, [updateConversationsLive]);

  const createConversation = useCallback((): string => {
    const id = crypto.randomUUID();
    const newConvo: Conversation = {
      id,
      title: 'New conversation',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    updateConversations(prev => [newConvo, ...prev]);
    setActiveConversationId(id);
    return id;
  }, [updateConversations]);

  const switchConversation = useCallback((id: string) => {
    setActiveConversationId(id);
  }, []);

  const deleteConversation = useCallback((id: string) => {
    updateConversations(prev => prev.filter(c => c.id !== id));
    if (activeConversationId === id) {
      setActiveConversationId(prev => {
        const remaining = conversations.filter(c => c.id !== id);
        return remaining[0]?.id ?? null;
      });
    }
  }, [activeConversationId, conversations, updateConversations]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    let convoId = activeConversationId;
    if (!convoId) {
      convoId = crypto.randomUUID();
      const newConvo: Conversation = {
        id: convoId,
        title: generateTitle(content.trim()),
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      updateConversations(prev => [newConvo, ...prev]);
      setActiveConversationId(convoId);
    }

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    // Add user message
    updateConversations(prev =>
      prev.map(c => {
        if (c.id !== convoId) return c;
        const isFirstMsg = c.messages.length === 0;
        return {
          ...c,
          title: isFirstMsg ? generateTitle(content.trim()) : c.title,
          messages: [...c.messages, userMsg],
          updatedAt: new Date(),
        };
      })
    );

    setIsLoading(true);
    const abortController = new AbortController();
    abortRef.current = abortController;

    try {
      // Build API messages (last 10 for context)
      const currentConvo = conversations.find(c => c.id === convoId);
      const allMsgs = [...(currentConvo?.messages ?? []), userMsg];
      const apiMessages = allMsgs.slice(-10).map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

      const resp = await fetch(AI_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AUTH_KEY}`,
        },
        body: JSON.stringify({ messages: apiMessages }),
        signal: abortController.signal,
      });

      // Handle error status codes
      if (!resp.ok) {
        let errorMsg = 'AI temporarily unavailable.';
        try {
          const errData = await resp.json();
          errorMsg = errData.error || errorMsg;
        } catch {}
        
        if (resp.status === 429) errorMsg = 'Too many requests. Please wait a moment.';
        if (resp.status === 402) errorMsg = 'AI credits exhausted. Please add funds.';
        
        toast.error(errorMsg);
        setIsLoading(false);
        return;
      }

      const contentType = resp.headers.get('content-type') || '';
      
      if (contentType.includes('text/event-stream') && resp.body) {
        // SSE streaming with RAF-throttled rendering
        const assistantMsgId = crypto.randomUUID();
        const assistantTimestamp = new Date();
        let fullContent = '';

        // Add empty assistant message (one state update)
        updateConversationsLive(prev =>
          prev.map(c => {
            if (c.id !== convoId) return c;
            return {
              ...c,
              messages: [...c.messages, {
                id: assistantMsgId,
                role: 'assistant' as const,
                content: '',
                timestamp: assistantTimestamp,
              }],
              updatedAt: new Date(),
            };
          })
        );

        // Start RAF loop for rendering
        streamBufferRef.current = { convoId: convoId!, msgId: assistantMsgId, content: '' };
        rafRef.current = requestAnimationFrame(flushStreamBuffer);

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          
          let newlineIndex: number;
          while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
            let line = buffer.slice(0, newlineIndex);
            buffer = buffer.slice(newlineIndex + 1);
            
            if (line.endsWith('\r')) line = line.slice(0, -1);
            if (line.startsWith(':') || line.trim() === '') continue;
            if (!line.startsWith('data: ')) continue;
            
            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') break;
            
            try {
              const parsed = JSON.parse(jsonStr);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                fullContent += delta;
                // Just update the buffer ref — RAF loop handles rendering
                streamBufferRef.current = { convoId: convoId!, msgId: assistantMsgId, content: fullContent };
              }
            } catch {
              buffer = line + '\n' + buffer;
              break;
            }
          }
        }

        // Final flush of remaining buffer
        if (buffer.trim()) {
          for (let raw of buffer.split('\n')) {
            if (!raw) continue;
            if (raw.endsWith('\r')) raw = raw.slice(0, -1);
            if (!raw.startsWith('data: ')) continue;
            const jsonStr = raw.slice(6).trim();
            if (jsonStr === '[DONE]') continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) fullContent += delta;
            } catch {}
          }
        }

        // Stop RAF loop, do final state + localStorage save
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        streamBufferRef.current = null;
        const finalCleaned = stripThinkBlocks(fullContent) || 'No response received.';
        updateConversations(prev =>
          prev.map(c => {
            if (c.id !== convoId) return c;
            return {
              ...c,
              messages: c.messages.map(m =>
                m.id === assistantMsgId ? { ...m, content: finalCleaned } : m
              ),
            };
          })
        );
      } else {
        // JSON fallback (non-streaming)
        const data = await resp.json();
        if (data.error) {
          toast.error(data.error);
          setIsLoading(false);
          return;
        }
        
        const reply = data.reply || data.choices?.[0]?.message?.content || 'No response received.';
        const assistantMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: stripThinkBlocks(reply),
          timestamp: new Date(),
        };

        updateConversations(prev =>
          prev.map(c => {
            if (c.id !== convoId) return c;
            return { ...c, messages: [...c.messages, assistantMsg], updatedAt: new Date() };
          })
        );
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      console.error('[ConciergeAI]', err);
      toast.error('AI temporarily unavailable. Please try again.');
    } finally {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamBufferRef.current = null;
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [activeConversationId, conversations, isLoading, updateConversations, updateConversationsLive, flushStreamBuffer]);

  const resendMessage = useCallback(async (messageId: string) => {
    if (!activeConversation || isLoading) return;
    
    const msgIndex = activeConversation.messages.findIndex(m => m.id === messageId);
    if (msgIndex === -1) return;
    
    const targetMsg = activeConversation.messages[msgIndex];
    if (targetMsg.role !== 'user') return;

    // Remove everything after this message
    updateConversations(prev =>
      prev.map(c => {
        if (c.id !== activeConversationId) return c;
        return { ...c, messages: c.messages.slice(0, msgIndex) };
      })
    );

    // Re-send
    await sendMessage(targetMsg.content);
  }, [activeConversation, activeConversationId, isLoading, sendMessage, updateConversations]);

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamBufferRef.current = null;
    setIsLoading(false);
  }, []);

  const clearHistory = useCallback(() => {
    setConversations([]);
    setActiveConversationId(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    messages,
    conversations,
    activeConversationId,
    isLoading,
    sendMessage,
    resendMessage,
    stopGeneration,
    createConversation,
    switchConversation,
    deleteConversation,
    clearHistory,
  };
}
