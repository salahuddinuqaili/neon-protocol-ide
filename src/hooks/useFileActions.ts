"use client";

import { useCallback } from 'react';
import { useIDEStore } from '../store/useIDEStore';
import { FileEntry } from '../types';

/**
 * Saving used to live inside ProCodeEditor, bound to a keydown on its container div —
 * so it only worked while focus was inside the editor, and the File menu had no way to
 * reach it. Shared here so the menu, the editor, and Save All all use one implementation.
 */
export function useFileActions() {
  const markFileSaved = useIDEStore((s) => s.markFileSaved);
  const addToast = useIDEStore((s) => s.addToast);

  /** Writes one file to disk. Returns true when the write succeeded. */
  const writeFile = useCallback(async (file: FileEntry): Promise<boolean> => {
    const api = typeof window !== 'undefined' ? window.electronAPI : undefined;

    if (api?.isElectron) {
      try {
        const success = await api.writeFile(file.path, file.content);
        if (success) {
          markFileSaved(file.path);
          return true;
        }
      } catch {
        // Fall through to the shared failure path below.
      }
      return false;
    }

    // Browser mode: write back through the File System Access handle if we have one.
    if (file.handle) {
      try {
        const writable = await file.handle.createWritable();
        await writable.write(file.content);
        await writable.close();
        markFileSaved(file.path);
        return true;
      } catch {
        return false;
      }
    }

    // No handle (a file created in-app in browser mode) — nothing to write to.
    markFileSaved(file.path);
    return true;
  }, [markFileSaved]);

  /** Saves the active file, or a specific path when given one. */
  const saveFile = useCallback(async (path?: string) => {
    const { files, activeFile } = useIDEStore.getState();
    const target = path ?? activeFile;
    if (!target) return;

    const file = files.find((f) => f.path === target);
    if (!file) return;
    if (!file.isDirty) return; // nothing to write

    const ok = await writeFile(file);
    addToast(ok ? `Saved ${file.name}` : `Could not save ${file.name}`, ok ? 'success' : 'error');
  }, [addToast, writeFile]);

  const saveAll = useCallback(async () => {
    const dirty = useIDEStore.getState().files.filter((f) => f.isDirty);
    if (dirty.length === 0) {
      addToast('No unsaved changes', 'info');
      return;
    }

    const results = await Promise.all(dirty.map(writeFile));
    const failed = results.filter((ok) => !ok).length;

    if (failed === 0) {
      addToast(`Saved ${dirty.length} file${dirty.length === 1 ? '' : 's'}`, 'success');
    } else {
      addToast(`Saved ${dirty.length - failed} of ${dirty.length} files — ${failed} failed`, 'error');
    }
  }, [addToast, writeFile]);

  return { saveFile, saveAll };
}
