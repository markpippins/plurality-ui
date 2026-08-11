import React, { useState } from 'react';
import { useSimulation } from '../hooks/useSimulation';
import { File, Folder, ChevronRight, ChevronDown, AlignLeft, Users, Terminal, Sliders } from 'lucide-react';
import { FileNode } from '../types';
import { cn } from '../lib/utils';

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
  const { fileTree, activeAgents, selectedAgent, selectAgentForLogs, openAgentConfigModal } = useSimulation();

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
      <div className="flex flex-col h-1/3 border-t border-gray-800 bg-gray-900 overflow-hidden shrink-0">
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
                          {agent.name[0]}
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
                        agent.status === 'working' ? "bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]" :
                        "bg-yellow-500"
                      )} />
                      <span className="text-[9px] text-gray-500 uppercase font-mono">{agent.status}</span>
                   </div>
                </div>
              );
            })}
         </div>
      </div>
    </div>
  );
}

