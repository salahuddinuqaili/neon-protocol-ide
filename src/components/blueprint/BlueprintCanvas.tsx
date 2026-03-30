import React from 'react';
import { useIDEStore } from '../../store/useIDEStore';

const BlueprintCanvas: React.FC = () => {
  const { selectModule } = useIDEStore();

  const nodes = [
    { id: '1', name: 'React Client', type: 'frontend', top: 300, left: 120, icon: 'desktop_windows' },
    { id: '2', name: 'LLM Gateway', type: 'router', top: 300, left: 550, icon: 'route', active: true },
    { id: '3', name: 'Vector Store', type: 'storage', top: 150, left: 900, icon: 'database', color: 'accent-error' },
    { id: '4', name: 'OpenAI API', type: 'service', top: 450, left: 900, icon: 'cloud', color: 'accent-ai' },
  ];

  return (
    <div className="absolute inset-0 w-full h-full view-active relative canvas-grid bg-background overflow-hidden">
      <svg id="blueprint-canvas" className="absolute inset-0 w-full h-full pointer-events-none z-10">
        <defs>
          <filter id="glow">
            <feGaussianBlur result="coloredBlur" stdDeviation="2.5"></feGaussianBlur>
            <feMerge>
              <feMergeNode in="coloredBlur"></feMergeNode>
              <feMergeNode in="SourceGraphic"></feMergeNode>
            </feMerge>
          </filter>
        </defs>
        <path d="M 300 340 C 425 340, 425 340, 550 340" fill="none" stroke="#4E5666" strokeWidth="2"></path>
        <path className="flow-line" d="M 300 340 C 425 340, 425 340, 550 340" fill="none" filter="url(#glow)" stroke="#00FFD1" strokeWidth="2" style={{ strokeDasharray: '8 4', animation: 'flow 1s linear infinite' }}></path>
        <path d="M 730 320 C 815 320, 815 190, 900 190" fill="none" stroke="#4E5666" strokeWidth="1.5"></path>
        <path d="M 730 360 C 815 360, 815 490, 900 490" fill="none" stroke="#4E5666" strokeWidth="1.5"></path>
      </svg>

      <div className="absolute inset-0 w-full h-full z-20">
        {nodes.map((node) => (
          <div 
            key={node.id}
            onClick={() => selectModule(node.name)} 
            className={`node-card absolute w-[180px] h-[80px] bg-surface border flex flex-col justify-center px-4 cursor-pointer group transition-all
              ${node.active ? 'border-primary shadow-neon-active z-30' : 'border-muted hover:border-primary hover:shadow-neon'}
              ${node.color === 'accent-error' ? 'hover:border-accent-error' : ''}
              ${node.color === 'accent-ai' ? 'hover:border-accent-ai' : ''}
            `}
            style={{ top: node.top, left: node.left }}
          >
            {node.active && <div className="absolute left-[-5px] top-1/2 -translate-y-1/2 w-2 h-4 bg-primary"></div>}
            {!node.active && <div className={`absolute ${node.left > 500 ? 'left-[-5px]' : 'right-[-5px]'} top-1/2 -translate-y-1/2 w-2 h-4 bg-muted group-hover:bg-primary transition-colors`}></div>}
            
            <div className="flex items-center justify-between w-full mb-1">
              <span className={`text-[10px] font-mono uppercase tracking-wider ${node.active ? 'text-primary' : 'text-muted'}`}>
                {node.type}
              </span>
              {node.icon && <span className={`material-symbols-outlined text-[14px] ${node.active ? 'text-primary' : node.color ? `text-${node.color}` : 'text-muted'}`}>{node.icon}</span>}
              {!node.icon && <div className="w-2 h-2 bg-primary rounded-full shadow-neon"></div>}
            </div>
            <h3 className="text-text-main font-bold text-sm truncate">{node.name}</h3>
            
            {node.active && (
              <>
                <div className="absolute right-[-5px] top-[20px] w-2 h-4 bg-muted group-hover:bg-primary transition-colors"></div>
                <div className="absolute right-[-5px] bottom-[20px] w-2 h-4 bg-muted group-hover:bg-primary transition-colors"></div>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 h-10 bg-surface border border-muted flex items-center shadow-lg">
        <button className="h-full px-3 text-muted hover:text-primary hover:bg-surface-hover border-r border-muted transition-colors">
          <span className="material-symbols-outlined text-[20px]">remove</span>
        </button>
        <div className="px-4 text-[10px] font-mono text-text-main select-none">100%</div>
        <button className="h-full px-3 text-muted hover:text-primary hover:bg-surface-hover border-l border-muted transition-colors">
          <span className="material-symbols-outlined text-[20px]">add</span>
        </button>
      </div>
    </div>
  );
};

export default BlueprintCanvas;
