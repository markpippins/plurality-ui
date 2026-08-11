import React, { useState } from 'react';
import { useSimulation } from '../hooks/useSimulation';
import { Target, ChevronRight, ChevronDown, Plus } from 'lucide-react';
import { cn } from '../lib/utils';

export function WorkRequestList() {
  const { workRequests, activeWorkRequest, BackendService } = useSimulation();
  const [collapsed, setCollapsed] = useState(false);

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
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800/50 hover:bg-gray-800/20 cursor-pointer" onClick={() => setCollapsed(true)}>
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Work Requests</span>
        <div className="flex items-center space-x-2">
           <button onClick={(e) => { e.stopPropagation(); BackendService.createWorkRequest('New User Request'); }} className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-gray-200">
             <Plus className="w-3 h-3" />
           </button>
           <ChevronDown className="w-4 h-4 text-gray-500" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {workRequests.map(wr => (
          <div 
            key={wr.id}
            onClick={() => BackendService.setActiveWorkRequest(wr)}
            className={cn(
              "px-3 py-2 rounded-md cursor-pointer flex flex-col space-y-1 transition-colors",
              activeWorkRequest?.id === wr.id 
                ? "bg-blue-500/10 border border-blue-500/20" 
                : "border border-transparent hover:bg-gray-800/50"
            )}
          >
            <div className="flex items-center justify-between">
              <span className={cn("text-xs font-mono", activeWorkRequest?.id === wr.id ? "text-blue-400" : "text-gray-500")}>
                {wr.id}
              </span>
              <span className={cn(
                "text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider",
                wr.status === 'NEW' ? 'bg-gray-800 text-gray-400' :
                wr.status === 'VALIDATE' ? 'bg-green-900/50 text-green-400' :
                'bg-blue-900/50 text-blue-400'
              )}>
                {wr.status}
              </span>
            </div>
            <span className={cn("text-sm truncate", activeWorkRequest?.id === wr.id ? "text-gray-200" : "text-gray-400")}>
              {wr.intent}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
