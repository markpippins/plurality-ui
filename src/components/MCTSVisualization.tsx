import React from 'react';
import { Network, Award, ArrowRight, TrendingUp } from 'lucide-react';
import { cn } from '../lib/utils';

interface MctsNode {
  node_id: string;
  parent_node_id: string | null;
  visit_count: number;
  value: number;
  reward: number | null;
  action: string | null;
}

interface MCTSVizProps {
  tree?: { nodes: MctsNode[] };
  bestPath?: string[];
}

export function MCTSVisualization({ tree, bestPath }: MCTSVizProps) {
  if (!tree || tree.nodes.length === 0) {
    return (
      <div className="flex-1 flex flex-col border-r border-gray-800 bg-[#0d1117] h-full">
        <div className="h-10 border-b border-gray-800 flex items-center px-4 shrink-0 bg-gray-900/90 z-10">
          <Network className="w-4 h-4 text-gray-500 mr-2" />
          <span className="text-xs font-bold text-gray-400 tracking-widest uppercase">MCTS Tree</span>
        </div>
        <div className="flex-1 flex items-center justify-center text-gray-600">
          <div className="text-center">
            <Network className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-xs uppercase tracking-widest">No MCTS search running</p>
          </div>
        </div>
      </div>
    );
  }

  const maxVisits = Math.max(...tree.nodes.map((n) => n.visit_count), 1);
  const bestPathSet = new Set(bestPath || []);

  return (
    <div className="flex-1 flex flex-col border-r border-gray-800 bg-[#0d1117] h-full">
      <div className="h-10 border-b border-gray-800 flex items-center px-4 shrink-0 bg-gray-900/90 z-10">
        <Network className="w-4 h-4 text-gray-500 mr-2" />
        <span className="text-xs font-bold text-gray-400 tracking-widest uppercase">MCTS Tree</span>
        <span className="ml-auto text-[10px] text-gray-500">{tree.nodes.length} nodes</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* Best Path Summary */}
        {bestPath && bestPath.length > 0 && (
          <div className="mb-6 p-3 bg-blue-900/20 border border-blue-800/30 rounded-md">
            <div className="flex items-center mb-2">
              <Award className="w-4 h-4 text-blue-400 mr-2" />
              <span className="text-xs font-bold text-blue-300 uppercase">Best Path</span>
            </div>
            <div className="flex items-center flex-wrap gap-1">
              {bestPath.map((nodeId, idx) => (
                <React.Fragment key={nodeId}>
                  <span className="text-[10px] font-mono bg-blue-800/40 text-blue-200 px-1.5 py-0.5 rounded">
                    {nodeId.slice(0, 8)}
                  </span>
                  {idx < bestPath.length - 1 && <ArrowRight className="w-3 h-3 text-blue-500" />}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* Node Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {tree.nodes.map((node) => {
            const isBestPath = bestPathSet.has(node.node_id);
            const intensity = node.visit_count / maxVisits;
            return (
              <div
                key={node.node_id}
                className={cn(
                  "p-2 rounded border text-xs transition-colors",
                  isBestPath
                    ? "bg-blue-900/30 border-blue-700/50 ring-1 ring-blue-500/30"
                    : "bg-gray-800/30 border-gray-700/30"
                )}
              >
                <div className="font-mono text-gray-300 text-[10px] truncate">{node.node_id.slice(0, 8)}</div>
                {node.action && (
                  <div className="text-[10px] text-gray-500 mt-0.5">{node.action}</div>
                )}
                <div className="flex items-center justify-between mt-1.5">
                  <div className="flex items-center text-[10px] text-gray-400">
                    <TrendingUp className="w-3 h-3 mr-0.5" />
                    {node.visit_count}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] text-green-400 font-mono">
                      {node.value.toFixed(2)}
                    </span>
                    {node.reward !== null && (
                      <span className="text-[10px] text-yellow-400 font-mono">
                        R: {node.reward.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
                {/* Visit bar */}
                <div className="mt-1.5 h-1 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      isBestPath ? "bg-blue-500" : "bg-gray-500"
                    )}
                    style={{ width: `${intensity * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
