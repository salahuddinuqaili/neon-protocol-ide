import { Node, Edge, ConnectionLineType } from 'reactflow';
import { FileEntry } from '../../types';
import { getIconForDir, formatLabel } from '../../config/icons';

const SPLIT_THRESHOLD = 8;
const MAX_NODES = 12;

const DEMO_EDGE_LABELS: Record<string, string> = {
  'e1-2': 'Sends user requests',
  'e2-3': 'Stores & retrieves data',
  'e3-4': 'Provides AI responses',
  'e2-4': 'Routes to AI provider',
};

export function generateDefaultNodes(): Node[] {
  return [
    { id: '1', type: 'custom', position: { x: 120, y: 300 }, data: { label: 'User Interface', type: 'frontend', icon: 'desktop_windows', description: 'What the user sees and interacts with' } },
    { id: '2', type: 'custom', position: { x: 450, y: 300 }, data: { label: 'AI Router', type: 'router', icon: 'route', description: 'Decides which AI model to use' } },
    { id: '3', type: 'custom', position: { x: 780, y: 150 }, data: { label: 'Data Storage', type: 'storage', icon: 'database', color: 'accent-error', description: 'Stores and retrieves information' } },
    { id: '4', type: 'custom', position: { x: 780, y: 450 }, data: { label: 'AI Service', type: 'service', icon: 'cloud', color: 'accent-ai', description: 'External AI that generates responses' } },
  ];
}

export function generateDemoEdges(nodes: Node[], isBeginnerMode: boolean): Edge[] {
  const edges: Edge[] = [];
  if (nodes.length > 1) {
    for (let i = 0; i < nodes.length - 1; i++) {
      const edgeId = `e${nodes[i].id}-${nodes[i + 1].id}`;
      edges.push({
        id: edgeId,
        source: nodes[i].id,
        target: nodes[i + 1].id,
        animated: true,
        style: { stroke: 'var(--color-primary)', strokeWidth: 2 },
        type: ConnectionLineType.SmoothStep,
        ...(isBeginnerMode && DEMO_EDGE_LABELS[edgeId]
          ? {
              label: DEMO_EDGE_LABELS[edgeId],
              labelStyle: { fill: '#6B7280', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' },
              labelBgStyle: { fill: '#181A20', stroke: '#6B7280', strokeWidth: 0.5 },
              labelBgPadding: [4, 2] as [number, number],
            }
          : {}),
      });
    }
  }
  return edges;
}

export function describeGroup(files: FileEntry[]): string {
  const names = files.slice(0, 3).map(f => f.name);
  const suffix = files.length > 3 ? `, +${files.length - 3} more` : '';
  return names.join(', ') + suffix;
}

export function generateFileNodes(files: FileEntry[]): Node[] {
  const prefix = files[0].path.split('/')[0];

  const groups = new Map<string, FileEntry[]>();
  for (const file of files) {
    const rel = file.path.slice(prefix.length + 1);
    const parts = rel.split('/');
    parts.pop();
    const depth = Math.min(2, parts.length);
    const key = depth > 0 ? parts.slice(0, depth).join('/') : '__root__';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(file);
  }

  const refined = new Map<string, FileEntry[]>();
  for (const [key, gFiles] of groups) {
    if (gFiles.length > SPLIT_THRESHOLD && key !== '__root__') {
      const subGroups = new Map<string, FileEntry[]>();
      for (const file of gFiles) {
        const rel = file.path.slice(prefix.length + 1);
        const parts = rel.split('/');
        parts.pop();
        const depth = Math.min(key.split('/').length + 1, parts.length);
        const subKey = parts.slice(0, depth).join('/') || key;
        if (!subGroups.has(subKey)) subGroups.set(subKey, []);
        subGroups.get(subKey)!.push(file);
      }
      if (subGroups.size > 1) {
        for (const [sk, sf] of subGroups) refined.set(sk, sf);
      } else {
        refined.set(key, gFiles);
      }
    } else {
      refined.set(key, gFiles);
    }
  }

  const sorted = [...refined.entries()].sort((a, b) => a[1].length - b[1].length);
  const final = new Map<string, FileEntry[]>();
  const overflow: FileEntry[] = [];

  if (sorted.length > MAX_NODES) {
    const toMerge = sorted.length - MAX_NODES + 1;
    for (let i = 0; i < sorted.length; i++) {
      if (i < toMerge && sorted[i][0] !== '__root__') {
        overflow.push(...sorted[i][1]);
      } else {
        final.set(sorted[i][0], sorted[i][1]);
      }
    }
    if (overflow.length > 0) {
      final.set('__other__', overflow);
    }
  } else {
    for (const [k, v] of sorted) final.set(k, v);
  }

  if (final.size <= 1) {
    return generateCategoryNodes(files);
  }

  const nodes: Node[] = [];
  const cols = Math.min(4, Math.ceil(Math.sqrt(final.size)));
  let index = 0;

  for (const [key, gFiles] of final) {
    const dirName = key === '__root__' ? 'config' : key === '__other__' ? 'other' : key.split('/').pop()!;
    const label = key === '__other__' ? 'Other' : key === '__root__' ? 'Config' : formatLabel(dirName);
    const { icon, color } = getIconForDir(dirName);

    const col = index % cols;
    const row = Math.floor(index / cols);

    nodes.push({
      id: key,
      type: 'custom',
      position: { x: 100 + col * 280, y: 100 + row * 180 },
      data: { label, type: dirName.toLowerCase(), icon, color, count: gFiles.length, description: describeGroup(gFiles) },
    });
    index++;
  }

  return nodes;
}

export function generateCategoryNodes(files: FileEntry[]): Node[] {
  const categories = {
    api: { label: 'API Endpoints', icon: 'api', description: 'Handles requests from the outside world', files: [] as FileEntry[] },
    ui: { label: 'Pages & Components', icon: 'widgets', description: 'What users see on screen', files: [] as FileEntry[] },
    data: { label: 'Data & Storage', icon: 'database', description: 'Manages saved information', files: [] as FileEntry[] },
    logic: { label: 'App Logic', icon: 'settings', description: 'The core rules and behavior', files: [] as FileEntry[] },
  };

  files.forEach(file => {
    if (file.path.includes('/api/')) categories.api.files.push(file);
    else if (file.path.includes('/components/')) categories.ui.files.push(file);
    else if (file.path.includes('/store/') || file.path.includes('/db/')) categories.data.files.push(file);
    else categories.logic.files.push(file);
  });

  const nodes: Node[] = [];
  Object.entries(categories).forEach(([key, cat], index) => {
    if (cat.files.length > 0) {
      nodes.push({
        id: key,
        type: 'custom',
        position: { x: 100 + index * 300, y: 200 + (index % 2) * 150 },
        data: { label: cat.label, type: key, icon: cat.icon, count: cat.files.length, description: `${cat.files.length} files — ${cat.description}` },
      });
    }
  });
  return nodes;
}

// Cache for import edge computation — avoids re-parsing all file content on every render
let edgeCache: { key: string; edges: Edge[] } | null = null;

function computeFilesHash(files: FileEntry[]): string {
  // Use file count + total content length as a cheap but effective cache key
  let totalLen = 0;
  for (const f of files) totalLen += f.content.length;
  return `${files.length}:${totalLen}`;
}

export function generateImportEdges(nodes: Node[], files: FileEntry[]): Edge[] {
  if (nodes.length < 2) return [];

  const nodeIds = nodes.map(n => n.id).sort().join(',');
  const filesHash = computeFilesHash(files);
  const cacheKey = `${nodeIds}::${filesHash}`;

  if (edgeCache && edgeCache.key === cacheKey) {
    return edgeCache.edges;
  }

  const edges = computeImportEdges(nodes, files);
  edgeCache = { key: cacheKey, edges };
  return edges;
}

function computeImportEdges(nodes: Node[], files: FileEntry[]): Edge[] {
  const prefix = files[0].path.split('/')[0];
  const fileToNode = new Map<string, string>();
  for (const node of nodes) {
    for (const file of files) {
      const rel = file.path.slice(prefix.length + 1);
      const parts = rel.split('/');
      parts.pop();
      const dirPath = parts.join('/');
      if (node.id === '__root__' && parts.length === 0) {
        fileToNode.set(file.path, node.id);
      } else if (node.id !== '__other__' && dirPath.startsWith(node.id)) {
        fileToNode.set(file.path, node.id);
      }
    }
  }

  const segToNode = new Map<string, string>();
  for (const node of nodes) {
    if (node.id === '__root__' || node.id === '__other__') continue;
    const seg = node.id.split('/').pop()!;
    segToNode.set(seg, node.id);
  }

  const edgeSet = new Set<string>();
  const edges: Edge[] = [];
  const importRe = /from\s+['"]([^'"]+)['"]/g;

  for (const file of files) {
    const sourceId = fileToNode.get(file.path);
    if (!sourceId) continue;

    let match;
    importRe.lastIndex = 0;
    while ((match = importRe.exec(file.content)) !== null) {
      const importPath = match[1];
      if (!importPath.startsWith('.')) continue;

      const segments = importPath.split('/').filter(s => s !== '.' && s !== '..');
      for (const seg of segments) {
        const targetId = segToNode.get(seg);
        if (targetId && targetId !== sourceId) {
          const edgeKey = [sourceId, targetId].sort().join('::');
          if (!edgeSet.has(edgeKey)) {
            edgeSet.add(edgeKey);
            edges.push({
              id: `e-${sourceId}-${targetId}`,
              source: sourceId,
              target: targetId,
              animated: true,
              style: { stroke: 'var(--color-primary)', strokeWidth: 1.5, opacity: 0.6 },
              type: ConnectionLineType.SmoothStep,
            });
          }
          break;
        }
      }
    }
  }

  return edges;
}
