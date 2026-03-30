import React from 'react';
import { useIDEStore } from '../../store/useIDEStore';

const Sidebar: React.FC = () => {
  const { setView } = useIDEStore();

  const files = [
    { name: 'router.ts', type: 'code', color: 'blue-400', active: true },
    { name: 'types.ts', type: 'code', color: 'blue-400' },
    { name: 'config.yml', type: 'description', color: 'yellow-500' },
  ];

  return (
    <aside id="main-sidebar" className="w-[240px] flex-shrink-0 h-full bg-surface border-r border-muted/30 flex flex-col z-40 transition-all overflow-hidden">
      <div className="p-4 border-b border-muted/10 bg-surface-hover/30 flex items-center justify-between">
        <h3 className="text-xs font-bold text-muted uppercase tracking-widest">System Explorer</h3>
        <span className="material-symbols-outlined text-muted text-xs cursor-pointer hover:text-text-main">create_new_folder</span>
      </div>
      <nav className="flex-1 overflow-y-auto p-2 custom-scrollbar">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3 px-3 py-2 bg-surface-hover border-l-2 border-primary text-text-main cursor-pointer group">
            <span className="material-symbols-outlined text-sm text-primary">folder_open</span>
            <span className="text-xs font-bold tracking-tight uppercase">nexus_core</span>
          </div>
          <div className="pl-3 flex flex-col gap-0.5 mt-1">
            {['frontend', 'llm_gateway', 'database'].map((folder) => (
              <React.Fragment key={folder}>
                <div className={`flex items-center gap-3 px-3 py-1.5 cursor-pointer transition-colors text-xs
                  ${folder === 'llm_gateway' ? 'text-text-main bg-surface-hover/50 border-l border-primary/50' : 'text-muted hover:text-text-main hover:bg-surface-hover/50'}
                `}>
                  <span className="material-symbols-outlined text-base">
                    {folder === 'llm_gateway' ? 'expand_more' : 'chevron_right'}
                  </span>
                  <span className={`material-symbols-outlined text-base 
                    ${folder === 'frontend' ? 'text-accent-ai' : folder === 'database' ? 'text-accent-error' : 'text-primary'}
                  `}>
                    {folder === 'llm_gateway' ? 'folder_open' : 'folder'}
                  </span>
                  <span className={folder === 'llm_gateway' ? 'font-bold' : ''}>{folder}</span>
                </div>
                {folder === 'llm_gateway' && (
                  <div className="pl-8 flex flex-col gap-0.5 mt-0.5">
                    {files.map((file) => (
                      <div 
                        key={file.name}
                        onClick={() => setView('code')} 
                        className={`flex items-center gap-2 px-3 py-1 cursor-pointer text-[11px] font-mono transition-colors
                          ${file.active ? 'text-primary bg-background/50 border-l-2 border-primary' : 'text-muted hover:text-text-main'}
                        `}
                      >
                        <span className={`material-symbols-outlined text-[14px] text-${file.color}`}>{file.type}</span>
                        <span>{file.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
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
