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
        className="max-w-sm p-0 overflow-hidden rounded-[32px] border border-white/10 bg-black/40 backdrop-blur-2xl shadow-2xl"
      >
        {/* Animated Background Gradients */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header Section */}
        <div className="relative px-6 py-8 flex flex-col items-center text-center border-b border-white/5">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-16 h-16 rounded-[24px] bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center mb-4 shadow-lg backdrop-blur-md"
          >
            <Share2 className="w-8 h-8 text-white" strokeWidth={1.5} />
          </motion.div>
          <h2 className="text-xl font-black text-white tracking-tight mb-1.5">Share Connection</h2>
          <p className="text-xs font-medium text-white/60">
            Recommend {listingId ? 'this listing' : 'this profile'} to your network
          </p>
        </div>

        <div className="p-6 space-y-6 relative z-10">
          {/* Direct Link */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Link2 className="w-4 h-4 text-white/40" />
                </div>
                <Input 
                  value={shareUrl} 
                  readOnly 
                  className="w-full h-12 pl-9 rounded-[20px] border-white/10 bg-black/20 text-white text-xs font-mono backdrop-blur-md focus-visible:ring-1 focus-visible:ring-purple-500/50" 
                />
              </div>
              <Button
                onClick={handleCopyLink}
                className="h-12 px-6 rounded-[20px] bg-white text-black hover:bg-white/90 font-bold active:scale-95 transition-all shadow-lg"
              >
                <AnimatePresence mode="wait">
                  {copied ? (
                    <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      <span>Copied!</span>
                    </motion.div>
                  ) : (
                    <motion.div key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-2">
                      <span>Copy</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </div>
          </div>

          {/* Social Grid */}
          <div className="grid grid-cols-4 gap-3">
            {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
              <button
                onClick={handleNativeShare}
                className="flex flex-col items-center justify-center gap-2 h-20 rounded-[20px] bg-white/5 border border-white/5 hover:bg-white/10 transition-colors active:scale-95"
              >
                <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shadow-lg">
                  <Smartphone className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-white/70">More</span>
              </button>
            )}
            <button
              onClick={() => handleSocialShare('whatsapp', () => shareViaWhatsApp(shareUrl, shareText))}
              className="flex flex-col items-center justify-center gap-2 h-20 rounded-[20px] bg-white/5 border border-white/5 hover:bg-[#25D366]/20 hover:border-[#25D366]/30 transition-colors active:scale-95 group"
            >
              <div className="w-8 h-8 rounded-full bg-[#25D366]/10 text-[#25D366] group-hover:bg-[#25D366] group-hover:text-white flex items-center justify-center transition-colors">
                <MessageCircle className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-white/70">WhatsApp</span>
            </button>
            <button
              onClick={() => handleSocialShare('twitter', () => shareViaTwitter(shareUrl, shareText))}
              className="flex flex-col items-center justify-center gap-2 h-20 rounded-[20px] bg-white/5 border border-white/5 hover:bg-[#1DA1F2]/20 hover:border-[#1DA1F2]/30 transition-colors active:scale-95 group"
            >
              <div className="w-8 h-8 rounded-full bg-[#1DA1F2]/10 text-[#1DA1F2] group-hover:bg-[#1DA1F2] group-hover:text-white flex items-center justify-center transition-colors">
                <Twitter className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-white/70">X</span>
            </button>
            <button
              onClick={() => handleSocialShare('sms', () => shareViaSMS(shareUrl, shareText))}
              className="flex flex-col items-center justify-center gap-2 h-20 rounded-[20px] bg-white/5 border border-white/5 hover:bg-purple-500/20 hover:border-purple-500/30 transition-colors active:scale-95 group"
            >
              <div className="w-8 h-8 rounded-full bg-purple-500/10 text-purple-400 group-hover:bg-purple-500 group-hover:text-white flex items-center justify-center transition-colors">
                <Send className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-white/70">SMS</span>
            </button>
          </div>

          {/* Email Quick Send */}
          <div className="space-y-3 pt-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Mail className="w-4 h-4 text-white/40" />
                </div>
                <Input
                  type="email"
                  placeholder="Enter email to send"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="w-full h-12 pl-9 rounded-[20px] border-white/10 bg-black/20 text-white text-xs backdrop-blur-md focus-visible:ring-1 focus-visible:ring-purple-500/50"
                />
              </div>
              <Button
                onClick={handleEmailShare}
                disabled={!recipientEmail}
                className="h-12 w-12 rounded-[20px] p-0 bg-white/10 text-white hover:bg-white/20 border border-white/10 active:scale-95 transition-all"
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
