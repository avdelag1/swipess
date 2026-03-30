import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './useAuth';
import { useUserSubscription } from './useSubscription';
import { useLocation, useNavigate } from 'react-router-dom';
import i18n from '@/i18n';

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

const STORAGE_KEY_PREFIX = 'Swipess_vibe_chat_';

export function useConciergeAI() {
  const [messages, setMessages] = useState<ConciergeMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userVibe, setUserVibe] = useState<string | null>(null);
  const { user } = useAuth();
  const { data: subscription } = useUserSubscription();
  const location = useLocation();
  const navigate = useNavigate();

  const storageKey = user ? `${STORAGE_KEY_PREFIX}${user.id}` : null;

  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  // Load latest conversation or create new one on mount
  useEffect(() => {
    if (!user) return;
    
    const initChat = async () => {
      // Try to find an active (non-archived) conversation
      const { data: convs } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_archived', false)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (convs && convs.length > 0) {
        setCurrentConversationId(convs[0].id);
        
        // Load messages for this conversation
        const { data: msgs } = await supabase
          .from('ai_messages')
          .select('*')
          .eq('conversation_id', convs[0].id)
          .order('created_at', { ascending: true });

        if (msgs) {
          setMessages(msgs.map(m => ({
            id: m.id,
            role: m.role as any,
            content: m.content,
            timestamp: new Date(m.created_at)
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
      // 1. Ensure we have a conversation record
      let convId = currentConversationId;
      if (!convId) {
        const { data: newConv, error: convErr } = await supabase
          .from('ai_conversations')
          .insert({ user_id: user.id, title: userMessage.substring(0, 30) })
          .select()
          .single();
        
        if (convErr) throw convErr;
        convId = newConv.id;
        setCurrentConversationId(convId);
      }

      // 2. Save User Message to DB
      const userMsg: ConciergeMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: userMessage,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, userMsg]);

      await supabase.from('ai_messages').insert({
        conversation_id: convId,
        user_id: user.id,
        role: 'user',
        content: userMessage
      });

      // 3. AI Logic (unchanged orchestrator call)
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
              listings: context?.listings?.slice(0, 5)
            }
          }
        }
      });

      if (funcError) throw funcError;

      const rawText = data?.result?.text || 'I am processing that...';
      // Strip any leaked JSON action blocks — user should only see the human-readable message,
      // never raw internal {"action": ...} objects that were meant for tool execution only.
      const aiText = rawText.replace(/\{\s*"action"\s*:[\s\S]*?\}\s*$/m, '').trim() || rawText;
      const assistantMsg: ConciergeMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiText,
        timestamp: new Date(),
        action: data?.result?.action
      };
      
      setMessages(prev => [...prev, assistantMsg]);
      
      if (data?.vibe) {
        setUserVibe(data.vibe);
      }

      // 4. Save AI Response to DB
      await supabase.from('ai_messages').insert({
        conversation_id: convId!,
        user_id: user.id,
        role: 'assistant',
        content: aiText,
        metadata: assistantMsg.action ? { action: assistantMsg.action } : {}
      });

    } catch (err) {
      console.error('Concierge Error:', err);
      setError(err instanceof Error ? err.message : 'Service unavailable');
    } finally {
      setIsLoading(false);
    }
  }, [messages, user, currentConversationId, subscription]);

  const clearMessages = useCallback(async () => {
    if (!currentConversationId || !user) {
      setMessages([]);
      return;
    }

    try {
      // Soft-delete: Move to archive rather than permanent wipe for "Archive" feature
      await supabase
        .from('ai_conversations')
        .update({ is_archived: true })
        .eq('id', currentConversationId);
      
      setMessages([]);
      setCurrentConversationId(null);
      toast.success('Conversation archived');
    } catch (err) {
      console.error('Failed to clear messages:', err);
    }
  }, [currentConversationId, user]);

  const deletePermanently = useCallback(async () => {
    if (!currentConversationId || !user) return;
    
    try {
      await supabase
        .from('ai_conversations')
        .delete()
        .eq('id', currentConversationId);
      
      setMessages([]);
      setCurrentConversationId(null);
      toast.success('Conversation permanently deleted');
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  }, [currentConversationId, user]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    deletePermanently,
    userVibe,
    isConfigured: true, 
  };
}
