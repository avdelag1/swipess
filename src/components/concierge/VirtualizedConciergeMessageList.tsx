import { type RefObject, useEffect } from 'react';
import type { ChatMessage } from '@/hooks/useConciergeAI';
import { MessageBubble } from '@/components/concierge/MessageBubble';
import { TypingIndicator } from '@/components/concierge/TypingIndicator';

interface VirtualizedConciergeMessageListProps {
  scrollElementRef: RefObject<HTMLDivElement | null>;
  messages: ChatMessage[];
  isLoading: boolean;
  isSwipess: boolean;
  isLight: boolean;
  speakingMsgId: string | null;
  isSpeaking: boolean;
  onCopy: (content: string) => void;
  onDelete: (id: string) => void;
  onTranslate: (content: string) => void;
  onResend: (id: string) => void;
  onNavigate: (path: string) => void;
  onDraft: (text: string) => void;
  onFilter: (filters: Record<string, unknown>) => void;
  onPassport: (action: unknown) => void;
  onSpeak: (content: string, id: string) => void;
}

// NOTE: this previously used @tanstack/react-virtual with a fixed 120px size
// estimate and absolute `translateY` positioning. Concierge messages that embed
// a listing-card preview are far taller than 120px — and grow again when the
// card image loads — so the virtualizer's positions went stale and consecutive
// messages overlapped (a text bubble rendered on top of a listing card).
// measureElement also excludes each bubble's own mb-6 margin, compounding it.
// Concierge threads are short, so we render a plain column in normal flow (no
// measurement → no overlap) and scroll the container to the bottom on update.
export function VirtualizedConciergeMessageList({
  scrollElementRef,
  messages,
  isLoading,
  isSwipess,
  isLight,
  speakingMsgId,
  isSpeaking,
  onCopy,
  onDelete,
  onTranslate,
  onResend,
  onNavigate,
  onDraft,
  onFilter,
  onPassport,
  onSpeak,
}: VirtualizedConciergeMessageListProps) {
  useEffect(() => {
    const el = scrollElementRef.current;
    if (!el || messages.length === 0) return;
    // Wait a frame so newly added (and image-loaded) content is laid out before
    // we pin the view to the latest message.
    const id = requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    });
    return () => cancelAnimationFrame(id);
  }, [messages.length, isLoading, scrollElementRef]);

  return (
    <div className="px-6 py-8">
      {messages.map((m) => (
        <div key={m.id} className="w-full">
          <MessageBubble
            message={m}
            isUser={m.role === 'user'}
            isSwipess={isSwipess}
            isLight={isLight}
            onCopy={() => onCopy(m.content)}
            onDelete={() => onDelete(m.id)}
            onTranslate={onTranslate}
            onResend={() => onResend(m.id)}
            onNavigate={onNavigate}
            onDraft={onDraft}
            onFilter={onFilter}
            onPassport={onPassport}
            onSpeak={onSpeak}
            speakingMsgId={speakingMsgId}
            isSpeaking={isSpeaking}
          />
        </div>
      ))}
      {isLoading && <TypingIndicator isSwipess={isSwipess} />}
    </div>
  );
}
