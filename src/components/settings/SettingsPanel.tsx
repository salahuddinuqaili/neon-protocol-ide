"use client";

import React from 'react';
import { useIDEStore } from '../../store/useIDEStore';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const { editorSettings, updateEditorSettings, setView, learningMode, setLearningMode, resetLearningProgress, startTutorial } = useIDEStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-[600px] max-h-[70vh] bg-surface border border-muted shadow-lg shadow-black/50 flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-muted/30">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg">settings</span>
            <h2 className="text-sm font-bold text-text-main uppercase tracking-widest">Settings</h2>
          </div>
          <button onClick={onClose} className="text-muted hover:text-text-main transition-colors" aria-label="Close settings">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
          {/* Editor Section */}
          <section>
            <h3 className="text-xs font-bold text-muted uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">code</span>
              Editor
            </h3>
            <div className="space-y-3">
              {/* Font Size */}
              <div className="flex items-center justify-between py-2 border-b border-muted/10">
                <div>
                  <p className="text-xs text-text-main font-mono">Font Size</p>
                  <p className="text-[11px] text-muted">Editor font size in pixels</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateEditorSettings({ fontSize: Math.max(10, editorSettings.fontSize - 1) })}
                    className="w-6 h-6 flex items-center justify-center bg-background border border-muted/30 text-muted hover:text-text-main hover:border-primary transition-colors text-xs"
                  >
                    -
                  </button>
                  <span className="text-xs text-text-main font-mono bg-background px-3 py-1 border border-muted/30 min-w-[40px] text-center">
                    {editorSettings.fontSize}
                  </span>
                  <button
                    onClick={() => updateEditorSettings({ fontSize: Math.min(24, editorSettings.fontSize + 1) })}
                    className="w-6 h-6 flex items-center justify-center bg-background border border-muted/30 text-muted hover:text-text-main hover:border-primary transition-colors text-xs"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Word Wrap */}
              <div className="flex items-center justify-between py-2 border-b border-muted/10">
                <div>
                  <p className="text-xs text-text-main font-mono">Word Wrap</p>
                  <p className="text-[11px] text-muted">Wrap long lines in the editor</p>
                </div>
                <button
                  onClick={() => updateEditorSettings({ wordWrap: !editorSettings.wordWrap })}
                  className={`text-xs font-mono px-3 py-1 border transition-colors ${
                    editorSettings.wordWrap
                      ? 'text-primary bg-primary/10 border-primary/30 hover:bg-primary/20'
                      : 'text-muted bg-background border-muted/30 hover:text-text-main'
                  }`}
                >
                  {editorSettings.wordWrap ? 'On' : 'Off'}
                </button>
              </div>

              {/* Minimap */}
              <div className="flex items-center justify-between py-2 border-b border-muted/10">
                <div>
                  <p className="text-xs text-text-main font-mono">Minimap</p>
                  <p className="text-[11px] text-muted">Show code minimap in editor</p>
                </div>
                <button
                  onClick={() => updateEditorSettings({ minimap: !editorSettings.minimap })}
                  className={`text-xs font-mono px-3 py-1 border transition-colors ${
                    editorSettings.minimap
                      ? 'text-primary bg-primary/10 border-primary/30 hover:bg-primary/20'
                      : 'text-muted bg-background border-muted/30 hover:text-text-main'
                  }`}
                >
                  {editorSettings.minimap ? 'On' : 'Off'}
                </button>
              </div>

              {/* Line Height */}
              <div className="flex items-center justify-between py-2 border-b border-muted/10">
                <div>
                  <p className="text-xs text-text-main font-mono">Line Height</p>
                  <p className="text-[11px] text-muted">Spacing between editor lines</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateEditorSettings({ lineHeight: Math.max(1.2, +(editorSettings.lineHeight - 0.1).toFixed(1)) })}
                    className="w-6 h-6 flex items-center justify-center bg-background border border-muted/30 text-muted hover:text-text-main hover:border-primary transition-colors text-xs"
                  >
                    -
                  </button>
                  <span className="text-xs text-text-main font-mono bg-background px-3 py-1 border border-muted/30 min-w-[40px] text-center">
                    {editorSettings.lineHeight.toFixed(1)}
                  </span>
                  <button
                    onClick={() => updateEditorSettings({ lineHeight: Math.min(2.5, +(editorSettings.lineHeight + 0.1).toFixed(1)) })}
                    className="w-6 h-6 flex items-center justify-center bg-background border border-muted/30 text-muted hover:text-text-main hover:border-primary transition-colors text-xs"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Learning */}
          <section>
            <h3 className="text-xs font-bold text-muted uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">school</span>
              Learning
            </h3>
            <div className="space-y-3">
              {/* Learning Mode */}
              <div className="flex items-center justify-between py-2 border-b border-muted/10">
                <div>
                  <p className="text-xs text-text-main font-mono">Learning Mode</p>
                  <p className="text-[11px] text-muted max-w-[300px]">Beginner mode shows tooltips, guided tutorials, and learning lessons. Experienced mode hides all learning overlays.</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setLearningMode('beginner')}
                    className={`text-xs font-mono px-3 py-1 border transition-colors ${
                      learningMode === 'beginner'
                        ? 'bg-primary text-background border-primary'
                        : 'bg-surface border border-muted/30 text-muted hover:text-text-main'
                    }`}
                  >
                    Beginner
                  </button>
                  <button
                    onClick={() => setLearningMode('experienced')}
                    className={`text-xs font-mono px-3 py-1 border transition-colors ${
                      learningMode === 'experienced'
                        ? 'bg-primary text-background border-primary'
                        : 'bg-surface border border-muted/30 text-muted hover:text-text-main'
                    }`}
                  >
                    Experienced
                  </button>
                </div>
              </div>

              {/* Reset Learning Progress */}
              <div className="flex items-center justify-between py-2 border-b border-muted/10">
                <div>
                  <p className="text-xs text-text-main font-mono">Reset Progress</p>
                  <p className="text-[11px] text-muted">Clear all learning progress and start fresh</p>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to reset all learning progress? This cannot be undone.')) {
                      resetLearningProgress();
                    }
                  }}
                  className="text-xs font-mono px-3 py-1 border transition-colors text-accent-error border-accent-error/30 hover:bg-accent-error/10"
                >
                  Reset Learning Progress
                </button>
              </div>

              {/* Restart Welcome Tour */}
              <div className="flex items-center justify-between py-2 border-b border-muted/10">
                <div>
                  <p className="text-xs text-text-main font-mono">Welcome Tour</p>
                  <p className="text-[11px] text-muted">Replay the introductory guided tour</p>
                </div>
                <button
                  onClick={() => { startTutorial('welcome-tour'); onClose(); }}
                  className="text-xs font-mono px-3 py-1 border transition-colors text-text-main border-muted hover:border-primary"
                >
                  Restart Welcome Tour
                </button>
              </div>
            </div>
          </section>

          {/* System */}
          <section>
            <h3 className="text-xs font-bold text-muted uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">memory</span>
              System
            </h3>
            <div className="flex items-center justify-between py-2 border-b border-muted/10">
              <div>
                <p className="text-xs text-text-main font-mono">System RAM</p>
                <p className="text-[11px] text-muted">Used for local AI model recommendations</p>
              </div>
              <div className="flex items-center gap-1">
                {[8, 16, 32, 64].map(gb => (
                  <button
                    key={gb}
                    onClick={() => updateEditorSettings({ systemRamGb: gb })}
                    className={`px-2 py-0.5 border text-[11px] font-bold transition-colors ${
                      editorSettings.systemRamGb === gb
                        ? 'bg-primary text-background border-primary'
                        : 'text-muted border-muted/30 hover:border-primary'
                    }`}
                  >
                    {gb}GB
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* AI Section */}
          <section>
            <h3 className="text-xs font-bold text-muted uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">smart_toy</span>
              AI Providers
            </h3>
            <div className="bg-background border border-muted/30 p-4 flex items-center justify-between">
              <p className="text-xs text-muted font-mono leading-relaxed">
                Configure LLM providers and routing in the Orchestrator view.
              </p>
              <button
                onClick={() => { setView('orchestrator'); onClose(); }}
                className="text-xs text-primary font-mono border border-primary/30 px-3 py-1 hover:bg-primary/10 transition-colors shrink-0 ml-3"
              >
                Open
              </button>
            </div>
          </section>

          {/* Keyboard Shortcuts */}
          <section>
            <h3 className="text-xs font-bold text-muted uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">keyboard</span>
              Keyboard Shortcuts
            </h3>
            <div className="space-y-1">
              {[
                ['Ctrl + S', 'Save current file'],
                ['Ctrl + P', 'Quick open file'],
                ['Ctrl + Shift + F', 'Search in files'],
                ['Ctrl + F', 'Find in file'],
                ['Ctrl + H', 'Find and replace'],
                ['Ctrl + B', 'Toggle sidebar'],
                ['Ctrl + 1', 'Blueprint view'],
                ['Ctrl + 2', 'Code view'],
                ['Ctrl + 3', 'Orchestrator view'],
                ['Ctrl + ,', 'Open settings'],
              ].map(([key, desc]) => (
                <div key={key} className="flex items-center justify-between py-1.5 border-b border-muted/10">
                  <span className="text-xs text-muted font-mono">{desc}</span>
                  <span className="text-[11px] text-text-main font-mono bg-background px-2 py-0.5 border border-muted/30">{key}</span>
                </div>
              ))}
            </div>
          </section>

          {/* About */}
          <section>
            <h3 className="text-xs font-bold text-muted uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">info</span>
              About
            </h3>
            <div className="text-xs text-muted font-mono space-y-1">
              <p>Neon Protocol IDE v1.0.0</p>
              <p>Blueprint-first agentic development environment</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
