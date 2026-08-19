import React from 'react';
import { Settings, Bell, Users, Sliders, Keyboard, Workflow, FileText, HelpCircle, AlertTriangle, Flame, Split, Sparkles, LayoutTemplate, ListTodo, Activity, TrendingUp } from 'lucide-react';
import { useSimulation } from '../hooks/useSimulation';
import { GlobalSearchBar } from './GlobalSearchBar';
import { WorkspaceLayoutSelector } from './WorkspaceLayoutSelector';
import { cn } from '../lib/utils';

export function TopBar() {
  const { 
    addToast, toasts, openRoundtableModal, roundtableSession, 
    openAgentConfigModal, openDependencyGraphModal, openHeatmapModal, openWorkRequestDetailModal, toggleShortcutsModal,
    openOnboardingModal,
    openPerformanceAlertsModal, alertRules, alertHistory, alertSettings,
    isDualityMode, toggleDualityMode,
    openTaskQueueModal, agentTaskQueue, layoutConfig, setLayoutMode,
    performanceMetrics
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
  const unreadAlerts = alertHistory.filter(h => !h.acknowledged).length;
  const activeRulesCount = alertRules.filter(r => r.enabled).length;
  const pendingTasksCount = agentTaskQueue.filter(t => t.status === 'pending').length;
  const activeTasksCount = agentTaskQueue.filter(t => t.status === 'active').length;

  return (
    <div className="h-14 border-b border-gray-800 bg-gray-900 flex items-center justify-between px-4 text-sm text-gray-300 gap-2">
      <div className="flex items-center space-x-2 shrink-0">
        <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold tracking-tighter shadow-sm">
          PL
        </div>
        <span className="font-semibold text-gray-100 tracking-wide hidden xl:inline">PLURALITY</span>
      </div>

      {/* Global Search Bar */}
      <GlobalSearchBar />

      <div className="flex items-center space-x-2 shrink-0">
        {/* Agent Metrics View Mode Button */}
        <button
          id="topbar-metrics-view-btn"
          onClick={() => {
            if (layoutConfig.mode === 'metrics') {
              setLayoutMode('default');
            } else {
              setLayoutMode('metrics');
            }
          }}
          className={cn(
            "flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold shadow-sm transition-all border",
            layoutConfig.mode === 'metrics'
              ? "bg-indigo-950/90 border-indigo-500 text-indigo-200 ring-1 ring-indigo-500/40"
              : "bg-gradient-to-r from-indigo-950/80 to-purple-950/80 hover:from-indigo-900 hover:to-purple-900 border-indigo-700/60 text-indigo-200 hover:text-white"
          )}
          title="Toggle Full Workspace Agent Metrics & Lifecycle Trends View Mode"
        >
          <Activity className="w-4 h-4 text-indigo-400" />
          <span>Metrics</span>
          <span className="text-[10px] font-mono text-indigo-300 bg-indigo-950/80 border border-indigo-800/80 px-1.5 py-0.2 rounded font-semibold">
            {performanceMetrics.avgTokensPerSec} t/s
          </span>
        </button>

        {/* Agent Task Queue Button */}
        <button
          id="topbar-task-queue-btn"
          onClick={() => {
            if (layoutConfig.mode === 'queue') {
              openTaskQueueModal();
            } else {
              setLayoutMode('queue');
            }
          }}
          className={cn(
            "flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold shadow-sm transition-all border",
            layoutConfig.mode === 'queue'
              ? "bg-blue-950/90 border-blue-500 text-blue-200 ring-1 ring-blue-500/40"
              : "bg-gradient-to-r from-blue-950/80 to-indigo-950/80 hover:from-blue-900 hover:to-indigo-900 border-blue-700/60 text-blue-200 hover:text-white"
          )}
          title="Open Agent Task Queue (Architect & Builder Sub-Tasks)"
        >
          <ListTodo className="w-4 h-4 text-blue-400" />
          <span>Task Queue</span>
          {activeTasksCount > 0 ? (
            <span className="px-1.5 py-0.2 rounded-full bg-cyan-500 text-gray-950 font-mono text-[10px] font-bold animate-pulse">
              {activeTasksCount} active
            </span>
          ) : pendingTasksCount > 0 ? (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-600 text-white font-mono text-[10px] font-bold">
              {pendingTasksCount}
            </span>
          ) : (
            <span className="text-[10px] font-mono text-gray-400 bg-gray-950 border border-gray-800 px-1 rounded">
              {agentTaskQueue.length}
            </span>
          )}
        </button>

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
          <span>Task Graph</span>
        </button>

        {/* Global Agent Activity Heatmap Button */}
        <button
          onClick={() => openHeatmapModal()}
          className="flex items-center space-x-2 bg-gradient-to-r from-amber-900/80 via-purple-900/80 to-cyan-900/80 hover:from-amber-800 hover:via-purple-800 hover:to-cyan-800 border border-purple-700/60 text-purple-200 px-3 py-1.5 rounded-md text-xs font-semibold shadow-sm transition-all hover:shadow-purple-900/40"
          title="Open interactive D3.js Global Agent Activity & Compute Density Heatmap"
        >
          <Flame className="w-4 h-4 text-amber-400 fill-amber-400/30" />
          <span>Activity</span>
        </button>

        {/* Roundtable Interaction Button */}
        <button
          onClick={() => openRoundtableModal()}
          className="flex items-center space-x-2 bg-gradient-to-r from-blue-900/80 to-purple-900/80 hover:from-blue-800 hover:to-purple-800 border border-blue-700/60 text-blue-200 px-3 py-1.5 rounded-md text-xs font-semibold shadow-sm transition-all hover:shadow-blue-900/40"
          title="Open Consensus Roundtable Modal"
        >
          <Users className="w-4 h-4 text-blue-400" />
          <span>Roundtable</span>
          {isVoting ? (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          ) : roundtableSession ? (
            <span className="text-[10px] font-mono bg-blue-950 text-blue-300 border border-blue-800 px-1.5 py-0.2 rounded">
              {roundtableSession.approvalRate}%
            </span>
          ) : null}
        </button>

        {/* Duality Mode Toggle Button */}
        <button
          id="duality-mode-toggle-btn"
          onClick={() => toggleDualityMode()}
          className={cn(
            "flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-semibold shadow-sm transition-all duration-200 border",
            isDualityMode
              ? "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 border-indigo-400 text-white shadow-indigo-900/50 ring-1 ring-indigo-400/40"
              : "bg-gray-800 hover:bg-gray-700/90 border-gray-700 text-gray-300 hover:text-white"
          )}
          title="Toggle Duality Mode — 1:1 Operator Interaction with Architect & Inter-Agent Builder Execution"
        >
          <Split className={cn("w-3.5 h-3.5", isDualityMode ? "text-white animate-pulse" : "text-purple-400")} />
          <span>Duality</span>
          <span className={cn(
            "text-[10px] font-mono px-1.5 py-0.5 rounded uppercase font-bold tracking-wider",
            isDualityMode
              ? "bg-black/30 text-emerald-300 border border-emerald-400/30"
              : "bg-gray-900 text-gray-400 border border-gray-700"
          )}>
            {isDualityMode ? 'ON' : 'OFF'}
          </span>
        </button>
      </div>

      <div className="flex items-center space-x-2.5">
        {/* Workspace Layout Manager View Mode Selector */}
        <WorkspaceLayoutSelector />

        <button
          onClick={() => openOnboardingModal()}
          className="flex items-center space-x-1.5 bg-blue-950/80 hover:bg-blue-900 border border-blue-700/80 text-blue-200 px-2.5 py-1.5 rounded-md text-xs font-semibold shadow-sm transition-all hover:text-white"
          title="Launch Interactive Layout & Multi-Agent Onboarding Tutorial"
        >
          <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden sm:inline">Tutorial Tour</span>
        </button>

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

        {/* Performance Threshold Alerts Configuration Button */}
        <button
          onClick={() => openPerformanceAlertsModal()}
          className={cn(
            "flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all border shadow-sm",
            unreadAlerts > 0
              ? "bg-amber-950/80 border-amber-600/80 text-amber-200 hover:bg-amber-900"
              : "bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700"
          )}
          title="Configure Global Performance Threshold Alerts (Latency, Throughput, Tokens, Errors)"
        >
          <Bell className={cn("w-3.5 h-3.5", unreadAlerts > 0 ? "text-amber-400 animate-bounce" : "text-blue-400")} />
          <span>Alerts</span>
          {unreadAlerts > 0 ? (
            <span className="px-1 py-0.2 rounded-full bg-rose-600 text-white font-mono text-[10px] font-bold">
              {unreadAlerts}
            </span>
          ) : (
            <span className="text-[10px] font-mono text-gray-400 bg-gray-900 border border-gray-700 px-1 rounded">
              {activeRulesCount}
            </span>
          )}
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

