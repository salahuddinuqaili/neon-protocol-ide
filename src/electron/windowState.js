const { app, screen } = require('electron');
const path = require('path');
const fs = require('fs');

const STATE_FILE = () => path.join(app.getPath('userData'), 'window-state.json');

const DEFAULTS = { width: 1440, height: 900 };

/**
 * Remembers window size, position, and maximized state between launches.
 *
 * Restored bounds are validated against the *current* display layout — a window saved on
 * a second monitor that is no longer attached would otherwise be restored off-screen,
 * which looks to the user like the app failed to launch.
 */
function loadWindowState() {
  let saved = {};
  try {
    saved = JSON.parse(fs.readFileSync(STATE_FILE(), 'utf8'));
  } catch {
    // No saved state (first run) or unreadable — fall through to defaults.
  }

  const state = {
    width: Number.isFinite(saved.width) ? saved.width : DEFAULTS.width,
    height: Number.isFinite(saved.height) ? saved.height : DEFAULTS.height,
    x: Number.isFinite(saved.x) ? saved.x : undefined,
    y: Number.isFinite(saved.y) ? saved.y : undefined,
    isMaximized: saved.isMaximized === true,
  };

  if (state.x !== undefined && state.y !== undefined) {
    const visible = screen.getAllDisplays().some((display) => {
      const { x, y, width, height } = display.workArea;
      // Require the title bar to be reachable, not merely any overlap.
      return state.x >= x - 8 && state.y >= y && state.x + 40 <= x + width && state.y + 40 <= y + height;
    });
    if (!visible) {
      state.x = undefined;
      state.y = undefined;
    }
  }

  return state;
}

function trackWindowState(win) {
  const persist = () => {
    try {
      // getNormalBounds() reports the restored (un-maximized) geometry, so a maximized
      // window still remembers a sensible size when the user un-maximizes next launch.
      const bounds = win.getNormalBounds();
      fs.writeFileSync(
        STATE_FILE(),
        JSON.stringify({ ...bounds, isMaximized: win.isMaximized() }, null, 2),
        'utf8'
      );
    } catch {
      // Persisting window geometry must never block quitting.
    }
  };

  let timer = null;
  const debounced = () => {
    clearTimeout(timer);
    timer = setTimeout(persist, 400);
  };

  win.on('resize', debounced);
  win.on('move', debounced);
  win.on('close', () => {
    clearTimeout(timer);
    persist();
  });
}

module.exports = { loadWindowState, trackWindowState };
