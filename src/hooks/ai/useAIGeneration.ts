import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';

export interface AIListingResult {
  title: string;
  description: string;
  features: string[];
  callToAction: string;
}

export interface AIProfileResult {
  bio: string;
  whyGreatMatch: string;
  lifestyle: string;
}

export interface AIDealFinderResult {
  summary: string;
  recommendations: {
    listingId: string;
    matchScore: number;
    reasoning: string;
    pros: string[];
    cons: string[];
  }[];
  questionsToAsk: string[];
}

export type AIResult = AIListingResult | AIProfileResult | AIDealFinderResult;

export function useAIGeneration() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const generate = useCallback(async <T extends AIResult>(
    type: 'listing' | 'profile' | 'dealFinder',
    data: Record<string, any>
  ): Promise<T | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          data,
          userId: user?.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.setupRequired) {
          throw new Error(`AI not configured: ${result.instructions}`);
        }
        throw new Error(result.error || 'Generation failed');
      }

      return result.result as T;
    } catch (err: any) {
      setError(err.message);
      console.error('[useAI] Generation error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const checkConfig = useCallback(async (): Promise<{ provider: string; configured: boolean } | null> => {
    try {
      const response = await fetch('/api/ai/generate');
      const result = await response.json();
      return { provider: result.provider, configured: result.configured };
    } catch {
      return null;
    }
  }, []);

  return {
    generate,
    checkConfig,
    isLoading,
    error,
  };
}

/**
 * Quick helper for generating listing descriptions
 */
export async function generateListingDescription(
  photos: string[],
  basicInfo: {
    propertyType?: string;
    location?: string;
    price?: number;
    bedrooms?: number;
    bathrooms?: number;
    squareFootage?: number;
    amenities?: string[];
    extraInfo?: string;
  }
): Promise<AIListingResult | null> {
  const { generate, isLoading, error } = useAIGeneration();
  
  return generate<AIListingResult>('listing', {
    photos: photos.length,
    basicInfo,
    propertyType: basicInfo.propertyType || 'property',
    location: basicInfo.location || 'Not specified',
    price: basicInfo.price ? `$${basicInfo.price}/month` : 'Not specified',
  });
}

/**
 * Quick helper for enhancing profiles
 */
export async function enhanceProfile(
  currentInfo: {
    name?: string;
    age?: number;
    occupation?: string;
    hobbies?: string[];
    currentBio?: string;
  },
  preferences: {
    lookingFor?: string;
    lifestyle?: string;
  }
): Promise<AIProfileResult | null> {
  const { generate, isLoading, error } = useAIGeneration();
  
  return generate<AIProfileResult>('profile', {
    currentInfo,
    preferences,
  });
}
