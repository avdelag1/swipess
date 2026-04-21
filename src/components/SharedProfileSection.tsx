import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Copy, Gift } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  copyToClipboard,
  shareViaNavigator,
  generateShareUrl,
  shareViaWhatsApp,
  shareViaFacebook,
  shareViaTwitter,
} from '@/hooks/useSharing';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

interface SharedProfileSectionProps {
  profileId?: string;
  profileName: string;
  isClient?: boolean;
}

export function SharedProfileSection({
  profileId,
  profileName,
  isClient = true,
}: SharedProfileSectionProps) {
  const [copied, setCopied] = useState(false);
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (!profileId || !user?.id) return null;

  const shareUrl = generateShareUrl({ profileId, referralId: user.id });
  const profileType = isClient ? 'client profile' : 'business profile';
  const shareText = `Check out ${profileName}'s ${profileType} on NEXUS DISCOVERY! See their details and connect today.`;

  const handleCopyLink = async () => {
    const success = await copyToClipboard(shareUrl);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Link copied to clipboard!');
    } else {
      toast.error('Failed to copy link');
    }
  };

  const handleShare = async () => {
    if (typeof navigator.share === 'function') {
      await shareViaNavigator({
        title: profileName,
        text: shareText,
        url: shareUrl,
      });
    } else {
      handleCopyLink();
    }
  };

  const handleWhatsAppShare = () => shareViaWhatsApp(shareUrl, shareText);
  const _handleFacebookShare = () => shareViaFacebook(shareUrl);
  const handleTwitterShare = () => shareViaTwitter(shareUrl, shareText);

  // Instagram share (copy link + open Instagram)
  const handleInstagramShare = () => {
    copyToClipboard(shareUrl);
    toast.success('Link copied! Paste it in your Instagram story or DM.');
    window.open('https://www.instagram.com/', '_blank');
  };

  // TikTok share (copy link + open TikTok)
  const handleTikTokShare = () => {
    copyToClipboard(shareUrl);
    toast.success('Link copied! Paste it in your TikTok bio or message.');
    window.open('https://www.tiktok.com/', '_blank');
  };

  const socialButtons = [
    ...(typeof navigator.share === 'function'
      ? [{
          onClick: handleShare,
          icon: (
            <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
          ),
          label: 'Share',
          color: isDark ? 'text-white' : 'text-gray-700',
          hoverBg: isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100',
        }]
      : []),
    {
      onClick: handleWhatsAppShare,
      icon: (
        <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="#25D366">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      ),
      label: 'WhatsApp',
      color: 'text-[#25D366]',
      hoverBg: isDark ? 'hover:bg-[#25D366]/15' : 'hover:bg-[#25D366]/10',
    },
    {
      onClick: handleInstagramShare,
      icon: (
        <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24">
          <defs>
            <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FFDC80" />
              <stop offset="25%" stopColor="#F77737" />
              <stop offset="50%" stopColor="#E1306C" />
              <stop offset="75%" stopColor="#C13584" />
              <stop offset="100%" stopColor="#833AB4" />
            </linearGradient>
          </defs>
          <path fill="url(#ig-grad)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
        </svg>
      ),
      label: 'Instagram',
      color: 'text-[#E1306C]',
      hoverBg: isDark ? 'hover:bg-[#E1306C]/15' : 'hover:bg-[#E1306C]/10',
    },
    {
      onClick: handleTikTokShare,
      icon: (
        <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24">
          <path fill="#69C9D0" d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0115.54 3h-3.09v12.4a2.592 2.592 0 01-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 004.3 1.38V7.3s-1.88.09-3.24-1.48z" />
          <path fill="#EE1D52" d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0115.54 3h-3.09v12.4a2.592 2.592 0 01-2.59 2.5c-.62 0-1.18-.22-1.63-.57a2.58 2.58 0 01-.97-2.03c0-1.72 1.66-3.01 3.37-2.48V9.66a6.348 6.348 0 00-.79-.05c-3.09 0-5.69 2.36-5.69 5.69 0 1.64.71 3.13 1.83 4.18" />
        </svg>
      ),
      label: 'TikTok',
      color: isDark ? 'text-white' : 'text-gray-900',
      hoverBg: isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100',
    },
    {
      onClick: handleTwitterShare,
      icon: (
        <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill={isDark ? '#FFFFFF' : '#000000'}>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      label: 'X',
      color: isDark ? 'text-white' : 'text-gray-900',
      hoverBg: isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    >
      <Card className={cn("backdrop-blur-md rounded-3xl shadow-xl border", isDark ? "bg-zinc-900/50 border-white/5" : "bg-white/80 border-gray-200")}>
        <CardContent className="p-5">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--color-brand-accent-2)]/20 to-[var(--color-brand-accent-2)]/5 border border-[var(--color-brand-accent-2)]/20 flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(228,0,124,0.1)]">
              <Gift className="w-6 h-6 text-[var(--color-brand-accent-2)]" />
            </div>
            <div className="min-w-0">
              <h3 className={cn("font-black tracking-tight text-base", isDark ? "text-white" : "text-gray-900")}>Share & Earn</h3>
              <p className={cn("text-sm font-bold truncate mt-0.5", isDark ? "text-zinc-500" : "text-gray-500")}>
                Get free messages for referrals
              </p>
            </div>
          </div>

          {/* Copy Link */}
          <div className="flex gap-2 mb-4">
            <div className={cn("flex-1 px-4 py-3 border rounded-2xl text-xs font-medium truncate flex items-center", isDark ? "bg-zinc-900/80 border-white/5 text-zinc-400 shadow-inner" : "bg-gray-50 border-gray-200 text-gray-600 shadow-sm")}>
              {shareUrl}
            </div>
            <Button
              onClick={handleCopyLink}
              variant="outline"
              size="icon"
              className={cn("shrink-0 h-[42px] w-[42px] rounded-2xl transition-all active:scale-95", isDark ? "border-white/10 bg-zinc-800/50 hover:bg-zinc-700 hover:text-white" : "border-gray-200 bg-white hover:bg-gray-100/80 hover:text-gray-900 shadow-sm")}
            >
              <AnimatePresence mode="wait">
                {copied ? (
                  <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                    <Check className="w-5 h-5 text-rose-500" />
                  </motion.div>
                ) : (
                  <motion.div key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                    <Copy className={cn("w-4 h-4", isDark ? "text-zinc-300" : "text-gray-500")} />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </div>

          {/* Social Share Icons */}
          <div className="flex items-center justify-center gap-3">
            {socialButtons.map((btn, i) => (
              <button
                key={i}
                onClick={btn.onClick}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all active:scale-90",
                  btn.hoverBg
                )}
              >
                <div className={cn(
                  "w-11 h-11 rounded-full flex items-center justify-center border transition-colors",
                  isDark ? "bg-zinc-800/80 border-white/[0.06]" : "bg-gray-50 border-gray-200 shadow-sm"
                )}>
                  {btn.icon}
                </div>
                <span className={cn("text-[10px] font-bold", isDark ? "text-zinc-500" : "text-gray-500")}>{btn.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

