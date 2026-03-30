import { create } from 'zustand';
import { IDEState, IDEView, FileEntry } from '../types';

export const useIDEStore = create<IDEState>((set) => ({
  currentView: 'blueprint',
  selectedModule: null,
  isExplorerOpen: false,
  projectPath: null,
  files: [],
  activeFile: null,
  
  setView: (view: IDEView) => set({ currentView: view }),
  selectModule: (name: string | null) => set({ selectedModule: name, isExplorerOpen: !!name }),
  toggleExplorer: (open?: boolean) => set((state) => ({ 
    isExplorerOpen: typeof open !== 'undefined' ? open : !state.isExplorerOpen 
  })),
  setProject: (path: string, files: FileEntry[]) => set({ 
    projectPath: path, 
    files, 
    activeFile: files.length > 0 ? files[0].path : null 
  }),
  setActiveFile: (path: string) => set({ activeFile: path }),
}));
