import { StateCreator } from 'zustand';
import { LLMProviderConfig, OllamaStatus } from '../../types';

export interface LLMSlice {
  providers: LLMProviderConfig[];
  ollamaStatus: OllamaStatus;
  setOllamaStatus: (status: OllamaStatus) => void;
  updateProvider: (id: string, updates: Partial<LLMProviderConfig>) => void;
  reorderProviders: (providers: LLMProviderConfig[]) => void;
  addProvider: (provider: LLMProviderConfig) => void;
  removeProvider: (id: string) => void;
  trackTokenUsage: (providerId: string, tokens: number) => void;
}

export const createLLMSlice: StateCreator<LLMSlice, [], [], LLMSlice> = (set) => ({
  providers: [],
  ollamaStatus: 'checking',

  setOllamaStatus: (status) => set({ ollamaStatus: status }),

  updateProvider: (id, updates) => set((state) => ({
    providers: state.providers.map(p => p.id === id ? { ...p, ...updates } : p),
  })),

  reorderProviders: (providers) => set({ providers }),

  addProvider: (provider) => set((state) => ({
    providers: [...state.providers, { ...provider, priority: state.providers.length + 1 }],
  })),

  removeProvider: (id) => set((state) => ({
    providers: state.providers.filter(p => p.id !== id).map((p, i) => ({ ...p, priority: i + 1 })),
  })),

  trackTokenUsage: (providerId, tokens) => set((state) => ({
    providers: state.providers.map(p =>
      p.id === providerId
        ? { ...p, tokensUsed: (p.tokensUsed || 0) + tokens, requestCount: (p.requestCount || 0) + 1 }
        : p
    ),
  })),
});
