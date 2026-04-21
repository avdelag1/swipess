import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Share2, Link2, Mail, MessageCircle, Send, Check, Facebook, Twitter } from 'lucide-react';
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

  // Include user's ID as referral ID for tracking
  const shareUrl = generateShareUrl({ listingId, profileId, referralId: user?.id });
  const shareText = description || `Check out ${title} on NEXUS DISCOVERY!`;

  const handleCopyLink = async () => {
    const success = await copyToClipboard(shareUrl);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Link copied to clipboard!');

      // Track the share
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

  const handleWhatsAppShare = async () => {
    shareViaWhatsApp(shareUrl, shareText);
    await createShare.mutateAsync({
      sharedListingId: listingId,
      sharedProfileId: profileId,
      shareMethod: 'whatsapp',
    });
  };

  const handleFacebookShare = async () => {
    shareViaFacebook(shareUrl);
    await createShare.mutateAsync({
      sharedListingId: listingId,
      sharedProfileId: profileId,
      shareMethod: 'facebook',
    });
  };

  const handleTwitterShare = async () => {
    shareViaTwitter(shareUrl, shareText);
    await createShare.mutateAsync({
      sharedListingId: listingId,
      sharedProfileId: profileId,
      shareMethod: 'twitter',
    });
  };

  const handleEmailShare = async () => {
    if (!recipientEmail) {
      toast.error('Please enter an email address');
      return;
    }

    shareViaEmail(shareUrl, title, shareText);
    await createShare.mutateAsync({
      sharedListingId: listingId,
      sharedProfileId: profileId,
      shareMethod: 'email',
      recipientEmail,
    });
    setRecipientEmail('');
  };

  const handleSMSShare = async () => {
    shareViaSMS(shareUrl, shareText);
    await createShare.mutateAsync({
      sharedListingId: listingId,
      sharedProfileId: profileId,
      shareMethod: 'sms',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md p-0 overflow-hidden rounded-[2rem] border border-purple-500/20 shadow-2xl"
        style={{ boxShadow: '0 0 0 1px rgba(168,85,247,0.12), 0 24px 80px rgba(0,0,0,0.2), 0 0 40px rgba(168,85,247,0.08)' }}
      >
        {/* Header */}
        <div
          className="relative px-5 py-4 border-b border-purple-500/15 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(88,28,135,0.18) 0%, rgba(168,85,247,0.08) 100%)' }}
        >
          {/* Animated shimmer top line */}
          <div
            className="absolute top-0 left-0 right-0 h-[2px] pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.8), rgba(216,180,254,1), rgba(168,85,247,0.8), transparent)',
              backgroundSize: '200% 100%',
              animation: 'share-shimmer 2.5s ease-in-out infinite',
            }}
          />
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center border border-purple-400/30 flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #581c87 0%, #7c3aed 50%, #a855f7 100%)', boxShadow: '0 4px 16px rgba(168,85,247,0.35)' }}
            >
              <Share2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-base text-foreground leading-none mb-1">Share with Friends</h2>
              <p className="text-[11px] text-muted-foreground">
                Recommend {listingId ? 'this listing' : 'this profile'} to someone you know
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Copy Link */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">Share Link</label>
            <div className="flex gap-2">
              <Input value={shareUrl} readOnly className="flex-1 rounded-xl border-border/60 bg-muted/40 text-xs font-mono" />
              <Button
                onClick={handleCopyLink}
                variant="outline"
                className="min-w-[90px] rounded-xl border-purple-500/25 hover:bg-purple-500/10 hover:border-purple-500/40"
              >
                <AnimatePresence mode="wait">
                  {copied ? (
                    <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-rose-500" />
                      <span className="text-xs font-semibold">Copied!</span>
                    </motion.div>
                  ) : (
                    <motion.div key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-1.5">
                      <Link2 className="w-4 h-4" />
                      <span className="text-xs font-semibold">Copy</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </div>
          </div>

          {/* Social Share */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">Share via</label>
            <div className="grid grid-cols-2 gap-2.5">
              {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
                <Button
                  onClick={handleNativeShare}
                  variant="outline"
                  className="col-span-2 w-full justify-start gap-3 rounded-xl bg-primary/8 hover:bg-primary/15 border-primary/20 text-primary font-semibold"
                >
                  <Share2 className="w-4 h-4" />
                  Instagram, TikTok, Snapchat & More
                </Button>
              )}
              <Button onClick={handleWhatsAppShare} variant="outline"
                className="w-full justify-start gap-2.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/25 border-border/60 font-medium">
                <MessageCircle className="w-4 h-4 text-rose-500" />
                WhatsApp
              </Button>
              <Button onClick={handleFacebookShare} variant="outline"
                className="w-full justify-start gap-2.5 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/25 border-border/60 font-medium">
                <Facebook className="w-4 h-4 text-blue-600" />
                Facebook
              </Button>
              <Button onClick={handleTwitterShare} variant="outline"
                className="w-full justify-start gap-2.5 rounded-xl hover:bg-sky-50 dark:hover:bg-sky-950/25 border-border/60 font-medium">
                <Twitter className="w-4 h-4 text-sky-500" />
                Twitter / X
              </Button>
              <Button onClick={handleSMSShare} variant="outline"
                className="w-full justify-start gap-2.5 rounded-xl border-border/60 font-medium">
                <Send className="w-4 h-4 text-purple-500" />
                SMS
              </Button>
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">Share via Email</label>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="friend@example.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="flex-1 rounded-xl border-border/60 bg-muted/40"
              />
              <Button
                onClick={handleEmailShare}
                variant="outline"
                disabled={!recipientEmail}
                className="rounded-xl border-purple-500/25 hover:bg-purple-500/10 font-semibold"
              >
                <Mail className="w-4 h-4 mr-1.5" />
                Send
              </Button>
            </div>
          </div>

          {/* Footer note */}
          <div className="p-3 rounded-2xl bg-muted/30 border border-border/40">
            <p className="text-xs text-muted-foreground text-center font-medium">
              Your friends will love this recommendation! 🎉
            </p>
          </div>
        </div>

        <style>{`
          @keyframes share-shimmer {
            0%   { background-position: -200% center; }
            100% { background-position: 200% center; }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}


