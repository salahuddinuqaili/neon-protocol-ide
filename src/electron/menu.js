const { Menu, app, shell, dialog } = require('electron');

/**
 * Builds the application menu.
 *
 * This is not cosmetic. On macOS the standard editing shortcuts (Cmd+C/V/X/A/Z) are
 * provided *by the menu roles* — with no menu installed, copy and paste simply do not
 * work anywhere in the app, and there is no Cmd+Q. The app previously shipped with
 * `autoHideMenuBar` and no menu at all, which left the macOS build badly broken.
 *
 * Menu items that map to renderer features send a `menu:action` event; the renderer
 * listens via `electronAPI.onMenuAction` and dispatches to the matching handler.
 */
function buildMenu(getWindow) {
  const isMac = process.platform === 'darwin';

  const send = (action) => () => {
    const win = getWindow();
    if (win && !win.isDestroyed()) win.webContents.send('menu:action', action);
  };

  const template = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' },
              { type: 'separator' },
              { label: 'Settings…', accelerator: 'Cmd+,', click: send('open-settings') },
              { type: 'separator' },
              { role: 'services' },
              { type: 'separator' },
              { role: 'hide' },
              { role: 'hideOthers' },
              { role: 'unhide' },
              { type: 'separator' },
              { role: 'quit' },
            ],
          },
        ]
      : []),
    {
      label: '&File',
      submenu: [
        { label: 'Open Folder…', accelerator: 'CmdOrCtrl+O', click: send('open-folder') },
        { type: 'separator' },
        { label: 'Save', accelerator: 'CmdOrCtrl+S', click: send('save-file') },
        { label: 'Save All', accelerator: 'CmdOrCtrl+Alt+S', click: send('save-all') },
        { type: 'separator' },
        ...(isMac
          ? [{ role: 'close' }]
          : [
              { label: 'Settings…', accelerator: 'Ctrl+,', click: send('open-settings') },
              { type: 'separator' },
              { role: 'quit' },
            ]),
      ],
    },
    {
      // Every item here is a role — these are what make copy/paste work on macOS.
      label: '&Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        ...(isMac ? [{ role: 'pasteAndMatchStyle' }] : []),
        { role: 'delete' },
        { role: 'selectAll' },
        { type: 'separator' },
        { label: 'Find in Files…', accelerator: 'CmdOrCtrl+Shift+F', click: send('global-search') },
        { label: 'Go to File…', accelerator: 'CmdOrCtrl+P', click: send('quick-open') },
      ],
    },
    {
      label: '&View',
      submenu: [
        { label: 'Architecture Map', accelerator: 'CmdOrCtrl+1', click: send('view-blueprint') },
        { label: 'Code Editor', accelerator: 'CmdOrCtrl+2', click: send('view-code') },
        { label: 'AI Providers', accelerator: 'CmdOrCtrl+3', click: send('view-orchestrator') },
        { label: 'Terminal', accelerator: 'CmdOrCtrl+4', click: send('view-terminal') },
        { type: 'separator' },
        { label: 'Toggle Sidebar', accelerator: 'CmdOrCtrl+B', click: send('toggle-sidebar') },
        { label: 'Learning Path', accelerator: 'CmdOrCtrl+L', click: send('toggle-learning') },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        { role: 'reload' },
        { role: 'toggleDevTools' },
      ],
    },
    {
      label: '&Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac ? [{ type: 'separator' }, { role: 'front' }] : [{ role: 'close' }]),
      ],
    },
    {
      label: '&Help',
      submenu: [
        { label: 'Getting Started', click: send('open-tutorial') },
        { label: 'Glossary', click: send('open-glossary') },
        { type: 'separator' },
        {
          label: 'Report an Issue',
          click: () => shell.openExternal('https://github.com/salahuddinuqaili/neon-protocol-ide/issues'),
        },
        {
          label: 'View Source on GitHub',
          click: () => shell.openExternal('https://github.com/salahuddinuqaili/neon-protocol-ide'),
        },
        ...(isMac
          ? []
          : [
              { type: 'separator' },
              {
                label: `About ${app.name}`,
                click: () => {
                  dialog.showMessageBox({
                    type: 'info',
                    title: `About ${app.name}`,
                    message: app.name,
                    detail: `Version ${app.getVersion()}\nElectron ${process.versions.electron}\nChromium ${process.versions.chrome}`,
                    buttons: ['OK'],
                  });
                },
              },
            ]),
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

module.exports = { buildMenu };
