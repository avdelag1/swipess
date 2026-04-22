/**
 * Content Moderation Hook
 * Validates text for contact info and optionally logs flags to database.
 */
import { useCallback } from 'react';
import { validateContent, type FlagReason } from '@/utils/contactInfoValidation';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { logger } from '@/utils/prodLogger';
import { logSupabaseError } from '@/lib/supabaseError';

type ContentType = 'message' | 'listing_title' | 'listing_description' | 'listing_house_rules' | 'profile_name' | 'profile_business' | 'review';

async function logFlag(
  contentType: ContentType,
  contentText: string,
  flagReason: FlagReason,
  sourceId?: string
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('content_flags' as any).insert({
      user_id: user.id,
      content_type: contentType,
      content_text: contentText.substring(0, 500),
      flag_reason: flagReason,
      source_id: sourceId || null,
      status: 'pending',
    } as any);
    logSupabaseError('content_flags.insert', error);
  } catch (err) {
    logger.error('[ContentModeration] Failed to log flag:', err);
  }
}

export function useContentModeration() {
  /**
   * Validate text and show toast + log if flagged.
   * Returns true if content is clean, false if blocked.
   */
  const moderate = useCallback((
    text: string,
    contentType: ContentType,
    sourceId?: string,
    showToast = true
  ): boolean => {
    if (!text) return true;

    const result = validateContent(text);
    if (!result.isClean && result.reason) {
      if (showToast && result.message) {
        toast.error('Content blocked', { description: result.message });
      }
      // Fire-and-forget DB log
      logFlag(contentType, text, result.reason, sourceId);
      return false;
    }
    return true;
  }, []);

  /**
   * Validate multiple fields at once. Returns true if ALL are clean.
   */
  const moderateFields = useCallback((
    fields: Array<{ text: string; type: ContentType; sourceId?: string }>
  ): boolean => {
    for (const field of fields) {
      if (!moderate(field.text, field.type, field.sourceId)) {
        return false;
      }
    }
    return true;
  }, [moderate]);

  return { moderate, moderateFields };
}


