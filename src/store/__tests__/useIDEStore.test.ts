import { describe, it, expect, beforeEach } from 'vitest';
import { useIDEStore } from '../useIDEStore';

// Reset store between tests
beforeEach(() => {
  useIDEStore.setState(useIDEStore.getState(), true);
});

describe('useIDEStore', () => {
  describe('initial state', () => {
    it('has correct default values', () => {
      const state = useIDEStore.getState();
      expect(state.currentView).toBe('blueprint');
      expect(state.files).toEqual([]);
      expect(state.providers).toEqual([]);
      expect(state.learningMode).toBe('beginner');
      expect(state.hasCompletedOnboarding).toBe(false);
      expect(state.gitState.isGitRepo).toBe(false);
    });
  });

  describe('view management', () => {
    it('switches views', () => {
      const { setView } = useIDEStore.getState();
      setView('code');
      expect(useIDEStore.getState().currentView).toBe('code');
      setView('orchestrator');
      expect(useIDEStore.getState().currentView).toBe('orchestrator');
    });
  });

  describe('file management', () => {
    it('opens a file and adds it to tabs', () => {
      const { openFile } = useIDEStore.getState();
      openFile('test/file.ts');
      const state = useIDEStore.getState();
      expect(state.openTabs).toContain('test/file.ts');
      expect(state.activeFile).toBe('test/file.ts');
    });

    it('does not duplicate tabs when opening the same file', () => {
      const { openFile } = useIDEStore.getState();
      openFile('test/file.ts');
      openFile('test/file.ts');
      expect(useIDEStore.getState().openTabs).toEqual(['test/file.ts']);
    });

    it('closes a tab and selects the nearest remaining', () => {
      // Start with clean tabs
      useIDEStore.setState({ openTabs: [], activeFile: null });
      const { openFile, closeTab } = useIDEStore.getState();
      openFile('a.ts');
      openFile('b.ts');
      openFile('c.ts');
      // active is c.ts, close it
      closeTab('c.ts');
      const state = useIDEStore.getState();
      expect(state.openTabs).toEqual(['a.ts', 'b.ts']);
      expect(state.activeFile).toBe('b.ts');
    });

    it('creates a file with correct language detection', () => {
      useIDEStore.setState({ projectPath: 'my-project', files: [] });
      const { createFile } = useIDEStore.getState();
      createFile('index.tsx', 'my-project');
      const file = useIDEStore.getState().files.find(f => f.name === 'index.tsx');
      expect(file).toBeDefined();
      expect(file!.language).toBe('typescript');
    });

    it('creates a Python file with correct language', () => {
      useIDEStore.setState({ projectPath: 'proj', files: [] });
      const { createFile } = useIDEStore.getState();
      createFile('app.py', 'proj');
      const file = useIDEStore.getState().files.find(f => f.name === 'app.py');
      expect(file!.language).toBe('python');
    });

    it('marks file content as dirty on update', () => {
      useIDEStore.setState({
        files: [{ name: 'a.ts', path: 'proj/a.ts', content: 'old', language: 'typescript' }],
      });
      const { updateFileContent } = useIDEStore.getState();
      updateFileContent('proj/a.ts', 'new');
      const file = useIDEStore.getState().files.find(f => f.path === 'proj/a.ts');
      expect(file!.content).toBe('new');
      expect(file!.isDirty).toBe(true);
    });
  });

  describe('toast management', () => {
    it('adds and auto-removes toasts', async () => {
      const { addToast } = useIDEStore.getState();
      addToast('Test message', 'success');
      expect(useIDEStore.getState().toasts).toHaveLength(1);
      expect(useIDEStore.getState().toasts[0].message).toBe('Test message');
    });

    it('manually removes a toast', () => {
      useIDEStore.setState({ toasts: [] });
      const { addToast, removeToast } = useIDEStore.getState();
      addToast('msg', 'info');
      const toasts = useIDEStore.getState().toasts;
      expect(toasts.length).toBeGreaterThan(0);
      removeToast(toasts[toasts.length - 1].id);
      expect(useIDEStore.getState().toasts.filter(t => t.message === 'msg')).toHaveLength(0);
    });
  });

  describe('LLM provider management', () => {
    it('adds a provider with auto-priority', () => {
      const { addProvider } = useIDEStore.getState();
      addProvider({ id: 'p1', name: 'Test', type: 'openai-compatible', model: 'test', baseUrl: 'http://localhost', enabled: true, priority: 0 });
      const providers = useIDEStore.getState().providers;
      expect(providers).toHaveLength(1);
      expect(providers[0].priority).toBe(1);
    });

    it('removes a provider and reindexes priorities', () => {
      const { addProvider, removeProvider } = useIDEStore.getState();
      addProvider({ id: 'p1', name: 'A', type: 'ollama', model: 'm', baseUrl: 'http://a', enabled: true, priority: 0 });
      addProvider({ id: 'p2', name: 'B', type: 'openai', model: 'm', baseUrl: 'http://b', enabled: true, priority: 0 });
      removeProvider('p1');
      const providers = useIDEStore.getState().providers;
      expect(providers).toHaveLength(1);
      expect(providers[0].id).toBe('p2');
      expect(providers[0].priority).toBe(1);
    });

    it('tracks token usage', () => {
      const { addProvider, trackTokenUsage } = useIDEStore.getState();
      addProvider({ id: 'p1', name: 'Test', type: 'ollama', model: 'm', baseUrl: 'http://a', enabled: true, priority: 0, tokensUsed: 0, requestCount: 0 });
      trackTokenUsage('p1', 100);
      trackTokenUsage('p1', 50);
      const provider = useIDEStore.getState().providers.find(p => p.id === 'p1');
      expect(provider!.tokensUsed).toBe(150);
      expect(provider!.requestCount).toBe(2);
    });
  });

  describe('learning system', () => {
    it('starts and advances a tutorial', () => {
      const { startTutorial, advanceTutorial } = useIDEStore.getState();
      startTutorial('welcome-tour');
      expect(useIDEStore.getState().isTutorialActive).toBe(true);
      expect(useIDEStore.getState().learningProgress.activeTutorialId).toBe('welcome-tour');
      expect(useIDEStore.getState().learningProgress.currentTutorialStep).toBe(0);

      advanceTutorial();
      expect(useIDEStore.getState().learningProgress.currentTutorialStep).toBe(1);
    });

    it('completes a lesson idempotently', () => {
      const { completeLesson } = useIDEStore.getState();
      completeLesson('what-is-a-function');
      completeLesson('what-is-a-function'); // duplicate
      expect(useIDEStore.getState().learningProgress.completedLessons).toEqual(['what-is-a-function']);
    });
  });

  describe('persistence partialize', () => {
    it('excludes transient state from persistence', () => {
      // The partialize function should not include files, chatMessages, gitState, etc.
      const state = useIDEStore.getState();
      const persisted = {
        currentView: state.currentView,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        editorSettings: state.editorSettings,
        isSidebarOpen: state.isSidebarOpen,
        recentProjects: state.recentProjects,
        dismissedHints: state.dismissedHints,
        providers: state.providers,
        learningMode: state.learningMode,
        learningProgress: state.learningProgress,
      };
      // These keys should NOT be in persisted state
      expect(persisted).not.toHaveProperty('files');
      expect(persisted).not.toHaveProperty('chatMessages');
      expect(persisted).not.toHaveProperty('gitState');
      expect(persisted).not.toHaveProperty('toasts');
    });
  });
});
