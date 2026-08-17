/**
 * The architecture map is the product's headline feature, and in the packaged app it was
 * broken outright: `fs:scanProject` returns ABSOLUTE paths, but the graph builder derived
 * the project root as `files[0].path.split('/')[0]` — on Windows, the drive letter "C:".
 * Every file then grouped under the same bogus directory, the grouping collapsed to one
 * entry, and the map fell back to four generic boxes with no connections no matter what
 * the project contained.
 */
import { describe, it, expect } from 'vitest';
import { generateFileNodes, generateImportEdges, relativeTo } from '../../lib/blueprint/graphBuilder';
import { FileEntry } from '../../types';

const ROOT = 'C:/Users/dev/projects/my-app';

const file = (relPath: string, content = ''): FileEntry => ({
  name: relPath.split('/').pop()!,
  path: `${ROOT}/${relPath}`,
  content,
  language: 'typescript',
});

/** A realistic project as `fs:scanProject` would report it — absolute paths. */
const PROJECT: FileEntry[] = [
  file('src/components/Header.tsx', "import { useStore } from '../store/useStore';"),
  file('src/components/Sidebar.tsx', "import { useStore } from '../store/useStore';"),
  file('src/components/Footer.tsx', ''),
  file('src/store/useStore.ts', "import { api } from '../api/client';"),
  file('src/store/slices.ts', ''),
  file('src/api/client.ts', ''),
  file('src/api/routes.ts', ''),
  file('src/hooks/useThing.ts', ''),
  file('package.json', ''),
];

describe('graphBuilder', () => {
  describe('relativeTo', () => {
    it('strips an absolute project root', () => {
      expect(relativeTo(`${ROOT}/src/components/Header.tsx`, ROOT)).toBe('src/components/Header.tsx');
    });

    it('handles Windows backslashes and drive-letter case differences', () => {
      expect(relativeTo('C:\\Users\\dev\\projects\\my-app\\src\\a.ts', 'c:/Users/dev/projects/my-app'))
        .toBe('src/a.ts');
    });

    it('tolerates a trailing slash on the root', () => {
      expect(relativeTo(`${ROOT}/src/a.ts`, `${ROOT}/`)).toBe('src/a.ts');
    });

    it('falls back to stripping the first segment for demo-style relative paths', () => {
      expect(relativeTo('demo-project/src/a.ts', null)).toBe('src/a.ts');
    });
  });

  describe('generateFileNodes', () => {
    it('groups by real directories instead of collapsing to generic categories', () => {
      const nodes = generateFileNodes(PROJECT, ROOT);
      const labels = nodes.map((n) => n.data.label);

      // The generic fallback would produce exactly these four and nothing else.
      expect(labels).not.toEqual(
        expect.arrayContaining(['API Endpoints', 'Pages & Components', 'Data & Storage', 'App Logic'])
      );

      expect(nodes.length).toBeGreaterThan(1);
      expect(labels).toEqual(
        expect.arrayContaining(['Components', 'Store', 'API', 'Hooks'])
      );
    });

    it('reports the real file count per group', () => {
      const nodes = generateFileNodes(PROJECT, ROOT);
      const components = nodes.find((n) => n.data.label === 'Components');
      expect(components?.data.count).toBe(3);
    });

    it('produces the same grouping whether paths are absolute or root-relative', () => {
      const absolute = generateFileNodes(PROJECT, ROOT).map((n) => n.data.label).sort();
      const relative = generateFileNodes(
        PROJECT.map((f) => ({ ...f, path: `my-app/${relativeTo(f.path, ROOT)}` })),
        null
      ).map((n) => n.data.label).sort();

      expect(absolute).toEqual(relative);
    });

    it('does not collapse when the root is a Windows drive path', () => {
      // The original bug: split('/')[0] === 'C:' put every file in one group.
      const nodes = generateFileNodes(PROJECT, ROOT);
      expect(nodes.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('generateImportEdges', () => {
    it('connects groups that actually import each other', () => {
      const nodes = generateFileNodes(PROJECT, ROOT);
      const edges = generateImportEdges(nodes, PROJECT, ROOT);

      expect(edges.length).toBeGreaterThan(0);

      const pairs = edges.map((e) => `${e.source}->${e.target}`);
      const componentsNode = nodes.find((n) => n.data.label === 'Components')!.id;
      const storeNode = nodes.find((n) => n.data.label === 'Store')!.id;
      expect(pairs).toContain(`${componentsNode}->${storeNode}`);
    });

    it('returns no edges for a project with no imports', () => {
      const plain = [file('src/a/one.ts'), file('src/b/two.ts')];
      const nodes = generateFileNodes(plain, ROOT);
      expect(generateImportEdges(nodes, plain, ROOT)).toEqual([]);
    });
  });
});
