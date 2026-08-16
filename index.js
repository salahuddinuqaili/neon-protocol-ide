const { app, BrowserWindow, shell, dialog, ipcMain } = require('electron');
const path = require('path');
const isDev = !app.isPackaged;

const { startStaticServer } = require('./src/electron/server');
const { buildMenu } = require('./src/electron/menu');
const { loadWindowState, trackWindowState } = require('./src/electron/windowState');
const { registerFsHandlers } = require('./src/electron/ipc/fs');
const { registerGitHandlers } = require('./src/electron/ipc/git');
const { registerTerminalHandlers, cleanupProcesses } = require('./src/electron/ipc/terminal');
const { registerLlmHandlers } = require('./src/electron/ipc/llm');
const { registerOllamaHandlers } = require('./src/electron/ipc/ollama');
const { registerSystemHandlers } = require('./src/electron/ipc/system');

let mainWindow = null;

// Only one copy of the IDE may run at a time. Two instances would race over the same
// persisted state and terminal processes; the second launch focuses the first instead.
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
  start();
}

function start() {
  // Groups the taskbar icon correctly and makes notifications attributable on Windows.
  if (process.platform === 'win32') app.setAppUserModelId('com.neonprotocol.ide');

  registerFsHandlers();
  registerGitHandlers();
  registerTerminalHandlers();
  registerLlmHandlers();
  registerOllamaHandlers();
  registerSystemHandlers();

  // Lets the renderer hand a URL to the user's real browser. Without this, links in the
  // UI (Ollama download, docs) either did nothing or opened a chrome-less Electron window
  // the user could not navigate back out of.
  ipcMain.handle('system:openExternal', async (_event, url) => {
    if (typeof url !== 'string') return { ok: false, error: 'Invalid URL' };
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      return { ok: false, error: 'Invalid URL' };
    }
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return { ok: false, error: 'Only http and https links can be opened' };
    }
    await shell.openExternal(parsed.toString());
    return { ok: true };
  });

  app.whenReady().then(async () => {
    buildMenu(() => mainWindow);
    await createWindow();

    app.on('activate', async () => {
      if (BrowserWindow.getAllWindows().length === 0) await createWindow();
    });
  });
}

async function createWindow() {
  const state = loadWindowState();

  const win = new BrowserWindow({
    width: state.width,
    height: state.height,
    x: state.x,
    y: state.y,
    // Below this the three-pane layout collapses into an unusable sliver.
    minWidth: 940,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'src', 'electron', 'preload.js'),
      spellcheck: false,
    },
    title: 'Neon Protocol IDE',
    icon: path.join(__dirname, 'build', 'icon.png'),
    backgroundColor: '#0B0C10',
    // Painting only once the UI is ready avoids the white flash the app opened with.
    show: false,
  });

  mainWindow = win;
  if (state.isMaximized) win.maximize();
  trackWindowState(win);

  win.once('ready-to-show', () => win.show());
  win.on('closed', () => {
    if (mainWindow === win) mainWindow = null;
  });

  // External links go to the user's browser; nothing opens a second Electron window.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://') || url.startsWith('http://')) shell.openExternal(url);
    return { action: 'deny' };
  });

  // The renderer is a single-page app — any attempt to navigate away from its own origin
  // is either an accident or untrusted content, and would strand the user on a dead page.
  win.webContents.on('will-navigate', (event, url) => {
    if (new URL(url).origin !== new URL(win.webContents.getURL()).origin) {
      event.preventDefault();
      if (url.startsWith('https://') || url.startsWith('http://')) shell.openExternal(url);
    }
  });

  // A failed load previously left a permanently blank window with no explanation.
  win.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    if (errorCode === -3) return; // user-initiated abort
    dialog.showErrorBox(
      'Neon Protocol IDE failed to start',
      `The interface could not be loaded.\n\n${errorDescription} (${errorCode})\n${validatedURL}\n\n` +
        'Reinstalling the app usually resolves this.'
    );
  });

  win.webContents.on('render-process-gone', (_event, details) => {
    dialog.showErrorBox(
      'Neon Protocol IDE stopped responding',
      `The interface process ended unexpectedly (${details.reason}).\n\nRestart the app to continue.`
    );
  });

  try {
    if (isDev) {
      await win.loadURL('http://localhost:3001');
    } else {
      const port = await startStaticServer(path.join(process.resourcesPath, 'out'));
      await win.loadURL(`http://127.0.0.1:${port}`);
    }
  } catch (err) {
    dialog.showErrorBox(
      'Neon Protocol IDE failed to start',
      `${err && err.message ? err.message : String(err)}\n\nReinstalling the app usually resolves this.`
    );
    app.quit();
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Terminal children are spawned detached from the renderer's lifetime, so they must be
// reaped explicitly or they outlive the app as orphaned processes.
app.on('before-quit', () => {
  try {
    cleanupProcesses();
  } catch {
    // Never block quit on cleanup.
  }
});
