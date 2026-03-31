export type IDEView = 'blueprint' | 'code' | 'orchestrator';

export type OllamaStatus = 'active' | 'offline' | 'checking';

export interface FileEntry {
  name: string;
  path: string;
  content: string;
  language: string;
  handle?: any; // FileSystemFileHandle - typed as any due to incomplete browser API typings
  isDirty?: boolean;
}

export interface ChatMessage {
  role: 'ai' | 'user';
  text: string;
}

export interface EditorSettings {
  fontSize: number;
  wordWrap: boolean;
  minimap: boolean;
  lineHeight: number;
  systemRamGb: number; // User-reported or auto-detected
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export type ProviderType = 'ollama' | 'openai' | 'anthropic' | 'openai-compatible';

export type ConnectionStatus = 'untested' | 'testing' | 'verified' | 'failed';

export interface LLMProviderConfig {
  id: string;
  name: string;
  type: ProviderType;
  model: string;
  baseUrl: string;
  apiKey?: string;
  enabled: boolean;
  priority: number;
  tokensUsed?: number;
  requestCount?: number;
  connectionStatus?: ConnectionStatus;
  connectionError?: string;
}

export interface IDEState {
  currentView: IDEView;
  selectedModule: string | null;
  isExplorerOpen: boolean;
  projectPath: string | null;
  files: FileEntry[];         // All project files
  openTabs: string[];         // Paths of files open in editor tabs
  activeFile: string | null;
  gitBranch: string | null;
  ollamaStatus: OllamaStatus;
  hasCompletedOnboarding: boolean;
  chatMessages: ChatMessage[];
  editorSettings: EditorSettings;
  toasts: Toast[];
  isScanning: boolean;
  isSidebarOpen: boolean;
  recentProjects: string[];
  dismissedHints: string[];
  providers: LLMProviderConfig[];

  setView: (view: IDEView) => void;
  selectModule: (name: string | null) => void;
  toggleExplorer: (open?: boolean) => void;
  setProject: (path: string | null, files: FileEntry[]) => void;
  openFile: (path: string) => void;       // Open a file in a tab and make it active
  setActiveFile: (path: string | null) => void;
  updateFileContent: (path: string, content: string) => void;
  closeTab: (path: string) => void;       // Close tab only, file stays in project
  markFileSaved: (path: string) => void;
  createFile: (name: string, folderPath: string) => void;
  renameFile: (oldPath: string, newName: string) => void;
  deleteFile: (path: string) => void;
  setGitBranch: (branch: string | null) => void;
  setOllamaStatus: (status: OllamaStatus) => void;
  setOnboardingComplete: () => void;
  addChatMessage: (message: ChatMessage) => void;
  clearChatMessages: () => void;
  updateEditorSettings: (settings: Partial<EditorSettings>) => void;
  addToast: (message: string, type: Toast['type']) => void;
  removeToast: (id: string) => void;
  setIsScanning: (scanning: boolean) => void;
  toggleSidebar: () => void;
  addRecentProject: (name: string) => void;
  closeProject: () => void;
  dismissHint: (hintId: string) => void;
  updateProvider: (id: string, updates: Partial<LLMProviderConfig>) => void;
  reorderProviders: (providers: LLMProviderConfig[]) => void;
  addProvider: (provider: LLMProviderConfig) => void;
  removeProvider: (id: string) => void;
  trackTokenUsage: (providerId: string, tokens: number) => void;
}
