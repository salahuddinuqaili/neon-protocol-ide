const { contextBridge, ipcRenderer } = require('electron');

// Expose a safe, controlled API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // File system operations
  openDirectory: () => ipcRenderer.invoke('fs:openDirectory'),
  readDirectory: (dirPath) => ipcRenderer.invoke('fs:readDirectory', dirPath),
  readFile: (filePath) => ipcRenderer.invoke('fs:readFile', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('fs:writeFile', filePath, content),
  deleteFile: (filePath) => ipcRenderer.invoke('fs:deleteFile', filePath),
  renameFile: (oldPath, newPath) => ipcRenderer.invoke('fs:renameFile', oldPath, newPath),

  // Git operations — core
  getGitBranch: (dirPath) => ipcRenderer.invoke('git:getBranch', dirPath),
  getGitStatus: (dirPath) => ipcRenderer.invoke('git:getStatus', dirPath),
  isGitRepo: (dirPath) => ipcRenderer.invoke('git:isRepo', dirPath),
  getGitStatusFiles: (dirPath) => ipcRenderer.invoke('git:statusFiles', dirPath),
  gitStage: (dirPath, filePaths) => ipcRenderer.invoke('git:stage', dirPath, filePaths),
  gitUnstage: (dirPath, filePaths) => ipcRenderer.invoke('git:unstage', dirPath, filePaths),
  gitCommit: (dirPath, message) => ipcRenderer.invoke('git:commit', dirPath, message),
  gitDiff: (dirPath, filePath, staged) => ipcRenderer.invoke('git:diff', dirPath, filePath, staged),
  gitFileContent: (dirPath, filePath) => ipcRenderer.invoke('git:fileContent', dirPath, filePath),
  gitPush: (dirPath) => ipcRenderer.invoke('git:push', dirPath),
  gitPull: (dirPath) => ipcRenderer.invoke('git:pull', dirPath),

  // Git operations — branch management
  gitBranchList: (dirPath) => ipcRenderer.invoke('git:branchList', dirPath),
  gitCheckout: (dirPath, branch) => ipcRenderer.invoke('git:checkout', dirPath, branch),
  gitCreateBranch: (dirPath, name) => ipcRenderer.invoke('git:createBranch', dirPath, name),
  gitRemoteStatus: (dirPath) => ipcRenderer.invoke('git:remoteStatus', dirPath),

  // Git operations — advanced
  gitLog: (dirPath, count) => ipcRenderer.invoke('git:log', dirPath, count),
  gitStash: (dirPath) => ipcRenderer.invoke('git:stash', dirPath),
  gitStashPop: (dirPath) => ipcRenderer.invoke('git:stashPop', dirPath),
  gitStashList: (dirPath) => ipcRenderer.invoke('git:stashList', dirPath),

  // LLM chat proxy (API keys stay in main process)
  llmChat: (config, messages) => ipcRenderer.invoke('llm:chat', config, messages),

  // System info
  isElectron: true,
  platform: process.platform,
  systemRamGb: Math.round(require('os').totalmem() / (1024 * 1024 * 1024)),
});
