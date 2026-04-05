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

const STORAGE_KEY_PREFIX = 'Swipess_vibe_chat_';

export function useConciergeAI() {
  const [messages, setMessages] = useState<ConciergeMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userVibe, setUserVibe] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const { user } = useAuth();
  const { data: subscription } = useUserSubscription();
  const location = useLocation();
  const queryClient = useQueryClient();

  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  // Load conversation list + latest active conversation on mount
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
            setMessages((msgs as any[]).map((m: any) => ({
              id: String(m.id),
              role: m.role as any,
              content: m.content,
              timestamp: new Date(m.created_at),
              action: m.metadata?.action,
            })));
          }
        }
      } catch (e) {
        logger.warn('[ConciergeAI] DB init skipped:', e);
      }
    };

    initChat();
  }, [user]);

  const sendMessage = useCallback(async (userMessage: string, context?: ConciergeContext) => {
    if (!userMessage.trim()) return;

    setIsLoading(true);
    setError(null);

    // Optimistic UI: Add user message immediately
    const tempId = crypto.randomUUID();
    const optimisticUserMsg: ConciergeMessage = {
      id: tempId,
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, optimisticUserMsg]);

    try {
      // 1. Database Persistence Logic (Conditional on Auth)
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
              setConversations(prev => [newConv as ConversationSummary, ...prev]);
            }
          }

          if (convId) {
            await (supabase as any).from('ai_messages').insert({
              conversation_id: convId,
              user_id: user.id,
              role: 'user',
              content: userMessage
            });
          }
        } catch (dbErr) {
          logger.warn('[ConciergeAI] DB persistence skipped:', dbErr);
        }
      }

      // 2. Fetch profile data for persona consistency
      const { data: profile } = user ? await supabase
        .from('profiles')
        .select('full_name, bio, interests, lifestyle_tags')
        .eq('user_id', user.id)
        .maybeSingle() : { data: null };

      const userName = (profile as any)?.full_name || 'Friend';
      const userTier = (subscription as any)?.subscription_packages?.tier || 'Basic';

      // 3. Prepare Orchestration Payload
      const history = [...messages.slice(-10), optimisticUserMsg].map(m => ({ 
        role: m.role, 
        content: m.content 
      }));

      // 4. Invoke Edge Function
      const { data, error: funcError } = await supabase.functions.invoke('ai-orchestrator', {
        body: {
          task: 'chat',
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
            }
          }
        }
      });

      if (funcError) throw funcError;

      const rawText = data?.result?.text || 'I am processing that...';
      const aiText = rawText.replace(/\{\s*"action"\s*:[\s\S]*?\}\s*$/m, '').trim() || rawText;
      const aiAction = data?.result?.action;

      const assistantMsg: ConciergeMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: aiText,
        timestamp: new Date(),
        action: aiAction,
      };

      setMessages(prev => [...prev, assistantMsg]);
      
      if (data?.vibe) {
        setUserVibe(data.vibe);
      }

      // 5. Persist AI Response if Auth'd
      if (user && convId) {
        try {
          await (supabase as any).from('ai_messages').insert({
            conversation_id: convId,
            user_id: user.id,
            role: 'assistant',
            content: aiText,
            metadata: aiAction ? { action: aiAction } : {}
          });

          await (supabase as any)
            .from('ai_conversations')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', convId);
        } catch (dbErr) {
          logger.warn('[ConciergeAI] AI response persistence skipped:', dbErr);
        }
      }

      // 6. Execute AI-triggered UI Actions
      if (aiAction) {
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
          sonnerToast.success("Connection request sent! 🚀", {
            description: "The owner has been notified.",
          });
        }
      }

    } catch (err) {
      logger.error('[useConciergeAI] Execution error:', err);
      setError(err instanceof Error ? err.message : 'Service momentarily unavailable');
      
      // No sentient fallback message injected into chat stream anymore.
      // We rely on the `error` state and let user see the error + use the retry button.
    } finally {
      setIsLoading(false);
    }
  }, [messages, user, currentConversationId, subscription, location.pathname, queryClient]);

  // Utility Actions
  const startNewChat = useCallback(() => {
    setMessages([]);
    setCurrentConversationId(null);
  }, []);

  const switchConversation = useCallback(async (convId: string) => {
    if (!user) return;
    setCurrentConversationId(convId);

    try {
      const { data: msgs } = await (supabase as any)
        .from('ai_messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      if (msgs) {
        setMessages((msgs as any[]).map((m: any) => ({
          id: String(m.id),
          role: m.role as any,
          content: m.content,
          timestamp: new Date(m.created_at),
          action: m.metadata?.action,
        })));
      }
    } catch (err) {
      logger.error('[ConciergeAI] Switch error:', err);
    }
  }, [user]);

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

      setConversations(prev => prev.filter(c => c.id !== currentConversationId));
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
    error,
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
