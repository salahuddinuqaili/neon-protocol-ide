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

const CustomNode = ({ data, selected }: any) => {
  return (
    <div className={`node-card w-[180px] h-[80px] bg-surface border flex flex-col justify-center px-4 cursor-pointer group transition-all relative
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
      <Handle type="source" position={Position.Right} className="!w-2 !h-4 !rounded-none !bg-muted !border-none" />
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

const BlueprintCanvas: React.FC = () => {
  const { selectModule } = useIDEStore();

  const initialNodes: Node[] = [
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

  const initialEdges: Edge[] = [
    { 
      id: 'e1-2', 
      source: '1', 
      target: '2', 
      animated: true, 
      style: { stroke: '#00FFD1', strokeWidth: 2 },
      type: ConnectionLineType.SmoothStep 
    },
    { 
      id: 'e2-3', 
      source: '2', 
      target: '3', 
      style: { stroke: '#4E5666', strokeWidth: 1.5 },
      type: ConnectionLineType.SmoothStep 
    },
    { 
      id: 'e2-4', 
      source: '2', 
      target: '4', 
      style: { stroke: '#4E5666', strokeWidth: 1.5 },
      type: ConnectionLineType.SmoothStep 
    },
  ];

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    selectModule(node.data.label);
  }, [selectModule]);

  return (
    <div className="absolute inset-0 w-full h-full canvas-grid bg-background overflow-hidden">
      <ReactFlow
        initialNodes={initialNodes}
        initialEdges={initialEdges}
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
