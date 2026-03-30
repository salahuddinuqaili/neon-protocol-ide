import React from 'react';
import { useIDEStore } from '../../store/useIDEStore';

const ModuleExplorer: React.FC = () => {
  const { selectedModule, isExplorerOpen, toggleExplorer, setView } = useIDEStore();

  const handleInspectCode = () => {
    setView('code');
    toggleExplorer(false);
  };

  return (
    <div 
      className={`absolute right-0 top-0 h-full w-[450px] bg-surface border-l border-muted flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.5)] z-50 transform transition-transform duration-300 ease-in-out ${
        isExplorerOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-muted bg-background">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-surface-hover border border-primary flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-sm">router</span>
          </div>
          <div>
            <h2 className="text-sm font-bold text-text-main tracking-tight">{selectedModule || 'Select a Module'}</h2>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
              <span className="text-[9px] text-primary font-mono uppercase tracking-widest">Active</span>
            </div>
          </div>
        </div>
        <button onClick={() => toggleExplorer(false)} className="text-muted hover:text-text-main p-1 transition-colors">
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/50">
        <div className="flex gap-3 w-full">
          <div className="w-6 h-6 rounded bg-surface border border-accent-ai flex items-center justify-center text-accent-ai shrink-0 mt-1">
            <span className="material-symbols-outlined text-[14px]">smart_toy</span>
          </div>
          <div className="flex flex-col gap-1 w-full">
            <span className="text-[9px] text-muted font-mono uppercase">Architect Copilot</span>
            <div className="bg-surface-hover border-l-2 border-accent-ai p-3 text-xs text-text-main font-mono leading-relaxed">
              I'm analyzing the <code className="text-accent-ai">{selectedModule}</code>. This component handles token-based routing between Ollama and Cloud providers.
            </div>
          </div>
        </div>
        
        <div id="chat-history" className="space-y-4">
          {/* Messages would go here */}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-3 bg-background border-t border-muted">
        <div className="relative flex items-center">
          <input 
            className="w-full bg-surface border border-muted text-xs font-mono p-2.5 pr-10 focus:outline-none focus:border-primary placeholder-muted" 
            placeholder="Ask about this module..." 
            type="text" 
          />
          <button className="absolute right-2 text-muted hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-sm">send</span>
          </button>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="border-t border-muted bg-background">
        <button 
          onClick={handleInspectCode}
          className="w-full bg-primary hover:bg-[#0cf1f1] text-background font-bold py-4 flex items-center justify-center gap-2 transition-all group"
        >
          <span className="material-symbols-outlined text-sm">code_blocks</span>
          <span className="tracking-wide text-xs">INSPECT CODE</span>
        </button>
      </div>
    </div>
  );
};

export default ModuleExplorer;
