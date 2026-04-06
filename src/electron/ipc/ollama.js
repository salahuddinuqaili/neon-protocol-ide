const { ipcMain } = require('electron');
const { execFileSync, spawn } = require('child_process');
const https = require('https');
const http = require('http');
const path = require('path');
const os = require('os');
const fs = require('fs');

function registerOllamaHandlers() {
  // Detect if Ollama binary is in PATH
  ipcMain.handle('ollama:checkInstalled', async () => {
    try {
      const cmd = process.platform === 'win32' ? 'where' : 'which';
      execFileSync(cmd, ['ollama'], { timeout: 5000, stdio: 'pipe' });
      return { installed: true };
    } catch {
      return { installed: false };
    }
  });

  // Install Ollama — platform-specific
  ipcMain.handle('ollama:install', async (event) => {
    const sendProgress = (status, detail) => {
      try { event.sender.send('ollama:installProgress', { status, detail }); } catch {}
    };

    try {
      if (process.platform === 'win32') {
        // Windows: download OllamaSetup.exe and run it
        const tmpDir = os.tmpdir();
        const exePath = path.join(tmpDir, 'OllamaSetup.exe');
        sendProgress('downloading', 'Downloading Ollama installer...');

        await new Promise((resolve, reject) => {
          const download = (url) => {
            https.get(url, (res) => {
              // Follow redirects
              if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                download(res.headers.location);
                return;
              }
              if (res.statusCode !== 200) {
                reject(new Error(`Download failed: HTTP ${res.statusCode}`));
                return;
              }
              const file = fs.createWriteStream(exePath);
              res.pipe(file);
              file.on('finish', () => { file.close(); resolve(); });
              file.on('error', reject);
            }).on('error', reject);
          };
          download('https://ollama.com/download/OllamaSetup.exe');
        });

        sendProgress('installing', 'Running installer...');
        const child = spawn(exePath, [], { detached: true, stdio: 'ignore' });
        child.unref();
        sendProgress('launched', 'Installer launched. Follow the prompts to complete setup.');
        return { success: true, message: 'Installer launched' };
      } else {
        // macOS / Linux: curl install script
        sendProgress('installing', 'Running install script...');
        return new Promise((resolve, reject) => {
          const child = spawn('bash', ['-c', 'curl -fsSL https://ollama.com/install.sh | sh'], {
            stdio: ['ignore', 'pipe', 'pipe'],
          });

          let stdout = '';
          let stderr = '';
          child.stdout.on('data', (data) => {
            stdout += data.toString();
            sendProgress('installing', data.toString().trim().slice(-200));
          });
          child.stderr.on('data', (data) => { stderr += data.toString(); });

          child.on('close', (code) => {
            if (code === 0) {
              sendProgress('done', 'Ollama installed successfully');
              resolve({ success: true, message: 'Ollama installed' });
            } else {
              sendProgress('error', stderr.slice(-300) || 'Install script failed');
              reject(new Error(stderr.slice(-300) || `Install failed with code ${code}`));
            }
          });
          child.on('error', (err) => {
            sendProgress('error', err.message);
            reject(err);
          });
        });
      }
    } catch (err) {
      sendProgress('error', err.message);
      throw new Error(err.message || 'Installation failed');
    }
  });

  // List locally available Ollama models via API
  ipcMain.handle('ollama:listModels', async () => {
    try {
      const response = await fetch('http://localhost:11434/api/tags', {
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) return { models: [] };
      const data = await response.json();
      const models = (data.models || []).map((m) => m.name || m.model);
      return { models };
    } catch (err) {
      console.error('[ollama:listModels]', err?.message || err);
      return { models: [] };
    }
  });

  // Pull a model with streaming progress
  ipcMain.handle('ollama:pullModel', async (event, modelName) => {
    const sendProgress = (model, percent, status) => {
      try { event.sender.send('ollama:pullProgress', { model, percent, status }); } catch {}
    };

    return new Promise((resolve, reject) => {
      const postData = JSON.stringify({ name: modelName, stream: true });
      const req = http.request({
        hostname: 'localhost',
        port: 11434,
        path: '/api/pull',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) },
        timeout: 600000, // 10 minutes for large models
      }, (res) => {
        let buffer = '';
        res.on('data', (chunk) => {
          buffer += chunk.toString();
          const lines = buffer.split('\n');
          buffer = lines.pop(); // keep incomplete line in buffer
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const obj = JSON.parse(line);
              if (obj.completed && obj.total) {
                const percent = Math.round((obj.completed / obj.total) * 100);
                sendProgress(modelName, percent, obj.status || 'downloading');
              } else {
                sendProgress(modelName, 0, obj.status || 'pulling');
              }
            } catch {}
          }
        });
        res.on('end', () => {
          sendProgress(modelName, 100, 'done');
          resolve({ success: true });
        });
      });
      req.on('error', (err) => reject(new Error(`Pull failed: ${err.message}`)));
      req.on('timeout', () => { req.destroy(); reject(new Error('Pull timed out')); });
      req.write(postData);
      req.end();
    });
  });
}

module.exports = { registerOllamaHandlers };
