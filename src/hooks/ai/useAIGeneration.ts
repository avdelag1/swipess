import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AIListingResult {
  title: string;
  description: string;
  [key: string]: unknown;
}

export interface AIProfileResult {
  bio: string;
  lifestyle: string;
  interests_enhanced?: string[];
}

export interface AISearchResult {
  category: string | null;
  priceMin: number | null;
  priceMax: number | null;
  keywords: string[];
  suggestion: string;
}

export type AIResult = AIListingResult | AIProfileResult | AISearchResult;

export function useAIGeneration() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async <T extends AIResult>(
    type: 'listing' | 'profile' | 'search',
    data: Record<string, any>
  ): Promise<T | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke('ai-assistant', {
        body: { type, data },
      });

      if (fnError) throw new Error(fnError.message || 'AI request failed');
      if (fnData?.error) throw new Error(fnData.error);

      return (fnData?.result as T) || null;
    } catch (err: any) {
      setError(err.message);
      console.error('[useAI] Generation error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    generate,
    isLoading,
    error,
  };
}
