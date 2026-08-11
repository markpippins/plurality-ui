import React, { useState } from 'react';
import { Settings, Network, Bell, Zap, Users, Vote, Sliders, Keyboard, Workflow } from 'lucide-react';
import { AVAILABLE_PROVIDERS } from '../services/SimulatedBackendService';
import { useSimulation } from '../hooks/useSimulation';

export function TopBar() {
  const { 
    addToast, toasts, openRoundtableModal, roundtableSession, 
    openAgentConfigModal, openDependencyGraphModal, toggleShortcutsModal 
  } = useSimulation();
  const [plannerProvider, setPlannerProvider] = useState(AVAILABLE_PROVIDERS[1]);
  const [plannerModel, setPlannerModel] = useState(AVAILABLE_PROVIDERS[1].models[0]);
  
  const [coderProvider, setCoderProvider] = useState(AVAILABLE_PROVIDERS[0]);
  const [coderModel, setCoderModel] = useState(AVAILABLE_PROVIDERS[0].models[0]);

  const handleTestNotification = () => {
    addToast({
      title: '⚡ Agent Status Update',
      message: 'Operator manually pinged Coder agent. Status: ACTIVE.',
      type: 'agent_state',
      agentId: 'a3',
      agentName: 'Coder',
      agentRole: 'Builder',
      actionLabel: 'View Agent Logs',
      onAction: () => console.log('Opened logs')
    });
  };

  const isVoting = roundtableSession?.status === 'voting';

  return (
    <div className="h-14 border-b border-gray-800 bg-gray-900 flex items-center justify-between px-4 text-sm text-gray-300">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold tracking-tighter shadow-sm">
          NX
        </div>
        <span className="font-semibold text-gray-100 tracking-wide">NEXUS DUALITY <span className="text-gray-500 font-normal">LOSM Operator</span></span>
      </div>

      <div className="flex items-center space-x-3">
        {/* D3 Dependency Graph Button */}
        <button
          onClick={() => openDependencyGraphModal()}
          className="flex items-center space-x-2 bg-gradient-to-r from-emerald-900/80 to-teal-900/80 hover:from-emerald-800 hover:to-teal-800 border border-emerald-700/60 text-emerald-200 px-3 py-1.5 rounded-md text-xs font-semibold shadow-sm transition-all hover:shadow-emerald-900/40"
          title="Open interactive D3.js task dependency graph & waiting bottleneck analyzer"
        >
          <Workflow className="w-4 h-4 text-emerald-400" />
          <span>D3 Task Graph</span>
        </button>

        {/* Roundtable Interaction Button */}
        <button
          onClick={() => openRoundtableModal()}
          className="flex items-center space-x-2 bg-gradient-to-r from-blue-900/80 to-purple-900/80 hover:from-blue-800 hover:to-purple-800 border border-blue-700/60 text-blue-200 px-3 py-1.5 rounded-md text-xs font-semibold shadow-sm transition-all hover:shadow-blue-900/40"
        >
          <Users className="w-4 h-4 text-blue-400" />
          <span>Roundtable Mode</span>
          {isVoting ? (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          ) : roundtableSession ? (
            <span className="text-[10px] font-mono bg-blue-950 text-blue-300 border border-blue-800 px-1.5 py-0.2 rounded">
              {roundtableSession.approvalRate}%
            </span>
          ) : null}
        </button>

        {/* Planner Actor Selector */}
        <div className="flex items-center space-x-2 bg-gray-800 px-3 py-1.5 rounded-md border border-gray-700">
          <Network className="w-4 h-4 text-purple-400" />
          <span className="text-gray-400 text-xs uppercase tracking-wider">Planner Base</span>
          <select 
            className="bg-transparent text-gray-200 outline-none cursor-pointer"
            value={plannerProvider.id}
            onChange={(e) => {
              const p = AVAILABLE_PROVIDERS.find(x => x.id === e.target.value)!;
              setPlannerProvider(p);
              setPlannerModel(p.models[0]);
            }}
          >
            {AVAILABLE_PROVIDERS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <span className="text-gray-600">/</span>
          <select 
            className="bg-transparent text-gray-200 outline-none cursor-pointer max-w-[120px] truncate"
            value={plannerModel}
            onChange={(e) => setPlannerModel(e.target.value)}
          >
            {plannerProvider.models.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        {/* Builder Actor Selector */}
        <div className="flex items-center space-x-2 bg-gray-800 px-3 py-1.5 rounded-md border border-gray-700">
          <Network className="w-4 h-4 text-green-400" />
          <span className="text-gray-400 text-xs uppercase tracking-wider">Coder Base</span>
          <select 
            className="bg-transparent text-gray-200 outline-none cursor-pointer"
            value={coderProvider.id}
            onChange={(e) => {
              const p = AVAILABLE_PROVIDERS.find(x => x.id === e.target.value)!;
              setCoderProvider(p);
              setCoderModel(p.models[0]);
            }}
          >
            {AVAILABLE_PROVIDERS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <span className="text-gray-600">/</span>
          <select 
            className="bg-transparent text-gray-200 outline-none cursor-pointer max-w-[120px] truncate"
            value={coderModel}
            onChange={(e) => setCoderModel(e.target.value)}
          >
            {coderProvider.models.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <button
          onClick={() => toggleShortcutsModal()}
          className="flex items-center space-x-1 bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 px-2 py-1.5 rounded-md text-xs font-semibold transition-colors"
          title="Press '?' for Keyboard Shortcuts Reference"
        >
          <Keyboard className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden sm:inline font-mono text-[10px] bg-gray-900 border border-gray-700 px-1 rounded text-gray-400">?</span>
        </button>

        <button
          onClick={() => openAgentConfigModal()}
          className="flex items-center space-x-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors"
          title="Configure Agent System Prompts, Temperature & Avatars"
        >
          <Sliders className="w-3.5 h-3.5 text-purple-400" />
          <span>Agent Config</span>
        </button>

        <button
          onClick={handleTestNotification}
          className="relative p-1.5 hover:bg-gray-800 rounded-md text-gray-400 hover:text-blue-400 transition-colors flex items-center space-x-1"
          title="Test Toast Alert System"
        >
          <Bell className="w-4 h-4" />
          {toasts.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-blue-500 animate-ping" />
          )}
        </button>
        <Settings 
          onClick={() => openAgentConfigModal()}
          className="w-5 h-5 text-gray-400 hover:text-gray-200 cursor-pointer transition-colors" 
          title="Open Agent Configuration Matrix"
        />
      </div>
    </div>
  );
}

