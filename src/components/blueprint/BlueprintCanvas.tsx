"use client";

import React, { useMemo, useCallback, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Panel,
  Node,
  Edge,
  ConnectionLineType,
  Position,
  Handle,
  NodeProps,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  ReactFlowProvider,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useIDEStore } from '../../store/useIDEStore';
import { FileEntry } from '../../types';
import { DIR_ICON_MAP, LABEL_OVERRIDES, getIconForDir, formatLabel } from '../../config/icons';
import InlineDialog, { DialogConfig } from '../layout/InlineDialog';
import ViewHint from '../onboarding/ViewHint';
import ArchitectureGuide from './ArchitectureGuide';

interface CustomNodeData {
  label: string;
  type: string;
  icon?: string;
  color?: string;
  count?: number;
  description?: string;
}

const CustomNode = React.memo(({ data, selected }: NodeProps<CustomNodeData>) => {
  return (
    <div className={`node-card w-[200px] min-h-[80px] bg-surface border flex flex-col justify-center px-4 py-3 cursor-pointer group transition-all relative
      ${selected ? 'border-primary shadow-neon-active z-30' : 'border-muted hover:border-primary hover:shadow-neon'}
      ${data.color === 'accent-error' ? 'hover:border-accent-error' : ''}
      ${data.color === 'accent-ai' ? 'hover:border-accent-ai' : ''}
    `}>
      <Handle type="target" position={Position.Left} className="!w-2 !h-4 !rounded-none !bg-muted !border-none" />

      <div className="flex items-center justify-between w-full mb-1">
        <span className={`text-xs font-mono uppercase tracking-wider ${selected ? 'text-primary' : 'text-muted'}`}>
          {data.type}
        </span>
        {data.icon && <span className={`material-symbols-outlined text-[14px] ${selected ? 'text-primary' : data.color ? `text-${data.color}` : 'text-muted'}`}>{data.icon}</span>}
      </div>

      <h3 className="text-text-main font-bold text-sm truncate">{data.label}</h3>

      {data.description && (
        <div className="text-[11px] text-muted mt-1 leading-relaxed">{data.description}</div>
      )}

      {data.count !== undefined && data.count > 0 && !data.description && (
        <div className="text-[11px] text-muted mt-0.5">{data.count} files</div>
      )}

      <Handle type="source" position={Position.Right} className="!w-2 !h-4 !rounded-none !bg-muted !border-none" />
    </div>
  );
});

CustomNode.displayName = 'CustomNode';

const nodeTypes = { custom: CustomNode };

// ─── Demo / default nodes (used when no project is loaded, or for the demo) ───

function generateDefaultNodes(): Node[] {
  return [
    { id: '1', type: 'custom', position: { x: 120, y: 300 }, data: { label: 'User Interface', type: 'frontend', icon: 'desktop_windows', description: 'What the user sees and interacts with' } },
    { id: '2', type: 'custom', position: { x: 450, y: 300 }, data: { label: 'AI Router', type: 'router', icon: 'route', description: 'Decides which AI model to use' } },
    { id: '3', type: 'custom', position: { x: 780, y: 150 }, data: { label: 'Data Storage', type: 'storage', icon: 'database', color: 'accent-error', description: 'Stores and retrieves information' } },
    { id: '4', type: 'custom', position: { x: 780, y: 450 }, data: { label: 'AI Service', type: 'service', icon: 'cloud', color: 'accent-ai', description: 'External AI that generates responses' } },
  ];
}

const DEMO_EDGE_LABELS: Record<string, string> = {
  'e1-2': 'Sends user requests',
  'e2-3': 'Stores & retrieves data',
  'e3-4': 'Provides AI responses',
  'e2-4': 'Routes to AI provider',
};

function generateDemoEdges(nodes: Node[], isBeginnerMode: boolean): Edge[] {
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

// ─── Directory-based grouping for real projects ───

const SPLIT_THRESHOLD = 8;
const MAX_NODES = 12;


/** Describe a group by listing a few representative file names */
function describeGroup(files: FileEntry[]): string {
  const names = files.slice(0, 3).map(f => f.name);
  const suffix = files.length > 3 ? `, +${files.length - 3} more` : '';
  return names.join(', ') + suffix;
}

function generateFileNodes(files: FileEntry[]): Node[] {
  // Step 1 — find the common project-name prefix
  const prefix = files[0].path.split('/')[0];

  // Step 2 — group files by their directory at depth 2 (relative to project root)
  const groups = new Map<string, FileEntry[]>();
  for (const file of files) {
    const rel = file.path.slice(prefix.length + 1); // strip "project-name/"
    const parts = rel.split('/');
    parts.pop(); // remove filename
    const depth = Math.min(2, parts.length);
    const key = depth > 0 ? parts.slice(0, depth).join('/') : '__root__';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(file);
  }

  // Step 3 — split large groups one level deeper
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
      // Only split if it actually produced multiple groups
      if (subGroups.size > 1) {
        for (const [sk, sf] of subGroups) refined.set(sk, sf);
      } else {
        refined.set(key, gFiles);
      }
    } else {
      refined.set(key, gFiles);
    }
  }

  // Step 4 — if we have too many groups, merge the smallest into "Other"
  const sorted = [...refined.entries()].sort((a, b) => a[1].length - b[1].length);
  const final = new Map<string, FileEntry[]>();
  const overflow: FileEntry[] = [];

  if (sorted.length > MAX_NODES) {
    const toMerge = sorted.length - MAX_NODES + 1; // +1 for the "Other" node we'll add
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

  // Fallback — if we ended up with ≤1 group, the project is flat;
  // use simple category-based grouping instead
  if (final.size <= 1) {
    return generateCategoryNodes(files);
  }

  // Step 5 — create nodes with icons and grid positions
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
      data: {
        label,
        type: dirName.toLowerCase(),
        icon,
        color,
        count: gFiles.length,
        description: describeGroup(gFiles),
      },
    });
    index++;
  }

  return nodes;
}

/** Fallback for flat projects with no meaningful directory structure */
function generateCategoryNodes(files: FileEntry[]): Node[] {
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

// ─── Import-based edges for real projects ───

function generateImportEdges(nodes: Node[], files: FileEntry[]): Edge[] {
  if (nodes.length < 2) return [];

  // Build lookup: file path → node id
  const prefix = files[0].path.split('/')[0];
  const fileToNode = new Map<string, string>();
  for (const node of nodes) {
    // Re-derive which files belong to this node by matching paths
    for (const file of files) {
      const rel = file.path.slice(prefix.length + 1);
      const parts = rel.split('/');
      parts.pop();
      // Check if this file's directory path starts with the node's directory key
      const dirPath = parts.join('/');
      if (node.id === '__root__' && parts.length === 0) {
        fileToNode.set(file.path, node.id);
      } else if (node.id === '__other__') {
        // "Other" files are handled by absence from other groups
      } else if (dirPath.startsWith(node.id)) {
        fileToNode.set(file.path, node.id);
      }
    }
  }

  // Build lookup: last directory segment → node id (for matching import paths)
  const segToNode = new Map<string, string>();
  for (const node of nodes) {
    if (node.id === '__root__' || node.id === '__other__') continue;
    const seg = node.id.split('/').pop()!;
    segToNode.set(seg, node.id);
  }

  // Scan files for imports and create edges
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
      if (!importPath.startsWith('.')) continue; // skip bare specifiers (node_modules)

      const segments = importPath.split('/').filter(s => s !== '.' && s !== '..');
      for (const seg of segments) {
        const targetId = segToNode.get(seg);
        if (targetId && targetId !== sourceId) {
          // Deduplicate with sorted key so A→B and B→A collapse
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

// ─── Canvas component ───

const BlueprintCanvasInner: React.FC = () => {
  const { selectModule, files, projectPath, addToast, learningMode } = useIDEStore();
  const reactFlow = useReactFlow();
  const [hasUserEdited, setHasUserEdited] = useState(false);
  const [initialFitDone, setInitialFitDone] = useState(false);

  const isDemo = projectPath === 'demo-project' || files.length === 0;
  const isBeginnerMode = learningMode === 'beginner';

  const seedNodes = useMemo(
    () => (isDemo ? generateDefaultNodes() : generateFileNodes(files)),
    [files, isDemo],
  );
  const seedEdges = useMemo(
    () => (isDemo ? generateDemoEdges(seedNodes, isBeginnerMode) : generateImportEdges(seedNodes, files)),
    [seedNodes, files, isDemo, isBeginnerMode],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(seedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(seedEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogConfig | null>(null);

  // Only sync from files when the user hasn't manually edited the canvas
  React.useEffect(() => {
    if (!hasUserEdited) {
      setNodes(seedNodes);
      setEdges(seedEdges);
    }
  }, [seedNodes, seedEdges, setNodes, setEdges, hasUserEdited]);

  const onConnect = useCallback((params: Connection) => {
    setHasUserEdited(true);
    setEdges(eds => addEdge({ ...params, animated: true, style: { stroke: 'var(--color-primary)', strokeWidth: 2 } }, eds));
  }, [setEdges]);

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
    selectModule(node.data.label);
  }, [selectModule]);

  const handleAddNode = () => {
    setHasUserEdited(true);
    const id = `node-${Date.now()}`;

    // Place in the center of what the user is currently looking at
    const { x, y, zoom } = reactFlow.getViewport();
    const centerX = (-x + window.innerWidth / 2) / zoom;
    const centerY = (-y + window.innerHeight / 2) / zoom;

    const newNode: Node = {
      id,
      type: 'custom',
      position: { x: centerX - 100, y: centerY - 40 },
      data: { label: 'New Module', type: 'custom', icon: 'add_circle', description: 'Double-click to rename' },
      selected: true,
    };
    setNodes(nds => [...nds.map(n => ({ ...n, selected: false })), newNode]);
    setSelectedNodeId(id);
    addToast('Node added — double-click it to rename', 'info');
  };

  const handleDeleteSelected = () => {
    if (!selectedNodeId) return;
    setHasUserEdited(true);
    setNodes(nds => nds.filter(n => n.id !== selectedNodeId));
    setEdges(eds => eds.filter(e => e.source !== selectedNodeId && e.target !== selectedNodeId));
    setSelectedNodeId(null);
    addToast('Node deleted', 'info');
  };

  const onNodeDoubleClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setDialog({
      isOpen: true,
      type: 'prompt',
      title: 'Rename Node',
      defaultValue: node.data.label,
      onConfirm: (newLabel) => {
        setHasUserEdited(true);
        setNodes(nds => nds.map(n =>
          n.id === node.id ? { ...n, data: { ...n.data, label: newLabel } } : n
        ));
      },
      onClose: () => setDialog(null),
    });
  }, [setNodes]);

  return (
    <div className="absolute inset-0 w-full h-full canvas-grid bg-background overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        fitView={!initialFitDone}
        onInit={() => setInitialFitDone(true)}
        className="z-20"
        deleteKeyCode="Delete"
      >
        <Background color="#1E222B" gap={20} />
        <Controls showInteractive={false} className="!bg-surface !border-muted !fill-muted" />

        {/* Toolbar */}
        <Panel position="top-left">
          <div className="flex gap-1 ml-2 mt-2">
            <button
              onClick={handleAddNode}
              title="Add a new node"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-muted text-text-main text-xs font-bold uppercase tracking-wider hover:bg-primary hover:text-background hover:shadow-neon transition-all"
            >
              <span className="material-symbols-outlined text-[14px]">add</span>
              Add Node
            </button>
            {selectedNodeId && (
              <button
                onClick={handleDeleteSelected}
                title="Delete selected node"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-muted text-accent-error text-xs font-bold uppercase tracking-wider hover:bg-accent-error hover:text-background transition-all"
              >
                <span className="material-symbols-outlined text-[14px]">delete</span>
                Delete
              </button>
            )}
          </div>
        </Panel>

        {/* Architecture Guide (beginner mode) */}
        <Panel position="bottom-right">
          <div className="mb-14 mr-2">
            <ArchitectureGuide />
          </div>
        </Panel>

        {/* Version Panel */}
        <Panel position="bottom-center">
          <div className="mb-6 h-10 bg-surface border border-muted flex items-center shadow-lg px-4 text-xs font-mono text-text-main gap-4">
            <span>NEON PROTOCOL CANVAS V1.0</span>
            <span className="text-muted">|</span>
            <span className="text-muted">{nodes.length} nodes</span>
            <span className="text-muted">|</span>
            <span className="text-muted">{edges.length} edges</span>
          </div>
        </Panel>
      </ReactFlow>
      <ViewHint
        id="hint-blueprint"
        icon="touch_app"
        title="This is your project map"
        description="Each box represents a part of your project. Click any box to learn about it. Drag boxes to rearrange them. Use the + button at the top-left to add new boxes."
      />
      {dialog && <InlineDialog {...dialog} />}
    </div>
  );
};

// Wrap in ReactFlowProvider so useReactFlow() works
const BlueprintCanvas: React.FC = () => (
  <ReactFlowProvider>
    <BlueprintCanvasInner />
  </ReactFlowProvider>
);

export default BlueprintCanvas;
