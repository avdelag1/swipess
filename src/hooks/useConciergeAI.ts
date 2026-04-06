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
  const [isThinking, setIsThinking] = useState(false);
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
            setMessages((msgs as any[])
              .filter((m: any) => m.content && m.content.trim() !== '')
              .map((m: any) => ({
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
    setIsThinking(true);
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

      // 4. Invoke Edge Function with Streaming
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '');
      const functionUrl = `${supabaseUrl}/functions/v1/ai-orchestrator`;
      
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
          'apikey': anonKey,
          'X-Client-Info': 'swipess-pwa-concierge'
        },
        body: JSON.stringify({
          task: 'chat',
          stream: false,
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
        })
      });

      if (!response.ok) {
        let errorMessage = `AI Engine Error: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.error) errorMessage = `AI Engine Error: ${errorData.error}`;
        } catch (e) {
          // If 405, it might be a method issue or CORS preflight rejection
          if (response.status === 405) {
            errorMessage = "AI Engine Connection Refused (405). Please retry in a moment.";
          }
        }
        throw new Error(errorMessage);
      }

      // Check if response is streaming (text/event-stream)
      const contentType = response.headers.get('Content-Type')?.toLowerCase() || '';
      const isStream = contentType.includes('text/event-stream');
      
      if (isStream && response.body) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let accumulatedText = '';
        const assistantId = crypto.randomUUID();
        let firstTokenReceived = false;

        if (!reader) throw new Error("Stream reader failed");

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const rawChunk = decoder.decode(value, { stream: true });
            
            // 🚀 ROBUST SSE STREAM PARSING: Handle potential multi-line chunks
            const lines = rawChunk.split('\n');
            for (const line of lines) {
              const trimmedLine = line.trim();
              if (trimmedLine.startsWith('data:')) {
                const dataStr = trimmedLine.slice(trimmedLine.startsWith('data: ') ? 6 : 5).trim();
                if (dataStr === '[DONE]') continue;
                
                try {
                  const parsed = JSON.parse(dataStr);
                  const token = parsed.choices?.[0]?.delta?.content || "";
                
                  if (token) {
                    if (!firstTokenReceived) {
                      firstTokenReceived = true;
                      setIsThinking(false);
                      setMessages(prev => [...prev, {
                        id: assistantId,
                        role: 'assistant',
                        content: '',
                        timestamp: new Date()
                      }]);
                    }
                    
                    accumulatedText += token;

                    // Update UI in real-time
                    setMessages(prev => prev.map(m => 
                      m.id === assistantId ? { ...m, content: accumulatedText.replace(/\{\s*"action"\s*:[\s\S]*?\}\s*$/m, '').trim() } : m
                    ));
                  }
                } catch (e) {
                  // Ignore partial JSON or heartbeats
                }
              } else if (trimmedLine.startsWith('{') && !firstTokenReceived) {
                // 🛡️ JSON DETECTED IN STREAM BLOCK: Major hint of a backend error response (status 200 but error JSON)
                try {
                  const parsed = JSON.parse(trimmedLine);
                  if (parsed.error) {
                    throw new Error(parsed.error);
                  }
                } catch (e) { /* not JSON error, continue */ }
              }
            }
          }
        } catch (streamErr: any) {
          logger.error('[ConciergeAI] Stream broken:', streamErr);
          throw streamErr;
        }

        const finalRawText = accumulatedText;
        const aiText = finalRawText.replace(/\{\s*"action"\s*:[\s\S]*?\}\s*$/m, '').trim() || finalRawText;
        const actionMatch = finalRawText.match(/(\{\s*"action"\s*:[\s\S]*?\}\s*)$/m);
        let aiAction = null;
        if (actionMatch) {
          try {
            aiAction = JSON.parse(actionMatch[0])?.action;
          } catch (e) {
            logger.warn('[ConciergeAI] Action parse failed:', e);
          }
        }

        // Ensure we stop thinking if the stream ended without tokens
        if (!firstTokenReceived) {
          setIsThinking(false);
          const fallbackText = "I encountered a processing glitch. Please try again.";
          const aid = assistantId;
          setMessages(prev => [...prev, {
            id: aid,
            role: 'assistant',
            content: fallbackText,
            timestamp: new Date()
          }]);
        } else {
          // Final UI Update with processed actions
          setMessages(prev => prev.map(m => 
            m.id === assistantId ? { ...m, content: aiText, action: aiAction } : m
          ));
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
          handleAiAction(aiAction);
        }

      } else {
        // Fallback for non-streaming responses
        setIsThinking(false);
        const data = await response.json();
        const rawText = data?.result?.text || data?.choices?.[0]?.message?.content || data?.message || 'I am processing that...';
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

        // Persist AI response to DB (mirrors streaming path)
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
            logger.warn('[ConciergeAI] Non-stream AI response persistence skipped:', dbErr);
          }
        }

        if (aiAction) handleAiAction(aiAction);
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
  }, [messages, user, currentConversationId, subscription, location.pathname, queryClient]);

  // Dedicated action handler to reduce complexity in sendMessage
  const handleAiAction = useCallback(async (aiAction: any) => {
    if (!aiAction || !user) return;
    
    if (aiAction.type === 'save_memory' && aiAction.params) {
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
  }, [user, queryClient]);

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
        setMessages((msgs as any[])
          .filter((m: any) => m.content && m.content.trim() !== '')
          .map((m: any) => ({
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
