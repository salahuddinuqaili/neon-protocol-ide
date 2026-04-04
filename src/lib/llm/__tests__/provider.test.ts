import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { routeChat, chatWithProvider } from '../provider';
import { LLMProviderConfig } from '../../../types';

// Mock global fetch (used by Ollama browser fallback)
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock llmChat IPC function
const mockLlmChat = vi.fn();

beforeEach(() => {
  mockFetch.mockReset();
  mockLlmChat.mockReset();
  // Set up window.electronAPI mock for IPC routing
  (window as any).electronAPI = { isElectron: true, llmChat: mockLlmChat };
});

afterEach(() => {
  (window as any).electronAPI = undefined;
});

function makeProvider(overrides: Partial<LLMProviderConfig> = {}): LLMProviderConfig {
  return {
    id: 'test',
    name: 'Test Provider',
    type: 'openai-compatible',
    model: 'test-model',
    baseUrl: 'https://api.test.com/v1',
    apiKey: 'sk-test',
    enabled: true,
    priority: 1,
    ...overrides,
  };
}

describe('chatWithProvider', () => {
  it('routes through IPC when electronAPI is available', async () => {
    mockLlmChat.mockResolvedValueOnce({
      content: 'Hello!',
      provider: 'Test Provider',
      providerId: 'test',
      model: 'test-model',
      tokensUsed: 10,
    });

    const result = await chatWithProvider(
      makeProvider(),
      [{ role: 'user', content: 'Hi' }]
    );

    expect(mockLlmChat).toHaveBeenCalledOnce();
    expect(result.content).toBe('Hello!');
    expect(result.tokensUsed).toBe(10);
  });

  it('routes Anthropic through IPC', async () => {
    mockLlmChat.mockResolvedValueOnce({
      content: 'Hi from Claude',
      provider: 'Anthropic',
      providerId: 'test',
      model: 'claude-3',
      tokensUsed: 13,
    });

    const result = await chatWithProvider(
      makeProvider({ type: 'anthropic', baseUrl: 'https://api.anthropic.com/v1' }),
      [{ role: 'user', content: 'Hello' }]
    );

    expect(mockLlmChat).toHaveBeenCalledOnce();
    expect(result.content).toBe('Hi from Claude');
    expect(result.tokensUsed).toBe(13);
  });

  it('falls back to direct fetch for Ollama in browser mode', async () => {
    // Remove electronAPI to simulate browser mode
    (window as any).electronAPI = undefined;

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        message: { content: 'Local response' },
        prompt_eval_count: 20,
        eval_count: 15,
      }),
    });

    const result = await chatWithProvider(
      makeProvider({ type: 'ollama', baseUrl: 'http://localhost:11434', apiKey: undefined }),
      [{ role: 'user', content: 'Hi' }]
    );

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe('http://localhost:11434/api/chat');
    expect(options.headers).not.toHaveProperty('Authorization');
    expect(result.content).toBe('Local response');
    expect(result.tokensUsed).toBe(35);
  });

  it('throws for non-Ollama providers in browser mode', async () => {
    // Remove electronAPI to simulate browser mode
    (window as any).electronAPI = undefined;

    await expect(
      chatWithProvider(makeProvider(), [{ role: 'user', content: 'Hi' }])
    ).rejects.toThrow('Browser mode only supports local Ollama');
  });

  it('throws on IPC error', async () => {
    mockLlmChat.mockRejectedValueOnce(new Error('401 Unauthorized'));

    await expect(
      chatWithProvider(makeProvider(), [{ role: 'user', content: 'Hi' }])
    ).rejects.toThrow('401 Unauthorized');
  });
});

describe('routeChat', () => {
  it('uses highest-priority enabled provider first', async () => {
    mockLlmChat.mockResolvedValueOnce({
      content: 'From P2',
      provider: 'High Priority',
      providerId: 'p2',
      model: 'test-model',
      tokensUsed: 5,
    });

    const providers = [
      makeProvider({ id: 'p1', name: 'Low Priority', priority: 2, enabled: true }),
      makeProvider({ id: 'p2', name: 'High Priority', priority: 1, enabled: true }),
    ];

    const result = await routeChat(providers, [{ role: 'user', content: 'Test' }]);
    expect(result.provider).toBe('High Priority');
  });

  it('skips disabled providers', async () => {
    mockLlmChat.mockResolvedValueOnce({
      content: 'Fallback',
      provider: 'Enabled',
      providerId: 'p2',
      model: 'test-model',
      tokensUsed: 5,
    });

    const providers = [
      makeProvider({ id: 'p1', name: 'Disabled', priority: 1, enabled: false }),
      makeProvider({ id: 'p2', name: 'Enabled', priority: 2, enabled: true }),
    ];

    const result = await routeChat(providers, [{ role: 'user', content: 'Test' }]);
    expect(result.provider).toBe('Enabled');
  });

  it('falls back to next provider on failure', async () => {
    mockLlmChat
      .mockRejectedValueOnce(new Error('500 Server Error'))
      .mockResolvedValueOnce({
        content: 'Fallback response',
        provider: 'Backup',
        providerId: 'p2',
        model: 'test-model',
        tokensUsed: 7,
      });

    const providers = [
      makeProvider({ id: 'p1', name: 'Failing', priority: 1, enabled: true }),
      makeProvider({ id: 'p2', name: 'Backup', priority: 2, enabled: true }),
    ];

    const result = await routeChat(providers, [{ role: 'user', content: 'Test' }]);
    expect(result.provider).toBe('Backup');
    expect(mockLlmChat).toHaveBeenCalledTimes(2);
  });

  it('throws when all providers fail', async () => {
    mockLlmChat.mockRejectedValue(new Error('500 Error'));

    const providers = [
      makeProvider({ id: 'p1', priority: 1, enabled: true }),
    ];

    await expect(
      routeChat(providers, [{ role: 'user', content: 'Test' }])
    ).rejects.toThrow('All providers failed');
  });

  it('throws when no providers are enabled', async () => {
    await expect(
      routeChat([], [{ role: 'user', content: 'Test' }])
    ).rejects.toThrow('No AI providers are enabled');
  });
});
