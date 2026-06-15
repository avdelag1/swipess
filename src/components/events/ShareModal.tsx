import { AnimatePresence, motion } from 'framer-motion';
import { ExternalLink, MessageCircle, Share2 } from 'lucide-react';
import { appToast } from '@/utils/appNotification';
import { EventItem } from '@/types/events';
import { canNativeShare, generateShareUrl, shareViaNavigator } from '@/hooks/useSharing';
import { useAuth } from '@/hooks/useAuth';

export function ShareModal({
  event, open, onClose
}: {
  event: EventItem; open: boolean; onClose: () => void;
}) {
  const { user } = useAuth();
  const url = generateShareUrl({ eventId: event.id, referralId: user?.id });
  const previewImage = event.image_url || (Array.isArray(event.image_urls)
    ? event.image_urls.map((item: any) => typeof item === 'string' ? item : item?.url || item?.image_url || item?.src).find(Boolean)
    : '') || '';
  
  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    appToast.success("Link copied to clipboard!");
    onClose();
  };

  const handleNativeShare = async () => {
    if (canNativeShare()) {
      await shareViaNavigator({
        title: event.title,
        text: `Check out ${event.title} in Miami! Sign up on Swipess to get connected 🎉`,
        url,
      });
      onClose();
    } else {
      handleCopy();
    }
  };

  const handleWhatsAppShare = () => {
    const msg = encodeURIComponent(`🎉 Check out "${event.title}" in Miami!\n\n${url}`);
    window.open(`https://wa.me/?text=${msg}`, '_system');
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
            className="force-white fixed inset-x-0 bottom-0 z-[110] bg-zinc-900 border-t border-white/10 rounded-t-[2.5rem] px-6 pt-8 pb-[calc(2rem+env(safe-area-inset-bottom))] text-center"
          >
            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-8" />
            <div className="w-full aspect-[16/10] rounded-[2rem] mx-auto mb-5 overflow-hidden shadow-2xl bg-card border border-border">
              <img src={previewImage} className="w-full h-full object-cover" alt={event.title} />
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
                <div className="w-12 h-12 rounded-full bg-rose-500/20 flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-rose-400" />
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
            
            <button onClick={onClose} className="w-full py-4 mt-8 rounded-2xl bg-white/5 text-white/70 font-black text-xs uppercase tracking-widest">
              Close
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}


