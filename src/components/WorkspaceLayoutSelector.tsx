import React, { useState, useRef, useEffect } from 'react';
import { useSimulation } from '../hooks/useSimulation';
import { 
  LayoutTemplate, Check, ChevronDown, Sliders, Eye, EyeOff, 
  RotateCcw, Sparkles, Terminal, Layers, FileText, Code2, 
  Bug, Columns, Activity, ListTodo
} from 'lucide-react';
import { cn } from '../lib/utils';
import { WorkspaceLayoutMode, WorkspaceLayoutConfig } from '../types';

export function WorkspaceLayoutSelector() {
  const { layoutConfig, setLayoutMode, togglePanelVisibility, resetLayout } = useSimulation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      return () => document.removeEventListener('mousedown', handleOutsideClick);
    }
  }, [isOpen]);

  const modes: { id: WorkspaceLayoutMode; label: string; icon: React.ComponentType<{ className?: string }>; desc: string }[] = [
    { id: 'default', label: 'Default', icon: Columns, desc: 'Balanced multi-pane IDE' },
    { id: 'analysis', label: 'Analysis', icon: FileText, desc: 'Focus on PlanIR, Intent, and Specs' },
    { id: 'execution', label: 'Execution', icon: Code2, desc: 'Focus on Code synthesis and Validation' },
    { id: 'debugging', label: 'Debugging', icon: Bug, desc: 'Maximized Logs and Terminal inspection' },
    { id: 'queue', label: 'Task Queue', icon: ListTodo, desc: 'Architect & Builder sub-task execution queue' },
  ];

  const currentModeInfo = modes.find(m => m.id === layoutConfig.mode) || modes[0];
  const CurrentIcon = currentModeInfo.icon;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        id="workspace-layout-selector-btn"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border shadow-sm transition-all",
          isOpen
            ? "bg-gray-800 border-indigo-500/80 text-white"
            : "bg-gray-800/90 hover:bg-gray-700/90 border-gray-700 text-gray-300 hover:text-white"
        )}
        title="Workspace Layout Manager (Switch between Analysis, Execution, Debugging, and Task Queue modes)"
      >
        <LayoutTemplate className="w-3.5 h-3.5 text-indigo-400" />
        <span className="hidden md:inline font-semibold">{currentModeInfo.label} Mode</span>
        <ChevronDown className={cn("w-3 h-3 text-gray-400 transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-72 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 p-2.5 space-y-3 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-1 pb-1 border-b border-gray-800">
            <span className="text-[11px] font-bold text-gray-300 uppercase tracking-wider flex items-center space-x-1.5">
              <LayoutTemplate className="w-3.5 h-3.5 text-indigo-400" />
              <span>Workspace View Modes</span>
            </span>
            <button
              onClick={() => {
                resetLayout();
                setIsOpen(false);
              }}
              className="text-[10px] text-gray-400 hover:text-gray-200 flex items-center space-x-1 hover:bg-gray-800 px-1.5 py-0.5 rounded transition-colors"
              title="Reset layout to default"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Reset</span>
            </button>
          </div>

          {/* Mode Selector Cards */}
          <div className="space-y-1">
            {modes.map((mode) => {
              const Icon = mode.icon;
              const isSelected = layoutConfig.mode === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => {
                    setLayoutMode(mode.id);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between p-2 rounded-lg text-left transition-all text-xs group",
                    isSelected
                      ? "bg-indigo-950/80 border border-indigo-500/70 text-white font-medium"
                      : "hover:bg-gray-800/80 text-gray-300 border border-transparent"
                  )}
                >
                  <div className="flex items-center space-x-2.5">
                    <div className={cn(
                      "w-6 h-6 rounded-md flex items-center justify-center",
                      isSelected ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-400 group-hover:text-gray-200"
                    )}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-semibold">{mode.label} Mode</div>
                      <div className="text-[10px] text-gray-400 leading-tight">{mode.desc}</div>
                    </div>
                  </div>

                  {isSelected && <Check className="w-4 h-4 text-indigo-400 shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Granular Panel Visibility Toggles */}
          <div className="pt-2 border-t border-gray-800 space-y-1.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">
              Panel Visibility
            </span>

            <div className="grid grid-cols-2 gap-1 text-[11px]">
              <button
                onClick={() => togglePanelVisibility('showWorkRequests')}
                className={cn(
                  "flex items-center justify-between px-2 py-1 rounded border transition-colors",
                  layoutConfig.showWorkRequests
                    ? "bg-gray-800 border-gray-700 text-gray-200"
                    : "bg-gray-950 border-gray-850 text-gray-500"
                )}
              >
                <span>Work Requests</span>
                {layoutConfig.showWorkRequests ? <Eye className="w-3 h-3 text-emerald-400" /> : <EyeOff className="w-3 h-3 text-gray-600" />}
              </button>

              <button
                onClick={() => togglePanelVisibility('showTimeline')}
                className={cn(
                  "flex items-center justify-between px-2 py-1 rounded border transition-colors",
                  layoutConfig.showTimeline
                    ? "bg-gray-800 border-gray-700 text-gray-200"
                    : "bg-gray-950 border-gray-850 text-gray-500"
                )}
              >
                <span>Timeline</span>
                {layoutConfig.showTimeline ? <Eye className="w-3 h-3 text-emerald-400" /> : <EyeOff className="w-3 h-3 text-gray-600" />}
              </button>

              <button
                onClick={() => togglePanelVisibility('showTerminal')}
                className={cn(
                  "flex items-center justify-between px-2 py-1 rounded border transition-colors",
                  layoutConfig.showTerminal
                    ? "bg-gray-800 border-gray-700 text-gray-200"
                    : "bg-gray-950 border-gray-850 text-gray-500"
                )}
              >
                <span>Terminal</span>
                {layoutConfig.showTerminal ? <Eye className="w-3 h-3 text-emerald-400" /> : <EyeOff className="w-3 h-3 text-gray-600" />}
              </button>

              <button
                onClick={() => togglePanelVisibility('showFileTree')}
                className={cn(
                  "flex items-center justify-between px-2 py-1 rounded border transition-colors",
                  layoutConfig.showFileTree
                    ? "bg-gray-800 border-gray-700 text-gray-200"
                    : "bg-gray-950 border-gray-850 text-gray-500"
                )}
              >
                <span>File Explorer</span>
                {layoutConfig.showFileTree ? <Eye className="w-3 h-3 text-emerald-400" /> : <EyeOff className="w-3 h-3 text-gray-600" />}
              </button>

              <button
                onClick={() => togglePanelVisibility('showTaskQueue')}
                className={cn(
                  "flex items-center justify-between px-2 py-1 rounded border transition-colors col-span-2",
                  layoutConfig.showTaskQueue
                    ? "bg-indigo-950/80 border-indigo-700 text-indigo-200 font-semibold"
                    : "bg-gray-950 border-gray-850 text-gray-500"
                )}
              >
                <div className="flex items-center space-x-1.5">
                  <ListTodo className="w-3 h-3 text-indigo-400" />
                  <span>Agent Task Queue</span>
                </div>
                {layoutConfig.showTaskQueue ? <Eye className="w-3 h-3 text-indigo-400" /> : <EyeOff className="w-3 h-3 text-gray-600" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
