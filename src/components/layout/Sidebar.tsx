import React from 'react';
import { useIDEStore } from '../../store/useIDEStore';

const Sidebar: React.FC = () => {
  const { projectPath, files, activeFile, setActiveFile, setProject, setView } = useIDEStore();

  const handleOpenFolder = async () => {
    try {
      // @ts-ignore
      const dirHandle = await window.showDirectoryPicker();
      const loadedFiles: any[] = [];
      
      async function scan(handle: any, path: string) {
        for await (const entry of handle.values()) {
          const currentPath = `${path}/${entry.name}`;
          if (entry.kind === 'file') {
            const file = await entry.getFile();
            const content = await file.text();
            loadedFiles.push({
              name: entry.name,
              path: currentPath,
              content: content,
              language: entry.name.endsWith('.ts') ? 'typescript' : 'javascript',
              handle: entry
            });
          } else if (entry.kind === 'directory') {
            await scan(entry, currentPath);
          }
        }
      }
      
      await scan(dirHandle, dirHandle.name);
      setProject(dirHandle.name, loadedFiles);
    } catch (err) {
      console.error('Directory picker failed:', err);
      // Fallback for demo if picker is cancelled or unsupported
      if (!projectPath) {
        setProject('neon-protocol', [
          { name: 'router.ts', path: 'neon-protocol/router.ts', language: 'typescript', content: '// Router logic' },
          { name: 'types.ts', path: 'neon-protocol/types.ts', language: 'typescript', content: '// Type definitions' }
        ]);
      }
    }
  };

  return (
    <aside id="main-sidebar" className="w-[240px] flex-shrink-0 h-full bg-surface border-r border-muted/30 flex flex-col z-40 transition-all overflow-hidden">
      <div className="p-4 border-b border-muted/10 bg-surface-hover/30 flex items-center justify-between">
        <h3 className="text-xs font-bold text-muted uppercase tracking-widest">System Explorer</h3>
        <span 
          onClick={handleOpenFolder}
          className="material-symbols-outlined text-muted text-xs cursor-pointer hover:text-text-main"
          title="Open Project Folder"
        >
          file_open
        </span>
      </div>
      <nav className="flex-1 overflow-y-auto p-2 custom-scrollbar">
        {!projectPath ? (
          <div className="h-full flex flex-col items-center justify-center p-4 text-center">
            <span className="material-symbols-outlined text-4xl text-muted/30 mb-2">folder_open</span>
            <p className="text-[10px] text-muted uppercase tracking-wider mb-4">No project open</p>
            <button 
              onClick={handleOpenFolder}
              className="px-4 py-2 bg-surface-hover border border-muted/30 text-text-main text-[10px] font-bold hover:bg-primary hover:text-background transition-all uppercase tracking-widest shadow-neon"
            >
              Open Folder
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3 px-3 py-2 bg-surface-hover border-l-2 border-primary text-text-main cursor-pointer group">
              <span className="material-symbols-outlined text-sm text-primary">folder_open</span>
              <span className="text-xs font-bold tracking-tight uppercase">{projectPath}</span>
            </div>
            <div className="pl-3 flex flex-col gap-0.5 mt-1">
              {files.map((file) => (
                <div 
                  key={file.path}
                  onClick={() => {
                    setActiveFile(file.path);
                    setView('code');
                  }} 
                  className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer text-[11px] font-mono transition-colors
                    ${activeFile === file.path ? 'text-primary bg-background/50 border-l-2 border-primary shadow-neon-active' : 'text-muted hover:text-text-main hover:bg-surface-hover/30'}
                  `}
                >
                  <span className={`material-symbols-outlined text-[14px] ${activeFile === file.path ? 'text-primary' : 'text-blue-400'}`}>code</span>
                  <span className="truncate">{file.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </nav>
      <div className="p-3 border-t border-muted/10 bg-surface">
        <button className="w-full flex items-center justify-center gap-2 h-9 bg-surface-hover border border-muted text-text-main text-[10px] font-bold hover:bg-primary hover:text-background transition-all uppercase tracking-widest">
          <span className="material-symbols-outlined text-sm">rocket_launch</span>
          <span>Deploy System</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
