import { memo } from 'react';
import { motion } from 'framer-motion';
import { History, Plus, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatConvoDate } from './conciergeUtils';
import type { Conversation } from '@/hooks/useConciergeAI';

export const ConversationSidebar = memo(({
  conversations, activeId, onSelect, onDelete, onNew, onClose, isSwipess
}: {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
  onClose: () => void;
  isSwipess: boolean;
}) => (
  <motion.div
    className="absolute inset-0 z-[60] flex"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.18, ease: 'easeOut' }}
  >
    <motion.button
      type="button"
      aria-label="Close chat history"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        'absolute inset-0 border-0 cursor-pointer',
        isSwipess ? 'bg-black/45' : 'bg-black/25',
      )}
    />

    <motion.aside
      role="dialog"
      aria-label="Chat history"
      initial={{ x: '-100%' }}
      animate={{ x: 0 }}
      exit={{ x: '-100%' }}
      transition={{ type: 'tween', duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'relative z-[1] h-full w-[min(18.5rem,86vw)] flex flex-col shadow-2xl',
        isSwipess
          ? 'bg-zinc-950/98 border-r border-white/12'
          : 'bg-white/98 border-r border-black/10',
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <div className={cn(
        'h-14 shrink-0 flex items-center justify-between gap-3 px-4 border-b',
        isSwipess ? 'border-white/10' : 'border-black/8',
      )}>
        <div className="flex items-center gap-2 min-w-0">
          <span className={cn(
            'w-7 h-7 rounded-lg inline-flex items-center justify-center shrink-0',
            isSwipess ? 'bg-white/8 text-white/70' : 'bg-black/5 text-black/60',
          )}>
            <History className="w-3.5 h-3.5" strokeWidth={2.25} />
          </span>
          <h3 className={cn(
            'text-[11px] font-black uppercase tracking-[0.18em] truncate',
            isSwipess ? 'text-white/70' : 'text-black/55',
          )}>
            History
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className={cn(
            'w-8 h-8 rounded-lg inline-flex items-center justify-center transition-colors shrink-0',
            isSwipess ? 'hover:bg-white/10 text-white/70' : 'hover:bg-black/5 text-black/55',
          )}
          aria-label="Close"
        >
          <X className="w-3.5 h-3.5" strokeWidth={2.25} />
        </button>
      </div>

      <div className="p-3">
        <button
          type="button"
          onClick={onNew}
          className="w-full h-10 inline-flex items-center justify-center gap-2 rounded-xl border border-primary/25 bg-primary/10 hover:bg-primary/15 transition-colors"
        >
          <Plus className="w-3.5 h-3.5 text-primary" strokeWidth={2.5} />
          <span className="text-[10px] font-black uppercase tracking-[0.16em] text-primary">New chat</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain px-2.5 pb-4 space-y-1">
        {conversations.length === 0 ? (
          <p className={cn(
            'px-3 py-8 text-center text-[11px] font-medium',
            isSwipess ? 'text-white/35' : 'text-black/35',
          )}>
            No chats yet
          </p>
        ) : conversations.map((c) => (
          <div key={c.id} className="group relative">
            <button
              type="button"
              onClick={() => { onSelect(c.id); onClose(); }}
              className={cn(
                'w-full text-left rounded-xl px-3 pr-9 py-2.5 transition-colors border',
                activeId === c.id
                  ? (isSwipess ? 'bg-white/10 border-white/12' : 'bg-black/[0.05] border-black/10')
                  : (isSwipess ? 'border-transparent hover:bg-white/[0.05]' : 'border-transparent hover:bg-black/[0.04]'),
              )}
            >
              <span className={cn(
                'block text-[12px] font-semibold truncate leading-snug',
                activeId === c.id
                  ? 'text-primary'
                  : (isSwipess ? 'text-white/88' : 'text-black/85'),
              )}>
                {c.title || 'Untitled chat'}
              </span>
              <span className={cn(
                'block text-[10px] mt-0.5',
                isSwipess ? 'text-white/35' : 'text-black/40',
              )}>
                {formatConvoDate(new Date(c.updatedAt))}
              </span>
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
              className={cn(
                'absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg inline-flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity',
                isSwipess ? 'text-white/45 hover:text-red-400 hover:bg-white/8' : 'text-black/40 hover:text-red-500 hover:bg-black/5',
              )}
              aria-label="Delete chat"
            >
              <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
          </div>
        ))}
      </div>
    </motion.aside>
  </motion.div>
));
ConversationSidebar.displayName = 'ConversationSidebar';
