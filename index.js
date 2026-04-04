const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { execSync, execFile, spawn } = require('child_process');
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

      // Path traversal check - ensure we don't serve files outside outDir
      const relative = path.relative(outDir, filePath);
      if (relative.startsWith('..') || path.isAbsolute(relative)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }

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

// --- IPC path validation ---

/**
 * Track the currently opened project directory.
 * All file operations are restricted to this directory.
 */
let activeProjectPath = null;

/**
 * Validates that a file path is within the given root directory.
 * Prevents path traversal attacks from the renderer.
 */
function isPathWithinRoot(filePath, rootPath) {
  if (!rootPath) return false;
  const resolved = path.resolve(filePath);
  const root = path.resolve(rootPath);
  return resolved === root || resolved.startsWith(root + path.sep);
}

/**
 * Validates a file path against the active project. Returns true if allowed.
 * Returns false and logs a warning if the path escapes the project root.
 */
function validateFilePath(filePath) {
  if (!activeProjectPath) return true; // No project open yet — allow (for initial open)
  if (isPathWithinRoot(filePath, activeProjectPath)) return true;
  console.warn(`[IPC Security] Blocked path outside project: ${filePath}`);
  return false;
}

// --- IPC Handlers for native file system operations ---

/**
 * Safer alternative to execSync for simple git commands.
 * Uses execFile to avoid shell injection.
 */
function gitExec(args, dirPath, timeout = 5000) {
  return new Promise((resolve, reject) => {
    execFile('git', args, { cwd: dirPath, encoding: 'utf-8', timeout }, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(stdout);
    });
  });
}

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
    if (!validateFilePath(filePath)) return null;
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
});

ipcMain.handle('fs:writeFile', async (_event, filePath, content) => {
  try {
    if (!validateFilePath(filePath)) return false;
    fs.writeFileSync(filePath, content, 'utf-8');
    return true;
  } catch {
    return false;
  }
});

ipcMain.handle('fs:deleteFile', async (_event, filePath) => {
  try {
    if (!validateFilePath(filePath)) return false;
    fs.unlinkSync(filePath);
    return true;
  } catch {
    return false;
  }
});

ipcMain.handle('fs:renameFile', async (_event, oldPath, newPath) => {
  try {
    if (!validateFilePath(oldPath) || !validateFilePath(newPath)) return false;
    fs.renameSync(oldPath, newPath);
    return true;
  } catch {
    return false;
  }
});

ipcMain.handle('fs:scanProject', async (_event, dirPath) => {
  const MAX_FILE_SIZE = 1024 * 1024; // 1MB
  const IGNORE = ['node_modules', '.git', 'package-lock.json', '.next', 'dist', 'out'];
  const EXTENSIONS = /\.(js|ts|tsx|jsx|json|md|css|html|txt|py|rb|go|rs|c|cpp|java|yaml|yml|toml|sh|bat|sql|graphql|proto|xml|svg)$/i;

  const results = [];
  
  function scan(currentDir, relativePath) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (IGNORE.includes(entry.name) || entry.name.startsWith('.')) continue;
      
      const fullPath = path.join(currentDir, entry.name);
      const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
      
      if (entry.isFile()) {
        if (EXTENSIONS.test(entry.name)) {
          try {
            const stats = fs.statSync(fullPath);
            if (stats.size <= MAX_FILE_SIZE) {
              const content = fs.readFileSync(fullPath, 'utf-8');
              results.push({
                name: entry.name,
                path: fullPath.replace(/\\/g, '/'),
                content,
                // Language mapping will be handled by the frontend config
              });
            }
          } catch (e) {
            console.warn(`Failed to read ${fullPath}:`, e.message);
          }
        }
      } else if (entry.isDirectory()) {
        scan(fullPath, relPath);
      }
    }
  }

  try {
    activeProjectPath = dirPath;
    const dirName = path.basename(dirPath);
    scan(dirPath, dirName);
    return results;
  } catch (e) {
    console.error('Scan failed:', e);
    return [];
  }
});

ipcMain.handle('git:getBranch', async (_event, dirPath) => {
  try {
    const branch = await gitExec(['rev-parse', '--abbrev-ref', 'HEAD'], dirPath, 3000);
    return branch.trim();
  } catch {
    return null;
  }
});

ipcMain.handle('git:getStatus', async (_event, dirPath) => {
  try {
    const status = await gitExec(['status', '--porcelain'], dirPath, 5000);
    return status.trim().split('\n').filter(Boolean).length;
  } catch {
    return null;
  }
});

ipcMain.handle('git:isRepo', async (_event, dirPath) => {
  try {
    await gitExec(['rev-parse', '--git-dir'], dirPath, 2000);
    return true;
  } catch { return false; }
});

ipcMain.handle('git:statusFiles', async (_event, dirPath) => {
  try {
    const raw = await gitExec(['status', '--porcelain'], dirPath, 5000);
    const trimmed = raw.trim();
    if (!trimmed) return [];
    return trimmed.split('\n').filter(Boolean).map(line => {
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
    await gitExec(['add', '--', ...files], dirPath, 5000);
    return { success: true };
  } catch (e) { return { success: false, error: e.message }; }
});

ipcMain.handle('git:unstage', async (_event, dirPath, filePaths) => {
  try {
    const files = Array.isArray(filePaths) ? filePaths : [filePaths];
    await gitExec(['reset', 'HEAD', '--', ...files], dirPath, 5000);
    return { success: true };
  } catch (e) { return { success: false, error: e.message }; }
});

ipcMain.handle('git:commit', async (_event, dirPath, message) => {
  try {
    // Using spawn for commit with message via stdin to handle large messages and special characters safely
    return new Promise((resolve) => {
      const child = spawn('git', ['commit', '-F', '-'], { cwd: dirPath });
      child.stdin.write(message);
      child.stdin.end();

      let stderr = '';
      child.stderr.on('data', (data) => { stderr += data; });

      child.on('close', (code) => {
        if (code === 0) resolve({ success: true });
        else resolve({ success: false, error: stderr || `Exit code ${code}` });
      });
    });
  } catch (e) { return { success: false, error: e.message }; }
});

ipcMain.handle('git:diff', async (_event, dirPath, filePath, staged) => {
  try {
    const args = staged ? ['diff', '--cached', '--', filePath] : ['diff', '--', filePath];
    return await gitExec(args, dirPath, 5000);
  } catch { return null; }
});

ipcMain.handle('git:fileContent', async (_event, dirPath, filePath) => {
  try {
    return await gitExec(['show', `HEAD:${filePath}`], dirPath, 5000);
  } catch { return null; }
});

ipcMain.handle('git:push', async (_event, dirPath) => {
  try {
    await gitExec(['push'], dirPath, 30000);
    return { success: true };
  } catch (e) { return { success: false, error: e.message }; }
});

ipcMain.handle('git:pull', async (_event, dirPath) => {
  try {
    await gitExec(['pull'], dirPath, 30000);
    return { success: true };
  } catch (e) { return { success: false, error: e.message }; }
});

ipcMain.handle('git:branchList', async (_event, dirPath) => {
  try {
    const raw = await gitExec(['branch', '-a', '--no-color'], dirPath, 5000);
    const trimmed = raw.trim();
    if (!trimmed) return [];
    return trimmed.split('\n').filter(Boolean).map(line => {
      const isCurrent = line.startsWith('* ');
      const name = line.replace(/^\*?\s+/, '').trim();
      const isRemote = name.startsWith('remotes/');
      return { name: isRemote ? name.replace('remotes/', '') : name, isCurrent, isRemote };
    });
  } catch { return []; }
});

ipcMain.handle('git:checkout', async (_event, dirPath, branch) => {
  try {
    await gitExec(['checkout', branch], dirPath, 10000);
    return { success: true };
  } catch (e) { return { success: false, error: e.message }; }
});

ipcMain.handle('git:createBranch', async (_event, dirPath, name) => {
  try {
    await gitExec(['checkout', '-b', name], dirPath, 5000);
    return { success: true };
  } catch (e) { return { success: false, error: e.message }; }
});

ipcMain.handle('git:remoteStatus', async (_event, dirPath) => {
  try {
    const raw = await gitExec(['rev-list', '--left-right', '--count', 'HEAD...@{upstream}'], dirPath, 5000);
    const parts = raw.trim().split(/\s+/).map(Number);
    return { ahead: parts[0] || 0, behind: parts[1] || 0 };
  } catch { return { ahead: 0, behind: 0 }; }
});

ipcMain.handle('git:log', async (_event, dirPath, count) => {
  try {
    const n = count || 30;
    const raw = await gitExec(['log', '--oneline', '--no-decorate', '-n', String(n)], dirPath, 5000);
    const trimmed = raw.trim();
    if (!trimmed) return [];
    return trimmed.split('\n').filter(Boolean).map(line => {
      const spaceIdx = line.indexOf(' ');
      return { hash: line.slice(0, spaceIdx), message: line.slice(spaceIdx + 1) };
    });
  } catch { return []; }
});

ipcMain.handle('git:stash', async (_event, dirPath) => {
  try {
    await gitExec(['stash'], dirPath, 10000);
    return { success: true };
  } catch (e) { return { success: false, error: e.message }; }
});

ipcMain.handle('git:stashPop', async (_event, dirPath) => {
  try {
    await gitExec(['stash', 'pop'], dirPath, 10000);
    return { success: true };
  } catch (e) { return { success: false, error: e.message }; }
});

ipcMain.handle('git:stashList', async (_event, dirPath) => {
  try {
    const raw = await gitExec(['stash', 'list', '--oneline'], dirPath, 5000);
    const trimmed = raw.trim();
    if (!trimmed) return [];
    return trimmed.split('\n').filter(Boolean);
  } catch { return []; }
});

// --- Terminal IPC ---

const activeProcesses = new Map();

ipcMain.handle('terminal:execute', async (event, command, dirPath) => {
  const id = Math.random().toString(36).substring(7);
  
  try {
    const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';
    const shellArgs = process.platform === 'win32' ? ['-NoProfile', '-Command', command] : ['-c', command];
    
    const child = spawn(shell, shellArgs, {
      cwd: dirPath || process.cwd(),
      env: { ...process.env, TERM: 'xterm-256color' },
    });

    activeProcesses.set(id, child);

    child.stdout.on('data', (data) => {
      event.sender.send(`terminal:data:${id}`, data.toString());
    });

    child.stderr.on('data', (data) => {
      event.sender.send(`terminal:data:${id}`, data.toString());
    });

    child.on('close', (code) => {
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

// Cleanup terminal processes on exit
app.on('will-quit', () => {
  for (const child of activeProcesses.values()) {
    try {
      if (process.platform === 'win32') {
        // Use taskkill on Windows to ensure the entire process tree is killed
        execSync(`taskkill /pid ${child.pid} /T /F`);
      } else {
        child.kill('SIGTERM');
      }
    } catch {
      child.kill(); // Fallback to basic kill
    }
  }
  activeProcesses.clear();
});
