import React, { useState } from 'react';
import { useSimulation } from '../hooks/useSimulation';
import { 
  X, Play, Pause, RotateCcw, CheckCircle2, Trash2, Clock, 
  Cpu, Code2, Layers, AlertCircle, FileText, Check, Copy, 
  ExternalLink, ArrowRight, ShieldCheck, Zap, Terminal, Split
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { AgentTaskItem } from '../types';
import { TaskTimeProgress } from './TaskTimeProgress';

export function AgentTaskDetailModal() {
  const { 
    selectedTaskForDetail, 
    setSelectedTaskForDetail, 
    startTaskExecution, 
    pauseTask, 
    resumeTask, 
    retryTask, 
    markTaskCompleted, 
    deleteTaskFromQueue,
    agentTaskQueue 
  } = useSimulation();

  const [copiedCode, setCopiedCode] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'substeps' | 'code' | 'dependencies'>('overview');

  if (!selectedTaskForDetail) return null;

  const task = selectedTaskForDetail;
  const isArch = task.assignedAgent === 'architect';

  const copyCodeToClipboard = () => {
    if (task.codeSnippet?.code) {
      navigator.clipboard.writeText(task.codeSnippet.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const getStatusBadge = (status: AgentTaskItem['status']) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-950/90 text-cyan-300 border border-cyan-500/50 shadow-sm animate-pulse">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>Active Running ({task.progress}%)</span>
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Completed (100%)</span>
          </span>
        );
      case 'paused':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-950/90 text-amber-300 border border-amber-500/50 shadow-sm">
            <Pause className="w-3.5 h-3.5 text-amber-400" />
            <span>Paused ({task.progress}%)</span>
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-950/90 text-rose-300 border border-rose-500/50 shadow-sm">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>Failed</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-800 text-gray-300 border border-gray-700 shadow-sm">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            <span>Pending In Queue</span>
          </span>
        );
    }
  };

  const getPriorityBadge = (priority: AgentTaskItem['priority']) => {
    switch (priority) {
      case 'critical':
        return <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800 uppercase">Critical Priority</span>;
      case 'high':
        return <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800 uppercase">High Priority</span>;
      case 'medium':
        return <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800 uppercase">Medium Priority</span>;
      default:
        return <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700 uppercase">Low Priority</span>;
    }
  };

  // Find prerequisite tasks
  const dependencyTasks = (task.dependencies || [])
    .map(depId => agentTaskQueue.find(t => t.id === depId))
    .filter(Boolean) as AgentTaskItem[];

  // Find downstream tasks that depend on this task
  const dependentDownstreamTasks = agentTaskQueue.filter(t => (t.dependencies || []).includes(task.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-gray-200"
      >
        {/* Modal Header */}
        <div className={cn(
          "px-6 py-4 border-b flex items-center justify-between shrink-0",
          isArch ? "bg-indigo-950/40 border-indigo-900/60" : "bg-teal-950/40 border-teal-900/60"
        )}>
          <div className="flex items-center space-x-3 min-w-0">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base shadow-sm shrink-0 border",
              isArch 
                ? "bg-indigo-600/30 text-indigo-300 border-indigo-500/50" 
                : "bg-teal-600/30 text-teal-300 border-teal-500/50"
            )}>
              {isArch ? <Split className="w-5 h-5" /> : <Code2 className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-bold text-gray-400">{task.id}</span>
                <span className={cn(
                  "text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border",
                  isArch ? "bg-indigo-950 text-indigo-300 border-indigo-800" : "bg-teal-950 text-teal-300 border-teal-800"
                )}>
                  {isArch ? 'System Architect' : 'Lead Builder'}
                </span>
                {getPriorityBadge(task.priority)}
              </div>
              <h2 className="text-base font-bold text-gray-100 truncate mt-0.5">
                {task.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {getStatusBadge(task.status)}
            <button
              onClick={() => setSelectedTaskForDetail(null)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-colors"
              title="Close Task Detail Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center px-6 border-b border-gray-800 bg-gray-950/60 space-x-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={cn(
              "px-3 py-2.5 border-b-2 transition-all flex items-center space-x-1.5",
              activeTab === 'overview'
                ? "border-blue-500 text-blue-400 font-bold bg-blue-950/20"
                : "border-transparent text-gray-400 hover:text-gray-200"
            )}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Task Overview & Specs</span>
          </button>

          <button
            onClick={() => setActiveTab('substeps')}
            className={cn(
              "px-3 py-2.5 border-b-2 transition-all flex items-center space-x-1.5",
              activeTab === 'substeps'
                ? "border-blue-500 text-blue-400 font-bold bg-blue-950/20"
                : "border-transparent text-gray-400 hover:text-gray-200"
            )}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Decomposed Sub-Steps ({task.substeps.length})</span>
          </button>

          {task.codeSnippet && (
            <button
              onClick={() => setActiveTab('code')}
              className={cn(
                "px-3 py-2.5 border-b-2 transition-all flex items-center space-x-1.5",
                activeTab === 'code'
                  ? "border-emerald-500 text-emerald-400 font-bold bg-emerald-950/20"
                  : "border-transparent text-gray-400 hover:text-emerald-300"
              )}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Synthesized Code Artifact</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('dependencies')}
            className={cn(
              "px-3 py-2.5 border-b-2 transition-all flex items-center space-x-1.5",
              activeTab === 'dependencies'
                ? "border-purple-500 text-purple-400 font-bold bg-purple-950/20"
                : "border-transparent text-gray-400 hover:text-purple-300"
            )}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Dependencies & DAG ({dependencyTasks.length})</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Description Card */}
              <div className="bg-gray-950/60 border border-gray-800 rounded-xl p-4 space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Objective & Operational Scope</span>
                <p className="text-sm text-gray-200 leading-relaxed font-sans">
                  {task.description}
                </p>
              </div>

              {/* Real-Time Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-gray-400 flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    <span>Real-Time Execution Progress</span>
                  </span>
                  <span className={cn(
                    "font-mono font-bold",
                    task.status === 'completed' ? "text-emerald-400" :
                    task.status === 'active' ? "text-cyan-400 animate-pulse" :
                    "text-gray-400"
                  )}>
                    {task.progress}%
                  </span>
                </div>
                <div className="h-2.5 w-full bg-gray-800 rounded-full overflow-hidden p-0.5">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      task.status === 'completed' ? "bg-gradient-to-r from-emerald-500 to-teal-400" :
                      task.status === 'active' ? "bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 animate-pulse" :
                      task.status === 'failed' ? "bg-rose-500" :
                      "bg-gray-600"
                    )}
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
              </div>

              {/* Elapsed Time vs Estimated Time Telemetry Progress Bar */}
              <TaskTimeProgress task={task} mode="detailed" />

              {/* Execution Telemetry Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-gray-950/80 border border-gray-800 rounded-xl p-3">
                  <div className="text-[10px] uppercase text-gray-500 font-bold">Assigned Agent</div>
                  <div className="text-sm font-bold text-gray-200 mt-1 flex items-center space-x-1.5">
                    <span className={cn("w-2 h-2 rounded-full", isArch ? "bg-indigo-400" : "bg-emerald-400")} />
                    <span>{task.agentName}</span>
                  </div>
                  <div className="text-[10px] font-mono text-gray-500 mt-0.5">{task.model}</div>
                </div>

                <div className="bg-gray-950/80 border border-gray-800 rounded-xl p-3">
                  <div className="text-[10px] uppercase text-gray-500 font-bold">Duration (ms)</div>
                  <div className="text-sm font-bold text-gray-200 mt-1 font-mono">
                    {task.actualDurationMs ? `${task.actualDurationMs} ms` : `~${task.estimatedDurationMs} ms (Est)`}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    {task.completedAt ? 'Finished' : task.startedAt ? 'In Progress' : 'Queued'}
                  </div>
                </div>

                <div className="bg-gray-950/80 border border-gray-800 rounded-xl p-3">
                  <div className="text-[10px] uppercase text-gray-500 font-bold">Token Generation</div>
                  <div className="text-sm font-bold text-gray-200 mt-1 font-mono">
                    {task.tokensUsed ? `${task.tokensUsed.toLocaleString()} tok` : '---'}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    {task.tokensPerSec ? `${task.tokensPerSec} tok/sec` : 'Pending'}
                  </div>
                </div>

                <div className="bg-gray-950/80 border border-gray-800 rounded-xl p-3">
                  <div className="text-[10px] uppercase text-gray-500 font-bold">Artifacts Output</div>
                  <div className="text-sm font-bold text-gray-200 mt-1 font-mono">
                    {task.outputs?.length || 0} Files
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5">Verified outputs</div>
                </div>
              </div>

              {/* Output Artifacts Chips */}
              {task.outputs && task.outputs.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Declared Output Artifacts</span>
                  <div className="flex flex-wrap gap-2">
                    {task.outputs.map((out, idx) => (
                      <span 
                        key={idx} 
                        className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-mono bg-gray-950 border border-gray-700 text-gray-300"
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-400" />
                        <span>{out}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'substeps' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-800">
                <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                  Sequential Execution Steps
                </span>
                <span className="text-xs text-gray-500">
                  {task.substeps.filter(s => s.status === 'completed').length} / {task.substeps.length} Completed
                </span>
              </div>

              <div className="space-y-2.5">
                {task.substeps.map((sub, idx) => (
                  <div 
                    key={sub.id || idx}
                    className={cn(
                      "p-3 rounded-xl border flex items-start justify-between transition-all",
                      sub.status === 'completed' 
                        ? "bg-emerald-950/20 border-emerald-800/40 text-gray-200" :
                      sub.status === 'running' 
                        ? "bg-cyan-950/30 border-cyan-600/60 text-cyan-200 shadow-sm animate-pulse" :
                      "bg-gray-950/50 border-gray-800 text-gray-400"
                    )}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center font-mono text-[11px] font-bold mt-0.5 shrink-0",
                        sub.status === 'completed' ? "bg-emerald-600 text-white" :
                        sub.status === 'running' ? "bg-cyan-500 text-gray-950 animate-spin" :
                        "bg-gray-800 text-gray-400"
                      )}>
                        {sub.status === 'completed' ? '✓' : idx + 1}
                      </div>
                      <div>
                        <div className={cn(
                          "text-xs font-semibold",
                          sub.status === 'completed' ? "text-emerald-300 font-bold" :
                          sub.status === 'running' ? "text-cyan-200 font-bold" :
                          "text-gray-300"
                        )}>
                          {sub.name}
                        </div>
                        {sub.details && (
                          <div className="text-[11px] text-gray-400 mt-1 font-mono leading-relaxed">
                            {sub.details}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center space-x-2">
                      {sub.durationMs && (
                        <span className="text-[10px] font-mono bg-gray-900 border border-gray-800 px-2 py-0.5 rounded text-gray-400">
                          {sub.durationMs} ms
                        </span>
                      )}
                      <span className={cn(
                        "text-[10px] uppercase font-bold px-2 py-0.5 rounded border",
                        sub.status === 'completed' ? "bg-emerald-950 text-emerald-400 border-emerald-800" :
                        sub.status === 'running' ? "bg-cyan-950 text-cyan-400 border-cyan-700" :
                        "bg-gray-900 text-gray-500 border-gray-800"
                      )}>
                        {sub.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'code' && task.codeSnippet && (
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-gray-950 px-4 py-2 rounded-t-xl border border-gray-800">
                <div className="flex items-center space-x-2">
                  <Code2 className="w-4 h-4 text-emerald-400" />
                  <span className="font-mono text-xs font-bold text-gray-300">{task.codeSnippet.filename}</span>
                  <span className="text-[10px] font-mono text-gray-500 bg-gray-900 px-1.5 py-0.5 rounded uppercase">
                    {task.codeSnippet.language}
                  </span>
                </div>
                <button
                  onClick={copyCodeToClipboard}
                  className="flex items-center space-x-1 text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-2.5 py-1 rounded transition-colors"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
                </button>
              </div>

              <pre className="p-4 bg-gray-950 border border-gray-800 rounded-b-xl overflow-x-auto text-xs font-mono text-emerald-300 leading-relaxed max-h-96">
                <code>{task.codeSnippet.code}</code>
              </pre>
            </div>
          )}

          {activeTab === 'dependencies' && (
            <div className="space-y-6">
              {/* Upstream Dependencies */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center space-x-2">
                  <span>Prerequisite Upstream Tasks (Must complete before starting)</span>
                </div>

                {dependencyTasks.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-gray-800 text-center text-xs text-gray-500">
                    No upstream dependencies required. This sub-task can execute immediately in root slot.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {dependencyTasks.map(dep => (
                      <div 
                        key={dep.id}
                        className="p-3 bg-gray-950/80 border border-gray-800 rounded-xl flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <span className={cn(
                            "w-2.5 h-2.5 rounded-full",
                            dep.status === 'completed' ? "bg-emerald-400" : "bg-amber-400"
                          )} />
                          <div>
                            <div className="text-xs font-bold text-gray-200">{dep.title}</div>
                            <div className="text-[10px] font-mono text-gray-400">{dep.id} • {dep.agentName}</div>
                          </div>
                        </div>
                        <span className={cn(
                          "text-[10px] font-bold uppercase px-2 py-0.5 rounded border",
                          dep.status === 'completed' ? "bg-emerald-950 text-emerald-400 border-emerald-800" : "bg-amber-950 text-amber-400 border-amber-800"
                        )}>
                          {dep.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Downstream Dependents */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center space-x-2">
                  <span>Downstream Dependents (Waiting on this task's completion)</span>
                </div>

                {dependentDownstreamTasks.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-gray-800 text-center text-xs text-gray-500">
                    No tasks are currently waiting on this task.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {dependentDownstreamTasks.map(dep => (
                      <div 
                        key={dep.id}
                        className="p-3 bg-gray-950/80 border border-gray-800 rounded-xl flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <span className={cn(
                            "w-2.5 h-2.5 rounded-full",
                            dep.status === 'completed' ? "bg-emerald-400" : "bg-blue-400"
                          )} />
                          <div>
                            <div className="text-xs font-bold text-gray-200">{dep.title}</div>
                            <div className="text-[10px] font-mono text-gray-400">{dep.id} • {dep.agentName}</div>
                          </div>
                        </div>
                        <span className={cn(
                          "text-[10px] font-bold uppercase px-2 py-0.5 rounded border",
                          dep.status === 'completed' ? "bg-emerald-950 text-emerald-400 border-emerald-800" : "bg-blue-950 text-blue-400 border-blue-800"
                        )}>
                          {dep.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-3.5 border-t border-gray-800 bg-gray-950/90 flex items-center justify-between shrink-0">
          <button
            onClick={() => {
              deleteTaskFromQueue(task.id);
              setSelectedTaskForDetail(null);
            }}
            className="flex items-center space-x-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 border border-transparent hover:border-rose-900/60 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Sub-Task</span>
          </button>

          <div className="flex items-center space-x-2">
            {task.status === 'active' ? (
              <button
                onClick={() => pauseTask(task.id)}
                className="flex items-center space-x-1.5 text-xs font-bold bg-amber-950 hover:bg-amber-900 border border-amber-700/80 text-amber-200 px-3.5 py-1.5 rounded-lg transition-colors shadow-sm"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>Pause Execution</span>
              </button>
            ) : task.status === 'paused' ? (
              <button
                onClick={() => resumeTask(task.id)}
                className="flex items-center space-x-1.5 text-xs font-bold bg-emerald-700 hover:bg-emerald-600 border border-emerald-500 text-white px-3.5 py-1.5 rounded-lg transition-colors shadow-sm"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Resume Task</span>
              </button>
            ) : task.status === 'completed' ? (
              <button
                onClick={() => retryTask(task.id)}
                className="flex items-center space-x-1.5 text-xs font-bold bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 px-3.5 py-1.5 rounded-lg transition-colors shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Re-Execute Sub-Task</span>
              </button>
            ) : (
              <button
                onClick={() => startTaskExecution(task.id)}
                className="flex items-center space-x-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 border border-blue-400 text-white px-4 py-1.5 rounded-lg transition-colors shadow-sm"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Execute Sub-Task Now</span>
              </button>
            )}

            {task.status !== 'completed' && (
              <button
                onClick={() => {
                  markTaskCompleted(task.id);
                  setSelectedTaskForDetail(null);
                }}
                className="flex items-center space-x-1.5 text-xs font-semibold bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/70 text-emerald-300 px-3 py-1.5 rounded-lg transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mark Completed</span>
              </button>
            )}

            <button
              onClick={() => setSelectedTaskForDetail(null)}
              className="text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 px-3.5 py-1.5 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
