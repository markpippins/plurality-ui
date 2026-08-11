import React, { useRef, useEffect } from 'react';
import { useSimulation } from '../hooks/useSimulation';
import { Activity, CheckCircle2, Clock, AlertCircle, TerminalSquare } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export function ExecutionView() {
  const { executionIR, validationIR } = useSimulation();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [executionIR, validationIR]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-blue-400 rotate-animation" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col border-r border-gray-800 bg-[#0d1117] h-full relative font-mono text-sm">
      {/* Header */}
      <div className="h-10 border-b border-gray-800 flex items-center px-4 shrink-0 bg-gray-900/90 z-10">
        <span className="text-xs font-bold text-gray-400 tracking-widest uppercase">Execution & Validation</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {!executionIR && (
          <div className="flex flex-col items-center justify-center h-full text-gray-600 space-y-3">
            <TerminalSquare className="w-8 h-8 opacity-20" />
            <p className="uppercase tracking-widest text-[10px]">Awaiting Execution...</p>
          </div>
        )}
        
        {executionIR && (
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
             <h3 className="text-[10px] uppercase tracking-widest text-gray-500 mb-3 font-bold">Execution Trace</h3>
             <div className="space-y-2">
                {executionIR.trace.map(t => (
                   <div key={t.id} className="flex items-center space-x-2 text-xs">
                     <span className="text-gray-500">{t.timestamp.toLocaleTimeString()}</span>
                     <span className={cn(
                       "uppercase tracking-wider text-[10px] px-1 rounded",
                       t.event_type === 'error' ? 'bg-red-900/50 text-red-400' :
                       t.event_type === 'retry' ? 'bg-yellow-900/50 text-yellow-400' :
                       'bg-blue-900/50 text-blue-400'
                     )}>
                       {t.event_type}
                     </span>
                     <span className="text-gray-300">{t.message}</span>
                   </div>
                ))}
             </div>
             
             <h3 className="text-[10px] uppercase tracking-widest text-gray-500 mt-6 mb-3 font-bold">Step Results</h3>
             <div className="space-y-2">
               {executionIR.steps.map(s => (
                  <div key={s.step_id} className="flex items-center space-x-3 bg-gray-900 border border-gray-800 p-2.5 rounded text-xs">
                     {getStatusIcon(s.status)}
                     <span className="text-gray-400 font-bold">{s.step_id}</span>
                     <span className="text-gray-300">{s.result}</span>
                  </div>
               ))}
             </div>
          </motion.div>
        )}

        {validationIR && (
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="border-t border-gray-800 pt-6 mt-6">
             <h3 className="text-[10px] uppercase tracking-widest text-gray-500 mb-3 font-bold">Validation Scores</h3>
             <div className="bg-gray-800/30 border border-green-900/30 rounded-md p-4">
                <div className="flex flex-col space-y-2 mb-4 text-xs font-sans">
                   <div className="flex justify-between items-center">
                     <span className="text-gray-400">Intent Alignment</span>
                     <span className="text-green-400 font-mono">{(validationIR.scores.intent_alignment * 100).toFixed(0)}%</span>
                   </div>
                   <div className="flex justify-between items-center">
                     <span className="text-gray-400">Compliance</span>
                     <span className="text-green-400 font-mono">{(validationIR.scores.compliance * 100).toFixed(0)}%</span>
                   </div>
                   <div className="flex justify-between items-center">
                     <span className="text-gray-400">Correctness</span>
                     <span className="text-green-400 font-mono">{(validationIR.scores.correctness * 100).toFixed(0)}%</span>
                   </div>
                </div>
                <div className="flex justify-end">
                   <span className="text-[10px] uppercase tracking-wider font-bold text-green-400 border border-green-400/20 bg-green-400/5 px-2 py-1 rounded">
                     {validationIR.recommendation}
                   </span>
                </div>
             </div>
          </motion.div>
        )}

        <div ref={bottomRef} className="h-4" />
      </div>

      <style>{`
        .rotate-animation {
          animation: spin 2s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
