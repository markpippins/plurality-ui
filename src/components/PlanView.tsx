import React from 'react';
import { useSimulation } from '../hooks/useSimulation';
import { CheckCircle2, AlertCircle, PlayCircle, ShieldAlert, Users, Vote } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export function PlanView() {
  const { activeWorkRequest, planIR, critiqueIR, BackendService, openRoundtableModal, roundtableSession } = useSimulation();

  if (!activeWorkRequest) {
    return <div className="flex-1 flex flex-col border-r border-gray-800 bg-gray-900 justify-center items-center text-gray-500 text-sm">Select a WorkRequest</div>;
  }

  return (
    <div className="flex-1 flex flex-col border-r border-gray-800 bg-gray-900 h-full overflow-hidden">
      <div className="h-10 border-b border-gray-800 flex items-center justify-between px-4 shrink-0 bg-gray-900/90 z-10">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Plan & Approval Gate</span>
        
        <button
          onClick={() => openRoundtableModal(`Approve PlanIR for: "${activeWorkRequest.intent}"`)}
          className="flex items-center space-x-1.5 text-xs text-purple-300 bg-purple-950/60 hover:bg-purple-900/80 border border-purple-800/80 px-2.5 py-1 rounded transition-colors"
          title="Trigger agent consensus vote for this plan"
        >
          <Users className="w-3.5 h-3.5 text-purple-400" />
          <span>Agent Roundtable</span>
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
         {/* Intent */}
         <div>
            <h3 className="text-[10px] uppercase tracking-widest text-gray-500 mb-2 font-bold">User Intent</h3>
            <div className="p-3 bg-gray-800/50 rounded-md border border-gray-700/50 text-gray-200 text-sm">
               {activeWorkRequest.intent}
            </div>
         </div>

         {/* PlanIR */}
         {planIR ? (
           <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
             <h3 className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Plan Artifact</h3>
             
             <div className="bg-[#161b22] border border-gray-700 rounded-md p-4 space-y-4">
                <div>
                   <span className="text-xs text-gray-400">Goal</span>
                   <p className="text-sm text-gray-200 font-medium">{planIR.goal}</p>
                </div>
                
                <div className="space-y-2">
                   <span className="text-xs text-gray-400">Execution Steps</span>
                   {planIR.steps.map(step => (
                      <div key={step.id} className="flex items-start space-x-3 bg-gray-900 p-2.5 rounded border border-gray-800">
                         <div className={cn(
                           "flex items-center justify-center w-5 h-5 rounded-full shrink-0 text-[10px] font-bold text-gray-900",
                           step.risk_level === 'low' ? 'bg-green-500' : step.risk_level === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                         )}>
                            {step.id.replace('s', '')}
                         </div>
                         <div>
                            <p className="text-sm text-gray-200 font-medium">{step.name}</p>
                            <p className="text-xs text-gray-500">{step.description}</p>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
           </motion.div>
         ) : (
           <div className="text-sm text-gray-500 italic flex items-center"><PlayCircle className="w-4 h-4 mr-2 animate-pulse" /> Awaiting Planner...</div>
         )}

         {/* CritiqueIR & Approval Gate */}
         {critiqueIR && (
           <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="border-t border-gray-800 pt-6 mt-6 space-y-4">
             <div className="flex items-center justify-between">
               <h3 className="text-[10px] uppercase tracking-widest text-gray-500 font-bold flex items-center">
                  <ShieldAlert className="w-3 h-3 mr-1.5" /> Critique & Approval
               </h3>

               {roundtableSession && (
                 <span className={cn(
                   "text-[10px] font-mono px-2 py-0.5 rounded border",
                   roundtableSession.status === 'passed' ? "bg-green-950 text-green-400 border-green-800" : "bg-amber-950 text-amber-400 border-amber-800"
                 )}>
                   Consensus: {roundtableSession.approvalRate}% ({roundtableSession.status.toUpperCase()})
                 </span>
               )}
             </div>

             <div className="bg-gray-800/30 border border-purple-900/30 rounded-md p-4">
                <div className="flex items-center justify-between mb-4">
                   <span className="text-sm text-gray-300">Risk Score: <span className="font-mono text-purple-400">{critiqueIR.risk_score}</span></span>
                   <span className="text-xs uppercase tracking-wider font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded">
                     {critiqueIR.recommendation}
                   </span>
                </div>
                {critiqueIR.issues.map((i, idx) => (
                   <div key={idx} className="flex max-w-full space-x-2 text-xs text-gray-400 items-start mb-2">
                      <AlertCircle className="w-3.5 h-3.5 mt-0.5 text-yellow-500 shrink-0" />
                      <span>{i.description}</span>
                   </div>
                ))}
             </div>
             
             {activeWorkRequest.status === 'APPROVAL' && (
                <div className="flex flex-col space-y-2 pt-2">
                   <div className="flex space-x-3">
                      <button 
                        onClick={() => BackendService.approvePlan(activeWorkRequest.id)}
                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium py-2 rounded transition-colors"
                      >
                        Approve Plan
                      </button>
                      <button className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium py-2 rounded transition-colors">
                        Revise
                      </button>
                   </div>

                   <button
                     onClick={() => openRoundtableModal(`Approve PlanIR for: "${activeWorkRequest.intent}"`)}
                     className="w-full bg-gradient-to-r from-purple-900/80 to-blue-900/80 hover:from-purple-800 hover:to-blue-800 text-purple-200 border border-purple-700/60 py-2 rounded text-xs font-semibold flex items-center justify-center space-x-2 transition-all shadow-sm"
                   >
                     <Users className="w-4 h-4 text-purple-400" />
                     <span>Convene Agent Roundtable Consensus Check</span>
                   </button>
                </div>
             )}
           </motion.div>
         )}
      </div>
    </div>
  );
}

