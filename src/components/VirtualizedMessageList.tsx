import { memo, useEffect, useRef } from 'react';
import useAppTheme from '@/hooks/useAppTheme';
import { formatDistanceToNow } from '@/utils/timeFormatter';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { ScrollText, File, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { appToast } from '@/utils/appNotification';

interface MessageType {
  id: string;
  client_id?: string;
  conversation_id: string;
  sender_id: string;
  content?: string | null;
  message_type: string;
  created_at: string;
  is_read?: boolean;
  sender?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  attachments?: any;
}

interface TypingUser {
  userId: string;
  userName: string;
}

interface VirtualizedMessageListProps {
  messages: MessageType[];
  currentUserId: string;
  otherUserRole: string;
  typingUsers: TypingUser[];
}

const MessageBubble = memo(({
  message,
  isMyMessage,
  _otherUserRole,
  isThemeLight
}: {
  message: MessageType;
  isMyMessage: boolean;
  otherUserRole: string;
  isThemeLight: boolean;
}) => {
  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
      className={cn("flex mb-2.5 px-4", isMyMessage ? 'justify-end' : 'justify-start')}
    >
      <div
        className={cn(
          "max-w-[78%] px-4 py-3 transition-all duration-200",
          isMyMessage
            ? "bg-gradient-to-br from-[#EB4898] to-[#c0392b] text-white rounded-[1.5rem] rounded-br-[0.35rem] shadow-[0_4px_20px_rgba(235,72,152,0.3)]"
            : cn(
                "border rounded-[1.5rem] rounded-bl-[0.35rem]",
                isThemeLight
                  ? "bg-white border-black/[0.07] text-black shadow-sm"
                  : "bg-secondary border-white/[0.08] text-white shadow-md backdrop-blur-xl"
              )
        )}
      >
        <p className={cn(
          "text-[14px] font-medium break-words whitespace-pre-wrap leading-relaxed",
          isMyMessage ? "text-white" : (isThemeLight ? "text-black" : "text-white/90")
        )}>
          {message.content || ''}
        </p>
        
        {message.message_type === 'document' && message.attachments && (
          <div 
            onClick={async () => {
              const att = message.attachments;
              if (att.type === 'contract') {
                appToast.info('Contract viewed', `Opened ${att.name}`);
                // Provide hook for the app to open the contract preview if implemented
                window.dispatchEvent(new CustomEvent('open-contract', { detail: { contractId: att.id } }));
              } else if (att.type === 'document') {
                try {
                  const { data } = await supabase.storage.from('legal-documents').createSignedUrl(att.id, 60);
                  if (data?.signedUrl) window.open(data.signedUrl, '_blank');
                  else appToast.error('Could not load document');
                } catch {
                  appToast.error('Error loading document');
                }
              }
            }}
            className={cn(
              "mt-3 flex items-center gap-3 p-3 rounded-xl border transition-all active:scale-95 cursor-pointer",
              isMyMessage 
                ? "bg-white/10 border-white/20 hover:bg-white/20" 
                : (isThemeLight ? "bg-slate-50 border-slate-200 hover:bg-slate-100" : "bg-white/5 border-white/10 hover:bg-white/10")
            )}
          >
            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", 
              message.attachments.type === 'contract' 
                ? (isMyMessage ? "bg-white/20 text-white" : "bg-[#EB4898]/10 text-[#EB4898]")
                : (isMyMessage ? "bg-white/20 text-white" : "bg-violet-500/10 text-violet-500")
            )}>
              {message.attachments.type === 'contract' ? <ScrollText className="w-5 h-5" /> : <File className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn("text-[13px] font-bold truncate", isMyMessage ? "text-white" : (isThemeLight ? "text-slate-900" : "text-white"))}>
                {message.attachments.name}
              </p>
              <p className={cn("text-[10px] uppercase tracking-widest mt-0.5", isMyMessage ? "text-white/70" : (isThemeLight ? "text-slate-500" : "text-white/50"))}>
                {message.attachments.type === 'contract' ? 'Digital Contract' : 'Vault Document'}
              </p>
            </div>
            <Download className={cn("w-4 h-4 shrink-0 opacity-50", isMyMessage ? "text-white" : (isThemeLight ? "text-slate-400" : "text-white/40"))} />
          </div>
        )}

        <div className={cn(
          "text-[9px] mt-1.5 font-semibold text-right",
          isMyMessage ? "text-white/60" : (isThemeLight ? "text-black/30" : "text-white/30")
        )}>
          {formatDistanceToNow(new Date(message.created_at), { addSuffix: false })}
        </div>
      </div>
    </motion.div>
  );
});

MessageBubble.displayName = 'MessageBubble';

const TypingIndicator = memo(({ isThemeLight }: { isThemeLight: boolean }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex justify-start items-end gap-2 mt-2 px-5 pb-4"
  >
    <div className={cn(
      "px-4 py-3 rounded-[1.5rem] rounded-bl-[0.35rem] border",
      isThemeLight
        ? "bg-white border-black/[0.07] shadow-sm"
        : "bg-secondary border-white/[0.08] shadow-md backdrop-blur-xl"
    )}>
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 bg-[#EB4898] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-[#EB4898] rounded-full animate-bounce" style={{ animationDelay: '120ms' }} />
        <span className="w-2 h-2 bg-[#EB4898] rounded-full animate-bounce" style={{ animationDelay: '240ms' }} />
      </div>
    </div>
  </motion.div>
));

TypingIndicator.displayName = 'TypingIndicator';

export const VirtualizedMessageList = memo(({
  messages,
  currentUserId,
  otherUserRole,
  typingUsers,
}: VirtualizedMessageListProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(0);
  const { theme } = useAppTheme();
  const isThemeLight = theme === 'light' || theme === 'Swipess-style';

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > prevLengthRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    prevLengthRef.current = messages.length;
  }, [messages.length]);

  if (messages.length === 0) return null;

  return (
    <div
      ref={scrollRef}
      className="flex-1 min-h-0 overflow-y-auto py-4 bg-transparent overscroll-contain"
    >
      {messages.map((message) => {
        const isMyMessage = message.sender_id === currentUserId;
        return (
          <div key={message.id || message.client_id}>
            <MessageBubble
              message={message}
              isMyMessage={isMyMessage}
              otherUserRole={otherUserRole}
              isThemeLight={isThemeLight}
            />
          </div>
        );
      })}
      <AnimatePresence>
        {typingUsers.length > 0 && <TypingIndicator isThemeLight={isThemeLight} />}
      </AnimatePresence>
    </div>
  );
});

VirtualizedMessageList.displayName = 'VirtualizedMessageList';
