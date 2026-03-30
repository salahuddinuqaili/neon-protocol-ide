const { app, BrowserWindow } = require('electron');
const path = require('path');
const isDev = !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
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

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
