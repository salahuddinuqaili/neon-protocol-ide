"use client";

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useIDEStore } from '../../store/useIDEStore';
import { FileEntry } from '../../types';
import ContextMenu, { MenuItem } from './ContextMenu';
import InlineDialog, { DialogConfig } from './InlineDialog';
import SourceControlPanel from '../git/SourceControlPanel';
import { useGitPolling } from '../../hooks/useGitPolling';
import { useOpenProject } from '../../hooks/useOpenProject';
import { LANGUAGE_MAP } from '../../config/languages';
import { GIT_STATUS_COLORS } from '../../config/git';
import { getFileIcon } from '../../config/icons';

const MAX_FILE_SIZE = 1024 * 1024; // 1MB

interface TreeNode {
  name: string;
  path: string;
  isFolder: boolean;
  children: TreeNode[];
  file?: FileEntry;
}

function buildTree(files: FileEntry[], rootPath: string): TreeNode[] {
  const rootName = rootPath.includes('/') ? rootPath.split('/').pop() || rootPath : rootPath;
  const root: TreeNode = { name: rootName, path: rootPath, isFolder: true, children: [] };

  for (const file of files) {
    const relPath = file.path.startsWith(rootPath)
      ? file.path.substring(rootPath.length).replace(/^[\\\/]/, '')
      : file.path;
    const parts = relPath.split('/');
    let current = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!part) continue;
      const isLast = i === parts.length - 1;
      if (isLast) {
        current.children.push({ name: part, path: file.path, isFolder: false, children: [], file });
      } else {
        let folder = current.children.find(c => c.isFolder && c.name === part);
        if (!folder) {
          const folderPath = rootPath + '/' + parts.slice(0, i + 1).join('/');
          folder = { name: part, path: folderPath, isFolder: true, children: [] };
          current.children.push(folder);
        }
        current = folder;
      }
    }
  }

  function sortTree(nodes: TreeNode[]): TreeNode[] {
    return nodes.sort((a, b) => {
      if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1;
      return a.name.localeCompare(b.name);
    }).map(n => ({ ...n, children: sortTree(n.children) }));
  }

  return sortTree(root.children);
}

const FolderNode: React.FC<{
  node: TreeNode;
  depth: number;
  activeFile: string | null;
  gitStatusMap: Record<string, string>;
  onFileClick: (path: string) => void;
  onContextMenu: (e: React.MouseEvent, path: string, isFolder: boolean) => void;
}> = ({ node, depth, activeFile, gitStatusMap, onFileClick, onContextMenu }) => {
  const [expanded, setExpanded] = useState(depth < 2);

  if (!node.isFolder) {
    const gitStatus = gitStatusMap[node.name];
    return (
      <div
        title={node.path}
        onClick={() => onFileClick(node.path)}
        onContextMenu={(e) => { e.preventDefault(); onContextMenu(e, node.path, false); }}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        className={`flex items-center gap-2 py-1 pr-2 cursor-pointer text-xs font-mono transition-colors
          ${activeFile === node.path
            ? 'text-primary bg-background/50 border-l-2 border-primary'
            : 'text-muted hover:text-text-main hover:bg-surface-hover/30 border-l-2 border-transparent'}
        `}
      >
        <span className={`material-symbols-outlined text-[14px] shrink-0 ${activeFile === node.path ? 'text-primary' : 'text-blue-400'}`}>
          {getFileIcon(node.name)}
        </span>
        <span className="truncate">{node.name}</span>
        {gitStatus && (
          <span className={`text-[10px] font-mono font-bold ml-auto shrink-0 ${GIT_STATUS_COLORS[gitStatus] || 'text-muted'}`}>
            {gitStatus === '?' ? 'U' : gitStatus}
          </span>
        )}
        {!gitStatus && node.file?.isDirty && <span className="w-1.5 h-1.5 rounded-full bg-accent-error shrink-0 ml-auto" />}
      </div>
    );
  }

  return (
    <div>
      <div
        onClick={() => setExpanded(!expanded)}
        onContextMenu={(e) => { e.preventDefault(); onContextMenu(e, node.path, true); }}
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
        className="flex items-center gap-1.5 py-1 pr-2 cursor-pointer text-xs font-mono text-muted hover:text-text-main transition-colors"
      >
        <span className={`material-symbols-outlined text-[14px] transition-transform ${expanded ? '' : '-rotate-90'}`}>
          expand_more
        </span>
        <span className="material-symbols-outlined text-[14px] text-muted/70">
          {expanded ? 'folder_open' : 'folder'}
        </span>
        <span className="truncate">{node.name}</span>
      </div>
      {expanded && node.children.map(child => (
        <FolderNode
          key={child.path}
          node={child}
          depth={depth + 1}
          activeFile={activeFile}
          gitStatusMap={gitStatusMap}
          onFileClick={onFileClick}
          onContextMenu={onContextMenu}
        />
      ))}
    </div>
  );
};

type SidebarTab = 'files' | 'git';

const Sidebar: React.FC = () => {
  const {
    projectPath, files, activeFile, openFile, setProject, setView, gitState,
    isScanning, setIsScanning, addToast, createFile, renameFile, deleteFile, addRecentProject, closeProject
  } = useIDEStore();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; path: string; isFolder: boolean } | null>(null);
  const [dialog, setDialog] = useState<DialogConfig | null>(null);
  const [activeTab, setActiveTab] = useState<SidebarTab>('files');
  const [fileFilter, setFileFilter] = useState('');
  const [collapseKey, setCollapseKey] = useState(0);
  const { refresh: refreshGit } = useGitPolling();
  const { openProject: handleOpenFolder } = useOpenProject();
  const isElectron = typeof window !== 'undefined' && !!window.electronAPI?.isElectron;

  // Reset to files tab when project closes
  useEffect(() => {
    if (!projectPath) setActiveTab('files');
  }, [projectPath]);

  const filteredFiles = useMemo(() => {
    if (!fileFilter) return files;
    const lower = fileFilter.toLowerCase();
    return files.filter(f => f.name.toLowerCase().includes(lower) || f.path.toLowerCase().includes(lower));
  }, [files, fileFilter]);

  const tree = useMemo(() => {
    if (!projectPath || filteredFiles.length === 0) return [];
    return buildTree(filteredFiles, projectPath);
  }, [filteredFiles, projectPath]);

  // Build a map of filename -> git status for file tree indicators
  const gitStatusMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const f of gitState.files) {
      const fileName = f.path.split('/').pop() || f.path;
      const status = f.isStaged ? f.indexStatus : (f.workTreeStatus !== ' ' ? f.workTreeStatus : f.indexStatus);
      if (status && status !== ' ') map[fileName] = status;
    }
    return map;
  }, [gitState.files]);

  const handleFileClick = (path: string) => {
    openFile(path);
    setView('code');
  };

  const handleContextMenu = useCallback((e: React.MouseEvent, path: string, isFolder: boolean) => {
    setContextMenu({ x: e.clientX, y: e.clientY, path, isFolder });
  }, []);

  /**
   * Renames on disk first, and only mirrors the change into the store when that succeeds.
   * These actions used to update the store alone, so the app reported "Deleted file.ts"
   * while the file was still on disk and reappeared the next time the folder was opened.
   */
  const handleRenameFile = async (filePath: string, newName: string) => {
    const api = typeof window !== 'undefined' ? window.electronAPI : undefined;

    if (api?.renameFile) {
      const parts = filePath.split('/');
      parts[parts.length - 1] = newName;
      const result = await api.renameFile(filePath, parts.join('/'));
      if (!result.success) {
        addToast(result.error || 'Could not rename the file.', 'error');
        return;
      }
    }

    renameFile(filePath, newName);
    addToast(`Renamed to ${newName}`, 'success');
    refreshGit();
  };

  const handleDeleteFile = async (filePath: string, fileName: string) => {
    const api = typeof window !== 'undefined' ? window.electronAPI : undefined;

    if (api?.deleteFile) {
      const result = await api.deleteFile(filePath);
      if (!result.success) {
        addToast(result.error || 'Could not delete the file.', 'error');
        return;
      }
    }

    deleteFile(filePath);
    addToast(isElectron ? `Moved ${fileName} to trash` : `Removed ${fileName}`, 'info');
    refreshGit();
  };

  const getContextMenuItems = (): MenuItem[] => {
    if (!contextMenu) return [];
    const { path, isFolder } = contextMenu;

    if (isFolder) {
      return [
        {
          label: 'New File',
          icon: 'note_add',
          action: () => {
            setDialog({
              isOpen: true, type: 'prompt', title: 'New File', placeholder: 'filename.ts',
              onConfirm: (name) => {
                createFile(name, path);
                setView('code');
                addToast(`Created ${name}`, 'success');
              },
              onClose: () => setDialog(null),
            });
          },
        },
      ];
    }

    const fileName = path.split('/').pop() || '';
    return [
      {
        label: 'Rename',
        icon: 'edit',
        action: () => {
          setDialog({
            isOpen: true, type: 'prompt', title: 'Rename File', defaultValue: fileName,
            onConfirm: async (newName) => {
              const trimmed = newName.trim();
              if (!trimmed || trimmed === fileName) return;
              if (/[\\/]/.test(trimmed)) {
                addToast('A file name cannot contain slashes.', 'error');
                return;
              }
              await handleRenameFile(path, trimmed);
            },
            onClose: () => setDialog(null),
          });
        },
      },
      {
        label: 'Delete',
        icon: 'delete',
        danger: true,
        action: () => {
          setDialog({
            isOpen: true, type: 'confirm', title: 'Delete File',
            message: `Delete "${fileName}"? It will be moved to your ${isElectron ? 'trash' : 'workspace list'} and can be restored from there.`,
            confirmLabel: 'Delete', danger: true,
            onConfirm: () => handleDeleteFile(path, fileName),
            onClose: () => setDialog(null),
          });
        },
      },
    ];
  };

  return (
    <aside data-tutorial="sidebar" className="w-[240px] flex-shrink-0 h-full bg-surface border-r border-muted/30 flex flex-col z-40 transition-all overflow-hidden">
      <div className="p-4 border-b border-muted/10 bg-surface-hover/30 flex items-center justify-between">
        <h3 className="text-xs font-bold text-muted uppercase tracking-widest">Explorer</h3>
        <button
          onClick={handleOpenFolder}
          className="material-symbols-outlined text-muted text-xs cursor-pointer hover:text-text-main transition-colors"
          title="Open Project Folder"
          aria-label="Open project folder"
        >
          file_open
        </button>
      </div>

      {/* Tab bar */}
      {projectPath && (
        <div className="flex border-b border-muted/10 bg-surface/50 shrink-0">
          <button
            onClick={() => setActiveTab('files')}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors border-b-2 ${
              activeTab === 'files' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-text-main'
            }`}
          >
            Files
          </button>
          <button
            onClick={() => setActiveTab('git')}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors border-b-2 ${
              activeTab === 'git' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-text-main'
            }`}
          >
            Git
            {gitState.changedFileCount > 0 && (
              <span className="text-[10px] text-accent-warning font-mono">{gitState.changedFileCount}</span>
            )}
          </button>
        </div>
      )}

      {/* Content */}
      {activeTab === 'git' && projectPath ? (
        <SourceControlPanel onRefresh={refreshGit} />
      ) : (
        <>
          <nav className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
            {isScanning ? (
              <div className="h-full flex flex-col items-center justify-center p-4 text-center gap-3">
                <span className="material-symbols-outlined text-2xl text-primary animate-spin">progress_activity</span>
                <p className="text-xs text-muted uppercase tracking-wider">Scanning files...</p>
              </div>
            ) : !projectPath ? (
              <div className="h-full flex flex-col items-center justify-center p-4 text-center gap-3">
                <span className="material-symbols-outlined text-4xl text-muted/30">folder_open</span>
                <div>
                  <p className="text-xs text-text-main mb-1">No project open</p>
                  <p className="text-xs text-muted leading-relaxed">Open a folder from your computer to see its files here</p>
                </div>
                <button
                  onClick={handleOpenFolder}
                  className="px-5 py-2.5 bg-primary text-background text-xs font-bold hover:bg-[#0cf1f1] transition-all uppercase tracking-widest shadow-neon"
                >
                  Open Folder
                </button>
              </div>
            ) : (
              <div className="py-1">
                <div className="flex items-center gap-2 px-3 py-2 bg-surface-hover/50 border-b border-muted/10">
                  <span className="material-symbols-outlined text-sm text-primary">folder_open</span>
                  <span className="text-xs font-bold tracking-tight uppercase text-text-main truncate">{projectPath.split('/').pop() || projectPath}</span>
                  <span className="text-[11px] text-muted ml-auto shrink-0">{files.length}</span>
                  <button
                    onClick={() => {
                      setDialog({
                        isOpen: true, type: 'prompt', title: 'New File', placeholder: 'filename.ts',
                        onConfirm: (name) => {
                          createFile(name, projectPath || '');
                          setView('code');
                          addToast(`Created ${name}`, 'success');
                        },
                        onClose: () => setDialog(null),
                      });
                    }}
                    className="material-symbols-outlined text-[14px] text-muted hover:text-primary transition-colors"
                    title="New file"
                  >
                    note_add
                  </button>
                  <button
                    onClick={() => { setCollapseKey(k => k + 1); setFileFilter(''); }}
                    className="material-symbols-outlined text-[14px] text-muted hover:text-primary transition-colors"
                    title="Collapse all"
                  >
                    unfold_less
                  </button>
                  <button
                    onClick={() => {
                      setDialog({
                        isOpen: true, type: 'confirm', title: 'Close Project',
                        message: `Close "${projectPath.split('/').pop() || projectPath}"? Unsaved changes will be lost.`,
                        confirmLabel: 'Close', danger: true,
                        onConfirm: () => { closeProject(); addToast('Project closed', 'info'); },
                        onClose: () => setDialog(null),
                      });
                    }}
                    className="material-symbols-outlined text-[14px] text-muted hover:text-accent-error transition-colors"
                    title="Close project"
                  >
                    close
                  </button>
                </div>
                {files.length > 15 && (
                  <div className="px-2 py-1.5 border-b border-muted/10">
                    <input
                      value={fileFilter}
                      onChange={e => setFileFilter(e.target.value)}
                      placeholder="Filter files..."
                      className="w-full bg-background border border-muted/30 text-text-main text-[11px] font-mono px-2 py-1 focus:outline-none focus:border-primary placeholder-muted"
                    />
                  </div>
                )}
                {tree.map(node => (
                  <FolderNode
                    key={`${node.path}-${collapseKey}`}
                    node={node}
                    depth={0}
                    activeFile={activeFile}
                    gitStatusMap={gitStatusMap}
                    onFileClick={handleFileClick}
                    onContextMenu={handleContextMenu}
                  />
                ))}
                {contextMenu && (
                  <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    items={getContextMenuItems()}
                    onClose={() => setContextMenu(null)}
                  />
                )}
              </div>
            )}
          </nav>
          <div className="p-3 border-t border-muted/10 bg-surface">
            <button
              onClick={handleOpenFolder}
              title="Open a project folder from your computer"
              className="w-full flex items-center justify-center gap-2 h-9 bg-surface-hover border border-muted text-text-main text-xs font-bold hover:bg-primary hover:text-background transition-all uppercase tracking-widest"
            >
              <span className="material-symbols-outlined text-sm">folder_open</span>
              <span>Open Project</span>
            </button>
          </div>
        </>
      )}
      {dialog && <InlineDialog {...dialog} />}
    </aside>
  );
};

export default Sidebar;
