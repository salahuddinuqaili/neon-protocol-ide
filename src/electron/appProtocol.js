const { protocol, net } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

/**
 * Serves the Next.js static export from a custom `app://` scheme.
 *
 * The app previously served the UI over a local HTTP server bound to port 0, so the OS
 * handed out a different ephemeral port on every launch. Web Storage is keyed by full
 * origin — scheme, host *and port* — so each start landed on a brand-new origin with an
 * empty localStorage. Everything the store persists (configured AI providers, onboarding
 * completion, learning progress, recent projects, editor settings) was silently discarded
 * on every restart, and the app appeared to forget the user completely.
 *
 * A custom scheme has no port, so the origin is `app://neon` forever.
 */

const SCHEME = 'app';
const HOST = 'neon';
const ORIGIN = `${SCHEME}://${HOST}`;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json',
  '.txt': 'text/plain',
};

/**
 * Must run before `app.whenReady()`. Marking the scheme `standard` gives it real origin
 * semantics (so localStorage, fetch and modules behave normally) and `secure` keeps it a
 * trusted context, which Monaco's workers require.
 */
function registerAppScheme() {
  protocol.registerSchemeAsPrivileged([
    {
      scheme: SCHEME,
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        corsEnabled: true,
        stream: true,
      },
    },
  ]);
}

/** Registers the request handler. Call after the app is ready. */
function serveApp(outDir) {
  if (!fs.existsSync(path.join(outDir, 'index.html'))) {
    throw new Error(`UI bundle missing at ${outDir}. The app was packaged without its "out" directory.`);
  }

  protocol.handle(SCHEME, async (request) => {
    let pathname;
    try {
      ({ pathname } = new URL(request.url));
    } catch {
      return new Response('Bad request', { status: 400 });
    }

    let filePath = path.join(outDir, decodeURIComponent(pathname));

    // Refuse anything that escapes the bundle directory.
    const relative = path.relative(outDir, filePath);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      return new Response('Forbidden', { status: 403 });
    }

    // Directory or extensionless request: try `<path>.html`, then fall back to the SPA
    // shell so client-side routes resolve instead of 404ing.
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      const asHtml = `${filePath}.html`;
      filePath = fs.existsSync(asHtml) && !path.extname(filePath)
        ? asHtml
        : path.join(outDir, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const response = await net.fetch(pathToFileURL(filePath).toString());

    // net.fetch over file:// does not set a useful Content-Type; a wrong type on the
    // JS bundles stops the renderer from booting at all.
    const headers = new Headers(response.headers);
    headers.set('Content-Type', MIME_TYPES[ext] || 'application/octet-stream');
    // Hashed asset filenames are immutable; the shell must never be cached or an upgraded
    // build would keep booting the previous markup.
    headers.set(
      'Cache-Control',
      ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable'
    );

    return new Response(response.body, { status: response.status, headers });
  });
}

module.exports = { registerAppScheme, serveApp, APP_ORIGIN: ORIGIN, APP_INDEX: `${ORIGIN}/index.html` };
