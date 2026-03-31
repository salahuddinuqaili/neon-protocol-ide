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

  // Git operations
  getGitBranch: (dirPath) => ipcRenderer.invoke('git:getBranch', dirPath),
  getGitStatus: (dirPath) => ipcRenderer.invoke('git:getStatus', dirPath),

  // System info
  isElectron: true,
  platform: process.platform,
  systemRamGb: Math.round(require('os').totalmem() / (1024 * 1024 * 1024)),
});
