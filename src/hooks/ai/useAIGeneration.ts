import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  language?: string;
  suggestion: string;
}

export interface AIEnhanceResult {
  text: string;
}

export type AIResult = AIListingResult | AIProfileResult | AISearchResult | AIEnhanceResult;

export function useAIGeneration() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async <T extends AIResult>(
    type: 'listing' | 'profile' | 'search' | 'enhance',
    data: Record<string, any>
  ): Promise<T | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke('ai-orchestrator', {
        body: { task: type, data },
      });

      if (fnError) {
        // Check for rate limit / payment errors
        const msg = fnError.message || 'AI request failed';
        if (msg.includes('429') || msg.includes('rate limit')) {
          toast.error('AI rate limit reached. Please try again in a moment.');
        } else if (msg.includes('402') || msg.includes('credits')) {
          toast.error('AI credits exhausted. Please add funds to continue.');
        }
        throw new Error(msg);
      }
      if (fnData?.error) {
        if (fnData.error.includes('rate limit') || fnData.error.includes('429')) {
          toast.error(fnData.error);
        } else if (fnData.error.includes('credits') || fnData.error.includes('402')) {
          toast.error(fnData.error);
        }
        throw new Error(fnData.error);
      }

      return (fnData?.result as T) || null;
    } catch (err: any) {
      setError(err.message);
      console.error('[useAI] Generation error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const enhance = useCallback(async (text: string, tone: string = 'professional'): Promise<string | null> => {
    const result = await generate<AIEnhanceResult>('enhance', { text, tone });
    return result?.text || null;
  }, [generate]);

  return {
    generate,
    enhance,
    isLoading,
    error,
  };
}
