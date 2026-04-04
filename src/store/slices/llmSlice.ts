import { StateCreator } from 'zustand';
import { LLMProviderConfig, OllamaStatus, OllamaInstallStatus, HardwareInfo, ModelPullProgress } from '../../types';

export interface LLMSlice {
  providers: LLMProviderConfig[];
  ollamaStatus: OllamaStatus;
  ollamaInstallStatus: OllamaInstallStatus;
  ollamaInstallError: string | null;
  hardwareInfo: HardwareInfo | null;
  availableOllamaModels: string[];
  modelPullProgress: ModelPullProgress | null;
  setOllamaStatus: (status: OllamaStatus) => void;
  setOllamaInstallStatus: (status: OllamaInstallStatus, error?: string) => void;
  setHardwareInfo: (info: HardwareInfo) => void;
  setAvailableOllamaModels: (models: string[]) => void;
  setModelPullProgress: (progress: ModelPullProgress | null) => void;
  updateProvider: (id: string, updates: Partial<LLMProviderConfig>) => void;
  reorderProviders: (providers: LLMProviderConfig[]) => void;
  addProvider: (provider: LLMProviderConfig) => void;
  removeProvider: (id: string) => void;
  trackTokenUsage: (providerId: string, tokens: number) => void;
}

export const createLLMSlice: StateCreator<LLMSlice, [], [], LLMSlice> = (set) => ({
  providers: [],
  ollamaStatus: 'checking',
  ollamaInstallStatus: 'unknown',
  ollamaInstallError: null,
  hardwareInfo: null,
  availableOllamaModels: [],
  modelPullProgress: null,

  setOllamaStatus: (status) => set({ ollamaStatus: status }),

  setOllamaInstallStatus: (status, error) => set({ ollamaInstallStatus: status, ollamaInstallError: error || null }),

  setHardwareInfo: (info) => set({ hardwareInfo: info }),

  setAvailableOllamaModels: (models) => set({ availableOllamaModels: models }),

  setModelPullProgress: (progress) => set({ modelPullProgress: progress }),

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
