/**
 * Hook for AI-powered image moderation
 * Calls the moderate-image edge function to check uploaded photos
 */
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { logger } from '@/utils/prodLogger';

interface ModerationVerdict {
  safe: boolean;
  reasons: string[];
  confidence: number;
  error?: string;
}

export async function moderateImage(imageUrl: string): Promise<ModerationVerdict> {
  try {
    const { data, error } = await supabase.functions.invoke('moderate-image', {
      body: { imageUrl },
    });

    if (error) {
      logger.error('[ImageModeration] Edge function error:', error);
      // Don't block on errors - default to safe
      return { safe: true, reasons: [], confidence: 0, error: 'moderation_unavailable' };
    }

    return data as ModerationVerdict;
  } catch (err) {
    logger.error('[ImageModeration] Failed:', err);
    return { safe: true, reasons: [], confidence: 0, error: 'moderation_unavailable' };
  }
}

/**
 * Moderate an image and show toast if unsafe.
 * Returns true if image is safe to use, false if blocked.
 */
export async function moderateAndBlock(imageUrl: string): Promise<boolean> {
  const verdict = await moderateImage(imageUrl);
  
  if (!verdict.safe && verdict.confidence > 0.7) {
    toast.error('Image blocked', {
      description: `This image was flagged for: ${verdict.reasons.join(', ')}. Please upload a different photo.`,
      duration: 6000,
    });
    return false;
  }
  
  return true;
}
