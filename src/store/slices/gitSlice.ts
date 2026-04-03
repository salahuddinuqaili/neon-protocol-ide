import { StateCreator } from 'zustand';
import { GitState } from '../../types';

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

export interface GitSlice {
  gitBranch: string | null;
  gitState: GitState;
  setGitBranch: (branch: string | null) => void;
  setGitState: (partial: Partial<GitState>) => void;
}

export const createGitSlice: StateCreator<GitSlice, [], [], GitSlice> = (set) => ({
  gitBranch: null,
  gitState: DEFAULT_GIT_STATE,
  setGitBranch: (branch) => set({ gitBranch: branch }),
  setGitState: (partial) => set((state) => ({ gitState: { ...state.gitState, ...partial } })),
});
