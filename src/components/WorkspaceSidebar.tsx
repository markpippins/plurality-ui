import React, { useState } from 'react';
import { useSimulation } from '../hooks/useSimulation';
import { FolderKanban, ChevronRight, ChevronDown, Shield, Moon, Sun, Sliders } from 'lucide-react';
import { cn } from '../lib/utils';

export function WorkspaceSidebar() {
  const { workspaces, activeWorkspace, BackendService, theme, setTheme } = useSimulation();
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <div className="w-12 h-full border-r border-gray-800 bg-gray-900/50 flex flex-col items-center justify-between py-3 select-none">
        <div className="flex flex-col items-center space-y-3 cursor-pointer" onClick={() => setCollapsed(false)}>
          <ChevronRight className="w-5 h-5 text-gray-400 mb-4" />
          <FolderKanban className="w-5 h-5 text-gray-500" />
        </div>

        <button
          onClick={() => {
            if (theme === 'steel') setTheme('dark');
            else if (theme === 'dark') setTheme('light');
            else setTheme('steel');
          }}
          className={cn(
            "p-1.5 rounded transition-all",
            theme === 'steel' && "bg-blue-600 text-white shadow-sm",
            theme === 'dark' && "bg-purple-600 text-white shadow-sm",
            theme === 'light' && "bg-amber-500 text-gray-950 shadow-sm font-bold"
          )}
          title={`Current Theme: ${theme.toUpperCase()} (Click to cycle)`}
        >
          {theme === 'steel' && <Shield className="w-3.5 h-3.5 text-blue-200" />}
          {theme === 'dark' && <Moon className="w-3.5 h-3.5 text-purple-200" />}
          {theme === 'light' && <Sun className="w-3.5 h-3.5 text-gray-950" />}
        </button>
      </div>
    );
  }

  return (
    <div className="w-64 h-full border-r border-gray-800 bg-gray-900/50 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800/50 hover:bg-gray-800/20 cursor-pointer" onClick={() => setCollapsed(true)}>
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Workspaces</span>
        <ChevronDown className="w-4 h-4 text-gray-500" />
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {workspaces.map(ws => (
          <div 
            key={ws.id}
            onClick={() => BackendService.setActiveWorkspace(ws)}
            className={cn(
              "px-3 py-2 rounded-md cursor-pointer flex items-center space-x-2 transition-colors",
              activeWorkspace?.id === ws.id 
              ? "bg-blue-500/10 text-blue-400" 
              : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-200"
            )}
          >
            <FolderKanban className="w-4 h-4" />
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm truncate">{ws.name}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Theme Selector Footer */}
      <div className="p-2.5 border-t border-gray-800/80 bg-gray-950/80 shrink-0 select-none">
        <div className="grid grid-cols-3 gap-1 bg-gray-900/90 p-1 rounded-lg border border-gray-800/90">
          <button
            onClick={() => setTheme('steel')}
            className={cn(
              "flex items-center justify-center space-x-1 py-1.5 px-1 rounded text-xs font-semibold transition-all",
              theme === 'steel'
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/60"
            )}
            title="Steel Theme"
          >
            <Shield className="w-3.5 h-3.5 text-blue-300" />
            <span className="text-[11px]">Steel</span>
          </button>

          <button
            onClick={() => setTheme('dark')}
            className={cn(
              "flex items-center justify-center space-x-1 py-1.5 px-1 rounded text-xs font-semibold transition-all",
              theme === 'dark'
                ? "bg-purple-600 text-white shadow-sm"
                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/60"
            )}
            title="Dark Theme"
          >
            <Moon className="w-3.5 h-3.5 text-purple-300" />
            <span className="text-[11px]">Dark</span>
          </button>

          <button
            onClick={() => setTheme('light')}
            className={cn(
              "flex items-center justify-center space-x-1 py-1.5 px-1 rounded text-xs font-semibold transition-all",
              theme === 'light'
                ? "bg-amber-500 text-gray-950 font-bold shadow-sm"
                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/60"
            )}
            title="Light Theme"
          >
            <Sun className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[11px]">Light</span>
          </button>
        </div>
      </div>
    </div>
  );
}
