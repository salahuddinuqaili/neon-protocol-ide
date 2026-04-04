import { LLMProviderConfig } from '../../types';

export type { LLMProviderConfig };

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  provider: string;
  providerId: string;
  model: string;
  tokensUsed: number;
}

/**
 * Send a chat request to a single provider.
 *
 * In Electron, all requests are routed through the main process via IPC.
 * This keeps API keys out of the renderer and avoids CORS issues.
 *
 * The browser-direct fallback only handles Ollama (local, no API key)
 * for `npm run dev` without Electron.
 */
export async function chatWithProvider(
  config: LLMProviderConfig,
  messages: LLMMessage[]
): Promise<LLMResponse> {
  const api = typeof window !== 'undefined' ? window.electronAPI : undefined;

  // Electron path — preferred, all provider types supported
  if (api?.llmChat) {
    return api.llmChat(config, messages);
  }

  // Browser fallback — only Ollama (local, no API key exposure)
  if (config.type === 'ollama') {
    return chatWithOllamaFallback(config, messages);
  }

  throw new Error(
    `${config.name}: Browser mode only supports local Ollama. ` +
    `Use the desktop app for cloud providers.`
  );
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

async function chatWithOllamaFallback(
  config: LLMProviderConfig,
  messages: LLMMessage[]
): Promise<LLMResponse> {
  const response = await fetch(`${config.baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: config.model, messages, stream: false }),
    signal: AbortSignal.timeout(60000),
  });

  if (!response.ok) {
    throw new Error(`${config.name}: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.message?.content || '';
  return {
    content,
    provider: config.name,
    providerId: config.id,
    model: config.model,
    tokensUsed: (data.prompt_eval_count || 0) + (data.eval_count || 0) || estimateTokens(content + messages.map(m => m.content).join('')),
  };
}

/**
 * Routes a chat request through enabled providers in priority order.
 * Falls back to next provider on error.
 */
export async function routeChat(
  providers: LLMProviderConfig[],
  messages: LLMMessage[],
  onLog?: (msg: string, type: 'info' | 'primary' | 'ai' | 'error') => void
): Promise<LLMResponse> {
  const sorted = [...providers]
    .filter(p => p.enabled)
    .sort((a, b) => a.priority - b.priority);

  if (sorted.length === 0) {
    throw new Error('No AI providers are enabled. Go to AI settings to set one up.');
  }

  for (const provider of sorted) {
    try {
      onLog?.(`Routing to: ${provider.name} (${provider.model})`, 'primary');
      const result = await chatWithProvider(provider, messages);
      onLog?.(`Response received from ${provider.name}`, 'ai');
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      onLog?.(`${provider.name} failed: ${message}. Trying fallback...`, 'error');
    }
  }

  throw new Error('All providers failed. Check your connections and API keys.');
}
