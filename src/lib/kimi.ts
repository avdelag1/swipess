import { supabase } from "@/integrations/supabase/client";

/**
 * Kimi (Moonshot AI) Integration Utility - Server-Side Proxy
 * 
 * Now redirects to the ai-concierge Edge Function to protect the API key.
 * The Edge Function handles the routing to Moonshot (Kimi) based on task complexity.
 */

export async function refineWithKimi(text: string): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke('ai-concierge', {
      body: {
        messages: [
          {
            role: 'system',
            content: 'You are an elite listing architect for Swipess. Your task is to transform raw spoken input into a professional, cinematic, and high-converting listing description. Keep it concise, remove filler words, and focus on selling the asset.'
          },
          {
            role: 'user',
            content: text
          }
        ],
        // Force the smart router to consider this a structured/Kimi task
        character: 'listing_architect',
        stream: false
      }
    });

    if (error) throw error;

    // The edge function returns a stream or a full response depending on how it's called
    // Since we're calling it via invoke (non-streaming by default), we get the full response
    return data.choices?.[0]?.message?.content || data.reply || text;
  } catch (error) {
    console.error('Kimi Refinement Proxy Failed:', error);
    return text;
  }
}

export async function extractListingWithKimi(text: string, category: string) {
  try {
    const { data, error } = await supabase.functions.invoke('ai-concierge', {
      body: {
        messages: [
          {
            role: 'system',
            content: `Extract listing details from the user input for category: ${category}. Return ONLY valid JSON.`
          },
          {
            role: 'user',
            content: text
          }
        ],
        // Force structured task routing
        character: 'listing_extractor',
        stream: false
      }
    });

    if (error) throw error;

    const content = data.choices?.[0]?.message?.content || data.reply || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  } catch (error) {
    console.error('Kimi Extraction Proxy Failed:', error);
    return null;
  }
}
