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

ipcMain.handle('git:isRepo', async (_event, dirPath) => {
  try {
    execSync('git rev-parse --git-dir', { cwd: dirPath, encoding: 'utf-8', timeout: 2000 });
    return true;
  } catch { return false; }
});

ipcMain.handle('git:statusFiles', async (_event, dirPath) => {
  try {
    const raw = execSync('git status --porcelain', { cwd: dirPath, encoding: 'utf-8', timeout: 5000 }).trim();
    if (!raw) return [];
    return raw.split('\n').filter(Boolean).map(line => {
      const indexStatus = line[0];
      const workTreeStatus = line[1];
      const relativePath = line.slice(3).trim();
      const actualPath = relativePath.includes(' -> ') ? relativePath.split(' -> ')[1] : relativePath;
      return {
        path: actualPath.replace(/\\/g, '/'),
        indexStatus,
        workTreeStatus,
        isStaged: indexStatus !== ' ' && indexStatus !== '?',
      };
    });
  } catch { return null; }
});

ipcMain.handle('git:stage', async (_event, dirPath, filePaths) => {
  try {
    const files = Array.isArray(filePaths) ? filePaths : [filePaths];
    execSync(`git add -- ${files.map(f => `"${f}"`).join(' ')}`, { cwd: dirPath, encoding: 'utf-8', timeout: 5000 });
    return { success: true };
  } catch (e) { return { success: false, error: e.message }; }
});

ipcMain.handle('git:unstage', async (_event, dirPath, filePaths) => {
  try {
    const files = Array.isArray(filePaths) ? filePaths : [filePaths];
    execSync(`git reset HEAD -- ${files.map(f => `"${f}"`).join(' ')}`, { cwd: dirPath, encoding: 'utf-8', timeout: 5000 });
    return { success: true };
  } catch (e) { return { success: false, error: e.message }; }
});

ipcMain.handle('git:commit', async (_event, dirPath, message) => {
  try {
    execSync('git commit -F -', { cwd: dirPath, encoding: 'utf-8', timeout: 10000, input: message });
    return { success: true };
  } catch (e) { return { success: false, error: e.message }; }
});

ipcMain.handle('git:diff', async (_event, dirPath, filePath, staged) => {
  try {
    const cmd = staged ? `git diff --cached -- "${filePath}"` : `git diff -- "${filePath}"`;
    return execSync(cmd, { cwd: dirPath, encoding: 'utf-8', timeout: 5000 });
  } catch { return null; }
});

ipcMain.handle('git:fileContent', async (_event, dirPath, filePath) => {
  try {
    return execSync(`git show HEAD:"${filePath}"`, { cwd: dirPath, encoding: 'utf-8', timeout: 5000 });
  } catch { return null; }
});

ipcMain.handle('git:push', async (_event, dirPath) => {
  try {
    execSync('git push', { cwd: dirPath, encoding: 'utf-8', timeout: 30000 });
    return { success: true };
  } catch (e) { return { success: false, error: e.message }; }
});

ipcMain.handle('git:pull', async (_event, dirPath) => {
  try {
    execSync('git pull', { cwd: dirPath, encoding: 'utf-8', timeout: 30000 });
    return { success: true };
  } catch (e) { return { success: false, error: e.message }; }
});

ipcMain.handle('git:branchList', async (_event, dirPath) => {
  try {
    const raw = execSync('git branch -a --no-color', { cwd: dirPath, encoding: 'utf-8', timeout: 5000 }).trim();
    if (!raw) return [];
    return raw.split('\n').filter(Boolean).map(line => {
      const isCurrent = line.startsWith('* ');
      const name = line.replace(/^\*?\s+/, '').trim();
      const isRemote = name.startsWith('remotes/');
      return { name: isRemote ? name.replace('remotes/', '') : name, isCurrent, isRemote };
    });
  } catch { return []; }
});

ipcMain.handle('git:checkout', async (_event, dirPath, branch) => {
  try {
    execSync(`git checkout "${branch}"`, { cwd: dirPath, encoding: 'utf-8', timeout: 10000 });
    return { success: true };
  } catch (e) { return { success: false, error: e.message }; }
});

ipcMain.handle('git:createBranch', async (_event, dirPath, name) => {
  try {
    execSync(`git checkout -b "${name}"`, { cwd: dirPath, encoding: 'utf-8', timeout: 5000 });
    return { success: true };
  } catch (e) { return { success: false, error: e.message }; }
});

ipcMain.handle('git:remoteStatus', async (_event, dirPath) => {
  try {
    const raw = execSync('git rev-list --left-right --count HEAD...@{upstream}', { cwd: dirPath, encoding: 'utf-8', timeout: 5000 }).trim();
    const parts = raw.split(/\s+/).map(Number);
    return { ahead: parts[0] || 0, behind: parts[1] || 0 };
  } catch { return { ahead: 0, behind: 0 }; }
});

ipcMain.handle('git:log', async (_event, dirPath, count) => {
  try {
    const n = count || 30;
    const raw = execSync(`git log --oneline --no-decorate -n ${n}`, { cwd: dirPath, encoding: 'utf-8', timeout: 5000 }).trim();
    if (!raw) return [];
    return raw.split('\n').filter(Boolean).map(line => {
      const spaceIdx = line.indexOf(' ');
      return { hash: line.slice(0, spaceIdx), message: line.slice(spaceIdx + 1) };
    });
  } catch { return []; }
});

ipcMain.handle('git:stash', async (_event, dirPath) => {
  try {
    execSync('git stash', { cwd: dirPath, encoding: 'utf-8', timeout: 10000 });
    return { success: true };
  } catch (e) { return { success: false, error: e.message }; }
});

ipcMain.handle('git:stashPop', async (_event, dirPath) => {
  try {
    execSync('git stash pop', { cwd: dirPath, encoding: 'utf-8', timeout: 10000 });
    return { success: true };
  } catch (e) { return { success: false, error: e.message }; }
});

ipcMain.handle('git:stashList', async (_event, dirPath) => {
  try {
    const raw = execSync('git stash list --oneline', { cwd: dirPath, encoding: 'utf-8', timeout: 5000 }).trim();
    if (!raw) return [];
    return raw.split('\n').filter(Boolean);
  } catch { return []; }
});

// --- LLM Chat Proxy (keeps API keys out of renderer) ---

ipcMain.handle('llm:chat', async (_event, config, messages) => {
  const { type, baseUrl, apiKey, model, name, id } = config;

  const estimateTokens = (text) => Math.ceil(text.length / 4);

  try {
    if (type === 'ollama') {
      const response = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages, stream: false }),
        signal: AbortSignal.timeout(60000),
      });
      if (!response.ok) throw new Error(`${name}: ${response.status} ${response.statusText}`);
      const data = await response.json();
      const content = data.message?.content || '';
      return {
        content,
        provider: name,
        providerId: id,
        model,
        tokensUsed: (data.prompt_eval_count || 0) + (data.eval_count || 0) || estimateTokens(content + messages.map(m => m.content).join('')),
      };
    }

    if (type === 'anthropic') {
      const systemMsg = messages.find(m => m.role === 'system');
      const chatMessages = messages.filter(m => m.role !== 'system');
      const response = await fetch(`${baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey || '',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: 1024,
          ...(systemMsg ? { system: systemMsg.content } : {}),
          messages: chatMessages.map(m => ({ role: m.role, content: m.content })),
        }),
        signal: AbortSignal.timeout(30000),
      });
      if (!response.ok) throw new Error(`${name}: ${response.status} ${response.statusText}`);
      const data = await response.json();
      const text = data.content?.[0]?.text || '';
      return {
        content: text,
        provider: name,
        providerId: id,
        model,
        tokensUsed: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0) || estimateTokens(text + messages.map(m => m.content).join('')),
      };
    }

    // OpenAI / OpenAI-compatible (default)
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify({ model, messages }),
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) throw new Error(`${name}: ${response.status} ${response.statusText}`);
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    return {
      content,
      provider: name,
      providerId: id,
      model,
      tokensUsed: data.usage?.total_tokens || estimateTokens(content + messages.map(m => m.content).join('')),
    };
  } catch (err) {
    throw new Error(err.message || String(err));
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
