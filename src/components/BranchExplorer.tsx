import React, { useState } from 'react';
import { useBranches } from '../hooks/useBranches';
import { GitBranch, GitFork, CheckCircle2, XCircle, Merge, TrendingUp } from 'lucide-react';
import { cn } from '../lib/utils';

interface BranchExplorerProps {
  wrId?: string;
}

export function BranchExplorer({ wrId }: BranchExplorerProps) {
  const { branches, loading, createBranch, forkBranch, mergeBranch, discardBranch } = useBranches(wrId);
  const [newLabel, setNewLabel] = useState('');

  if (!wrId) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLabel.trim()) {
      createBranch(newLabel.trim());
      setNewLabel('');
    }
  };

  return (
    <div className="w-64 h-full border-l border-gray-800 bg-gray-900/50 flex flex-col">
      <div className="h-10 border-b border-gray-800 flex items-center px-4 shrink-0 bg-gray-900/90 z-10">
        <GitBranch className="w-4 h-4 text-gray-500 mr-2" />
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Branches</span>
      </div>

      <div className="p-2 border-b border-gray-800">
        <form onSubmit={handleCreate} className="flex space-x-1">
          <input
            type="text"
            className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
            placeholder="New branch label..."
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-2 py-1 rounded"
          >
            <GitFork className="w-3 h-3" />
          </button>
        </form>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {loading && (
          <div className="text-xs text-gray-500 text-center py-4">Loading branches...</div>
        )}
        {branches.length === 0 && !loading && (
          <div className="text-xs text-gray-500 text-center py-4">No branches yet</div>
        )}
        {branches.map((branch) => (
          <div
            key={branch.branch_id}
            className={cn(
              "p-2 rounded border text-xs space-y-1",
              branch.status === 'merged' ? 'bg-green-900/20 border-green-800/30' :
              branch.status === 'discarded' ? 'bg-red-900/20 border-red-800/30 opacity-60' :
              'bg-gray-800/30 border-gray-700/30'
            )}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-gray-300 truncate">{branch.label || branch.branch_id.slice(0, 8)}</span>
              {branch.score !== null && (
                <span className="flex items-center text-green-400 text-[10px]">
                  <TrendingUp className="w-3 h-3 mr-0.5" />
                  {branch.score.toFixed(2)}
                </span>
              )}
            </div>
            {branch.parent_branch_id && (
              <div className="text-[10px] text-gray-500">forked from {branch.parent_branch_id.slice(0, 8)}</div>
            )}
            <div className="flex space-x-1 pt-1">
              {branch.status === 'active' && (
                <>
                  <button
                    onClick={() => forkBranch(branch.branch_id, `${branch.label}-variant`)}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-[10px] py-1 rounded flex items-center justify-center"
                  >
                    <GitFork className="w-3 h-3 mr-1" /> Fork
                  </button>
                  <button
                    onClick={() => mergeBranch(branch.branch_id)}
                    className="flex-1 bg-blue-900/50 hover:bg-blue-800/50 text-blue-300 text-[10px] py-1 rounded flex items-center justify-center"
                  >
                    <Merge className="w-3 h-3 mr-1" /> Merge
                  </button>
                  <button
                    onClick={() => discardBranch(branch.branch_id)}
                    className="bg-red-900/30 hover:bg-red-800/50 text-red-300 text-[10px] py-1 px-2 rounded"
                  >
                    <XCircle className="w-3 h-3" />
                  </button>
                </>
              )}
              {branch.status === 'merged' && (
                <span className="text-green-400 text-[10px] flex items-center">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Merged
                </span>
              )}
              {branch.status === 'discarded' && (
                <span className="text-red-400 text-[10px] flex items-center">
                  <XCircle className="w-3 h-3 mr-1" /> Discarded
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
