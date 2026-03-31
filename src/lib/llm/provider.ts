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

export async function chatWithProvider(
  config: LLMProviderConfig,
  messages: LLMMessage[]
): Promise<LLMResponse> {
  switch (config.type) {
    case 'ollama':
      return chatWithOllama(config, messages);
    case 'anthropic':
      return chatWithAnthropic(config, messages);
    case 'openai':
    case 'openai-compatible':
    default:
      return chatWithOpenAI(config, messages);
  }
}

// Rough estimate: ~4 chars per token for English text
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

async function chatWithOpenAI(
  config: LLMProviderConfig,
  messages: LLMMessage[]
): Promise<LLMResponse> {
  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(config.apiKey ? { 'Authorization': `Bearer ${config.apiKey}` } : {}),
    },
    body: JSON.stringify({ model: config.model, messages }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    throw new Error(`${config.name}: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  return {
    content,
    provider: config.name,
    providerId: config.id,
    model: config.model,
    tokensUsed: data.usage?.total_tokens || estimateTokens(content + messages.map(m => m.content).join('')),
  };
}

async function chatWithAnthropic(
  config: LLMProviderConfig,
  messages: LLMMessage[]
): Promise<LLMResponse> {
  const systemMsg = messages.find(m => m.role === 'system');
  const chatMessages = messages.filter(m => m.role !== 'system');

  const response = await fetch(`${config.baseUrl}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey || '',
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 1024,
      ...(systemMsg ? { system: systemMsg.content } : {}),
      messages: chatMessages.map(m => ({ role: m.role, content: m.content })),
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    throw new Error(`${config.name}: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text || '';
  return {
    content: text,
    provider: config.name,
    providerId: config.id,
    model: config.model,
    tokensUsed: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0) || estimateTokens(text + messages.map(m => m.content).join('')),
  };
}

async function chatWithOllama(
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
