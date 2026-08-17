import React, { useState, useRef, useEffect } from 'react';
import { useSimulation } from '../hooks/useSimulation';
import { 
  Target, ChevronRight, ChevronDown, Plus, ExternalLink, FileText, Filter, 
  AlertCircle, CheckCircle2, Clock, PlayCircle, GripVertical, ArrowUp, ArrowDown, ArrowUpDown,
  Flame, Minus, Check, X, Sparkles, Layers, Tag
} from 'lucide-react';
import { cn } from '../lib/utils';
import { WorkRequest, TaskPriority } from '../types';

type FilterStatus = 'all' | 'pending' | 'active' | 'completed' | 'failed';
type FilterPriority = 'all' | 'High' | 'Medium' | 'Low';

export function getWorkRequestPriority(wr: WorkRequest): TaskPriority {
  if (wr.priority) {
    const pStr = String(wr.priority).toLowerCase();
    if (pStr === 'high') return 'High';
    if (pStr === 'low') return 'Low';
    return 'Medium';
  }
  const detailPriority = wr.detail?.intent?.priority ? String(wr.detail.intent.priority).toLowerCase() : '';
  if (detailPriority === 'high' || detailPriority === 'critical') return 'High';
  if (detailPriority === 'low') return 'Low';
  return 'Medium';
}

function getWorkRequestStatusCategory(wr: WorkRequest): 'pending' | 'active' | 'completed' | 'failed' {
  const detailStatus = wr.detail?.execution_state?.status;
  const errorState = wr.detail?.execution_state?.error_state;

  if (detailStatus === 'failed' || (wr.status as string) === 'FAILED' || (errorState && errorState !== 'None' && errorState !== 'null')) {
    return 'failed';
  }
  if (detailStatus === 'completed' || wr.status === 'VALIDATE') {
    return 'completed';
  }
  if (detailStatus === 'running' || detailStatus === 'active' || wr.status === 'EXEC' || wr.status === 'PLAN' || wr.status === 'SPEC' || wr.status === 'REVIEW' || wr.status === 'APPROVAL') {
    return 'active';
  }
  return 'pending';
}

export function WorkRequestList() {
  const { workRequests, activeWorkRequest, BackendService, openWorkRequestDetailModal, addToast } = useSimulation();
  const [collapsed, setCollapsed] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterStatus>('all');
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<FilterPriority>('all');
  const [filterMode, setFilterMode] = useState<'status' | 'priority'>('status');

  // Drag and drop state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<'above' | 'below' | null>(null);

  // Priority Popover State
  const [priorityPopoverWrId, setPriorityPopoverWrId] = useState<string | null>(null);

  // Create Task Form / Modal State
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [newTaskIntent, setNewTaskIntent] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('Medium');

  // Close priority popover on outside click
  const popoverRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPriorityPopoverWrId(null);
      }
    };
    if (priorityPopoverWrId) {
      document.addEventListener('mousedown', handleOutsideClick);
      return () => document.removeEventListener('mousedown', handleOutsideClick);
    }
  }, [priorityPopoverWrId]);

  // Compute counts
  const statusCounts = {
    all: workRequests.length,
    pending: workRequests.filter(w => getWorkRequestStatusCategory(w) === 'pending').length,
    active: workRequests.filter(w => getWorkRequestStatusCategory(w) === 'active').length,
    completed: workRequests.filter(w => getWorkRequestStatusCategory(w) === 'completed').length,
    failed: workRequests.filter(w => getWorkRequestStatusCategory(w) === 'failed').length,
  };

  const priorityCounts = {
    all: workRequests.length,
    High: workRequests.filter(w => getWorkRequestPriority(w) === 'High').length,
    Medium: workRequests.filter(w => getWorkRequestPriority(w) === 'Medium').length,
    Low: workRequests.filter(w => getWorkRequestPriority(w) === 'Low').length,
  };

  const filteredRequests = workRequests.filter(wr => {
    if (selectedFilter !== 'all' && getWorkRequestStatusCategory(wr) !== selectedFilter) {
      return false;
    }
    if (selectedPriorityFilter !== 'all' && getWorkRequestPriority(wr) !== selectedPriorityFilter) {
      return false;
    }
    return true;
  });

  const filterChips: { id: FilterStatus; label: string; activeClass: string; dotColor: string }[] = [
    { id: 'all', label: 'All', activeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40 font-bold', dotColor: 'bg-blue-400' },
    { id: 'pending', label: 'Pending', activeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold', dotColor: 'bg-amber-400' },
    { id: 'active', label: 'Active', activeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 font-bold', dotColor: 'bg-indigo-400' },
    { id: 'completed', label: 'Completed', activeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold', dotColor: 'bg-emerald-400' },
    { id: 'failed', label: 'Failed', activeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold', dotColor: 'bg-rose-400' },
  ];

  const priorityFilterChips: { id: FilterPriority; label: string; activeClass: string; dotColor: string }[] = [
    { id: 'all', label: 'All Pri', activeClass: 'bg-gray-700/60 text-gray-200 border-gray-500/50 font-bold', dotColor: 'bg-gray-400' },
    { id: 'High', label: 'High', activeClass: 'bg-rose-500/25 text-rose-300 border-rose-500/60 font-bold', dotColor: 'bg-rose-400' },
    { id: 'Medium', label: 'Medium', activeClass: 'bg-amber-500/25 text-amber-300 border-amber-500/60 font-bold', dotColor: 'bg-amber-400' },
    { id: 'Low', label: 'Low', activeClass: 'bg-blue-500/25 text-blue-300 border-blue-500/60 font-bold', dotColor: 'bg-blue-400' },
  ];

  // Drag & Drop event handlers
  const handleDragStart = (e: React.DragEvent, wrId: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', wrId);
    setDraggedId(wrId);
  };

  const handleDragOver = (e: React.DragEvent, wrId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (draggedId === wrId) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const position = e.clientY < midY ? 'above' : 'below';

    setDragOverId(wrId);
    setDropPosition(position);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetWrId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetWrId) {
      resetDragState();
      return;
    }

    const newWRs = [...workRequests];
    const draggedIdx = newWRs.findIndex(w => w.id === draggedId);
    if (draggedIdx === -1) {
      resetDragState();
      return;
    }

    const [removed] = newWRs.splice(draggedIdx, 1);
    const targetIdx = newWRs.findIndex(w => w.id === targetWrId);
    if (targetIdx === -1) {
      resetDragState();
      return;
    }

    const insertIdx = dropPosition === 'below' ? targetIdx + 1 : targetIdx;
    newWRs.splice(insertIdx, 0, removed);

    BackendService.reorderWorkRequests(newWRs);
    addToast({
      title: 'Priority Reordered',
      message: `Task [${removed.id}] moved to Priority #${insertIdx + 1}`,
      type: 'info'
    });

    resetDragState();
  };

  const resetDragState = () => {
    setDraggedId(null);
    setDragOverId(null);
    setDropPosition(null);
  };

  const handleMoveUp = (e: React.MouseEvent, wrId: string) => {
    e.stopPropagation();
    const idx = workRequests.findIndex(w => w.id === wrId);
    if (idx <= 0) return;

    const newWRs = [...workRequests];
    const [item] = newWRs.splice(idx, 1);
    newWRs.splice(idx - 1, 0, item);

    BackendService.reorderWorkRequests(newWRs);
    addToast({
      title: 'Priority Increased',
      message: `Promoted task [${item.id}] to Priority #${idx}`,
      type: 'info'
    });
  };

  const handleMoveDown = (e: React.MouseEvent, wrId: string) => {
    e.stopPropagation();
    const idx = workRequests.findIndex(w => w.id === wrId);
    if (idx < 0 || idx >= workRequests.length - 1) return;

    const newWRs = [...workRequests];
    const [item] = newWRs.splice(idx, 1);
    newWRs.splice(idx + 1, 0, item);

    BackendService.reorderWorkRequests(newWRs);
    addToast({
      title: 'Priority Lowered',
      message: `Demoted task [${item.id}] to Priority #${idx + 2}`,
      type: 'info'
    });
  };

  const handlePrioritySelect = (e: React.MouseEvent, wrId: string, priority: TaskPriority) => {
    e.stopPropagation();
    BackendService.updateWorkRequestPriority(wrId, priority);
    setPriorityPopoverWrId(null);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskIntent.trim()) return;
    BackendService.createWorkRequest(newTaskIntent.trim(), newTaskPriority);
    setNewTaskIntent('');
    setIsCreatingTask(false);
  };

  if (collapsed) {
    return (
      <div className="w-12 h-full border-r border-gray-800 bg-gray-900/50 flex flex-col items-center py-4 cursor-pointer" onClick={() => setCollapsed(false)}>
        <ChevronRight className="w-5 h-5 text-gray-400 mb-4" />
        <Target className="w-5 h-5 text-gray-500" />
      </div>
    );
  }

  return (
    <div className="w-72 h-full border-r border-gray-800 bg-gray-900/50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-3 border-b border-gray-800/50 hover:bg-gray-800/20 cursor-pointer" onClick={() => setCollapsed(true)}>
        <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
          <Target className="w-4 h-4 text-blue-400" />
          <span>Work Requests</span>
        </span>
        <div className="flex items-center space-x-1">
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              BackendService.sortByPriority('desc');
            }} 
            className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-amber-300 transition-colors"
            title="Sort Tasks by Priority (High → Low)"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              openWorkRequestDetailModal(activeWorkRequest || workRequests[0]); 
            }} 
            className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-blue-300 transition-colors"
            title="Inspect Work Request Detail Modal"
          >
            <FileText className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              setIsCreatingTask(prev => !prev);
            }} 
            className={cn(
              "p-1 rounded transition-colors",
              isCreatingTask ? "bg-blue-600 text-white" : "hover:bg-gray-800 text-gray-400 hover:text-gray-200"
            )}
            title="Create Work Request with Priority"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </div>
      </div>

      {/* Task Creation Form Inset */}
      {isCreatingTask && (
        <form onSubmit={handleCreateSubmit} className="p-3 bg-gray-950 border-b border-gray-800/80 space-y-2.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-gray-300">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>New Work Request</span>
            </span>
            <button 
              type="button" 
              onClick={() => setIsCreatingTask(false)}
              className="text-gray-500 hover:text-gray-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <input
            type="text"
            placeholder="Describe intent or goal..."
            value={newTaskIntent}
            onChange={(e) => setNewTaskIntent(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700/80 rounded px-2.5 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
            autoFocus
          />

          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold flex items-center gap-1">
              <Tag className="w-2.5 h-2.5 text-gray-400" />
              <span>Priority Flag</span>
            </label>
            <div className="grid grid-cols-3 gap-1">
              {(['High', 'Medium', 'Low'] as TaskPriority[]).map((p) => {
                const isSelected = newTaskPriority === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setNewTaskPriority(p)}
                    className={cn(
                      "px-2 py-1 rounded text-[10px] font-bold border transition-all flex items-center justify-center gap-1",
                      p === 'High' && (isSelected ? "bg-rose-500/30 text-rose-300 border-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.3)]" : "bg-gray-900 text-rose-400/70 border-gray-800 hover:bg-rose-950/30"),
                      p === 'Medium' && (isSelected ? "bg-amber-500/30 text-amber-300 border-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]" : "bg-gray-900 text-amber-400/70 border-gray-800 hover:bg-amber-950/30"),
                      p === 'Low' && (isSelected ? "bg-blue-500/30 text-blue-300 border-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.3)]" : "bg-gray-900 text-blue-400/70 border-gray-800 hover:bg-blue-950/30")
                    )}
                  >
                    {p === 'High' && <Flame className="w-2.5 h-2.5" />}
                    {p === 'Medium' && <Minus className="w-2.5 h-2.5" />}
                    {p === 'Low' && <ArrowDown className="w-2.5 h-2.5" />}
                    <span>{p}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => setIsCreatingTask(false)}
              className="px-2.5 py-1 rounded text-xs text-gray-400 hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newTaskIntent.trim()}
              className="px-3 py-1 rounded text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 transition-colors flex items-center gap-1 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Task</span>
            </button>
          </div>
        </form>
      )}

      {/* Subheader / Mode & Quick Sort Toolbar */}
      <div className="px-3 py-1.5 bg-gray-950/90 border-b border-gray-800/70 flex items-center justify-between text-[10px] text-gray-400 font-mono">
        <span className="flex items-center gap-1 text-gray-400">
          <GripVertical className="w-3 h-3 text-gray-500" />
          <span>Drag to reorder</span>
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => BackendService.sortByPriority('desc')}
            className="px-1.5 py-0.5 rounded bg-gray-900 hover:bg-gray-800 border border-gray-800 text-[9px] text-amber-400/90 hover:text-amber-300 font-bold flex items-center gap-0.5"
            title="Sort tasks High → Low priority"
          >
            <Flame className="w-2.5 h-2.5" />
            <span>Sort Pri</span>
          </button>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-900 border border-gray-800 text-blue-400 font-bold">
            {workRequests.length} Tasks
          </span>
        </div>
      </div>

      {/* Filter Tabs Toggle (Status vs Priority) */}
      <div className="px-3 py-2 border-b border-gray-800/60 bg-gray-950/40 space-y-1.5">
        <div className="flex items-center justify-between text-[10px] text-gray-400 font-medium">
          <div className="flex items-center space-x-1">
            <Filter className="w-3 h-3 text-gray-500" />
            <span className="uppercase tracking-wider">Filter By</span>
          </div>
          <div className="flex items-center bg-gray-900 p-0.5 rounded border border-gray-800">
            <button
              onClick={() => setFilterMode('status')}
              className={cn(
                "px-1.5 py-0.5 rounded text-[9px] font-semibold transition-all",
                filterMode === 'status' ? "bg-blue-600 text-white" : "text-gray-400 hover:text-gray-200"
              )}
            >
              Status
            </button>
            <button
              onClick={() => setFilterMode('priority')}
              className={cn(
                "px-1.5 py-0.5 rounded text-[9px] font-semibold transition-all",
                filterMode === 'priority' ? "bg-blue-600 text-white" : "text-gray-400 hover:text-gray-200"
              )}
            >
              Priority
            </button>
          </div>
        </div>
        
        {/* Status Filters */}
        {filterMode === 'status' && (
          <div className="flex flex-wrap gap-1">
            {filterChips.map((chip) => {
              const count = statusCounts[chip.id];
              const isSelected = selectedFilter === chip.id;
              return (
                <button
                  key={chip.id}
                  onClick={() => setSelectedFilter(chip.id)}
                  className={cn(
                    "px-1.5 py-0.5 rounded text-[10px] font-medium transition-all flex items-center space-x-1 border",
                    isSelected
                      ? chip.activeClass
                      : "bg-gray-900/80 text-gray-400 border-gray-800 hover:bg-gray-800 hover:text-gray-200"
                  )}
                >
                  <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", chip.dotColor, !isSelected && "opacity-60")} />
                  <span>{chip.label}</span>
                  <span className={cn("font-mono text-[9px]", isSelected ? "opacity-100" : "text-gray-500")}>
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Priority Filters */}
        {filterMode === 'priority' && (
          <div className="flex flex-wrap gap-1">
            {priorityFilterChips.map((chip) => {
              const count = priorityCounts[chip.id];
              const isSelected = selectedPriorityFilter === chip.id;
              return (
                <button
                  key={chip.id}
                  onClick={() => setSelectedPriorityFilter(chip.id)}
                  className={cn(
                    "px-1.5 py-0.5 rounded text-[10px] font-medium transition-all flex items-center space-x-1 border",
                    isSelected
                      ? chip.activeClass
                      : "bg-gray-900/80 text-gray-400 border-gray-800 hover:bg-gray-800 hover:text-gray-200"
                  )}
                >
                  <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", chip.dotColor, !isSelected && "opacity-60")} />
                  <span>{chip.label}</span>
                  <span className={cn("font-mono text-[9px]", isSelected ? "opacity-100" : "text-gray-500")}>
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Request Cards List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {filteredRequests.length === 0 ? (
          <div className="p-4 text-center space-y-2">
            <p className="text-xs text-gray-500">No matching requests found.</p>
            <button
              onClick={() => {
                setSelectedFilter('all');
                setSelectedPriorityFilter('all');
              }}
              className="text-[11px] text-blue-400 hover:underline font-mono"
            >
              Reset all filters
            </button>
          </div>
        ) : (
          filteredRequests.map(wr => {
            const category = getWorkRequestStatusCategory(wr);
            const priority = getWorkRequestPriority(wr);
            const globalPriorityRank = workRequests.findIndex(w => w.id === wr.id) + 1;
            const isDraggingThis = draggedId === wr.id;
            const isDragOverThis = dragOverId === wr.id && !isDraggingThis;
            const isPopoverOpen = priorityPopoverWrId === wr.id;

            return (
              <div 
                key={wr.id}
                draggable
                onDragStart={(e) => handleDragStart(e, wr.id)}
                onDragOver={(e) => handleDragOver(e, wr.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, wr.id)}
                onDragEnd={resetDragState}
                onClick={() => BackendService.setActiveWorkRequest(wr)}
                className={cn(
                  "group px-2.5 py-2 rounded-md cursor-pointer flex flex-col space-y-1.5 transition-all relative border select-none",
                  activeWorkRequest?.id === wr.id 
                    ? "bg-blue-500/10 border-blue-500/40 shadow-sm" 
                    : "border-gray-800/70 hover:bg-gray-800/50 hover:border-gray-700",
                  isDraggingThis && "opacity-30 bg-blue-950/40 border-dashed border-blue-500 scale-[0.98]",
                  isDragOverThis && dropPosition === 'above' && "border-t-2 border-t-blue-400 bg-blue-950/30",
                  isDragOverThis && dropPosition === 'below' && "border-b-2 border-b-blue-400 bg-blue-950/30"
                )}
              >
                {/* Top Row: Drag Handle, Rank, Priority Flag, Status */}
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center space-x-1.5 min-w-0">
                    {/* Drag handle */}
                    <div 
                      className="cursor-grab active:cursor-grabbing text-gray-600 hover:text-gray-300 p-0.5 rounded transition-colors"
                      title="Drag to reorder task rank"
                    >
                      <GripVertical className="w-3.5 h-3.5" />
                    </div>

                    {/* Priority Rank Order (#1, #2, etc.) */}
                    <span 
                      className={cn(
                        "text-[9px] font-mono px-1 py-0.2 rounded font-bold border shrink-0",
                        globalPriorityRank === 1 
                          ? "bg-amber-950/80 text-amber-300 border-amber-600/80 shadow-[0_0_6px_rgba(245,158,11,0.2)]" 
                          : globalPriorityRank <= 3
                          ? "bg-blue-950/60 text-blue-300 border-blue-700/60"
                          : "bg-gray-900 text-gray-400 border-gray-800"
                      )}
                      title={`Queue Rank #${globalPriorityRank}`}
                    >
                      #{globalPriorityRank}
                    </span>

                    {/* Priority Flag Badge with Interactive Selector */}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPriorityPopoverWrId(isPopoverOpen ? null : wr.id);
                        }}
                        className={cn(
                          "text-[9px] font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 transition-all hover:scale-105",
                          priority === 'High' && "bg-rose-950/80 text-rose-300 border-rose-600/70 shadow-[0_0_6px_rgba(244,63,94,0.25)]",
                          priority === 'Medium' && "bg-amber-950/70 text-amber-300 border-amber-600/60",
                          priority === 'Low' && "bg-blue-950/70 text-blue-300 border-blue-700/60"
                        )}
                        title={`Priority: ${priority} (Click to change)`}
                      >
                        {priority === 'High' && <Flame className="w-2.5 h-2.5 text-rose-400" />}
                        {priority === 'Medium' && <Minus className="w-2.5 h-2.5 text-amber-400" />}
                        {priority === 'Low' && <ArrowDown className="w-2.5 h-2.5 text-blue-400" />}
                        <span>{priority}</span>
                        <ChevronDown className="w-2.5 h-2.5 opacity-60" />
                      </button>

                      {/* Priority Picker Dropdown */}
                      {isPopoverOpen && (
                        <div 
                          ref={popoverRef}
                          onClick={(e) => e.stopPropagation()}
                          className="absolute left-0 top-full mt-1 w-32 bg-gray-900 border border-gray-700 rounded-md shadow-xl z-50 p-1 space-y-0.5 animate-in fade-in zoom-in-95 duration-100"
                        >
                          <div className="px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-gray-500 font-semibold border-b border-gray-800">
                            Set Priority
                          </div>
                          {(['High', 'Medium', 'Low'] as TaskPriority[]).map((p) => {
                            const isCurrent = priority === p;
                            return (
                              <button
                                key={p}
                                onClick={(e) => handlePrioritySelect(e, wr.id, p)}
                                className={cn(
                                  "w-full px-1.5 py-1 text-[10px] font-semibold rounded flex items-center justify-between transition-colors",
                                  p === 'High' && (isCurrent ? "bg-rose-950 text-rose-200" : "text-rose-300 hover:bg-rose-950/60"),
                                  p === 'Medium' && (isCurrent ? "bg-amber-950 text-amber-200" : "text-amber-300 hover:bg-amber-950/60"),
                                  p === 'Low' && (isCurrent ? "bg-blue-950 text-blue-200" : "text-blue-300 hover:bg-blue-950/60")
                                )}
                              >
                                <span className="flex items-center gap-1.5">
                                  {p === 'High' && <Flame className="w-3 h-3 text-rose-400" />}
                                  {p === 'Medium' && <Minus className="w-3 h-3 text-amber-400" />}
                                  {p === 'Low' && <ArrowDown className="w-3 h-3 text-blue-400" />}
                                  <span>{p}</span>
                                </span>
                                {isCurrent && <Check className="w-3 h-3 text-white" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right side controls: Step up/down, Inspect, Status badge */}
                  <div className="flex items-center space-x-1 shrink-0">
                    {/* Reorder Up/Down Quick Controls on Hover */}
                    <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-0.5 transition-opacity bg-gray-900/90 rounded border border-gray-800 px-0.5">
                      <button
                        onClick={(e) => handleMoveUp(e, wr.id)}
                        disabled={globalPriorityRank === 1}
                        className="p-0.5 hover:bg-gray-800 rounded text-gray-400 hover:text-blue-300 disabled:opacity-30 disabled:hover:bg-transparent"
                        title="Move Up Priority"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => handleMoveDown(e, wr.id)}
                        disabled={globalPriorityRank === workRequests.length}
                        className="p-0.5 hover:bg-gray-800 rounded text-gray-400 hover:text-blue-300 disabled:opacity-30 disabled:hover:bg-transparent"
                        title="Move Down Priority"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openWorkRequestDetailModal(wr);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-gray-700 rounded text-gray-400 hover:text-blue-400 transition-opacity"
                      title="Open Work Request Detail Popup"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </button>

                    <span className={cn(
                      "text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1 border shrink-0",
                      category === 'pending' ? 'bg-amber-950/40 text-amber-400 border-amber-800/50' :
                      category === 'completed' ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50' :
                      category === 'failed' ? 'bg-rose-950/40 text-rose-400 border-rose-800/50' :
                      'bg-indigo-950/40 text-indigo-400 border-indigo-800/50'
                    )}>
                      {category === 'pending' && <Clock className="w-2.5 h-2.5" />}
                      {category === 'active' && <PlayCircle className="w-2.5 h-2.5" />}
                      {category === 'completed' && <CheckCircle2 className="w-2.5 h-2.5" />}
                      {category === 'failed' && <AlertCircle className="w-2.5 h-2.5" />}
                      {wr.status}
                    </span>
                  </div>
                </div>

                {/* Bottom Row: Intent description & ID */}
                <div className="pl-4 pr-1">
                  <div className={cn("text-xs leading-snug line-clamp-2", activeWorkRequest?.id === wr.id ? "text-gray-100 font-medium" : "text-gray-300")}>
                    {wr.intent}
                  </div>
                  <div className="text-[10px] font-mono text-gray-500 mt-0.5 truncate">
                    {wr.id}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}


