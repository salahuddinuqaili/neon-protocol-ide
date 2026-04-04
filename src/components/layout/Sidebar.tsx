"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { useIDEStore } from '../../store/useIDEStore';
import { FileEntry } from '../../types';
import ContextMenu from './ContextMenu';
import InlineDialog, { DialogConfig } from './InlineDialog';
import SourceControlPanel from '../git/SourceControlPanel';
import { useGitPolling } from '../../hooks/useGitPolling';
import { LANGUAGE_MAP } from '../../config/languages';
import { GIT_STATUS_COLORS } from '../../config/git';

const MAX_FILE_SIZE = 1024 * 1024; // 1MB

function getFileIcon(name: string): string {
  if (name.endsWith('.json')) return 'settings_ethernet';
  if (name.endsWith('.md')) return 'description';
  if (name.endsWith('.css')) return 'css';
  if (name.endsWith('.html')) return 'html';
  if (name.endsWith('.py')) return 'code';
  if (name.endsWith('.ts') || name.endsWith('.tsx')) return 'code';
  if (name.endsWith('.js') || name.endsWith('.jsx')) return 'javascript';
  return 'code';
}

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
  const { refresh: refreshGit } = useGitPolling();

  const tree = useMemo(() => {
    if (!projectPath || files.length === 0) return [];
    return buildTree(files, projectPath);
  }, [files, projectPath]);

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

  const getContextMenuItems = () => {
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
            onConfirm: (newName) => {
              if (newName !== fileName) {
                renameFile(path, newName);
                addToast(`Renamed to ${newName}`, 'success');
              }
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
            message: `Are you sure you want to delete "${fileName}"? This cannot be undone.`,
            confirmLabel: 'Delete', danger: true,
            onConfirm: () => {
              deleteFile(path);
              addToast(`Deleted ${fileName}`, 'info');
            },
            onClose: () => setDialog(null),
          });
        },
      },
    ];
  };

  const handleOpenFolder = async () => {
    try {
      if (typeof window === 'undefined') return;

      const api = window.electronAPI;

      // Electron path: use IPC to get real filesystem path
      if (api?.isElectron) {
        const dirPath = await api.openDirectory();
        if (!dirPath) return;
        setIsScanning(true);

        try {
          const results = await api.scanProject(dirPath);
          const dirName = dirPath.replace(/\\/g, '/').split('/').pop() || dirPath;
          
          // Map extensions to languages on the client side
          const loadedFiles = results.map((f: any) => {
            const ext = f.name.split('.').pop() || 'text';
            return {
              ...f,
              language: LANGUAGE_MAP[ext] || 'text'
            };
          });

          setProject(dirPath.replace(/\\/g, '/'), loadedFiles);
          addRecentProject(dirName);
          addToast(`Loaded ${loadedFiles.length} files from ${dirName}`, 'success');
          setView('blueprint');
        } catch (err) {
          console.error('Scan failed:', err);
          addToast('Failed to open folder', 'error');
        } finally {
          setIsScanning(false);
        }
        return;
      }

      // Browser fallback
      if (!('showDirectoryPicker' in window)) {
        addToast('Opening folders requires Chrome or Edge. Try using one of those browsers.', 'error');
        return;
      }

      if (!window.isSecureContext && window.location.hostname !== 'localhost') {
        addToast('Secure connection required. Use HTTPS or localhost.', 'error');
        return;
      }

      const dirHandle = await (window as any as { showDirectoryPicker: () => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker();
      const loadedFiles: FileEntry[] = [];
      setIsScanning(true);

      async function scan(handle: any, path: string) {
        for await (const entry of handle.values()) {
          const currentPath = `${path}/${entry.name}`;
          if (entry.name === 'node_modules' || entry.name.startsWith('.') || entry.name === 'package-lock.json') continue;

          if (entry.kind === 'file') {
            const isCodeFile = /\.(js|ts|tsx|jsx|json|md|css|html|txt|py|rb|go|rs|c|cpp|java|yaml|yml|toml|sh|bat|sql|graphql|proto|xml|svg)$/i.test(entry.name);
            if (isCodeFile) {
              const file = await entry.getFile();
              if (file.size > MAX_FILE_SIZE) continue;
              const content = await file.text();
              const extension = entry.name.split('.').pop() || 'text';
              loadedFiles.push({ name: entry.name, path: currentPath, content, language: LANGUAGE_MAP[extension] || 'text', handle: entry });
            }
          } else if (entry.kind === 'directory') {
            await scan(entry, currentPath);
          }
        }
      }

      await scan(dirHandle, dirHandle.name);
      setProject(dirHandle.name, loadedFiles);
      addRecentProject(dirHandle.name);
      addToast(`Loaded ${loadedFiles.length} files from ${dirHandle.name}`, 'success');
      setView('blueprint');
      setIsScanning(false);
    } catch (err: any) {
      setIsScanning(false);
      if (err?.name !== 'AbortError') {
        console.error('Directory picker failed:', err);
      }
    }
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
                {tree.map(node => (
                  <FolderNode
                    key={node.path}
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
