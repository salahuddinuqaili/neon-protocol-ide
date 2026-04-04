"use client";

import { useCallback, useEffect, useRef } from 'react';
import { useIDEStore } from '../store/useIDEStore';
import { GitFileChange, GitBranch, GitLogEntry } from '../types';

const POLL_INTERVAL = 10000; // 10 seconds
const BACKOFF_MAX = 30000;   // Max backoff on repeated errors

export function useGitPolling() {
  const projectPath = useIDEStore(s => s.projectPath);
  const setGitBranch = useIDEStore(s => s.setGitBranch);
  const setGitState = useIDEStore(s => s.setGitState);
  const consecutiveErrors = useRef(0);
  const lastErrorTime = useRef(0);
  const inProgress = useRef(false);

  const refresh = useCallback(async () => {
    if (inProgress.current) return;
    inProgress.current = true;
    try {
      const api = typeof window !== 'undefined' ? window.electronAPI : undefined;
      if (!api?.isElectron || !projectPath) {
        setGitState({ isGitRepo: false, files: [], branches: [], log: [], branch: null, changedFileCount: 0, ahead: 0, behind: 0, stashCount: 0 });
        setGitBranch(null);
        return;
      }

      const isRepo = await api.isGitRepo(projectPath);
      if (!isRepo) {
        setGitState({ isGitRepo: false, files: [], branches: [], log: [], branch: null, changedFileCount: 0, ahead: 0, behind: 0, stashCount: 0 });
        setGitBranch(null);
        consecutiveErrors.current = 0;
        return;
      }

      const results = await Promise.allSettled([
        api.getGitBranch(projectPath),
        api.getGitStatusFiles(projectPath),
        api.gitBranchList(projectPath),
        api.gitRemoteStatus(projectPath),
        api.gitLog(projectPath, 30),
        api.gitStashList(projectPath),
      ]);

      const getValue = <T,>(result: PromiseSettledResult<T>, fallback: T): T =>
        result.status === 'fulfilled' ? result.value : fallback;

      const branch = getValue(results[0], null) as string | null;
      const files = getValue(results[1], []) as GitFileChange[];
      const branches = getValue(results[2], []) as GitBranch[];
      const remoteStatus = getValue(results[3], { ahead: 0, behind: 0 }) as { ahead: number; behind: number };
      const log = getValue(results[4], []) as GitLogEntry[];
      const stashList = getValue(results[5], []) as string[];

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
      consecutiveErrors.current = 0;
    } catch (err) {
      consecutiveErrors.current++;
      lastErrorTime.current = Date.now();
      setGitState({ lastError: err instanceof Error ? err.message : String(err) });
    } finally {
      inProgress.current = false;
    }
  }, [projectPath, setGitBranch, setGitState]);

  useEffect(() => {
    refresh();
    const interval = setInterval(() => {
      if (!document.hasFocus()) return;
      // Exponential backoff on repeated errors
      if (consecutiveErrors.current > 0) {
        const backoff = Math.min(POLL_INTERVAL * Math.pow(2, consecutiveErrors.current), BACKOFF_MAX);
        const elapsed = Date.now() - lastErrorTime.current;
        if (elapsed < backoff) return;
      }
      refresh();
    }, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [refresh]);

  return { refresh };
}
