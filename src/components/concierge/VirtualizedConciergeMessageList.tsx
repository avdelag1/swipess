import { useVirtualizer } from '@tanstack/react-virtual';
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
  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => scrollElementRef.current,
    estimateSize: () => 120,
    overscan: 6,
  });

  useEffect(() => {
    if (messages.length > 0) {
      virtualizer.scrollToIndex(messages.length - 1, { align: 'end', behavior: 'smooth' });
    }
  }, [messages.length, isLoading, virtualizer]);

  return (
    <div className="px-6 py-8">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const m = messages[virtualRow.index];
          return (
            <div
              key={m.id}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
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
          );
        })}
      </div>
      {isLoading && <TypingIndicator isSwipess={isSwipess} />}
    </div>
  );
}