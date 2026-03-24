import { useState, useCallback } from 'react';

interface CityExpertMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface CityExpertContext {
  city?: string;
  userRole?: 'client' | 'owner';
  listings?: any[];
}

const SYSTEM_PROMPT = `You are "City Expert" - an intelligent assistant for a multi-vertical marketplace (properties, vehicles, services) in Mexico.

Your capabilities:
1. Answer questions about restaurants, bars, cafes, shops, and attractions in the user's city
2. Help users find properties that match their needs
3. Provide neighborhood recommendations and local insights
4. Assist with listing creation - suggest improvements, pricing, amenities
5. Help owners optimize their listings for better visibility

Guidelines:
- Always be helpful, friendly, and concise
- If you don't know something, admit it and offer alternatives
- Use local knowledge about Mexican cities (Cancun, Playa del Carmen, Tulum, Mexico City, etc.)
- When helping with listings, consider: pricing, photos, descriptions, amenities
- For property searches, consider: location, price range, bedrooms, pet-friendliness, proximity to beaches/amenities

You have access to listing data - use it to provide relevant recommendations.`;

export function useGeminiCityExpert() {
  const [messages, setMessages] = useState<CityExpertMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  const sendMessage = useCallback(async (userMessage: string, context?: CityExpertContext) => {
    if (!apiKey) {
      setError('Gemini API key not configured');
      return;
    }

    setIsLoading(true);
    setError(null);

    // Add user message to chat
    const userMsg: CityExpertMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      // Build context info for the AI
      let contextInfo = '';
      if (context?.city) {
        contextInfo += `Current city: ${context.city}\n`;
      }
      if (context?.userRole) {
        contextInfo += `User role: ${context.userRole}\n`;
      }
      if (context?.listings && context.listings.length > 0) {
        contextInfo += `\nAvailable listings:\n${JSON.stringify(context.listings.slice(0, 5), null, 2)}\n`;
      }

      const fullPrompt = contextInfo 
        ? `${SYSTEM_PROMPT}\n\nContext:\n${contextInfo}\n\nUser question: ${userMessage}`
        : `${SYSTEM_PROMPT}\n\nUser question: ${userMessage}`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: fullPrompt
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1024,
            }
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to get AI response');
      }

      const data = await response.json();
      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'I apologize, but I could not generate a response. Please try again.';

      const assistantMsg: CityExpertMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMsg]);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      
      // Add error message to chat
      const errorMsg: CityExpertMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I encountered an error: ${errorMessage}. Please try again.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [apiKey]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    isConfigured: !!apiKey,
  };
}
