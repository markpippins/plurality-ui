import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useSimulation } from '../hooks/useSimulation';
import { 
  ListTodo, Play, Pause, RotateCcw, CheckCircle2, Trash2, Plus, 
  Search, Filter, Layers, Split, Code2, Clock, Zap, ArrowRight,
  Maximize2, Activity, Check, Sparkles, ChevronRight, AlertCircle, 
  Terminal, ShieldCheck, FileText, Cpu, LayoutGrid, ListFilter,
  GripVertical, ArrowUpDown, ArrowUp, ArrowDown, ChevronDown
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { AgentTaskItem } from '../types';
import { AgentTaskDetailModal } from './AgentTaskDetailModal';
import { CreateAgentTaskModal } from './CreateAgentTaskModal';
import { TaskTimeProgress } from './TaskTimeProgress';

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
    selectedTaskForDetail,
    reorderPendingTasks,
    updateTaskPriority,
    sortPendingTasksByPriority
  } = useSimulation();

  const [viewFormat, setViewFormat] = useState<'kanban' | 'list'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [agentFilter, setAgentFilter] = useState<'all' | 'architect' | 'builder'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'active' | 'completed' | 'paused'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Drag and drop state for pending tasks reordering
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<'above' | 'below' | null>(null);

  // Table Priority Popover State
  const [activePriorityMenuId, setActivePriorityMenuId] = useState<string | null>(null);
  const priorityMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (priorityMenuRef.current && !priorityMenuRef.current.contains(e.target as Node)) {
        setActivePriorityMenuId(null);
      }
    };
    if (activePriorityMenuId) {
      document.addEventListener('mousedown', handleOutsideClick);
      return () => document.removeEventListener('mousedown', handleOutsideClick);
    }
  }, [activePriorityMenuId]);

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

  // Drag & Drop handlers for pending tasks
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId);
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent, targetTaskId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (draggedTaskId === targetTaskId) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const position = e.clientY < midY ? 'above' : 'below';

    setDragOverTaskId(targetTaskId);
    setDropPosition(position);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    const currentTarget = e.currentTarget;
    const relatedTarget = e.relatedTarget as Node | null;
    if (!currentTarget.contains(relatedTarget)) {
      setDragOverTaskId(null);
      setDropPosition(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetTaskId: string) => {
    e.preventDefault();
    if (draggedTaskId && draggedTaskId !== targetTaskId) {
      reorderPendingTasks(draggedTaskId, targetTaskId, dropPosition || 'above');
    }
    setDraggedTaskId(null);
    setDragOverTaskId(null);
    setDropPosition(null);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverTaskId(null);
    setDropPosition(null);
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
            
            {/* Column 1: Pending (With Drag & Drop Priority Reordering) */}
            <div className="bg-gray-900/50 border border-amber-900/40 rounded-xl flex flex-col overflow-hidden">
              <div className="px-3.5 py-2.5 border-b border-gray-800 bg-gray-900 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">Pending Sub-Tasks</span>
                </div>
                
                <div className="flex items-center space-x-1.5">
                  {/* Quick Priority Sort Menu */}
                  <div className="flex items-center space-x-1 bg-gray-950 p-0.5 rounded border border-gray-800">
                    <button
                      onClick={() => sortPendingTasksByPriority('desc')}
                      className="px-1.5 py-0.5 rounded text-[10px] font-mono text-gray-400 hover:text-amber-300 hover:bg-gray-800 transition-colors flex items-center space-x-1"
                      title="Sort pending tasks by priority (Critical → Low)"
                    >
                      <ArrowDown className="w-2.5 h-2.5 text-rose-400" />
                      <span>Pri ↓</span>
                    </button>
                    <button
                      onClick={() => sortPendingTasksByPriority('asc')}
                      className="px-1.5 py-0.5 rounded text-[10px] font-mono text-gray-400 hover:text-blue-300 hover:bg-gray-800 transition-colors flex items-center space-x-1"
                      title="Sort pending tasks by priority (Low → Critical)"
                    >
                      <ArrowUp className="w-2.5 h-2.5 text-blue-400" />
                      <span>Pri ↑</span>
                    </button>
                  </div>

                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
                    {pendingTasks.length}
                  </span>
                </div>
              </div>

              {/* Drag reorder instructions hint */}
              {pendingTasks.length > 1 && (
                <div className="px-3 py-1.5 bg-amber-950/20 border-b border-amber-900/30 flex items-center justify-between text-[10px] text-amber-300/80">
                  <span className="flex items-center space-x-1">
                    <GripVertical className="w-3 h-3 text-amber-400/70" />
                    <span>Drag cards to reorder priority sequence</span>
                  </span>
                  <span className="font-mono text-[9px] text-amber-400/60 font-semibold">Top = Next Executed</span>
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {pendingTasks.length === 0 ? (
                  <div className="py-8 text-center text-xs text-gray-600 border border-dashed border-gray-800/80 rounded-xl">
                    No pending tasks in queue
                  </div>
                ) : (
                  pendingTasks.map((task, index) => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      index={index}
                      isPendingDraggable={true}
                      isDragging={draggedTaskId === task.id}
                      isDragOver={dragOverTaskId === task.id}
                      dropPosition={dragOverTaskId === task.id ? dropPosition : null}
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onDragOver={(e) => handleDragOver(e, task.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, task.id)}
                      onDragEnd={handleDragEnd}
                      onPriorityChange={(newPri) => updateTaskPriority(task.id, newPri)}
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
                      onPriorityChange={(newPri) => updateTaskPriority(task.id, newPri)}
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
                      onPriorityChange={(newPri) => updateTaskPriority(task.id, newPri)}
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
          /* List Matrix View with Drag and Drop on Pending Rows */
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-950/80 text-[10px] uppercase font-bold text-gray-400 border-b border-gray-800 tracking-wider">
                <tr>
                  <th className="py-3 px-3 w-10 text-center">#</th>
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
                {filteredTasks.map((task, index) => {
                  const isArch = task.assignedAgent === 'architect';
                  const isPending = task.status === 'pending';
                  const completedSubsteps = task.substeps.filter(s => s.status === 'completed').length;
                  const isDraggingThis = draggedTaskId === task.id;
                  const isOverThis = dragOverTaskId === task.id;

                  return (
                    <tr 
                      key={task.id} 
                      draggable={isPending}
                      onDragStart={(e) => isPending && handleDragStart(e, task.id)}
                      onDragOver={(e) => isPending && handleDragOver(e, task.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => isPending && handleDrop(e, task.id)}
                      onDragEnd={handleDragEnd}
                      className={cn(
                        "transition-all group relative",
                        isDraggingThis ? "opacity-30 bg-blue-950/30 border-2 border-dashed border-blue-400" :
                        isOverThis && dropPosition === 'above' ? "border-t-2 border-blue-400 bg-blue-950/20" :
                        isOverThis && dropPosition === 'below' ? "border-b-2 border-blue-400 bg-blue-950/20" :
                        "hover:bg-gray-850/60"
                      )}
                    >
                      {/* Drag Grip / Index Column */}
                      <td className="py-3 px-3 text-center text-gray-500">
                        {isPending ? (
                          <div 
                            className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-gray-800 text-gray-500 hover:text-amber-400 transition-colors inline-flex items-center justify-center"
                            title="Drag to reorder pending task priority sequence"
                          >
                            <GripVertical className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <span className="font-mono text-[10px] text-gray-600">{index + 1}</span>
                        )}
                      </td>

                      {/* ID & Title */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-[10px] text-gray-500 font-bold">{task.id}</span>
                          {isPending && (
                            <span className="text-[9px] font-mono text-amber-400/70 bg-amber-950/60 px-1 py-0.2 rounded border border-amber-900/60">
                              Seq #{index + 1}
                            </span>
                          )}
                        </div>
                        <div className="font-semibold text-gray-100 mt-0.5 flex items-center space-x-1.5">
                          <span 
                            onClick={() => setSelectedTaskForDetail(task)}
                            className="hover:text-blue-300 cursor-pointer transition-colors"
                          >
                            {task.title}
                          </span>
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

                      {/* Priority (Interactive Popover) */}
                      <td className="py-3 px-3 relative">
                        <div className="relative inline-block">
                          <button
                            onClick={() => setActivePriorityMenuId(activePriorityMenuId === task.id ? null : task.id)}
                            className={cn(
                              "text-[10px] font-bold uppercase px-2 py-0.5 rounded flex items-center space-x-1 transition-all hover:ring-1 hover:ring-gray-400",
                              task.priority === 'critical' ? "bg-rose-950 text-rose-300 border border-rose-800" :
                              task.priority === 'high' ? "bg-amber-950 text-amber-300 border border-amber-800" :
                              task.priority === 'medium' ? "bg-blue-950 text-blue-300 border border-blue-800" :
                              "bg-gray-800 text-gray-300 border border-gray-700"
                            )}
                            title="Click to adjust priority level"
                          >
                            <span>{task.priority}</span>
                            <ChevronDown className="w-2.5 h-2.5 opacity-60" />
                          </button>

                          {activePriorityMenuId === task.id && (
                            <div 
                              ref={priorityMenuRef}
                              className="absolute left-0 top-full mt-1 w-32 bg-gray-900 border border-gray-700 rounded-lg shadow-xl py-1 z-30 font-sans"
                            >
                              <div className="px-2 py-1 text-[9px] uppercase font-bold text-gray-500 border-b border-gray-800">
                                Set Priority
                              </div>
                              {(['critical', 'high', 'medium', 'low'] as const).map(p => (
                                <button
                                  key={p}
                                  onClick={() => {
                                    updateTaskPriority(task.id, p);
                                    setActivePriorityMenuId(null);
                                  }}
                                  className={cn(
                                    "w-full text-left px-2 py-1.5 text-[11px] font-medium flex items-center justify-between hover:bg-gray-800 transition-colors",
                                    task.priority === p ? "text-white font-bold bg-gray-800/80" : "text-gray-300"
                                  )}
                                >
                                  <span className="capitalize">{p}</span>
                                  {task.priority === p && <Check className="w-3 h-3 text-blue-400" />}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
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

                      {/* Duration / Tokens & Time Progress */}
                      <td className="py-3 px-3 min-w-[140px]">
                        <TaskTimeProgress task={task} mode="table" />
                        <div className="text-[10px] text-gray-500 font-mono mt-1">
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

      {/* Task Detail Modal */}
      <AgentTaskDetailModal />

      {/* Create Task Modal */}
      <CreateAgentTaskModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
    </div>
  );
}

// Sub-Component: Kanban Task Card with Drag and Drop Support
interface TaskCardProps {
  key?: React.Key;
  task: AgentTaskItem;
  index?: number;
  isPendingDraggable?: boolean;
  isDragging?: boolean;
  isDragOver?: boolean;
  dropPosition?: 'above' | 'below' | null;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
  onPriorityChange?: (priority: AgentTaskItem['priority']) => void;
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
  index,
  isPendingDraggable,
  isDragging,
  isDragOver,
  dropPosition,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  onPriorityChange,
  onInspect,
  onStart,
  onPause,
  onResume,
  onRetry,
  onComplete,
  onDelete
}: TaskCardProps) {
  const isArch = task.assignedAgent === 'architect';
  const isPending = task.status === 'pending';
  const completedSubsteps = task.substeps.filter(s => s.status === 'completed').length;
  const runningSubstep = task.substeps.find(s => s.status === 'running');

  const [isPriorityMenuOpen, setIsPriorityMenuOpen] = useState(false);
  const cardPriorityRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (cardPriorityRef.current && !cardPriorityRef.current.contains(e.target as Node)) {
        setIsPriorityMenuOpen(false);
      }
    };
    if (isPriorityMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isPriorityMenuOpen]);

  return (
    <div 
      draggable={isPending && isPendingDraggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={cn(
        "p-3.5 rounded-xl border transition-all duration-200 group relative bg-gray-950/90 shadow-sm",
        isDragging ? "opacity-30 scale-[0.98] ring-2 ring-blue-500 border-dashed border-blue-400 bg-blue-950/20 cursor-grabbing" :
        isDragOver && dropPosition === 'above' ? "border-t-4 border-t-blue-400 ring-2 ring-blue-500/40 bg-blue-950/30 -translate-y-0.5" :
        isDragOver && dropPosition === 'below' ? "border-b-4 border-b-blue-400 ring-2 ring-blue-500/40 bg-blue-950/30 translate-y-0.5" :
        task.status === 'active' ? "border-cyan-500/70 shadow-cyan-950/50 ring-1 ring-cyan-500/30" :
        task.status === 'completed' ? "border-emerald-800/50 hover:border-emerald-700/80" :
        task.status === 'paused' ? "border-amber-700/60" :
        "border-gray-800 hover:border-gray-700"
      )}
    >
      {/* Visual Drop Placement Marker Pills */}
      {isDragOver && dropPosition === 'above' && (
        <div className="absolute -top-3 left-4 px-2 py-0.5 bg-blue-600 text-white font-mono text-[9px] font-bold rounded shadow-lg flex items-center space-x-1 z-20 animate-bounce">
          <ArrowUp className="w-2.5 h-2.5" />
          <span>Insert Before (Higher Priority)</span>
        </div>
      )}

      {isDragOver && dropPosition === 'below' && (
        <div className="absolute -bottom-3 left-4 px-2 py-0.5 bg-blue-600 text-white font-mono text-[9px] font-bold rounded shadow-lg flex items-center space-x-1 z-20 animate-bounce">
          <ArrowDown className="w-2.5 h-2.5" />
          <span>Insert After (Lower Priority)</span>
        </div>
      )}

      {/* Top Header: Drag Handle, ID & Agent Role Pill */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-1.5">
          {/* Drag Grip Handle on Pending Cards */}
          {isPending && isPendingDraggable && (
            <div 
              className="cursor-grab active:cursor-grabbing p-0.5 -ml-1 text-gray-500 hover:text-amber-300 transition-colors"
              title="Drag card to reorder execution priority"
            >
              <GripVertical className="w-3.5 h-3.5" />
            </div>
          )}

          <span className="font-mono text-[10px] font-bold text-gray-500">{task.id}</span>

          {typeof index === 'number' && isPending && (
            <span className="font-mono text-[9px] text-amber-400/80 bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-900/60">
              #{index + 1}
            </span>
          )}

          <span className={cn(
            "text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border",
            isArch ? "bg-indigo-950 text-indigo-300 border-indigo-800" : "bg-teal-950 text-teal-300 border-teal-800"
          )}>
            {isArch ? 'Architect' : 'Builder'}
          </span>
        </div>

        {/* Priority Badge with In-Place Quick Selector */}
        <div className="relative" ref={cardPriorityRef}>
          <button
            onClick={() => setIsPriorityMenuOpen(!isPriorityMenuOpen)}
            className={cn(
              "text-[9px] font-bold uppercase px-2 py-0.5 rounded flex items-center space-x-1 transition-all hover:scale-105",
              task.priority === 'critical' ? "bg-rose-950 text-rose-400 border border-rose-900" :
              task.priority === 'high' ? "bg-amber-950 text-amber-400 border border-amber-900" :
              task.priority === 'medium' ? "bg-blue-950 text-blue-400 border border-blue-900" :
              "bg-gray-900 text-gray-500 border border-gray-800"
            )}
            title="Click to change task priority level"
          >
            <span>{task.priority}</span>
            <ChevronDown className="w-2 h-2 opacity-60" />
          </button>

          {isPriorityMenuOpen && onPriorityChange && (
            <div className="absolute right-0 top-full mt-1 w-32 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl py-1 z-30 font-sans">
              <div className="px-2 py-1 text-[9px] uppercase font-bold text-gray-500 border-b border-gray-800">
                Change Priority
              </div>
              {(['critical', 'high', 'medium', 'low'] as const).map(p => (
                <button
                  key={p}
                  onClick={(e) => {
                    e.stopPropagation();
                    onPriorityChange(p);
                    setIsPriorityMenuOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-2.5 py-1.5 text-[11px] font-medium flex items-center justify-between hover:bg-gray-800 transition-colors",
                    task.priority === p ? "text-white font-bold bg-gray-800/90" : "text-gray-300"
                  )}
                >
                  <span className="capitalize">{p}</span>
                  {task.priority === p && <Check className="w-3 h-3 text-blue-400" />}
                </button>
              ))}
            </div>
          )}
        </div>
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

      {/* Elapsed vs Estimated Time Indicator & Progress Bar */}
      <TaskTimeProgress task={task} mode="card" className="mt-2.5 pt-2 border-t border-gray-800/60" />

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
