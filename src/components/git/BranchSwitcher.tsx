"use client";

import React, { useState } from 'react';
import { useIDEStore } from '../../store/useIDEStore';

interface BranchSwitcherProps {
  onRefresh: () => void;
}

const BranchSwitcher: React.FC<BranchSwitcherProps> = ({ onRefresh }) => {
  const { gitState, projectPath, addToast } = useIDEStore();
  const [isOpen, setIsOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [filter, setFilter] = useState('');

  const api = typeof window !== 'undefined' ? window.electronAPI : undefined;

  const localBranches = gitState.branches.filter(b => !b.isRemote);
  const remoteBranches = gitState.branches.filter(b => b.isRemote && !localBranches.some(l => b.name.endsWith('/' + l.name)));

  const filtered = filter
    ? [...localBranches, ...remoteBranches].filter(b => b.name.toLowerCase().includes(filter.toLowerCase()))
    : [...localBranches, ...remoteBranches];

  const handleCheckout = async (branch: string) => {
    if (!api?.isElectron || !projectPath) return;
    const result = await api.gitCheckout(projectPath, branch);
    if (result.success) {
      addToast(`Switched to ${branch}`, 'success');
      onRefresh();
    } else {
      addToast(`Checkout failed: ${result.error}`, 'error');
    }
    setIsOpen(false);
    setFilter('');
  };

  const handleCreate = async () => {
    if (!api?.isElectron || !projectPath || !newBranchName.trim()) return;
    const result = await api.gitCreateBranch(projectPath, newBranchName.trim());
    if (result.success) {
      addToast(`Created and switched to ${newBranchName.trim()}`, 'success');
      onRefresh();
    } else {
      addToast(`Create branch failed: ${result.error}`, 'error');
    }
    setCreating(false);
    setNewBranchName('');
    setIsOpen(false);
  };

  if (!gitState.isGitRepo) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(o => !o)}
        className="flex items-center gap-1 hover:opacity-70 transition-opacity"
        title="Switch branch"
      >
        <span className="material-symbols-outlined text-[12px]">account_tree</span>
        <span>{gitState.branch || 'detached'}</span>
        {gitState.changedFileCount > 0 && (
          <span className="text-[10px] opacity-80">{gitState.changedFileCount}</span>
        )}
        {(gitState.ahead > 0 || gitState.behind > 0) && (
          <span className="text-[10px] opacity-70">
            {gitState.ahead > 0 && `↑${gitState.ahead}`}
            {gitState.behind > 0 && `↓${gitState.behind}`}
          </span>
        )}
      </button>

      {isOpen && (<>
        <div className="fixed inset-0 z-[98]" onClick={() => { setIsOpen(false); setFilter(''); setCreating(false); }} />
        <div className="absolute bottom-8 left-0 z-[99] w-64 max-w-[90vw] bg-surface border border-muted shadow-lg flex flex-col" style={{ maxHeight: 'min(288px, calc(100vh - 80px))' }}>
          {/* Search + create */}
          <div className="p-2 border-b border-muted/10 flex flex-col gap-1.5">
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter branches..."
              className="w-full bg-background border border-muted/30 text-text-main text-xs font-mono px-2 py-1 focus:outline-none focus:border-primary placeholder-muted"
              autoFocus
            />
            {creating ? (
              <div className="flex gap-1">
                <input
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  placeholder="new-branch-name"
                  className="flex-1 bg-background border border-muted/30 text-text-main text-xs font-mono px-2 py-1 focus:outline-none focus:border-primary placeholder-muted"
                  autoFocus
                />
                <button onClick={handleCreate} className="text-primary hover:text-[#0cf1f1]">
                  <span className="material-symbols-outlined text-[14px]">check</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCreating(true)}
                className="flex items-center gap-1 text-[11px] text-primary font-mono hover:underline"
              >
                <span className="material-symbols-outlined text-[12px]">add</span>
                Create new branch
              </button>
            )}
          </div>

          {/* Branch list */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filtered.length === 0 ? (
              <p className="text-[11px] text-muted p-3 text-center">No branches found</p>
            ) : (
              filtered.map(b => (
                <button
                  key={b.name}
                  onClick={() => !b.isCurrent && handleCheckout(b.name)}
                  disabled={b.isCurrent}
                  className={`w-full text-left px-3 py-1.5 text-xs font-mono flex items-center gap-2 transition-colors ${
                    b.isCurrent ? 'text-primary bg-primary/5' : 'text-text-main hover:bg-surface-hover'
                  }`}
                >
                  {b.isCurrent && <span className="material-symbols-outlined text-[12px] text-primary">check</span>}
                  <span className={`truncate ${b.isRemote ? 'text-muted' : ''}`}>{b.name}</span>
                  {b.isRemote && <span className="text-[10px] text-muted/50 ml-auto shrink-0">remote</span>}
                </button>
              ))
            )}
          </div>
        </div>
      </>)}
    </div>
  );
};

export default BranchSwitcher;
