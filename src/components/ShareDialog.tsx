import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Share2, Link2, Mail, MessageCircle, Send, Check, Facebook, Twitter, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  useCreateShare,
  copyToClipboard,
  shareViaNavigator,
  shareViaWhatsApp,
  shareViaFacebook,
  shareViaTwitter,
  shareViaEmail,
  shareViaSMS,
  generateShareUrl,
} from '@/hooks/useSharing';
import { useAuth } from '@/hooks/useAuth';
import { triggerHaptic } from '@/utils/haptics';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listingId?: string;
  profileId?: string;
  title: string;
  description?: string;
}

export function ShareDialog({
  open,
  onOpenChange,
  listingId,
  profileId,
  title,
  description,
}: ShareDialogProps) {
  const [copied, setCopied] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const createShare = useCreateShare();
  const { user } = useAuth();

  const shareUrl = generateShareUrl({ listingId, profileId, referralId: user?.id });
  const shareText = description || `Check out ${title} on Swipess!`;

  const handleCopyLink = async () => {
    triggerHaptic('medium');
    const success = await copyToClipboard(shareUrl);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Link copied to clipboard!');

      await createShare.mutateAsync({
        sharedListingId: listingId,
        sharedProfileId: profileId,
        shareMethod: 'link_copied',
      });
    } else {
      toast.error('Failed to copy link');
    }
  };

  const handleNativeShare = async () => {
    triggerHaptic('light');
    const shared = await shareViaNavigator({
      title,
      text: shareText,
      url: shareUrl,
    });

    if (shared) {
      await createShare.mutateAsync({
        sharedListingId: listingId,
        sharedProfileId: profileId,
        shareMethod: 'other',
      });
    }
  };

  const handleSocialShare = async (platform: string, handler: () => void) => {
    triggerHaptic('light');
    handler();
    await createShare.mutateAsync({
      sharedListingId: listingId,
      sharedProfileId: profileId,
      shareMethod: platform as any,
    });
  };

  const handleEmailShare = async () => {
    if (!recipientEmail) {
      toast.error('Please enter an email address');
      return;
    }
    triggerHaptic('light');
    shareViaEmail(shareUrl, title, shareText);
    await createShare.mutateAsync({
      sharedListingId: listingId,
      sharedProfileId: profileId,
      shareMethod: 'email',
      recipientEmail,
    });
    setRecipientEmail('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-sm p-0 overflow-hidden rounded-[40px] border border-white/10 bg-[#0A0A0A] shadow-[0_32px_80px_rgba(0,0,0,0.8)]"
      >
        {/* 🛸 NEXUS ATMOSPHERE: Subtle ambient glows instead of deep blur backgrounds */}
        <div className="absolute top-0 right-0 w-full h-1/2 bg-gradient-to-b from-rose-500/5 to-transparent pointer-events-none" />

        {/* Header Section */}
        <div className="relative px-8 pt-10 pb-6 flex flex-col items-center text-center border-b border-white/[0.03]">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-16 h-16 rounded-[24px] bg-[#1A1A1A] border border-white/10 flex items-center justify-center mb-5 shadow-xl"
          >
            <Share2 className="w-8 h-8 text-white" strokeWidth={1.5} />
          </motion.div>
          <h2 className="text-xl font-bold text-white tracking-tight leading-none mb-2">Share Connection</h2>
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">
            Spread the Swipess vibe
          </p>
        </div>

        <div className="p-8 space-y-8 relative z-10">
          {/* Direct Link Section */}
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1 group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Link2 className="w-4 h-4 text-white/30" />
                </div>
                <Input 
                  value={shareUrl} 
                  readOnly 
                  className="w-full h-12 pl-11 rounded-[16px] border-white/5 bg-[#161616] text-white text-[10px] font-mono tracking-tight focus-visible:ring-1 focus-visible:ring-rose-500/30" 
                />
              </div>
              <Button
                onClick={handleCopyLink}
                className="h-12 px-6 rounded-[16px] bg-white text-black hover:bg-gray-200 font-bold uppercase tracking-widest text-[10px] active:scale-95 transition-all shadow-lg border-none"
              >
                <AnimatePresence mode="wait">
                  {copied ? (
                    <motion.div key="check" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 stroke-[3px]" />
                    </motion.div>
                  ) : (
                    <motion.div key="copy" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}>
                      Copy
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </div>
          </div>

          {/* Social Grid: Clean and Professional */}
          <div className="grid grid-cols-4 gap-3">
            {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
              <button
                onClick={handleNativeShare}
                className="flex flex-col items-center justify-center gap-2.5 h-20 rounded-[20px] bg-[#1A1A1A] border border-white/[0.05] hover:bg-[#222] transition-all active:scale-95 group"
              >
                <div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center shadow-md">
                  <Smartphone className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">More</span>
              </button>
            )}
            
            {[
              { id: 'whatsapp', icon: MessageCircle, label: 'Chat', handler: () => shareViaWhatsApp(shareUrl, shareText) },
              { id: 'twitter', icon: Twitter, label: 'X', handler: () => shareViaTwitter(shareUrl, shareText) },
              { id: 'sms', icon: Send, label: 'SMS', handler: () => shareViaSMS(shareUrl, shareText) }
            ].map((platform) => (
              <button
                key={platform.id}
                onClick={() => handleSocialShare(platform.id, platform.handler)}
                className="flex flex-col items-center justify-center gap-2.5 h-20 rounded-[20px] bg-[#1A1A1A] border border-white/[0.05] hover:bg-[#222] transition-all active:scale-95 group"
              >
                <div className="w-9 h-9 rounded-xl bg-[#262626] text-white flex items-center justify-center border border-white/[0.05] shadow-md">
                  <platform.icon className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">{platform.label}</span>
              </button>
            ))}
          </div>

          {/* Email Quick Send */}
          <div className="space-y-4 pt-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Mail className="w-4 h-4 text-white/30" />
                </div>
                <Input
                  type="email"
                  placeholder="Email to share"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="w-full h-12 pl-11 rounded-[16px] border-white/5 bg-[#161616] text-white text-[11px] focus-visible:ring-1 focus-visible:ring-rose-500/30 transition-all"
                />
              </div>
              <Button
                onClick={handleEmailShare}
                disabled={!recipientEmail}
                className="h-12 w-12 rounded-[16px] p-0 bg-[#1A1A1A] text-white hover:bg-[#222] border border-white/[0.05] active:scale-95 transition-all"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}
