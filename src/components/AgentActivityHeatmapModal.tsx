import React, { useEffect, useState } from 'react';
import { useSimulation } from '../hooks/useSimulation';
import { AgentActivityHeatmap } from './AgentActivityHeatmap';
import { X, Flame, Maximize2, Minimize2, Activity, Cpu, Zap, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export function AgentActivityHeatmapModal() {
  const { isHeatmapOpen, closeHeatmapModal } = useSimulation();
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isHeatmapOpen) {
        closeHeatmapModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isHeatmapOpen, closeHeatmapModal]);

  if (!isHeatmapOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-gray-950/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "bg-gray-950 border border-gray-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden relative transition-all",
            isFullScreen ? "w-full h-full rounded-none" : "w-full max-w-7xl h-[92vh]"
          )}
        >
          {/* Modal Header Bar */}
          <div className="bg-gray-900 px-5 py-3 border-b border-gray-800 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 via-purple-600 to-cyan-500 flex items-center justify-center text-white shadow-md">
                <Flame className="w-5 h-5 fill-current text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-sm font-bold text-gray-100 uppercase tracking-wide">
                    Global Agent Activity & Compute Density Heatmap
                  </h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                    D3.js Dynamic Matrix
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  Interactive multi-agent compute load, token distribution, task density, and latency across simulation epochs
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono text-gray-500 bg-gray-950 border border-gray-800 px-2 py-1 rounded hidden sm:inline">
                Press ESC or H to close
              </span>

              <button
                onClick={() => setIsFullScreen(!isFullScreen)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-colors"
                title={isFullScreen ? "Exit Fullscreen" : "Toggle Fullscreen"}
              >
                {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              <button
                onClick={closeHeatmapModal}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-colors"
                title="Close Heatmap Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* D3 Heatmap Core Body */}
          <div className="flex-1 overflow-hidden bg-gray-950">
            <AgentActivityHeatmap className="w-full h-full" />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
