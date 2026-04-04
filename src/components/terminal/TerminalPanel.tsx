"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useIDEStore } from '../../store/useIDEStore';

interface TerminalLine {
  type: 'input' | 'output' | 'error' | 'system';
  text: string;
}

const TerminalPanel: React.FC = () => {
  const { projectPath, addToast } = useIDEStore();
  const [history, setHistory] = useState<TerminalLine[]>([]);
  const [input, setInput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [currentProcessId, setCurrentProcessId] = useState<string | null>(null);

  const api = typeof window !== 'undefined' ? window.electronAPI : undefined;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  useEffect(() => {
    // Focus input on mount
    inputRef.current?.focus();
    
    // Cleanup process on unmount to prevent zombie processes
    return () => {
      if (currentProcessId && api?.isElectron) {
        api.terminalKill(currentProcessId);
      }
    };
  }, [currentProcessId, api]);

  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isExecuting || !api?.isElectron) return;

    const cmd = input.trim();
    setInput('');
    setHistory(prev => [...prev, { type: 'input', text: `${projectPath || ''}> ${cmd}` }]);
    setIsExecuting(true);

    if (cmd === 'clear' || cmd === 'cls') {
      setHistory([]);
      setIsExecuting(false);
      return;
    }

    try {
      const result = await api.terminalExecute(cmd, projectPath || undefined);
      if ('error' in result) {
        setHistory(prev => [...prev, { type: 'error', text: result.error }]);
        setIsExecuting(false);
        return;
      }

      const processId = result.id;
      setCurrentProcessId(processId);

      const removeDataListener = api.onTerminalData(processId, (data: string) => {
        setHistory(prev => [...prev, { type: 'output', text: data }]);
      });

      api.onTerminalExit(processId, (code: number | null) => {
        setHistory(prev => [...prev, { type: 'system', text: `Process exited with code ${code ?? 'unknown'}` }]);
        setIsExecuting(false);
        setCurrentProcessId(null);
        removeDataListener();
        inputRef.current?.focus();
      });

    } catch (err: any) {
      setHistory(prev => [...prev, { type: 'error', text: err.message }]);
      setIsExecuting(false);
    }
  };

  const killProcess = async () => {
    if (currentProcessId && api?.isElectron) {
      await api.terminalKill(currentProcessId);
      addToast('Process killed', 'info');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0b0c10] text-[#c5c6c7] font-mono text-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-surface border-b border-muted/30">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-sm text-primary">terminal</span>
          <span className="text-xs font-bold uppercase tracking-widest text-text-main">Terminal</span>
        </div>
        <div className="flex items-center gap-3">
          {isExecuting && (
            <button 
              onClick={killProcess}
              className="text-[10px] text-accent-error hover:underline flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[12px]">cancel</span>
              KILL PROCESS
            </button>
          )}
          <button 
            onClick={() => setHistory([])}
            className="text-[10px] text-muted hover:text-text-main flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[12px]">delete</span>
            CLEAR
          </button>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 custom-scrollbar selection:bg-primary selection:text-background"
        onClick={() => inputRef.current?.focus()}
      >
        {history.length === 0 && (
          <div className="text-muted/30 mb-4 italic">
            Neon Protocol Integrated Terminal. 
            Type commands to interact with your project directly.
            Commands are executed in: {projectPath || 'system root'}
          </div>
        )}
        {history.map((line, i) => (
          <div key={i} className={`whitespace-pre-wrap mb-1 ${
            line.type === 'input' ? 'text-primary font-bold' : 
            line.type === 'error' ? 'text-accent-error' : 
            line.type === 'system' ? 'text-muted italic' : ''
          }`}>
            {line.text}
          </div>
        ))}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-primary font-bold">{projectPath ? '>' : '$'}</span>
          <form onSubmit={handleCommand} className="flex-1">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isExecuting}
              autoFocus
              className="w-full bg-transparent outline-none border-none text-[#c5c6c7] placeholder-muted/20"
              aria-label="Terminal command input"
              placeholder={isExecuting ? "Executing..." : "Enter command..."}
            />
          </form>
        </div>
      </div>
    </div>
  );
};

export default TerminalPanel;
