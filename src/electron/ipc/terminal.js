const { ipcMain } = require('electron');
const { execSync, spawn } = require('child_process');

const PROCESS_TIMEOUT = 300000; // 5 minutes max per terminal command
const MAX_OUTPUT_SIZE = 5 * 1024 * 1024; // 5MB max output buffer

const activeProcesses = new Map();

function registerTerminalHandlers() {
  ipcMain.handle('terminal:execute', async (event, command, dirPath) => {
    const id = Math.random().toString(36).substring(7);

    try {
      const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';
      const shellArgs = process.platform === 'win32' ? ['-NoProfile', '-Command', command] : ['-c', command];

      const child = spawn(shell, shellArgs, {
        cwd: dirPath || process.cwd(),
        env: { ...process.env, TERM: 'xterm-256color' },
      });

      let outputSize = 0;
      let truncated = false;
      activeProcesses.set(id, child);

      // The window can be closed while a command is still producing output; sending to a
      // destroyed WebContents throws and would take down the handler.
      const send = (channel, payload) => {
        if (!event.sender.isDestroyed()) event.sender.send(channel, payload);
      };

      // Auto-kill after timeout
      const timeout = setTimeout(() => {
        if (activeProcesses.has(id)) {
          killTree(child);
          send(`terminal:data:${id}`, '\r\n[Process timed out after 5 minutes]\r\n');
        }
      }, PROCESS_TIMEOUT);

      const onData = (data) => {
        if (truncated) return;
        outputSize += data.length;
        if (outputSize > MAX_OUTPUT_SIZE) {
          // Latch, or every subsequent chunk repeats the notice and re-kills the process.
          truncated = true;
          killTree(child);
          send(`terminal:data:${id}`, '\r\n[Output limit exceeded — process killed]\r\n');
          return;
        }
        send(`terminal:data:${id}`, data.toString());
      };

      child.stdout.on('data', onData);
      child.stderr.on('data', onData);

      // An EventEmitter 'error' with no listener is rethrown — an unspawnable shell
      // (missing bash, blocked PowerShell) would otherwise crash the entire main process
      // and take the app down with it.
      child.on('error', (err) => {
        clearTimeout(timeout);
        activeProcesses.delete(id);
        send(`terminal:data:${id}`, `\r\n[Could not run command: ${err.message}]\r\n`);
        send(`terminal:exit:${id}`, 1);
      });

      child.on('close', (code) => {
        clearTimeout(timeout);
        send(`terminal:exit:${id}`, code);
        activeProcesses.delete(id);
      });

      return { id };
    } catch (e) {
      return { error: e.message };
    }
  });

  ipcMain.handle('terminal:kill', async (_event, id) => {
    const child = activeProcesses.get(id);
    if (child) {
      killTree(child);
      activeProcesses.delete(id);
      return true;
    }
    return false;
  });
}

/**
 * Kills a spawned shell *and its descendants*.
 *
 * SIGTERM to the shell alone leaves the actual command running — on Windows especially,
 * stopping `npm run dev` would kill cmd/PowerShell but leave node listening on the port.
 */
function killTree(child) {
  if (!child || child.killed || child.exitCode !== null) return;
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /pid ${child.pid} /T /F`, { stdio: 'ignore' });
    } else {
      child.kill('SIGTERM');
    }
  } catch {
    try {
      child.kill();
    } catch {
      // Process already gone.
    }
  }
}

function cleanupProcesses() {
  for (const child of activeProcesses.values()) killTree(child);
  activeProcesses.clear();
}

module.exports = { registerTerminalHandlers, cleanupProcesses };
