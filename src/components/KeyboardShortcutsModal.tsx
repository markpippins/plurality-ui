import React, { useEffect } from 'react';
import { useSimulation } from '../hooks/useSimulation';
import { X, Keyboard, Command, Users, Sliders, Terminal, CheckCircle2, Zap, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ShortcutGroup {
  category: string;
  items: {
    keys: string[];
    description: string;
    actionLabel?: string;
  }[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    category: 'System & Overlays',
    items: [
      { keys: ['⌘K', 'Ctrl+K', '/'], description: 'Open Global Command Palette & Action Launcher', actionLabel: 'Command Palette' },
      { keys: ['Q'], description: 'Open Agent Sub-Task Execution Queue (Architect & Builder)', actionLabel: 'Task Queue' },
      { keys: ['A'], description: 'Open Global Performance Threshold Alerts Config (Latency > 200ms)', actionLabel: 'Performance Alerts' },
      { keys: ['TOUR'], description: 'Launch Interactive Onboarding Layout & Workflow Tutorial', actionLabel: 'Onboarding Tour' },
      { keys: ['?'], description: 'Toggle Keyboard Shortcuts Overlay', actionLabel: 'Help Panel' },
      { keys: ['H'], description: 'Open Global Agent Activity & Compute Density Heatmap (D3.js)', actionLabel: 'Activity Heatmap' },
      { keys: ['G'], description: 'Open D3.js Task & Agent Dependency Graph', actionLabel: 'Task Graph' },
      { keys: ['C'], description: 'Open Agent Persona & Parameter Matrix', actionLabel: 'Agent Config' },
      { keys: ['Esc'], description: 'Close active modal, drawer, or dialog', actionLabel: 'Dismiss UI' },
    ]
  },
  {
    category: 'Multi-Agent Governance',
    items: [
      { keys: ['R'], description: 'Convene Agent Roundtable Consensus Check', actionLabel: 'Roundtable Mode' },
    ]
  },
  {
    category: 'Execution Logs & Diagnostics',
    items: [
      { keys: ['L'], description: 'Toggle Agent Execution Log Drawer', actionLabel: 'Agent Logs' },
      { keys: ['1', '2', '3', '4'], description: 'Filter logs for Planner, Critic, Coder, or Validator', actionLabel: 'Agent Filter' },
    ]
  },
  {
    category: 'Work Request Task Pipeline',
    items: [
      { keys: ['I'], description: 'Open Work Request Detail Popup Window', actionLabel: 'Request Detail' },
      { keys: ['T'], description: 'Cycle focus across active Work Requests', actionLabel: 'Next Task' },
    ]
  }
];

export function KeyboardShortcutsModal() {
  const { 
    isShortcutsOpen, closeShortcutsModal, toggleShortcutsModal,
    openRoundtableModal, isRoundtableOpen, closeRoundtableModal,
    openAgentConfigModal, isAgentConfigOpen, closeAgentConfigModal,
    openDependencyGraphModal, isDependencyGraphOpen, closeDependencyGraphModal,
    openHeatmapModal, isHeatmapOpen, closeHeatmapModal, toggleHeatmapModal,
    openOnboardingModal,
    selectedAgent, selectAgentForLogs, activeAgents,
    workRequests, activeWorkRequest, BackendService
  } = useSimulation();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore key events when typing inside text inputs, textareas, or select elements
      const target = e.target as HTMLElement | null;
      const isInput = target && (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.tagName === 'SELECT' || 
        target.isContentEditable
      );

      // ESC key always closes active modals
      if (e.key === 'Escape') {
        if (isShortcutsOpen) closeShortcutsModal();
        if (isRoundtableOpen) closeRoundtableModal();
        if (isAgentConfigOpen) closeAgentConfigModal();
        if (isDependencyGraphOpen) closeDependencyGraphModal();
        if (isHeatmapOpen) closeHeatmapModal();
        if (selectedAgent) selectAgentForLogs(null);
        return;
      }

      if (isInput) return;

      // Question mark or Shift+/ -> Toggle Shortcuts Overlay
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        toggleShortcutsModal();
        return;
      }

      // 'h' or 'H' -> Open Global Agent Activity Heatmap
      if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        toggleHeatmapModal();
        return;
      }

      // 'q' or 'Q' -> Open Agent Task Queue
      if (e.key === 'q' || e.key === 'Q') {
        e.preventDefault();
        BackendService.openTaskQueueModal();
        return;
      }

      // 'i' or 'I' -> Open Work Request Detail Popup
      if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        BackendService.openWorkRequestDetailModal();
        return;
      }

      // 'g' or 'G' -> Open D3 Dependency Graph
      if (e.key === 'g' || e.key === 'G') {
        e.preventDefault();
        openDependencyGraphModal();
        return;
      }

      // 'r' or 'R' -> Trigger Roundtable
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        openRoundtableModal();
        return;
      }

      // 'c' or 'C' -> Open Agent Config Matrix
      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        openAgentConfigModal();
        return;
      }

      // 'a' or 'A' -> Open Performance Threshold Alerts
      if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        BackendService.openPerformanceAlertsModal();
        return;
      }

      // 'l' or 'L' -> Toggle Agent Log Drawer
      if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        if (selectedAgent) {
          selectAgentForLogs(null);
        } else {
          selectAgentForLogs('a1');
        }
        return;
      }

      // 't' or 'T' -> Cycle Work Request Tasks
      if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        if (workRequests.length > 0) {
          const currentIndex = activeWorkRequest ? workRequests.findIndex(w => w.id === activeWorkRequest.id) : -1;
          const nextIndex = (currentIndex + 1) % workRequests.length;
          BackendService.setActiveWorkRequest(workRequests[nextIndex]);
        }
        return;
      }

      // Numeric keys 1-4 for quick agent log filter
      if (['1', '2', '3', '4'].includes(e.key)) {
        e.preventDefault();
        const index = parseInt(e.key) - 1;
        if (activeAgents[index]) {
          selectAgentForLogs(activeAgents[index].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isShortcutsOpen, isRoundtableOpen, isAgentConfigOpen, selectedAgent,
    workRequests, activeWorkRequest, activeAgents,
    closeShortcutsModal, toggleShortcutsModal, openRoundtableModal, closeRoundtableModal,
    openAgentConfigModal, closeAgentConfigModal, selectAgentForLogs, BackendService
  ]);

  if (!isShortcutsOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-md">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden text-gray-100 flex flex-col"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-800 bg-gray-900/90 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-400">
                <Keyboard className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-base font-bold text-gray-100 tracking-wide">
                    Keyboard Hotkey Command Reference
                  </h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800">
                    Plurality Operator Hotkeys
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  Press hotkeys anytime while operating Plurality to trigger actions instantly.
                </p>
              </div>
            </div>

            <button 
              onClick={closeShortcutsModal}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Shortcut Groups Grid */}
          <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
            {SHORTCUT_GROUPS.map((group) => (
              <div key={group.category} className="space-y-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-800 pb-1.5 flex items-center justify-between">
                  <span>{group.category}</span>
                  <span className="text-[10px] font-mono text-gray-600 font-normal">
                    {group.items.length} Shortcuts
                  </span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {group.items.map((item, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-950/60 border border-gray-800/80 hover:border-gray-700 transition-colors"
                    >
                      <div className="space-y-0.5">
                        <div className="text-xs font-medium text-gray-200">
                          {item.description}
                        </div>
                        {item.actionLabel && (
                          <span className="text-[10px] text-purple-400 font-mono">
                            {item.actionLabel}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-1 shrink-0 ml-3">
                        {item.keys.map((key, kIdx) => (
                          <kbd 
                            key={kIdx}
                            className="min-w-[24px] h-6 px-2 flex items-center justify-center bg-gray-800 border border-gray-700 text-gray-200 text-xs font-mono font-bold rounded shadow-inner"
                          >
                            {key}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer Info */}
          <div className="px-6 py-3.5 border-t border-gray-800 bg-gray-950/80 flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center space-x-2">
              <HelpCircle className="w-4 h-4 text-blue-400" />
              <span>Press <kbd className="px-1.5 py-0.5 bg-gray-800 text-gray-200 text-[10px] font-mono rounded">?</kbd> anytime to toggle this command overlay.</span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  closeShortcutsModal();
                  openOnboardingModal();
                }}
                className="px-3 py-1.5 bg-blue-950/80 hover:bg-blue-900 border border-blue-700/80 text-blue-200 font-semibold rounded-md transition-colors text-xs flex items-center space-x-1.5"
              >
                <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
                <span>Launch Interactive Tour</span>
              </button>

              <button
                onClick={closeShortcutsModal}
                className="px-4 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold rounded-md transition-colors text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
