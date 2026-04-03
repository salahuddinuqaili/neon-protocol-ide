"use client";

import React, { useEffect, useState } from 'react';
import { DiffEditor } from '@monaco-editor/react';
import { useIDEStore } from '../../store/useIDEStore';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface DiffViewerProps {
  filePath: string;
  staged: boolean;
  onClose: () => void;
}

const DiffViewer: React.FC<DiffViewerProps> = ({ filePath, staged, onClose }) => {
  const { projectPath } = useIDEStore();
  const [original, setOriginal] = useState<string | null>(null);
  const [modified, setModified] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fileName = filePath.split('/').pop() || filePath;

  useEffect(() => {
    const load = async () => {
      const api = (window as any).electronAPI;
      if (!api?.isElectron || !projectPath) return;

      setLoading(true);
      try {
        // HEAD version
        const head = await api.gitFileContent(projectPath, filePath);
        setOriginal(head || '');

        // Working copy — read from disk
        const fullPath = `${projectPath}/${filePath}`.replace(/\\/g, '/');
        const current = await api.readFile(fullPath);
        setModified(current || '');
      } catch {
        setOriginal('');
        setModified('');
      }
      setLoading(false);
    };
    load();
  }, [filePath, projectPath, staged]);

  const trapRef = useFocusTrap<HTMLDivElement>(onClose);

  return (
    <div ref={trapRef} className="fixed inset-0 z-[200] flex flex-col bg-background" role="dialog" aria-modal="true" aria-label={`Diff: ${fileName}`}>
      {/* Header */}
      <div className="flex items-center justify-between h-10 px-4 bg-surface border-b border-muted/30 shrink-0">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-sm text-accent-warning">difference</span>
          <span className="text-xs font-mono text-text-main">{fileName}</span>
          <span className="text-[11px] text-muted font-mono">
            {staged ? '(staged)' : '(working tree)'} — HEAD vs current
          </span>
        </div>
        <button onClick={onClose} className="flex items-center gap-1 text-xs text-muted hover:text-text-main font-mono">
          <span className="material-symbols-outlined text-[14px]">close</span>
          Close
        </button>
      </div>

      {/* Diff editor */}
      <div className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <span className="material-symbols-outlined text-2xl text-primary animate-spin">progress_activity</span>
          </div>
        ) : (
          <DiffEditor
            original={original || ''}
            modified={modified || ''}
            language={fileName.endsWith('.tsx') || fileName.endsWith('.ts') ? 'typescript' : fileName.endsWith('.json') ? 'json' : fileName.endsWith('.css') ? 'css' : 'javascript'}
            theme="vs-dark"
            options={{
              readOnly: true,
              fontSize: 13,
              lineHeight: 1.6,
              minimap: { enabled: false },
              renderSideBySide: typeof window !== 'undefined' ? window.innerWidth > 1024 : true,
              scrollBeyondLastLine: false,
              padding: { top: 8 },
            }}
          />
        )}
      </div>
    </div>
  );
};

export default DiffViewer;
