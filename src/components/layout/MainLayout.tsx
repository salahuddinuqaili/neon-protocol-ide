"use client";

import React, { Suspense, lazy, useEffect, useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import ModuleExplorer from '../copilot/ModuleExplorer';
import GlossaryPanel from '../learning/GlossaryPanel';
import WelcomeScreen from '../onboarding/WelcomeScreen';
import QuickOpen from '../search/QuickOpen';
import GlobalSearch from '../search/GlobalSearch';
import SettingsPanel from '../settings/SettingsPanel';
import ToastContainer from '../notifications/ToastContainer';
import TutorialOverlay from '../onboarding/TutorialOverlay';
import LearningPathPanel from '../learning/LearningPathPanel';
import ErrorBoundary from '../ErrorBoundary';
import BranchSwitcher from '../git/BranchSwitcher';
import { useGitPolling } from '../../hooks/useGitPolling';
import { useIDEStore } from '../../store/useIDEStore';

const BlueprintCanvas = lazy(() => import('../blueprint/BlueprintCanvas'));
const ProCodeEditor = lazy(() => import('../editor/ProCodeEditor'));
const OrchestrationHub = lazy(() => import('../orchestrator/OrchestrationHub'));
const TerminalPanel = lazy(() => import('../terminal/TerminalPanel'));

const ViewLoader: React.FC = () => (
  <div className="flex-1 flex items-center justify-center bg-background">
    <div className="flex items-center gap-3 text-muted text-xs font-mono uppercase tracking-widest">
      <span className="w-2 h-2 bg-primary animate-pulse" />
      Loading module...
    </div>
  </div>
);

const MainLayout: React.FC = () => {
  const { currentView, gitBranch, gitState, ollamaStatus, setOllamaStatus, setView, hasCompletedOnboarding, isSidebarOpen, toggleSidebar, learningMode, setLearningMode, providers } = useIDEStore();
  const { refresh: refreshGit } = useGitPolling();
  const [quickOpenVisible, setQuickOpenVisible] = useState(false);
  const [globalSearchVisible, setGlobalSearchVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept shortcuts when typing in inputs/textareas
      const tag = (e.target as HTMLElement)?.tagName;
      const isEditorFocused = (e.target as HTMLElement)?.closest('.monaco-editor') !== null;
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA';

      // These shortcuts always work (modal openers)
      if (e.ctrlKey && e.key === 'p' && !e.shiftKey) {
        e.preventDefault();
        setQuickOpenVisible(v => !v);
        return;
      }
      if (e.ctrlKey && e.key === ',') {
        e.preventDefault();
        setSettingsVisible(v => !v);
        return;
      }

      // These only fire when not in Monaco or an input
      if (isEditorFocused || isInput) return;

      if (e.ctrlKey && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        setGlobalSearchVisible(v => !v);
      }
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
      if (e.ctrlKey && e.key === '1') { e.preventDefault(); setView('blueprint'); }
      if (e.ctrlKey && e.key === '2') { e.preventDefault(); setView('code'); }
      if (e.ctrlKey && e.key === '3') { e.preventDefault(); setView('orchestrator'); }
    if (e.ctrlKey && e.key === '4') { e.preventDefault(); setView('terminal'); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setView, toggleSidebar]);

  // Warn before closing with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const { files } = useIDEStore.getState();
      if (files.some(f => f.isDirty)) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Auto-detect RAM from Electron if available
  useEffect(() => {
    const api = (window as any).electronAPI;
    if (api?.systemRamGb && api.systemRamGb > 0) {
      const { updateEditorSettings } = useIDEStore.getState();
      updateEditorSettings({ systemRamGb: api.systemRamGb });
    }
  }, []);

  // Check Ollama status on mount — verify response is actually Ollama
  useEffect(() => {
    const checkOllama = async () => {
      try {
        const response = await fetch('http://localhost:11434/api/version', { signal: AbortSignal.timeout(3000) });
        if (!response.ok) { setOllamaStatus('offline'); return; }
        const data = await response.json();
        // Ollama returns { version: "0.x.y" } — verify it's really Ollama
        if (data && typeof data.version === 'string') {
          setOllamaStatus('active');
        } else {
          setOllamaStatus('offline');
        }
      } catch {
        setOllamaStatus('offline');
      }
    };
    checkOllama();
    const interval = setInterval(checkOllama, 30000);
    return () => clearInterval(interval);
  }, [setOllamaStatus]);

  return (
    <div className="h-screen w-screen flex flex-col bg-background text-text-main overflow-hidden font-display">
      {!hasCompletedOnboarding && <WelcomeScreen />}
      <QuickOpen isOpen={quickOpenVisible} onClose={() => setQuickOpenVisible(false)} />
      <GlobalSearch isOpen={globalSearchVisible} onClose={() => setGlobalSearchVisible(false)} />
      <SettingsPanel isOpen={settingsVisible} onClose={() => setSettingsVisible(false)} />
      <Header onOpenSettings={() => setSettingsVisible(true)} />
      <main className="flex-1 flex overflow-hidden relative" role="main">
        {isSidebarOpen && <Sidebar />}
        <div className="flex-1 relative overflow-hidden" role="region" aria-label={`${currentView} view`}>
          {/* Render all views but hide inactive ones — prevents remount/state loss.
              Use absolute positioning instead of display:none so Monaco can measure its container. */}
          <div className={`absolute inset-0 ${currentView === 'blueprint' ? 'z-10' : 'z-0 pointer-events-none opacity-0'}`}>
            <ErrorBoundary fallbackTitle="blueprint view crashed">
              <Suspense fallback={<ViewLoader />}>
                <BlueprintCanvas />
              </Suspense>
            </ErrorBoundary>
          </div>
          <div className={`absolute inset-0 ${currentView === 'code' ? 'z-10' : 'z-0 pointer-events-none opacity-0'}`}>
            <ErrorBoundary fallbackTitle="code view crashed">
              <Suspense fallback={<ViewLoader />}>
                <ProCodeEditor />
              </Suspense>
            </ErrorBoundary>
          </div>
          <div className={`absolute inset-0 ${currentView === 'orchestrator' ? 'z-10' : 'z-0 pointer-events-none opacity-0'}`}>
            <ErrorBoundary fallbackTitle="AI view crashed">
              <Suspense fallback={<ViewLoader />}>
                <OrchestrationHub />
              </Suspense>
            </ErrorBoundary>
          </div>
          <div className={`absolute inset-0 ${currentView === 'terminal' ? 'z-10' : 'z-0 pointer-events-none opacity-0'}`}>
            <ErrorBoundary fallbackTitle="terminal view crashed">
              <Suspense fallback={<ViewLoader />}>
                <TerminalPanel />
              </Suspense>
            </ErrorBoundary>
          </div>
          <ModuleExplorer />
          <GlossaryPanel />
        </div>
      </main>
      
      {/* Global Footer — green/neon when AI is connected, warning orange otherwise */}
      <footer className={`h-6 flex items-center justify-between px-3 text-background text-[11px] font-mono font-bold shrink-0 z-50 transition-colors ${
        providers.some(p => p.enabled && p.connectionStatus === 'verified')
          ? 'bg-primary shadow-neon'
          : 'bg-accent-warning shadow-neon-warning'
      }`}>
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="flex items-center gap-1 hover:opacity-70 transition-opacity"
            title={`${isSidebarOpen ? 'Hide' : 'Show'} sidebar (Ctrl+B)`}
          >
            <span className="material-symbols-outlined text-[12px]">{isSidebarOpen ? 'left_panel_close' : 'left_panel_open'}</span>
          </button>
          <button
            onClick={() => setLearningMode(learningMode === 'beginner' ? 'experienced' : 'beginner')}
            className="flex items-center gap-1 hover:opacity-70 transition-opacity"
            title={`Learning mode: ${learningMode === 'beginner' ? 'Beginner' : 'Experienced'}`}
          >
            <span className="material-symbols-outlined text-[12px]">school</span>
          </button>
          {gitState.isGitRepo ? (
            <BranchSwitcher onRefresh={refreshGit} />
          ) : (
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">account_tree</span>
              <span>{gitBranch || 'no repo'}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setView('orchestrator')}
            className="flex items-center gap-1 hover:opacity-70 transition-opacity"
            title="AI provider status — click to configure"
          >
            <span className="material-symbols-outlined text-[12px]">
              {providers.some(p => p.enabled && p.connectionStatus === 'verified') ? 'cloud_done'
                : providers.some(p => p.enabled) ? 'cloud_sync' : 'cloud_off'}
            </span>
            <span>
              {providers.some(p => p.enabled && p.connectionStatus === 'verified')
                ? `AI: ${providers.find(p => p.enabled && p.connectionStatus === 'verified')!.name}`
                : providers.some(p => p.enabled)
                  ? 'AI: Not Verified'
                  : 'AI: Not Connected'}
            </span>
          </button>
          <span>UTF-8</span>
        </div>
      </footer>
      <ToastContainer />
      <TutorialOverlay />
      <LearningPathPanel />
    </div>
  );
};

export default MainLayout;
