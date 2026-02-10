import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Share2, Check, Copy, Gift } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  copyToClipboard,
  shareViaNavigator,
  generateShareUrl,
  shareViaWhatsApp,
  shareViaFacebook,
  shareViaTwitter,
  shareViaSMS,
} from '@/hooks/useSharing';
import { useAuth } from '@/hooks/useAuth';

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

  if (!profileId || !user?.id) return null;

  const shareUrl = generateShareUrl({ profileId, referralId: user.id });
  const profileType = isClient ? 'client profile' : 'business profile';
  const shareText = `Check out ${profileName}'s ${profileType} on Zwipes! See their details and connect today.`;

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
    if (navigator.share) {
      await shareViaNavigator({
        title: profileName,
        text: shareText,
        url: shareUrl,
      });
    } else {
      handleCopyLink();
    }
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

  const handleSMSShare = () => {
    shareViaSMS(shareUrl, shareText);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    >
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-3">
            {/* Left side - Icon and text */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                <Gift className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-foreground text-sm">Share & Earn</h3>
                <p className="text-xs text-muted-foreground truncate">
                  Get free messages for referrals
                </p>
              </div>
            </div>
          </div>

          {/* Copy Link Section */}
          <div className="flex gap-2">
            <div className="flex-1 px-3 py-2 bg-muted rounded-lg text-sm text-muted-foreground truncate">
              {shareUrl}
            </div>
            <Button
              onClick={handleCopyLink}
              variant="outline"
              size="icon"
              className="shrink-0"
            >
              <AnimatePresence mode="wait">
                {copied ? (
                  <motion.div
                    key="check"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Check className="w-4 h-4 text-green-500" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="copy"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Copy className="w-4 h-4" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </div>

          {/* Share Buttons - Responsive Grid */}
          <div className="grid grid-cols-3 gap-2">
            {navigator.share && (
              <Button
                onClick={handleCopyLink}
                variant="outline"
                size="sm"
                className="w-full h-9 px-2 text-xs sm:text-sm"
              >
                <Share2 className="w-4 h-4 mr-1.5 shrink-0" />
                <span className="truncate">Share</span>
              </Button>
            )}
            <Button
              onClick={handleWhatsAppShare}
              variant="outline"
              size="sm"
              className="w-full h-9 px-2 text-xs sm:text-sm"
            >
              <svg className="w-4 h-4 mr-1.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <span className="truncate">WhatsApp</span>
            </Button>
            <Button
              onClick={handleFacebookShare}
              variant="outline"
              size="sm"
              className="w-full h-9 px-2 text-xs sm:text-sm"
            >
              <svg className="w-4 h-4 mr-1.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span className="truncate">Facebook</span>
            </Button>
            <Button
              onClick={handleTwitterShare}
              variant="outline"
              size="sm"
              className="w-full h-9 px-2 text-xs sm:text-sm"
            >
              <svg className="w-4 h-4 mr-1.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <span className="truncate">X</span>
            </Button>
            <Button
              onClick={handleSMSShare}
              variant="outline"
              size="sm"
              className="w-full h-9 px-2 text-xs sm:text-sm"
            >
              <svg className="w-4 h-4 mr-1.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <span className="truncate">SMS</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
