const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const isDev = !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'src', 'electron', 'preload.js'),
    },
    title: 'Neon Protocol IDE',
    backgroundColor: '#181A20',
  });

  if (isDev) {
    // When in development, load from the Next.js dev server
    win.loadURL('http://localhost:3001');
    // win.webContents.openDevTools(); // Uncomment to see dev tools
  } else {
    // When packaged, load the static HTML from the build folder
    win.loadFile(path.join(__dirname, 'out/index.html'));
  }
}

// --- IPC Handlers for native file system operations ---

ipcMain.handle('fs:openDirectory', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
});

ipcMain.handle('fs:readDirectory', async (_event, dirPath) => {
  try {
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
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
});

ipcMain.handle('fs:writeFile', async (_event, filePath, content) => {
  try {
    fs.writeFileSync(filePath, content, 'utf-8');
    return true;
  } catch {
    return false;
  }
});

ipcMain.handle('fs:deleteFile', async (_event, filePath) => {
  try {
    fs.unlinkSync(filePath);
    return true;
  } catch {
    return false;
  }
});

ipcMain.handle('fs:renameFile', async (_event, oldPath, newPath) => {
  try {
    fs.renameSync(oldPath, newPath);
    return true;
  } catch {
    return false;
  }
});

ipcMain.handle('git:getBranch', async (_event, dirPath) => {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', {
      cwd: dirPath,
      encoding: 'utf-8',
      timeout: 3000,
    }).trim();
    return branch;
  } catch {
    return null;
  }
});

ipcMain.handle('git:getStatus', async (_event, dirPath) => {
  try {
    const status = execSync('git status --porcelain', {
      cwd: dirPath,
      encoding: 'utf-8',
      timeout: 5000,
    }).trim();
    return status.split('\n').filter(Boolean).length;
  } catch {
    return null;
  }
});

// --- App lifecycle ---

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
