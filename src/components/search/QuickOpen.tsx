"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useIDEStore } from '../../store/useIDEStore';

interface QuickOpenProps {
  isOpen: boolean;
  onClose: () => void;
}

const QuickOpen: React.FC<QuickOpenProps> = ({ isOpen, onClose }) => {
  const { files, openFile, setView } = useIDEStore();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = files.filter(f => {
    if (!query) return true;
    const lower = query.toLowerCase();
    return f.name.toLowerCase().includes(lower) || f.path.toLowerCase().includes(lower);
  });

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
      setSelectedIndex(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      handleSelect(filtered[selectedIndex].path);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] bg-black/30" onClick={onClose}>
      <div
        className="w-[500px] bg-surface border border-muted shadow-lg shadow-black/50"
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
          <span className="text-[9px] text-muted font-mono bg-background px-1.5 py-0.5 border border-muted/30">ESC</span>
        </div>
        <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
          {filtered.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-muted font-mono">
              {files.length === 0 ? 'No project open' : 'No matching files'}
            </div>
          ) : (
            filtered.slice(0, 20).map((file, i) => (
              <div
                key={file.path}
                onClick={() => handleSelect(file.path)}
                className={`flex items-center gap-3 px-4 py-2 cursor-pointer text-xs font-mono transition-colors ${
                  i === selectedIndex
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted hover:text-text-main hover:bg-surface-hover'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">code</span>
                <div className="flex flex-col min-w-0">
                  <span className="text-text-main truncate">{file.name}</span>
                  <span className="text-[10px] text-muted truncate">{file.path}</span>
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
