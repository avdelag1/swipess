/**
 * Kimi (Moonshot AI) Integration Utility
 * 
 * Used for high-context processing and premium text refinement.
 * Moonshot AI (Kimi) is excellent at instruction following and structured JSON.
 */

const MOONSHOT_API_URL = 'https://api.moonshot.cn/v1/chat/completions';

export async function refineWithKimi(text: string, apiKey?: string): Promise<string> {
  const key = apiKey || import.meta.env.VITE_MOONSHOT_API_KEY;
  if (!key) {
    console.warn('Kimi API Key missing. Falling back to original text.');
    return text;
  }

  try {
    const response = await fetch(MOONSHOT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        model: 'moonshot-v1-8k',
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
        temperature: 0.3
      })
    });

    if (!response.ok) {
      throw new Error(`Kimi API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || text;
  } catch (error) {
    console.error('Kimi Refinement Failed:', error);
    return text;
  }
}

export async function extractListingWithKimi(text: string, category: string, apiKey?: string) {
  const key = apiKey || import.meta.env.VITE_MOONSHOT_API_KEY;
  if (!key) return null;

  try {
    const response = await fetch(MOONSHOT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        model: 'moonshot-v1-8k',
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
        response_format: { type: 'json_object' }
      })
    });

    const data = await response.json();
    return JSON.parse(data.choices?.[0]?.message?.content);
  } catch (error) {
    console.error('Kimi Extraction Failed:', error);
    return null;
  }
}
