"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useIDEStore } from '../../store/useIDEStore';

interface QuickOpenProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Fuzzy match scoring — bonuses for consecutive chars and segment starts */
function fuzzyScore(query: string, target: string): number {
  let qi = 0, score = 0, consecutive = 0, prevIdx = -2;
  const q = query.toLowerCase(), t = target.toLowerCase();
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      score += 1;
      if (ti === prevIdx + 1) { consecutive++; score += consecutive * 2; }
      else { consecutive = 0; }
      if (ti === 0 || '/.-_'.includes(t[ti - 1])) score += 5;
      prevIdx = ti;
      qi++;
    }
  }
  return qi === q.length ? score : 0;
}

/** Highlight matched characters in text */
function highlightMatches(text: string, query: string): React.ReactNode[] {
  if (!query) return [text];
  const result: React.ReactNode[] = [];
  let qi = 0;
  const q = query.toLowerCase(), t = text.toLowerCase();
  let buffer = '';
  for (let i = 0; i < text.length; i++) {
    if (qi < q.length && t[i] === q[qi]) {
      if (buffer) { result.push(buffer); buffer = ''; }
      result.push(<span key={i} className="text-primary font-bold">{text[i]}</span>);
      qi++;
    } else {
      buffer += text[i];
    }
  }
  if (buffer) result.push(buffer);
  return result;
}

function getFileIcon(name: string): string {
  if (name.endsWith('.json')) return 'settings_ethernet';
  if (name.endsWith('.md')) return 'description';
  if (name.endsWith('.css')) return 'css';
  if (name.endsWith('.html')) return 'html';
  if (name.endsWith('.py')) return 'code';
  if (name.endsWith('.ts') || name.endsWith('.tsx')) return 'code';
  if (name.endsWith('.js') || name.endsWith('.jsx')) return 'javascript';
  return 'code';
}

const QuickOpen: React.FC<QuickOpenProps> = ({ isOpen, onClose }) => {
  const { files, openFile, setView } = useIDEStore();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    if (!query) return files.slice(0, 30).map(f => ({ file: f, score: 0 }));
    return files
      .map(f => ({ file: f, score: Math.max(fuzzyScore(query, f.name), fuzzyScore(query, f.path) * 0.7) }))
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 30);
  }, [files, query]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleSelect = useCallback((path: string) => {
    openFile(path);
    setView('code');
    onClose();
  }, [openFile, setView, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      handleSelect(results[selectedIndex].file.path);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] bg-black/30" onClick={onClose}>
      <div
        className="w-[500px] max-w-[90vw] bg-surface border border-muted shadow-lg shadow-black/50"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center border-b border-muted/30 px-3">
          <span className="material-symbols-outlined text-muted text-sm mr-2">search</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search files by name..."
            className="flex-1 bg-transparent text-text-main text-sm font-mono py-3 outline-none placeholder-muted"
          />
          <span className="text-[11px] text-muted font-mono bg-background px-1.5 py-0.5 border border-muted/30">ESC</span>
        </div>
        <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
          {results.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-muted font-mono">
              {files.length === 0 ? 'No project open' : 'No matching files'}
            </div>
          ) : (
            results.map(({ file }, i) => (
              <div
                key={file.path}
                onClick={() => handleSelect(file.path)}
                className={`flex items-center gap-3 px-4 py-2 cursor-pointer text-xs font-mono transition-colors ${
                  i === selectedIndex
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted hover:text-text-main hover:bg-surface-hover'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">{getFileIcon(file.name)}</span>
                <div className="flex flex-col min-w-0">
                  <span className="text-text-main truncate">{highlightMatches(file.name, query)}</span>
                  <span className="text-[11px] text-muted truncate">{highlightMatches(file.path, query)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default QuickOpen;
