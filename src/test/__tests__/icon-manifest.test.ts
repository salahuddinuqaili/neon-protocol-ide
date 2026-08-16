/**
 * The bundled icon font is subset to `src/config/iconManifest.ts`. An icon referenced by a
 * component but absent from the manifest has no glyph and renders as its raw ligature text —
 * the literal word "settings" where a gear should be.
 *
 * This test scans the source for icon references and fails if any is missing from the
 * manifest, so adding an icon without running `npm run build-fonts` cannot ship broken.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { ICON_MANIFEST, ICON_SET } from '../../config/iconManifest';

const SRC = path.resolve(__dirname, '../..');

/**
 * Identifiers that appear inside icon expressions as the left-hand side of a comparison
 * (`msg.role === 'ai' ? ... `), not as icon names. Keep this list minimal — anything added
 * here stops being checked, so only add a value after confirming it is never rendered.
 */
const NOT_ICON_NAMES = new Set(['ai', 'testing', 'success']);

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'test' || entry.name === '__tests__') continue;
      out.push(...sourceFiles(full));
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

/** Every icon name referenced from a material-symbols span or an `icon:` config field. */
function referencedIcons(): Map<string, string> {
  const found = new Map<string, string>();
  for (const file of sourceFiles(SRC)) {
    const src = fs.readFileSync(file, 'utf8');
    const rel = path.relative(SRC, file).replace(/\\/g, '/');

    for (const m of src.matchAll(/material-symbols-outlined[^>]*>([\s\S]{0,400}?)<\/span>/g)) {
      const body = m[1];
      const plain = body.trim();
      if (/^[a-z0-9_]+$/.test(plain)) {
        if (!found.has(plain)) found.set(plain, rel);
        continue;
      }
      for (const s of body.matchAll(/['"`]([a-z0-9_]+)['"`]/g)) {
        if (!found.has(s[1])) found.set(s[1], rel);
      }
    }

    for (const m of src.matchAll(/\bicon\s*[:=]\s*['"`]([a-z0-9_]+)['"`]/g)) {
      if (!found.has(m[1])) found.set(m[1], rel);
    }
  }
  return found;
}

describe('icon manifest', () => {
  it('covers every icon referenced in the source', () => {
    const missing: string[] = [];
    for (const [icon, file] of referencedIcons()) {
      if (NOT_ICON_NAMES.has(icon)) continue;
      if (!ICON_SET.has(icon)) missing.push(`${icon} (used in ${file})`);
    }

    expect(
      missing,
      `These icons are used but missing from src/config/iconManifest.ts. Add them, then run ` +
        `\`npm run build-fonts\` — otherwise they render as raw text in the app:\n  ` +
        missing.join('\n  ')
    ).toEqual([]);
  });

  it('ships a bundled icon font rather than a remote stylesheet', () => {
    const layout = fs.readFileSync(path.join(SRC, 'app', 'layout.tsx'), 'utf8');
    // Match an actual remote stylesheet reference, not a mention in a comment.
    expect(layout).not.toMatch(/href=["']https?:\/\//);
    expect(layout).toContain('/fonts/fonts.css');
  });

  it('has the generated font files committed', () => {
    const fontDir = path.resolve(SRC, '..', 'public', 'fonts');
    expect(fs.existsSync(path.join(fontDir, 'fonts.css'))).toBe(true);

    const css = fs.readFileSync(path.join(fontDir, 'fonts.css'), 'utf8');
    expect(css).not.toContain('https://fonts.gstatic.com');

    // Every woff2 the stylesheet points at must actually be present on disk.
    for (const m of css.matchAll(/url\(\/fonts\/([^)]+)\)/g)) {
      expect(fs.existsSync(path.join(fontDir, m[1])), `missing font file: ${m[1]}`).toBe(true);
    }
  });

  it('has no duplicate entries', () => {
    expect(new Set(ICON_MANIFEST).size).toBe(ICON_MANIFEST.length);
  });
});
