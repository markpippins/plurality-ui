import React from 'react';
import { useSimulation } from '../hooks/useSimulation';
import { X, ListTodo, Layers, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AgentTaskQueuePanel } from './AgentTaskQueuePanel';

export function AgentTaskQueueModal() {
  const { isTaskQueueOpen, closeTaskQueueModal, setLayoutMode } = useSimulation();

  if (!isTaskQueueOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <motion.div 
        initial={{ opacity: 0, scale: 0.97, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 15 }}
        className="bg-gray-950 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-6xl h-[88vh] flex flex-col overflow-hidden text-gray-200"
      >
        {/* Modal Top Header */}
        <div className="px-4 py-2.5 bg-gray-900 border-b border-gray-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <ListTodo className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold text-gray-200 uppercase tracking-wider">
              Agent Task Queue Modal View
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setLayoutMode('queue');
                closeTaskQueueModal();
              }}
              className="text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-950/60 px-2.5 py-1 rounded-md border border-blue-800/60 flex items-center space-x-1 transition-colors"
              title="Pin Agent Task Queue directly to main workspace layout"
            >
              <Maximize2 className="w-3 h-3" />
              <span>Dock to Layout</span>
            </button>

            <button
              onClick={closeTaskQueueModal}
              className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              title="Close Task Queue window"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body Container */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <AgentTaskQueuePanel />
        </div>
      </motion.div>
    </div>
  );
}
