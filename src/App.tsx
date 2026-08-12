import React, { useEffect } from 'react';
import { TopBar } from './components/TopBar';
import { WorkRequestList } from './components/WorkRequestList';
import { PlanView } from './components/PlanView';
import { ExecutionView } from './components/ExecutionView';
import { FileTreeSidebar } from './components/FileTreeSidebar';
import { TerminalPanel } from './components/TerminalPanel';
import { StateTimeline } from './components/StateTimeline';
import { AgentLogDrawer } from './components/AgentLogDrawer';
import { ToastContainer } from './components/ToastContainer';
import { RoundtableModal } from './components/RoundtableModal';
import { AgentConfigModal } from './components/AgentConfigModal';
import { AgentDependencyGraphModal } from './components/AgentDependencyGraphModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { WorkRequestDetailModal } from './components/WorkRequestDetailModal';
import { useSimulation } from './hooks/useSimulation';

export default function App() {
  const { theme } = useSimulation();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-950 font-sans overflow-hidden text-gray-100 relative">
      <TopBar />
      
      <div className="flex-1 flex overflow-hidden relative">
        <WorkRequestList />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <StateTimeline />

          {/* Main IDE Area */}
          <div className="flex-1 flex overflow-hidden">
            <PlanView />
            <ExecutionView />
          </div>
          
          {/* Bottom Panel */}
          <TerminalPanel />
        </div>

        <FileTreeSidebar />
        <AgentLogDrawer />
        <ToastContainer />
        <RoundtableModal />
        <AgentConfigModal />
        <AgentDependencyGraphModal />
        <KeyboardShortcutsModal />
        <WorkRequestDetailModal />
      </div>
    </div>
  );
}



