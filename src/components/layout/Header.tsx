"use client";

import React from 'react';
import { useIDEStore } from '../../store/useIDEStore';

interface HeaderProps {
  onOpenSettings?: () => void;
}

const HELP_TEXT: Record<string, { title: string; body: string }> = {
  blueprint: {
    title: 'Visual Map',
    body: 'This is a bird\'s-eye view of your project. Each box represents a group of related files (like pages, data, or APIs). Click a box to learn more. Drag to rearrange. Use "Add Node" to create your own boxes.',
  },
  code: {
    title: 'Code Editor',
    body: 'This is where you read and edit code files. Click a file in the left sidebar to open it. The AI copilot on the right side can explain code or help you write changes. Press Ctrl+S to save.',
  },
  orchestrator: {
    title: 'AI Settings',
    body: 'Connect AI models to power the copilot assistant. Ollama is free and runs on your computer — install it from ollama.com. You can also use cloud services like OpenAI or Anthropic by entering an API key.',
  },
};

const Header: React.FC<HeaderProps> = ({ onOpenSettings }) => {
  const { currentView, setView, projectPath, activeFile } = useIDEStore();
  const [helpOpen, setHelpOpen] = React.useState(false);

  const activeFileName = activeFile?.split('/').pop();
  const help = HELP_TEXT[currentView];

  return (
    <header className="h-12 flex items-center justify-between px-6 bg-surface border-b border-muted/30 shrink-0 z-50">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-primary">
          <span className="material-symbols-outlined text-xl">architecture</span>
          <span className="font-display font-bold tracking-wide uppercase">Neon Protocol IDE</span>
        </div>
        <div className="hidden md:flex items-center gap-1 text-xs font-mono text-muted ml-4 border-l border-muted/30 pl-4">
          {projectPath ? (
            <>
              <span className="text-text-main">{projectPath}</span>
              {activeFileName && currentView === 'code' && (
                <>
                  <span className="text-muted/50">/</span>
                  <span className="text-primary">{activeFileName}</span>
                </>
              )}
            </>
          ) : (
            <span className="text-muted/50 italic">no project</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex bg-background border border-muted/30 p-0.5">
          <button
            onClick={() => setView('blueprint')}
            title="Visual map of your project (Ctrl+1)"
            aria-label="Switch to visual map"
            className={`flex items-center gap-1.5 px-4 py-1 text-sm font-display font-bold transition-all ${
              currentView === 'blueprint' ? 'bg-primary text-background shadow-neon' : 'text-muted hover:text-text-main'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">map</span>
            MAP
          </button>
          <button
            onClick={() => setView('code')}
            title="Edit code files (Ctrl+2)"
            aria-label="Switch to code editor"
            className={`flex items-center gap-1.5 px-4 py-1 text-sm font-display font-bold transition-all ${
              currentView === 'code' ? 'bg-primary text-background shadow-neon' : 'text-muted hover:text-text-main'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">code</span>
            CODE
          </button>
          <button
            onClick={() => setView('orchestrator')}
            title="AI assistant settings (Ctrl+3)"
            aria-label="Switch to AI settings"
            className={`flex items-center gap-1.5 px-4 py-1 text-sm font-display font-bold transition-all ${
              currentView === 'orchestrator' ? 'bg-primary text-background shadow-neon' : 'text-muted hover:text-text-main'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">smart_toy</span>
            AI
          </button>
        </div>
        <div className="flex items-center gap-3 border-l border-muted/30 pl-4">
          <div className="relative">
            <button
              onClick={() => setHelpOpen(h => !h)}
              className={`transition-colors ${helpOpen ? 'text-primary' : 'text-muted hover:text-text-main'}`}
              title="Help — what is this view?"
              aria-label="Help"
            >
              <span className="material-symbols-outlined text-xl">help</span>
            </button>
            {helpOpen && help && (
              <>
                <div className="fixed inset-0 z-[100]" onClick={() => setHelpOpen(false)} />
                <div className="absolute right-0 top-10 z-[101] w-72 bg-surface border border-primary shadow-neon p-4">
                  <h4 className="text-sm font-bold text-primary mb-2">{help.title}</h4>
                  <p className="text-xs text-text-main leading-relaxed">{help.body}</p>
                  <button
                    onClick={() => setHelpOpen(false)}
                    className="mt-3 text-[10px] text-muted hover:text-text-main font-mono"
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
          <button onClick={onOpenSettings} className="text-muted hover:text-text-main transition-colors" title="Settings (Ctrl+,)" aria-label="Open settings">
            <span className="material-symbols-outlined text-xl">settings</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
