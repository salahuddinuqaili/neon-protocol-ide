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
      activeProcesses.set(id, child);

      // Auto-kill after timeout
      const timeout = setTimeout(() => {
        if (activeProcesses.has(id)) {
          child.kill('SIGTERM');
          event.sender.send(`terminal:data:${id}`, '\r\n[Process timed out after 5 minutes]\r\n');
        }
      }, PROCESS_TIMEOUT);

      child.stdout.on('data', (data) => {
        outputSize += data.length;
        if (outputSize > MAX_OUTPUT_SIZE) {
          child.kill('SIGTERM');
          event.sender.send(`terminal:data:${id}`, '\r\n[Output limit exceeded — process killed]\r\n');
          return;
        }
        event.sender.send(`terminal:data:${id}`, data.toString());
      });

      child.stderr.on('data', (data) => {
        outputSize += data.length;
        if (outputSize > MAX_OUTPUT_SIZE) {
          child.kill('SIGTERM');
          event.sender.send(`terminal:data:${id}`, '\r\n[Output limit exceeded — process killed]\r\n');
          return;
        }
        event.sender.send(`terminal:data:${id}`, data.toString());
      });

      child.on('close', (code) => {
        clearTimeout(timeout);
        event.sender.send(`terminal:exit:${id}`, code);
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
      child.kill();
      activeProcesses.delete(id);
      return true;
    }
    return false;
  });
}

function cleanupProcesses() {
  for (const child of activeProcesses.values()) {
    try {
      if (process.platform === 'win32') {
        execSync(`taskkill /pid ${child.pid} /T /F`);
      } else {
        child.kill('SIGTERM');
      }
    } catch {
      child.kill();
    }
  }
  activeProcesses.clear();
}

module.exports = { registerTerminalHandlers, cleanupProcesses };
