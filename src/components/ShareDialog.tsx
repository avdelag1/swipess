import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, Mail, Send, Share2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { appToast } from '@/utils/appNotification';
import {
  copyToClipboard,
  generateShareUrl,
  shareViaEmail,
  shareViaFacebook,
  shareViaNavigator,
  shareViaWhatsApp,
  useCreateShare,
} from '@/hooks/useSharing';
import { useAuth } from '@/hooks/useAuth';
import { triggerHaptic } from '@/utils/haptics';
import useAppTheme from '@/hooks/useAppTheme';
import { cn } from '@/lib/utils';

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
);

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listingId?: string;
  profileId?: string;
  title: string;
  description?: string;
  previewImage?: string | null;
}

export function ShareDialog({
  open,
  onOpenChange,
  listingId,
  profileId,
  title,
  description,
  previewImage,
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
      appToast.success('Link copied to clipboard!');
      await createShare.mutateAsync({ sharedListingId: listingId, sharedProfileId: profileId, shareMethod: 'link_copied' });
    } else {
      appToast.error('Failed to copy link');
    }
  };

  const handleNativeShare = async () => {
    triggerHaptic('light');
    const shared = await shareViaNavigator({ title, text: shareText, url: shareUrl });
    if (shared) {
      await createShare.mutateAsync({ sharedListingId: listingId, sharedProfileId: profileId, shareMethod: 'other' });
    } else {
      // Fallback: copy link if native share unavailable or dismissed without sharing
      const ok = await copyToClipboard(shareUrl);
      if (ok) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        appToast.success('Link copied to clipboard');
        await createShare.mutateAsync({ sharedListingId: listingId, sharedProfileId: profileId, shareMethod: 'link_copied' });
      }
    }
  };

  const handleEmailShare = async () => {
    if (!recipientEmail) {
      appToast.error('Please enter an email address');
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
        onInteractOutside={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        className={cn(
          "max-w-sm p-0 overflow-hidden rounded-[32px] border shadow-2xl max-h-[90dvh] flex flex-col",
          isLight ? "bg-white border-slate-200" : "bg-card border-white/10"
        )}
      >
          <DialogTitle className="sr-only">Share {title}</DialogTitle>
          <DialogDescription className="sr-only">Copy or send this Swipess share link.</DialogDescription>
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
            <X className="z-[10000] w-4 h-4" />
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
          {previewImage && (
            <div className={cn(
              "relative aspect-[16/10] w-full overflow-hidden rounded-3xl border shadow-xl",
              isLight ? "bg-muted border-border" : "bg-card border-border"
            )}>
              <img
                src={previewImage}
                alt={title}
                className="h-full w-full object-cover"
                loading="eager"
                decoding="async"
              />
              <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-background/90 to-transparent">
                <p className="line-clamp-2 text-left text-sm font-black leading-tight text-foreground">{title}</p>
              </div>
            </div>
          )}

          {/* Social share buttons — WhatsApp, Facebook, Instagram */}
          <div className="grid grid-cols-3 gap-2.5">
            <button
              onClick={() => {
                triggerHaptic('medium');
                shareViaWhatsApp(shareUrl, shareText);
                createShare.mutateAsync({ sharedListingId: listingId, sharedProfileId: profileId, shareMethod: 'whatsapp' });
              }}
              className="flex flex-col items-center justify-center gap-1.5 py-3.5 rounded-2xl bg-[#25D366] text-white active:scale-95 transition-all shadow-md hover:brightness-110"
            >
              <WhatsAppIcon />
              <span className="text-[10px] font-bold uppercase tracking-wider">WhatsApp</span>
            </button>
            <button
              onClick={() => {
                triggerHaptic('medium');
                shareViaFacebook(shareUrl);
                createShare.mutateAsync({ sharedListingId: listingId, sharedProfileId: profileId, shareMethod: 'facebook' });
              }}
              className="force-white flex flex-col items-center justify-center gap-1.5 py-3.5 rounded-2xl bg-[#1877F2] text-white active:scale-95 transition-all shadow-md hover:brightness-110"
            >
              <FacebookIcon />
              <span className="text-[10px] font-bold uppercase tracking-wider">Facebook</span>
            </button>
            <button
              onClick={() => {
                triggerHaptic('medium');
                (async () => {
                  try {
                    const shared = await shareViaNavigator({ title, text: shareText, url: shareUrl });
                    if (!shared) {
                      const ok = await copyToClipboard(shareUrl);
                      if (ok) appToast.success('Link copied — share on Instagram');
                    }
                    createShare.mutateAsync({ sharedListingId: listingId, sharedProfileId: profileId, shareMethod: 'instagram' });
                  } catch {
                    appToast.error('Could not share. Try copying the link instead.');
                  }
                })();
              }}
              className="flex flex-col items-center justify-center gap-1.5 py-3.5 rounded-2xl bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white active:scale-95 transition-all shadow-md hover:brightness-110"
            >
              <InstagramIcon />
              <span className="text-[10px] font-bold uppercase tracking-wider">Instagram</span>
            </button>
          </div>

          {/* Copy + Native share row */}
          <div className="flex gap-2">
            <Button
              onClick={handleNativeShare}
              className={cn(
                "flex-1 h-12 rounded-2xl font-bold uppercase tracking-wider text-[10px] active:scale-[0.98] transition-all border-0 flex items-center justify-center gap-2",
                isLight ? "!bg-slate-900 !text-white hover:!bg-slate-800" : "!bg-white !text-black hover:!bg-white/90"
              )}
            >
              <Share2 className="z-[10000] w-4 h-4" strokeWidth={2.2} />
              More…
            </Button>
            <Button
              onClick={handleCopyLink}
              className={cn(
                "h-12 px-4 rounded-2xl font-bold uppercase tracking-wider text-[10px] active:scale-95 transition-all border-0 shadow-lg",
                isLight ? "!bg-slate-900 !text-white hover:!bg-slate-800" : "!bg-white !text-black hover:!bg-white/90"
              )}
            >
              <AnimatePresence mode="sync">
                {copied ? (
                  <motion.div key="check" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}>
                    <Check className="z-[10000] w-4 h-4 stroke-[3px]" />
                  </motion.div>
                ) : (
                  <motion.span key="copy" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}>
                    Copy
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
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
                "h-12 w-12 rounded-2xl p-0 active:scale-95 transition-all border-0 shadow-lg",
                isLight ? "!bg-slate-900 !text-white hover:!bg-slate-800" : "!bg-white !text-black hover:!bg-white/90",
                isLight
                  ? "disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
                  : "disabled:bg-white/[0.06] disabled:text-white/30 disabled:shadow-none"
              )}
            >
              <Send className="z-[10000] w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

