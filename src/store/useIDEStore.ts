import { create } from 'zustand';
import { IDEState, IDEView } from '../types';

export const useIDEStore = create<IDEState>((set) => ({
  currentView: 'blueprint',
  selectedModule: null,
  isExplorerOpen: false,
  setView: (view: IDEView) => set({ currentView: view }),
  selectModule: (name: string | null) => set({ selectedModule: name, isExplorerOpen: !!name }),
  toggleExplorer: (open?: boolean) => set((state) => ({ 
    isExplorerOpen: typeof open !== 'undefined' ? open : !state.isExplorerOpen 
  })),
}));
