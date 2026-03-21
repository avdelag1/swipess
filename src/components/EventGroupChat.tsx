import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, MessageSquare, Users, Sparkles } from 'lucide-react';
import { triggerHaptic } from '@/utils/haptics';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';

interface EventGroupChatProps {
  eventId: string;
  eventTitle: string;
  onClose: () => void;
}

export const EventGroupChat = ({ eventId, eventTitle, onClose }: EventGroupChatProps) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [message, setMessage] = React.useState('');

  const handleSend = () => {
    if (!message.trim()) return;
    triggerHaptic('medium');
    setMessage('');
    // TODO: Implement actual Supabase Realtime chat logic
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1000] flex flex-col pointer-events-none">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
        />
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className={cn(
            "mt-auto w-full max-w-lg mx-auto rounded-t-[3rem] shadow-2xl pointer-events-auto flex flex-col overflow-hidden border-t",
            isLight ? "bg-white border-slate-200" : "bg-zinc-900 border-white/5"
          )}
          style={{ height: '85vh' }}
        >
          {/* Header */}
          <div className="p-6 border-b border-black/5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className={cn("text-lg font-black italic uppercase tracking-tighter leading-none mb-1", isLight ? "text-slate-900" : "text-white")}>
                  {eventTitle}
                </h3>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                    42 Neighbors Active
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-all", isLight ? "bg-slate-100" : "bg-white/10")}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Messages Placeholder */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
             <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-30">
                <div className="p-4 rounded-3xl bg-slate-100 dark:bg-white/5">
                   <MessageSquare className="w-10 h-10" />
                </div>
                <div className="space-y-1">
                   <p className="text-sm font-black uppercase tracking-widest tracking-tighter">Event Chat Incoming</p>
                   <p className="text-[10px] font-medium max-w-[200px] mx-auto">Connecting with neighbors in the Riviera Maya...</p>
                </div>
             </div>

             {/* Mock messages for depth */}
             <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                   <div key={i} className={cn("flex gap-3", i % 2 === 0 ? "flex-row-reverse" : "")}>
                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-white/10 shrink-0" />
                      <div className={cn(
                        "p-4 rounded-2xl max-w-[70%]",
                        i % 2 === 0 
                          ? "bg-primary text-white" 
                          : isLight ? "bg-slate-100 text-slate-900" : "bg-white/5 text-white"
                      )}>
                         <div className="w-24 h-2 bg-black/10 dark:bg-white/10 rounded-full mb-2" />
                         <div className="w-16 h-2 bg-black/5 dark:bg-white/5 rounded-full" />
                      </div>
                   </div>
                ))}
             </div>
          </div>

          {/* Input Area */}
          <div className={cn(
            "p-6 pb-[calc(1.5rem+var(--safe-bottom))] bg-transparent pt-2",
            isLight ? "bg-slate-50/50" : "bg-black/20"
          )}>
            <div className={cn(
              "flex items-center gap-3 p-2 rounded-3xl border transition-all",
              isLight ? "bg-white border-slate-200" : "bg-zinc-900 border-white/10"
            )}>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Say something to the group..."
                className="flex-1 bg-transparent px-4 py-3 text-sm font-medium outline-none"
              />
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleSend}
                className="w-11 h-11 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20"
              >
                <Send className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
