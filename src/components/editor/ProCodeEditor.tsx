"use client";

import React, { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { useIDEStore } from '../../store/useIDEStore';
import { FileEntry } from '../../types';
import { routeChat } from '../../lib/llm/provider';
import ViewHint from '../onboarding/ViewHint';
import ConceptTooltip from '../learning/ConceptTooltip';

const ProCodeEditor: React.FC = () => {
  const {
    files, openTabs, activeFile, setActiveFile, updateFileContent, closeTab, markFileSaved,
    editorSettings, addToast, projectPath, providers, trackTokenUsage
  } = useIDEStore();

  // Files that are open in tabs
  const tabFiles = openTabs.map(p => files.find(f => f.path === p)).filter(Boolean) as FileEntry[];

  const [copilotInput, setCopilotInput] = useState('');
  const [copilotMessages, setCopilotMessages] = useState<{ role: 'ai' | 'user'; text: string }[]>([]);
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotVisible, setCopilotVisible] = useState(true);
  const [terminalTab, setTerminalTab] = useState<'terminal' | 'output'>('terminal');
  const [terminalExpanded, setTerminalExpanded] = useState(false);
  const copilotEndRef = useRef<HTMLDivElement>(null);

  const currentFile = files.find(f => f.path === activeFile);

  useEffect(() => {
    copilotEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [copilotMessages]);

  const handleEditorChange = (value: string | undefined) => {
    if (activeFile && value !== undefined) {
      updateFileContent(activeFile, value);
    }
  };

  const handleSave = async () => {
    if (!currentFile) return;
    if (currentFile.handle) {
      try {
        const writable = await currentFile.handle.createWritable();
        await writable.write(currentFile.content);
        await writable.close();
        markFileSaved(currentFile.path);
        addToast(`Saved ${currentFile.name}`, 'success');
      } catch (err) {
        addToast(`Failed to save ${currentFile.name}`, 'error');
      }
    } else {
      markFileSaved(currentFile.path);
      addToast(`${currentFile.name} saved to memory`, 'info');
    }
  };

  const hasEnabledProvider = providers.some(p => p.enabled);

  const handleCopilotSend = async () => {
    if (!copilotInput.trim() || copilotLoading) return;
    const userMsg = copilotInput.trim();
    setCopilotMessages(prev => [...prev, { role: 'user', text: userMsg }]);
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
        setCopilotMessages(prev => [...prev, { role: 'ai', text: result.content }]);
        trackTokenUsage(result.providerId, result.tokensUsed);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Connection failed';
        setCopilotMessages(prev => [...prev, { role: 'ai', text: `Could not reach AI: ${msg}\n\nCheck your AI settings (AI button in the top bar).` }]);
      } finally {
        setCopilotLoading(false);
      }
    } else {
      setCopilotMessages(prev => [...prev, {
        role: 'ai',
        text: `No AI provider connected. Click "AI: Not Connected" in the bottom bar, or switch to the AI Settings view to add a provider.`
      }]);
    }
  };

  return (
    <div
      className="flex-1 h-full flex flex-col bg-background relative overflow-hidden"
      onKeyDown={(e) => {
        if (e.ctrlKey && e.key === 's') {
          e.preventDefault();
          handleSave();
        }
      }}
    >
      <ViewHint
        id="hint-code"
        icon="edit_note"
        title="This is the code editor"
        description="Click files in the left sidebar to open them here. The AI copilot on the right can answer questions about your code. Press Ctrl+S to save."
        position="top"
      />

      {/* Editor Tabs */}
      <div className="h-9 flex bg-surface border-b border-muted/30 shrink-0 overflow-x-auto z-20 custom-scrollbar">
        {tabFiles.map(file => (
          <div
            key={file.path}
            onClick={() => setActiveFile(file.path)}
            className={`flex items-center gap-1.5 pl-3 pr-1 min-w-fit cursor-pointer transition-all group ${
              activeFile === file.path
                ? 'bg-background border-t-2 border-primary'
                : 'bg-surface border-r border-muted/10 hover:bg-surface-hover'
            }`}
          >
            <span className={`material-symbols-outlined text-[14px] ${activeFile === file.path ? 'text-primary' : 'text-blue-400'}`}>code</span>
            <span className={`font-mono text-xs ${activeFile === file.path ? 'text-text-main' : 'text-muted'}`}>
              {file.name}
            </span>
            {file.isDirty && (
              <span className="w-1.5 h-1.5 rounded-full bg-accent-error shrink-0" title="Unsaved changes" />
            )}
            <button
              onClick={(e) => { e.stopPropagation(); closeTab(file.path); }}
              className="ml-1 p-0.5 text-muted hover:text-accent-error opacity-0 group-hover:opacity-100 transition-all"
              title="Close tab"
              aria-label={`Close ${file.name}`}
            >
              <span className="material-symbols-outlined text-[12px]">close</span>
            </button>
          </div>
        ))}
        {tabFiles.length === 0 && (
          <div className="flex items-center px-4 text-muted text-xs font-mono">No files open</div>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Monaco Editor Container */}
        <div className="flex-1 relative overflow-hidden">
          {currentFile ? (
            <Editor
              height="100%"
              language={currentFile.language}
              value={currentFile.content}
              path={currentFile.path}
              theme="neon-blueprint"
              onChange={handleEditorChange}
              options={{
                fontSize: editorSettings.fontSize,
                fontFamily: 'JetBrains Mono, monospace',
                minimap: { enabled: editorSettings.minimap },
                scrollbar: { vertical: 'auto', horizontal: 'auto' },
                overviewRulerLanes: 0,
                hideCursorInOverviewRuler: true,
                overviewRulerBorder: false,
                renderLineHighlight: 'all',
                lineNumbersMinChars: 3,
                glyphMargin: false,
                folding: true,
                lineDecorationsWidth: 10,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                wordWrap: editorSettings.wordWrap ? 'on' : 'off',
                lineHeight: editorSettings.lineHeight,
              }}
              beforeMount={(monaco) => {
                monaco.editor.defineTheme('neon-blueprint', {
                  base: 'vs-dark',
                  inherit: true,
                  rules: [
                    { token: 'keyword', foreground: 'FF5C5C' },
                    { token: 'string', foreground: 'A8FF00' },
                    { token: 'comment', foreground: '6B7280' },
                    { token: 'type', foreground: '00FFD1' },
                  ],
                  colors: {
                    'editor.background': '#181A20',
                    'editor.foreground': '#FFFFFF',
                    'editor.lineHighlightBackground': '#1E222B',
                    'editorCursor.foreground': '#00FFD1',
                    'editorIndentGuide.background': '#1E222B',
                  }
                });
              }}
              onMount={(editor, monaco) => {
                editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
                  handleSave();
                });
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4 p-8">
              <span className="material-symbols-outlined text-5xl text-muted/20">code_off</span>
              {files.length === 0 ? (
                <>
                  <p className="text-sm text-text-main">No project open yet</p>
                  <p className="text-xs text-muted max-w-xs">Click <strong className="text-primary">Open Folder</strong> in the left sidebar to load a project, or go back to the Map view to explore the demo.</p>
                </>
              ) : (
                <>
                  <p className="text-sm text-text-main">Pick a file to start</p>
                  <p className="text-xs text-muted max-w-xs">Click any file in the left sidebar to open it here. You can also press <strong className="text-primary">Ctrl+P</strong> to search for a file by name.</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Copilot Toggle */}
        <button
          onClick={() => setCopilotVisible(v => !v)}
          data-tutorial="copilot-toggle"
          className={`w-8 shrink-0 flex items-center justify-center border-l border-muted/30 transition-colors ${copilotVisible ? 'bg-surface-hover text-accent-ai' : 'bg-surface text-muted hover:text-accent-ai'}`}
          title={copilotVisible ? 'Hide copilot' : 'Show copilot'}
        >
          <span className="material-symbols-outlined text-sm" style={{ writingMode: 'vertical-rl' }}>
            {copilotVisible ? 'chevron_right' : 'smart_toy'}
          </span>
        </button>

        {/* Right Panel: Copilot Sidebar */}
        {copilotVisible && <aside className="w-[260px] bg-surface border-l border-muted/30 flex flex-col shrink-0">
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
            {copilotMessages.map((msg, i) => (
              <div key={i} className={`${msg.role === 'user' ? 'border-l-2 border-primary pl-3' : 'border-l-2 border-accent-ai pl-3'}`}>
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
        </aside>}
      </div>

      {/* Terminal — collapsed by default */}
      <div className={`bg-background border-t border-muted/30 flex flex-col shrink-0 transition-all ${terminalExpanded ? 'h-40' : 'h-7'}`}>
        <div className="h-7 flex bg-surface border-b border-muted/30 px-2 items-center justify-between shrink-0">
          <div className="flex items-center">
            <button
              onClick={() => setTerminalExpanded(e => !e)}
              className="flex items-center gap-1 px-2 text-xs font-bold uppercase tracking-wider text-muted hover:text-text-main cursor-pointer"
            >
              <span className={`material-symbols-outlined text-[14px] transition-transform ${terminalExpanded ? '' : '-rotate-90'}`}>expand_more</span>
              Terminal
            </button>
            {terminalExpanded && (
              <button
                onClick={() => setTerminalTab(terminalTab === 'terminal' ? 'output' : 'terminal')}
                className="px-3 text-xs font-medium uppercase tracking-wider text-muted hover:text-text-main cursor-pointer"
              >
                {terminalTab === 'terminal' ? 'Output' : 'Terminal'}
              </button>
            )}
          </div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-accent-ai bg-accent-ai/10 border border-accent-ai/30 px-2 py-0.5 mr-2">Preview</span>
        </div>
        {terminalExpanded && (
          <div className="flex-1 overflow-auto p-3 font-mono text-xs text-muted">
            {terminalTab === 'terminal' ? (
              <>
                <div className="mb-1"><span className="text-primary">neon@ide</span><span className="text-text-main">:</span><span className="text-blue-400">~/{projectPath || 'project'}</span>$ npm run dev</div>
                <div className="mb-1 text-text-main">&gt; Starting development server...</div>
                <div className="mb-1 text-accent-ai">[Ready] Server running</div>
                <div className="flex items-center mt-2">
                  <span className="text-primary">neon@ide</span><span className="text-text-main">:</span><span className="text-blue-400">~/{projectPath || 'project'}</span>$ <span className="w-1.5 h-3 bg-primary animate-pulse ml-2 inline-block"></span>
                </div>
              </>
            ) : (
              <div className="text-muted/50">No output yet.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProCodeEditor;
