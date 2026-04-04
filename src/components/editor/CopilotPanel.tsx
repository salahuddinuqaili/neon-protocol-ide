"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useIDEStore } from '../../store/useIDEStore';
import { FileEntry } from '../../types';
import { routeChat } from '../../lib/llm/provider';
import ConceptTooltip from '../learning/ConceptTooltip';

interface CopilotPanelProps {
  currentFile: FileEntry | undefined;
}

const CopilotPanel: React.FC<CopilotPanelProps> = ({ currentFile }) => {
  const { providers, trackTokenUsage } = useIDEStore();

  const [copilotInput, setCopilotInput] = useState('');
  const [copilotMessages, setCopilotMessages] = useState<{ id: number; role: 'ai' | 'user'; text: string }[]>([]);
  const [copilotLoading, setCopilotLoading] = useState(false);
  const msgIdRef = useRef(0);
  const copilotEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    copilotEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [copilotMessages]);

  const hasEnabledProvider = providers.some(p => p.enabled);

  const handleCopilotSend = async () => {
    if (!copilotInput.trim() || copilotLoading) return;
    const userMsg = copilotInput.trim();
    setCopilotMessages(prev => [...prev, { id: ++msgIdRef.current, role: 'user', text: userMsg }]);
    setCopilotInput('');

    if (hasEnabledProvider) {
      setCopilotLoading(true);
      try {
        const context = currentFile
          ? `The user is editing "${currentFile.name}" (${currentFile.language}). Here are the first 100 lines:\n\`\`\`\n${currentFile.content.split('\n').slice(0, 100).join('\n')}\n\`\`\``
          : 'No file is currently open.';
        const result = await routeChat(
          providers,
          [
            { role: 'system', content: `You are a code copilot. Be concise. ${context}` },
            ...copilotMessages.map(m => ({
              role: m.role === 'ai' ? 'assistant' as const : 'user' as const,
              content: m.text,
            })),
            { role: 'user', content: userMsg },
          ]
        );
        setCopilotMessages(prev => [...prev, { id: ++msgIdRef.current, role: 'ai', text: result.content }]);
        trackTokenUsage(result.providerId, result.tokensUsed);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Connection failed';
        setCopilotMessages(prev => [...prev, { id: ++msgIdRef.current, role: 'ai', text: `Could not reach AI: ${msg}\n\nCheck your AI settings (AI button in the top bar).` }]);
      } finally {
        setCopilotLoading(false);
      }
    } else {
      setCopilotMessages(prev => [...prev, {
        id: ++msgIdRef.current,
        role: 'ai',
        text: `No AI provider connected. Click "AI: Not Connected" in the bottom bar, or switch to the AI Settings view to add a provider.`
      }]);
    }
  };

  return (
    <aside className="w-[260px] bg-surface border-l border-muted/30 flex flex-col shrink-0">
      <div className="h-9 flex items-center justify-between px-3 border-b border-muted/30 bg-surface-hover">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-base text-accent-ai">smart_toy</span>
          <span className="text-xs font-display font-bold tracking-widest text-text-main uppercase"><ConceptTooltip termId="copilot">COPILOT</ConceptTooltip></span>
        </div>
        <span className={`text-[10px] font-mono uppercase px-1.5 py-0.5 border ${
          hasEnabledProvider
            ? 'text-primary border-primary/30'
            : 'text-accent-ai border-accent-ai/30'
        }`}>
          {hasEnabledProvider ? 'AI Ready' : 'No AI'}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 text-xs custom-scrollbar">
        {copilotMessages.length === 0 && (
          <div className="border-l-2 border-accent-ai pl-3">
            <div className="text-xs text-accent-ai font-bold mb-1 uppercase">AI Copilot</div>
            <div className="text-text-main leading-relaxed">
              {currentFile ? (
                <>
                  You're looking at <strong className="text-primary">{currentFile.name}</strong>. Try asking:
                  <div className="mt-2 flex flex-col gap-1">
                    {['What does this file do?', 'Explain this code simply', 'How can I improve this?'].map(q => (
                      <button
                        key={q}
                        onClick={() => { setCopilotInput(q); }}
                        className="text-left text-xs text-accent-ai hover:text-text-main transition-colors px-2 py-1 bg-background/50 border border-accent-ai/20 hover:border-accent-ai/50"
                      >
                        "{q}"
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                'Open a file from the sidebar, then ask me questions about it in plain English.'
              )}
            </div>
          </div>
        )}
        {copilotMessages.map((msg) => (
          <div key={msg.id} className={`${msg.role === 'user' ? 'border-l-2 border-primary pl-3' : 'border-l-2 border-accent-ai pl-3'}`}>
            <div className={`text-xs font-bold mb-1 uppercase ${msg.role === 'user' ? 'text-primary' : 'text-accent-ai'}`}>
              {msg.role === 'user' ? 'You' : 'Copilot'}
            </div>
            <div className="text-text-main leading-relaxed whitespace-pre-wrap">{msg.text}</div>
          </div>
        ))}
        {copilotLoading && (
          <div className="border-l-2 border-accent-ai pl-3">
            <div className="text-xs text-accent-ai font-bold mb-1 uppercase">Copilot</div>
            <div className="flex items-center gap-2 text-muted">
              <span className="w-1.5 h-1.5 bg-accent-ai animate-pulse rounded-full" />
              Thinking...
            </div>
          </div>
        )}
        <div ref={copilotEndRef} />
      </div>
      <div className="p-3 border-t border-muted/30 bg-background">
        <div className="relative flex items-center">
          <input
            value={copilotInput}
            onChange={(e) => setCopilotInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCopilotSend()}
            disabled={copilotLoading}
            className="w-full bg-surface border border-muted/50 text-text-main text-xs p-2 pl-3 pr-8 focus:outline-none focus:border-accent-ai placeholder-muted disabled:opacity-50"
            placeholder={copilotLoading ? 'Thinking...' : 'Ask copilot...'}
            type="text"
          />
          <button
            onClick={handleCopilotSend}
            disabled={copilotLoading}
            className="absolute right-2 text-muted hover:text-accent-ai disabled:opacity-50 transition-colors"
          >
            <span className="material-symbols-outlined text-base">{copilotLoading ? 'hourglass_top' : 'send'}</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default CopilotPanel;
