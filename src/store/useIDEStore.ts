import { create } from 'zustand';
import { IDEState, IDEView, FileEntry } from '../types';

/**
 * 🎓 LEARNER TIP: The "Store" is the app's central memory.
 * We use Zustand because it's simple and fast. Instead of passing data through 
 * every component, we just "ask" the store for what we need.
 */
export const useIDEStore = create<IDEState>((set) => ({
  // 1. DATA (The current "state" of the app)
  currentView: 'blueprint', // Which screen are we on?
  selectedModule: null,    // Which box on the map did you click?
  isExplorerOpen: false,   // Is the side drawer open?
  projectPath: null,       // Where on your computer are the files?
  files: [],               // The list of all your project files
  activeFile: null,        // The file you are currently editing
  
  // 2. ACTIONS (Functions to change the data)
  setView: (view: IDEView) => set({ currentView: view }),
  
  selectModule: (name: string | null) => set({ 
    selectedModule: name, 
    isExplorerOpen: !!name // Automatically open the side drawer if a module is clicked
  }),
  
  toggleExplorer: (open?: boolean) => set((state) => ({ 
    isExplorerOpen: typeof open !== 'undefined' ? open : !state.isExplorerOpen 
  })),
  
  setProject: (path: string | null, files: FileEntry[]) => set({ 
    projectPath: path, 
    files, 
    activeFile: files.length > 0 ? files[0].path : null 
  }),
  
  setActiveFile: (path: string | null) => set({ activeFile: path }),
  
  updateFileContent: (path: string, content: string) => set((state) => ({
    // Use the .map() function to find the file and update its content safely
    files: state.files.map(f => f.path === path ? { ...f, content } : f)
  })),
}));
