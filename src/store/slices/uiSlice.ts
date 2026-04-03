import { StateCreator } from 'zustand';
import { IDEView } from '../../types';

export interface UISlice {
  currentView: IDEView;
  selectedModule: string | null;
  isExplorerOpen: boolean;
  isSidebarOpen: boolean;
  hasCompletedOnboarding: boolean;
  recentProjects: string[];
  dismissedHints: string[];

  setView: (view: IDEView) => void;
  selectModule: (name: string | null) => void;
  toggleExplorer: (open?: boolean) => void;
  toggleSidebar: () => void;
  setOnboardingComplete: () => void;
  addRecentProject: (name: string) => void;
  dismissHint: (hintId: string) => void;
}

export const createUISlice: StateCreator<UISlice, [], [], UISlice> = (set) => ({
  currentView: 'blueprint',
  selectedModule: null,
  isExplorerOpen: false,
  isSidebarOpen: true,
  hasCompletedOnboarding: false,
  recentProjects: [],
  dismissedHints: [],

  setView: (view) => set({ currentView: view }),

  selectModule: (name) => set({
    selectedModule: name,
    isExplorerOpen: !!name,
  }),

  toggleExplorer: (open?) => set((state) => ({
    isExplorerOpen: typeof open !== 'undefined' ? open : !state.isExplorerOpen,
  })),

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  setOnboardingComplete: () => set({ hasCompletedOnboarding: true }),

  addRecentProject: (name) => set((state) => {
    const filtered = state.recentProjects.filter(p => p !== name);
    return { recentProjects: [name, ...filtered].slice(0, 5) };
  }),

  dismissHint: (hintId) => set((state) => ({
    dismissedHints: [...state.dismissedHints, hintId],
  })),
});
