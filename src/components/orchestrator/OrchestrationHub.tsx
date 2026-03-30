import React, { useState } from 'react';

const OrchestrationHub: React.FC = () => {
  const [testPrompt, setTestPrompt] = useState('');
  const [testLog, setTestLog] = useState<{msg: string, type: 'info' | 'primary' | 'ai'}[]>([
    { msg: '> System ready. Initializing routing matrix...', type: 'info' },
    { msg: '> Click "Run Test" to analyze routing.', type: 'info' }
  ]);
  const [isTesting, setIsTesting] = useState(false);

  const providers = [
    { id: '1', name: 'OpenAI', model: 'gpt-4-turbo', role: 'Primary', color: 'primary', status: 'Active' },
    { id: '2', name: 'Anthropic', model: 'claude-3-sonnet', role: 'Fallback', color: 'accent-ai', status: 'Active' },
    { id: '3', name: 'Ollama', model: 'llama3:8b', role: 'Offline', color: 'muted', status: 'Offline' },
  ];

  const runTest = async () => {
    if (!testPrompt) return;
    setIsTesting(true);
    setTestLog(prev => [...prev, { msg: `> ANALYZING PROMPT: "${testPrompt}"`, type: 'primary' }]);
    
    // Simulate routing logic
    setTimeout(() => {
      const complexity = testPrompt.length > 50 ? 'High' : 'Low';
      setTestLog(prev => [...prev, { msg: `> COMPLEXITY DETECTED: ${complexity}`, type: 'ai' }]);
      
      setTimeout(() => {
        const provider = complexity === 'High' ? 'OpenAI (Cloud)' : 'Ollama (Local)';
        setTestLog(prev => [...prev, { msg: `> ROUTING TO: ${provider}`, type: 'primary' }]);
        
        if (complexity === 'Low') {
          setTestLog(prev => [...prev, { msg: `> [ERROR] Ollama is OFFLINE. Triggering Fallback Chain...`, type: 'info' }]);
          setTimeout(() => {
            setTestLog(prev => [...prev, { msg: `> ROUTING TO: Anthropic (Cloud Fallback)`, type: 'ai' }]);
            setIsTesting(false);
          }, 800);
        } else {
          setIsTesting(false);
        }
      }, 1000);
    }, 1200);
  };

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
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-0">
            {providers.map((provider, index) => (
              <React.Fragment key={provider.id}>
                <div className={`w-full bg-surface border border-muted flex items-center h-12 relative cursor-grab transition-all hover:bg-surface-hover
                  ${provider.status === 'Offline' ? 'opacity-50' : 'shadow-neon'}
                `}>
                  {provider.role === 'Primary' && <div className="absolute -left-[1px] top-0 bottom-0 w-[2px] bg-primary"></div>}
                  <div className="px-3 text-muted"><span className="material-symbols-outlined text-sm">drag_indicator</span></div>
                  <div className="flex-1 flex items-center gap-4 px-2 text-xs font-mono">
                    <span className="text-text-main font-bold">{provider.name}</span>
                    <span className="text-muted">{provider.model}</span>
                  </div>
                  <div className="px-4 flex items-center gap-2 border-l border-muted/30 h-full min-w-[100px] justify-center">
                    <span className={`text-[9px] font-bold uppercase tracking-widest ${provider.color === 'primary' ? 'text-primary' : provider.color === 'accent-ai' ? 'text-accent-ai' : 'text-muted'}`}>
                      {provider.role}
                    </span>
                  </div>
                </div>
                {index < providers.length - 1 && (
                  <div className="flex justify-center my-1 relative"><div className="h-4 w-px bg-muted/30"></div></div>
                )}
              </React.Fragment>
            ))}
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
              value={testPrompt}
              onChange={(e) => setTestPrompt(e.target.value)}
              className="w-full h-32 bg-surface border border-muted text-text-main font-mono text-xs p-4 outline-none focus:border-primary placeholder-muted" 
              placeholder="Type test prompt here..."
            ></textarea>
            <button 
              onClick={runTest}
              disabled={isTesting}
              className={`bg-primary text-background px-6 py-2 font-bold text-xs shadow-neon self-start uppercase tracking-widest hover:bg-[#0cf1f1] transition-all
                ${isTesting ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {isTesting ? 'Testing...' : 'Run Test'}
            </button>
            <div className="flex-1 bg-surface/20 border border-muted p-4 font-mono text-[11px] text-muted overflow-y-auto custom-scrollbar flex flex-col gap-1">
              {testLog.map((log, i) => (
                <div key={i}>
                  <span className={log.type === 'primary' ? 'text-primary' : log.type === 'ai' ? 'text-accent-ai' : 'text-muted'}>
                    {log.msg}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default OrchestrationHub;
