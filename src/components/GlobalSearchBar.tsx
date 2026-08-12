import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSimulation } from '../hooks/useSimulation';
import { 
  Search, X, Cpu, Sliders, FileText, Target, 
  Activity, CheckCircle2, Clock, AlertCircle, ArrowRight, CornerDownLeft
} from 'lucide-react';
import { cn } from '../lib/utils';
import { ActiveAgent, WorkRequest, AgentLogEntry } from '../types';

interface SearchResultItem {
  id: string;
  category: 'agents' | 'work_requests' | 'execution_steps' | 'logs';
  title: string;
  subtitle: string;
  badge?: string;
  badgeColor?: string;
  avatarUrl?: string;
  agentId?: string;
  actionType: 'agent_logs' | 'agent_config' | 'work_request' | 'execution_step' | 'log_entry';
  onSelect: () => void;
}

export function GlobalSearchBar() {
  const { 
    activeAgents, 
    agentLogs, 
    workRequests, 
    activeWorkRequest,
    planIR, 
    executionIR, 
    selectAgentForLogs, 
    openAgentConfigModal, 
    addToast,
    BackendService 
  } = useSimulation();

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Focus shortcut listener (Cmd+K / Ctrl+K or '/')
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k';
      const isSlash = e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA';

      if (isCmdK || isSlash) {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute search results across all categories
  const searchResults = useMemo<SearchResultItem[]>(() => {
    const trimmed = query.trim().toLowerCase();
    const results: SearchResultItem[] = [];

    // 1. AGENTS (Logs & Configuration)
    activeAgents.forEach(agent => {
      const matchName = agent.name.toLowerCase().includes(trimmed);
      const matchRole = agent.role.toLowerCase().includes(trimmed);
      const matchFlavor = agent.flavor?.toLowerCase().includes(trimmed) || false;
      const matchId = agent.id.toLowerCase().includes(trimmed);

      if (!trimmed || matchName || matchRole || matchFlavor || matchId) {
        // Log view action
        results.push({
          id: `agent-logs-${agent.id}`,
          category: 'agents',
          title: `View Logs: ${agent.name}`,
          subtitle: `${agent.role} • Flavor: ${(agent.flavor || 'leased').toUpperCase()} • Status: ${agent.status.toUpperCase()}`,
          badge: 'LOGS',
          badgeColor: 'bg-blue-900/60 text-blue-300 border-blue-700/60',
          avatarUrl: agent.avatarUrl,
          agentId: agent.id,
          actionType: 'agent_logs',
          onSelect: () => {
            selectAgentForLogs(agent.id);
            addToast({
              title: `📜 Agent Logs: ${agent.name}`,
              message: `Opened execution logs drawer for ${agent.name} (${agent.role}).`,
              type: 'info',
              agentId: agent.id,
              agentName: agent.name
            });
          }
        });

        // Config action
        results.push({
          id: `agent-config-${agent.id}`,
          category: 'agents',
          title: `Configure: ${agent.name}`,
          subtitle: `Edit System Prompt, Temp (${agent.temperature ?? 0.7}), Role Flavor & Parameters`,
          badge: 'CONFIG',
          badgeColor: 'bg-purple-900/60 text-purple-300 border-purple-700/60',
          avatarUrl: agent.avatarUrl,
          agentId: agent.id,
          actionType: 'agent_config',
          onSelect: () => {
            openAgentConfigModal(agent.id);
            addToast({
              title: `⚙️ Configure ${agent.name}`,
              message: `Opened persona & prompt configuration modal for ${agent.name}.`,
              type: 'info',
              agentId: agent.id,
              agentName: agent.name
            });
          }
        });
      }
    });

    // 2. WORK REQUESTS & TASK PIPELINE
    workRequests.forEach(wr => {
      const matchId = wr.id.toLowerCase().includes(trimmed);
      const matchIntent = wr.intent.toLowerCase().includes(trimmed);
      const matchStatus = wr.status.toLowerCase().includes(trimmed);

      if (!trimmed || matchId || matchIntent || matchStatus) {
        results.push({
          id: `wr-${wr.id}`,
          category: 'work_requests',
          title: `Work Request ${wr.id}: ${wr.intent}`,
          subtitle: `Status: ${wr.status} • Created: ${new Date(wr.created_at).toLocaleTimeString()}`,
          badge: wr.status,
          badgeColor: wr.status === 'VALIDATE' ? 'bg-green-900/60 text-green-300 border-green-700/60' : 'bg-amber-900/60 text-amber-300 border-amber-700/60',
          actionType: 'work_request',
          onSelect: () => {
            BackendService.setActiveWorkRequest(wr);
            addToast({
              title: `📋 Work Request Selected`,
              message: `Switched active request context to ${wr.id}: "${wr.intent}"`,
              type: 'success'
            });
          }
        });
      }
    });

    // 3. EXECUTION STEPS & PLAN STEPS
    if (executionIR) {
      executionIR.steps.forEach(step => {
        const matchStepId = step.step_id.toLowerCase().includes(trimmed);
        const matchResult = step.result.toLowerCase().includes(trimmed);

        if (!trimmed || matchStepId || matchResult) {
          results.push({
            id: `exec-step-${step.step_id}`,
            category: 'execution_steps',
            title: `Execution Step #${step.step_id}`,
            subtitle: step.result,
            badge: step.status.toUpperCase(),
            badgeColor: step.status === 'success' ? 'bg-green-900/60 text-green-300 border-green-700/60' : 'bg-red-900/60 text-red-300 border-red-700/60',
            actionType: 'execution_step',
            onSelect: () => {
              addToast({
                title: `⚡ Execution Task #${step.step_id}`,
                message: `Task Result: ${step.result} (Status: ${step.status})`,
                type: step.status === 'success' ? 'success' : 'warn'
              });
            }
          });
        }
      });
    }

    if (planIR) {
      planIR.steps.forEach(step => {
        const matchId = step.id.toLowerCase().includes(trimmed);
        const matchName = step.name.toLowerCase().includes(trimmed);
        const matchDesc = step.description.toLowerCase().includes(trimmed);

        if (trimmed && (matchId || matchName || matchDesc)) {
          results.push({
            id: `plan-step-${step.id}`,
            category: 'execution_steps',
            title: `Plan Step #${step.id}: ${step.name}`,
            subtitle: `${step.description} • Risk: ${step.risk_level.toUpperCase()}`,
            badge: `RISK: ${step.risk_level.toUpperCase()}`,
            badgeColor: step.risk_level === 'high' ? 'bg-red-900/60 text-red-300 border-red-700/60' : 'bg-gray-800 text-gray-300 border-gray-700',
            actionType: 'execution_step',
            onSelect: () => {
              addToast({
                title: `📋 Plan Step #${step.id}`,
                message: `${step.name}: ${step.description}`,
                type: 'info'
              });
            }
          });
        }
      });
    }

    // 4. RECENT AGENT LOGS
    if (trimmed) {
      agentLogs.slice(0, 15).forEach(log => {
        const matchAction = log.action.toLowerCase().includes(trimmed);
        const matchDetails = log.details.toLowerCase().includes(trimmed);
        const matchAgentName = log.agentName.toLowerCase().includes(trimmed);
        const matchId = log.id.toLowerCase().includes(trimmed);

        if (matchAction || matchDetails || matchAgentName || matchId) {
          results.push({
            id: `log-${log.id}`,
            category: 'logs',
            title: `Log [${log.agentName}]: ${log.action}`,
            subtitle: `${log.details.slice(0, 85)}${log.details.length > 85 ? '...' : ''}`,
            badge: log.level.toUpperCase(),
            badgeColor: log.level === 'success' ? 'bg-green-900/60 text-green-300 border-green-700' :
                        log.level === 'error' ? 'bg-red-900/60 text-red-300 border-red-700' :
                        log.level === 'warn' ? 'bg-amber-900/60 text-amber-300 border-amber-700' :
                        'bg-blue-900/60 text-blue-300 border-blue-700',
            actionType: 'log_entry',
            onSelect: () => {
              selectAgentForLogs(log.agentId);
              addToast({
                title: `📜 Log Found: ${log.action}`,
                message: `[${log.agentName}] ${log.details}`,
                type: 'info',
                agentId: log.agentId,
                agentName: log.agentName
              });
            }
          });
        }
      });
    }

    return results;
  }, [query, activeAgents, workRequests, planIR, executionIR, agentLogs, selectAgentForLogs, openAgentConfigModal, addToast, BackendService]);

  // Reset keyboard selection on query change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation within dropdown
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || searchResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % searchResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + searchResults.length) % searchResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = searchResults[selectedIndex];
      if (selected) {
        selected.onSelect();
        setIsOpen(false);
      }
    }
  };

  const handleItemClick = (item: SearchResultItem) => {
    item.onSelect();
    setIsOpen(false);
  };

  // Group search results by category for categorized headers
  const groupedResults = useMemo(() => {
    const groups = {
      agents: searchResults.filter(r => r.category === 'agents'),
      work_requests: searchResults.filter(r => r.category === 'work_requests'),
      execution_steps: searchResults.filter(r => r.category === 'execution_steps'),
      logs: searchResults.filter(r => r.category === 'logs')
    };
    return groups;
  }, [searchResults]);

  return (
    <div ref={containerRef} className="relative flex-1 max-w-md mx-2 font-sans">
      {/* Search Input Bar */}
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search agents, logs, task IDs (e.g. 'Coder', 'wr-1', 'step-1')..."
          className="w-full bg-gray-950/80 hover:bg-gray-950 border border-gray-700/80 focus:border-blue-500/80 text-gray-200 text-xs rounded-lg pl-9 pr-16 py-1.5 outline-none transition-all placeholder:text-gray-500 shadow-inner"
        />

        <div className="absolute right-2 flex items-center space-x-1">
          {query ? (
            <button
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-1 text-gray-400 hover:text-gray-200 rounded-full hover:bg-gray-800 transition-colors"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-gray-400 bg-gray-800/80 border border-gray-700 rounded shadow-sm">
              ⌘K
            </kbd>
          )}
        </div>
      </div>

      {/* Dropdown Results Panel */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-[520px] max-w-[90vw] bg-gray-900/95 backdrop-blur-md border border-gray-700/80 rounded-xl shadow-2xl overflow-hidden z-50 flex flex-col max-h-[460px]">
          {/* Header Bar */}
          <div className="px-3.5 py-2 bg-gray-950/80 border-b border-gray-800 flex justify-between items-center text-[11px] text-gray-400">
            <span className="font-semibold text-gray-300">
              {query ? `Matching Results for "${query}"` : 'Quick Jump Actions'}
            </span>
            <span className="font-mono text-[10px] text-gray-500">
              {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'}
            </span>
          </div>

          {/* Results List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-3">
            {searchResults.length === 0 ? (
              <div className="py-8 text-center text-gray-500 flex flex-col items-center justify-center space-y-2">
                <Search className="w-8 h-8 opacity-30 text-gray-400" />
                <p className="text-xs">No matching agents, logs, or task IDs found for "{query}".</p>
                <p className="text-[10px] text-gray-600">Try searching for an agent name ('Coder'), task ID ('wr-1'), or step ('step-1').</p>
              </div>
            ) : (
              <>
                {/* 1. AGENTS CATEGORY */}
                {groupedResults.agents.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-400/90 flex items-center space-x-1.5">
                      <Cpu className="w-3 h-3" />
                      <span>Agents (Logs & Configuration)</span>
                    </div>
                    <div className="space-y-1 mt-1">
                      {groupedResults.agents.map(item => {
                        const globalIdx = searchResults.findIndex(r => r.id === item.id);
                        const isSelected = globalIdx === selectedIndex;
                        return (
                          <div
                            key={item.id}
                            onClick={() => handleItemClick(item)}
                            className={cn(
                              "px-3 py-2 rounded-lg cursor-pointer flex items-center justify-between border transition-all text-xs",
                              isSelected 
                                ? "bg-blue-600/20 border-blue-500/50 text-gray-100 shadow-sm" 
                                : "bg-gray-950/40 border-gray-800/80 hover:bg-gray-800/50 hover:border-gray-700 text-gray-300"
                            )}
                          >
                            <div className="flex items-center space-x-2.5 overflow-hidden">
                              {item.avatarUrl ? (
                                <img 
                                  src={item.avatarUrl} 
                                  alt={item.title} 
                                  referrerPolicy="no-referrer"
                                  className="w-7 h-7 rounded-full object-cover border border-blue-500/30 shrink-0"
                                />
                              ) : (
                                <div className="p-1.5 rounded-full bg-blue-950 border border-blue-800 text-blue-400 shrink-0">
                                  {item.actionType === 'agent_config' ? <Sliders className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                                </div>
                              )}
                              <div className="truncate">
                                <div className="font-semibold text-gray-200 flex items-center space-x-2">
                                  <span>{item.title}</span>
                                </div>
                                <div className="text-[11px] text-gray-400 truncate">{item.subtitle}</div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2 shrink-0 ml-2">
                              {item.badge && (
                                <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider border", item.badgeColor)}>
                                  {item.badge}
                                </span>
                              )}
                              <ArrowRight className="w-3.5 h-3.5 text-gray-500" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. WORK REQUESTS CATEGORY */}
                {groupedResults.work_requests.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-400/90 flex items-center space-x-1.5">
                      <Target className="w-3 h-3" />
                      <span>Work Requests & Execution Context</span>
                    </div>
                    <div className="space-y-1 mt-1">
                      {groupedResults.work_requests.map(item => {
                        const globalIdx = searchResults.findIndex(r => r.id === item.id);
                        const isSelected = globalIdx === selectedIndex;
                        return (
                          <div
                            key={item.id}
                            onClick={() => handleItemClick(item)}
                            className={cn(
                              "px-3 py-2 rounded-lg cursor-pointer flex items-center justify-between border transition-all text-xs",
                              isSelected 
                                ? "bg-amber-600/20 border-amber-500/50 text-gray-100 shadow-sm" 
                                : "bg-gray-950/40 border-gray-800/80 hover:bg-gray-800/50 hover:border-gray-700 text-gray-300"
                            )}
                          >
                            <div className="truncate mr-2">
                              <div className="font-semibold text-gray-200">{item.title}</div>
                              <div className="text-[11px] text-gray-400 truncate">{item.subtitle}</div>
                            </div>
                            <div className="flex items-center space-x-2 shrink-0">
                              {item.badge && (
                                <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider border", item.badgeColor)}>
                                  {item.badge}
                                </span>
                              )}
                              <ArrowRight className="w-3.5 h-3.5 text-gray-500" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. EXECUTION STEPS CATEGORY */}
                {groupedResults.execution_steps.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-green-400/90 flex items-center space-x-1.5">
                      <Activity className="w-3 h-3" />
                      <span>Execution Steps & Task IDs</span>
                    </div>
                    <div className="space-y-1 mt-1">
                      {groupedResults.execution_steps.map(item => {
                        const globalIdx = searchResults.findIndex(r => r.id === item.id);
                        const isSelected = globalIdx === selectedIndex;
                        return (
                          <div
                            key={item.id}
                            onClick={() => handleItemClick(item)}
                            className={cn(
                              "px-3 py-2 rounded-lg cursor-pointer flex items-center justify-between border transition-all text-xs",
                              isSelected 
                                ? "bg-green-600/20 border-green-500/50 text-gray-100 shadow-sm" 
                                : "bg-gray-950/40 border-gray-800/80 hover:bg-gray-800/50 hover:border-gray-700 text-gray-300"
                            )}
                          >
                            <div className="truncate mr-2">
                              <div className="font-mono font-bold text-gray-200">{item.title}</div>
                              <div className="text-[11px] text-gray-400 truncate">{item.subtitle}</div>
                            </div>
                            <div className="flex items-center space-x-2 shrink-0">
                              {item.badge && (
                                <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider border", item.badgeColor)}>
                                  {item.badge}
                                </span>
                              )}
                              <ArrowRight className="w-3.5 h-3.5 text-gray-500" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 4. RECENT LOGS CATEGORY */}
                {groupedResults.logs.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-400/90 flex items-center space-x-1.5">
                      <FileText className="w-3 h-3" />
                      <span>Matching Agent Log Entries</span>
                    </div>
                    <div className="space-y-1 mt-1">
                      {groupedResults.logs.map(item => {
                        const globalIdx = searchResults.findIndex(r => r.id === item.id);
                        const isSelected = globalIdx === selectedIndex;
                        return (
                          <div
                            key={item.id}
                            onClick={() => handleItemClick(item)}
                            className={cn(
                              "px-3 py-2 rounded-lg cursor-pointer flex items-center justify-between border transition-all text-xs",
                              isSelected 
                                ? "bg-purple-600/20 border-purple-500/50 text-gray-100 shadow-sm" 
                                : "bg-gray-950/40 border-gray-800/80 hover:bg-gray-800/50 hover:border-gray-700 text-gray-300"
                            )}
                          >
                            <div className="truncate mr-2">
                              <div className="font-semibold text-gray-200">{item.title}</div>
                              <div className="text-[11px] text-gray-400 truncate">{item.subtitle}</div>
                            </div>
                            <div className="flex items-center space-x-2 shrink-0">
                              {item.badge && (
                                <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider border", item.badgeColor)}>
                                  {item.badge}
                                </span>
                              )}
                              <ArrowRight className="w-3.5 h-3.5 text-gray-500" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Bar with Keyboard Hints */}
          <div className="px-3.5 py-2 bg-gray-950 border-t border-gray-800/80 flex items-center justify-between text-[10px] text-gray-500 font-mono">
            <div className="flex items-center space-x-3">
              <span className="flex items-center space-x-1">
                <kbd className="px-1 py-0.2 bg-gray-800 border border-gray-700 rounded text-gray-400">↑</kbd>
                <kbd className="px-1 py-0.2 bg-gray-800 border border-gray-700 rounded text-gray-400">↓</kbd>
                <span>Navigate</span>
              </span>
              <span className="flex items-center space-x-1">
                <kbd className="px-1 py-0.2 bg-gray-800 border border-gray-700 rounded text-gray-400">↵</kbd>
                <span>Select</span>
              </span>
              <span className="flex items-center space-x-1">
                <kbd className="px-1 py-0.2 bg-gray-800 border border-gray-700 rounded text-gray-400">ESC</kbd>
                <span>Close</span>
              </span>
            </div>
            <span className="text-gray-400 font-bold">Plurality Global Search</span>
          </div>
        </div>
      )}
    </div>
  );
}
