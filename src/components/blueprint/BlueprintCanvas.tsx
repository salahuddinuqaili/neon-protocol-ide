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
import { generateDefaultNodes, generateDemoEdges, generateFileNodes, generateImportEdges } from '../../lib/blueprint/graphBuilder';
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
