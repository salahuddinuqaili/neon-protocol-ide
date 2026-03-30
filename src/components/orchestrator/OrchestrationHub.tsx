import React from 'react';

const OrchestrationHub: React.FC = () => {
  return (
    <div className="flex-1 h-full flex flex-col bg-background overflow-hidden">
      <div className="flex h-full">
        {/* Left Pane: Configuration Matrix */}
        <section className="w-1/2 flex flex-col border-r border-muted/30 bg-background relative">
          <div className="p-6 border-b border-muted/30 bg-surface/50">
            <h1 className="text-xl font-bold text-text-main flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">route</span>
              LLM Routing & Fallback Chain
            </h1>
            <p className="text-muted text-[10px] mt-1 font-mono uppercase tracking-wider">Redundancy Configuration</p>
          </div>
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
            {/* Primary Provider */}
            <div className="w-full bg-surface border border-muted flex items-center h-12 shadow-neon relative cursor-grab">
              <div className="absolute -left-[1px] top-0 bottom-0 w-[2px] bg-primary"></div>
              <div className="px-3 text-muted"><span className="material-symbols-outlined text-sm">drag_indicator</span></div>
              <div className="flex-1 flex items-center gap-4 px-2 text-xs font-mono">
                <span className="text-text-main">OpenAI</span>
                <span className="text-muted">gpt-4-turbo</span>
              </div>
              <div className="px-4 flex items-center gap-2 border-l border-muted/30 h-full">
                <span className="text-[9px] text-primary font-bold uppercase tracking-widest">Primary</span>
              </div>
            </div>
            
            <div className="flex justify-center -my-2 relative"><div className="h-6 w-px bg-muted"></div></div>
            
            {/* Fallback Provider */}
            <div className="w-full bg-surface border border-muted flex items-center h-12 cursor-grab">
              <div className="px-3 text-muted"><span className="material-symbols-outlined text-sm">drag_indicator</span></div>
              <div className="flex-1 flex items-center gap-4 px-2 text-xs font-mono">
                <span className="text-text-main">Anthropic</span>
                <span className="text-muted">claude-3-sonnet</span>
              </div>
              <div className="px-4 flex items-center gap-2 border-l border-muted/30 h-full">
                <span className="text-[9px] text-accent-ai font-bold uppercase tracking-widest">Fallback</span>
              </div>
            </div>
            
            <div className="flex justify-center -my-2 relative"><div className="h-6 w-px bg-muted"></div></div>
            
            {/* Local Provider */}
            <div className="w-full bg-surface border border-muted flex items-center h-12 cursor-grab opacity-50">
              <div className="px-3 text-muted"><span className="material-symbols-outlined text-sm">drag_indicator</span></div>
              <div className="flex-1 flex items-center gap-4 px-2 text-xs font-mono">
                <span className="text-text-main">Ollama</span>
                <span className="text-muted">llama3:8b</span>
              </div>
              <div className="px-4 flex items-center gap-2 border-l border-muted/30 h-full">
                <span className="text-[9px] text-muted font-bold uppercase tracking-widest">Offline</span>
              </div>
            </div>
          </div>
        </section>

        {/* Right Pane: Test Playground */}
        <section className="w-1/2 flex flex-col bg-background">
          <div className="p-6 border-b border-muted/30 bg-surface/30">
            <h2 className="text-lg font-bold text-text-main flex items-center gap-2">
              <span className="material-symbols-outlined text-accent-ai">science</span>
              Test Playground
            </h2>
          </div>
          <div className="flex-1 p-6 flex flex-col gap-4">
            <textarea 
              className="w-full h-32 bg-surface border border-muted text-text-main font-mono text-xs p-4 outline-none focus:border-primary placeholder-muted" 
              placeholder="Type test prompt here..."
            ></textarea>
            <button className="bg-primary text-background px-6 py-2 font-bold text-xs shadow-neon self-start uppercase tracking-widest hover:bg-[#0cf1f1] transition-all">Run Test</button>
            <div className="flex-1 bg-surface/20 border border-muted p-4 font-mono text-[11px] text-muted overflow-y-auto">
              <span className="text-primary">> System ready.</span><br />
              Click "Run Test" to analyze routing.
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default OrchestrationHub;
