import React, { useRef, useEffect, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { BackendService } from '../services/SimulatedBackendService';
import { TerminalSquare, ChevronDown, ChevronUp, Trash2, Activity, Gauge, BarChart2, Maximize2, Minimize2, LayoutTemplate } from 'lucide-react';
import { cn } from '../lib/utils';
import { AgentMetricsWidget } from './AgentMetricsWidget';

export function TerminalPanel() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const termInstanceRef = useRef<Terminal | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [panelHeight, setPanelHeight] = useState<'normal' | 'expanded'>('normal');
  const [activeTab, setActiveTab] = useState<'terminal' | 'metrics'>('terminal');
  const fitAddonRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    let unmounted = false;
    const term = new Terminal({
      theme: {
        background: '#030712',
        foreground: '#F3F4F6',
        cursor: '#3B82F6',
        selectionBackground: '#374151',
      },
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: 13,
      cursorBlink: true,
    });
    
    termInstanceRef.current = term;
    const fitAddon = new FitAddon();
    fitAddonRef.current = fitAddon;
    term.loadAddon(fitAddon);

    let resizeObserver: ResizeObserver | null = null;
    let fallbackTimer: NodeJS.Timeout | null = null;

    term.writeln('\x1b[1;34mOpenCode Architecture Shell\x1b[0m v1.0.0');
    term.write('$ ');

    const sub = BackendService.terminalOutput$.subscribe(text => {
      if (!unmounted) {
        term.write(text);
      }
    });

    const tryFit = () => {
      if (unmounted || !terminalRef.current) return;
      try {
        if (terminalRef.current.clientWidth > 0 && terminalRef.current.clientHeight > 0) {
          fitAddon.fit();
        }
      } catch (e) {
        // Ignore fit errors if xterm core isn't completely ready
      }
    };

    // Open terminal safely after a short delay to allow DOM to settle
    fallbackTimer = setTimeout(() => {
      if (unmounted || !terminalRef.current) return;
      
      try {
        term.open(terminalRef.current);
        tryFit();
      } catch (err) {
        console.warn('Error opening terminal:', err);
      }

      resizeObserver = new ResizeObserver(() => {
        if (unmounted) return;
        requestAnimationFrame(() => {
          tryFit();
        });
      });
      resizeObserver.observe(terminalRef.current);
    }, 50);

    return () => {
      unmounted = true;
      if (fallbackTimer) clearTimeout(fallbackTimer);
      if (resizeObserver) resizeObserver.disconnect();
      sub.unsubscribe();
      try {
        term.dispose();
      } catch (e) {}
    };
  }, []);

  // Refit terminal when expanding or switching tabs
  useEffect(() => {
    if (!isCollapsed && activeTab === 'terminal' && fitAddonRef.current) {
      setTimeout(() => {
        try {
          fitAddonRef.current?.fit();
        } catch (e) {}
      }, 100);
    }
  }, [isCollapsed, activeTab, panelHeight]);

  const handleClearTerminal = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (termInstanceRef.current) {
      termInstanceRef.current.clear();
      termInstanceRef.current.write('$ ');
    }
  };

  const getHeightClass = () => {
    if (isCollapsed) return "h-9";
    return panelHeight === 'expanded' ? "h-96" : "h-64";
  };

  return (
    <div className={cn(
      "border-t border-gray-800 bg-gray-900 flex flex-col w-full transition-all duration-200 shrink-0 select-none",
      getHeightClass()
    )}>
      {/* Header Bar */}
      <div 
        onClick={() => {
          if (isCollapsed) setIsCollapsed(false);
        }}
        className="flex items-center justify-between px-3 py-1.5 border-b border-gray-800 bg-gray-900/95 cursor-pointer hover:bg-gray-850/60 transition-colors"
      >
        {/* Left: Tab Switchers & Title */}
        <div className="flex items-center space-x-2">
          {/* Terminal Tab Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (isCollapsed) setIsCollapsed(false);
              setActiveTab('terminal');
            }}
            className={cn(
              "px-2 py-1 rounded text-xs font-semibold tracking-wide uppercase transition-colors flex items-center gap-1.5",
              activeTab === 'terminal' && !isCollapsed
                ? "bg-gray-800 text-blue-400 border border-blue-500/30 shadow-xs"
                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/60"
            )}
          >
            <TerminalSquare className="w-3.5 h-3.5" />
            <span>Terminal</span>
            <span className="inline-flex items-center gap-1 text-[9px] font-mono px-1 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
              <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
              ONLINE
            </span>
          </button>

          {/* Agent Metrics Tab Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (isCollapsed) setIsCollapsed(false);
              setActiveTab('metrics');
            }}
            className={cn(
              "px-2 py-1 rounded text-xs font-semibold tracking-wide uppercase transition-colors flex items-center gap-1.5",
              activeTab === 'metrics' && !isCollapsed
                ? "bg-gray-800 text-amber-400 border border-amber-500/30 shadow-xs"
                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/60"
            )}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Agent Metrics</span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-amber-950/80 text-amber-300 border border-amber-800/60 font-mono">
              HUD
            </span>
          </button>
        </div>

        {/* Center: Live Mini Metrics Pill (clickable to open metrics) */}
        <div 
          onClick={(e) => {
            e.stopPropagation();
            if (isCollapsed) setIsCollapsed(false);
            setActiveTab('metrics');
          }}
          className="hidden md:flex items-center cursor-pointer hover:opacity-90 transition-opacity"
          title="Click to view Agent Performance Metrics breakdown"
        >
          <AgentMetricsWidget compact />
        </div>

        {/* Right: Controls (Full View, Clear, Expand Height, Collapse) */}
        <div className="flex items-center space-x-1.5">
          {!isCollapsed && activeTab === 'metrics' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                BackendService.setLayoutMode('metrics');
              }}
              className="px-2 py-0.5 rounded text-indigo-300 hover:text-white bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 transition-colors flex items-center gap-1 text-[11px] font-medium"
              title="Promote Agent Metrics to Dedicated Full-Workspace View Mode"
            >
              <LayoutTemplate className="w-3.5 h-3.5" />
              <span>Full View Mode</span>
            </button>
          )}

          {!isCollapsed && activeTab === 'terminal' && (
            <button
              onClick={handleClearTerminal}
              className="p-1 rounded text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-colors"
              title="Clear Terminal Output"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {!isCollapsed && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPanelHeight(panelHeight === 'normal' ? 'expanded' : 'normal');
              }}
              className="p-1 rounded text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-colors"
              title={panelHeight === 'expanded' ? "Reset height" : "Expand height"}
            >
              {panelHeight === 'expanded' ? (
                <Minimize2 className="w-3.5 h-3.5 text-blue-400" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsCollapsed(!isCollapsed);
            }}
            className="p-1 rounded text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-colors flex items-center space-x-1"
            title={isCollapsed ? "Expand Panel" : "Collapse Panel"}
          >
            <span className="text-[10px] font-mono uppercase font-medium mr-0.5 text-gray-400">
              {isCollapsed ? "Expand" : "Collapse"}
            </span>
            {isCollapsed ? (
              <ChevronUp className="w-4 h-4 text-blue-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>
      </div>

      {/* Main Content Body */}
      <div className={cn("flex-1 overflow-hidden relative", isCollapsed && "hidden")}>
        {/* Terminal Tab */}
        <div 
          className={cn(
            "w-full h-full p-2 bg-gray-950 overflow-hidden",
            activeTab !== 'terminal' && "hidden"
          )} 
          ref={terminalRef}
        />

        {/* Agent Metrics HUD Tab */}
        {activeTab === 'metrics' && (
          <div className="w-full h-full overflow-hidden">
            <AgentMetricsWidget onSwitchToTerminal={() => setActiveTab('terminal')} />
          </div>
        )}
      </div>
    </div>
  );
}


