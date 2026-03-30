export type IDEView = 'blueprint' | 'code' | 'orchestrator';

export interface FileEntry {
  name: string;
  path: string;
  content: string;
  language: string;
  handle?: any; // For File System Access API
}

export interface IDEState {
  currentView: IDEView;
  selectedModule: string | null;
  isExplorerOpen: boolean;
  projectPath: string | null;
  files: FileEntry[];
  activeFile: string | null;
  
  setView: (view: IDEView) => void;
  selectModule: (name: string | null) => void;
  toggleExplorer: (open?: boolean) => void;
  setProject: (path: string, files: FileEntry[]) => void;
  setActiveFile: (path: string) => void;
}
