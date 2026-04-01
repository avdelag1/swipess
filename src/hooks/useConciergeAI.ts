import { useState, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './useAuth';
import { useUserSubscription } from './useSubscription';
import { useLocation } from 'react-router-dom';
import { MEMORIES_QUERY_KEY } from './useUserMemories';

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

  const storageKey = user ? `${STORAGE_KEY_PREFIX}${user.id}` : null;
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  // Load conversation list + latest active conversation on mount
  useEffect(() => {
    if (!user) return;

    const initChat = async () => {
      // Fetch recent conversations for the history list
      const { data: convList } = await (supabase as any)
        .from('ai_conversations')
        .select('id, title, created_at, updated_at')
        .eq('user_id', user.id)
        .eq('is_archived', false)
        .order('updated_at', { ascending: false })
        .limit(10);

      if (convList) setConversations(convList as any);

      // Load the most recent active conversation
      if (convList && convList.length > 0) {
        const latest = (convList as any)[0];
        setCurrentConversationId(latest.id as string);

        const { data: msgs } = await supabase
          .from('ai_messages')
          .select('*')
          .eq('conversation_id', latest.id)
          .order('created_at', { ascending: true });

        if (msgs) {
          setMessages(msgs.map(m => ({
            id: m.id,
            role: m.role as any,
            content: m.content,
            timestamp: new Date(m.created_at),
            action: m.metadata?.action,
          })));
        }
      }
    };

    initChat();
  }, [user]);

  const sendMessage = useCallback(async (userMessage: string, context?: ConciergeContext) => {
    if (!user) {
      toast.error('Please sign in to use the Concierge');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Optimistic UI: Add user message immediately
      const tempId = crypto.randomUUID();
      const optimisticUserMsg: ConciergeMessage = {
        id: tempId,
        role: 'user',
        content: userMessage,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, optimisticUserMsg]);
      
      // 1. Ensure we have a conversation record
      let convId = currentConversationId;
      if (!convId) {
        const { data: newConv, error: convErr } = await supabase
          .from('ai_conversations')
          .insert({ user_id: user.id, title: userMessage.substring(0, 40) })
          .select()
          .single();

        if (convErr) throw convErr;
        convId = newConv.id;
        setCurrentConversationId(convId);
        setConversations(prev => [newConv, ...prev]);
      }

      // 2. Save User Message to DB
      const userMsg: ConciergeMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: userMessage,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, userMsg]);

      await (supabase as any).from('ai_messages').insert({
        conversation_id: convId,
        user_id: user.id,
        role: 'user',
        content: userMessage
      });

      // 3. Fetch profile for userName (light query — heavy data is fetched server-side)
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, bio, interests, lifestyle_tags')
        .eq('id', user.id)
        .maybeSingle();

      const userName = profile?.full_name || 'Friend';
      const userTier = subscription?.subscription_packages?.tier || 'Basic';

      const history = messages.slice(-15).map(m => ({ role: m.role, content: m.content }));

      const { data, error: funcError } = await supabase.functions.invoke('ai-orchestrator', {
        body: {
          task: 'chat',
          data: {
            query: userMessage,
            userName,
            userTier,
            messages: history,
            context: {
              city: context?.city || 'Tulum',
              userRole: context?.userRole,
              listings: context?.listings?.slice(0, 5),
              currentPath: location.pathname,
            }
          }
        }
      });

      if (funcError) throw funcError;

      const rawText = data?.result?.text || 'I am processing that...';
      const aiText = rawText.replace(/\{\s*"action"\s*:[\s\S]*?\}\s*$/m, '').trim() || rawText;
      const aiAction = data?.result?.action;

      const assistantMsg: ConciergeMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiText,
        timestamp: new Date(),
        action: aiAction,
      };

      setMessages(prev => [...prev, assistantMsg]);
      
      if (data?.vibe) {
        setUserVibe(data.vibe);
      }

      // 4. Save AI Response to DB
      await (supabase as any).from('ai_messages').insert({
        conversation_id: convId!,
        user_id: user.id,
        role: 'assistant',
        content: aiText,
        metadata: aiAction ? { action: aiAction } : {}
      });

      // 5. Handle save_memory action — persist new fact to user_memories table
      if (aiAction?.type === 'save_memory' && aiAction.params) {
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
          // Invalidate the memories cache so the memory panel refreshes
          queryClient.invalidateQueries({ queryKey: MEMORIES_QUERY_KEY(user.id) });
          toast.success(`Remembered: ${title}`, { duration: 2000 });
        }
      }

      // 6. Update conversation updated_at
      await supabase
        .from('ai_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', convId!);

    } catch (err) {
      console.error('Concierge Error:', err);
      setError(err instanceof Error ? err.message : 'Service unavailable');
    } finally {
      setIsLoading(false);
    }
  }, [messages, user, currentConversationId, subscription, location.pathname]);

  // Start a fresh conversation (archives current)
  const startNewChat = useCallback(async () => {
    if (currentConversationId && user) {
      await supabase
        .from('ai_conversations')
        .update({ is_archived: true })
        .eq('id', currentConversationId);
      setConversations(prev => prev.filter(c => c.id !== currentConversationId));
    }
    setMessages([]);
    setCurrentConversationId(null);
  }, [currentConversationId, user]);

  // Switch to a different conversation from history
  const switchConversation = useCallback(async (convId: string) => {
    if (!user) return;
    setCurrentConversationId(convId);

    const { data: msgs } = await supabase
      .from('ai_messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });

    if (msgs) {
      setMessages(msgs.map(m => ({
        id: m.id,
        role: m.role as any,
        content: m.content,
        timestamp: new Date(m.created_at),
        action: m.metadata?.action,
      })));
    }
  }, [user]);

  // Archive current conversation
  const clearMessages = useCallback(async () => {
    if (!currentConversationId || !user) {
      setMessages([]);
      return;
    }

    try {
      await supabase
        .from('ai_conversations')
        .update({ is_archived: true })
        .eq('id', currentConversationId);

      setConversations(prev => prev.filter(c => c.id !== currentConversationId));
      setMessages([]);
      setCurrentConversationId(null);
      toast.success('Conversation archived');
    } catch (err) {
      console.error('Failed to clear messages:', err);
    }
  }, [currentConversationId, user]);

  // Permanently delete current conversation
  const deletePermanently = useCallback(async () => {
    if (!currentConversationId || !user) return;

    try {
      await supabase
        .from('ai_conversations')
        .delete()
        .eq('id', currentConversationId);

      setConversations(prev => prev.filter(c => c.id !== currentConversationId));
      setMessages([]);
      setCurrentConversationId(null);
      toast.success('Conversation deleted');
    } catch (err) {
      console.error('Failed to delete:', err);
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
    deletePermanently,
    userVibe,
    isConfigured: true,
  };
}
