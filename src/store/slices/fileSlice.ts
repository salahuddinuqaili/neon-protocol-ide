import { StateCreator } from 'zustand';
import { FileEntry } from '../../types';
import { getLanguageForExtension } from '../../config/languages';

export interface FileSlice {
  projectPath: string | null;
  files: FileEntry[];
  openTabs: string[];
  activeFile: string | null;
  isScanning: boolean;

  setProject: (path: string | null, files: FileEntry[]) => void;
  openFile: (path: string) => void;
  setActiveFile: (path: string | null) => void;
  updateFileContent: (path: string, content: string) => void;
  closeTab: (path: string) => void;
  markFileSaved: (path: string) => void;
  createFile: (name: string, folderPath: string) => void;
  renameFile: (oldPath: string, newName: string) => void;
  deleteFile: (path: string) => void;
  ensureFiles: (files: FileEntry[]) => void;
  closeProject: () => void;
  setIsScanning: (scanning: boolean) => void;
}

export const createFileSlice: StateCreator<FileSlice, [], [], FileSlice> = (set) => ({
  projectPath: null,
  files: [],
  openTabs: [],
  activeFile: null,
  isScanning: false,

  setProject: (path, files) => set({
    projectPath: path,
    files: files.map(f => ({ ...f, isDirty: false })),
    openTabs: files.length > 0 ? [files[0].path] : [],
    activeFile: files.length > 0 ? files[0].path : null,
    isScanning: false,
  }),

  openFile: (path) => set((state) => ({
    openTabs: state.openTabs.includes(path) ? state.openTabs : [...state.openTabs, path],
    activeFile: path,
  })),

  setActiveFile: (path) => set({ activeFile: path }),

  updateFileContent: (path, content) => set((state) => ({
    files: state.files.map(f => f.path === path ? { ...f, content, isDirty: true } : f),
  })),

  closeTab: (path) => set((state) => {
    const newTabs = state.openTabs.filter(t => t !== path);
    let newActive = state.activeFile;
    if (state.activeFile === path) {
      const idx = state.openTabs.indexOf(path);
      newActive = newTabs[Math.min(idx, newTabs.length - 1)] || null;
    }
    return { openTabs: newTabs, activeFile: newActive };
  }),

  markFileSaved: (path) => set((state) => ({
    files: state.files.map(f => f.path === path ? { ...f, isDirty: false } : f),
  })),

  createFile: (name, folderPath) => set((state) => {
    const path = folderPath ? `${folderPath}/${name}` : `${state.projectPath}/${name}`;
    const ext = name.split('.').pop() || 'text';
    const newFile: FileEntry = {
      name, path, content: '',
      language: getLanguageForExtension(ext) || 'text',
      isDirty: true,
    };
    return {
      files: [...state.files, newFile],
      openTabs: [...state.openTabs, path],
      activeFile: path,
    };
  }),

  renameFile: (oldPath, newName) => set((state) => {
    const parts = oldPath.split('/');
    parts[parts.length - 1] = newName;
    const newPath = parts.join('/');
    const ext = newName.split('.').pop() || 'text';
    return {
      files: state.files.map(f =>
        f.path === oldPath
          ? { ...f, name: newName, path: newPath, language: getLanguageForExtension(ext) || f.language, isDirty: true }
          : f
      ),
      openTabs: state.openTabs.map(t => t === oldPath ? newPath : t),
      activeFile: state.activeFile === oldPath ? newPath : state.activeFile,
    };
  }),

  deleteFile: (path) => set((state) => {
    const remaining = state.files.filter(f => f.path !== path);
    const newTabs = state.openTabs.filter(t => t !== path);
    return {
      files: remaining,
      openTabs: newTabs,
      activeFile: state.activeFile === path ? (newTabs.length > 0 ? newTabs[0] : null) : state.activeFile,
    };
  }),

  ensureFiles: (incoming) => set((state) => {
    const existingPaths = new Set(state.files.map(f => f.path));
    const newFiles = incoming.filter(f => !existingPaths.has(f.path));
    if (newFiles.length === 0) return state;
    return { files: [...state.files, ...newFiles] };
  }),

  closeProject: () => set({
    projectPath: null,
    files: [],
    openTabs: [],
    activeFile: null,
  }),

  setIsScanning: (scanning) => set({ isScanning: scanning }),
});
