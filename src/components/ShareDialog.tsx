import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Share2, Link2, Mail, MessageCircle, Send, Check, Twitter, Smartphone, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  useCreateShare,
  copyToClipboard,
  shareViaNavigator,
  shareViaWhatsApp,
  shareViaTwitter,
  shareViaEmail,
  shareViaSMS,
  generateShareUrl,
} from '@/hooks/useSharing';
import { useAuth } from '@/hooks/useAuth';
import { triggerHaptic } from '@/utils/haptics';
import useAppTheme from '@/hooks/useAppTheme';
import { cn } from '@/lib/utils';

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
  const { isLight } = useAppTheme();

  const shareUrl = generateShareUrl({ listingId, profileId, referralId: user?.id });
  const shareText = description || `Check out ${title} on Swipess!`;

  const handleCopyLink = async () => {
    triggerHaptic('medium');
    const success = await copyToClipboard(shareUrl);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Link copied to clipboard!');
      await createShare.mutateAsync({ sharedListingId: listingId, sharedProfileId: profileId, shareMethod: 'link_copied' });
    } else {
      toast.error('Failed to copy link');
    }
  };

  const handleNativeShare = async () => {
    triggerHaptic('light');
    const shared = await shareViaNavigator({ title, text: shareText, url: shareUrl });
    if (shared) {
      await createShare.mutateAsync({ sharedListingId: listingId, sharedProfileId: profileId, shareMethod: 'other' });
    }
  };

  const handleSocialShare = async (platform: string, handler: () => void) => {
    triggerHaptic('light');
    handler();
    await createShare.mutateAsync({ sharedListingId: listingId, sharedProfileId: profileId, shareMethod: platform as any });
  };

  const handleEmailShare = async () => {
    if (!recipientEmail) {
      toast.error('Please enter an email address');
      return;
    }
    triggerHaptic('light');
    shareViaEmail(shareUrl, title, shareText);
    await createShare.mutateAsync({ sharedListingId: listingId, sharedProfileId: profileId, shareMethod: 'email', recipientEmail });
    setRecipientEmail('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideCloseButton
        className={cn(
          "max-w-sm p-0 overflow-hidden rounded-[32px] border shadow-2xl max-h-[90dvh] flex flex-col",
          isLight ? "bg-white border-slate-200" : "bg-[#0A0A0A] border-white/10"
        )}
      >
        {/* Header */}
        <div className={cn(
          "shrink-0 relative px-6 pt-7 pb-5 flex flex-col items-center text-center border-b",
          isLight ? "border-slate-200" : "border-white/[0.05]"
        )}>
          <button
            onClick={() => onOpenChange(false)}
            className={cn(
              "absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-all",
              isLight ? "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
                      : "bg-white/5 text-white/70 hover:bg-white/10 border border-white/10"
            )}
          >
            <X className="w-4 h-4" />
          </button>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-md border",
              isLight ? "bg-slate-100 border-slate-200" : "bg-white/[0.06] border-white/10"
            )}
          >
            <Share2 className={cn("w-7 h-7", isLight ? "text-slate-900" : "text-white")} strokeWidth={1.7} />
          </motion.div>
          <h2 className={cn("text-lg font-bold tracking-tight leading-none mb-1.5", isLight ? "text-slate-900" : "text-white")}>
            Share
          </h2>
          <p className={cn("text-[11px] font-semibold uppercase tracking-[0.18em]", isLight ? "text-slate-400" : "text-white/40")}>
            Spread the Swipess vibe
          </p>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Direct link */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
                <Link2 className={cn("w-4 h-4", isLight ? "text-slate-400" : "text-white/40")} />
              </div>
              <Input
                value={shareUrl}
                readOnly
                className={cn(
                  "w-full h-12 pl-10 rounded-2xl text-[11px] font-mono tracking-tight",
                  isLight
                    ? "bg-slate-50 border-slate-200 text-slate-700"
                    : "bg-[#161616] border-white/10 text-white"
                )}
              />
            </div>
            <Button
              onClick={handleCopyLink}
              className="h-12 px-5 rounded-2xl font-bold uppercase tracking-wider text-xs active:scale-95 transition-all border-none bg-primary !text-primary-foreground hover:bg-primary/90 shadow-[0_14px_30px_-10px_hsl(var(--primary)/0.55)]"
            >
              <AnimatePresence mode="wait">
                {copied ? (
                  <motion.div key="check" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}>
                    <Check className="w-4 h-4 stroke-[3px]" />
                  </motion.div>
                ) : (
                  <motion.span key="copy" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}>
                    Copy
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </div>

          {/* Social grid */}
          <div className="grid grid-cols-4 gap-2.5">
            {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
              <button
                onClick={handleNativeShare}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 h-20 rounded-2xl border active:scale-95 transition-all",
                  isLight
                    ? "bg-white border-slate-200 shadow-[0_8px_20px_-10px_rgba(15,23,42,0.18)] hover:shadow-[0_12px_28px_-10px_rgba(15,23,42,0.28)]"
                    : "bg-[#161616] border-white/[0.06] hover:bg-[#1d1d1d]"
                )}
              >
                <div className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center shadow-sm",
                  isLight ? "bg-slate-900 text-white" : "bg-white text-black"
                )}>
                  <Smartphone className="w-4 h-4" />
                </div>
                <span className={cn("text-[10px] font-bold uppercase tracking-wider", isLight ? "text-slate-700" : "text-white/60")}>More</span>
              </button>
            )}
            {[
              { id: 'whatsapp', icon: MessageCircle, label: 'Chat', handler: () => shareViaWhatsApp(shareUrl, shareText) },
              { id: 'twitter', icon: Twitter, label: 'X', handler: () => shareViaTwitter(shareUrl, shareText) },
              { id: 'sms', icon: Send, label: 'SMS', handler: () => shareViaSMS(shareUrl, shareText) }
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => handleSocialShare(p.id, p.handler)}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 h-20 rounded-2xl border active:scale-95 transition-all",
                  isLight
                    ? "bg-white border-slate-200 shadow-[0_8px_20px_-10px_rgba(15,23,42,0.18)] hover:shadow-[0_12px_28px_-10px_rgba(15,23,42,0.28)]"
                    : "bg-[#161616] border-white/[0.06] hover:bg-[#1d1d1d]"
                )}
              >
                <div className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center border shadow-sm",
                  isLight ? "bg-slate-100 text-slate-900 border-slate-300" : "bg-[#262626] text-white border-white/[0.06]"
                )}>
                  <p.icon className="w-4 h-4" />
                </div>
                <span className={cn("text-[10px] font-bold uppercase tracking-wider", isLight ? "text-slate-700" : "text-white/60")}>{p.label}</span>
              </button>
            ))}
          </div>

          {/* Email */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
                <Mail className={cn("w-4 h-4", isLight ? "text-slate-400" : "text-white/40")} />
              </div>
              <Input
                type="email"
                placeholder="Email address"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className={cn(
                  "w-full h-12 pl-10 rounded-2xl text-sm",
                  isLight
                    ? "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
                    : "bg-[#161616] border-white/10 text-white placeholder:text-white/30"
                )}
              />
            </div>
            <Button
              onClick={handleEmailShare}
              disabled={!recipientEmail}
              className={cn(
                "h-12 w-12 rounded-2xl p-0 active:scale-95 transition-all border-none",
                "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_14px_30px_-10px_hsl(var(--primary)/0.55)]",
                isLight
                  ? "disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
                  : "disabled:bg-white/[0.06] disabled:text-white/30 disabled:shadow-none"
              )}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
