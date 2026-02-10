import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  const shareText = description || `Check out ${title} on Zwipes!`;

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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Share2 className="w-5 h-5 text-primary" />
            Share with Friends
          </DialogTitle>
          <DialogDescription>
            Recommend {listingId ? 'this property' : 'this profile'} to someone you know
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Copy Link */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Share Link</label>
            <div className="flex gap-2">
              <Input value={shareUrl} readOnly className="flex-1" />
              <Button onClick={handleCopyLink} variant="outline" className="min-w-[100px]">
                <AnimatePresence mode="wait">
                  {copied ? (
                    <motion.div
                      key="check"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="flex items-center gap-2"
                    >
                      <Check className="w-4 h-4 text-green-500" />
                      Copied!
                    </motion.div>
                  ) : (
                    <motion.div
                      key="copy"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="flex items-center gap-2"
                    >
                      <Link2 className="w-4 h-4" />
                      Copy
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </div>
          </div>

          {/* Social Share Buttons */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Share via</label>
            <div className="grid grid-cols-2 gap-3">
              {/* Native Share (if available) */}
              {navigator.share && (
                <Button
                  onClick={handleNativeShare}
                  variant="outline"
                  className="w-full justify-start gap-3"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </Button>
              )}

              {/* WhatsApp */}
              <Button
                onClick={handleWhatsAppShare}
                variant="outline"
                className="w-full justify-start gap-3 hover:bg-green-50 dark:hover:bg-green-950/20"
              >
                <MessageCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                WhatsApp
              </Button>

              {/* Facebook */}
              <Button
                onClick={handleFacebookShare}
                variant="outline"
                className="w-full justify-start gap-3 hover:bg-blue-50 dark:hover:bg-blue-950/20"
              >
                <Facebook className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Facebook
              </Button>

              {/* Twitter */}
              <Button
                onClick={handleTwitterShare}
                variant="outline"
                className="w-full justify-start gap-3 hover:bg-sky-50 dark:hover:bg-sky-950/20"
              >
                <Twitter className="w-4 h-4 text-sky-500 dark:text-sky-400" />
                Twitter
              </Button>

              {/* SMS */}
              <Button
                onClick={handleSMSShare}
                variant="outline"
                className="w-full justify-start gap-3"
              >
                <Send className="w-4 h-4" />
                SMS
              </Button>
            </div>
          </div>

          {/* Email Share */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Share via Email</label>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="friend@example.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={handleEmailShare}
                variant="outline"
                disabled={!recipientEmail}
                className="min-w-[80px]"
              >
                <Mail className="w-4 h-4 mr-2" />
                Send
              </Button>
            </div>
          </div>

          {/* Info Text */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground text-center">
              Your friends will thank you for this great recommendation! 🎉
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
