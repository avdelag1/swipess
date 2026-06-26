/**
 * Content Moderation Hook
 * Validates text for contact info and optionally logs flags to database.
 */
import { useCallback } from 'react';
import { type FlagReason, validateContent, validateProfanity } from '@/utils/contactInfoValidation';
import { supabase } from '@/integrations/supabase/client';
import { appToast } from '@/utils/appNotification';
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
    options?: { allowContactInfo?: boolean; showToast?: boolean }
  ): boolean => {
    if (!text) return true;
    const showToast = options?.showToast ?? true;

    // Profanity / slurs are ALWAYS blocked — even inside a paid chat where
    // contact info is allowed.
    const prof = validateProfanity(text);
    if (!prof.isClean && prof.reason) {
      if (showToast) appToast.error('Content blocked', prof.message || undefined);
      logFlag(contentType, text, prof.reason, sourceId);
      return false;
    }

    // Contact info (phone/email/social) is blocked everywhere EXCEPT where the
    // caller opts in — i.e. inside an already-opened (token-paid) 1:1 chat,
    // where exchanging details is the whole point of having paid to connect.
    if (!options?.allowContactInfo) {
      const result = validateContent(text);
      if (!result.isClean && result.reason) {
        if (showToast && result.message) appToast.error('Content blocked', result.message);
        logFlag(contentType, text, result.reason, sourceId);
        return false;
      }
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


