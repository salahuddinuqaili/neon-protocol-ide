"use client";

import { useCallback, useEffect } from 'react';
import { useIDEStore } from '../store/useIDEStore';

export function useGitPolling() {
  const projectPath = useIDEStore(s => s.projectPath);
  const setGitBranch = useIDEStore(s => s.setGitBranch);
  const setGitState = useIDEStore(s => s.setGitState);

  const refresh = useCallback(async () => {
    const api = (window as any).electronAPI;
    if (!api?.isElectron || !projectPath) {
      setGitState({ isGitRepo: false, files: [], branches: [], log: [], branch: null, changedFileCount: 0, ahead: 0, behind: 0, stashCount: 0 });
      setGitBranch(null);
      return;
    }

    try {
      const isRepo = await api.isGitRepo(projectPath);
      if (!isRepo) {
        setGitState({ isGitRepo: false, files: [], branches: [], log: [], branch: null, changedFileCount: 0, ahead: 0, behind: 0, stashCount: 0 });
        setGitBranch(null);
        return;
      }

      const [branch, files, branches, remoteStatus, log, stashList] = await Promise.all([
        api.getGitBranch(projectPath),
        api.getGitStatusFiles(projectPath),
        api.gitBranchList(projectPath),
        api.gitRemoteStatus(projectPath),
        api.gitLog(projectPath, 30),
        api.gitStashList(projectPath),
      ]);

      setGitBranch(branch);
      setGitState({
        isGitRepo: true,
        branch,
        files: files || [],
        changedFileCount: files?.length || 0,
        branches: branches || [],
        log: log || [],
        ahead: remoteStatus?.ahead || 0,
        behind: remoteStatus?.behind || 0,
        stashCount: stashList?.length || 0,
        isLoading: false,
        lastError: null,
      });
    } catch (err) {
      setGitState({ lastError: err instanceof Error ? err.message : String(err) });
    }
  }, [projectPath, setGitBranch, setGitState]);

  useEffect(() => {
    refresh();
    const interval = setInterval(() => {
      // Only poll if the window is focused to save resources
      if (document.hasFocus()) {
        refresh();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { refresh };
}
