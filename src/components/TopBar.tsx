import React from 'react';
import { Settings, Bell, Users, Sliders, Keyboard, Workflow, Shield, Moon, Sun, FileText } from 'lucide-react';
import { useSimulation } from '../hooks/useSimulation';
import { GlobalSearchBar } from './GlobalSearchBar';
import { cn } from '../lib/utils';

export function TopBar() {
  const { 
    addToast, toasts, openRoundtableModal, roundtableSession, 
    openAgentConfigModal, openDependencyGraphModal, openWorkRequestDetailModal, toggleShortcutsModal,
    theme, setTheme
  } = useSimulation();

  const handleTestNotification = () => {
    addToast({
      title: '⚡ Agent Status Update',
      message: 'Operator manually pinged Coder agent. Status: ACTIVE.',
      type: 'agent_state',
      agentId: 'a3',
      agentName: 'Coder',
      agentRole: 'Builder',
      actionLabel: 'View Agent Logs',
      onAction: () => console.log('Opened logs')
    });
  };

  const isVoting = roundtableSession?.status === 'voting';

  return (
    <div className="h-14 border-b border-gray-800 bg-gray-900 flex items-center justify-between px-4 text-sm text-gray-300 gap-2">
      <div className="flex items-center space-x-2 shrink-0">
        <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold tracking-tighter shadow-sm">
          PL
        </div>
        <span className="font-semibold text-gray-100 tracking-wide hidden xl:inline">PLURALITY <span className="text-gray-500 font-normal">Operator Surface</span></span>
      </div>

      {/* Global Search Bar */}
      <GlobalSearchBar />

      <div className="flex items-center space-x-2 shrink-0">
        {/* Work Request Detail Button */}
        <button
          onClick={() => openWorkRequestDetailModal()}
          className="flex items-center space-x-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 px-2.5 py-1.5 rounded-md text-xs font-medium shadow-sm transition-all hover:text-white"
          title="Open Work Request Detail Popup Window"
        >
          <FileText className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden sm:inline">Request Detail</span>
        </button>

        {/* D3 Dependency Graph Button */}
        <button
          onClick={() => openDependencyGraphModal()}
          className="flex items-center space-x-2 bg-gradient-to-r from-emerald-900/80 to-teal-900/80 hover:from-emerald-800 hover:to-teal-800 border border-emerald-700/60 text-emerald-200 px-3 py-1.5 rounded-md text-xs font-semibold shadow-sm transition-all hover:shadow-emerald-900/40"
          title="Open interactive D3.js task dependency graph & waiting bottleneck analyzer"
        >
          <Workflow className="w-4 h-4 text-emerald-400" />
          <span>D3 Task Graph</span>
        </button>

        {/* Roundtable Interaction Button */}
        <button
          onClick={() => openRoundtableModal()}
          className="flex items-center space-x-2 bg-gradient-to-r from-blue-900/80 to-purple-900/80 hover:from-blue-800 hover:to-purple-800 border border-blue-700/60 text-blue-200 px-3 py-1.5 rounded-md text-xs font-semibold shadow-sm transition-all hover:shadow-blue-900/40"
        >
          <Users className="w-4 h-4 text-blue-400" />
          <span>Roundtable Mode</span>
          {isVoting ? (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          ) : roundtableSession ? (
            <span className="text-[10px] font-mono bg-blue-950 text-blue-300 border border-blue-800 px-1.5 py-0.2 rounded">
              {roundtableSession.approvalRate}%
            </span>
          ) : null}
        </button>
      </div>

      <div className="flex items-center space-x-2.5">
        {/* Theme Toolbar Toggle */}
        <div className="flex items-center bg-gray-950/80 p-0.5 rounded-lg border border-gray-800 shrink-0 shadow-inner">
          <button
            onClick={() => setTheme('steel')}
            className={cn(
              "flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-all",
              theme === 'steel'
                ? "bg-blue-600/90 text-white font-semibold shadow-sm border border-blue-500/50"
                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/60"
            )}
            title="Steel Theme (Cool slate & steel workspace atmosphere)"
          >
            <Shield className="w-3.5 h-3.5 text-blue-300" />
            <span className="hidden sm:inline text-[11px]">Steel</span>
          </button>

          <button
            onClick={() => setTheme('dark')}
            className={cn(
              "flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-all",
              theme === 'dark'
                ? "bg-purple-600/90 text-white font-semibold shadow-sm border border-purple-500/50"
                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/60"
            )}
            title="Obsidian Dark Theme (Deep pitch black workspace atmosphere)"
          >
            <Moon className="w-3.5 h-3.5 text-purple-300" />
            <span className="hidden sm:inline text-[11px]">Dark</span>
          </button>

          <button
            onClick={() => setTheme('light')}
            className={cn(
              "flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-all",
              theme === 'light'
                ? "bg-amber-500 text-gray-950 font-bold shadow-sm border border-amber-400"
                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/60"
            )}
            title="Light Theme (Clean high-contrast operational surface)"
          >
            <Sun className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline text-[11px]">Light</span>
          </button>
        </div>

        <button
          onClick={() => toggleShortcutsModal()}
          className="flex items-center space-x-1 bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 px-2 py-1.5 rounded-md text-xs font-semibold transition-colors"
          title="Press '?' for Keyboard Shortcuts Reference"
        >
          <Keyboard className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden sm:inline font-mono text-[10px] bg-gray-900 border border-gray-700 px-1 rounded text-gray-400">?</span>
        </button>

        <button
          onClick={() => openAgentConfigModal()}
          className="flex items-center space-x-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors"
          title="Configure Agent System Prompts, Temperature & Avatars"
        >
          <Sliders className="w-3.5 h-3.5 text-purple-400" />
          <span>Agent Config</span>
        </button>

        <button
          onClick={handleTestNotification}
          className="relative p-1.5 hover:bg-gray-800 rounded-md text-gray-400 hover:text-blue-400 transition-colors flex items-center space-x-1"
          title="Test Toast Alert System"
        >
          <Bell className="w-4 h-4" />
          {toasts.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-blue-500 animate-ping" />
          )}
        </button>
        <Settings 
          onClick={() => openAgentConfigModal()}
          className="w-5 h-5 text-gray-400 hover:text-gray-200 cursor-pointer transition-colors" 
          title="Open Agent Configuration Matrix"
        />
      </div>
    </div>
  );
}

