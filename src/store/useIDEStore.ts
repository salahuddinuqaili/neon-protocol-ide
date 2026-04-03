import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { IDEState, IDEView, FileEntry, OllamaStatus, ChatMessage, EditorSettings, Toast, LLMProviderConfig, LearningMode, LearningProgress, GitState } from '../types';

let toastCounter = 0;

const DEFAULT_GIT_STATE: GitState = {
  isGitRepo: false,
  branch: null,
  changedFileCount: 0,
  files: [],
  branches: [],
  log: [],
  ahead: 0,
  behind: 0,
  stashCount: 0,
  isLoading: false,
  lastError: null,
};

const DEFAULT_LEARNING_PROGRESS: LearningProgress = {
  completedSteps: [],
  completedLessons: [],
  currentTutorialStep: 0,
  activeTutorialId: null,
};

const DEFAULT_PROVIDERS: LLMProviderConfig[] = [];

const LANG_MAP: Record<string, string> = {
  'ts': 'typescript', 'tsx': 'typescript', 'js': 'javascript', 'jsx': 'javascript',
  'py': 'python', 'json': 'json', 'md': 'markdown', 'css': 'css', 'html': 'html',
  'rb': 'ruby', 'rs': 'rust', 'go': 'go', 'c': 'c', 'cpp': 'cpp', 'java': 'java',
};

export const useIDEStore = create<IDEState>()(
  persist(
    (set) => ({
      currentView: 'blueprint',
      selectedModule: null,
      isExplorerOpen: false,
      projectPath: null,
      files: [],
      openTabs: [],
      activeFile: null,
      gitBranch: null,
      ollamaStatus: 'checking',
      hasCompletedOnboarding: false,
      chatMessages: [],
      editorSettings: { fontSize: 13, wordWrap: true, minimap: false, lineHeight: 1.6, systemRamGb: 16 },
      toasts: [],
      isScanning: false,
      isSidebarOpen: true,
      recentProjects: [],
      dismissedHints: [],
      providers: DEFAULT_PROVIDERS,

      // Git
      gitState: DEFAULT_GIT_STATE,

      // Learning system
      learningMode: 'beginner',
      learningProgress: DEFAULT_LEARNING_PROGRESS,
      isTutorialActive: false,
      isGlossaryOpen: false,
      isLearningPathOpen: false,

      setView: (view: IDEView) => set({ currentView: view }),

      selectModule: (name: string | null) => set({
        selectedModule: name,
        isExplorerOpen: !!name,
      }),

      toggleExplorer: (open?: boolean) => set((state) => ({
        isExplorerOpen: typeof open !== 'undefined' ? open : !state.isExplorerOpen,
      })),

      setProject: (path: string | null, files: FileEntry[]) => set({
        projectPath: path,
        files: files.map(f => ({ ...f, isDirty: false })),
        openTabs: files.length > 0 ? [files[0].path] : [],
        activeFile: files.length > 0 ? files[0].path : null,
        isScanning: false,
      }),

      openFile: (path: string) => set((state) => ({
        openTabs: state.openTabs.includes(path) ? state.openTabs : [...state.openTabs, path],
        activeFile: path,
      })),

      setActiveFile: (path: string | null) => set({ activeFile: path }),

      updateFileContent: (path: string, content: string) => set((state) => ({
        files: state.files.map(f => f.path === path ? { ...f, content, isDirty: true } : f),
      })),

      closeTab: (path: string) => set((state) => {
        const newTabs = state.openTabs.filter(t => t !== path);
        let newActive = state.activeFile;
        if (state.activeFile === path) {
          const idx = state.openTabs.indexOf(path);
          newActive = newTabs[Math.min(idx, newTabs.length - 1)] || null;
        }
        return { openTabs: newTabs, activeFile: newActive };
      }),

      markFileSaved: (path: string) => set((state) => ({
        files: state.files.map(f => f.path === path ? { ...f, isDirty: false } : f),
      })),

      createFile: (name: string, folderPath: string) => set((state) => {
        const path = folderPath ? `${folderPath}/${name}` : `${state.projectPath}/${name}`;
        const ext = name.split('.').pop() || 'text';
        const newFile: FileEntry = {
          name, path, content: '',
          language: LANG_MAP[ext] || 'text',
          isDirty: true,
        };
        return {
          files: [...state.files, newFile],
          openTabs: [...state.openTabs, path],
          activeFile: path,
        };
      }),

      renameFile: (oldPath: string, newName: string) => set((state) => {
        const parts = oldPath.split('/');
        parts[parts.length - 1] = newName;
        const newPath = parts.join('/');
        const ext = newName.split('.').pop() || 'text';
        return {
          files: state.files.map(f =>
            f.path === oldPath
              ? { ...f, name: newName, path: newPath, language: LANG_MAP[ext] || f.language, isDirty: true }
              : f
          ),
          openTabs: state.openTabs.map(t => t === oldPath ? newPath : t),
          activeFile: state.activeFile === oldPath ? newPath : state.activeFile,
        };
      }),

      deleteFile: (path: string) => set((state) => {
        const remaining = state.files.filter(f => f.path !== path);
        const newTabs = state.openTabs.filter(t => t !== path);
        return {
          files: remaining,
          openTabs: newTabs,
          activeFile: state.activeFile === path
            ? (newTabs.length > 0 ? newTabs[0] : null)
            : state.activeFile,
        };
      }),

      setGitBranch: (branch: string | null) => set({ gitBranch: branch }),
      setOllamaStatus: (status: OllamaStatus) => set({ ollamaStatus: status }),
      setOnboardingComplete: () => set({ hasCompletedOnboarding: true }),

      addChatMessage: (message: ChatMessage) => set((state) => ({
        chatMessages: [...state.chatMessages, message],
      })),
      clearChatMessages: () => set({ chatMessages: [] }),

      updateEditorSettings: (settings: Partial<EditorSettings>) => set((state) => ({
        editorSettings: { ...state.editorSettings, ...settings },
      })),

      addToast: (message: string, type: Toast['type']) => {
        const id = `toast-${++toastCounter}`;
        set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
        setTimeout(() => {
          set((state) => ({ toasts: state.toasts.filter(t => t.id !== id) }));
        }, 3000);
      },

      removeToast: (id: string) => set((state) => ({
        toasts: state.toasts.filter(t => t.id !== id),
      })),

      setIsScanning: (scanning: boolean) => set({ isScanning: scanning }),
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

      addRecentProject: (name: string) => set((state) => {
        const filtered = state.recentProjects.filter(p => p !== name);
        return { recentProjects: [name, ...filtered].slice(0, 5) };
      }),

      dismissHint: (hintId: string) => set((state) => ({
        dismissedHints: [...state.dismissedHints, hintId],
      })),

      closeProject: () => set({
        projectPath: null,
        files: [],
        openTabs: [],
        activeFile: null,
        chatMessages: [],
      }),

      setGitState: (partial: Partial<GitState>) => set((state) => ({
        gitState: { ...state.gitState, ...partial },
      })),

      ensureFiles: (incoming: FileEntry[]) => set((state) => {
        const existingPaths = new Set(state.files.map(f => f.path));
        const newFiles = incoming.filter(f => !existingPaths.has(f.path));
        if (newFiles.length === 0) return state;
        return { files: [...state.files, ...newFiles] };
      }),

      updateProvider: (id: string, updates: Partial<LLMProviderConfig>) => set((state) => ({
        providers: state.providers.map(p => p.id === id ? { ...p, ...updates } : p),
      })),

      reorderProviders: (providers: LLMProviderConfig[]) => set({ providers }),

      addProvider: (provider: LLMProviderConfig) => set((state) => ({
        providers: [...state.providers, { ...provider, priority: state.providers.length + 1 }],
      })),

      removeProvider: (id: string) => set((state) => ({
        providers: state.providers.filter(p => p.id !== id).map((p, i) => ({ ...p, priority: i + 1 })),
      })),

      trackTokenUsage: (providerId: string, tokens: number) => set((state) => ({
        providers: state.providers.map(p =>
          p.id === providerId
            ? { ...p, tokensUsed: (p.tokensUsed || 0) + tokens, requestCount: (p.requestCount || 0) + 1 }
            : p
        ),
      })),

      // Learning actions
      setLearningMode: (mode: LearningMode) => set({ learningMode: mode }),

      startTutorial: (tutorialId: string) => set((state) => ({
        isTutorialActive: true,
        learningProgress: {
          ...state.learningProgress,
          activeTutorialId: tutorialId,
          currentTutorialStep: 0,
        },
      })),

      advanceTutorial: () => set((state) => {
        const stepId = `${state.learningProgress.activeTutorialId}-step-${state.learningProgress.currentTutorialStep}`;
        return {
          learningProgress: {
            ...state.learningProgress,
            currentTutorialStep: state.learningProgress.currentTutorialStep + 1,
            completedSteps: state.learningProgress.completedSteps.includes(stepId)
              ? state.learningProgress.completedSteps
              : [...state.learningProgress.completedSteps, stepId],
          },
        };
      }),

      completeTutorial: () => set((state) => ({
        isTutorialActive: false,
        learningProgress: {
          ...state.learningProgress,
          activeTutorialId: null,
          currentTutorialStep: 0,
        },
      })),

      skipTutorial: () => set({
        isTutorialActive: false,
        learningProgress: { ...DEFAULT_LEARNING_PROGRESS },
      }),

      completeLesson: (lessonId: string) => set((state) => ({
        learningProgress: {
          ...state.learningProgress,
          completedLessons: state.learningProgress.completedLessons.includes(lessonId)
            ? state.learningProgress.completedLessons
            : [...state.learningProgress.completedLessons, lessonId],
        },
      })),

      toggleGlossary: (open?: boolean) => set((state) => ({
        isGlossaryOpen: typeof open !== 'undefined' ? open : !state.isGlossaryOpen,
      })),

      toggleLearningPath: (open?: boolean) => set((state) => ({
        isLearningPathOpen: typeof open !== 'undefined' ? open : !state.isLearningPathOpen,
      })),

      resetLearningProgress: () => set({
        learningProgress: { ...DEFAULT_LEARNING_PROGRESS },
        isTutorialActive: false,
      }),
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
        providers: state.providers,
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
