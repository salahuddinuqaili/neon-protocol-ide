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
import InlineDialog, { DialogConfig } from '../layout/InlineDialog';
import ViewHint from '../onboarding/ViewHint';

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
        <span className={`text-[10px] font-mono uppercase tracking-wider ${selected ? 'text-primary' : 'text-muted'}`}>
          {data.type}
        </span>
        {data.icon && <span className={`material-symbols-outlined text-[14px] ${selected ? 'text-primary' : data.color ? `text-${data.color}` : 'text-muted'}`}>{data.icon}</span>}
      </div>

      <h3 className="text-text-main font-bold text-sm truncate">{data.label}</h3>

      {data.description && (
        <div className="text-[9px] text-muted mt-1 leading-snug">{data.description}</div>
      )}

      {data.count !== undefined && data.count > 0 && !data.description && (
        <div className="text-[9px] text-muted mt-0.5">{data.count} files</div>
      )}

      <Handle type="source" position={Position.Right} className="!w-2 !h-4 !rounded-none !bg-muted !border-none" />
    </div>
  );
});

CustomNode.displayName = 'CustomNode';

const nodeTypes = { custom: CustomNode };

// Removed module-level counter — use Date.now() for stable unique IDs

function generateDefaultNodes(): Node[] {
  return [
    { id: '1', type: 'custom', position: { x: 120, y: 300 }, data: { label: 'User Interface', type: 'frontend', icon: 'desktop_windows', description: 'What the user sees and interacts with' } },
    { id: '2', type: 'custom', position: { x: 450, y: 300 }, data: { label: 'AI Router', type: 'router', icon: 'route', description: 'Decides which AI model to use' } },
    { id: '3', type: 'custom', position: { x: 780, y: 150 }, data: { label: 'Data Storage', type: 'storage', icon: 'database', color: 'accent-error', description: 'Stores and retrieves information' } },
    { id: '4', type: 'custom', position: { x: 780, y: 450 }, data: { label: 'AI Service', type: 'service', icon: 'cloud', color: 'accent-ai', description: 'External AI that generates responses' } },
  ];
}

function generateFileNodes(files: FileEntry[]): Node[] {
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
        data: { label: cat.label, type: key, icon: cat.icon, count: cat.files.length, description: `${cat.files.length} files — ${cat.description}` }
      });
    }
  });
  return nodes;
}

function generateEdges(nodes: Node[]): Edge[] {
  const edges: Edge[] = [];
  if (nodes.length > 1) {
    for (let i = 0; i < nodes.length - 1; i++) {
      edges.push({
        id: `e${nodes[i].id}-${nodes[i+1].id}`,
        source: nodes[i].id,
        target: nodes[i+1].id,
        animated: true,
        style: { stroke: 'var(--color-primary)', strokeWidth: 2 },
        type: ConnectionLineType.SmoothStep,
      });
    }
  }
  return edges;
}

const BlueprintCanvasInner: React.FC = () => {
  const { selectModule, files, addToast } = useIDEStore();
  const reactFlow = useReactFlow();
  const [hasUserEdited, setHasUserEdited] = useState(false);
  const [initialFitDone, setInitialFitDone] = useState(false);

  const seedNodes = useMemo(() => files.length === 0 ? generateDefaultNodes() : generateFileNodes(files), [files]);
  const seedEdges = useMemo(() => generateEdges(seedNodes), [seedNodes]);

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
              className="flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-muted text-text-main text-[10px] font-bold uppercase tracking-wider hover:bg-primary hover:text-background hover:shadow-neon transition-all"
            >
              <span className="material-symbols-outlined text-[14px]">add</span>
              Add Node
            </button>
            {selectedNodeId && (
              <button
                onClick={handleDeleteSelected}
                title="Delete selected node"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-muted text-accent-error text-[10px] font-bold uppercase tracking-wider hover:bg-accent-error hover:text-background transition-all"
              >
                <span className="material-symbols-outlined text-[14px]">delete</span>
                Delete
              </button>
            )}
          </div>
        </Panel>

        {/* Version Panel */}
        <Panel position="bottom-center">
          <div className="mb-6 h-10 bg-surface border border-muted flex items-center shadow-lg px-4 text-[10px] font-mono text-text-main gap-4">
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
