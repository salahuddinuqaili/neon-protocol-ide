"use client";

import React, { useMemo, useCallback } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  Panel,
  Node,
  Edge,
  MarkerType,
  ConnectionLineType,
  Position,
  Handle
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useIDEStore } from '../../store/useIDEStore';

const nodeStyles = {
  frontend: 'border-muted',
  router: 'border-primary shadow-neon-active',
  storage: 'border-accent-error',
  service: 'border-accent-ai',
};

/**
 * 🎓 LEARNER TIP: Custom Components
 * This "CustomNode" is a React component that defines how each box on the map looks.
 * We use Tailwind CSS classes to style it (like bg-surface, border, font-mono).
 */
const CustomNode = ({ data, selected }: any) => {
  return (
    <div className={`node-card w-[180px] h-[80px] bg-surface border flex flex-col justify-center px-4 cursor-pointer group transition-all relative
      ${selected ? 'border-primary shadow-neon-active z-30' : 'border-muted hover:border-primary hover:shadow-neon'}
      ${data.color === 'accent-error' ? 'hover:border-accent-error' : ''}
      ${data.color === 'accent-ai' ? 'hover:border-accent-ai' : ''}
    `}>
      {/* Target Handle: Where lines enter the node */}
      <Handle type="target" position={Position.Left} className="!w-2 !h-4 !rounded-none !bg-muted !border-none" />
      
      <div className="flex items-center justify-between w-full mb-1">
        <span className={`text-[10px] font-mono uppercase tracking-wider ${selected ? 'text-primary' : 'text-muted'}`}>
          {data.type}
        </span>
        {data.icon && <span className={`material-symbols-outlined text-[14px] ${selected ? 'text-primary' : data.color ? `text-${data.color}` : 'text-muted'}`}>{data.icon}</span>}
      </div>
      
      <h3 className="text-text-main font-bold text-sm truncate">{data.label}</h3>
      
      {/* 🎓 LEARNER TIP: Conditional Rendering
          We only show this line if "data.count" exists. */}
      {data.count && <div className="text-[9px] text-muted mt-0.5">{data.count} modules detected</div>}
      
      {/* Source Handle: Where lines exit the node */}
      <Handle type="source" position={Position.Right} className="!w-2 !h-4 !rounded-none !bg-muted !border-none" />
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

const BlueprintCanvas: React.FC = () => {
  const { selectModule, files } = useIDEStore();

  const initialNodes: Node[] = useMemo(() => {
    if (files.length === 0) {
      return [
        { 
          id: '1', 
          type: 'custom',
          position: { x: 120, y: 300 }, 
          data: { label: 'React Client', type: 'frontend', icon: 'desktop_windows' } 
        },
        { 
          id: '2', 
          type: 'custom',
          position: { x: 550, y: 300 }, 
          data: { label: 'LLM Gateway', type: 'router', icon: 'route' } 
        },
        { 
          id: '3', 
          type: 'custom',
          position: { x: 900, y: 150 }, 
          data: { label: 'Vector Store', type: 'storage', icon: 'database', color: 'accent-error' } 
        },
        { 
          id: '4', 
          type: 'custom',
          position: { x: 900, y: 450 }, 
          data: { label: 'OpenAI API', type: 'service', icon: 'cloud', color: 'accent-ai' } 
        },
      ];
    }

    // Dynamic Node Discovery based on files
    const nodes: Node[] = [];
    let x = 100;
    
    // Categorize files into nodes
    const categories = {
      api: { label: 'API Services', icon: 'api', files: [] as any[] },
      ui: { label: 'UI Components', icon: 'widgets', files: [] as any[] },
      data: { label: 'Data Layer', icon: 'database', files: [] as any[] },
      logic: { label: 'Core Logic', icon: 'settings', files: [] as any[] },
    };

    files.forEach(file => {
      if (file.path.includes('/api/')) categories.api.files.push(file);
      else if (file.path.includes('/components/')) categories.ui.files.push(file);
      else if (file.path.includes('/store/') || file.path.includes('/db/')) categories.data.files.push(file);
      else categories.logic.files.push(file);
    });

    Object.entries(categories).forEach(([key, cat], index) => {
      if (cat.files.length > 0) {
        nodes.push({
          id: key,
          type: 'custom',
          position: { x: 100 + index * 300, y: 200 + (index % 2) * 150 },
          data: { 
            label: cat.label, 
            type: key, 
            icon: cat.icon,
            count: cat.files.length 
          }
        });
      }
    });

    return nodes;
  }, [files]);

  const initialEdges: Edge[] = useMemo(() => {
    const edges: Edge[] = [];
    if (initialNodes.length > 1) {
      for (let i = 0; i < initialNodes.length - 1; i++) {
        edges.push({
          id: `e${i}-${i+1}`,
          source: initialNodes[i].id,
          target: initialNodes[i+1].id,
          animated: true,
          style: { stroke: '#00FFD1', strokeWidth: 2 },
          type: ConnectionLineType.SmoothStep
        });
      }
    }
    return edges;
  }, [initialNodes]);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    selectModule(node.data.label);
  }, [selectModule]);

  return (
    <div className="absolute inset-0 w-full h-full canvas-grid bg-background overflow-hidden">
      <ReactFlow
        nodes={initialNodes}
        edges={initialEdges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        fitView
        className="z-20"
      >
        <Background color="#1E222B" gap={20} />
        <Controls showInteractive={false} className="!bg-surface !border-muted !fill-muted" />
        <Panel position="bottom-center">
          <div className="mb-6 h-10 bg-surface border border-muted flex items-center shadow-lg px-4 text-[10px] font-mono text-text-main">
            NEON PROTOCOL CANVAS V1.0
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
};

export default BlueprintCanvas;
