/**
 * MiniMax AI Integration
 * Uses the Anthropic-compatible API endpoint
 */

const MINIMAX_BASE_URL = 'https://api.minimax.io/anthropic';
const MINIMAX_MODEL = 'MiniMax-M2.1';

/**
 * Call MiniMax AI with a prompt
 */
export async function callMinimax(prompt: string, options?: {
  model?: string;
  maxTokens?: number;
  temperature?: number;
}): Promise<string> {
  const apiKey = import.meta.env.VITE_MINIMAX_API_KEY;
  
  if (!apiKey) {
    throw new Error('MiniMax API key not configured. Add VITE_MINIMAX_API_KEY to your .env file.');
  }

  const response = await fetch(`${MINIMAX_BASE_URL}/v1/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: options?.model || MINIMAX_MODEL,
      max_tokens: options?.maxTokens || 1024,
      temperature: options?.temperature || 0.7,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `MiniMax API error: ${response.status}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

/**
 * Call MiniMax with a conversation history
 */
export async function callMinimaxWithMessages(
  messages: { role: 'user' | 'assistant'; content: string }[],
  options?: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  }
): Promise<string> {
  const apiKey = import.meta.env.VITE_MINIMAX_API_KEY;
  
  if (!apiKey) {
    throw new Error('MiniMax API key not configured. Add VITE_MINIMAX_API_KEY to your .env file.');
  }

  const response = await fetch(`${MINIMAX_BASE_URL}/v1/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: options?.model || MINIMAX_MODEL,
      max_tokens: options?.maxTokens || 1024,
      temperature: options?.temperature || 0.7,
      messages
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `MiniMax API error: ${response.status}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

export default { callMinimax, callMinimaxWithMessages };
