const { ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

/**
 * Track the currently opened project directory.
 * All file operations are restricted to this directory.
 */
let activeProjectPath = null;

function getActiveProjectPath() {
  return activeProjectPath;
}

function isPathWithinRoot(filePath, rootPath) {
  if (!rootPath) return false;
  const resolved = path.resolve(filePath);
  const root = path.resolve(rootPath);
  return resolved === root || resolved.startsWith(root + path.sep);
}

function validateFilePath(filePath) {
  if (!activeProjectPath) return true;
  if (isPathWithinRoot(filePath, activeProjectPath)) return true;
  console.warn(`[IPC Security] Blocked path outside project: ${filePath}`);
  return false;
}

function registerFsHandlers() {
  ipcMain.handle('fs:openDirectory', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
  });

  ipcMain.handle('fs:readDirectory', async (_event, dirPath) => {
    try {
      if (!validateFilePath(dirPath)) return [];
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      return entries.map(e => ({
        name: e.name,
        isFile: e.isFile(),
        isDirectory: e.isDirectory(),
      }));
    } catch {
      return [];
    }
  });

  ipcMain.handle('fs:readFile', async (_event, filePath) => {
    try {
      if (!validateFilePath(filePath)) return null;
      return fs.readFileSync(filePath, 'utf-8');
    } catch {
      return null;
    }
  });

  ipcMain.handle('fs:writeFile', async (_event, filePath, content) => {
    try {
      if (!validateFilePath(filePath)) return false;
      fs.writeFileSync(filePath, content, 'utf-8');
      return true;
    } catch {
      return false;
    }
  });

  ipcMain.handle('fs:deleteFile', async (_event, filePath) => {
    try {
      if (!validateFilePath(filePath)) return false;
      fs.unlinkSync(filePath);
      return true;
    } catch {
      return false;
    }
  });

  ipcMain.handle('fs:renameFile', async (_event, oldPath, newPath) => {
    try {
      if (!validateFilePath(oldPath) || !validateFilePath(newPath)) return false;
      fs.renameSync(oldPath, newPath);
      return true;
    } catch {
      return false;
    }
  });

  ipcMain.handle('fs:scanProject', async (_event, dirPath) => {
    const MAX_FILE_SIZE = 1024 * 1024;
    const IGNORE = ['node_modules', '.git', 'package-lock.json', '.next', 'dist', 'out'];
    const EXTENSIONS = /\.(js|ts|tsx|jsx|json|md|css|html|txt|py|rb|go|rs|c|cpp|java|yaml|yml|toml|sh|bat|sql|graphql|proto|xml|svg)$/i;

    const results = [];

    function scan(currentDir, relativePath) {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        if (IGNORE.includes(entry.name) || entry.name.startsWith('.')) continue;

        const fullPath = path.join(currentDir, entry.name);
        const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;

        if (entry.isFile()) {
          if (EXTENSIONS.test(entry.name)) {
            try {
              const stats = fs.statSync(fullPath);
              if (stats.size <= MAX_FILE_SIZE) {
                const content = fs.readFileSync(fullPath, 'utf-8');
                results.push({
                  name: entry.name,
                  path: fullPath.replace(/\\/g, '/'),
                  content,
                });
              }
            } catch (e) {
              console.warn(`Failed to read ${fullPath}:`, e.message);
            }
          }
        } else if (entry.isDirectory()) {
          scan(fullPath, relPath);
        }
      }
    }

    try {
      activeProjectPath = dirPath;
      const dirName = path.basename(dirPath);
      scan(dirPath, dirName);
      return results;
    } catch (e) {
      console.error('Scan failed:', e);
      return [];
    }
  });
}

module.exports = { registerFsHandlers, getActiveProjectPath };
