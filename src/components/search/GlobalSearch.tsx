"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useIDEStore } from '../../store/useIDEStore';

interface SearchResult {
  filePath: string;
  fileName: string;
  line: number;
  content: string;
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose }) => {
  const { files, openFile, setView } = useIDEStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }
    const lower = query.toLowerCase();
    const found: SearchResult[] = [];

    for (const file of files) {
      const lines = file.content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes(lower)) {
          found.push({
            filePath: file.path,
            fileName: file.name,
            line: i + 1,
            content: lines[i].trim(),
          });
          if (found.length >= 100) break;
        }
      }
      if (found.length >= 100) break;
    }

    setResults(found);
    setSelectedIndex(0);
  }, [query, files]);

  const handleSelect = (result: SearchResult) => {
    openFile(result.filePath);
    setView('code');
    onClose();
  };

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
      handleSelect(results[selectedIndex]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[10vh] bg-black/30" onClick={onClose}>
      <div
        className="w-[600px] max-w-[92vw] bg-surface border border-muted shadow-lg shadow-black/50"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center border-b border-muted/30 px-3 gap-2">
          <span className="material-symbols-outlined text-muted text-sm">search</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search in files..."
            className="flex-1 bg-transparent text-text-main text-sm font-mono py-3 outline-none placeholder-muted"
          />
          <span className="text-[11px] text-muted font-mono bg-background px-1.5 py-0.5 border border-muted/30">ESC</span>
        </div>
        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
          {query.length < 2 ? (
            <div className="px-4 py-6 text-center text-xs text-muted font-mono">
              Type at least 2 characters to search
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-muted font-mono">
              No matches found
            </div>
          ) : (
            <>
              <div className="px-4 py-1.5 text-[11px] text-muted font-mono border-b border-muted/10">
                {results.length}{results.length >= 100 ? '+' : ''} results
              </div>
              {results.slice(0, 50).map((result, i) => (
                <div
                  key={`${result.filePath}:${result.line}`}
                  onClick={() => handleSelect(result)}
                  className={`flex items-start gap-3 px-4 py-2 cursor-pointer text-xs font-mono transition-colors border-b border-muted/5 ${
                    i === selectedIndex
                      ? 'bg-primary/10'
                      : 'hover:bg-surface-hover'
                  }`}
                >
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-text-main font-bold truncate">{result.fileName}</span>
                      <span className="text-muted/50">:</span>
                      <span className="text-primary">{result.line}</span>
                    </div>
                    <span className="text-muted truncate text-xs">{result.content}</span>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GlobalSearch;
