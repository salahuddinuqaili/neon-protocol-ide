const { ipcMain } = require('electron');
const { execFileSync } = require('child_process');
const os = require('os');

function registerSystemHandlers() {
  ipcMain.handle('system:getHardwareInfo', async () => {
    const ramGb = Math.round(os.totalmem() / (1024 * 1024 * 1024));
    const cpuCores = os.cpus().length;
    let gpu = { detected: false, name: '', vramGb: 0 };

    try {
      if (process.platform === 'win32') {
        const output = execFileSync('powershell', [
          '-NoProfile', '-Command',
          'Get-CimInstance Win32_VideoController | Select-Object -First 1 Name, AdapterRAM | ConvertTo-Json',
        ], { timeout: 10000, stdio: 'pipe' }).toString();
        const data = JSON.parse(output);
        if (data && data.Name) {
          gpu = {
            detected: true,
            name: data.Name,
            vramGb: data.AdapterRAM ? Math.round(data.AdapterRAM / (1024 * 1024 * 1024)) : 0,
          };
        }
      } else if (process.platform === 'darwin') {
        const output = execFileSync('system_profiler', ['SPDisplaysDataType', '-json'], {
          timeout: 10000, stdio: 'pipe',
        }).toString();
        const data = JSON.parse(output);
        const displays = data?.SPDisplaysDataType;
        if (displays && displays.length > 0) {
          const d = displays[0];
          gpu = {
            detected: true,
            name: d.sppci_model || d._name || 'Unknown GPU',
            vramGb: 0, // macOS unified memory — not separately reported
          };
        }
      } else {
        // Linux — try nvidia-smi first
        const output = execFileSync('nvidia-smi', [
          '--query-gpu=name,memory.total', '--format=csv,noheader,nounits',
        ], { timeout: 10000, stdio: 'pipe' }).toString();
        const parts = output.trim().split(',').map(s => s.trim());
        if (parts.length >= 2) {
          gpu = {
            detected: true,
            name: parts[0],
            vramGb: Math.round(parseInt(parts[1], 10) / 1024) || 0,
          };
        }
      }
    } catch {
      // GPU detection is best-effort
    }

    return { ramGb, cpuCores, gpu };
  });
}

module.exports = { registerSystemHandlers };
