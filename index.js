const { app, BrowserWindow, ipcMain, dialog, protocol, net } = require('electron');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const { pathToFileURL } = require('url');
const isDev = !app.isPackaged;

// Register a custom protocol to serve the Next.js static export.
// This is needed because Next.js uses absolute paths like /_next/...
// which don't resolve under the file:// protocol.
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      standard: true,
      secure: true,
      allowServiceWorkers: true,
      supportFetchAPI: true,
    },
  },
]);

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
    icon: path.join(__dirname, 'build', 'icon.png'),
    backgroundColor: '#181A20',
    autoHideMenuBar: true,
  });

  if (isDev) {
    win.loadURL('http://localhost:3001');
  } else {
    // Register the app:// protocol handler to serve files from out/
    const outDir = path.join(__dirname, 'out');

    protocol.handle('app', (request) => {
      const url = new URL(request.url);
      let filePath = path.join(outDir, decodeURIComponent(url.pathname));

      // If path is a directory, serve index.html
      if (filePath.endsWith('/') || filePath.endsWith(path.sep)) {
        filePath = path.join(filePath, 'index.html');
      }

      // If file doesn't exist and has no extension, try .html
      if (!fs.existsSync(filePath) && !path.extname(filePath)) {
        filePath = filePath + '.html';
      }

      // Fallback to index.html for client-side routing
      if (!fs.existsSync(filePath)) {
        filePath = path.join(outDir, 'index.html');
      }

      return net.fetch(pathToFileURL(filePath).toString());
    });

    win.loadURL('app://./index.html');
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
