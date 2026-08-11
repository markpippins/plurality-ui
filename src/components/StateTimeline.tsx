import React from 'react';
import { useSimulation } from '../hooks/useSimulation';
import { AppState } from '../types';
import { cn } from '../lib/utils';
import { Check, Workflow } from 'lucide-react';

const STATES: AppState[] = ['NEW', 'PLAN', 'REVIEW', 'APPROVAL', 'SPEC', 'EXEC', 'VALIDATE'];

export function StateTimeline() {
  const { activeWorkRequest, openDependencyGraphModal } = useSimulation();

  if (!activeWorkRequest) return null;

  const currentIndex = STATES.indexOf(activeWorkRequest.status);

  return (
    <div className="h-12 border-b border-gray-800 bg-gray-900/50 flex items-center justify-between px-6 space-x-2 w-full flex-shrink-0">
      <div className="flex-1 flex items-center space-x-1 overflow-x-auto">
        {STATES.map((state, idx) => {
          const isPast = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          
          return (
            <React.Fragment key={state}>
               <div className="flex items-center space-x-2 shrink-0">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors",
                    isPast ? "bg-green-500 text-gray-900" :
                    isCurrent ? "bg-blue-600 text-white ring-2 ring-blue-600/30 ring-offset-2 ring-offset-gray-900" :
                    "bg-gray-800 text-gray-500 border border-gray-700"
                  )}>
                     {isPast ? <Check className="w-3.5 h-3.5" /> : (idx + 1)}
                  </div>
                  <span className={cn(
                    "text-[10px] uppercase tracking-widest font-semibold transition-colors hidden sm:inline-block",
                    isPast ? "text-gray-400" :
                    isCurrent ? "text-gray-100" :
                    "text-gray-600"
                  )}>
                     {state}
                  </span>
               </div>
               {idx < STATES.length - 1 && (
                 <div className={cn(
                    "flex-1 min-w-[12px] h-px mx-2 sm:mx-4 transition-colors",
                    isPast ? "bg-green-500/50" : "bg-gray-800"
                 )} />
               )}
            </React.Fragment>
          );
        })}
      </div>

      <button
        onClick={openDependencyGraphModal}
        className="flex items-center space-x-1.5 bg-gray-800/80 hover:bg-gray-700 text-emerald-400 border border-emerald-800/60 px-2.5 py-1 rounded text-xs font-semibold shrink-0 transition-colors"
        title="View D3.js Task & Agent Dependency Graph"
      >
        <Workflow className="w-3.5 h-3.5" />
        <span className="hidden md:inline">Task Graph</span>
      </button>
    </div>
  );
}
