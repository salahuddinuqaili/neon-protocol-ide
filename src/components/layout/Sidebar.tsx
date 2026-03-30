import React from 'react';
import { useIDEStore } from '../../store/useIDEStore';

const Sidebar: React.FC = () => {
  const { setView } = useIDEStore();

  return (
    <aside id="main-sidebar" className="w-[240px] flex-shrink-0 h-full bg-surface border-r border-muted/30 flex flex-col z-40 transition-all overflow-hidden">
      <div className="p-4 border-b border-muted/10 bg-surface-hover/30 flex items-center justify-between">
        <h3 className="text-xs font-bold text-muted uppercase tracking-widest">System Explorer</h3>
        <span className="material-symbols-outlined text-muted text-xs cursor-pointer hover:text-text-main">create_new_folder</span>
      </div>
      <nav className="flex-1 overflow-y-auto p-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3 px-3 py-2 bg-surface-hover border-l-2 border-primary text-text-main cursor-pointer group">
            <span className="material-symbols-outlined text-sm text-primary">folder_open</span>
            <span className="text-xs font-bold tracking-tight uppercase">nexus_core</span>
          </div>
          <div className="pl-3 flex flex-col gap-0.5 mt-1">
            <div className="flex items-center gap-3 px-3 py-1.5 text-muted hover:text-text-main hover:bg-surface-hover/50 cursor-pointer transition-colors text-xs">
              <span className="material-symbols-outlined text-base">chevron_right</span>
              <span className="material-symbols-outlined text-base text-accent-ai">folder</span>
              <span>frontend</span>
            </div>
            <div className="flex items-center gap-3 px-3 py-1.5 text-text-main bg-surface-hover/50 border-l border-primary/50 cursor-pointer text-xs">
              <span className="material-symbols-outlined text-base">expand_more</span>
              <span className="material-symbols-outlined text-base text-primary">folder_open</span>
              <span className="font-bold">llm_gateway</span>
            </div>
            <div className="pl-8 flex flex-col gap-0.5 mt-0.5">
              <div onClick={() => setView('code')} className="flex items-center gap-2 px-3 py-1 text-primary bg-background/50 border-l-2 border-primary cursor-pointer text-[11px] font-mono">
                <span className="material-symbols-outlined text-[14px] text-blue-400">code</span>
                <span>router.ts</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 text-muted hover:text-text-main cursor-pointer text-[11px] font-mono transition-colors">
                <span className="material-symbols-outlined text-[14px] text-blue-400">code</span>
                <span>types.ts</span>
              </div>
            </div>
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
