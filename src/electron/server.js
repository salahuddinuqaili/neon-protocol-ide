const http = require('http');
const path = require('path');
const fs = require('fs');

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
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(path.join(outDir, 'index.html'))) {
      reject(new Error(`UI bundle missing at ${outDir}. The app was packaged without its "out" directory.`));
      return;
    }

    const server = http.createServer((req, res) => {
      let urlPath = decodeURIComponent(req.url.split('?')[0]);

      let filePath = path.join(outDir, urlPath);

      // Path traversal check
      const relative = path.relative(outDir, filePath);
      if (relative.startsWith('..') || path.isAbsolute(relative)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }

      if (urlPath === '/' || urlPath === '') {
        filePath = path.join(outDir, 'index.html');
      }

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

      // A URL that maps to a directory would throw EISDIR on read — serve the SPA shell
      // instead so client-side routes never surface a raw server error.
      if (fs.statSync(filePath).isDirectory()) {
        filePath = path.join(outDir, 'index.html');
      }

      const ext = path.extname(filePath);
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      try {
        const content = fs.readFileSync(filePath);
        res.writeHead(200, {
          'Content-Type': contentType,
          // Hashed asset names make these immutable; the HTML shell must not be cached
          // or an upgraded app would keep booting the previous build's markup.
          'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
        });
        res.end(content);
      } catch {
        res.writeHead(500);
        res.end('Server error');
      }
    });

    // Without this, a failed listen leaves the promise pending forever and the app hangs
    // on a blank window with no error shown.
    server.on('error', reject);

    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      console.log(`Static server running at http://127.0.0.1:${port}`);
      resolve(port);
    });
  });
}

module.exports = { startStaticServer };
