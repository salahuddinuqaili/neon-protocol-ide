"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useIDEStore } from '../../store/useIDEStore';
import { routeChat } from '../../lib/llm/provider';
import ConceptTooltip from '../learning/ConceptTooltip';
import { NODE_EDUCATION } from '../../data/lessons';

const ModuleExplorer: React.FC = () => {
  const { selectedModule, isExplorerOpen, toggleExplorer, setView, activeFile, chatMessages, addChatMessage, clearChatMessages, providers, trackTokenUsage, learningMode } = useIDEStore();
  const [chatInput, setChatInput] = useState('');
  const [isResponding, setIsResponding] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const prevModuleRef = useRef<string | null>(null);

  // Clear chat when switching modules
  useEffect(() => {
    if (selectedModule && selectedModule !== prevModuleRef.current) {
      clearChatMessages();
    }
    prevModuleRef.current = selectedModule;
  }, [selectedModule, clearChatMessages]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleInspectCode = () => {
    setView('code');
    toggleExplorer(false);
  };

  const hasEnabledProvider = providers.some(p => p.enabled);

  const sendMessage = async () => {
    if (!chatInput || isResponding) return;
    const userMessage = chatInput;
    addChatMessage({ role: 'user', text: userMessage });
    setChatInput('');

    if (hasEnabledProvider) {
      setIsResponding(true);
      try {
        const result = await routeChat(
          providers,
          [
            { role: 'system', content: `You are an architecture copilot for the Neon Protocol IDE. The user is looking at the "${selectedModule || 'unknown'}" module. Be concise and helpful.` },
            ...chatMessages.map(m => ({ role: m.role === 'ai' ? 'assistant' as const : 'user' as const, content: m.text })),
            { role: 'user', content: userMessage },
          ]
        );
        addChatMessage({ role: 'ai', text: result.content });
        trackTokenUsage(result.providerId, result.tokensUsed);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Connection failed';
        addChatMessage({
          role: 'ai',
          text: `Could not reach the AI: ${msg}\n\nTip: Go to AI settings (click AI in the top bar) to check your connection.`
        });
      } finally {
        setIsResponding(false);
      }
    } else {
      addChatMessage({
        role: 'ai',
        text: `No AI provider is connected yet. Click "AI: Not Connected" in the bottom bar, or switch to the AI Settings view to add a provider.`
      });
    }
  };

  return (
    <div
      data-tutorial="module-explorer"
      className={`absolute right-0 top-0 h-full w-[450px] max-w-full bg-surface border-l border-muted flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.5)] z-50 transform transition-transform duration-300 ease-in-out ${
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
              <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${hasEnabledProvider ? 'bg-primary' : 'bg-accent-ai'}`}></div>
              <span className={`text-[11px] font-mono uppercase tracking-widest ${hasEnabledProvider ? 'text-primary' : 'text-accent-ai'}`}>
                {hasEnabledProvider ? 'AI Ready' : 'No AI Connected'}
              </span>
            </div>
          </div>
        </div>
        <button onClick={() => toggleExplorer(false)} className="text-muted hover:text-text-main p-1 transition-colors">
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/50 custom-scrollbar">
        {/* 🎓 LEARNER TIP: Beginner Insight Card */}
        {!selectedModule && (
          <div className="bg-surface-hover border border-primary/50 p-4">
            <div className="flex items-center gap-2 mb-2 text-primary">
              <span className="material-symbols-outlined text-sm">lightbulb</span>
              <span className="text-xs font-bold uppercase tracking-widest">Getting Started</span>
            </div>
            <p className="text-xs text-text-main leading-relaxed mb-3">
              Click any box on the <span className="text-primary font-bold">Map</span> to select it. Then you can ask the AI questions about it here.
            </p>
            <button
              onClick={() => { setView('blueprint'); toggleExplorer(false); }}
              className="text-xs text-primary font-bold flex items-center gap-1 hover:underline"
            >
              <span className="material-symbols-outlined text-[14px]">arrow_back</span>
              Go to the Map
            </button>
          </div>
        )}

        {/* Educational card for selected module (beginner mode) */}
        {selectedModule && learningMode === 'beginner' && NODE_EDUCATION[selectedModule] && (
          <div className="bg-surface-hover border border-accent-ai/30 p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-sm text-accent-ai">school</span>
              <span className="text-xs font-bold text-accent-ai uppercase tracking-widest">{NODE_EDUCATION[selectedModule].concept}</span>
            </div>
            <p className="text-xs text-text-main leading-relaxed mb-2">{NODE_EDUCATION[selectedModule].explanation}</p>
            <div className="bg-background/50 border border-muted/20 p-2 mt-2">
              <span className="text-[11px] text-muted font-mono uppercase block mb-1">Real-world analogy</span>
              <p className="text-xs text-muted leading-relaxed">{NODE_EDUCATION[selectedModule].realWorldAnalogy}</p>
            </div>
          </div>
        )}

        {selectedModule && chatMessages.length === 0 && (
          <div className="flex gap-3 w-full">
            <div className="w-6 h-6 rounded bg-surface border border-accent-ai flex items-center justify-center text-accent-ai shrink-0 mt-1">
              <span className="material-symbols-outlined text-[14px]">smart_toy</span>
            </div>
            <div className="flex flex-col gap-1 w-full">
              <span className="text-[11px] text-muted font-mono uppercase">Architect Copilot</span>
              <div className="bg-surface-hover border-l-2 border-accent-ai p-3 text-xs text-text-main font-mono leading-relaxed">
                I'm ready to discuss <code className="text-accent-ai">{selectedModule}</code>. Ask me about its <ConceptTooltip termId="module">architecture</ConceptTooltip>, <ConceptTooltip termId="dependency">dependencies</ConceptTooltip>, or how to improve it.
              </div>
            </div>
          </div>
        )}
        
        <div className="space-y-4">
          {chatMessages.map((msg, i) => (
            <div key={i} className={`flex gap-3 w-full ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-6 h-6 rounded border flex items-center justify-center shrink-0 mt-1 ${
                msg.role === 'ai' ? 'bg-surface border-accent-ai text-accent-ai' : 'bg-primary border-primary text-background'
              }`}>
                <span className="material-symbols-outlined text-[14px]">
                  {msg.role === 'ai' ? 'smart_toy' : 'person'}
                </span>
              </div>
              <div className={`flex flex-col gap-1 max-w-[80%] ${msg.role === 'user' ? 'items-end' : ''}`}>
                <span className="text-[11px] text-muted font-mono uppercase">
                  {msg.role === 'ai' ? 'Architect Copilot' : 'User'}
                </span>
                <div className={`p-3 text-xs font-mono leading-relaxed ${
                  msg.role === 'ai' 
                    ? 'bg-surface-hover border-l-2 border-accent-ai text-text-main' 
                    : 'bg-primary/10 border-r-2 border-primary text-text-main text-right'
                }`}>
                  {msg.text}
                </div>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="p-3 bg-background border-t border-muted">
        <div className="relative flex items-center">
          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            disabled={isResponding}
            className="w-full bg-surface border border-muted text-xs font-mono p-2.5 pr-10 focus:outline-none focus:border-primary placeholder-muted disabled:opacity-50"
            placeholder={isResponding ? 'Thinking...' : 'Ask about this module...'}
            type="text"
          />
          <button
            onClick={sendMessage}
            disabled={isResponding}
            className="absolute right-2 text-muted hover:text-primary transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-sm">{isResponding ? 'hourglass_top' : 'send'}</span>
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
