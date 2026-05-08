/**
 * Kimi (Moonshot) refinement — server-side only.
 *
 * The Moonshot API key is held in Supabase edge function secrets
 * (MOONSHOT_API_KEY) and is never exposed in the client bundle. We call
 * the ai-concierge function which routes to Kimi for structured/strict
 * tasks. If Kimi is unavailable the function falls back to Gemini, then
 * MiniMax, so the caller always gets a usable response.
 */
import { supabase } from '@/integrations/supabase/client';

export async function refineWithKimi(text: string): Promise<string> {
  if (!text?.trim()) return text;
  try {
    const { data, error } = await supabase.functions.invoke('ai-concierge', {
      body: {
        messages: [
          {
            role: 'system',
            content:
              'You are an elite listing copywriter for Swipess. Rewrite the user input into a professional, concise, high-converting listing description. Keep all factual claims; do not invent details. Return only the rewritten description, no preamble.',
          },
          { role: 'user', content: text },
        ],
      },
    });
    if (error) throw error;
    const content =
      data?.choices?.[0]?.message?.content ??
      data?.reply ??
      (typeof data === 'string' ? data : '');
    return content?.trim() || text;
  } catch (err) {
    console.error('[Kimi] refinement failed:', err);
    return text;
  }
}

export async function extractListingWithKimi(text: string, category: string) {
  if (!text?.trim()) return null;
  try {
    const { data, error } = await supabase.functions.invoke('ai-concierge', {
      body: {
        messages: [
          {
            role: 'system',
            content: `Extract structured listing fields for category "${category}" from the user's text. Return ONLY valid JSON with keys appropriate for the category (title, price, description, city, plus category-specific fields). Do not invent values you can't infer from the text — leave them out.`,
          },
          { role: 'user', content: text },
        ],
      },
    });
    if (error) throw error;
    const content = data?.choices?.[0]?.message?.content ?? data?.reply ?? '';
    const match = typeof content === 'string' ? content.match(/\{[\s\S]*\}/) : null;
    return match ? JSON.parse(match[0]) : null;
  } catch (err) {
    console.error('[Kimi] extraction failed:', err);
    return null;
  }
}
