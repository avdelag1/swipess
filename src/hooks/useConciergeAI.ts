import { useState, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast as sonnerToast } from 'sonner';
import { useAuth } from './useAuth';
import { useUserSubscription } from './useSubscription';
import { useLocation } from 'react-router-dom';
import { MEMORIES_QUERY_KEY } from './useUserMemories';
import { logger } from '@/utils/prodLogger';

interface ConciergeMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  action?: any;
}

interface ConciergeContext {
  city?: string;
  userRole?: 'client' | 'owner';
  listings?: any[];
  listingId?: string;
}

interface ConversationSummary {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

const FALLBACK_SUPABASE_PROJECT_ID = 'qegyisokrxdsszzswsqk';
const FALLBACK_SUPABASE_URL = `https://${FALLBACK_SUPABASE_PROJECT_ID}.supabase.co`;
const FALLBACK_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlZ3lpc29rcnhkc3N6enN3c3FrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNjY0NTIsImV4cCI6MjA4NTg0MjQ1Mn0.4tdJ82fDnFXaJ6SHpfveCiGxGm2S4II6NNIbGUnT2ZU';

function getBackendConfig() {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const clientUrl = (supabase as any)?.supabaseUrl as string | undefined;
  const clientKey = (supabase as any)?.supabaseKey as string | undefined;

  return {
    url:
      import.meta.env.VITE_SUPABASE_URL ||
      clientUrl ||
      (projectId ? `https://${projectId}.supabase.co` : FALLBACK_SUPABASE_URL),
    anonKey:
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
      clientKey ||
      FALLBACK_SUPABASE_ANON_KEY,
  };
}

async function callAiOrchestrator(payload: any) {
  const { url, anonKey } = getBackendConfig();
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: anonKey,
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  return fetch(`${url}/functions/v1/ai-orchestrator`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
}

// ── SSE Stream Parser ──────────────────────────────────────────
async function parseSSEStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onToken: (token: string) => void,
  onDone: () => void
) {
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;

        const data = trimmed.slice(6);
        if (data === '[DONE]') {
          onDone();
          return;
        }

        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) onToken(delta);
        } catch {
          // Skip unparseable chunks
        }
      }
    }
  } finally {
    onDone();
  }
}

// ── Strip <think> reasoning tokens from MiniMax ───────────────
function stripThinkingTokens(text: string): string {
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  cleaned = cleaned.replace(/<think>[\s\S]*$/g, '').trim();
  return cleaned;
}

// ── Extract Action Block ───────────────────────────────────────
function extractAction(text: string): { cleanText: string; action: any } {
  const actionMatch = text.match(/(\{\s*"action"\s*:[\s\S]*?\})\s*$/m);
  if (!actionMatch) return { cleanText: text, action: null };

  try {
    const action = JSON.parse(actionMatch[0])?.action || null;
    const cleanText = text.replace(actionMatch[0], '').trim();
    return { cleanText: cleanText || text, action };
  } catch {
    return { cleanText: text, action: null };
  }
}

export function useConciergeAI() {
  const [messages, setMessages] = useState<ConciergeMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userVibe, setUserVibe] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const { user } = useAuth();
  const { data: subscription } = useUserSubscription();
  const location = useLocation();
  const queryClient = useQueryClient();

  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  // Load conversation list + latest on mount
  useEffect(() => {
    if (!user) return;

    const initChat = async () => {
      try {
        const { data: convList, error: convErr } = await (supabase as any)
          .from('ai_conversations')
          .select('id, title, created_at, updated_at')
          .eq('user_id', user.id)
          .eq('is_archived', false)
          .order('updated_at', { ascending: false })
          .limit(10);

        if (convErr) {
          logger.warn('[ConciergeAI] ai_conversations table not ready yet.');
          return;
        }

        if (convList) setConversations(convList as any);

        if (convList && convList.length > 0) {
          const latest = (convList as any)[0];
          setCurrentConversationId(latest.id as string);

          const { data: msgs } = await (supabase as any)
            .from('ai_messages')
            .select('*')
            .eq('conversation_id', latest.id)
            .order('created_at', { ascending: true });

          if (msgs) {
            setMessages(
              (msgs as any[])
                .filter((m: any) => m.content && m.content.trim() !== '')
                .map((m: any) => ({
                  id: String(m.id),
                  role: m.role as any,
                  content: m.content,
                  timestamp: new Date(m.created_at),
                  action: m.metadata?.action,
                }))
            );
          }
        }
      } catch (e) {
        logger.warn('[ConciergeAI] DB init skipped:', e);
      }
    };

    initChat();
  }, [user]);

  const sendMessage = useCallback(
    async (userMessage: string, context?: ConciergeContext) => {
      if (!userMessage.trim()) return;

      setIsLoading(true);
      setIsThinking(true);
      setError(null);

      const tempId = crypto.randomUUID();
      const optimisticUserMsg: ConciergeMessage = {
        id: tempId,
        role: 'user',
        content: userMessage,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, optimisticUserMsg]);

      try {
        // 1. DB persistence
        let convId = currentConversationId;
        if (user) {
          try {
            if (!convId) {
              const { data: newConv, error: convErr } = await (supabase as any)
                .from('ai_conversations')
                .insert({ user_id: user.id, title: userMessage.substring(0, 40) })
                .select()
                .single();

              if (!convErr && newConv) {
                convId = newConv.id as string;
                setCurrentConversationId(convId);
                setConversations((prev) => [newConv as ConversationSummary, ...prev]);
              }
            }

            if (convId) {
              await (supabase as any).from('ai_messages').insert({
                conversation_id: convId,
                user_id: user.id,
                role: 'user',
                content: userMessage,
              });
            }
          } catch (dbErr) {
            logger.warn('[ConciergeAI] DB persistence skipped:', dbErr);
          }
        }

        // 2. Profile data
        const { data: profile } = user
          ? await supabase
              .from('profiles')
              .select('full_name, bio, interests, lifestyle_tags')
              .eq('user_id', user.id)
              .maybeSingle()
          : { data: null };

        const userName = (profile as any)?.full_name || 'Friend';
        const userTier = (subscription as any)?.subscription_packages?.tier || 'Basic';

        // 3. Prepare payload
        const history = [...messages.slice(-10), optimisticUserMsg].map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const payload = {
          task: 'chat',
          stream: true,
          data: {
            query: userMessage,
            userName,
            userTier,
            messages: history,
            context: {
              city: context?.city || '',
              userRole: context?.userRole,
              listings: context?.listings?.slice(0, 5),
              currentPath: location.pathname,
              listingId: context?.listingId,
            },
          },
        };

        // 4. Try streaming first
        let streamSuccess = false;
        try {
          streamSuccess = await attemptStreaming(payload, convId);
        } catch (streamErr) {
          logger.warn('[ConciergeAI] Streaming failed, falling back to JSON:', streamErr);
        }

        // 5. Fallback to JSON if streaming failed
        if (!streamSuccess) {
          await attemptJSON({ ...payload, stream: false }, convId);
        }
      } catch (err) {
        logger.error('[useConciergeAI] Execution error:', err);
        const msg = err instanceof Error ? err.message : 'Service momentarily unavailable';

        if (msg.includes('402') || msg.includes('credits') || msg.includes('limit')) {
          setError('Your message quota is exhausted. Please upgrade your plan.');
        } else {
          setError(msg);
        }
      } finally {
        setIsLoading(false);
        setIsThinking(false);
      }
    },
    [messages, user, currentConversationId, subscription, location.pathname, queryClient]
  );

  // ── Streaming Attempt ────────────────────────────────────────
  const attemptStreaming = useCallback(
    async (payload: any, convId: string | null): Promise<boolean> => {
      const response = await callAiOrchestrator(payload);

      if (!response.ok || !response.body) {
        return false;
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('text/event-stream')) {
        const data = await response.json();
        handleJSONResponse(data, convId);
        return true;
      }

      const assistantId = crypto.randomUUID();
      let fullText = '';

      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: 'assistant', content: '', timestamp: new Date() },
      ]);
      setIsThinking(false);

      const reader = response.body.getReader();
      let firstTokenReceived = false;
      let errorDetected = false;

      await parseSSEStream(
        reader,
        (token) => {
          // Detect provider-side error payloads masquerading as SSE content
          if (!firstTokenReceived && (
            token.includes('status_msg') ||
            token.includes('not support model') ||
            token.includes('unsupported')
          )) {
            errorDetected = true;
            logger.warn('[ConciergeAI] Provider error detected in stream:', token);
            return;
          }
          if (errorDetected) return;

          if (!firstTokenReceived) {
            firstTokenReceived = true;
            setIsThinking(false);
          }
          fullText += token;
          const current = stripThinkingTokens(fullText);
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: current } : m))
          );
        },
        () => {
          if (errorDetected || !fullText.trim()) {
            // Remove the empty assistant bubble
            setMessages((prev) => prev.filter((m) => m.id !== assistantId));
            return;
          }

          const { cleanText, action } = extractAction(stripThinkingTokens(fullText));
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: cleanText, action } : m
            )
          );

          if (user && convId && cleanText.trim()) {
            persistAssistantMessage(convId, cleanText, action);
          }

          if (action) handleAiAction(action);
        }
      );

      // If error detected or no content, signal failure so JSON fallback runs
      if (errorDetected || !fullText.trim()) return false;

      return true;
    },
    [user]
  );

  // ── JSON Fallback ────────────────────────────────────────────
  const attemptJSON = useCallback(
    async (payload: any, convId: string | null) => {
      const response = await callAiOrchestrator(payload);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(`AI Engine Error: ${response.status}`);
      }

      handleJSONResponse(data, convId);
    },
    [user]
  );

  const handleJSONResponse = useCallback(
    (data: any, convId: string | null) => {
      setIsThinking(false);
      const rawText = stripThinkingTokens(
        data?.result?.text ||
        data?.choices?.[0]?.message?.content ||
        data?.message ||
        'I am processing that...'
      );
      const { cleanText: aiText, action: aiAction } = extractAction(rawText);

      const assistantMsg: ConciergeMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: aiText,
        timestamp: new Date(),
        action: aiAction,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      if (user && convId) {
        persistAssistantMessage(convId, aiText, aiAction);
      }

      if (aiAction) handleAiAction(aiAction);
    },
    [user]
  );

  // ── DB Persistence ───────────────────────────────────────────
  const persistAssistantMessage = useCallback(
    async (convId: string, content: string, action?: any) => {
      if (!user) return;
      try {
        await (supabase as any).from('ai_messages').insert({
          conversation_id: convId,
          user_id: user.id,
          role: 'assistant',
          content,
          metadata: action ? { action } : {},
        });

        await (supabase as any)
          .from('ai_conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', convId);
      } catch (dbErr) {
        logger.warn('[ConciergeAI] AI response persistence skipped:', dbErr);
      }
    },
    [user]
  );

  // ── Action Handler ───────────────────────────────────────────
  const handleAiAction = useCallback(
    async (aiAction: any) => {
      if (!aiAction) return;

      if (aiAction.type === 'save_memory' && aiAction.params && user) {
        const { category, title, content, tags } = aiAction.params;
        if (title && content) {
          await (supabase as any).from('user_memories').insert({
            user_id: user.id,
            category: category || 'note',
            title,
            content,
            tags: tags || [],
            source: 'ai',
          });
          queryClient.invalidateQueries({ queryKey: MEMORIES_QUERY_KEY(user.id) });
          sonnerToast.success(`Remembered: ${title}`, { duration: 2000 });
        }
      }

      if (aiAction.type === 'initiate_match') {
        sonnerToast.success('Connection request sent! 🚀', {
          description: 'The owner has been notified.',
        });
      }
    },
    [user, queryClient]
  );

  // ── Utility Actions ──────────────────────────────────────────
  const startNewChat = useCallback(() => {
    setMessages([]);
    setCurrentConversationId(null);
  }, []);

  const switchConversation = useCallback(
    async (convId: string) => {
      if (!user) return;
      setCurrentConversationId(convId);

      try {
        const { data: msgs } = await (supabase as any)
          .from('ai_messages')
          .select('*')
          .eq('conversation_id', convId)
          .order('created_at', { ascending: true });

        if (msgs) {
          setMessages(
            (msgs as any[])
              .filter((m: any) => m.content && m.content.trim() !== '')
              .map((m: any) => ({
                id: String(m.id),
                role: m.role as any,
                content: m.content,
                timestamp: new Date(m.created_at),
                action: m.metadata?.action,
              }))
          );
        }
      } catch (err) {
        logger.error('[ConciergeAI] Switch error:', err);
      }
    },
    [user]
  );

  const clearMessages = useCallback(async () => {
    if (!currentConversationId || !user) {
      setMessages([]);
      return;
    }

    try {
      await (supabase as any)
        .from('ai_conversations')
        .update({ is_archived: true })
        .eq('id', currentConversationId);

      setConversations((prev) => prev.filter((c) => c.id !== currentConversationId));
      setMessages([]);
      setCurrentConversationId(null);
      sonnerToast.success('Conversation archived');
    } catch (err) {
      logger.error('[ConciergeAI] Clear error:', err);
    }
  }, [currentConversationId, user]);

  return {
    messages,
    isLoading,
    isThinking,
    error,
    setError,
    conversations,
    currentConversationId,
    sendMessage,
    startNewChat,
    switchConversation,
    clearMessages,
    userVibe,
    isConfigured: true,
  };
}
