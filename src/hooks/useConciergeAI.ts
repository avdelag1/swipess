import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { useUserSubscription } from '@/hooks/useSubscription';
import { useTokens } from '@/hooks/useTokens';
import { logSupabaseError } from '@/lib/supabaseError';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  provider?: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export type AiCharacter = 'default' | 'kyle' | 'beaugosse' | 'donajkiin' | 'botbetter' | 'lunashanti' | 'ezriyah';

const STORAGE_KEY = 'Swipess-ai-conversations';
const CHARACTER_KEY = 'Swipess-ai-character';
const EGO_KEY = 'Swipess-ai-ego';
const MAX_CONVERSATIONS = 20;
const MAX_MESSAGES = 50;

const AGREE_PATTERN = /\b(right|yeah|yes|exactly|true|good point|facts|for real|that's it|makes sense|you're right)\b/i;
const CHALLENGE_PATTERN = /\b(no|wrong|disagree|that doesn't|are you sure|I don't think|nah|cap|doubt)\b/i;

// ─── localStorage helpers (fallback) ───────────────────────────────────────

function loadConversationsLocal(): Conversation[] {
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

function saveConversationsLocal(conversations: Conversation[]) {
  try {
    const trimmed = conversations.slice(0, MAX_CONVERSATIONS).map(c => ({
      ...c,
      messages: c.messages.slice(-MAX_MESSAGES),
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch { /* quota exceeded */ }
}

// ─── Cloud sync helpers ────────────────────────────────────────────────────

async function getUserId(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}

async function loadConversationsCloud(userId: string): Promise<Conversation[]> {
  try {
    const { data: convos, error } = await supabase
      .from('ai_conversations')
      .select('id, title, created_at, updated_at')
      .eq('user_id', userId)
      .eq('is_archived', false)
      .order('updated_at', { ascending: false })
      .limit(MAX_CONVERSATIONS);

    if (error || !convos || convos.length === 0) return [];

    // Fetch messages for all conversations in parallel
    const convoIds = convos.map(c => c.id);
    const { data: msgs, error: msgErr } = await supabase
      .from('ai_messages')
      .select('id, conversation_id, role, content, created_at')
      .in('conversation_id', convoIds)
      .order('created_at', { ascending: true });

    if (msgErr) console.error('[AI Cloud] msg load error:', msgErr);

    const msgsByConvo = new Map<string, ChatMessage[]>();
    for (const m of (msgs ?? [])) {
      const arr = msgsByConvo.get(m.conversation_id) ?? [];
      arr.push({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        timestamp: new Date(m.created_at),
      });
      msgsByConvo.set(m.conversation_id, arr);
    }

    return convos.map(c => ({
      id: c.id,
      title: c.title || 'New conversation',
      messages: (msgsByConvo.get(c.id) ?? []).slice(-MAX_MESSAGES),
      createdAt: new Date(c.created_at),
      updatedAt: new Date(c.updated_at),
    }));
  } catch (e) {
    console.error('[AI Cloud] load error:', e);
    return [];
  }
}

async function saveConversationCloud(userId: string, convo: Conversation) {
  try {
    await supabase.from('ai_conversations').upsert({
      id: convo.id,
      user_id: userId,
      title: convo.title,
      updated_at: convo.updatedAt.toISOString(),
      created_at: convo.createdAt.toISOString(),
    }, { onConflict: 'id' });
  } catch (e) {
    console.error('[AI Cloud] save convo error:', e);
  }
}

async function saveMessageCloud(userId: string, conversationId: string, msg: ChatMessage) {
  try {
    await supabase.from('ai_messages').upsert({
      id: msg.id,
      conversation_id: conversationId,
      user_id: userId,
      role: msg.role,
      content: msg.content,
      created_at: msg.timestamp.toISOString(),
    }, { onConflict: 'id' });
  } catch (e) {
    console.error('[AI Cloud] save msg error:', e);
  }
}

async function deleteConversationCloud(convoId: string) {
  try {
    // Messages cascade-delete via FK
    const { error } = await supabase.from('ai_conversations').delete().eq('id', convoId);
    logSupabaseError('ai_conversations.delete', error);
  } catch (e) {
    console.error('[AI Cloud] delete error:', e);
  }
}

async function clearAllConversationsCloud(userId: string) {
  try {
    const { error } = await supabase.from('ai_conversations').delete().eq('user_id', userId);
    logSupabaseError('ai_conversations.deleteAll', error);
  } catch (e) {
    console.error('[AI Cloud] clear all error:', e);
  }
}

// ─── Utility ───────────────────────────────────────────────────────────────

function generateTitle(content: string): string {
  return content.length > 40 ? content.slice(0, 40) + '…' : content;
}

function stripThinkBlocks(text: string): string {
  return text.replace(/<tool_call>[\s\S]*?<\/think>/g, '').trim();
}

function parseLooseJson<T = any>(raw: string): T | null {
  const cleaned = raw
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  const variants = [
    cleaned,
    cleaned
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']')
      .replace(/[\x00-\x1F\x7F]/g, ''),
  ];

  for (const variant of variants) {
    try {
      return JSON.parse(variant) as T;
    } catch {
      continue;
    }
  }

  return null;
}

function extractAssistantReply(payload: any): string | null {
  if (!payload || typeof payload !== 'object') return null;
  return payload.reply
    || payload.content
    || payload.message?.content
    || payload.choices?.[0]?.message?.content
    || payload.choices?.[0]?.delta?.content
    || null;
}

function detectTruncation(text: string): boolean {
  const trimmed = text.trim();
  const openBraces = (trimmed.match(/{/g) || []).length;
  const closeBraces = (trimmed.match(/}/g) || []).length;
  const openBrackets = (trimmed.match(/\[/g) || []).length;
  const closeBrackets = (trimmed.match(/\]/g) || []).length;

  if (openBraces !== closeBraces || openBrackets !== closeBrackets) return true;

  return [/\.\.\.$/, /…$/, /\[truncated\]/i, /\[continued\]/i].some((pattern) => pattern.test(trimmed));
}

function normalizeAssistantReply(text: string): string {
  const cleaned = stripThinkBlocks(text)
    .replace(/\[truncated\]/gi, '')
    .replace(/\[continued\]/gi, '')
    .trim();

  return detectTruncation(cleaned) ? cleaned.replace(/[….]$/, '').trim() : cleaned;
}

// AI concierge runs on Lovable Cloud (edge functions deploy here automatically)
// All user data stays on production Supabase — AI only handles chat, no user data
const AI_URL = 'https://vplgtcguxujxwrgguxqq.supabase.co/functions/v1/ai-concierge';
const AUTH_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwbGd0Y2d1eHVqeHdyZ2d1eHFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwMDI5MDIsImV4cCI6MjA2MzU3ODkwMn0.-TzSQ-nDho4J6TftVF4RNjbhr5cKbknQxxUT-AaSIJU';

export function useConciergeAI() {
  // Premium access check
  const { data: subscription } = useUserSubscription();
  const { tokens } = useTokens();
  const isPremium = !!(subscription?.is_active);
  // For now: allow access if premium OR has tokens. Free users blocked.
  // During development/testing, set to true to keep AI open for everyone:
  const canUseAI = true; // TODO: Change to `isPremium || tokens > 0` when ready to gate

  const [conversations, setConversations] = useState<Conversation[]>(loadConversationsLocal);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    () => loadConversationsLocal()[0]?.id ?? null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [cloudReady, setCloudReady] = useState(false);
  const userIdRef = useRef<string | null>(null);
  const [activeCharacter, setActiveCharacterState] = useState<AiCharacter>(
    () => (localStorage.getItem(CHARACTER_KEY) as AiCharacter) || 'default'
  );
  const [egoLevel, setEgoLevelState] = useState<number>(
    () => parseInt(localStorage.getItem(EGO_KEY) || '6', 10)
  );

  // ─── Cloud sync on mount ─────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const uid = await getUserId();
      if (cancelled || !uid) return;
      userIdRef.current = uid;

      const cloudConvos = await loadConversationsCloud(uid);
      if (cancelled) return;

      if (cloudConvos.length > 0) {
        // Merge: cloud is source of truth, but keep local-only convos
        const cloudIds = new Set(cloudConvos.map(c => c.id));
        const localOnly = loadConversationsLocal().filter(c => !cloudIds.has(c.id));
        const merged = [...cloudConvos, ...localOnly]
          .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
          .slice(0, MAX_CONVERSATIONS);

        setConversations(merged);
        saveConversationsLocal(merged);
        setActiveConversationId(prev => prev ?? merged[0]?.id ?? null);

        // Push local-only convos to cloud
        for (const c of localOnly) {
          await saveConversationCloud(uid, c);
          for (const m of c.messages) {
            await saveMessageCloud(uid, c.id, m);
          }
        }
      }
      setCloudReady(true);
    })();
    return () => { cancelled = true; };
  }, []);

  const setActiveCharacter = useCallback((c: AiCharacter) => {
    setActiveCharacterState(c);
    localStorage.setItem(CHARACTER_KEY, c);
  }, []);

  const setEgoLevel = useCallback((level: number) => {
    const clamped = Math.max(1, Math.min(10, level));
    setEgoLevelState(clamped);
    localStorage.setItem(EGO_KEY, String(clamped));
  }, []);

  const abortRef = useRef<AbortController | null>(null);
  const isSendingRef = useRef(false); // Ref-based guard against double sends
  const streamBufferRef = useRef<{ convoId: string; msgId: string; content: string } | null>(null);
  const rafRef = useRef<number | null>(null);

  const activeConversation = conversations.find(c => c.id === activeConversationId) ?? null;
  const messages = activeConversation?.messages ?? [];

  const updateConversationsLive = useCallback((updater: (prev: Conversation[]) => Conversation[]) => {
    setConversations(prev => updater(prev));
  }, []);

  const updateConversations = useCallback((updater: (prev: Conversation[]) => Conversation[]) => {
    setConversations(prev => {
      const next = updater(prev);
      saveConversationsLocal(next);
      return next;
    });
  }, []);

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

    // Cloud sync (fire-and-forget)
    const uid = userIdRef.current;
    if (uid) saveConversationCloud(uid, newConvo);

    return id;
  }, [updateConversations]);

  const switchConversation = useCallback((id: string) => {
    setActiveConversationId(id);
  }, []);

  const deleteConversation = useCallback((id: string) => {
    updateConversations(prev => {
      const next = prev.filter(c => c.id !== id);
      if (activeConversationId === id) {
        setActiveConversationId(null);
      }
      return next;
    });
    // Cloud sync
    deleteConversationCloud(id);
  }, [activeConversationId, updateConversations]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading || isSendingRef.current) return;
    isSendingRef.current = true; // Lock immediately to prevent double calls
    if (!canUseAI) {
      toast.error('Upgrade to Premium to use Swipess AI', { description: 'Subscribe or purchase tokens to unlock the AI concierge.' });
      return;
    }

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
      const uid = userIdRef.current;
      if (uid) saveConversationCloud(uid, newConvo);
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

    // Cloud sync user message
    const uid = userIdRef.current;
    if (uid && convoId) {
      saveMessageCloud(uid, convoId, userMsg);
      // Update convo title if first message
      const convo = conversations.find(c => c.id === convoId);
      if (convo && convo.messages.length === 0) {
        saveConversationCloud(uid, { ...convo, title: generateTitle(content.trim()), updatedAt: new Date() });
      }
    }

    setIsLoading(true);
    const abortController = new AbortController();
    abortRef.current = abortController;

    try {
      const currentConvo = conversations.find(c => c.id === convoId);
      const allMsgs = [...(currentConvo?.messages ?? []), userMsg];
      const apiMessages = allMsgs.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

      // Adjust ego/charm/wisdom/sass/zen based on user message content
      if (activeCharacter !== 'default') {
        if (AGREE_PATTERN.test(content)) setEgoLevel(egoLevel + 1);
        else if (CHALLENGE_PATTERN.test(content)) setEgoLevel(egoLevel - 1);
      }

      const resp = await fetch(AI_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AUTH_KEY}`,
        },
        body: JSON.stringify({
          messages: apiMessages,
          ...(activeCharacter === 'kyle' ? { character: 'kyle', egoLevel } : {}),
          ...(activeCharacter === 'beaugosse' ? { character: 'beaugosse', charmLevel: egoLevel } : {}),
          ...(activeCharacter === 'donajkiin' ? { character: 'donajkiin', wisdomLevel: egoLevel } : {}),
          ...(activeCharacter === 'botbetter' ? { character: 'botbetter', sassLevel: egoLevel } : {}),
          ...(activeCharacter === 'lunashanti' ? { character: 'lunashanti', zenLevel: egoLevel } : {}),
          ...(activeCharacter === 'ezriyah' ? { character: 'ezriyah', flowLevel: egoLevel } : {}),
        }),
        signal: abortController.signal,
      });

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
      const aiProvider = resp.headers.get('x-ai-provider') || undefined;

      if (contentType.includes('text/event-stream') && resp.body) {
        const assistantMsgId = crypto.randomUUID();
        const assistantTimestamp = new Date();
        let fullContent = '';

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
                provider: aiProvider,
              }],
              updatedAt: new Date(),
            };
          })
        );

        streamBufferRef.current = { convoId: convoId!, msgId: assistantMsgId, content: '' };
        rafRef.current = requestAnimationFrame(flushStreamBuffer);

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let streamDone = false;

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
            if (jsonStr === '[DONE]') {
              streamDone = true;
              break;
            }

            const parsed = parseLooseJson<any>(jsonStr);
            if (!parsed) {
              buffer = line + '\n' + buffer;
              break;
            }

            const delta = parsed.choices?.[0]?.delta?.content
              || parsed.delta?.content
              || (typeof parsed.content === 'string' ? parsed.content : null)
              || '';

            if (delta) {
              fullContent += delta;
              streamBufferRef.current = { convoId: convoId!, msgId: assistantMsgId, content: fullContent };
            }
          }

          if (streamDone) break;
        }

        if (buffer.trim()) {
          for (let raw of buffer.split('\n')) {
            if (!raw) continue;
            if (raw.endsWith('\r')) raw = raw.slice(0, -1);
            if (!raw.startsWith('data: ')) continue;
            const jsonStr = raw.slice(6).trim();
            if (jsonStr === '[DONE]') continue;
            const parsed = parseLooseJson<any>(jsonStr);
            const delta = parsed?.choices?.[0]?.delta?.content
              || parsed?.delta?.content
              || (typeof parsed?.content === 'string' ? parsed.content : null)
              || '';
            if (delta) fullContent += delta;
          }
        }

        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        streamBufferRef.current = null;
        const finalCleaned = normalizeAssistantReply(fullContent) || 'No response received.';

        const assistantMsg: ChatMessage = {
          id: assistantMsgId,
          role: 'assistant',
          content: finalCleaned,
          timestamp: assistantTimestamp,
          provider: aiProvider,
        };

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

        // Cloud sync assistant message
        if (uid && convoId) {
          saveMessageCloud(uid, convoId, assistantMsg);
          saveConversationCloud(uid, { id: convoId, title: generateTitle(content.trim()), messages: [], createdAt: new Date(), updatedAt: new Date() });
        }
      } else {
        const rawResponse = await resp.text();
        const parsed = parseLooseJson<any>(rawResponse);
        const reply = normalizeAssistantReply(
          extractAssistantReply(parsed) || rawResponse || 'No response received.'
        );

        if (!reply) {
          toast.error('AI temporarily unavailable. Please try again.');
          setIsLoading(false);
          return;
        }

        const assistantMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: reply,
          timestamp: new Date(),
          provider: aiProvider,
        };

        updateConversations(prev =>
          prev.map(c => {
            if (c.id !== convoId) return c;
            return { ...c, messages: [...c.messages, assistantMsg], updatedAt: new Date() };
          })
        );

        // Cloud sync
        if (uid && convoId) {
          saveMessageCloud(uid, convoId, assistantMsg);
        }
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') { isSendingRef.current = false; return; }
      console.error('[ConciergeAI]', err);
      toast.error('AI temporarily unavailable. Please try again.');
    } finally {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamBufferRef.current = null;
      setIsLoading(false);
      isSendingRef.current = false; // Unlock
      abortRef.current = null;
    }
  }, [activeConversationId, conversations, isLoading, canUseAI, updateConversations, updateConversationsLive, flushStreamBuffer, activeCharacter, egoLevel, setEgoLevel]);

  const resendMessage = useCallback(async (messageId: string) => {
    if (!activeConversation || isLoading) return;
    const msgIndex = activeConversation.messages.findIndex(m => m.id === messageId);
    if (msgIndex === -1) return;
    const targetMsg = activeConversation.messages[msgIndex];
    if (targetMsg.role !== 'user') return;

    updateConversations(prev =>
      prev.map(c => {
        if (c.id !== activeConversationId) return c;
        return { ...c, messages: c.messages.slice(0, msgIndex) };
      })
    );

    await sendMessage(targetMsg.content);
  }, [activeConversation, activeConversationId, isLoading, sendMessage, updateConversations]);

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamBufferRef.current = null;
    setIsLoading(false);
  }, []);

  const deleteMessage = useCallback(async (messageId: string) => {
    if (!activeConversationId) return;

    updateConversations(prev =>
      prev.map(c => {
        if (c.id !== activeConversationId) return c;
        return {
          ...c,
          messages: c.messages.filter(m => m.id !== messageId),
          updatedAt: new Date(),
        };
      })
    );

    // Cloud sync (delete from DB)
    const uid = userIdRef.current;
    if (uid) {
      try {
        const { error } = await supabase.from('ai_messages').delete().eq('id', messageId);
        logSupabaseError('ai_messages.delete', error);
      } catch (e) {
        console.error('[AI Cloud] delete message error:', e);
      }
    }
  }, [activeConversationId, updateConversations]);

  const clearHistory = useCallback(() => {
    setConversations([]);
    setActiveConversationId(null);
    localStorage.removeItem(STORAGE_KEY);
    const uid = userIdRef.current;
    if (uid) clearAllConversationsCloud(uid);
  }, []);

  return {
    messages,
    conversations,
    activeConversationId,
    isLoading,
    sendMessage,
    resendMessage,
    deleteMessage, // Expose newly added function
    stopGeneration,
    createConversation,
    switchConversation,
    deleteConversation,
    clearHistory,
    activeCharacter,
    setActiveCharacter,
    egoLevel,
    setEgoLevel,
    canUseAI,
    isPremium,
  };
}


