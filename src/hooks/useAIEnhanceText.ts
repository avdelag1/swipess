import { useState } from 'react';
import { logger } from '@/utils/prodLogger';
import { appToast } from '@/utils/appNotification';
import { supabase } from '@/integrations/supabase/client';

export function useAIEnhanceText() {
  const [isEnhancing, setIsEnhancing] = useState(false);

  const enhanceText = async (text: string, type: 'profile' | 'listing' | 'legal' = 'profile'): Promise<string | null> => {
    if (!text || text.trim().length < 5) {
      appToast.error('Draft is too short to enhance.');
      return null;
    }

    setIsEnhancing(true);
    try {
      // Use supabase.functions.invoke so we automatically get the auth session token
      const { data, error } = await supabase.functions.invoke('ai-enhance-text', {
        body: { text, type },
      });

      if (error) throw error;
      if (!data?.text) throw new Error('Empty response from AI.');

      return data.text as string;
    } catch (error) {
      logger.error('[useAIEnhanceText] error:', error);
      appToast.error('Could not enhance text.', 'Please try again in a moment.');
      return null;
    } finally {
      setIsEnhancing(false);
    }
  };

  return { enhanceText, isEnhancing };
}
