import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Copy, Send, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { appToast } from '@/utils/appNotification';
import { haptics } from '@/utils/microPolish';
import { generateShareUrl } from '@/hooks/useSharing';
import { Capacitor } from '@capacitor/core';

/**
 * Invite friends via native Contacts picker + share.
 * Tier 2 #7 cool growth feature. Uses @capacitor-community/contacts.
 * Falls back to copy link on web or no permission.
 */
export function InviteFriendsDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const [isPicking, setIsPicking] = useState(false);

  const handleInviteViaContacts = async () => {
    if (!user) return;
    setIsPicking(true);
    haptics.tap();

    try {
      if (Capacitor.isNativePlatform()) {
        const { Contacts } = await import('@capacitor-community/contacts');
        
        // Request permission
        const perm = await Contacts.requestPermissions();
        if (perm.contacts !== 'granted') {
          appToast.error('Permission needed', 'Enable contacts access in Settings to pick friends.');
          setIsPicking(false);
          return;
        }

        const result = await Contacts.pickContact();
        const contact = result.contact;
        const name = contact?.name?.display || contact?.name?.given || 'Friend';
        const phones = contact?.phones || [];
        const phone = phones[0]?.number;

        const shareLink = generateShareUrl({ referralId: user.id });
        const message = `Hey ${name}! Check out Swipess — the elite marketplace for properties, vehicles & experiences. Join with my link: ${shareLink}`;

        if (phone) {
          // Use SMS or share
          const { Share } = await import('@capacitor/share');
          await Share.share({ title: 'Join Swipess', text: message, url: shareLink });
          appToast.success('Invite sent!', `Shared with ${name}`);
        } else {
          // Fallback copy + share sheet
          await navigator.clipboard.writeText(shareLink);
          appToast.success('Link copied', 'Share it with your friend!');
        }
      } else {
        // Web fallback
        const shareLink = generateShareUrl({ referralId: user.id });
        await navigator.clipboard.writeText(shareLink);
        appToast.success('Link copied to clipboard', 'Send it to your friends!');
      }
    } catch (e: any) {
      if (e?.message?.includes('canceled') || e?.message?.includes('cancel')) {
        // user canceled picker
      } else {
        appToast.error('Invite failed', 'Try the share button instead.');
      }
    } finally {
      setIsPicking(false);
      onClose();
    }
  };

  const handleCopyLink = async () => {
    if (!user) return;
    const link = generateShareUrl({ referralId: user.id });
    await navigator.clipboard.writeText(link);
    appToast.success('Link copied!', 'Share with friends to earn perks.');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10020] flex items-center justify-center p-4 bg-black/60 backdrop-blur">
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.98, opacity: 0, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-md rounded-3xl bg-zinc-950 border border-white/10 p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-2xl bg-primary/10">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-black text-lg tracking-tighter">Invite Friends</h3>
                  <p className="text-[11px] text-white/50 uppercase tracking-[0.2em]">Grow the circle</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleInviteViaContacts}
                disabled={isPicking}
                className="w-full h-14 rounded-2xl bg-white text-black font-black uppercase tracking-[0.2em] active:scale-[0.985] flex items-center justify-center gap-2"
              >
                {isPicking ? 'Opening Contacts...' : (
                  <>
                    <Users className="w-4 h-4" /> Pick from Contacts &amp; Invite
                  </>
                )}
              </Button>

              <Button
                onClick={handleCopyLink}
                variant="outline"
                className="w-full h-14 rounded-2xl border-white/20 font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2"
              >
                <Copy className="w-4 h-4" /> Copy Referral Link
              </Button>
            </div>

            <p className="text-[10px] text-center text-white/40 mt-4 tracking-widest uppercase">Friends get priority access • You unlock perks</p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
