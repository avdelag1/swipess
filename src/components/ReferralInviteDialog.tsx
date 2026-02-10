import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Gift, Link2, Mail, MessageCircle, Send, Check, Facebook, Twitter, Users, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  copyToClipboard,
  shareViaNavigator,
  shareViaWhatsApp,
  shareViaFacebook,
  shareViaTwitter,
  shareViaEmail,
  shareViaSMS,
} from '@/hooks/useSharing';

interface ReferralInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReferralInviteDialog({ open, onOpenChange }: ReferralInviteDialogProps) {
  const [copied, setCopied] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const { user } = useAuth();

  // Referral stats - disabled since table doesn't exist
  // Use fallback values instead
  const referralStats = {
    invitation_code: user?.id?.substring(0, 8) || 'LOADING',
    total_referrals: 0,
    total_rewards_earned: 0,
  };

  // Generate referral URL with user's ID
  const baseUrl = import.meta.env.VITE_APP_URL || 'https://swipess.com';
  const shareUrl = `${baseUrl}/?ref=${user?.id}`;
  const invitationCode = referralStats?.invitation_code || user?.id?.substring(0, 8) || 'LOADING';

  const shareText = `Join me on Zwipes! Use my invitation code ${invitationCode} and we both get free message activations! 🎁`;

  const handleCopyLink = async () => {
    const success = await copyToClipboard(shareUrl);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Referral link copied to clipboard!');
    } else {
      toast.error('Failed to copy link');
    }
  };

  const handleCopyCode = async () => {
    const success = await copyToClipboard(invitationCode);
    if (success) {
      toast.success('Invitation code copied!');
    } else {
      toast.error('Failed to copy code');
    }
  };

  const handleNativeShare = async () => {
    await shareViaNavigator({
      title: 'Join Zwipes',
      text: shareText,
      url: shareUrl,
    });
  };

  const handleWhatsAppShare = () => {
    shareViaWhatsApp(shareUrl, shareText);
  };

  const handleFacebookShare = () => {
    shareViaFacebook(shareUrl);
  };

  const handleTwitterShare = () => {
    shareViaTwitter(shareUrl, shareText);
  };

  const handleEmailShare = () => {
    if (!recipientEmail) {
      toast.error('Please enter an email address');
      return;
    }

    const emailSubject = 'Join me on Zwipes!';
    const emailBody = `Hey! I'm using Zwipes to find my perfect rental match and thought you'd like it too.\n\n${shareText}\n\nSign up here:`;
    shareViaEmail(shareUrl, emailSubject, emailBody);
    setRecipientEmail('');
    toast.success('Email client opened!');
  };

  const handleSMSShare = () => {
    shareViaSMS(shareUrl, shareText);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Gift className="w-5 h-5 text-primary" />
            Invite Friends & Earn Free Messages
          </DialogTitle>
          <DialogDescription>
            Share your invitation link and you both get free message activations!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Referral Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-primary/10 rounded-lg text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Users className="w-4 h-4 text-primary" />
                <p className="text-2xl font-bold text-primary">
                  {referralStats?.total_referrals || 0}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">Friends Invited</p>
            </div>
            <div className="p-4 bg-green-500/10 rounded-lg text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {referralStats?.total_rewards_earned || 0}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">Rewards Earned</p>
            </div>
          </div>

          {/* How It Works */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <h3 className="font-semibold text-sm mb-2">How it works:</h3>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">1.</span>
                <span>Share your unique invitation link with friends</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">2.</span>
                <span>They sign up using your link</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">3.</span>
                <span>You both get free message activations! 🎉</span>
              </li>
            </ul>
          </div>

          {/* Invitation Code */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Your Invitation Code</label>
            <div className="flex gap-2">
              <Input
                value={invitationCode}
                readOnly
                className="flex-1 text-center text-lg font-mono font-bold tracking-wider"
              />
              <Button onClick={handleCopyCode} variant="outline">
                <Link2 className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Friends can enter this code during signup
            </p>
          </div>

          {/* Share Link */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Your Referral Link</label>
            <div className="flex gap-2">
              <Input value={shareUrl} readOnly className="flex-1 text-sm" />
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
                  <Send className="w-4 h-4" />
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

          {/* Rewards Info */}
          <div className="p-3 bg-gradient-to-r from-primary/10 to-green-500/10 rounded-lg border border-primary/20">
            <p className="text-xs font-medium text-center">
              <span className="text-primary">You get 1 free message</span> for each friend who signs up!
              <br />
              <span className="text-green-600 dark:text-green-400">They get 2 free messages</span> to get started! 🎁
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
