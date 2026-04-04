import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { FileSlice, createFileSlice } from './slices/fileSlice';
import { GitSlice, createGitSlice } from './slices/gitSlice';
import { LLMSlice, createLLMSlice } from './slices/llmSlice';
import { LearningSlice, createLearningSlice } from './slices/learningSlice';
import { UISlice, createUISlice } from './slices/uiSlice';
import { EditorChatSlice, createEditorChatSlice } from './slices/editorChatSlice';

export type IDEStoreState = FileSlice & GitSlice & LLMSlice & LearningSlice & UISlice & EditorChatSlice;

export const useIDEStore = create<IDEStoreState>()(
  persist(
    (...a) => ({
      ...createFileSlice(...a),
      ...createGitSlice(...a),
      ...createLLMSlice(...a),
      ...createLearningSlice(...a),
      ...createUISlice(...a),
      ...createEditorChatSlice(...a),
    }),
    {
      name: 'neon-protocol-ide',
      version: 3,
      partialize: (state) => ({
        currentView: state.currentView,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        editorSettings: state.editorSettings,
        isSidebarOpen: state.isSidebarOpen,
        recentProjects: state.recentProjects,
        dismissedHints: state.dismissedHints,
        // Strip apiKey from persisted providers — keys should not live in localStorage
        providers: state.providers.map(({ apiKey, ...rest }) => rest),
        learningMode: state.learningMode,
        learningProgress: state.learningProgress,
      }),
      migrate: (persisted: any, version: number) => {
        if (version < 2) {
          if (persisted?.providers) {
            persisted.providers = persisted.providers.map((p: any) => ({
              ...p,
              type: p.type || (p.name === 'Ollama' ? 'ollama' : p.name === 'Anthropic' ? 'anthropic' : p.name === 'OpenAI' ? 'openai' : 'openai-compatible'),
              tokensUsed: p.tokensUsed || 0,
              requestCount: p.requestCount || 0,
            }));
          }
          if (persisted?.editorSettings && !persisted.editorSettings.systemRamGb) {
            persisted.editorSettings.systemRamGb = 16;
          }
        }
        if (version < 3) {
          persisted.learningMode = persisted.learningMode || 'beginner';
          persisted.learningProgress = persisted.learningProgress || {
            completedSteps: [],
            completedLessons: [],
            currentTutorialStep: 0,
            activeTutorialId: null,
          };
        }
        return persisted;
      },
    }
  )
);
