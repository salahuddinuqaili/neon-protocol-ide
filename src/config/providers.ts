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

// --- Model Recommendation Engine ---

export interface ModelRecommendation {
  model: string;
  label: string;
  sizeGb: number;
  description: string;
  minRamGb: number;
}

export const MODEL_CATALOG: ModelRecommendation[] = [
  { model: 'qwen2:0.5b', label: 'Qwen2 0.5B', sizeGb: 0.4, description: 'Tiny & fast, great for testing', minRamGb: 4 },
  { model: 'phi3:mini', label: 'Phi-3 Mini', sizeGb: 2.3, description: 'Small but capable', minRamGb: 6 },
  { model: 'llama3:8b', label: 'Llama 3 8B', sizeGb: 4.7, description: 'Good all-rounder', minRamGb: 10 },
  { model: 'mistral:7b', label: 'Mistral 7B', sizeGb: 4.1, description: 'Fast and efficient', minRamGb: 10 },
  { model: 'codellama:7b', label: 'Code Llama 7B', sizeGb: 3.8, description: 'Optimized for code tasks', minRamGb: 10 },
  { model: 'llama3:70b-q4', label: 'Llama 3 70B (Q4)', sizeGb: 40, description: 'Top quality, needs powerful hardware', minRamGb: 48 },
];

export const DEMO_MODEL = MODEL_CATALOG[0]; // qwen2:0.5b — smallest model for onboarding

export function getRecommendedModels(ramGb: number): (ModelRecommendation & { fits: boolean })[] {
  return MODEL_CATALOG.filter(m => m.minRamGb <= ramGb)
    .map(m => ({ ...m, fits: m.minRamGb <= ramGb * 0.7 }));
}
