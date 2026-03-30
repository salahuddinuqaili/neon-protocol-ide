export type IDEView = 'blueprint' | 'code' | 'orchestrator';

export interface ModuleNode {
  id: string;
  name: string;
  type: 'frontend' | 'router' | 'storage' | 'service';
  status: 'active' | 'offline' | 'warning';
}

export interface IDEState {
  currentView: IDEView;
  selectedModule: string | null;
  isExplorerOpen: boolean;
  setView: (view: IDEView) => void;
  selectModule: (name: string | null) => void;
  toggleExplorer: (open?: boolean) => void;
}
