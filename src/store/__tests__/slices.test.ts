import { describe, it, expect, beforeEach } from 'vitest';
import { useIDEStore } from '../useIDEStore';

// Reset store between tests
beforeEach(() => {
  useIDEStore.setState(useIDEStore.getState(), true);
});

describe('UI Slice', () => {
  it('sets view correctly', () => {
    const { setView } = useIDEStore.getState();
    setView('code');
    expect(useIDEStore.getState().currentView).toBe('code');
    setView('terminal');
    expect(useIDEStore.getState().currentView).toBe('terminal');
  });

  it('selectModule opens explorer and sets module', () => {
    const { selectModule } = useIDEStore.getState();
    selectModule('AI Router');
    const state = useIDEStore.getState();
    expect(state.selectedModule).toBe('AI Router');
    expect(state.isExplorerOpen).toBe(true);
  });

  it('selectModule with null closes explorer', () => {
    useIDEStore.setState({ selectedModule: 'AI Router', isExplorerOpen: true });
    const { selectModule } = useIDEStore.getState();
    selectModule(null);
    expect(useIDEStore.getState().selectedModule).toBeNull();
    expect(useIDEStore.getState().isExplorerOpen).toBe(false);
  });

  it('toggleExplorer flips state', () => {
    const { toggleExplorer } = useIDEStore.getState();
    expect(useIDEStore.getState().isExplorerOpen).toBe(false);
    toggleExplorer();
    expect(useIDEStore.getState().isExplorerOpen).toBe(true);
    toggleExplorer();
    expect(useIDEStore.getState().isExplorerOpen).toBe(false);
  });

  it('toggleExplorer with explicit value', () => {
    const { toggleExplorer } = useIDEStore.getState();
    toggleExplorer(true);
    expect(useIDEStore.getState().isExplorerOpen).toBe(true);
    toggleExplorer(true);
    expect(useIDEStore.getState().isExplorerOpen).toBe(true);
    toggleExplorer(false);
    expect(useIDEStore.getState().isExplorerOpen).toBe(false);
  });

  it('toggleSidebar flips state', () => {
    const { toggleSidebar } = useIDEStore.getState();
    const initial = useIDEStore.getState().isSidebarOpen;
    toggleSidebar();
    expect(useIDEStore.getState().isSidebarOpen).toBe(!initial);
    toggleSidebar();
    expect(useIDEStore.getState().isSidebarOpen).toBe(initial);
  });

  it('setOnboardingComplete sets flag', () => {
    const { setOnboardingComplete } = useIDEStore.getState();
    expect(useIDEStore.getState().hasCompletedOnboarding).toBe(false);
    setOnboardingComplete();
    expect(useIDEStore.getState().hasCompletedOnboarding).toBe(true);
  });

  it('addRecentProject deduplicates and limits to 5', () => {
    const { addRecentProject } = useIDEStore.getState();
    addRecentProject('proj-a');
    addRecentProject('proj-b');
    addRecentProject('proj-c');
    addRecentProject('proj-d');
    addRecentProject('proj-e');
    addRecentProject('proj-f');
    const projects = useIDEStore.getState().recentProjects;
    expect(projects).toHaveLength(5);
    expect(projects[0]).toBe('proj-f');
    expect(projects).not.toContain('proj-a');
  });

  it('addRecentProject moves existing to front', () => {
    useIDEStore.setState({ recentProjects: [] });
    const { addRecentProject } = useIDEStore.getState();
    addRecentProject('proj-a');
    addRecentProject('proj-b');
    addRecentProject('proj-a'); // re-add
    const projects = useIDEStore.getState().recentProjects;
    expect(projects).toEqual(['proj-a', 'proj-b']);
  });

  it('dismissHint adds hint ID', () => {
    const { dismissHint } = useIDEStore.getState();
    dismissHint('hint-1');
    dismissHint('hint-2');
    expect(useIDEStore.getState().dismissedHints).toContain('hint-1');
    expect(useIDEStore.getState().dismissedHints).toContain('hint-2');
  });
});

describe('Git Slice', () => {
  it('sets git branch', () => {
    const { setGitBranch } = useIDEStore.getState();
    setGitBranch('feature-x');
    expect(useIDEStore.getState().gitBranch).toBe('feature-x');
  });

  it('sets git branch to null', () => {
    useIDEStore.setState({ gitBranch: 'main' });
    const { setGitBranch } = useIDEStore.getState();
    setGitBranch(null);
    expect(useIDEStore.getState().gitBranch).toBeNull();
  });

  it('partially updates git state', () => {
    const { setGitState } = useIDEStore.getState();
    setGitState({ isGitRepo: true, branch: 'main', changedFileCount: 3 });
    const gs = useIDEStore.getState().gitState;
    expect(gs.isGitRepo).toBe(true);
    expect(gs.branch).toBe('main');
    expect(gs.changedFileCount).toBe(3);
    // Other fields unchanged
    expect(gs.ahead).toBe(0);
    expect(gs.files).toEqual([]);
  });

  it('preserves existing git state on partial update', () => {
    const { setGitState } = useIDEStore.getState();
    setGitState({ isGitRepo: true, branch: 'main' });
    setGitState({ ahead: 5 });
    const gs = useIDEStore.getState().gitState;
    expect(gs.isGitRepo).toBe(true);
    expect(gs.branch).toBe('main');
    expect(gs.ahead).toBe(5);
  });
});

describe('EditorChat Slice', () => {
  it('updates editor settings partially', () => {
    const { updateEditorSettings } = useIDEStore.getState();
    updateEditorSettings({ fontSize: 16 });
    const settings = useIDEStore.getState().editorSettings;
    expect(settings.fontSize).toBe(16);
    expect(settings.wordWrap).toBe(true); // unchanged
  });

  it('adds chat messages with auto-generated id and timestamp', () => {
    useIDEStore.setState({ chatMessages: [] });
    const { addChatMessage } = useIDEStore.getState();
    addChatMessage({ role: 'user', text: 'Hello' });
    const msgs = useIDEStore.getState().chatMessages;
    expect(msgs).toHaveLength(1);
    expect(msgs[0].text).toBe('Hello');
    expect(msgs[0].id).toBeDefined();
    expect(msgs[0].timestamp).toBeGreaterThan(0);
  });

  it('clears chat messages', () => {
    useIDEStore.setState({ chatMessages: [] });
    const { addChatMessage, clearChatMessages } = useIDEStore.getState();
    addChatMessage({ role: 'user', text: 'msg1' });
    addChatMessage({ role: 'ai', text: 'msg2' });
    expect(useIDEStore.getState().chatMessages).toHaveLength(2);
    clearChatMessages();
    expect(useIDEStore.getState().chatMessages).toHaveLength(0);
  });

  it('removes a specific toast', () => {
    useIDEStore.setState({ toasts: [] });
    const { addToast, removeToast } = useIDEStore.getState();
    addToast('toast-a', 'success');
    addToast('toast-b', 'error');
    const toasts = useIDEStore.getState().toasts;
    expect(toasts).toHaveLength(2);
    removeToast(toasts[0].id);
    expect(useIDEStore.getState().toasts).toHaveLength(1);
    expect(useIDEStore.getState().toasts[0].message).toBe('toast-b');
  });
});

describe('Learning Slice', () => {
  it('sets learning mode', () => {
    const { setLearningMode } = useIDEStore.getState();
    setLearningMode('experienced');
    expect(useIDEStore.getState().learningMode).toBe('experienced');
    setLearningMode('beginner');
    expect(useIDEStore.getState().learningMode).toBe('beginner');
  });

  it('starts a tutorial and sets correct initial state', () => {
    const { startTutorial } = useIDEStore.getState();
    startTutorial('git-tour');
    const state = useIDEStore.getState();
    expect(state.isTutorialActive).toBe(true);
    expect(state.learningProgress.activeTutorialId).toBe('git-tour');
    expect(state.learningProgress.currentTutorialStep).toBe(0);
  });

  it('advances tutorial and tracks completed steps', () => {
    const { startTutorial, advanceTutorial } = useIDEStore.getState();
    startTutorial('welcome-tour');
    advanceTutorial();
    const state = useIDEStore.getState();
    expect(state.learningProgress.currentTutorialStep).toBe(1);
    expect(state.learningProgress.completedSteps).toContain('welcome-tour-step-0');
  });

  it('completes tutorial and resets state', () => {
    const { startTutorial, advanceTutorial, completeTutorial } = useIDEStore.getState();
    startTutorial('welcome-tour');
    advanceTutorial();
    completeTutorial();
    const state = useIDEStore.getState();
    expect(state.isTutorialActive).toBe(false);
    expect(state.learningProgress.activeTutorialId).toBeNull();
    expect(state.learningProgress.currentTutorialStep).toBe(0);
    // Completed steps are preserved
    expect(state.learningProgress.completedSteps).toContain('welcome-tour-step-0');
  });

  it('skips tutorial and resets all progress', () => {
    const { startTutorial, advanceTutorial, skipTutorial } = useIDEStore.getState();
    startTutorial('welcome-tour');
    advanceTutorial();
    skipTutorial();
    const state = useIDEStore.getState();
    expect(state.isTutorialActive).toBe(false);
    expect(state.learningProgress.completedSteps).toEqual([]);
  });

  it('completes lessons idempotently', () => {
    const { completeLesson } = useIDEStore.getState();
    completeLesson('what-is-a-function');
    completeLesson('what-is-a-function'); // duplicate
    completeLesson('components-and-reuse');
    expect(useIDEStore.getState().learningProgress.completedLessons).toEqual([
      'what-is-a-function', 'components-and-reuse'
    ]);
  });

  it('toggleGlossary with and without explicit value', () => {
    const { toggleGlossary } = useIDEStore.getState();
    expect(useIDEStore.getState().isGlossaryOpen).toBe(false);
    toggleGlossary();
    expect(useIDEStore.getState().isGlossaryOpen).toBe(true);
    toggleGlossary(false);
    expect(useIDEStore.getState().isGlossaryOpen).toBe(false);
  });

  it('toggleLearningPath with and without explicit value', () => {
    const { toggleLearningPath } = useIDEStore.getState();
    expect(useIDEStore.getState().isLearningPathOpen).toBe(false);
    toggleLearningPath(true);
    expect(useIDEStore.getState().isLearningPathOpen).toBe(true);
    toggleLearningPath();
    expect(useIDEStore.getState().isLearningPathOpen).toBe(false);
  });

  it('resets learning progress', () => {
    const { startTutorial, advanceTutorial, completeLesson, resetLearningProgress } = useIDEStore.getState();
    startTutorial('welcome-tour');
    advanceTutorial();
    completeLesson('what-is-a-function');
    resetLearningProgress();
    const state = useIDEStore.getState();
    expect(state.isTutorialActive).toBe(false);
    expect(state.learningProgress.completedSteps).toEqual([]);
    expect(state.learningProgress.completedLessons).toEqual([]);
  });
});
