const { ipcMain } = require('electron');
const { execFile, spawn } = require('child_process');

function gitExec(args, dirPath, timeout = 5000) {
  return new Promise((resolve, reject) => {
    execFile('git', args, { cwd: dirPath, encoding: 'utf-8', timeout }, (error, stdout) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(stdout);
    });
  });
}

function registerGitHandlers() {
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

  ipcMain.handle('git:discardFile', async (_event, dirPath, filePath) => {
    try {
      await gitExec(['checkout', '--', filePath], dirPath, 5000);
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
}

module.exports = { registerGitHandlers };
