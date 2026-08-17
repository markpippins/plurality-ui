import React, { useState, useMemo } from 'react';
import { useSimulation } from '../hooks/useSimulation';
import { 
  ListTodo, Play, Pause, RotateCcw, CheckCircle2, Trash2, Plus, 
  Search, Filter, Layers, Split, Code2, Clock, Zap, ArrowRight,
  Maximize2, Activity, Check, Sparkles, ChevronRight, AlertCircle, 
  Terminal, ShieldCheck, FileText, Cpu, LayoutGrid, ListFilter
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { AgentTaskItem } from '../types';
import { AgentTaskDetailModal } from './AgentTaskDetailModal';
import { CreateAgentTaskModal } from './CreateAgentTaskModal';

export function AgentTaskQueuePanel() {
  const {
    agentTaskQueue,
    getTaskQueueStats,
    startTaskExecution,
    pauseTask,
    resumeTask,
    retryTask,
    markTaskCompleted,
    deleteTaskFromQueue,
    runAllPendingTasks,
    clearCompletedTasks,
    resetTaskQueueToDefault,
    setSelectedTaskForDetail,
    selectedTaskForDetail
  } = useSimulation();

  const [viewFormat, setViewFormat] = useState<'kanban' | 'list'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [agentFilter, setAgentFilter] = useState<'all' | 'architect' | 'builder'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'active' | 'completed' | 'paused'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const stats = useMemo(() => getTaskQueueStats(), [agentTaskQueue]);

  // Filtered task list
  const filteredTasks = useMemo(() => {
    return agentTaskQueue.filter(task => {
      // Search text match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesDesc = task.description.toLowerCase().includes(q);
        const matchesAgent = task.agentName.toLowerCase().includes(q);
        const matchesId = task.id.toLowerCase().includes(q);
        const matchesOutput = (task.outputs || []).some(o => o.toLowerCase().includes(q));
        if (!matchesTitle && !matchesDesc && !matchesAgent && !matchesId && !matchesOutput) {
          return false;
        }
      }

      // Agent filter
      if (agentFilter !== 'all' && task.assignedAgent !== agentFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all' && task.status !== statusFilter) {
        return false;
      }

      // Priority filter
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) {
        return false;
      }

      return true;
    });
  }, [agentTaskQueue, searchQuery, agentFilter, statusFilter, priorityFilter]);

  // Kanban column buckets
  const pendingTasks = useMemo(() => filteredTasks.filter(t => t.status === 'pending'), [filteredTasks]);
  const activeTasks = useMemo(() => filteredTasks.filter(t => t.status === 'active' || t.status === 'paused'), [filteredTasks]);
  const completedTasks = useMemo(() => filteredTasks.filter(t => t.status === 'completed'), [filteredTasks]);

  const handleExecuteNext = () => {
    const nextPending = agentTaskQueue.find(t => t.status === 'pending');
    if (nextPending) {
      startTaskExecution(nextPending.id);
    }
  };

  return (
    <div id="agent-task-queue-panel" className="flex-1 flex flex-col bg-gray-950 text-gray-200 h-full overflow-hidden border-r border-gray-800">
      {/* 1. Header & Live Telemetry Ribbon */}
      <div className="border-b border-gray-800 bg-gray-900/90 px-4 py-3 shrink-0 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Title & Pulse Indicator */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-blue-400 shrink-0">
              <ListTodo className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-sm font-bold text-gray-100 uppercase tracking-wider">Agent Sub-Task Queue</h1>
                <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>LIVE REACTIVE DAG</span>
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                Visualizing decomposed execution milestones for <span className="text-indigo-300 font-semibold">Architect</span> & <span className="text-teal-300 font-semibold">Builder</span> agents
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white border border-blue-400 shadow-sm transition-all hover:shadow-blue-900/40"
              title="Enqueue a new custom sub-task"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Enqueue Sub-Task</span>
            </button>

            <button
              onClick={handleExecuteNext}
              disabled={stats.pending === 0}
              className={cn(
                "flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all",
                stats.pending > 0
                  ? "bg-emerald-950/80 hover:bg-emerald-900 border-emerald-700/80 text-emerald-200"
                  : "bg-gray-900 border-gray-800 text-gray-500 cursor-not-allowed"
              )}
              title="Execute the next highest priority pending sub-task"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Next ({stats.pending})</span>
            </button>

            <button
              onClick={runAllPendingTasks}
              disabled={stats.pending === 0}
              className={cn(
                "flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all",
                stats.pending > 0
                  ? "bg-indigo-950/80 hover:bg-indigo-900 border-indigo-700/80 text-indigo-200"
                  : "bg-gray-900 border-gray-800 text-gray-500 cursor-not-allowed"
              )}
              title="Batch trigger all pending sub-tasks sequentially"
            >
              <Play className="w-3.5 h-3.5 fill-current text-indigo-400" />
              <span>Run All Pending</span>
            </button>

            <button
              onClick={clearCompletedTasks}
              disabled={stats.completed === 0}
              className={cn(
                "flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                stats.completed > 0
                  ? "bg-gray-800 hover:bg-gray-700 border-gray-700 text-gray-300 hover:text-white"
                  : "bg-gray-900 border-gray-800 text-gray-600 cursor-not-allowed"
              )}
              title="Clear completed tasks from the queue"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Clear Done</span>
            </button>

            <button
              onClick={resetTaskQueueToDefault}
              className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-400 hover:text-white transition-colors"
              title="Reset task queue to default scenario"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Real-Time Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-1">
          <div className="bg-gray-950/80 border border-gray-800/80 px-3 py-1.5 rounded-lg flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-gray-400">Total Tasks</span>
            <span className="font-mono text-xs font-bold text-gray-100">{stats.total}</span>
          </div>

          <div className="bg-gray-950/80 border border-gray-800/80 px-3 py-1.5 rounded-lg flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-gray-400">Pending</span>
            <span className="font-mono text-xs font-bold text-amber-400">{stats.pending}</span>
          </div>

          <div className="bg-gray-950/80 border border-gray-800/80 px-3 py-1.5 rounded-lg flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-gray-400">Active</span>
            <span className="font-mono text-xs font-bold text-cyan-400 animate-pulse">{stats.active}</span>
          </div>

          <div className="bg-gray-950/80 border border-gray-800/80 px-3 py-1.5 rounded-lg flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-gray-400">Completed</span>
            <span className="font-mono text-xs font-bold text-emerald-400">{stats.completed}</span>
          </div>

          <div className="bg-gray-950/80 border border-gray-800/80 px-3 py-1.5 rounded-lg flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-gray-400">Arch / Build</span>
            <span className="font-mono text-xs font-bold text-gray-300">
              <span className="text-indigo-400">{stats.architectTasks}</span> / <span className="text-teal-400">{stats.builderTasks}</span>
            </span>
          </div>

          <div className="bg-gray-950/80 border border-gray-800/80 px-3 py-1.5 rounded-lg flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-gray-400">Total Tokens</span>
            <span className="font-mono text-xs font-bold text-purple-300">{stats.totalTokens.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* 2. Search, Filter & View Mode Controls Bar */}
      <div className="px-4 py-2.5 border-b border-gray-800 bg-gray-950/70 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search sub-tasks by title, description, code files, or ID..."
            className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-[10px] text-gray-500 hover:text-gray-300"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Dropdowns & View Mode */}
        <div className="flex items-center space-x-2 shrink-0">
          {/* Agent Filter */}
          <div className="flex items-center space-x-1 bg-gray-900 p-0.5 rounded-lg border border-gray-800">
            <button
              onClick={() => setAgentFilter('all')}
              className={cn(
                "px-2 py-1 rounded text-[11px] font-medium transition-colors",
                agentFilter === 'all' ? "bg-gray-800 text-white font-semibold" : "text-gray-400 hover:text-gray-200"
              )}
            >
              All Agents
            </button>
            <button
              onClick={() => setAgentFilter('architect')}
              className={cn(
                "px-2 py-1 rounded text-[11px] font-medium transition-colors flex items-center space-x-1",
                agentFilter === 'architect' ? "bg-indigo-950 text-indigo-200 border border-indigo-700/60 font-semibold" : "text-gray-400 hover:text-indigo-300"
              )}
            >
              <Split className="w-2.5 h-2.5 text-indigo-400" />
              <span>Architect</span>
            </button>
            <button
              onClick={() => setAgentFilter('builder')}
              className={cn(
                "px-2 py-1 rounded text-[11px] font-medium transition-colors flex items-center space-x-1",
                agentFilter === 'builder' ? "bg-teal-950 text-teal-200 border border-teal-700/60 font-semibold" : "text-gray-400 hover:text-teal-300"
              )}
            >
              <Code2 className="w-2.5 h-2.5 text-teal-400" />
              <span>Builder</span>
            </button>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-gray-900 border border-gray-800 rounded-lg px-2.5 py-1 text-[11px] text-gray-300 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="active">Active Running</option>
            <option value="completed">Completed</option>
            <option value="paused">Paused</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
            className="bg-gray-900 border border-gray-800 rounded-lg px-2.5 py-1 text-[11px] text-gray-300 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* View Mode Toggle: Kanban vs List */}
          <div className="flex items-center bg-gray-900 p-0.5 rounded-lg border border-gray-800">
            <button
              onClick={() => setViewFormat('kanban')}
              className={cn(
                "p-1.5 rounded transition-colors",
                viewFormat === 'kanban' ? "bg-gray-800 text-blue-400" : "text-gray-500 hover:text-gray-300"
              )}
              title="Kanban Board View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewFormat('list')}
              className={cn(
                "p-1.5 rounded transition-colors",
                viewFormat === 'list' ? "bg-gray-800 text-blue-400" : "text-gray-500 hover:text-gray-300"
              )}
              title="Matrix List View"
            >
              <ListFilter className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Main Task Visualizer Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-3 py-16">
            <div className="w-12 h-12 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center text-gray-500">
              <ListTodo className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-300">No Sub-Tasks Match Current Filter</h3>
              <p className="text-xs text-gray-500 mt-1">Try resetting filters or search query, or enqueue a new sub-task.</p>
            </div>
            <button
              onClick={() => {
                setSearchQuery('');
                setAgentFilter('all');
                setStatusFilter('all');
                setPriorityFilter('all');
              }}
              className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs font-semibold text-gray-200 border border-gray-700"
            >
              Reset All Filters
            </button>
          </div>
        ) : viewFormat === 'kanban' ? (
          /* Kanban View: 3 Columns */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
            
            {/* Column 1: Pending */}
            <div className="bg-gray-900/50 border border-gray-800/80 rounded-xl flex flex-col overflow-hidden">
              <div className="px-3.5 py-2.5 border-b border-gray-800 bg-gray-900 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">Pending Sub-Tasks</span>
                </div>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
                  {pendingTasks.length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {pendingTasks.length === 0 ? (
                  <div className="py-8 text-center text-xs text-gray-600 border border-dashed border-gray-800/80 rounded-xl">
                    No pending tasks in queue
                  </div>
                ) : (
                  pendingTasks.map(task => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      onInspect={() => setSelectedTaskForDetail(task)}
                      onStart={() => startTaskExecution(task.id)}
                      onPause={() => pauseTask(task.id)}
                      onResume={() => resumeTask(task.id)}
                      onRetry={() => retryTask(task.id)}
                      onComplete={() => markTaskCompleted(task.id)}
                      onDelete={() => deleteTaskFromQueue(task.id)}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Column 2: Active / Running */}
            <div className="bg-gray-900/50 border border-cyan-900/40 rounded-xl flex flex-col overflow-hidden shadow-sm">
              <div className="px-3.5 py-2.5 border-b border-cyan-900/50 bg-cyan-950/30 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span className="text-xs font-bold text-cyan-200 uppercase tracking-wider">Active In-Progress</span>
                </div>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700 animate-pulse">
                  {activeTasks.length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {activeTasks.length === 0 ? (
                  <div className="py-8 text-center text-xs text-gray-600 border border-dashed border-gray-800/80 rounded-xl">
                    No tasks currently running
                  </div>
                ) : (
                  activeTasks.map(task => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      onInspect={() => setSelectedTaskForDetail(task)}
                      onStart={() => startTaskExecution(task.id)}
                      onPause={() => pauseTask(task.id)}
                      onResume={() => resumeTask(task.id)}
                      onRetry={() => retryTask(task.id)}
                      onComplete={() => markTaskCompleted(task.id)}
                      onDelete={() => deleteTaskFromQueue(task.id)}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Column 3: Completed */}
            <div className="bg-gray-900/50 border border-emerald-900/40 rounded-xl flex flex-col overflow-hidden">
              <div className="px-3.5 py-2.5 border-b border-emerald-900/50 bg-emerald-950/30 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-xs font-bold text-emerald-200 uppercase tracking-wider">Verified & Completed</span>
                </div>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700">
                  {completedTasks.length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {completedTasks.length === 0 ? (
                  <div className="py-8 text-center text-xs text-gray-600 border border-dashed border-gray-800/80 rounded-xl">
                    No completed tasks yet
                  </div>
                ) : (
                  completedTasks.map(task => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      onInspect={() => setSelectedTaskForDetail(task)}
                      onStart={() => startTaskExecution(task.id)}
                      onPause={() => pauseTask(task.id)}
                      onResume={() => resumeTask(task.id)}
                      onRetry={() => retryTask(task.id)}
                      onComplete={() => markTaskCompleted(task.id)}
                      onDelete={() => deleteTaskFromQueue(task.id)}
                    />
                  ))
                )}
              </div>
            </div>

          </div>
        ) : (
          /* List Matrix View */
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-950/80 text-[10px] uppercase font-bold text-gray-400 border-b border-gray-800 tracking-wider">
                <tr>
                  <th className="py-3 px-4">Task ID & Title</th>
                  <th className="py-3 px-3">Assignee Agent</th>
                  <th className="py-3 px-3">Priority</th>
                  <th className="py-3 px-3">Status & Progress</th>
                  <th className="py-3 px-3">Sub-Steps</th>
                  <th className="py-3 px-3">Duration / Tokens</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 font-sans">
                {filteredTasks.map(task => {
                  const isArch = task.assignedAgent === 'architect';
                  const completedSubsteps = task.substeps.filter(s => s.status === 'completed').length;
                  return (
                    <tr key={task.id} className="hover:bg-gray-850/60 transition-colors group">
                      {/* ID & Title */}
                      <td className="py-3 px-4">
                        <div className="font-mono text-[10px] text-gray-500 font-bold">{task.id}</div>
                        <div className="font-semibold text-gray-100 mt-0.5 flex items-center space-x-1.5">
                          <span>{task.title}</span>
                          {task.codeSnippet && <Code2 className="w-3 h-3 text-emerald-400 shrink-0" />}
                        </div>
                        {task.outputs && task.outputs.length > 0 && (
                          <div className="text-[10px] font-mono text-gray-500 mt-0.5 truncate max-w-xs">
                            {task.outputs.join(', ')}
                          </div>
                        )}
                      </td>

                      {/* Agent */}
                      <td className="py-3 px-3">
                        <span className={cn(
                          "inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-bold border",
                          isArch ? "bg-indigo-950 text-indigo-300 border-indigo-800" : "bg-teal-950 text-teal-300 border-teal-800"
                        )}>
                          {isArch ? <Split className="w-2.5 h-2.5" /> : <Code2 className="w-2.5 h-2.5" />}
                          <span>{task.agentRole}</span>
                        </span>
                        <div className="text-[10px] font-mono text-gray-500 mt-0.5">{task.model}</div>
                      </td>

                      {/* Priority */}
                      <td className="py-3 px-3">
                        <span className={cn(
                          "text-[10px] font-bold uppercase px-1.5 py-0.5 rounded",
                          task.priority === 'critical' ? "bg-rose-950 text-rose-400" :
                          task.priority === 'high' ? "bg-amber-950 text-amber-400" :
                          task.priority === 'medium' ? "bg-blue-950 text-blue-400" :
                          "bg-gray-800 text-gray-400"
                        )}>
                          {task.priority}
                        </span>
                      </td>

                      {/* Status & Progress */}
                      <td className="py-3 px-3 min-w-[140px]">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className={cn(
                            "font-bold uppercase text-[10px]",
                            task.status === 'completed' ? "text-emerald-400" :
                            task.status === 'active' ? "text-cyan-400 animate-pulse" :
                            task.status === 'paused' ? "text-amber-400" :
                            "text-gray-400"
                          )}>
                            {task.status}
                          </span>
                          <span className="font-mono text-[10px] text-gray-400">{task.progress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full rounded-full transition-all duration-300",
                              task.status === 'completed' ? "bg-emerald-400" :
                              task.status === 'active' ? "bg-cyan-400 animate-pulse" :
                              task.status === 'paused' ? "bg-amber-400" :
                              "bg-gray-600"
                            )}
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                      </td>

                      {/* Sub-Steps */}
                      <td className="py-3 px-3">
                        <span className="font-mono text-[11px] text-gray-300">
                          {completedSubsteps} / {task.substeps.length}
                        </span>
                        <div className="text-[10px] text-gray-500">steps done</div>
                      </td>

                      {/* Duration / Tokens */}
                      <td className="py-3 px-3 font-mono text-[11px]">
                        <div className="text-gray-300">
                          {task.actualDurationMs ? `${task.actualDurationMs} ms` : `~${task.estimatedDurationMs} ms`}
                        </div>
                        <div className="text-[10px] text-gray-500">
                          {task.tokensUsed ? `${task.tokensUsed.toLocaleString()} tok` : '0 tok'}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          {task.status === 'pending' && (
                            <button
                              onClick={() => startTaskExecution(task.id)}
                              className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                              title="Start Execution"
                            >
                              <Play className="w-3 h-3 fill-current" />
                            </button>
                          )}
                          {task.status === 'active' && (
                            <button
                              onClick={() => pauseTask(task.id)}
                              className="p-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white transition-colors"
                              title="Pause"
                            >
                              <Pause className="w-3 h-3" />
                            </button>
                          )}
                          {task.status === 'paused' && (
                            <button
                              onClick={() => resumeTask(task.id)}
                              className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                              title="Resume"
                            >
                              <Play className="w-3 h-3 fill-current" />
                            </button>
                          )}
                          {task.status === 'completed' && (
                            <button
                              onClick={() => retryTask(task.id)}
                              className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
                              title="Re-run"
                            >
                              <RotateCcw className="w-3 h-3" />
                            </button>
                          )}

                          <button
                            onClick={() => setSelectedTaskForDetail(task)}
                            className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
                            title="Inspect Task Details & Code"
                          >
                            <Maximize2 className="w-3 h-3" />
                          </button>

                          <button
                            onClick={() => deleteTaskFromQueue(task.id)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                            title="Delete Task"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <AgentTaskDetailModal />
      <CreateAgentTaskModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
    </div>
  );
}

// Sub-Component: Kanban Task Card
interface TaskCardProps {
  key?: React.Key;
  task: AgentTaskItem;
  onInspect: () => void;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onRetry: () => void;
  onComplete: () => void;
  onDelete: () => void;
}

function TaskCard({
  task,
  onInspect,
  onStart,
  onPause,
  onResume,
  onRetry,
  onComplete,
  onDelete
}: TaskCardProps) {
  const isArch = task.assignedAgent === 'architect';
  const completedSubsteps = task.substeps.filter(s => s.status === 'completed').length;
  const runningSubstep = task.substeps.find(s => s.status === 'running');

  return (
    <div className={cn(
      "p-3.5 rounded-xl border transition-all duration-200 group relative bg-gray-950/90 shadow-sm",
      task.status === 'active' ? "border-cyan-500/70 shadow-cyan-950/50 ring-1 ring-cyan-500/30" :
      task.status === 'completed' ? "border-emerald-800/50 hover:border-emerald-700/80" :
      task.status === 'paused' ? "border-amber-700/60" :
      "border-gray-800 hover:border-gray-700"
    )}>
      {/* Top Header: ID & Agent Role Pill */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-1.5">
          <span className="font-mono text-[10px] font-bold text-gray-500">{task.id}</span>
          <span className={cn(
            "text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border",
            isArch ? "bg-indigo-950 text-indigo-300 border-indigo-800" : "bg-teal-950 text-teal-300 border-teal-800"
          )}>
            {isArch ? 'Architect' : 'Builder'}
          </span>
        </div>

        <span className={cn(
          "text-[9px] font-bold uppercase px-1.5 py-0.2 rounded",
          task.priority === 'critical' ? "bg-rose-950 text-rose-400 border border-rose-900" :
          task.priority === 'high' ? "bg-amber-950 text-amber-400 border border-amber-900" :
          task.priority === 'medium' ? "bg-blue-950 text-blue-400 border border-blue-900" :
          "bg-gray-900 text-gray-500"
        )}>
          {task.priority}
        </span>
      </div>

      {/* Task Title */}
      <h4 
        onClick={onInspect}
        className="text-xs font-bold text-gray-100 hover:text-blue-300 cursor-pointer transition-colors line-clamp-2 leading-snug"
      >
        {task.title}
      </h4>

      {/* Brief Description */}
      <p className="text-[11px] text-gray-400 mt-1 line-clamp-2 leading-relaxed">
        {task.description}
      </p>

      {/* Progress Bar & Substep Tracker */}
      <div className="mt-3 space-y-1.5">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-gray-400 flex items-center space-x-1">
            <Layers className="w-3 h-3 text-gray-500" />
            <span>Steps: {completedSubsteps}/{task.substeps.length}</span>
          </span>
          <span className={cn(
            "font-mono font-bold",
            task.status === 'completed' ? "text-emerald-400" :
            task.status === 'active' ? "text-cyan-400" :
            "text-gray-400"
          )}>
            {task.progress}%
          </span>
        </div>

        <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full rounded-full transition-all duration-300",
              task.status === 'completed' ? "bg-emerald-400" :
              task.status === 'active' ? "bg-gradient-to-r from-cyan-500 to-blue-500 animate-pulse" :
              task.status === 'paused' ? "bg-amber-400" :
              "bg-gray-600"
            )}
            style={{ width: `${task.progress}%` }}
          />
        </div>

        {/* Current Active Substep preview if running */}
        {runningSubstep && (
          <div className="text-[10px] text-cyan-300 font-mono flex items-center space-x-1 mt-1 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping shrink-0" />
            <span className="truncate">Step: {runningSubstep.name}</span>
          </div>
        )}
      </div>

      {/* Outputs & Code Badge */}
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
        {task.outputs && task.outputs.length > 0 && (
          <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-gray-900 border border-gray-800 text-gray-400 truncate max-w-[180px]">
            <FileText className="w-2.5 h-2.5 text-blue-400 shrink-0" />
            <span className="truncate">{task.outputs[0]}</span>
            {task.outputs.length > 1 && <span>+{task.outputs.length - 1}</span>}
          </span>
        )}

        {task.codeSnippet && (
          <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60 text-emerald-300">
            <Code2 className="w-2.5 h-2.5 text-emerald-400" />
            <span>Code Artifact</span>
          </span>
        )}
      </div>

      {/* Footer Controls & Quick Action Buttons */}
      <div className="mt-3 pt-2.5 border-t border-gray-800/80 flex items-center justify-between">
        <div className="flex items-center space-x-1 text-[10px] font-mono text-gray-500">
          <Clock className="w-3 h-3 text-gray-600" />
          <span>{task.actualDurationMs ? `${task.actualDurationMs}ms` : `~${task.estimatedDurationMs}ms`}</span>
        </div>

        <div className="flex items-center space-x-1">
          {task.status === 'pending' && (
            <button
              onClick={onStart}
              className="flex items-center space-x-1 px-2 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold shadow-sm transition-colors"
              title="Start executing sub-task"
            >
              <Play className="w-2.5 h-2.5 fill-current" />
              <span>Run</span>
            </button>
          )}

          {task.status === 'active' && (
            <button
              onClick={onPause}
              className="flex items-center space-x-1 px-2 py-1 rounded-md bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-bold shadow-sm transition-colors"
              title="Pause execution"
            >
              <Pause className="w-2.5 h-2.5" />
              <span>Pause</span>
            </button>
          )}

          {task.status === 'paused' && (
            <button
              onClick={onResume}
              className="flex items-center space-x-1 px-2 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold shadow-sm transition-colors"
              title="Resume execution"
            >
              <Play className="w-2.5 h-2.5 fill-current" />
              <span>Resume</span>
            </button>
          )}

          {task.status === 'completed' && (
            <button
              onClick={onRetry}
              className="p-1 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
              title="Re-run sub-task"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}

          <button
            onClick={onInspect}
            className="p-1 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
            title="Inspect task telemetry, code & DAG"
          >
            <Maximize2 className="w-3 h-3" />
          </button>

          <button
            onClick={onDelete}
            className="p-1 rounded-md text-gray-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
            title="Delete task"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
