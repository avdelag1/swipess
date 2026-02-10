import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/utils/prodLogger';

export type ShareMethod =
  | 'link_copied'
  | 'email'
  | 'whatsapp'
  | 'facebook'
  | 'twitter'
  | 'sms'
  | 'other';

interface CreateShareParams {
  sharedListingId?: string;
  sharedProfileId?: string;
  shareMethod: ShareMethod;
  recipientEmail?: string;
  recipientPhone?: string;
}

interface ShareUrlParams {
  listingId?: string;
  profileId?: string;
  referralId?: string;
}

export function useCreateShare() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateShareParams) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User must be logged in to share');

      // Validate that either listing or profile is shared, not both
      if (params.sharedListingId && params.sharedProfileId) {
        throw new Error('Cannot share both listing and profile at the same time');
      }
      if (!params.sharedListingId && !params.sharedProfileId) {
        throw new Error('Must specify either sharedListingId or sharedProfileId');
      }

      // Generate share URL - always use production domain for sharing
      const baseUrl = import.meta.env.VITE_APP_URL || 'https://swipess.com';
      let shareUrl = '';
      if (params.sharedListingId) {
        shareUrl = `${baseUrl}/listing/${params.sharedListingId}`;
      } else if (params.sharedProfileId) {
        shareUrl = `${baseUrl}/profile/${params.sharedProfileId}`;
      }

      // Track the share in database
      const { data, error } = await supabase
        .from('content_shares' as any)
        .insert({
          sharer_id: user.id,
          shared_listing_id: params.sharedListingId || null,
          shared_profile_id: params.sharedProfileId || null,
          share_method: params.shareMethod,
          recipient_email: params.recipientEmail || null,
          recipient_phone: params.recipientPhone || null,
          share_url: shareUrl,
        })
        .select()
        .single();

      if (error) throw error;
      return { shareUrl };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['content-shares'] });
      // Silently track share success
    },
    onError: (error: Error) => {
      logger.error('Error tracking share:', error);
      // Don't show error toast as sharing can still work even if tracking fails
    },
  });
}

export function useIncrementShareClicks() {
  return useMutation({
    mutationFn: async (shareId: string) => {
      const { error } = await supabase.rpc('increment_share_clicks' as any, {
        p_share_id: shareId,
      });
      if (error) throw error;
    },
  });
}

// Generate shareable URL - always use production domain with referral tracking
export function generateShareUrl(params: ShareUrlParams): string {
  const baseUrl = import.meta.env.VITE_APP_URL || 'https://swipess.com';
  let url = baseUrl;

  if (params.listingId) {
    url = `${baseUrl}/listing/${params.listingId}`;
  } else if (params.profileId) {
    url = `${baseUrl}/profile/${params.profileId}`;
  }

  // Add referral ID if provided
  if (params.referralId) {
    url += `?ref=${params.referralId}`;
  }

  return url;
}

// Copy link to clipboard
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers or non-HTTPS
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        textArea.remove();
        return true;
      } catch (error) {
        logger.error('Fallback: Could not copy text: ', error);
        textArea.remove();
        return false;
      }
    }
  } catch (error) {
    logger.error('Failed to copy to clipboard:', error);
    return false;
  }
}

// Share via native share API if available
export async function shareViaNavigator(params: {
  title: string;
  text: string;
  url: string;
}): Promise<boolean> {
  if (navigator.share) {
    try {
      await navigator.share({
        title: params.title,
        text: params.text,
        url: params.url,
      });
      return true;
    } catch (error) {
      // User cancelled or error occurred
      return false;
    }
  }
  return false;
}

// Share via WhatsApp
export function shareViaWhatsApp(url: string, text: string) {
  const message = encodeURIComponent(`${text}\n${url}`);
  const whatsappUrl = `https://wa.me/?text=${message}`;
  window.open(whatsappUrl, '_blank');
}

// Share via Facebook
export function shareViaFacebook(url: string) {
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  window.open(facebookUrl, '_blank', 'width=600,height=400');
}

// Share via Twitter
export function shareViaTwitter(url: string, text: string) {
  const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
  window.open(twitterUrl, '_blank', 'width=600,height=400');
}

// Share via Email
export function shareViaEmail(url: string, subject: string, body: string) {
  const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`${body}\n\n${url}`)}`;
  window.location.href = mailtoUrl;
}

// Share via SMS (mobile only)
export function shareViaSMS(url: string, text: string) {
  const message = encodeURIComponent(`${text} ${url}`);
  const smsUrl = `sms:?body=${message}`;
  window.location.href = smsUrl;
}

// Share method labels for UI
export const SHARE_METHOD_LABELS: Record<ShareMethod, string> = {
  link_copied: 'Copy Link',
  email: 'Email',
  whatsapp: 'WhatsApp',
  facebook: 'Facebook',
  twitter: 'Twitter',
  sms: 'SMS',
  other: 'Other',
};
