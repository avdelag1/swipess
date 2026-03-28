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
  const { user } = useAuth();
  const { data: subscription } = useUserSubscription();
  const location = useLocation();
  const navigate = useNavigate();

  const storageKey = user ? `${STORAGE_KEY_PREFIX}${user.id}` : null;

  // Hydrate messages from localStorage on mount/user change
  useEffect(() => {
    if (!storageKey) return;
    
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Ensure timestamps are Date objects
        const hydrated = parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }));
        setMessages(hydrated);
      }
    } catch (err) {
      console.warn('[Vibe] Failed to hydrate chat:', err);
    }
  }, [storageKey]);

  // Sync messages to localStorage whenever they change
  useEffect(() => {
    if (!storageKey || messages.length === 0) return;
    
    try {
      // Limit persistence to last 20 messages for UI depth
      // (Prompt context still limited to 5 for speed)
      const toStore = messages.slice(-20);
      localStorage.setItem(storageKey, JSON.stringify(toStore));
    } catch (err) {
      console.warn('[Vibe] Failed to persist chat:', err);
    }
  }, [messages, storageKey]);
  
  const sendMessage = useCallback(async (userMessage: string, context?: ConciergeContext) => {
    if (!user) {
      toast.error('Please sign in to use the Concierge');
      return;
    }

    setIsLoading(true);
    setError(null);

    const userMsg: ConciergeMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };
    
    // Optimistically update UI
    setMessages(prev => [...prev.slice(-19), userMsg]);

    try {
      // 1. Fetch user profile for deep personalization
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, bio, interests, lifestyle_tags')
        .eq('id', user.id)
        .maybeSingle();

      const userName = profile?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || 'Friend';
      const userTier = subscription?.subscription_packages?.tier || 'Basic';
      const userLang = i18n.language || 'en';

      // LIGHTNING-FAST CONTEXT: Only sync the last 5 relevant messages to keep prompt lean.
      const history = messages
        .filter(m => !m.content.includes('I encountered an error') && !m.content.includes('Service unavailable'))
        .slice(-5) 
        .map(m => ({
          role: m.role,
          content: m.content.length > 400 ? m.content.substring(0, 400) + '...' : m.content
        }));

      // 2. Call the AI Orchestrator with refined context
      const { data, error: funcError } = await supabase.functions.invoke('ai-orchestrator', {
        body: {
          task: 'chat',
          data: {
            query: userMessage,
            userName,
            userTier,
            userLang,
            userProfile: {
              bio: profile?.bio,
              interests: profile?.interests,
              lifestyle: profile?.lifestyle_tags
            },
            currentPath: location.pathname,
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

      const aiText = data?.result?.text || data?.result?.message || 'I apologize, but I could not generate a response.';
      const aiAction = data?.result?.action;

      const assistantMsg: ConciergeMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiText,
        timestamp: new Date(),
        action: aiAction
      };
      
      setMessages(prev => [...prev.slice(-19), assistantMsg]);

      // 3. Handle Vibe Actions
      if (aiAction) {
        console.log('[Vibe] Action Triggered:', aiAction);
        
        switch (aiAction.type) {
          case 'navigate':
            if (aiAction.params?.path) {
              toast(`Navigating to ${aiAction.params.path}`, { 
                icon: '🚀',
                description: 'Vibe is taking you there now.' 
              });
              setTimeout(() => navigate(aiAction.params.path), 1200);
            }
            break;
          case 'open_search':
            const category = aiAction.params?.category || 'property';
            toast(`Opening ${category} search...`, { icon: '🔍' });
            window.dispatchEvent(new CustomEvent('open-ai-search', { detail: { category } }));
            break;
          case 'create_listing':
            const targetCategory = aiAction.params?.category || 'property';
            toast(`Opening Listing Creator for ${targetCategory}`, { icon: '✍️' });
            navigate('/owner/listings/new-ai', { state: { category: targetCategory } });
            break;
          case 'update_profile':
            toast.success("Profile update requested! I'll handle that.", { icon: '📝' });
            break;
          default:
            console.warn('[Vibe] Unknown action:', aiAction.type);
        }
      }

    } catch (err) {
      console.error('Concierge Error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Service unavailable';
      setError(errorMessage);
      
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I encountered an error: ${errorMessage}. I'll keep trying to assist you.`,
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, user, subscription, location.pathname, navigate]);

  const clearMessages = useCallback(() => {
    if (storageKey) localStorage.removeItem(storageKey);
    setMessages([]);
    setError(null);
  }, [storageKey]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    isConfigured: true, 
  };
}
