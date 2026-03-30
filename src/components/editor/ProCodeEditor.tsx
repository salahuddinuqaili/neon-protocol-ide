"use client";

import React from 'react';
import Editor from '@monaco-editor/react';
import { useIDEStore } from '../../store/useIDEStore';

const ProCodeEditor: React.FC = () => {
  const { files, activeFile, setActiveFile, updateFileContent } = useIDEStore();
  
  const currentFile = files.find(f => f.path === activeFile) || {
    language: 'typescript',
    content: '// Select a file to edit',
    path: '',
    handle: null
  };

  const handleEditorChange = (value: string | undefined) => {
    if (activeFile && value !== undefined) {
      updateFileContent(activeFile, value);
    }
  };

  const handleSave = async () => {
    if (currentFile && currentFile.handle) {
      try {
        const writable = await currentFile.handle.createWritable();
        await writable.write(currentFile.content);
        await writable.close();
        console.log('File saved successfully');
      } catch (err) {
        console.error('Failed to save file:', err);
      }
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
      {/* Editor Tabs */}
      <div className="h-9 flex bg-surface border-b border-muted/30 shrink-0 overflow-x-auto z-20">
        {files.map(file => (
          <div 
            key={file.path}
            onClick={() => setActiveFile(file.path)}
            className={`flex items-center gap-2 px-4 min-w-fit cursor-pointer transition-all ${
              activeFile === file.path 
                ? 'bg-background border-t-2 border-primary' 
                : 'bg-surface border-r border-muted/10 hover:bg-surface-hover'
            }`}
          >
            <span className={`material-symbols-outlined text-[14px] ${activeFile === file.path ? 'text-primary' : 'text-blue-400'}`}>code</span>
            <span className={`font-mono text-xs ${activeFile === file.path ? 'text-text-main' : 'text-muted'}`}>{file.name}</span>
          </div>
        ))}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Monaco Editor Container */}
        <div className="flex-1 relative overflow-hidden">
          <Editor
            height="100%"
            language={currentFile.language}
            value={currentFile.content}
            path={currentFile.path}
            theme="vs-dark"
            onChange={handleEditorChange}
            options={{
              fontSize: 12,
              fontFamily: 'JetBrains Mono, monospace',
              minimap: { enabled: false },
              scrollbar: {
                vertical: 'hidden',
                horizontal: 'hidden'
              },
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
              wordWrap: 'on',
              lineHeight: 1.6,
            }}
            onMount={(editor, monaco) => {
              editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
                handleSave();
              });
              monaco.editor.defineTheme('neon-blueprint', {
                base: 'vs-dark',
                inherit: true,
                rules: [
                  { token: 'keyword', foreground: 'FF5C5C' }, // accent-error
                  { token: 'string', foreground: 'A8FF00' }, // accent-ai
                  { token: 'comment', foreground: '4E5666' }, // muted
                  { token: 'type', foreground: '00FFD1' }, // primary
                ],
                colors: {
                  'editor.background': '#181A20',
                  'editor.foreground': '#FFFFFF',
                  'editor.lineHighlightBackground': '#1E222B',
                  'editorCursor.foreground': '#00FFD1',
                  'editorIndentGuide.background': '#1E222B',
                }
              });
              monaco.editor.setTheme('neon-blueprint');
            }}
          />
        </div>

        {/* Right Panel: Copilot Sidebar */}
        <aside className="w-[240px] bg-surface border-l border-muted/30 flex flex-col shrink-0">
          <div className="h-9 flex items-center justify-between px-3 border-b border-muted/30 bg-surface-hover">
            <div className="flex items-center gap-2 text-accent-ai">
              <span className="material-symbols-outlined text-base">smart_toy</span>
              <span className="text-[10px] font-display font-bold tracking-widest text-text-main uppercase">Copilot</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 text-xs">
            <div className="border-l-2 border-accent-ai pl-3">
              <div className="text-[10px] text-accent-ai font-bold mb-1 uppercase">Architect AI</div>
              <div className="text-text-main leading-snug">
                I noticed you're working on the routing logic. Would you like to implement a retry mechanism?
              </div>
              <button className="mt-2 px-3 py-1 bg-background border border-accent-ai/50 text-accent-ai text-[10px] font-bold hover:bg-accent-ai hover:text-background transition-colors">
                Generate Code
              </button>
            </div>
          </div>
          <div className="p-3 border-t border-muted/30 bg-background">
            <div className="relative flex items-center">
              <input 
                className="w-full bg-surface border border-muted/50 text-text-main text-xs p-2 pl-3 pr-8 focus:outline-none focus:border-accent-ai placeholder-muted" 
                placeholder="Ask copilot..." 
                type="text" 
              />
              <button className="absolute right-2 text-muted hover:text-accent-ai">
                <span className="material-symbols-outlined text-base">send</span>
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Terminal */}
      <div className="h-40 bg-background border-t border-muted/30 flex flex-col shrink-0">
        <div className="h-7 flex bg-surface border-b border-muted/30 px-2">
          <div className="flex items-center px-4 border-b-2 border-primary text-text-main text-[10px] font-bold uppercase tracking-wider cursor-pointer">
            Terminal
          </div>
          <div className="flex items-center px-4 text-muted hover:text-text-main text-[10px] font-medium uppercase tracking-wider cursor-pointer">
            Output
          </div>
        </div>
        <div className="flex-1 overflow-auto p-3 font-mono text-[11px] text-muted">
          <div className="mb-1"><span className="text-primary">neon@ide</span><span className="text-text-main">:</span><span className="text-blue-400">~/neon-protocol</span>$ npm run dev</div>
          <div className="mb-1 text-text-main">&gt; neon-protocol-ide@1.0.0 dev</div>
          <div className="mb-1 text-accent-ai">[Watcher] Starting in watch mode...</div>
          <div className="flex items-center mt-2">
            <span className="text-primary">neon@ide</span><span className="text-text-main">:</span><span className="text-blue-400">~/neon-protocol</span>$ <span className="w-1.5 h-3 bg-primary animate-pulse ml-2 inline-block"></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProCodeEditor;
