"use client";

import React, { useState } from 'react';
import { useIDEStore } from '../../store/useIDEStore';
import { GitFileChange } from '../../types';
import DiffViewer from './DiffViewer';

const STATUS_COLORS: Record<string, string> = {
  M: 'text-accent-warning',
  A: 'text-primary',
  D: 'text-accent-error',
  R: 'text-accent-ai',
  '?': 'text-muted',
  ' ': 'text-muted',
};

const GitFileRow: React.FC<{
  file: GitFileChange;
  onToggleStage: () => void;
  onViewDiff: () => void;
  staged: boolean;
}> = ({ file, onToggleStage, onViewDiff, staged }) => {
  const displayStatus = staged ? file.indexStatus : file.workTreeStatus;
  const fileName = file.path.split('/').pop() || file.path;
  const dirPath = file.path.includes('/') ? file.path.slice(0, file.path.lastIndexOf('/')) : '';

  return (
    <div className="flex items-center gap-1.5 py-1 px-3 text-xs font-mono hover:bg-surface-hover/30 transition-colors group">
      <span className={`font-bold w-3 text-center shrink-0 ${STATUS_COLORS[displayStatus] || 'text-muted'}`}>
        {displayStatus === '?' ? 'U' : displayStatus}
      </span>
      <button onClick={onViewDiff} className="truncate text-text-main hover:text-primary transition-colors text-left" title={`Diff: ${file.path}`}>
        {fileName}
      </button>
      {dirPath && <span className="text-muted/50 truncate text-[10px] ml-0.5">{dirPath}</span>}
      <button
        onClick={(e) => { e.stopPropagation(); onToggleStage(); }}
        className="ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted hover:text-primary"
        title={staged ? 'Unstage' : 'Stage'}
      >
        <span className="material-symbols-outlined text-[14px]">
          {staged ? 'remove' : 'add'}
        </span>
      </button>
    </div>
  );
};

type SCTab = 'changes' | 'log';

const SourceControlPanel: React.FC<{ onRefresh: () => void }> = ({ onRefresh }) => {
  const { gitState, projectPath, addToast } = useIDEStore();
  const [commitMsg, setCommitMsg] = useState('');
  const [isCommitting, setIsCommitting] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [stagedOpen, setStagedOpen] = useState(true);
  const [changesOpen, setChangesOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<SCTab>('changes');
  const [diffFile, setDiffFile] = useState<{ path: string; staged: boolean } | null>(null);

  const api = (window as any).electronAPI;

  const staged = gitState.files.filter(f => f.isStaged);
  const unstaged = gitState.files.filter(f => !f.isStaged);

  const handleStage = async (filePath: string) => {
    if (!api?.isElectron || !projectPath) return;
    const result = await api.gitStage(projectPath, [filePath]);
    if (result.success) onRefresh();
    else addToast(`Stage failed: ${result.error}`, 'error');
  };

  const handleUnstage = async (filePath: string) => {
    if (!api?.isElectron || !projectPath) return;
    const result = await api.gitUnstage(projectPath, [filePath]);
    if (result.success) onRefresh();
    else addToast(`Unstage failed: ${result.error}`, 'error');
  };

  const handleStageAll = async () => {
    if (!api?.isElectron || !projectPath || unstaged.length === 0) return;
    const result = await api.gitStage(projectPath, unstaged.map(f => f.path));
    if (result.success) onRefresh();
    else addToast(`Stage failed: ${result.error}`, 'error');
  };

  const handleUnstageAll = async () => {
    if (!api?.isElectron || !projectPath || staged.length === 0) return;
    const result = await api.gitUnstage(projectPath, staged.map(f => f.path));
    if (result.success) onRefresh();
    else addToast(`Unstage failed: ${result.error}`, 'error');
  };

  const handleCommit = async () => {
    if (!api?.isElectron || !projectPath || !commitMsg.trim() || staged.length === 0) return;
    setIsCommitting(true);
    const result = await api.gitCommit(projectPath, commitMsg.trim());
    setIsCommitting(false);
    if (result.success) {
      setCommitMsg('');
      addToast('Changes committed', 'success');
      onRefresh();
    } else {
      addToast(`Commit failed: ${result.error}`, 'error');
    }
  };

  const handlePush = async () => {
    if (!api?.isElectron || !projectPath) return;
    setIsPushing(true);
    const result = await api.gitPush(projectPath);
    setIsPushing(false);
    if (result.success) { addToast('Pushed to remote', 'success'); onRefresh(); }
    else addToast(`Push failed: ${result.error}`, 'error');
  };

  const handlePull = async () => {
    if (!api?.isElectron || !projectPath) return;
    setIsPulling(true);
    const result = await api.gitPull(projectPath);
    setIsPulling(false);
    if (result.success) { addToast('Pulled from remote', 'success'); onRefresh(); }
    else addToast(`Pull failed: ${result.error}`, 'error');
  };

  const handleStash = async () => {
    if (!api?.isElectron || !projectPath) return;
    const result = await api.gitStash(projectPath);
    if (result.success) { addToast('Changes stashed', 'success'); onRefresh(); }
    else addToast(`Stash failed: ${result.error}`, 'error');
  };

  const handleStashPop = async () => {
    if (!api?.isElectron || !projectPath) return;
    const result = await api.gitStashPop(projectPath);
    if (result.success) { addToast('Stash applied', 'success'); onRefresh(); }
    else addToast(`Stash pop failed: ${result.error}`, 'error');
  };

  if (!gitState.isGitRepo) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4 text-center gap-3">
        <span className="material-symbols-outlined text-3xl text-muted/30">source</span>
        <p className="text-xs text-muted">Not a git repository</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with push/pull/stash */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-muted/10 bg-surface-hover/30">
        <span className="material-symbols-outlined text-sm text-primary">account_tree</span>
        <span className="text-xs font-bold text-text-main truncate">{gitState.branch}</span>
        {(gitState.ahead > 0 || gitState.behind > 0) && (
          <span className="text-[10px] text-muted font-mono">
            {gitState.ahead > 0 && `↑${gitState.ahead}`}{gitState.behind > 0 && `↓${gitState.behind}`}
          </span>
        )}
        <div className="ml-auto flex items-center gap-1">
          <button onClick={onRefresh} className="text-muted hover:text-text-main transition-colors" title="Refresh">
            <span className="material-symbols-outlined text-[14px]">refresh</span>
          </button>
          {gitState.stashCount > 0 && (
            <button onClick={handleStashPop} className="text-muted hover:text-text-main transition-colors" title={`Pop stash (${gitState.stashCount})`}>
              <span className="material-symbols-outlined text-[14px]">output</span>
            </button>
          )}
          <button onClick={handleStash} disabled={gitState.changedFileCount === 0} className="text-muted hover:text-text-main transition-colors disabled:opacity-20" title="Stash changes">
            <span className="material-symbols-outlined text-[14px]">inventory_2</span>
          </button>
          <button onClick={handlePull} disabled={isPulling} className="text-muted hover:text-text-main transition-colors disabled:opacity-30" title="Pull">
            <span className="material-symbols-outlined text-[14px]">download</span>
          </button>
          <button onClick={handlePush} disabled={isPushing} className="text-muted hover:text-text-main transition-colors disabled:opacity-30" title="Push">
            <span className="material-symbols-outlined text-[14px]">upload</span>
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-muted/10 bg-surface/50 shrink-0">
        <button onClick={() => setActiveTab('changes')}
          className={`flex-1 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors border-b-2 ${
            activeTab === 'changes' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-text-main'
          }`}>Changes</button>
        <button onClick={() => setActiveTab('log')}
          className={`flex-1 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors border-b-2 ${
            activeTab === 'log' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-text-main'
          }`}>Log</button>
      </div>

      {activeTab === 'log' ? (
        /* --- Git Log --- */
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {gitState.log.length === 0 ? (
            <p className="text-[11px] text-muted p-4 text-center">No commits yet</p>
          ) : (
            gitState.log.map((entry, i) => (
              <div key={entry.hash} className={`flex items-start gap-2 px-3 py-1.5 text-xs font-mono border-b border-muted/5 ${i === 0 ? 'bg-primary/5' : ''}`}>
                <span className="text-primary/70 shrink-0 w-14 truncate" title={entry.hash}>{entry.hash}</span>
                <span className="text-text-main truncate">{entry.message}</span>
              </div>
            ))
          )}
        </div>
      ) : (<>
        {/* --- Changes --- */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {gitState.files.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-6 text-center gap-2 h-full">
              <span className="material-symbols-outlined text-2xl text-primary/30">check_circle</span>
              <p className="text-xs text-muted">No changes</p>
            </div>
          ) : (<>
            {/* Staged */}
            <div>
              <button onClick={() => setStagedOpen(s => !s)} className="w-full flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-muted uppercase tracking-widest hover:text-text-main transition-colors">
                <span className={`material-symbols-outlined text-[12px] transition-transform ${stagedOpen ? '' : '-rotate-90'}`}>expand_more</span>
                Staged
                <span className="text-primary font-mono ml-auto">{staged.length}</span>
                {staged.length > 0 && (
                  <button onClick={(e) => { e.stopPropagation(); handleUnstageAll(); }} className="text-muted hover:text-text-main ml-1" title="Unstage all">
                    <span className="material-symbols-outlined text-[12px]">remove</span>
                  </button>
                )}
              </button>
              {stagedOpen && staged.map(f => (
                <GitFileRow key={`s-${f.path}`} file={f} staged onToggleStage={() => handleUnstage(f.path)} onViewDiff={() => setDiffFile({ path: f.path, staged: true })} />
              ))}
            </div>

            {/* Changes */}
            <div>
              <button onClick={() => setChangesOpen(s => !s)} className="w-full flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-muted uppercase tracking-widest hover:text-text-main transition-colors">
                <span className={`material-symbols-outlined text-[12px] transition-transform ${changesOpen ? '' : '-rotate-90'}`}>expand_more</span>
                Changes
                <span className="text-accent-warning font-mono ml-auto">{unstaged.length}</span>
                {unstaged.length > 0 && (
                  <button onClick={(e) => { e.stopPropagation(); handleStageAll(); }} className="text-muted hover:text-text-main ml-1" title="Stage all">
                    <span className="material-symbols-outlined text-[12px]">add</span>
                  </button>
                )}
              </button>
              {changesOpen && unstaged.map(f => (
                <GitFileRow key={`u-${f.path}`} file={f} staged={false} onToggleStage={() => handleStage(f.path)} onViewDiff={() => setDiffFile({ path: f.path, staged: false })} />
              ))}
            </div>
          </>)}
        </div>

        {/* Commit box */}
        <div className="border-t border-muted/10 p-2 flex flex-col gap-1.5">
          <textarea
            value={commitMsg}
            onChange={(e) => setCommitMsg(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) handleCommit(); }}
            placeholder="Commit message..."
            className="w-full bg-background border border-muted/30 text-text-main text-xs font-mono px-2 py-1.5 resize-none h-16 focus:outline-none focus:border-primary placeholder-muted custom-scrollbar"
          />
          <button
            onClick={handleCommit}
            disabled={isCommitting || !commitMsg.trim() || staged.length === 0}
            className="w-full flex items-center justify-center gap-1.5 h-7 bg-primary text-background text-[11px] font-bold uppercase tracking-wider hover:bg-[#0cf1f1] transition-all disabled:opacity-30"
          >
            <span className="material-symbols-outlined text-[14px]">check</span>
            {isCommitting ? 'Committing...' : `Commit (${staged.length})`}
          </button>
        </div>
      </>)}

      {/* Diff viewer overlay */}
      {diffFile && (
        <DiffViewer filePath={diffFile.path} staged={diffFile.staged} onClose={() => setDiffFile(null)} />
      )}
    </div>
  );
};

export default SourceControlPanel;
