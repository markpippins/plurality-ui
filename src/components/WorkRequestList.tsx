import React, { useState } from 'react';
import { useSimulation } from '../hooks/useSimulation';
import { Target, ChevronRight, ChevronDown, Plus, ExternalLink, FileText, Filter, AlertCircle, CheckCircle2, Clock, PlayCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { WorkRequest } from '../types';

type FilterStatus = 'all' | 'pending' | 'active' | 'completed' | 'failed';

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
  const { workRequests, activeWorkRequest, BackendService, openWorkRequestDetailModal } = useSimulation();
  const [collapsed, setCollapsed] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterStatus>('all');

  // Compute status counts for filter badges
  const counts = {
    all: workRequests.length,
    pending: workRequests.filter(w => getWorkRequestStatusCategory(w) === 'pending').length,
    active: workRequests.filter(w => getWorkRequestStatusCategory(w) === 'active').length,
    completed: workRequests.filter(w => getWorkRequestStatusCategory(w) === 'completed').length,
    failed: workRequests.filter(w => getWorkRequestStatusCategory(w) === 'failed').length,
  };

  const filteredRequests = workRequests.filter(wr => {
    if (selectedFilter === 'all') return true;
    return getWorkRequestStatusCategory(wr) === selectedFilter;
  });

  const filterChips: { id: FilterStatus; label: string; activeClass: string; dotColor: string }[] = [
    { id: 'all', label: 'All', activeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40 font-bold', dotColor: 'bg-blue-400' },
    { id: 'pending', label: 'Pending', activeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold', dotColor: 'bg-amber-400' },
    { id: 'active', label: 'Active', activeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 font-bold', dotColor: 'bg-indigo-400' },
    { id: 'completed', label: 'Completed', activeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold', dotColor: 'bg-emerald-400' },
    { id: 'failed', label: 'Failed', activeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold', dotColor: 'bg-rose-400' },
  ];

  if (collapsed) {
    return (
      <div className="w-12 h-full border-r border-gray-800 bg-gray-900/50 flex flex-col items-center py-4 cursor-pointer" onClick={() => setCollapsed(false)}>
        <ChevronRight className="w-5 h-5 text-gray-400 mb-4" />
        <Target className="w-5 h-5 text-gray-500" />
      </div>
    );
  }

  return (
    <div className="w-64 h-full border-r border-gray-800 bg-gray-900/50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800/50 hover:bg-gray-800/20 cursor-pointer" onClick={() => setCollapsed(true)}>
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Work Requests</span>
        <div className="flex items-center space-x-1">
           <button 
             onClick={(e) => { 
               e.stopPropagation(); 
               openWorkRequestDetailModal(activeWorkRequest || workRequests[0]); 
             }} 
             className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-blue-300"
             title="Inspect Work Request Detail Popup"
           >
             <FileText className="w-3.5 h-3.5" />
           </button>
           <button 
             onClick={(e) => { e.stopPropagation(); BackendService.createWorkRequest('New User Request'); }} 
             className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-gray-200"
             title="Create Work Request"
           >
             <Plus className="w-3.5 h-3.5" />
           </button>
           <ChevronDown className="w-4 h-4 text-gray-500" />
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="px-3 py-2 border-b border-gray-800/60 bg-gray-950/40">
        <div className="flex items-center space-x-1 text-[10px] text-gray-400 font-medium mb-1.5">
          <Filter className="w-3 h-3 text-gray-500" />
          <span className="uppercase tracking-wider">Filter Status</span>
        </div>
        
        <div className="flex flex-wrap gap-1">
          {filterChips.map((chip) => {
            const count = counts[chip.id];
            const isSelected = selectedFilter === chip.id;
            return (
              <button
                key={chip.id}
                onClick={() => setSelectedFilter(chip.id)}
                className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-medium transition-all flex items-center space-x-1 border",
                  isSelected
                    ? chip.activeClass
                    : "bg-gray-900/80 text-gray-400 border-gray-800 hover:bg-gray-800 hover:text-gray-200"
                )}
              >
                <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", chip.dotColor, !isSelected && "opacity-60")} />
                <span>{chip.label}</span>
                <span className={cn("ml-0.5 font-mono text-[9px]", isSelected ? "opacity-100" : "text-gray-500")}>
                  ({count})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Request Cards List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredRequests.length === 0 ? (
          <div className="p-4 text-center space-y-2">
            <p className="text-xs text-gray-500">No {selectedFilter} requests found.</p>
            <button
              onClick={() => setSelectedFilter('all')}
              className="text-[11px] text-blue-400 hover:underline font-mono"
            >
              Reset filter to All
            </button>
          </div>
        ) : (
          filteredRequests.map(wr => {
            const category = getWorkRequestStatusCategory(wr);
            return (
              <div 
                key={wr.id}
                onClick={() => BackendService.setActiveWorkRequest(wr)}
                className={cn(
                  "group px-3 py-2 rounded-md cursor-pointer flex flex-col space-y-1 transition-colors relative border",
                  activeWorkRequest?.id === wr.id 
                    ? "bg-blue-500/10 border-blue-500/30" 
                    : "border-transparent hover:bg-gray-800/50 hover:border-gray-800"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className={cn("text-xs font-mono flex items-center gap-1", activeWorkRequest?.id === wr.id ? "text-blue-400 font-bold" : "text-gray-500")}>
                    {wr.id}
                  </span>
                  <div className="flex items-center space-x-1">
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
                      "text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1 border",
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
                <span className={cn("text-sm truncate pr-2", activeWorkRequest?.id === wr.id ? "text-gray-200 font-medium" : "text-gray-400")}>
                  {wr.intent}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

