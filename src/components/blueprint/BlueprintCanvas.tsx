import React from 'react';
import { useIDEStore } from '../../store/useIDEStore';

const BlueprintCanvas: React.FC = () => {
  const { selectModule } = useIDEStore();

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
        {/* Node 1 */}
        <div onClick={() => selectModule('React Client')} className="node-card absolute top-[300px] left-[120px] w-[180px] h-[80px] bg-surface border border-muted flex flex-col justify-center px-4 cursor-pointer group hover:border-primary hover:shadow-neon transition-all">
          <div className="flex items-center justify-between w-full mb-1">
            <span className="text-[10px] font-mono text-muted uppercase tracking-wider">Frontend</span>
            <div className="w-2 h-2 bg-primary rounded-full shadow-neon"></div>
          </div>
          <h3 className="text-text-main font-bold text-sm truncate">React Client</h3>
          <div className="absolute right-[-5px] top-1/2 -translate-y-1/2 w-2 h-4 bg-muted group-hover:bg-primary transition-colors"></div>
        </div>

        {/* Node 2 */}
        <div onClick={() => selectModule('LLM Gateway')} className="node-card absolute top-[300px] left-[550px] w-[180px] h-[80px] bg-surface border-primary shadow-neon-active flex flex-col justify-center px-4 cursor-pointer group z-30">
          <div className="absolute left-[-5px] top-1/2 -translate-y-1/2 w-2 h-4 bg-primary"></div>
          <div className="flex items-center justify-between w-full mb-1">
            <span className="text-[10px] font-mono text-primary uppercase tracking-wider">Router</span>
            <span className="material-symbols-outlined text-[14px] text-primary">route</span>
          </div>
          <h3 className="text-text-main font-bold text-sm truncate">LLM Gateway</h3>
          <div className="absolute right-[-5px] top-[20px] w-2 h-4 bg-muted group-hover:bg-primary transition-colors"></div>
          <div className="absolute right-[-5px] bottom-[20px] w-2 h-4 bg-muted group-hover:bg-primary transition-colors"></div>
        </div>

        {/* Node 3 */}
        <div onClick={() => selectModule('Vector Store')} className="node-card absolute top-[150px] left-[900px] w-[180px] h-[80px] bg-surface border border-muted flex flex-col justify-center px-4 cursor-pointer group hover:border-accent-error hover:shadow-neon transition-all">
          <div className="absolute left-[-5px] top-1/2 -translate-y-1/2 w-2 h-4 bg-muted group-hover:bg-accent-error transition-colors"></div>
          <div className="flex items-center justify-between w-full mb-1">
            <span className="text-[10px] font-mono text-muted uppercase tracking-wider">Storage</span>
            <span className="material-symbols-outlined text-[14px] text-accent-error">database</span>
          </div>
          <h3 className="text-text-main font-bold text-sm truncate">Vector Store</h3>
        </div>

        {/* Node 4 */}
        <div onClick={() => selectModule('OpenAI API')} className="node-card absolute top-[450px] left-[900px] w-[180px] h-[80px] bg-surface border border-muted flex flex-col justify-center px-4 cursor-pointer group hover:border-accent-ai hover:shadow-neon transition-all">
          <div className="absolute left-[-5px] top-1/2 -translate-y-1/2 w-2 h-4 bg-muted group-hover:bg-accent-ai transition-colors"></div>
          <div className="flex items-center justify-between w-full mb-1">
            <span className="text-[10px] font-mono text-muted uppercase tracking-wider">Service</span>
            <span className="material-symbols-outlined text-[14px] text-accent-ai">cloud</span>
          </div>
          <h3 className="text-text-main font-bold text-sm truncate">OpenAI API</h3>
        </div>
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
