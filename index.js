const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { execSync } = require('child_process');
const isDev = !app.isPackaged;

// MIME types for serving static files
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json',
  '.txt': 'text/plain',
};

/**
 * Start a local HTTP server to serve the Next.js static export.
 * This is needed because Next.js uses absolute paths like /_next/...
 * which don't resolve under the file:// protocol.
 * A local HTTP server makes everything work exactly like in dev mode.
 */
function startStaticServer(outDir) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let urlPath = decodeURIComponent(req.url.split('?')[0]);

      // Map URL to file path
      let filePath = path.join(outDir, urlPath);

      // Directory -> index.html
      if (urlPath === '/' || urlPath === '') {
        filePath = path.join(outDir, 'index.html');
      }

      // Try the exact path, then .html, then fallback to index.html
      if (!fs.existsSync(filePath) && !path.extname(filePath)) {
        const withHtml = filePath + '.html';
        if (fs.existsSync(withHtml)) {
          filePath = withHtml;
        } else {
          filePath = path.join(outDir, 'index.html');
        }
      }

      if (!fs.existsSync(filePath)) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }

      const ext = path.extname(filePath);
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      try {
        const content = fs.readFileSync(filePath);
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      } catch {
        res.writeHead(500);
        res.end('Server error');
      }
    });

    // Listen on a random available port
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      console.log(`Static server running at http://127.0.0.1:${port}`);
      resolve(port);
    });
  });
}

async function createWindow() {
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
    // Serve the Next.js static export via a local HTTP server.
    // This ensures /_next/... paths resolve correctly on all platforms.
    const outDir = path.join(__dirname, 'out');
    const port = await startStaticServer(outDir);
    win.loadURL(`http://127.0.0.1:${port}`);
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

app.whenReady().then(async () => {
  await createWindow();

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) await createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
