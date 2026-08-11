import React, { useState } from 'react';
import { useSimulation } from '../hooks/useSimulation';
import { 
  X, Trash2, Search, Terminal, Cpu, CheckCircle2, 
  AlertTriangle, Info, AlertCircle, RefreshCw, ChevronDown, ChevronUp, Clock
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { AgentLogEntry } from '../types';

export function AgentLogDrawer() {
  const { 
    selectedAgent, 
    activeAgents, 
    agentLogs, 
    selectAgentForLogs, 
    clearLogsForAgent 
  } = useSimulation();

  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<'all' | 'info' | 'success' | 'warn' | 'error'>('all');
  const [expandedLogIds, setExpandedLogIds] = useState<Record<string, boolean>>({});

  if (!selectedAgent) return null;

  // Filter logs for this agent
  const agentSpecificLogs = agentLogs.filter(log => log.agentId === selectedAgent.id);
  
  const filteredLogs = agentSpecificLogs.filter(log => {
    const matchesFilter = levelFilter === 'all' || log.level === levelFilter;
    const matchesSearch = 
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const toggleLogExpand = (id: string) => {
    setExpandedLogIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getLevelBadge = (level: AgentLogEntry['level']) => {
    switch (level) {
      case 'success':
        return <span className="bg-green-950/80 text-green-400 border border-green-800/60 px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-semibold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> SUCCESS</span>;
      case 'warn':
        return <span className="bg-yellow-950/80 text-yellow-400 border border-yellow-800/60 px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-semibold flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> WARN</span>;
      case 'error':
        return <span className="bg-red-950/80 text-red-400 border border-red-800/60 px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-semibold flex items-center gap-1"><AlertCircle className="w-3 h-3" /> ERROR</span>;
      case 'info':
      default:
        return <span className="bg-blue-950/80 text-blue-400 border border-blue-800/60 px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-semibold flex items-center gap-1"><Info className="w-3 h-3" /> INFO</span>;
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed top-14 right-0 bottom-0 w-[420px] max-w-[90vw] bg-gray-950/95 backdrop-blur-md border-l border-gray-800 shadow-2xl flex flex-col z-50 font-sans"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-800 bg-gray-900/80 flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {selectedAgent.avatarUrl ? (
                <img 
                  src={selectedAgent.avatarUrl} 
                  alt={`${selectedAgent.name} Avatar`} 
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-full object-cover border-2 border-blue-500/50 shadow-md shrink-0"
                />
              ) : (
                <div className="p-2 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400">
                  <Cpu className="w-5 h-5" />
                </div>
              )}
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-base font-bold text-gray-100">{selectedAgent.name}</h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-gray-800 text-gray-300 rounded border border-gray-700">
                    {selectedAgent.role}
                  </span>
                </div>
                <div className="flex items-center space-x-2 mt-0.5 text-xs text-gray-400">
                  <span className="flex items-center space-x-1">
                    <span className={cn(
                      "w-2 h-2 rounded-full",
                      selectedAgent.status === 'idle' ? "bg-gray-500" :
                      selectedAgent.status === 'working' ? "bg-blue-500 animate-pulse" :
                      "bg-yellow-500"
                    )} />
                    <span className="uppercase text-[10px] font-mono">{selectedAgent.status}</span>
                  </span>
                  {selectedAgent.model && (
                    <>
                      <span>•</span>
                      <span className="text-[11px] font-mono text-gray-500">{selectedAgent.model}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <button 
              onClick={() => selectAgentForLogs(null)}
              className="p-1.5 hover:bg-gray-800 rounded-md text-gray-400 hover:text-gray-200 transition-colors"
              title="Close Drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Agent Switcher */}
          <div className="flex space-x-1 bg-gray-950 p-1 rounded-md border border-gray-800">
            {activeAgents.map(ag => (
              <button
                key={ag.id}
                onClick={() => selectAgentForLogs(ag.id)}
                className={cn(
                  "flex-1 py-1 px-1.5 rounded text-xs font-medium transition-all flex items-center justify-center space-x-1.5 truncate",
                  selectedAgent.id === ag.id 
                    ? "bg-blue-600/30 text-blue-300 border border-blue-500/40 shadow-sm" 
                    : "text-gray-400 hover:text-gray-200 hover:bg-gray-900"
                )}
              >
                {ag.avatarUrl && (
                  <img 
                    src={ag.avatarUrl} 
                    alt={ag.name} 
                    referrerPolicy="no-referrer"
                    className="w-4 h-4 rounded-full object-cover shrink-0" 
                  />
                )}
                <span className="truncate">{ag.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Toolbar & Filter */}
        <div className="p-3 border-b border-gray-800/80 bg-gray-900/40 flex flex-col space-y-2 text-xs">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2.5" />
              <input 
                type="text" 
                placeholder="Filter logs by action or text..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded pl-8 pr-3 py-1.5 text-gray-200 text-xs focus:outline-none focus:border-blue-500/50"
              />
            </div>

            <button
              onClick={() => clearLogsForAgent(selectedAgent.id)}
              className="p-1.5 border border-gray-800 bg-gray-900 hover:bg-red-950/40 hover:border-red-800/50 text-gray-400 hover:text-red-400 rounded transition-colors"
              title="Clear Agent Execution Logs"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Level Filter Chips */}
          <div className="flex items-center space-x-1 text-[11px]">
            <span className="text-gray-500 mr-1">Filter:</span>
            {(['all', 'info', 'success', 'warn', 'error'] as const).map(lvl => (
              <button
                key={lvl}
                onClick={() => setLevelFilter(lvl)}
                className={cn(
                  "px-2 py-0.5 rounded capitalize font-mono text-[10px] transition-colors",
                  levelFilter === lvl
                    ? "bg-gray-700 text-gray-100 font-bold"
                    : "text-gray-500 hover:text-gray-300 hover:bg-gray-900"
                )}
              >
                {lvl}
              </button>
            ))}
            <span className="ml-auto text-gray-500 font-mono text-[10px]">
              {filteredLogs.length} {filteredLogs.length === 1 ? 'entry' : 'entries'}
            </span>
          </div>
        </div>

        {/* Execution Logs List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 font-mono text-xs">
          {filteredLogs.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-gray-600 text-center p-4">
              <Terminal className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-xs text-gray-500">No execution logs found for {selectedAgent.name}.</p>
              {searchQuery && <p className="text-[10px] text-gray-600 mt-1">Try clearing search filters.</p>}
            </div>
          ) : (
            filteredLogs.map(log => {
              const isExpanded = !!expandedLogIds[log.id];
              const logTime = new Date(log.timestamp).toLocaleTimeString();

              return (
                <div 
                  key={log.id}
                  className="bg-gray-900/80 border border-gray-800/80 rounded-md p-2.5 hover:border-gray-700 transition-colors space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getLevelBadge(log.level)}
                      <span className="font-bold text-gray-200">{log.action}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-[10px] text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{logTime}</span>
                    </div>
                  </div>

                  <p className="text-gray-300 text-[11px] leading-relaxed font-sans pl-0.5">
                    {log.details}
                  </p>

                  {log.metadata && (
                    <div className="pt-1">
                      <button
                        onClick={() => toggleLogExpand(log.id)}
                        className="flex items-center space-x-1 text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        <span>{isExpanded ? 'Hide Payload' : 'View Payload Details'}</span>
                      </button>

                      {isExpanded && (
                        <motion.pre 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-1.5 p-2 bg-black/60 rounded border border-gray-800 text-[10px] text-green-400 overflow-x-auto"
                        >
                          {JSON.stringify(log.metadata, null, 2)}
                        </motion.pre>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Status Bar */}
        <div className="px-4 py-2 bg-gray-900 border-t border-gray-800 text-[11px] text-gray-500 flex justify-between items-center shrink-0">
          <span className="font-mono">LOSM Agent Log Stream</span>
          <span className="flex items-center text-green-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse" />
            Live Monitored
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
