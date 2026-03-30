import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import BlueprintCanvas from '../blueprint/BlueprintCanvas';
import ProCodeEditor from '../editor/ProCodeEditor';
import OrchestrationHub from '../orchestrator/OrchestrationHub';
import ModuleExplorer from '../copilot/ModuleExplorer';
import { useIDEStore } from '../../store/useIDEStore';

const MainLayout: React.FC = () => {
  const { currentView } = useIDEStore();

  const renderView = () => {
    switch (currentView) {
      case 'blueprint':
        return <BlueprintCanvas />;
      case 'code':
        return <ProCodeEditor />;
      case 'orchestrator':
        return <OrchestrationHub />;
      default:
        return <BlueprintCanvas />;
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-background text-text-main overflow-hidden font-display">
      <Header />
      <main className="flex-1 flex overflow-hidden relative">
        <Sidebar />
        <div className="flex-1 relative overflow-hidden">
          {renderView()}
          <ModuleExplorer />
        </div>
      </main>
      
      {/* Global Footer */}
      <footer className="h-6 bg-primary flex items-center justify-between px-3 text-background text-[10px] font-mono font-bold shrink-0 z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[12px]">account_tree</span>
            <span>main*</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[12px]">cloud_done</span>
            <span>Ollama: Active</span>
          </div>
          <span>UTF-8</span>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
