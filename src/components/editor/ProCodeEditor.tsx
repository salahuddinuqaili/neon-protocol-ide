"use client";

import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { useIDEStore } from '../../store/useIDEStore';
import { FileEntry } from '../../types';
import ViewHint from '../onboarding/ViewHint';
import CopilotPanel from './CopilotPanel';

const ProCodeEditor: React.FC = () => {
  const {
    files, openTabs, activeFile, setActiveFile, updateFileContent, closeTab, markFileSaved,
    editorSettings, addToast, projectPath, providers
  } = useIDEStore();

  const tabFiles = openTabs.map(p => files.find(f => f.path === p)).filter(Boolean) as FileEntry[];
  const currentFile = files.find(f => f.path === activeFile);

  const [copilotVisible, setCopilotVisible] = useState(true);
  const [terminalTab, setTerminalTab] = useState<'terminal' | 'output'>('terminal');
  const [terminalExpanded, setTerminalExpanded] = useState(false);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });

  const handleEditorChange = (value: string | undefined) => {
    if (activeFile && value !== undefined) {
      updateFileContent(activeFile, value);
    }
  };

  const handleSave = async () => {
    if (!currentFile || !activeFile) return;

    const api = typeof window !== 'undefined' ? window.electronAPI : undefined;

    if (api?.isElectron) {
      try {
        const success = await api.writeFile(activeFile, currentFile.content);
        if (success) {
          markFileSaved(activeFile);
          addToast(`Saved ${currentFile.name}`, 'success');
        } else {
          addToast(`Failed to save ${currentFile.name}`, 'error');
        }
      } catch {
        addToast(`Error saving ${currentFile.name}`, 'error');
      }
      return;
    }

    if (currentFile.handle) {
      try {
        const writable = await currentFile.handle.createWritable();
        await writable.write(currentFile.content);
        await writable.close();
        markFileSaved(currentFile.path);
        addToast(`Saved ${currentFile.name}`, 'success');
      } catch {
        addToast(`Failed to save ${currentFile.name}`, 'error');
      }
    } else {
      markFileSaved(currentFile.path);
      addToast(`${currentFile.name} saved to memory`, 'info');
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
                // Bracket pair colorization + indent guides
                bracketPairColorization: { enabled: true },
                guides: {
                  bracketPairs: true,
                  indentation: true,
                  highlightActiveIndentation: true,
                },
                // Sticky scroll (pins enclosing scopes at top)
                stickyScroll: { enabled: true },
                // Smooth scrolling + cursor animation
                smoothScrolling: true,
                cursorSmoothCaretAnimation: 'on',
                cursorBlinking: 'smooth',
                // Padding for readability
                padding: { top: 8, bottom: 8 },
                // Find widget improvements
                find: {
                  addExtraSpaceOnTop: true,
                  autoFindInSelection: 'multiline',
                  seedSearchStringFromSelection: 'selection',
                },
                // Word-based autocomplete
                suggest: {
                  showWords: true,
                  showSnippets: true,
                  insertMode: 'replace',
                },
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
                    'editorIndentGuide.activeBackground': '#00FFD140',
                    'editorBracketHighlight.foreground1': '#00FFD1',
                    'editorBracketHighlight.foreground2': '#B026FF',
                    'editorBracketHighlight.foreground3': '#FF8800',
                    'editorBracketHighlight.foreground4': '#FF5C5C',
                    'editorBracketHighlight.foreground5': '#A8FF00',
                    'editorBracketHighlight.foreground6': '#60A5FA',
                    'editorBracketHighlight.unexpectedBracket.foreground': '#FF007F',
                    'editorBracketPairGuide.foreground1': '#00FFD150',
                    'editorBracketPairGuide.foreground2': '#B026FF50',
                    'editorStickyScroll.background': '#181A20',
                    'editorStickyScrollHover.background': '#242730',
                  }
                });
              }}
              onMount={(editor, monaco) => {
                editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
                  handleSave();
                });
                editor.onDidChangeCursorPosition((e) => {
                  setCursorPos({ line: e.position.lineNumber, col: e.position.column });
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
          {/* Editor info bar */}
          {currentFile && (
            <div className="absolute bottom-0 left-0 right-0 h-6 bg-surface/90 border-t border-muted/10 flex items-center justify-end px-3 gap-4 text-[11px] font-mono text-muted z-10">
              <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
              <span>{currentFile.language}</span>
              <span>Spaces: 2</span>
              <span>UTF-8</span>
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
        {copilotVisible && <CopilotPanel currentFile={currentFile} />}
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
