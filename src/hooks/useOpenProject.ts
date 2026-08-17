"use client";

import { useCallback } from 'react';
import { useIDEStore } from '../store/useIDEStore';
import { FileEntry } from '../types';
import { LANGUAGE_MAP } from '../config/languages';

const MAX_FILE_SIZE = 1024 * 1024; // 1MB
const CODE_FILE = /\.(js|ts|tsx|jsx|json|md|css|html|txt|py|rb|go|rs|c|cpp|java|yaml|yml|toml|sh|bat|sql|graphql|proto|xml|svg)$/i;

/**
 * Opening a project used to live inside Sidebar, so the File menu had no way to trigger it.
 * It is shared here and guards unsaved work: `setProject` replaces the file list outright,
 * which silently discarded any edits the user had not written to disk.
 */
export function useOpenProject() {
  const setProject = useIDEStore((s) => s.setProject);
  const setView = useIDEStore((s) => s.setView);
  const setIsScanning = useIDEStore((s) => s.setIsScanning);
  const addToast = useIDEStore((s) => s.addToast);
  const addRecentProject = useIDEStore((s) => s.addRecentProject);

  /** Asks before throwing away unsaved edits. Returns false if the user backs out. */
  const confirmDiscardUnsaved = useCallback(async (action: string): Promise<boolean> => {
    const dirty = useIDEStore.getState().files.filter((f) => f.isDirty);
    if (dirty.length === 0) return true;

    const names = dirty.slice(0, 5).map((f) => f.name).join(', ');
    const more = dirty.length > 5 ? ` and ${dirty.length - 5} more` : '';
    const message = `You have unsaved changes in ${dirty.length} file${dirty.length === 1 ? '' : 's'}.`;
    const detail = `${names}${more}\n\nThese changes will be lost if you ${action}.`;

    const api = typeof window !== 'undefined' ? window.electronAPI : undefined;
    if (api?.confirm) {
      const { confirmed } = await api.confirm({
        title: 'Unsaved changes',
        message,
        detail,
        confirmLabel: 'Discard changes',
        danger: true,
      });
      return confirmed;
    }

    if (typeof window === 'undefined') return false;
    return window.confirm(`${message}\n\n${detail}`);
  }, []);

  const openProject = useCallback(async () => {
    if (typeof window === 'undefined') return;

    const api = window.electronAPI;

    try {
      if (api?.isElectron) {
        const dirPath = await api.openDirectory();
        if (!dirPath) return;
        if (!(await confirmDiscardUnsaved('open another folder'))) return;

        setIsScanning(true);
        try {
          const results = await api.scanProject(dirPath);
          const normalized = dirPath.replace(/\\/g, '/');
          const dirName = normalized.split('/').pop() || dirPath;

          const loadedFiles: FileEntry[] = results.map((f) => ({
            ...f,
            language: LANGUAGE_MAP[f.name.split('.').pop() || 'text'] || 'text',
          }));

          setProject(normalized, loadedFiles);
          addRecentProject(dirName);

          if (loadedFiles.length === 0) {
            addToast(`${dirName} has no readable code files in it.`, 'info');
          } else {
            addToast(`Loaded ${loadedFiles.length} files from ${dirName}`, 'success');
          }
          setView('blueprint');
        } catch (err) {
          console.error('Scan failed:', err);
          addToast('Could not read that folder. Check that you have permission to open it.', 'error');
        } finally {
          setIsScanning(false);
        }
        return;
      }

      // Browser fallback — the File System Access API is Chromium-only.
      if (!('showDirectoryPicker' in window)) {
        addToast('Opening folders requires Chrome or Edge. Try using one of those browsers.', 'error');
        return;
      }
      if (!window.isSecureContext && window.location.hostname !== 'localhost') {
        addToast('Secure connection required. Use HTTPS or localhost.', 'error');
        return;
      }

      const dirHandle = await (
        window as unknown as { showDirectoryPicker: () => Promise<FileSystemDirectoryHandle> }
      ).showDirectoryPicker();

      if (!(await confirmDiscardUnsaved('open another folder'))) return;

      setIsScanning(true);
      const loadedFiles: FileEntry[] = [];

      async function scan(handle: any, dirPath: string) {
        for await (const entry of handle.values()) {
          if (entry.name === 'node_modules' || entry.name.startsWith('.') || entry.name === 'package-lock.json') {
            continue;
          }
          const currentPath = `${dirPath}/${entry.name}`;

          if (entry.kind === 'file') {
            if (!CODE_FILE.test(entry.name)) continue;
            const file = await entry.getFile();
            if (file.size > MAX_FILE_SIZE) continue;
            loadedFiles.push({
              name: entry.name,
              path: currentPath,
              content: await file.text(),
              language: LANGUAGE_MAP[entry.name.split('.').pop() || 'text'] || 'text',
              handle: entry,
            });
          } else if (entry.kind === 'directory') {
            await scan(entry, currentPath);
          }
        }
      }

      try {
        await scan(dirHandle, dirHandle.name);
        setProject(dirHandle.name, loadedFiles);
        addRecentProject(dirHandle.name);
        addToast(`Loaded ${loadedFiles.length} files from ${dirHandle.name}`, 'success');
        setView('blueprint');
      } finally {
        setIsScanning(false);
      }
    } catch (err: any) {
      setIsScanning(false);
      // The user dismissing the picker is not an error worth surfacing.
      if (err?.name !== 'AbortError') {
        console.error('Directory picker failed:', err);
        addToast('Could not open that folder.', 'error');
      }
    }
  }, [addRecentProject, addToast, confirmDiscardUnsaved, setIsScanning, setProject, setView]);

  return { openProject, confirmDiscardUnsaved };
}
