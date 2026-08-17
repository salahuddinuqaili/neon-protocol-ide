import { LLMProviderConfig } from './index';

export interface ElectronAPI {
  // File system operations
  openDirectory: () => Promise<string | null>;
  readDirectory: (dirPath: string) => Promise<{ name: string; isFile: boolean; isDirectory: boolean }[]>;
  scanProject: (dirPath: string) => Promise<{ name: string; path: string; content: string }[]>;
  readFile: (filePath: string) => Promise<string | null>;
  writeFile: (filePath: string, content: string) => Promise<boolean>;
  /** Moves the file to the OS trash so the action stays recoverable. */
  deleteFile: (filePath: string) => Promise<{ success: boolean; error?: string }>;
  renameFile: (oldPath: string, newPath: string) => Promise<{ success: boolean; error?: string }>;

  // Git operations — core
  getGitBranch: (dirPath: string) => Promise<string | null>;
  getGitStatus: (dirPath: string) => Promise<number | null>;
  isGitRepo: (dirPath: string) => Promise<boolean>;
  getGitStatusFiles: (dirPath: string) => Promise<{ path: string; indexStatus: string; workTreeStatus: string; isStaged: boolean }[] | null>;
  gitStage: (dirPath: string, filePaths: string | string[]) => Promise<{ success: boolean; error?: string }>;
  gitUnstage: (dirPath: string, filePaths: string | string[]) => Promise<{ success: boolean; error?: string }>;
  gitCommit: (dirPath: string, message: string) => Promise<{ success: boolean; error?: string }>;
  gitDiff: (dirPath: string, filePath: string, staged?: boolean) => Promise<string | null>;
  gitFileContent: (dirPath: string, filePath: string) => Promise<string | null>;
  gitPush: (dirPath: string) => Promise<{ success: boolean; error?: string }>;
  gitPull: (dirPath: string) => Promise<{ success: boolean; error?: string }>;

  // Git operations — branch management
  gitBranchList: (dirPath: string) => Promise<{ name: string; isCurrent: boolean; isRemote: boolean }[]>;
  gitCheckout: (dirPath: string, branch: string) => Promise<{ success: boolean; error?: string }>;
  gitCreateBranch: (dirPath: string, name: string) => Promise<{ success: boolean; error?: string }>;
  gitRemoteStatus: (dirPath: string) => Promise<{ ahead: number; behind: number }>;

  // Git operations — advanced
  gitLog: (dirPath: string, count?: number) => Promise<{ hash: string; message: string }[]>;
  gitStash: (dirPath: string) => Promise<{ success: boolean; error?: string }>;
  gitStashPop: (dirPath: string) => Promise<{ success: boolean; error?: string }>;
  gitStashList: (dirPath: string) => Promise<string[]>;
  gitDiscardFile: (dirPath: string, filePath: string) => Promise<{ success: boolean; error?: string }>;

  // Terminal operations
  terminalExecute: (command: string, dirPath?: string) => Promise<{ id: string } | { error: string }>;
  terminalKill: (id: string) => Promise<boolean>;
  onTerminalData: (id: string, callback: (data: string) => void) => () => void;
  onTerminalExit: (id: string, callback: (code: number | null) => void) => () => void;

  // LLM chat proxy (API keys stay in main process)
  llmChat: (config: LLMProviderConfig, messages: { role: string; content: string }[]) => Promise<{
    content: string;
    provider: string;
    providerId: string;
    model: string;
    tokensUsed: number;
  }>;

  // Ollama management
  ollamaCheckInstalled: () => Promise<{ installed: boolean }>;
  ollamaInstall: () => Promise<{ success: boolean; message: string }>;
  onOllamaInstallProgress: (callback: (data: { status: string; detail: string }) => void) => () => void;
  ollamaListModels: () => Promise<{ models: string[] }>;
  ollamaPullModel: (modelName: string) => Promise<{ success: boolean }>;
  onOllamaPullProgress: (callback: (data: { model: string; percent: number; status: string }) => void) => () => void;

  // Hardware detection
  getHardwareInfo: () => Promise<{ ramGb: number; cpuCores: number; gpu: { detected: boolean; name: string; vramGb: number } }>;

  // Opens a link in the user's real browser.
  openExternal: (url: string) => Promise<{ ok: boolean; error?: string }>;

  /** Native modal confirmation. Used to guard destructive actions. */
  confirm: (options: {
    title?: string;
    message: string;
    detail?: string;
    confirmLabel?: string;
    danger?: boolean;
  }) => Promise<{ confirmed: boolean }>;

  /** Subscribes to native menu commands. Returns an unsubscribe function. */
  onMenuAction: (callback: (action: MenuAction) => void) => () => void;

  // System info
  isElectron: true;
  platform: string;
}

/** Commands the native application menu can dispatch into the renderer. */
export type MenuAction =
  | 'open-folder'
  | 'save-file'
  | 'save-all'
  | 'open-settings'
  | 'quick-open'
  | 'global-search'
  | 'view-blueprint'
  | 'view-code'
  | 'view-orchestrator'
  | 'view-terminal'
  | 'toggle-sidebar'
  | 'toggle-learning'
  | 'open-tutorial'
  | 'open-glossary';

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
