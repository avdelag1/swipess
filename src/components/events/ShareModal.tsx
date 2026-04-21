import { motion, AnimatePresence } from 'framer-motion';
import { Share2, MessageCircle, ExternalLink } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { EventItem } from '@/types/events';

export function ShareModal({
  event, open, onClose
}: {
  event: EventItem; open: boolean; onClose: () => void;
}) {
  const url = `${window.location.origin}/explore/eventos/${event.id}`;
  
  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
    onClose();
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: `Check out ${event.title} in Tulum! Sign up on NEXUS DISCOVERY to get connected 🎉`,
          url: url
        });
        onClose();
      } catch (err) {
        if ((err as Error).name !== 'AbortError') handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  const handleWhatsAppShare = () => {
    const msg = encodeURIComponent(`🎉 Check out "${event.title}" in Tulum!\n\n${url}`);
    window.open(`https://wa.me/?text=${msg}`, '_blank');
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-x-0 bottom-0 z-[110] bg-zinc-900 border-t border-white/10 rounded-t-[2.5rem] px-6 pt-8 pb-[calc(2rem+env(safe-area-inset-bottom))] text-center"
          >
            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-8" />
            <div className="w-20 h-20 rounded-[2rem] mx-auto mb-4 overflow-hidden shadow-2xl">
              <img src={event.image_url || ''} className="w-full h-full object-cover" alt="" />
            </div>
            <h3 className="text-xl font-black text-white mb-2">Share this Event</h3>
            <p className="text-white/50 text-sm mb-8">Invite friends — they'll need to sign up to see the full event.</p>
            
            <div className="grid grid-cols-3 gap-3">
              <button onClick={handleNativeShare} className="flex flex-col items-center gap-3 p-4 rounded-3xl bg-white/5 border border-white/10 active:scale-95 transition-all">
                <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <Share2 className="w-6 h-6 text-orange-400" />
                </div>
                <span className="text-[10px] font-black text-white uppercase tracking-widest">Send</span>
              </button>
              <button onClick={handleWhatsAppShare} className="flex flex-col items-center gap-3 p-4 rounded-3xl bg-white/5 border border-white/10 active:scale-95 transition-all">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-green-400" />
                </div>
                <span className="text-[10px] font-black text-white uppercase tracking-widest">WhatsApp</span>
              </button>
              <button onClick={handleCopy} className="flex flex-col items-center gap-3 p-4 rounded-3xl bg-white/5 border border-white/10 active:scale-95 transition-all">
                <div className="w-12 h-12 rounded-full bg-rose-500/20 flex items-center justify-center">
                  <ExternalLink className="w-6 h-6 text-rose-400" />
                </div>
                <span className="text-[10px] font-black text-white uppercase tracking-widest">Copy</span>
              </button>
            </div>
            
            <button onClick={onClose} className="w-full py-4 mt-8 rounded-2xl bg-white/5 text-white/40 font-black text-xs uppercase tracking-widest">
              Close
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}


