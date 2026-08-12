import React, { useRef, useEffect, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { BackendService } from '../services/SimulatedBackendService';
import { TerminalSquare, ChevronDown, ChevronUp, Trash2, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '../lib/utils';

export function TerminalPanel() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const fitAddonRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    let unmounted = false;
    const term = new Terminal({
      theme: {
        background: '#111827',
        foreground: '#F3F4F6',
        cursor: '#3B82F6',
        selectionBackground: '#374151',
      },
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: 13,
      cursorBlink: true,
    });
    
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

  // Refit terminal when expanding
  useEffect(() => {
    if (!isCollapsed && fitAddonRef.current) {
      setTimeout(() => {
        try {
          fitAddonRef.current?.fit();
        } catch (e) {}
      }, 100);
    }
  }, [isCollapsed]);

  return (
    <div className={cn(
      "border-t border-gray-800 bg-gray-900 flex flex-col w-full transition-all duration-200 shrink-0",
      isCollapsed ? "h-9" : "h-64"
    )}>
      <div 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center justify-between px-4 py-1.5 border-b border-gray-800 bg-gray-900/90 cursor-pointer select-none hover:bg-gray-800/60 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <TerminalSquare className="w-4 h-4 text-blue-400" />
          <span className="text-xs text-gray-300 font-bold tracking-wide uppercase">Terminal (Simulated)</span>
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            ONLINE
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsCollapsed(!isCollapsed);
            }}
            className="p-1 rounded text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-colors flex items-center space-x-1"
            title={isCollapsed ? "Expand Terminal" : "Collapse Terminal"}
          >
            <span className="text-[10px] font-mono uppercase font-medium mr-1 text-gray-400">
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

      <div 
        className={cn(
          "flex-1 p-2 overflow-hidden bg-gray-950",
          isCollapsed && "hidden"
        )} 
        ref={terminalRef}
      />
    </div>
  );
}

