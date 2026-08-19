import React, { useState } from 'react';
import { useSimulation } from '../hooks/useSimulation';
import { 
  TrendingUp, Activity, Cpu, Clock, Zap, Layers, BarChart3, 
  Flame, Bell, RotateCcw, ArrowLeft, LayoutTemplate, ShieldCheck, 
  Sparkles, CheckCircle2, ChevronRight, TerminalSquare, RefreshCw
} from 'lucide-react';
import { cn } from '../lib/utils';
import { TaskLifecycleTrendsChart } from './TaskLifecycleTrendsChart';
import { AgentMetricItem, TaskMetricRecord } from '../types';

export function AgentMetricsDashboard() {
  const { 
    performanceMetrics, 
    resetPerformanceMetrics, 
    selectAgentForLogs, 
    openPerformanceAlertsModal,
    openHeatmapModal,
    alertRules,
    alertHistory,
    setLayoutMode
  } = useSimulation();

  const [selectedTab, setSelectedTab] = useState<'trends' | 'agents' | 'history' | 'tokens'>('trends');
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const unreadAlerts = alertHistory.filter(h => !h.acknowledged).length;
  const activeRulesCount = alertRules.filter(r => r.enabled).length;

  const {
    totalTasksCompleted,
    activeTasksRunning,
    avgTaskDurationMs,
    lastTaskDurationMs,
    totalTokens,
    totalPromptTokens,
    totalCompletionTokens,
    avgTokensPerSec,
    successRatePercent,
    agentMetrics,
    recentTaskHistory
  } = performanceMetrics;

  const promptPercent = totalTokens > 0 ? Math.round((totalPromptTokens / totalTokens) * 100) : 0;
  const completionPercent = totalTokens > 0 ? 100 - promptPercent : 0;

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const handleAgentClick = (agentId: string) => {
    selectAgentForLogs(agentId);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-950 text-gray-100 overflow-hidden select-none border-x border-gray-800/80">
      {/* Top Banner / Navigation Header */}
      <div className="px-4 py-3 bg-gray-900/90 border-b border-gray-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-indigo-600/20 border border-indigo-500/40 text-indigo-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-gray-100 tracking-wide">
                Agent Metrics & Lifecycle Telemetry
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700 font-semibold uppercase tracking-wider">
                Workspace View Mode
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Real-time multi-agent execution analytics, stage-by-stage lifecycle trends, token velocity, and SLA monitoring
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Activity Heatmap Button */}
          <button
            onClick={() => openHeatmapModal()}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-purple-700/80 bg-purple-950/70 hover:bg-purple-900/80 text-purple-200 hover:text-white transition-all shadow-sm"
            title="Open interactive D3.js Global Agent Activity & Compute Density Heatmap"
          >
            <Flame className="w-4 h-4 text-amber-400 fill-amber-400/20" />
            <span>Activity Heatmap</span>
          </button>

          {/* Threshold Alerts Button */}
          <button
            onClick={() => openPerformanceAlertsModal()}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all shadow-sm",
              unreadAlerts > 0
                ? "bg-amber-950/90 border-amber-600 text-amber-200 hover:bg-amber-900"
                : "bg-gray-800/90 hover:bg-gray-700/90 border-gray-700 text-gray-200 hover:text-white"
            )}
            title="Configure global performance threshold alerts and SLA triggers"
          >
            <Bell className={cn("w-4 h-4", unreadAlerts > 0 ? "text-amber-400 animate-bounce" : "text-blue-400")} />
            <span>Threshold Alerts</span>
            {unreadAlerts > 0 ? (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white font-mono text-[10px] font-bold">
                {unreadAlerts}
              </span>
            ) : (
              <span className="text-[10px] font-mono text-gray-400 bg-gray-900 px-1.5 rounded border border-gray-700/80">
                {activeRulesCount}
              </span>
            )}
          </button>

          {/* Reset Metrics Confirmation */}
          {isResetConfirmOpen ? (
            <div className="flex items-center gap-1.5 bg-rose-950/90 border border-rose-800 rounded-lg px-2.5 py-1">
              <span className="text-xs text-rose-200">Reset stats?</span>
              <button
                onClick={() => {
                  resetPerformanceMetrics();
                  setIsResetConfirmOpen(false);
                }}
                className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
              >
                Yes
              </button>
              <button
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-2 py-0.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsResetConfirmOpen(true)}
              className="p-2 rounded-lg bg-gray-850 hover:bg-gray-800 text-gray-400 hover:text-gray-200 border border-gray-700 transition-colors"
              title="Reset Performance Metrics Summary"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          {/* Exit to Code / Default IDE Mode */}
          <button
            onClick={() => setLayoutMode('default')}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-all"
            title="Return to standard IDE split code & plan view"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to IDE</span>
          </button>
        </div>
      </div>

      {/* Top Stat Ribbon - 4 KPI Cards */}
      <div className="p-4 bg-gray-900/60 border-b border-gray-800/80 shrink-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: Avg Task Duration */}
          <div className="p-3.5 rounded-xl bg-gray-950/80 border border-gray-800 hover:border-gray-700 transition-all flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between text-gray-400 text-xs font-medium">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-400" />
                Avg Latency / Task
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800/50 font-mono">
                Last: {formatDuration(lastTaskDurationMs)}
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-blue-200">
                {formatDuration(avgTaskDurationMs)}
              </span>
              <span className="text-xs text-gray-500 font-mono">per task completion</span>
            </div>
            <div className="text-[11px] text-gray-500 font-mono mt-1">
              Target SLA benchmark: &lt; 4.5s
            </div>
          </div>

          {/* Card 2: Total Token Usage */}
          <div className="p-3.5 rounded-xl bg-gray-950/80 border border-gray-800 hover:border-gray-700 transition-all flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between text-gray-400 text-xs font-medium">
              <span className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400" />
                Total Tokens
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/50 font-mono font-semibold">
                {avgTokensPerSec} tok/s
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-amber-200">
                {formatNumber(totalTokens)}
              </span>
              <span className="text-xs text-gray-500 font-mono">tokens</span>
            </div>
            <div className="text-[11px] text-gray-500 font-mono mt-1">
              Throughput velocity: {avgTokensPerSec} tok/sec
            </div>
          </div>

          {/* Card 3: Token Split */}
          <div className="p-3.5 rounded-xl bg-gray-950/80 border border-gray-800 hover:border-gray-700 transition-all flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between text-gray-400 text-xs font-medium">
              <span className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-purple-400" />
                Prompt / Generation Split
              </span>
              <span className="text-[11px] font-mono text-gray-300">
                {promptPercent}% / {completionPercent}%
              </span>
            </div>
            <div className="mt-2.5">
              <div className="h-2.5 w-full bg-gray-800 rounded-full overflow-hidden flex">
                <div 
                  className="bg-indigo-500 h-full transition-all duration-300"
                  style={{ width: `${promptPercent}%` }}
                  title={`Prompt: ${formatNumber(totalPromptTokens)} (${promptPercent}%)`}
                />
                <div 
                  className="bg-purple-500 h-full transition-all duration-300"
                  style={{ width: `${completionPercent}%` }}
                  title={`Completion: ${formatNumber(totalCompletionTokens)} (${completionPercent}%)`}
                />
              </div>
              <div className="flex justify-between text-[10px] text-gray-400 font-mono mt-1.5">
                <span>Input: {(totalPromptTokens / 1000).toFixed(1)}k</span>
                <span>Output: {(totalCompletionTokens / 1000).toFixed(1)}k</span>
              </div>
            </div>
          </div>

          {/* Card 4: Throughput & Reliability */}
          <div className="p-3.5 rounded-xl bg-gray-950/80 border border-gray-800 hover:border-gray-700 transition-all flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between text-gray-400 text-xs font-medium">
              <span className="flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-400" />
                Pipeline Success Rate
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/50 font-mono font-semibold">
                {successRatePercent}% OK
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-emerald-200">
                {totalTasksCompleted}
              </span>
              <span className="text-xs text-gray-500 font-mono">tasks completed</span>
            </div>
            <div className="text-[11px] text-gray-500 font-mono mt-1">
              Active concurrent tasks: {activeTasksRunning}
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800/80 bg-gray-900/80 shrink-0">
        <div className="flex items-center space-x-2 overflow-x-auto">
          <button
            onClick={() => setSelectedTab('trends')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 shrink-0",
              selectedTab === 'trends' 
                ? "bg-indigo-600 text-white shadow-sm font-semibold" 
                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/80"
            )}
          >
            <TrendingUp className="w-4 h-4 text-indigo-300" />
            <span>Task Lifecycle Trends (Recharts)</span>
            <span className={cn(
              "text-[9px] px-1.5 py-0.2 rounded font-mono",
              selectedTab === 'trends' ? "bg-indigo-900/80 text-white" : "bg-gray-800 text-gray-400"
            )}>
              Deep Dive
            </span>
          </button>

          <button
            onClick={() => setSelectedTab('agents')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 shrink-0",
              selectedTab === 'agents' 
                ? "bg-blue-600 text-white shadow-sm font-semibold" 
                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/80"
            )}
          >
            <Cpu className="w-4 h-4 text-blue-300" />
            <span>Agent Breakdown & Health ({agentMetrics.length})</span>
          </button>

          <button
            onClick={() => setSelectedTab('history')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 shrink-0",
              selectedTab === 'history' 
                ? "bg-blue-600 text-white shadow-sm font-semibold" 
                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/80"
            )}
          >
            <Clock className="w-4 h-4 text-blue-300" />
            <span>Execution Latency Log ({recentTaskHistory.length})</span>
          </button>

          <button
            onClick={() => setSelectedTab('tokens')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 shrink-0",
              selectedTab === 'tokens' 
                ? "bg-blue-600 text-white shadow-sm font-semibold" 
                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/80"
            )}
          >
            <BarChart3 className="w-4 h-4 text-blue-300" />
            <span>Token Distribution Matrix</span>
          </button>
        </div>

        <div className="text-xs text-gray-500 font-mono hidden md:block">
          Auto-synchronized with SimulatedBackendService RxJS telemetry
        </div>
      </div>

      {/* Main Expansive Content Area (Full Viewport Height) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {selectedTab === 'trends' && (
          <div className="w-full space-y-4">
            <TaskLifecycleTrendsChart onOpenAgentLogs={handleAgentClick} />
          </div>
        )}

        {selectedTab === 'agents' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {agentMetrics.map((agent: AgentMetricItem) => {
              const agentTokenShare = totalTokens > 0 ? Math.round((agent.totalTokensUsed / totalTokens) * 100) : 0;
              return (
                <div
                  key={agent.agentId}
                  onClick={() => handleAgentClick(agent.agentId)}
                  className="p-4 rounded-xl bg-gray-900/80 border border-gray-800 hover:border-blue-500/60 hover:bg-gray-850/90 transition-all cursor-pointer group flex flex-col justify-between shadow-xs"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-gray-100 group-hover:text-blue-300 transition-colors">
                            {agent.agentName}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-gray-800 text-gray-300 font-mono">
                            {agent.agentRole}
                          </span>
                        </div>
                        <span className="text-[11px] text-gray-500 font-mono">ID: {agent.agentId}</span>
                      </div>
                      <span className="text-[10px] font-mono text-blue-400 group-hover:underline flex items-center gap-0.5">
                        Logs <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>

                    <div className="mt-3.5 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Avg Latency</span>
                        <span className="font-mono font-semibold text-blue-300">
                          {formatDuration(agent.avgCompletionTimeMs)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Tokens Used</span>
                        <span className="font-mono font-semibold text-amber-300">
                          {formatNumber(agent.totalTokensUsed)}
                          <span className="text-[10px] text-gray-500 ml-1">({agentTokenShare}%)</span>
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Throughput</span>
                        <span className="font-mono text-gray-300">
                          {agent.tokensPerSec} tok/s
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Tasks Executed</span>
                        <span className="font-mono text-emerald-400 font-semibold">
                          {agent.tasksCompleted}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Error Count</span>
                        <span className={cn(
                          "font-mono font-semibold",
                          agent.errorCount > 0 ? "text-rose-400" : "text-gray-500"
                        )}>
                          {agent.errorCount}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-2.5 border-t border-gray-800/80">
                    <div className="flex justify-between items-center text-[10px] text-gray-400 font-mono">
                      <span>Token share of total</span>
                      <span>{agentTokenShare}%</span>
                    </div>
                    <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden mt-1.5">
                      <div 
                        className="bg-blue-500 h-full rounded-full transition-all duration-300" 
                        style={{ width: `${Math.max(agentTokenShare, 4)}%` }} 
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {selectedTab === 'history' && (
          <div className="space-y-3">
            <div className="text-xs text-gray-400 flex items-center justify-between">
              <span className="font-semibold text-gray-200">Recent Task Execution Pipeline History</span>
              <span className="text-[11px] font-mono text-gray-500">Showing last {recentTaskHistory.length} completed task runs</span>
            </div>

            <div className="rounded-xl border border-gray-800 overflow-hidden bg-gray-900/60 shadow-md">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-900/95 text-gray-400 font-mono text-[11px] border-b border-gray-800 uppercase">
                  <tr>
                    <th className="py-3 px-4">Task ID & Intent</th>
                    <th className="py-3 px-4">Execution Time</th>
                    <th className="py-3 px-4">Tokens Used</th>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 font-mono text-xs">
                  {recentTaskHistory.map((task: TaskMetricRecord) => (
                    <tr key={task.id} className="hover:bg-gray-850/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-100 font-sans truncate max-w-sm sm:max-w-md lg:max-w-lg">
                          {task.intent}
                        </div>
                        <span className="text-[10px] text-gray-500">{task.id}</span>
                      </td>
                      <td className="py-3 px-4 text-blue-300 font-medium">
                        {formatDuration(task.durationMs)}
                      </td>
                      <td className="py-3 px-4 text-amber-300 font-medium">
                        {formatNumber(task.tokensUsed)} tok
                      </td>
                      <td className="py-3 px-4 text-gray-400 text-[11px]">
                        {new Date(task.completedAt).toLocaleTimeString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase",
                          task.status === 'success' 
                            ? "bg-emerald-950 text-emerald-300 border border-emerald-800" 
                            : "bg-rose-950 text-rose-300 border border-rose-800"
                        )}>
                          {task.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedTab === 'tokens' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-gray-900/80 border border-gray-800 space-y-3">
              <h4 className="text-sm font-semibold text-gray-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                Global Token Consumption & Context Ratio
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                <div className="p-3 rounded-lg bg-gray-950/80 border border-gray-800">
                  <div className="text-xs text-gray-400">Prompt / Input Tokens</div>
                  <div className="text-lg font-bold font-mono text-indigo-300 mt-1">
                    {formatNumber(totalPromptTokens)}
                  </div>
                  <div className="text-[10px] text-gray-500 font-mono mt-0.5">{promptPercent}% of session volume</div>
                </div>

                <div className="p-3 rounded-lg bg-gray-950/80 border border-gray-800">
                  <div className="text-xs text-gray-400">Completion / Output Tokens</div>
                  <div className="text-lg font-bold font-mono text-purple-300 mt-1">
                    {formatNumber(totalCompletionTokens)}
                  </div>
                  <div className="text-[10px] text-gray-500 font-mono">{completionPercent}% of session volume</div>
                </div>

                <div className="p-3 rounded-lg bg-gray-950/80 border border-gray-800">
                  <div className="text-xs text-gray-400">Aggregate Token Load</div>
                  <div className="text-lg font-bold font-mono text-amber-300 mt-1">
                    {formatNumber(totalTokens)}
                  </div>
                  <div className="text-[10px] text-gray-500 font-mono">100% total tracked tokens</div>
                </div>
              </div>
            </div>

            {/* Per-Agent Distribution Bars */}
            <div className="p-4 rounded-xl bg-gray-900/80 border border-gray-800 space-y-3">
              <h4 className="text-sm font-semibold text-gray-100">Per-Agent Token Distribution</h4>
              <div className="space-y-3">
                {agentMetrics.map((agent: AgentMetricItem) => {
                  const share = totalTokens > 0 ? (agent.totalTokensUsed / totalTokens) * 100 : 0;
                  return (
                    <div key={agent.agentId} className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-200 font-medium">
                          {agent.agentName} <span className="text-gray-400 font-normal">({agent.agentRole})</span>
                        </span>
                        <span className="font-mono text-gray-300 text-xs font-semibold">
                          {formatNumber(agent.totalTokensUsed)} tok ({share.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-800 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 h-full rounded-full transition-all duration-300" 
                          style={{ width: `${Math.max(share, 2)}%` }} 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
