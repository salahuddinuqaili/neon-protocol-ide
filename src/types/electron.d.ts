import { LLMProviderConfig } from './index';

export interface ElectronAPI {
  // File system operations
  openDirectory: () => Promise<string | null>;
  readDirectory: (dirPath: string) => Promise<{ name: string; isFile: boolean; isDirectory: boolean }[]>;
  scanProject: (dirPath: string) => Promise<{ name: string; path: string; content: string }[]>;
  readFile: (filePath: string) => Promise<string | null>;
  writeFile: (filePath: string, content: string) => Promise<boolean>;
  deleteFile: (filePath: string) => Promise<boolean>;
  renameFile: (oldPath: string, newPath: string) => Promise<boolean>;

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

  // System info
  isElectron: true;
  platform: string;
  systemRamGb: number;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
