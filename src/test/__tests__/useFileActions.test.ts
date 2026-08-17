/**
 * Ctrl+S is registered into Monaco once, inside `onMount`. @monaco-editor/react never
 * reassigns that callback, so any state the handler closes over is frozen at first render.
 * The original save closed over `activeFile` and `currentFile`, which meant Ctrl+S wrote
 * whichever file happened to be open when the editor mounted, using that file's original
 * content — silently discarding the user's real edits and overwriting a different file.
 *
 * These tests pin the property that prevents it: the save path resolves the target file
 * and its content from the store at call time.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFileActions } from '../../hooks/useFileActions';
import { useIDEStore } from '../../store/useIDEStore';

const file = (name: string, content: string, isDirty = true) => ({
  name,
  path: `/project/${name}`,
  content,
  language: 'typescript',
  isDirty,
});

describe('useFileActions', () => {
  let written: { path: string; content: string }[];

  beforeEach(() => {
    written = [];
    (window as any).electronAPI = {
      isElectron: true,
      writeFile: vi.fn(async (path: string, content: string) => {
        written.push({ path, content });
        return true;
      }),
    };

    useIDEStore.setState({
      files: [file('a.ts', 'original A'), file('b.ts', 'original B')],
      openTabs: ['/project/a.ts', '/project/b.ts'],
      activeFile: '/project/a.ts',
      toasts: [],
    });
  });

  it('saves the file that is active now, not the one active when the handler was created', async () => {
    const { result } = renderHook(() => useFileActions());
    // Capture the handler exactly as Monaco's onMount does — once, up front.
    const capturedSave = result.current.saveFile;

    // User switches tabs and edits the newly active file.
    act(() => {
      useIDEStore.getState().setActiveFile('/project/b.ts');
      useIDEStore.getState().updateFileContent('/project/b.ts', 'edited B');
    });

    await act(async () => {
      await capturedSave();
    });

    expect(written).toEqual([{ path: '/project/b.ts', content: 'edited B' }]);
  });

  it('writes the current content, not the content captured at mount', async () => {
    const { result } = renderHook(() => useFileActions());
    const capturedSave = result.current.saveFile;

    act(() => {
      useIDEStore.getState().updateFileContent('/project/a.ts', 'freshly typed');
    });

    await act(async () => {
      await capturedSave();
    });

    expect(written).toEqual([{ path: '/project/a.ts', content: 'freshly typed' }]);
  });

  it('clears the dirty flag only for the file it actually wrote', async () => {
    const { result } = renderHook(() => useFileActions());

    act(() => {
      useIDEStore.getState().updateFileContent('/project/a.ts', 'edited A');
      useIDEStore.getState().updateFileContent('/project/b.ts', 'edited B');
    });

    await act(async () => {
      await result.current.saveFile('/project/a.ts');
    });

    const files = useIDEStore.getState().files;
    expect(files.find((f) => f.name === 'a.ts')?.isDirty).toBe(false);
    expect(files.find((f) => f.name === 'b.ts')?.isDirty).toBe(true);
  });

  it('saveAll writes every dirty file with its current content', async () => {
    const { result } = renderHook(() => useFileActions());

    act(() => {
      useIDEStore.getState().updateFileContent('/project/a.ts', 'A2');
      useIDEStore.getState().updateFileContent('/project/b.ts', 'B2');
    });

    await act(async () => {
      await result.current.saveAll();
    });

    expect(written.sort((x, y) => x.path.localeCompare(y.path))).toEqual([
      { path: '/project/a.ts', content: 'A2' },
      { path: '/project/b.ts', content: 'B2' },
    ]);
    expect(useIDEStore.getState().files.every((f) => !f.isDirty)).toBe(true);
  });

  it('reports failure instead of clearing the dirty flag when the write fails', async () => {
    (window as any).electronAPI.writeFile = vi.fn(async () => false);

    const { result } = renderHook(() => useFileActions());
    act(() => {
      useIDEStore.getState().updateFileContent('/project/a.ts', 'edited A');
    });

    await act(async () => {
      await result.current.saveFile('/project/a.ts');
    });

    const a = useIDEStore.getState().files.find((f) => f.name === 'a.ts');
    expect(a?.isDirty).toBe(true);
    expect(useIDEStore.getState().toasts.some((t) => t.type === 'error')).toBe(true);
  });
});
