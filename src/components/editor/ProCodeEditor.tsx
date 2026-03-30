import React from 'react';

const ProCodeEditor: React.FC = () => {
  return (
    <div className="flex-1 h-full flex flex-col bg-background relative overflow-hidden">
      {/* Editor Tabs */}
      <div className="h-9 flex bg-surface border-b border-muted/30 shrink-0 overflow-x-auto z-20">
        <div className="flex items-center gap-2 px-4 bg-background border-t-2 border-primary min-w-fit cursor-pointer">
          <span className="material-symbols-outlined text-[14px] text-blue-400">code</span>
          <span className="font-mono text-xs text-text-main">router.ts</span>
        </div>
        <div className="flex items-center gap-2 px-4 bg-surface border-r border-muted/10 min-w-fit cursor-pointer hover:bg-surface-hover transition-all">
          <span className="material-symbols-outlined text-[14px] text-blue-400">code</span>
          <span className="font-mono text-xs text-muted">types.ts</span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Line Numbers */}
        <div className="w-10 bg-background border-r border-muted/10 flex flex-col pt-4 pb-4 font-mono text-[10px] text-muted text-right pr-2 select-none shrink-0">
          {[...Array(20)].map((_, i) => (
            <div key={i} className={i === 6 ? "text-text-main bg-surface-hover" : ""}>{i + 1}</div>
          ))}
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed whitespace-pre font-medium text-text-main">
          <span className="text-accent-error">import</span> {'{'} <span className="text-text-main">OllamaClient</span>, <span className="text-text-main">OpenAIClient</span> {'}'} <span className="text-accent-error">from</span> <span className="text-accent-ai">'@nexus/providers'</span>;{'\n'}
          <span className="text-accent-error">import</span> {'{'} <span className="text-text-main">RouteConfig</span> {'}'} <span className="text-accent-error">from</span> <span className="text-accent-ai">'./types'</span>;{'\n\n'}
          <span className="text-muted">// Primary routing logic for incoming LLM requests</span>{'\n'}
          <span className="text-accent-error">export async function</span> <span className="text-primary cursor-pointer">routeRequest</span>(<span className="text-text-main">prompt</span>: <span className="text-accent-error">string</span>, <span className="text-text-main">config</span>: <span className="text-text-main">RouteConfig</span>) {'{'}{'\n'}
          {'  '}<span className="text-accent-error">const</span> <span className="text-text-main">complexityScore</span> = <span className="text-accent-error">await</span> <span className="text-primary">analyzePrompt</span>(<span className="text-text-main">prompt</span>);{'\n\n'}
          <div className="bg-surface-hover -mx-4 px-4 border-l-2 border-primary w-full inline-block">
          {'  '}<span className="text-accent-error">if</span> (<span className="text-text-main">complexityScore</span> {'<'} <span className="text-text-main">config</span>.<span className="text-text-main">threshold</span>) {'{'}{'\n'}
          {'    '}<span className="text-muted">// Fast, local execution for simple tasks</span>{'\n'}
          {'    '}<span className="text-accent-error">return</span> <span className="text-text-main">OllamaClient</span>.<span className="text-primary">generate</span>({'{\n'}
          {'      '}<span className="text-text-main">model</span>: <span className="text-accent-ai">'llama3:8b'</span>,{'\n'}
          {'      '}<span className="text-text-main">prompt</span>: <span className="text-text-main">prompt</span>{'\n'}
          {'    '}{'});\n'}
          {'  '}{'}'}
          </div>{'\n'}
          {'  '}<span className="text-muted">// Complex tasks routed to cloud provider</span>{'\n'}
          {'  '}<span className="text-accent-error">return</span> <span className="text-text-main">OpenAIClient</span>.<span className="text-primary">generate</span>({'{\n'}
          {'    '}<span className="text-text-main">model</span>: <span className="text-accent-ai">'gpt-4-turbo'</span>,{'\n'}
          {'    '}<span className="text-text-main">prompt</span>: <span className="text-text-main">prompt</span>{'\n'}
          {'  '}{'});\n'}
          {'}'}
        </div>

        {/* Right Panel: Copilot Sidebar */}
        <aside className="w-[240px] bg-surface border-l border-muted/30 flex flex-col shrink-0">
          <div className="h-9 flex items-center justify-between px-3 border-b border-muted/30 bg-surface-hover">
            <div className="flex items-center gap-2 text-accent-ai">
              <span className="material-symbols-outlined text-base">smart_toy</span>
              <span className="text-[10px] font-display font-bold tracking-widest text-text-main uppercase">Copilot</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 text-xs">
            <div className="border-l-2 border-accent-ai pl-3">
              <div className="text-[10px] text-accent-ai font-bold mb-1 uppercase">Architect AI</div>
              <div className="text-text-main leading-snug">
                I noticed you're working on the routing logic. Would you like to implement a retry mechanism?
              </div>
              <button className="mt-2 px-3 py-1 bg-background border border-accent-ai/50 text-accent-ai text-[10px] font-bold hover:bg-accent-ai hover:text-background transition-colors">
                Generate Code
              </button>
            </div>
          </div>
          <div className="p-3 border-t border-muted/30 bg-background">
            <div className="relative flex items-center">
              <input 
                className="w-full bg-surface border border-muted/50 text-text-main text-xs p-2 pl-3 pr-8 focus:outline-none focus:border-accent-ai placeholder-muted" 
                placeholder="Ask copilot..." 
                type="text" 
              />
              <button className="absolute right-2 text-muted hover:text-accent-ai">
                <span className="material-symbols-outlined text-base">send</span>
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Terminal */}
      <div className="h-40 bg-background border-t border-muted/30 flex flex-col shrink-0">
        <div className="h-7 flex bg-surface border-b border-muted/30 px-2">
          <div className="flex items-center px-4 border-b-2 border-primary text-text-main text-[10px] font-bold uppercase tracking-wider cursor-pointer">
            Terminal
          </div>
          <div className="flex items-center px-4 text-muted hover:text-text-main text-[10px] font-medium uppercase tracking-wider cursor-pointer">
            Output
          </div>
        </div>
        <div className="flex-1 overflow-auto p-3 font-mono text-[11px] text-muted">
          <div className="mb-1"><span className="text-primary">nexus@dev</span><span className="text-text-main">:</span><span className="text-blue-400">~/projects/blueprint</span>$ npm run dev</div>
          <div className="mb-1 text-text-main">&gt; nexus-core@1.0.0 dev</div>
          <div className="mb-1 text-accent-ai">[Watcher] Starting in watch mode...</div>
          <div className="flex items-center mt-2">
            <span className="text-primary">nexus@dev</span><span className="text-text-main">:</span><span className="text-blue-400">~/projects/blueprint</span>$ <span className="w-1.5 h-3 bg-primary animate-pulse ml-2 inline-block"></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProCodeEditor;
