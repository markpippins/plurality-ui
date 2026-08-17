import React, { useState, useMemo } from 'react';
import { useSimulation } from '../hooks/useSimulation';
import { 
  File, Folder, ChevronRight, ChevronDown, AlignLeft, Users, Terminal, 
  Sliders, Zap, Shield, Sparkles, Activity
} from 'lucide-react';
import { FileNode, ActiveAgent } from '../types';
import { cn } from '../lib/utils';
import avatarPlannerAlt from '../assets/images/avatar_planner_alt_1786462226175.jpg';
import avatarCoder from '../assets/images/avatar_coder_1786461737022.jpg';

function TreeNode({ node, depth = 0 }: { node: FileNode; depth?: number; key?: React.Key }) {
  const [isOpen, setIsOpen] = useState(node.isOpen !== false);
  const isFolder = node.type === 'folder';

  return (
    <div className="select-none">
      <div 
        className="flex items-center space-x-1.5 py-1 px-2 hover:bg-gray-800/50 cursor-pointer rounded-sm text-sm"
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={() => isFolder && setIsOpen(!isOpen)}
      >
        {isFolder ? (
          isOpen ? <ChevronDown className="w-3.5 h-3.5 text-gray-500 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-500 shrink-0" />
        ) : (
          <span className="w-3.5 h-3.5 shrink-0" /> // spacer
        )}
        
        {isFolder ? (
          <Folder className="w-4 h-4 text-blue-400 shrink-0" />
        ) : (
          <File className="w-4 h-4 text-gray-400 shrink-0" />
        )}
        
        <span className={cn(
          "truncate",
          isFolder ? "text-gray-300" : "text-gray-400 hover:text-gray-200"
        )}>
          {node.name}
        </span>
      </div>

      {isFolder && isOpen && node.children && (
        <div>
          {node.children.map(child => (
            <TreeNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileTreeSidebar() {
  const { 
    fileTree, 
    activeAgents, 
    selectedAgent, 
    selectAgentForLogs, 
    openAgentConfigModal,
    isDualityMode,
    dualityState
  } = useSimulation();

  // Primary & Secondary Duality Agents representation
  const dualityAgents: ActiveAgent[] = useMemo(() => {
    const primaryAgentId = dualityState.primaryAgentId || 'a5';
    const secondaryAgentId = dualityState.secondaryAgentId || 'a3';

    const primaryBase = activeAgents.find(a => a.id === primaryAgentId) || activeAgents.find(a => a.id === 'a5');
    const secondaryBase = activeAgents.find(a => a.id === secondaryAgentId) || activeAgents.find(a => a.id === 'a3');

    const primary: ActiveAgent = {
      id: primaryAgentId,
      name: 'Architect',
      role: dualityState.primaryRole || 'System Architect',
      status: dualityState.isExecuting ? 'working' : 'idle',
      flavor: 'harness',
      model: dualityState.primaryModel || 'claude-3-7-sonnet',
      avatarUrl: primaryBase?.avatarUrl || avatarPlannerAlt,
      lastActive: new Date()
    };

    const secondary: ActiveAgent = {
      id: secondaryAgentId,
      name: 'Builder',
      role: dualityState.secondaryRole || 'Implementation Builder',
      status: dualityState.isExecuting ? 'working' : 'idle',
      flavor: 'leased',
      model: dualityState.secondaryModel || 'qwen2.5-coder',
      avatarUrl: secondaryBase?.avatarUrl || avatarCoder,
      lastActive: new Date()
    };

    return [primary, secondary];
  }, [dualityState, activeAgents]);

  return (
    <div className="w-64 h-full border-l border-gray-800 bg-gray-900/50 flex flex-col">
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="flex items-center px-4 py-3 border-b border-gray-800/50">
          <AlignLeft className="w-4 h-4 text-gray-500 mr-2" />
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Explorer</span>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {fileTree.map(node => (
            <TreeNode key={node.id} node={node} />
          ))}
        </div>
      </div>
      
      {/* Active Participants display */}
      <div className="flex flex-col h-2/5 border-t border-gray-800 bg-gray-900 overflow-hidden shrink-0">
        {isDualityMode ? (
          <>
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800/50 bg-gray-900/90 z-10">
              <div className="flex items-center space-x-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-bold text-gray-200 font-mono">Duality Pair</span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-950/80 text-amber-300 border border-amber-800/80 font-bold">
                  1:1
                </span>
              </div>
              <span className="text-[10px] font-mono text-gray-400">
                2 Live Agents
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {dualityAgents.map((agent, idx) => {
                const isSelected = selectedAgent?.id === agent.id;
                const isPrimary = idx === 0;
                const isExecuting = dualityState.isExecuting;

                return (
                  <div
                    key={agent.id}
                    onClick={() => selectAgentForLogs(isSelected ? null : agent.id)}
                    className={cn(
                      "group flex flex-col p-2.5 rounded-lg cursor-pointer transition-all border relative overflow-hidden",
                      isSelected
                        ? isPrimary
                          ? "bg-amber-950/40 border-amber-500/80 shadow-[0_0_12px_rgba(245,158,11,0.2)] text-gray-100 ring-1 ring-amber-500/50"
                          : "bg-blue-950/40 border-blue-500/80 shadow-[0_0_12px_rgba(59,130,246,0.2)] text-gray-100 ring-1 ring-blue-500/50"
                        : "bg-gray-950/70 border-gray-800 hover:border-gray-700 hover:bg-gray-850 text-gray-300"
                    )}
                    title={`Click to view ${agent.name} (${agent.role}) execution logs & traces`}
                  >
                    <div className="flex items-center justify-between min-w-0">
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div className="relative shrink-0">
                          {isExecuting && (
                            <span className="absolute -inset-0.5 rounded-full bg-emerald-400 animate-ping opacity-75" />
                          )}
                          <img
                            src={agent.avatarUrl}
                            alt={agent.name}
                            referrerPolicy="no-referrer"
                            className={cn(
                              "w-7 h-7 rounded-full object-cover border shrink-0 shadow-sm relative z-10",
                              isPrimary ? "border-amber-400/80" : "border-blue-400/80"
                            )}
                          />
                        </div>

                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center space-x-1.5 truncate">
                            <span className="text-xs font-bold text-gray-100 truncate">{agent.name}</span>
                            <span className={cn(
                              "text-[8.5px] font-mono px-1 py-0.2 rounded font-bold uppercase border",
                              isPrimary 
                                ? "bg-amber-950/80 text-amber-300 border-amber-800/80" 
                                : "bg-blue-950/80 text-blue-300 border-blue-800/80"
                            )}>
                              {isPrimary ? 'Primary' : 'Secondary'}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-400 truncate">{agent.role}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5 shrink-0 pl-1">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          isExecuting 
                            ? "bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)]" 
                            : "bg-gray-500"
                        )} />
                        <Terminal className={cn(
                          "w-3.5 h-3.5 transition-colors",
                          isSelected ? (isPrimary ? "text-amber-400" : "text-blue-400") : "text-gray-500 group-hover:text-gray-300"
                        )} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-gray-800/50 text-[10px] font-mono">
                      <span className="text-gray-400 truncate max-w-[110px]" title={agent.model}>
                        {agent.model}
                      </span>

                      <div className="flex items-center space-x-1">
                        <span className={cn(
                          "px-1.5 py-0.2 rounded uppercase text-[8.5px] font-semibold border",
                          agent.flavor === 'harness'
                            ? "bg-amber-950/60 text-amber-400 border-amber-800/60"
                            : "bg-blue-950/60 text-blue-400 border-blue-800/60"
                        )}>
                          {agent.flavor}
                        </span>
                        <span className="text-[8.5px] text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800/60 px-1 py-0.2 rounded">
                          {isPrimary ? '450ms' : '1.2s'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800/50 bg-gray-900/90 z-10">
              <div className="flex items-center">
                <Users className="w-4 h-4 text-gray-500 mr-2" />
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Agents</span>
              </div>
              <button
                onClick={() => openAgentConfigModal()}
                className="text-[10px] text-purple-300 hover:text-purple-200 font-mono flex items-center space-x-1 bg-purple-950/70 hover:bg-purple-900/80 px-2 py-0.5 rounded border border-purple-800 transition-colors"
                title="Open Agent Configuration Panel"
              >
                <Sliders className="w-3 h-3 text-purple-400" />
                <span>Config</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {activeAgents.map(agent => {
                const isSelected = selectedAgent?.id === agent.id;
                return (
                  <div 
                    key={agent.id} 
                    onClick={() => selectAgentForLogs(isSelected ? null : agent.id)}
                    className={cn(
                      "group flex items-center justify-between p-2 rounded-md cursor-pointer transition-all border",
                      isSelected 
                        ? "bg-blue-600/20 border-blue-500/40 text-gray-100 shadow-sm" 
                        : "border-transparent hover:bg-gray-800/70 hover:border-gray-800 text-gray-300"
                    )}
                    title={`Click to view ${agent.name} execution logs`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      {agent.avatarUrl ? (
                        <img 
                          src={agent.avatarUrl} 
                          alt={`${agent.name} Avatar`} 
                          referrerPolicy="no-referrer"
                          className="w-7 h-7 rounded-full object-cover border border-gray-700/80 shrink-0 shadow-sm"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center shrink-0 text-xs font-bold text-gray-400">
                          {(agent.name || 'A')[0]}
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center space-x-1.5 truncate">
                          <span className="text-xs font-medium truncate">{agent.name}</span>
                          <Terminal className={cn(
                            "w-3 h-3 shrink-0 transition-opacity",
                            isSelected ? "text-blue-400 opacity-100" : "text-gray-500 opacity-0 group-hover:opacity-100"
                          )} />
                        </div>
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest truncate">{agent.role}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end shrink-0 pl-1">
                      <div className={cn(
                        "w-2.5 h-2.5 rounded-full mb-1",
                        agent.status === 'idle' ? "bg-gray-600" :
                        agent.status === 'working' || agent.status === 'active' ? "bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]" :
                        "bg-yellow-500"
                      )} />
                      <span className="text-[9px] text-gray-500 uppercase font-mono">{agent.status || 'idle'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}


