import React, { useState } from 'react';
import { useSimulation } from '../hooks/useSimulation';
import { 
  Clock, Zap, Activity, Cpu, CheckCircle2, 
  RotateCcw, BarChart3, TrendingUp, Sparkles, Layers,
  ChevronRight, ArrowUpRight, ShieldCheck, TerminalSquare, LineChart, Bell, Flame
} from 'lucide-react';
import { cn } from '../lib/utils';
import { AgentMetricItem, TaskMetricRecord } from '../types';
import { TaskLifecycleTrendsChart } from './TaskLifecycleTrendsChart';

interface AgentMetricsWidgetProps {
  compact?: boolean;
  onOpenAgentLogs?: (agentId: string) => void;
  onSwitchToTerminal?: () => void;
}

export function AgentMetricsWidget({
  compact = false,
  onOpenAgentLogs,
  onSwitchToTerminal
}: AgentMetricsWidgetProps) {
  const { 
    performanceMetrics, 
    resetPerformanceMetrics, 
    selectAgentForLogs, 
    openPerformanceAlertsModal,
    openHeatmapModal,
    alertRules,
    alertHistory
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
    if (onOpenAgentLogs) {
      onOpenAgentLogs(agentId);
    } else {
      selectAgentForLogs(agentId);
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-gray-800/80 border border-gray-700/60 text-gray-200">
          <Clock className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-gray-400 font-mono">Avg Time:</span>
          <span className="font-semibold text-blue-300 font-mono">{formatDuration(avgTaskDurationMs)}</span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-gray-800/80 border border-gray-700/60 text-gray-200">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-gray-400 font-mono">Tokens:</span>
          <span className="font-semibold text-amber-300 font-mono">{(totalTokens / 1000).toFixed(1)}k</span>
          <span className="text-[10px] text-gray-400">({avgTokensPerSec} t/s)</span>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-gray-800/80 border border-gray-700/60 text-gray-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-gray-400 font-mono">Success:</span>
          <span className="font-semibold text-emerald-300 font-mono">{successRatePercent}%</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-950 text-gray-200 overflow-hidden select-none">
      {/* Top Stat Ribbon */}
      <div className="p-3 bg-gray-900/90 border-b border-gray-800 shrink-0">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Card 1: Avg Task Duration */}
          <div className="p-2.5 rounded-lg bg-gray-950/80 border border-gray-800/90 flex flex-col justify-between">
            <div className="flex items-center justify-between text-gray-400 text-[11px] font-medium">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                Avg Duration
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800/50 font-mono">
                Last: {formatDuration(lastTaskDurationMs)}
              </span>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-lg font-bold font-mono text-blue-200">
                {formatDuration(avgTaskDurationMs)}
              </span>
              <span className="text-[10px] text-gray-500 font-mono">per task</span>
            </div>
          </div>

          {/* Card 2: Total Token Usage */}
          <div className="p-2.5 rounded-lg bg-gray-950/80 border border-gray-800/90 flex flex-col justify-between">
            <div className="flex items-center justify-between text-gray-400 text-[11px] font-medium">
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Total Tokens
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/50 font-mono">
                {avgTokensPerSec} tok/s
              </span>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-lg font-bold font-mono text-amber-200">
                {formatNumber(totalTokens)}
              </span>
              <span className="text-[10px] text-gray-500 font-mono">tokens</span>
            </div>
          </div>

          {/* Card 3: Token Split */}
          <div className="p-2.5 rounded-lg bg-gray-950/80 border border-gray-800/90 flex flex-col justify-between">
            <div className="flex items-center justify-between text-gray-400 text-[11px] font-medium">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                Token Split
              </span>
              <span className="text-[10px] font-mono text-gray-400">
                {promptPercent}% / {completionPercent}%
              </span>
            </div>
            <div className="mt-1.5">
              <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden flex">
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
              <div className="flex justify-between text-[9px] text-gray-400 font-mono mt-1">
                <span>In: {(totalPromptTokens / 1000).toFixed(1)}k</span>
                <span>Out: {(totalCompletionTokens / 1000).toFixed(1)}k</span>
              </div>
            </div>
          </div>

          {/* Card 4: Throughput & Reliability */}
          <div className="p-2.5 rounded-lg bg-gray-950/80 border border-gray-800/90 flex flex-col justify-between">
            <div className="flex items-center justify-between text-gray-400 text-[11px] font-medium">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                Throughput
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/50 font-mono">
                {successRatePercent}% OK
              </span>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-lg font-bold font-mono text-emerald-200">
                {totalTasksCompleted}
              </span>
              <span className="text-[10px] text-gray-500 font-mono">tasks done ({activeTasksRunning} running)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs & Controls */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800/80 bg-gray-900/60 shrink-0">
        <div className="flex items-center space-x-1.5 overflow-x-auto">
          <button
            onClick={() => setSelectedTab('trends')}
            className={cn(
              "px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0",
              selectedTab === 'trends' 
                ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/50 shadow-xs" 
                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/60"
            )}
          >
            <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
            <span>Lifecycle Trends</span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 font-mono">
              Recharts
            </span>
          </button>

          <button
            onClick={() => setSelectedTab('agents')}
            className={cn(
              "px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0",
              selectedTab === 'agents' 
                ? "bg-blue-600/20 text-blue-300 border border-blue-500/40" 
                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/60"
            )}
          >
            <Cpu className="w-3.5 h-3.5" />
            Agent Breakdown ({agentMetrics.length})
          </button>

          <button
            onClick={() => setSelectedTab('history')}
            className={cn(
              "px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0",
              selectedTab === 'history' 
                ? "bg-blue-600/20 text-blue-300 border border-blue-500/40" 
                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/60"
            )}
          >
            <Clock className="w-3.5 h-3.5" />
            Task Latency Log ({recentTaskHistory.length})
          </button>

          <button
            onClick={() => setSelectedTab('tokens')}
            className={cn(
              "px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0",
              selectedTab === 'tokens' 
                ? "bg-blue-600/20 text-blue-300 border border-blue-500/40" 
                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/60"
            )}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Token Distribution
          </button>
        </div>

        <div className="flex items-center space-x-2">
          {/* Global Agent Activity Heatmap D3 Modal */}
          <button
            onClick={() => openHeatmapModal()}
            className="px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 border border-purple-700/80 bg-purple-950/70 hover:bg-purple-900/80 text-purple-200 hover:text-white transition-all shadow-xs"
            title="Open interactive D3.js Global Agent Activity & Compute Density Heatmap"
          >
            <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
            <span>Activity Heatmap</span>
          </button>

          {/* Threshold Alerts Direct Access Button */}
          <button
            onClick={() => openPerformanceAlertsModal()}
            className={cn(
              "px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 border transition-all shadow-xs",
              unreadAlerts > 0
                ? "bg-amber-950/90 border-amber-600 text-amber-200 hover:bg-amber-900"
                : "bg-gray-800/80 hover:bg-gray-700/80 border-gray-700 text-gray-200 hover:text-white"
            )}
            title="Configure global performance threshold alerts and SLA triggers"
          >
            <Bell className={cn("w-3.5 h-3.5", unreadAlerts > 0 ? "text-amber-400 animate-bounce" : "text-blue-400")} />
            <span>Threshold Alerts</span>
            {unreadAlerts > 0 ? (
              <span className="px-1 py-0.2 rounded-full bg-rose-600 text-white font-mono text-[9px] font-bold">
                {unreadAlerts}
              </span>
            ) : (
              <span className="text-[10px] font-mono text-gray-400 bg-gray-900 px-1 rounded border border-gray-700/80">
                {activeRulesCount}
              </span>
            )}
          </button>

          {onSwitchToTerminal && (
            <button
              onClick={onSwitchToTerminal}
              className="px-2 py-1 rounded text-[11px] font-mono text-gray-400 hover:text-gray-200 hover:bg-gray-800 flex items-center gap-1 border border-gray-800"
              title="Return to Shell Console"
            >
              <TerminalSquare className="w-3 h-3 text-blue-400" />
              <span>Shell Console</span>
            </button>
          )}

          {isResetConfirmOpen ? (
            <div className="flex items-center gap-1 bg-rose-950/80 border border-rose-800/80 rounded px-1.5 py-0.5">
              <span className="text-[10px] text-rose-300">Reset stats?</span>
              <button
                onClick={() => {
                  resetPerformanceMetrics();
                  setIsResetConfirmOpen(false);
                }}
                className="px-1.5 py-0.5 rounded bg-rose-700 hover:bg-rose-600 text-white text-[10px] font-semibold"
              >
                Yes
              </button>
              <button
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-1.5 py-0.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 text-[10px]"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsResetConfirmOpen(true)}
              className="p-1 rounded text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
              title="Reset Performance Metrics"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {selectedTab === 'trends' && (
          <div className="w-full">
            <TaskLifecycleTrendsChart onOpenAgentLogs={handleAgentClick} />
          </div>
        )}

        {selectedTab === 'agents' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {agentMetrics.map((agent: AgentMetricItem) => {
              const agentTokenShare = totalTokens > 0 ? Math.round((agent.totalTokensUsed / totalTokens) * 100) : 0;
              return (
                <div
                  key={agent.agentId}
                  onClick={() => handleAgentClick(agent.agentId)}
                  className="p-3 rounded-lg bg-gray-900/80 border border-gray-800 hover:border-gray-700 hover:bg-gray-850/80 transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-xs text-gray-100 group-hover:text-blue-300 transition-colors">
                            {agent.agentName}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-gray-800 text-gray-400 font-mono">
                            {agent.agentRole}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-500 font-mono">ID: {agent.agentId}</span>
                      </div>
                      <ArrowUpRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-blue-400 transition-colors" />
                    </div>

                    <div className="mt-3 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-[11px]">Avg Latency</span>
                        <span className="font-mono font-medium text-blue-300">
                          {formatDuration(agent.avgCompletionTimeMs)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-[11px]">Tokens Used</span>
                        <span className="font-mono font-medium text-amber-300">
                          {formatNumber(agent.totalTokensUsed)}
                          <span className="text-[10px] text-gray-500 ml-1">({agentTokenShare}%)</span>
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-[11px]">Throughput</span>
                        <span className="font-mono text-gray-300 text-[11px]">
                          {agent.tokensPerSec} tok/s
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-[11px]">Tasks Executed</span>
                        <span className="font-mono text-emerald-400 font-medium">
                          {agent.tasksCompleted}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-gray-800/80">
                    <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono">
                      <span>Token share</span>
                      <span>{agentTokenShare}%</span>
                    </div>
                    <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden mt-1">
                      <div 
                        className="bg-blue-500 h-full rounded-full" 
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
          <div className="space-y-2">
            <div className="text-xs text-gray-400 mb-2 flex items-center justify-between">
              <span>Recent Pipeline Execution History</span>
              <span className="text-[10px] font-mono text-gray-500">Showing last {recentTaskHistory.length} runs</span>
            </div>

            <div className="rounded-lg border border-gray-800 overflow-hidden bg-gray-900/60">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-900/90 text-gray-400 font-mono text-[10px] border-b border-gray-800 uppercase">
                  <tr>
                    <th className="py-2 px-3">Task ID & Intent</th>
                    <th className="py-2 px-3">Execution Time</th>
                    <th className="py-2 px-3">Tokens Used</th>
                    <th className="py-2 px-3">Timestamp</th>
                    <th className="py-2 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 font-mono text-[11px]">
                  {recentTaskHistory.map((task: TaskMetricRecord) => (
                    <tr key={task.id} className="hover:bg-gray-850/50 transition-colors">
                      <td className="py-2 px-3">
                        <div className="font-semibold text-gray-200 font-sans truncate max-w-xs sm:max-w-md">
                          {task.intent}
                        </div>
                        <span className="text-[10px] text-gray-500">{task.id}</span>
                      </td>
                      <td className="py-2 px-3 text-blue-300 font-medium">
                        {formatDuration(task.durationMs)}
                      </td>
                      <td className="py-2 px-3 text-amber-300">
                        {formatNumber(task.tokensUsed)} tok
                      </td>
                      <td className="py-2 px-3 text-gray-400 text-[10px]">
                        {new Date(task.completedAt).toLocaleTimeString()}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
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
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-gray-900/80 border border-gray-800 space-y-3">
              <h4 className="text-xs font-semibold text-gray-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                Token Consumption & Cost Breakdown
              </h4>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Prompt / Input Tokens</span>
                  <span className="font-mono text-indigo-300 font-medium">
                    {formatNumber(totalPromptTokens)} ({promptPercent}%)
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Completion / Output Tokens</span>
                  <span className="font-mono text-purple-300 font-medium">
                    {formatNumber(totalCompletionTokens)} ({completionPercent}%)
                  </span>
                </div>
                <div className="flex justify-between text-xs border-t border-gray-800 pt-2 font-semibold">
                  <span className="text-gray-300">Total Tokens Consumed</span>
                  <span className="font-mono text-amber-300">
                    {formatNumber(totalTokens)}
                  </span>
                </div>
              </div>
            </div>

            {/* Per-Agent Distribution Bars */}
            <div className="p-3 rounded-lg bg-gray-900/80 border border-gray-800 space-y-2.5">
              <h4 className="text-xs font-semibold text-gray-200">Per-Agent Token Consumption</h4>
              <div className="space-y-2">
                {agentMetrics.map((agent: AgentMetricItem) => {
                  const share = totalTokens > 0 ? (agent.totalTokensUsed / totalTokens) * 100 : 0;
                  return (
                    <div key={agent.agentId} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-300 font-medium">
                          {agent.agentName} ({agent.agentRole})
                        </span>
                        <span className="font-mono text-gray-400 text-[11px]">
                          {formatNumber(agent.totalTokensUsed)} ({share.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full" 
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
