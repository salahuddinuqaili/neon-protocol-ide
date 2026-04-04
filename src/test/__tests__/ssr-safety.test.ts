import { describe, it, expect } from 'vitest';
import path from 'path';
import fs from 'fs';

/**
 * Catches the class of bug that broke v1.3.1: accessing `(window as any).electronAPI`
 * at component body scope causes "window is not defined" during Next.js static export.
 *
 * The pattern that breaks SSR:
 *   const MyComponent = () => {
 *     const api = (window as any).electronAPI;  // BREAKS — runs during SSR
 *
 * Safe patterns:
 *   typeof window !== 'undefined' ? (window as any).electronAPI : undefined
 *   useEffect(() => { const api = (window as any).electronAPI; })
 *   const handler = async () => { const api = (window as any).electronAPI; }
 */
describe('SSR safety', () => {
  it('electronAPI access is always guarded against SSR', () => {
    const srcDir = path.resolve(__dirname, '../../');
    const violations: string[] = [];

    function scanDir(dir: string) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory() && !entry.name.startsWith('__') && entry.name !== 'test' && entry.name !== 'node_modules') {
          scanDir(fullPath);
        } else if ((entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) && !entry.name.endsWith('.d.ts')) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const lines = content.split('\n');

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // Only flag electronAPI access patterns
            if (!line.includes('electronAPI')) continue;
            // Skip imports, type definitions, comments
            if (line.trim().startsWith('//') || line.trim().startsWith('*') || line.includes('import ')) continue;
            // Skip if already guarded with typeof window check
            if (line.includes('typeof window')) continue;
            // Check if this line is inside a function/hook/handler (safe)
            const preceding = lines.slice(Math.max(0, i - 8), i).join('\n');
            const insideSafeContext = /useEffect\s*\(|useCallback\s*\(|useMemo\s*\(|=>\s*\{|async\s+\(|async\s+function|const\s+\w+\s*=\s*async/.test(preceding);
            if (insideSafeContext) continue;

            const relPath = path.relative(srcDir, fullPath).replace(/\\/g, '/');
            violations.push(`${relPath}:${i + 1}: ${line.trim()}`);
          }
        }
      }
    }

    scanDir(srcDir);

    expect(violations,
      `Unguarded electronAPI access will break SSR (next build).\n` +
      `Fix: wrap with \`typeof window !== 'undefined' ? ... : undefined\`\n\n` +
      violations.map(v => `  ${v}`).join('\n')
    ).toHaveLength(0);
  });
});
