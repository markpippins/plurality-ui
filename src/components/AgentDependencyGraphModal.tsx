import React, { useEffect } from 'react';
import { useSimulation } from '../hooks/useSimulation';
import { AgentDependencyGraph } from './AgentDependencyGraph';
import { X, Network, Maximize2, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function AgentDependencyGraphModal() {
  const { isDependencyGraphOpen, closeDependencyGraphModal } = useSimulation();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDependencyGraphOpen) {
        closeDependencyGraphModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDependencyGraphOpen, closeDependencyGraphModal]);

  if (!isDependencyGraphOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-gray-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-7xl h-[90vh] bg-gray-950 border border-gray-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden relative"
        >
          {/* Header Bar */}
          <div className="bg-gray-900 px-6 py-3 border-b border-gray-800 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white shadow-md">
                <Network className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-100 uppercase tracking-wide">
                  Plurality Agent Task Flow & Dependency Graph
                </h2>
                <p className="text-xs text-gray-400">
                  D3.js Directed Graph • Highlighting Active Task Streams & Waiting Bottlenecks
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-[10px] font-mono text-gray-500 bg-gray-950 border border-gray-800 px-2 py-1 rounded hidden sm:inline">
                Press ESC to close
              </span>
              <button
                onClick={closeDependencyGraphModal}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Main D3 Graph Body */}
          <div className="flex-1 overflow-hidden p-4 bg-gray-950">
            <AgentDependencyGraph className="w-full h-full" />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
