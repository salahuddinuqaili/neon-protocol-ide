"use client";

import React from 'react';
import { useIDEStore } from '../../store/useIDEStore';

const Header: React.FC = () => {
  const { currentView, setView } = useIDEStore();

  return (
    <header className="h-12 flex items-center justify-between px-6 bg-surface border-b border-muted/30 shrink-0 z-50">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-primary">
          <span className="material-symbols-outlined text-xl">architecture</span>
          <span className="font-display font-bold tracking-wide uppercase">Neon Protocol IDE</span>
        </div>
        <div id="breadcrumb" className="hidden md:flex items-center gap-2 text-sm font-mono text-muted ml-4 border-l border-muted/30 pl-4">
          <span className="text-text-main">nexus_core</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex bg-background border border-muted/30 p-0.5">
          <button 
            onClick={() => setView('blueprint')} 
            className={`px-4 py-1 text-sm font-display font-bold transition-all ${
              currentView === 'blueprint' ? 'bg-primary text-background shadow-neon' : 'text-muted hover:text-text-main'
            }`}
          >
            BLUEPRINT
          </button>
          <button 
            onClick={() => setView('code')} 
            className={`px-4 py-1 text-sm font-display font-bold transition-all ${
              currentView === 'code' ? 'bg-primary text-background shadow-neon' : 'text-muted hover:text-text-main'
            }`}
          >
            CODE
          </button>
        </div>
        <div className="flex items-center gap-3 border-l border-muted/30 pl-4">
          <button 
            onClick={() => setView('orchestrator')} 
            className={`transition-colors ${currentView === 'orchestrator' ? 'text-primary' : 'text-muted hover:text-primary'}`} 
            title="LLM Orchestrator"
          >
            <span className="material-symbols-outlined text-xl">route</span>
          </button>
          <button className="text-muted hover:text-text-main transition-colors">
            <span className="material-symbols-outlined text-xl">settings</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
