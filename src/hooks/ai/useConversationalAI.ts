import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface ConversationalAIResponse {
  message: string;
  extractedData: Record<string, any>;
  isComplete: boolean;
  nextSteps?: string;
}

interface UseConversationalAIProps {
  category: string;
  imageCount: number;
  initialMessage?: string;
}

export function useConversationalAI({ category, imageCount, initialMessage }: UseConversationalAIProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [extractedData, setExtractedData] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const sendMessage = useCallback(async (userMessage: string) => {
    setIsLoading(true);
    setError(null);

    // Add user message to history
    const newUserMessage: Message = {
      role: 'user',
      content: userMessage,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, newUserMessage]);

    try {
      // Build messages for API (map to system/user/assistant format)
      const apiMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      // Add the new user message
      apiMessages.push({
        role: 'user',
        content: userMessage,
      });

      const { data, error: functionError } = await supabase.functions.invoke('ai-conversation', {
        body: {
          category,
          imageCount,
          messages: apiMessages,
          extractedData,
        },
      });

      if (functionError) throw functionError;

      const response: ConversationalAIResponse = data.result;

      // Add AI response to messages
      const aiMessage: Message = {
        role: 'assistant',
        content: response.message,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, aiMessage]);
      setExtractedData(response.extractedData || {});
      setIsComplete(response.isComplete || false);

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to communicate with AI';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [category, imageCount, messages, extractedData]);

  // Initialize conversation with first AI message
  const initializeConversation = useCallback(async () => {
    if (isInitialized) return;

    setIsLoading(true);
    setIsInitialized(true);

    try {
      const initialPrompt = initialMessage || `Hi! I'd like to create a ${category} listing. I've uploaded ${imageCount} photo${imageCount !== 1 ? 's' : ''}.`;

      await sendMessage(initialPrompt);
    } catch (err) {
      console.error('Failed to initialize conversation:', err);
      setError('Failed to start conversation with AI');
    } finally {
      setIsLoading(false);
    }
  }, [category, imageCount, initialMessage, isInitialized, sendMessage]);

  // Reset conversation
  const resetConversation = useCallback(() => {
    setMessages([]);
    setExtractedData({});
    setIsLoading(false);
    setError(null);
    setIsComplete(false);
    setIsInitialized(false);
  }, []);

  // Get completion percentage based on extracted data
  const getCompletionPercentage = useCallback(() => {
    const requiredFields = getRequiredFields(category);
    const filledRequiredFields = requiredFields.filter(field => {
      const value = extractedData[field];
      return value !== null && value !== undefined && value !== '';
    });

    return Math.round((filledRequiredFields.length / requiredFields.length) * 100);
  }, [category, extractedData]);

  return {
    messages,
    extractedData,
    isLoading,
    error,
    isComplete,
    isInitialized,
    sendMessage,
    initializeConversation,
    resetConversation,
    completionPercentage: getCompletionPercentage(),
  };
}

// Helper function to get required fields by category
function getRequiredFields(category: string): string[] {
  const commonFields = ['title', 'description', 'price', 'city'];

  switch (category) {
    case 'property':
      return [...commonFields, 'property_type', 'mode', 'beds', 'baths'];
    case 'motorcycle':
      return [...commonFields, 'motorcycle_type', 'vehicle_brand', 'vehicle_model', 'mode'];
    case 'bicycle':
      return [...commonFields, 'bicycle_type', 'vehicle_brand', 'mode'];
    case 'worker':
      return [...commonFields, 'service_category', 'pricing_unit', 'experience_level'];
    default:
      return commonFields;
  }
}
