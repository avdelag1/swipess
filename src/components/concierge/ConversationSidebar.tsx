import { memo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, X } from 'lucide-react';
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
  <motion.div className="absolute inset-0 z-50 pointer-events-none" initial={false}>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="absolute inset-0 z-40 bg-black/20 backdrop-blur-sm sm:hidden pointer-events-auto"
    />
    <motion.div
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -300, opacity: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 350 }}
      className={cn(
        "absolute inset-y-0 left-0 w-72 z-50 flex flex-col transition-all pointer-events-auto",
        isSwipess ? "neo-naive-panel--dark border-r border-white/15" : "neo-naive-panel border-r border-black/10"
      )}
    >
    <div className={cn("flex items-center justify-between px-6 py-5 border-b", isSwipess ? "border-white/[0.06]" : "border-border")}>
      <h3 className={cn("text-[10px] font-black uppercase tracking-[0.3em] italic", isSwipess ? "text-white/50" : "text-foreground/50")}>ARCHIVES</h3>
      <button onClick={onClose} className={cn("p-2 rounded-full transition-all", isSwipess ? "hover:bg-white/[0.08]" : "hover:bg-foreground/[0.08]")}>
        <X className={cn("w-4 h-4 opacity-70", isSwipess ? "text-white" : "text-foreground")} />
      </button>
    </div>

    <div className="p-4">
      <button
        onClick={onNew}
        className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl border bg-primary/10 border-primary/20 hover:bg-primary/20 transition-all group shadow-lg"
      >
        <Plus className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Initialize Session</span>
      </button>
    </div>

    <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-1">
      {conversations.map((c) => (
        <div key={c.id} className="group relative">
          <button
            onClick={() => { onSelect(c.id); onClose(); }}
            className={cn(
              "w-full flex flex-col items-start px-5 py-4 rounded-xl transition-all duration-300 border",
              activeId === c.id
                ? (isSwipess ? "bg-white/[0.08] border-white/[0.12]" : "bg-foreground/[0.06] border-foreground/[0.10]")
                : (isSwipess ? "hover:bg-white/[0.04] border-transparent" : "hover:bg-foreground/[0.04] border-transparent")
            )}
          >
            <span className={cn("text-[11px] font-black uppercase tracking-tight truncate w-full text-left", activeId === c.id ? "text-primary" : (isSwipess ? "text-white/85" : "text-foreground/85"))}>
              {c.title || 'Untitled Discovery'}
            </span>
            <span className={cn("text-[9px] font-bold uppercase tracking-tighter mt-1", isSwipess ? "text-white/40" : "text-foreground/40")}>{formatConvoDate(new Date(c.updatedAt))}</span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
            className={cn("absolute right-2 top-1/2 -translate-y-1/2 p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500", isSwipess ? "text-white/60" : "text-foreground/60")}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  </motion.div>
  </motion.div>
));
ConversationSidebar.displayName = 'ConversationSidebar';
