"use client";

import React from 'react';
import { useIDEStore } from '../../store/useIDEStore';
import { LESSONS } from '../../data/lessons';
import { HELP_TEXT } from '../../config/education';

interface HeaderProps {
  onOpenSettings?: () => void;
}

const RING_R = 11;
const RING_CIRC = 2 * Math.PI * RING_R;

const Header: React.FC<HeaderProps> = ({ onOpenSettings }) => {
  const { currentView, setView, projectPath, activeFile, learningMode, toggleGlossary, toggleLearningPath, learningProgress } = useIDEStore();
  const [helpOpen, setHelpOpen] = React.useState(false);

  const totalLessons = LESSONS.length;
  const completedCount = learningProgress.completedLessons.length;
  const progress = totalLessons > 0 ? completedCount / totalLessons : 0;
  const allDone = completedCount >= totalLessons && totalLessons > 0;

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
            data-tutorial="view-toggle-blueprint"
            className={`flex items-center gap-1.5 px-4 py-1 text-sm font-display font-bold transition-all ${
              currentView === 'blueprint' ? 'bg-primary text-background shadow-neon' : 'text-muted hover:text-text-main'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">map</span>
            <span className="flex flex-col items-start leading-none">
              <span>{learningMode === 'beginner' ? 'Visual Map' : 'MAP'}</span>
              {learningMode === 'beginner' && <span className="text-[10px] font-mono font-normal opacity-70">see your app</span>}
            </span>
          </button>
          <button
            onClick={() => setView('code')}
            title="Edit code files (Ctrl+2)"
            aria-label="Switch to code editor"
            data-tutorial="view-toggle-code"
            className={`flex items-center gap-1.5 px-4 py-1 text-sm font-display font-bold transition-all ${
              currentView === 'code' ? 'bg-primary text-background shadow-neon' : 'text-muted hover:text-text-main'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">code</span>
            <span className="flex flex-col items-start leading-none">
              <span>{learningMode === 'beginner' ? 'Code Editor' : 'CODE'}</span>
              {learningMode === 'beginner' && <span className="text-[10px] font-mono font-normal opacity-70">edit files</span>}
            </span>
          </button>
          <button
            onClick={() => setView('orchestrator')}
            title="AI assistant settings (Ctrl+3)"
            aria-label="Switch to AI settings"
            data-tutorial="view-toggle-ai"
            className={`flex items-center gap-1.5 px-4 py-1 text-sm font-display font-bold transition-all ${
              currentView === 'orchestrator' ? 'bg-primary text-background shadow-neon' : 'text-muted hover:text-text-main'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">smart_toy</span>
            <span className="flex flex-col items-start leading-none">
              <span>{learningMode === 'beginner' ? 'AI Settings' : 'AI'}</span>
              {learningMode === 'beginner' && <span className="text-[10px] font-mono font-normal opacity-70">connect AI</span>}
            </span>
          </button>
        </div>
        <div className="flex items-center gap-3 border-l border-muted/30 pl-4">
          <button
            onClick={() => toggleLearningPath()}
            className="relative w-7 h-7 flex items-center justify-center group"
            title={allDone ? 'Learning Path — All lessons complete!' : `Learning Path — ${completedCount}/${totalLessons} lessons`}
            aria-label="Open learning path"
          >
            <svg className="absolute inset-0" width="28" height="28" viewBox="0 0 28 28">
              <circle cx="14" cy="14" r={RING_R} fill="none" strokeWidth="2" className="stroke-muted/20" />
              {progress > 0 && (
                <circle cx="14" cy="14" r={RING_R} fill="none" strokeWidth="2.5"
                  className="stroke-primary"
                  strokeDasharray={RING_CIRC}
                  strokeDashoffset={RING_CIRC * (1 - progress)}
                  strokeLinecap="round"
                  transform="rotate(-90 14 14)"
                  style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                />
              )}
            </svg>
            <span className={`material-symbols-outlined text-[18px] transition-colors ${allDone ? 'text-primary' : 'text-muted group-hover:text-text-main'}`}>
              {allDone ? 'check_circle' : 'school'}
            </span>
            {learningMode === 'beginner' && completedCount === 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full animate-pulse" />
            )}
          </button>
          {learningMode === 'beginner' && (
            <button
              onClick={() => toggleGlossary()}
              className="text-muted hover:text-text-main transition-colors"
              title="Glossary"
              aria-label="Open glossary"
            >
              <span className="material-symbols-outlined text-xl">menu_book</span>
            </button>
          )}
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
                    className="mt-3 text-xs text-muted hover:text-text-main font-mono"
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
