import { ProviderType, ConnectionStatus } from '../types';

export const MODEL_PLACEHOLDERS: Record<string, string> = {
  ollama: 'e.g. llama3:8b, mistral:7b',
  openai: 'model name',
  anthropic: 'e.g. claude-sonnet-4-20250514',
  'openai-compatible': 'model name or ID',
};

export interface ProviderPreset {
  label: string;
  type: ProviderType;
  baseUrl: string;
  model: string;
  description?: string;
}

export const PROVIDER_PRESETS: ProviderPreset[] = [
  { label: 'Local (Ollama)', type: 'ollama', baseUrl: 'http://localhost:11434', model: '', description: 'Runs models on your machine' },
  { label: 'OpenAI-compatible API', type: 'openai-compatible', baseUrl: '', model: '', description: 'Works with most cloud providers' },
  { label: 'Anthropic-compatible API', type: 'anthropic', baseUrl: 'https://api.anthropic.com/v1', model: '', description: 'For Anthropic-format endpoints' },
];

export const STATUS_DISPLAY: Record<ConnectionStatus, { label: string; color: string }> = {
  untested: { label: 'Not tested', color: 'text-muted border-muted/30' },
  testing: { label: 'Verifying...', color: 'text-accent-ai border-accent-ai/30' },
  verified: { label: 'Verified', color: 'text-primary border-primary/30' },
  failed: { label: 'Failed', color: 'text-accent-error border-accent-error/30' },
};
