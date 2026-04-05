const { app, BrowserWindow } = require('electron');
const path = require('path');
const isDev = !app.isPackaged;

const { startStaticServer } = require('./src/electron/server');
const { registerFsHandlers } = require('./src/electron/ipc/fs');
const { registerGitHandlers } = require('./src/electron/ipc/git');
const { registerTerminalHandlers, cleanupProcesses } = require('./src/electron/ipc/terminal');
const { registerLlmHandlers } = require('./src/electron/ipc/llm');

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
    const outDir = path.join(__dirname, 'out');
    const port = await startStaticServer(outDir);
    win.loadURL(`http://127.0.0.1:${port}`);
  }
}

// Register all IPC handlers
registerFsHandlers();
registerGitHandlers();
registerTerminalHandlers();
registerLlmHandlers();

// App lifecycle
app.whenReady().then(async () => {
  await createWindow();

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) await createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
