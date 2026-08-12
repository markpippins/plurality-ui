import React, { useState, useEffect } from 'react';
import { useSimulation } from '../hooks/useSimulation';
import { AVATAR_PRESETS } from '../services/SimulatedBackendService';
import { ActiveAgent } from '../types';
import { 
  X, Sliders, Cpu, Sparkles, RefreshCw, Check, 
  RotateCcw, Save, Shield, Terminal, Zap, Image as ImageIcon, Flame, HardDrive,
  Plus, Trash2, UserPlus, Users
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const PROMPT_PRESETS: Record<string, Array<{ name: string; prompt: string }>> = {
  a1: [
    {
      name: 'Default Task Planner',
      prompt: `You are the Lead Task Planner in the Plurality workflow. Your primary goal is to synthesize user intents into structured execution sequences, decompose goals into modular PlanIR steps, and estimate task dependencies and risk profiles.`
    },
    {
      name: 'Strict Milestone Sequencer',
      prompt: `You are a Milestone & Dependencies Planner. Deconstruct workflows into atomic, sequentially verified phases. Require explicit pre-conditions and post-conditions before transitioning phases.`
    }
  ],
  a5: [
    {
      name: 'Default System Architect',
      prompt: `You are the Lead System Architect in the Plurality workflow. You design structural boundaries, define domain interfaces, specify module hierarchies, maintain clear file node schemas, and enforce decoupled design patterns.`
    },
    {
      name: 'Enterprise Microservices Architect',
      prompt: `You are a Senior Enterprise System Architect. Require explicit contract typing, event-driven state decoupling, clear micro-frontend boundaries, and zero circular module dependencies.`
    }
  ],
  a2: [
    {
      name: 'Default Reviewer',
      prompt: `You are the Security & Integrity Reviewer in the Plurality workflow. You audit proposed PlanIR strategies and code outputs against OWASP safety, performance overhead, data destruction risk, and architectural integrity. Assign risk scores (1-100) and issue blocking critiques when critical vulnerabilities are identified.`
    },
    {
      name: 'Zero-Trust OWASP Auditor',
      prompt: `You are a Zero-Trust Application Security Specialist. Ruthlessly inspect code for injection risks, missing input sanitization, insecure state leaks, unauthenticated endpoints, and improper secret exposure.`
    }
  ],
  a3: [
    {
      name: 'Default Builder',
      prompt: `You are the Lead Code Generation Engine in the Plurality workflow. Your role is to transform PlanIR specifications into production-grade TypeScript code, React UI components, and API route handlers.`
    },
    {
      name: 'Functional React & Tailwind Craftsman',
      prompt: `You are a Principal Frontend Craftsman. Write immaculate, modular React 19 functional components with TypeScript strictness, custom hooks, atomic Tailwind utility classes, fluid motion transitions, and zero inline style hacks.`
    }
  ],
  a6: [
    {
      name: 'Default Engineering Lead',
      prompt: `You are the Systems & Infrastructure Engineer. You optimize build configurations, verify runtime environment constraints, establish module bundling, resolve dependencies, and ensure high runtime performance and container safety.`
    }
  ],
  a4: [
    {
      name: 'Default QA Validator',
      prompt: `You are the Quality Assurance & Test Verification Agent in the Plurality workflow. Execute 3-tier assertion suites including Static AST Analysis, Unit Functionality, and E2E Integration tests.`
    }
  ],
  a7: [
    {
      name: 'Default Requirements Analyst',
      prompt: `You are the Requirements & Data Analyst. You dissect user intents for edge cases, non-functional constraints, domain metrics, business rules, and hidden data invariants.`
    }
  ],
  a8: [
    {
      name: 'Default Domain Ontologist',
      prompt: `You are the Knowledge & Domain Ontologist. You map domain entities, taxonomies, state machine models, and semantic data contracts to maintain coherent terminology across all agent specifications.`
    }
  ],
  a9: [
    {
      name: 'Default Reasoning Auditor',
      prompt: `You are the Epistemological Reasoning Auditor. You evaluate the logical coherence of agent reasoning, verify inference chains, detect false assumptions or hallucinations, and validate truth claims.`
    }
  ],
  a10: [
    {
      name: 'Default Compliance Auditor',
      prompt: `You are the Governance & Compliance Auditor. You monitor activity logs, audit trail completeness, policy adherence, privacy bounds, and multi-agent coordination records.`
    }
  ],
  a11: [
    {
      name: 'Default Database Specialist',
      prompt: `You are the Lead Database Administrator (DBA) in the Plurality workflow. Your primary role is to design relational & document schemas, optimize query plans, manage migration scripts, enforce transactional integrity, and oversee indexing and data persistence.`
    },
    {
      name: 'High-Throughput SQL & NoSQL Architect',
      prompt: `You are a High-Performance Database Specialist. Focus on query indexing strategies, connection pooling, sharding key selection, ACID consistency compliance, and schema migration safety.`
    }
  ],
  a12: [
    {
      name: 'Default Network Topologist',
      prompt: `You are the Network Topologist in the Plurality workflow. You analyze dependency structures, compute graph invariants, detect circular dependencies, map agent communication topology, and optimize cluster routing across multi-agent networks.`
    },
    {
      name: 'Graph Clustering & Lattice Router',
      prompt: `You are a Topological Graph Algorithms Expert. Optimize shortest-path communication channels between agents, compute DAG invariants, partition task clusters, and eliminate routing bottlenecks.`
    }
  ]
};

export function AgentConfigModal() {
  const { 
    isAgentConfigOpen, closeAgentConfigModal, activeAgents, 
    selectedAgentForConfig, updateAgentConfig, addAgent, deleteAgent, resetPersistedStorage, addToast 
  } = useSimulation();

  const [activeTab, setActiveTab] = useState<string>('a1');
  const [formData, setFormData] = useState<Partial<ActiveAgent>>({});
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  // New Agent creation state
  const [newAgentForm, setNewAgentForm] = useState<{
    name: string;
    role: string;
    flavor: 'leased' | 'harness';
    systemPrompt: string;
    temperature: number;
    topP: number;
    maxTokens: number;
    avatarPrompt: string;
  }>({
    name: '',
    role: '',
    flavor: 'leased',
    systemPrompt: '',
    temperature: 0.7,
    topP: 0.9,
    maxTokens: 4096,
    avatarPrompt: ''
  });

  const isCreatingNew = activeTab === 'new';
  const currentAgent = activeAgents.find(a => a.id === activeTab) || activeAgents[0];

  useEffect(() => {
    if (selectedAgentForConfig) {
      setActiveTab(selectedAgentForConfig);
    }
  }, [selectedAgentForConfig]);

  useEffect(() => {
    if (currentAgent && !isCreatingNew) {
      setFormData({
        name: currentAgent.name,
        role: currentAgent.role,
        flavor: currentAgent.flavor || 'leased',
        systemPrompt: currentAgent.systemPrompt || '',
        temperature: currentAgent.temperature ?? 0.7,
        topP: currentAgent.topP ?? 0.9,
        maxTokens: currentAgent.maxTokens ?? 4096,
        avatarPrompt: currentAgent.avatarPrompt || '',
        avatarUrl: currentAgent.avatarUrl
      });
    }
  }, [currentAgent, activeTab, isCreatingNew]);

  if (!isAgentConfigOpen) return null;

  const handleSave = () => {
    if (isCreatingNew) {
      handleCreateNewAgent();
      return;
    }
    if (currentAgent) {
      updateAgentConfig(currentAgent.id, formData);
    }
  };

  const handleCreateNewAgent = () => {
    if (!newAgentForm.name.trim()) {
      addToast({
        title: '⚠️ Agent Name Required',
        message: 'Please specify a name for the new agent (e.g. Engineer, Analyst).',
        type: 'warn'
      });
      return;
    }

    const created = addAgent({
      name: newAgentForm.name.trim(),
      role: newAgentForm.role.trim() || 'Specialist',
      flavor: newAgentForm.flavor,
      systemPrompt: newAgentForm.systemPrompt || `You are ${newAgentForm.name}, an expert AI agent in the multi-agent system.`,
      temperature: newAgentForm.temperature,
      topP: newAgentForm.topP,
      maxTokens: newAgentForm.maxTokens,
      avatarPrompt: newAgentForm.avatarPrompt || `Futuristic AI avatar portrait for ${newAgentForm.name}`
    });

    setActiveTab(created.id);
    setNewAgentForm({
      name: '',
      role: '',
      flavor: 'leased',
      systemPrompt: '',
      temperature: 0.7,
      topP: 0.9,
      maxTokens: 4096,
      avatarPrompt: ''
    });
  };

  const handleDeleteAgent = (idToDelete: string) => {
    if (confirm(`Are you sure you want to remove agent "${currentAgent?.name}" from the active pool?`)) {
      deleteAgent(idToDelete);
      const remaining = activeAgents.filter(a => a.id !== idToDelete);
      if (remaining.length > 0) {
        setActiveTab(remaining[0].id);
      }
    }
  };

  const handleRegenerateAvatar = () => {
    setIsGeneratingAvatar(true);
    setGenerationProgress(10);

    const interval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 20;
      });
    }, 250);

    setTimeout(() => {
      clearInterval(interval);
      setGenerationProgress(100);

      // Cycle between presets or generated variations
      const presets = AVATAR_PRESETS[currentAgent.id] || [];
      const nextIndex = (presets.indexOf(formData.avatarUrl || '') + 1) % (presets.length || 1);
      const newAvatarUrl = presets[nextIndex] || formData.avatarUrl;

      setFormData(prev => ({ ...prev, avatarUrl: newAvatarUrl }));
      setIsGeneratingAvatar(false);

      updateAgentConfig(currentAgent.id, { avatarUrl: newAvatarUrl, avatarPrompt: formData.avatarPrompt });

      addToast({
        title: `✨ Avatar Regenerated: ${currentAgent.name}`,
        message: `Updated profile picture for ${currentAgent.name} using prompt style.`,
        type: 'success',
        agentId: currentAgent.id,
        agentName: currentAgent.name
      });
    }, 1500);
  };

  const getTempDescription = (temp: number) => {
    if (temp <= 0.2) return { text: 'Strict / Deterministic (High Precision)', color: 'text-blue-400' };
    if (temp <= 0.5) return { text: 'Balanced / Reliable Execution', color: 'text-green-400' };
    if (temp <= 0.8) return { text: 'Creative / Exploratory Synthesis', color: 'text-purple-400' };
    return { text: 'High Exploration / Experimental', color: 'text-amber-400' };
  };

  const tempDesc = getTempDescription(formData.temperature ?? 0.7);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-md">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-gray-100"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-800 bg-gray-900/90 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-lg bg-purple-600/20 border border-purple-500/40 text-purple-400">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-base font-bold text-gray-100 tracking-wide">
                    Agent Persona & Parameter Matrix
                  </h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800">
                    Plurality Agent Config
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 flex items-center space-x-1" title="Changes auto-persist to LocalStorage">
                    <HardDrive className="w-3 h-3 text-emerald-400" />
                    <span>LocalStorage Persistent</span>
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  Configure system instructions, role flavor (Leased / Harness), temperature creativity, and profile avatars per agent.
                </p>
              </div>
            </div>

            <button 
              onClick={closeAgentConfigModal}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Agent Switcher Tabs */}
          <div className="bg-gray-950/80 px-6 py-2 border-b border-gray-800 flex items-center space-x-2 shrink-0 overflow-x-auto">
            {[...activeAgents]
              .sort((a, b) => a.role.localeCompare(b.role, undefined, { sensitivity: 'base' }))
              .map((ag) => (
              <button
                key={ag.id}
                onClick={() => setActiveTab(ag.id)}
                className={cn(
                  "flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium transition-all shrink-0 border",
                  activeTab === ag.id 
                    ? "bg-purple-950/60 text-purple-200 border-purple-700/80 shadow-sm" 
                    : "text-gray-400 hover:text-gray-200 hover:bg-gray-900 border-transparent"
                )}
              >
                {ag.avatarUrl ? (
                  <img 
                    src={ag.avatarUrl} 
                    alt={ag.name} 
                    referrerPolicy="no-referrer"
                    className="w-5 h-5 rounded-full object-cover border border-gray-700 shrink-0" 
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center text-[10px] font-bold">
                    {ag.name[0]}
                  </div>
                )}
                <div className="text-left leading-tight">
                  <span className="block font-semibold">{ag.name}</span>
                  <span className="text-[9px] text-gray-500 uppercase tracking-widest block">{ag.role}</span>
                </div>
              </button>
            ))}

            {/* Add New Agent Button */}
            <button
              onClick={() => setActiveTab('new')}
              className={cn(
                "flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all shrink-0 border ml-2",
                isCreatingNew 
                  ? "bg-emerald-950/70 text-emerald-200 border-emerald-600/80 shadow-sm" 
                  : "bg-emerald-950/30 hover:bg-emerald-900/40 text-emerald-300 border-emerald-800/60"
              )}
            >
              <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
              <span>+ Add Agent</span>
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* If Creating New Agent */}
            {isCreatingNew ? (
              <>
                <div className="lg:col-span-2 space-y-5">
                  <div className="bg-emerald-950/20 border border-emerald-800/60 p-4 rounded-xl space-y-4">
                    <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
                      <UserPlus className="w-4 h-4" />
                      <h3>Create & Instantiate New AI Agent Persona</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-gray-300 block mb-1">
                          Agent Name *
                        </label>
                        <input
                          type="text"
                          value={newAgentForm.name}
                          onChange={e => setNewAgentForm({ ...newAgentForm, name: e.target.value })}
                          placeholder="e.g. Engineer, Analyst, Auditor"
                          className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2.5 text-xs text-gray-100 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-gray-300 block mb-1">
                          Role Title / Specialization
                        </label>
                        <input
                          type="text"
                          value={newAgentForm.role}
                          onChange={e => setNewAgentForm({ ...newAgentForm, role: e.target.value })}
                          placeholder="e.g. Infrastructure Lead, Data Specialist"
                          className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2.5 text-xs text-gray-100 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-300 block mb-1">
                        System Instructions / Prompt
                      </label>
                      <textarea
                        rows={6}
                        value={newAgentForm.systemPrompt}
                        onChange={e => setNewAgentForm({ ...newAgentForm, systemPrompt: e.target.value })}
                        placeholder="Define the agent's core responsibilities, reasoning guidelines, and operational constraints..."
                        className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-xs font-mono text-gray-200 focus:outline-none focus:border-emerald-500 resize-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-5 bg-gray-950/50 p-4 rounded-xl border border-gray-800/80">
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-300 block mb-1.5">
                        Role Flavor
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setNewAgentForm({ ...newAgentForm, flavor: 'leased' })}
                          className={cn(
                            "px-3 py-2 rounded-lg text-xs font-semibold border flex flex-col items-center justify-center transition-all",
                            newAgentForm.flavor === 'leased'
                              ? "bg-emerald-950 text-emerald-200 border-emerald-500 shadow-sm"
                              : "bg-gray-900 text-gray-400 border-gray-800 hover:text-gray-200"
                          )}
                        >
                          <span className="font-bold">Leased Role</span>
                          <span className="text-[9px] text-emerald-400/80 font-normal">Ephemeral</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setNewAgentForm({ ...newAgentForm, flavor: 'harness' })}
                          className={cn(
                            "px-3 py-2 rounded-lg text-xs font-semibold border flex flex-col items-center justify-center transition-all",
                            newAgentForm.flavor === 'harness'
                              ? "bg-amber-950 text-amber-200 border-amber-500 shadow-sm"
                              : "bg-gray-900 text-gray-400 border-gray-800 hover:text-gray-200"
                          )}
                        >
                          <span className="font-bold">Harness Role</span>
                          <span className="text-[9px] text-amber-400/80 font-normal">Persistent</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-semibold text-gray-300">Temperature Creativity</label>
                        <span className="text-xs font-mono text-emerald-400">{newAgentForm.temperature.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={newAgentForm.temperature}
                        onChange={e => setNewAgentForm({ ...newAgentForm, temperature: parseFloat(e.target.value) })}
                        className="w-full accent-emerald-500"
                      />
                    </div>

                    <button
                      onClick={handleCreateNewAgent}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center space-x-2 shadow-md"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create Agent Persona</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* Existing Agent Configuration */
              <>
                <div className="lg:col-span-2 space-y-5">
                  {/* System Prompt Section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center space-x-1.5">
                        <Terminal className="w-4 h-4 text-purple-400" />
                        <span>System Instructions / Role Prompt</span>
                      </label>
                      <span className="text-[10px] font-mono text-gray-500">
                        {(formData.systemPrompt || '').length} chars
                      </span>
                    </div>

                    <div className="relative rounded-lg border border-gray-800 bg-gray-950/90 overflow-hidden focus-within:border-purple-500 transition-colors">
                      <textarea
                        rows={6}
                        value={formData.systemPrompt || ''}
                        onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                        placeholder="Enter agent system instructions..."
                        className="w-full bg-transparent p-3.5 text-xs font-mono text-gray-200 placeholder-gray-600 focus:outline-none resize-none leading-relaxed"
                      />
                    </div>

                    {/* Presets */}
                    {PROMPT_PRESETS[currentAgent.id] && PROMPT_PRESETS[currentAgent.id].length > 0 && (
                      <div className="pt-1">
                        <span className="text-[11px] text-gray-500 font-medium block mb-1.5">
                          Apply Persona Preset:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {PROMPT_PRESETS[currentAgent.id].map((preset) => (
                            <button
                              key={preset.name}
                              onClick={() => setFormData({ ...formData, systemPrompt: preset.prompt })}
                              className="text-xs bg-gray-950 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 text-purple-300 px-2.5 py-1 rounded transition-colors flex items-center space-x-1"
                            >
                              <Sparkles className="w-3 h-3 text-purple-400" />
                              <span>{preset.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Editable Name & Role */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-950/50 p-3.5 rounded-lg border border-gray-800/80">
                    <div>
                      <label className="text-xs font-semibold text-gray-400 block mb-1">Agent Name</label>
                      <input
                        type="text"
                        value={formData.name || currentAgent.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-400 block mb-1">Role Title</label>
                      <input
                        type="text"
                        value={formData.role || currentAgent.role}
                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                        className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  {/* Role Flavor & Token Limits */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-950/50 p-4 rounded-lg border border-gray-800/80">
                    {/* Role Flavor Selector */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-300 block flex items-center justify-between">
                        <span>Role Flavor</span>
                        <span className="text-[10px] text-gray-500 font-mono">Runtime Control</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, flavor: 'leased' })}
                          className={cn(
                            "px-3 py-2 rounded-md text-xs font-semibold border flex flex-col items-center justify-center transition-all",
                            (formData.flavor || 'leased') === 'leased'
                              ? "bg-blue-950/90 text-blue-200 border-blue-500 shadow-sm"
                              : "bg-gray-900 text-gray-400 border-gray-800 hover:text-gray-200 hover:bg-gray-800"
                          )}
                        >
                          <span className="font-bold">Leased Role</span>
                          <span className="text-[9px] font-normal text-blue-300/80">Ephemeral / On-Demand</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, flavor: 'harness' })}
                          className={cn(
                            "px-3 py-2 rounded-md text-xs font-semibold border flex flex-col items-center justify-center transition-all",
                            formData.flavor === 'harness'
                              ? "bg-amber-950/90 text-amber-200 border-amber-500 shadow-sm"
                              : "bg-gray-900 text-gray-400 border-gray-800 hover:text-gray-200 hover:bg-gray-800"
                          )}
                        >
                          <span className="font-bold">Harness Role</span>
                          <span className="text-[9px] font-normal text-amber-300/80">Persistent / Anchored</span>
                        </button>
                      </div>
                    </div>

                    {/* Max Tokens */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-400 block">
                        Max Output Tokens
                      </label>
                      <input
                        type="number"
                        step={1024}
                        min={1024}
                        max={16384}
                        value={formData.maxTokens ?? 4096}
                        onChange={(e) => setFormData({ ...formData, maxTokens: parseInt(e.target.value) || 4096 })}
                        className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-purple-500 font-mono"
                      />
                    </div>
                  </div>

                </div>

                {/* Right Column: Temperature Control & Avatar Studio (1 Col) */}
                <div className="space-y-6">
                  
                  {/* Temperature Control Panel */}
                  <div className="bg-gray-950/80 p-4 rounded-xl border border-gray-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gray-200 uppercase tracking-wider flex items-center space-x-1.5">
                        <Flame className="w-4 h-4 text-amber-400" />
                        <span>Temperature (Creativity)</span>
                      </label>
                      <span className="text-sm font-mono font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-900">
                        {formData.temperature?.toFixed(2)}
                      </span>
                    </div>

                    <input 
                      type="range"
                      min={0.0}
                      max={1.0}
                      step={0.05}
                      value={formData.temperature ?? 0.7}
                      onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                      className="w-full accent-amber-500 cursor-pointer h-2 bg-gray-800 rounded-lg"
                    />

                    <div className="text-[11px] font-medium flex items-center space-x-1.5 pt-1">
                      <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className={tempDesc.color}>{tempDesc.text}</span>
                    </div>

                    {/* Top P */}
                    <div className="pt-2 border-t border-gray-800/80 space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>Top-P (Nucleus Sampling)</span>
                        <span className="font-mono text-gray-300 font-semibold">{formData.topP?.toFixed(2)}</span>
                      </div>
                      <input 
                        type="range"
                        min={0.1}
                        max={1.0}
                        step={0.05}
                        value={formData.topP ?? 0.9}
                        onChange={(e) => setFormData({ ...formData, topP: parseFloat(e.target.value) })}
                        className="w-full accent-purple-500 cursor-pointer h-1.5 bg-gray-800 rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Avatar Studio */}
                  <div className="bg-gray-950/80 p-4 rounded-xl border border-gray-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gray-200 uppercase tracking-wider flex items-center space-x-1.5">
                        <ImageIcon className="w-4 h-4 text-blue-400" />
                        <span>Avatar Studio</span>
                      </label>
                      <span className="text-[10px] text-gray-500 font-mono">3D AI Avatar</span>
                    </div>

                    {/* Avatar Preview Card */}
                    <div className="flex items-center space-x-4 bg-gray-900/90 p-3 rounded-lg border border-gray-800">
                      <div className="relative shrink-0">
                        {formData.avatarUrl ? (
                          <img 
                            src={formData.avatarUrl} 
                            alt={currentAgent.name} 
                            referrerPolicy="no-referrer"
                            className="w-16 h-16 rounded-full object-cover border-2 border-purple-500/60 shadow-lg"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-purple-900/50 border border-purple-500 flex items-center justify-center text-xl font-bold text-purple-300">
                            {currentAgent.name[0]}
                          </div>
                        )}

                        {isGeneratingAvatar && (
                          <div className="absolute inset-0 bg-gray-950/80 rounded-full flex items-center justify-center">
                            <RefreshCw className="w-6 h-6 text-purple-400 animate-spin" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <h4 className="text-sm font-bold text-gray-100 truncate">{formData.name || currentAgent.name}</h4>
                        <span className="text-[10px] text-purple-300 bg-purple-950 border border-purple-800 px-1.5 py-0.2 rounded font-mono">
                          {formData.role || currentAgent.role}
                        </span>
                      </div>
                    </div>

                    {/* Avatar Prompt */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-gray-400 block">
                        Image Generation Style Prompt
                      </label>
                      <input
                        type="text"
                        value={formData.avatarPrompt || ''}
                        onChange={(e) => setFormData({ ...formData, avatarPrompt: e.target.value })}
                        placeholder="Enter visual style description..."
                        className="w-full bg-gray-900 border border-gray-700/80 rounded-md px-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    {/* Regenerate Button */}
                    <button
                      onClick={handleRegenerateAvatar}
                      disabled={isGeneratingAvatar}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white py-2 rounded-md text-xs font-semibold flex items-center justify-center space-x-2 transition-all shadow-md"
                    >
                      {isGeneratingAvatar ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-white" />
                          <span>Generating Avatar ({generationProgress}%)...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-purple-200" />
                          <span>Regenerate Agent Avatar</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Delete Option */}
                  {activeAgents.length > 1 && (
                    <div className="pt-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleDeleteAgent(currentAgent.id)}
                        className="text-xs text-red-400 hover:text-red-300 font-mono flex items-center space-x-1 hover:underline"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete {currentAgent.name}</span>
                      </button>
                    </div>
                  )}

                </div>
              </>
            )}

          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-gray-800 bg-gray-900/90 flex items-center justify-between shrink-0">
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  // Reset current form to default
                  const preset = (PROMPT_PRESETS[currentAgent.id] || [])[0];
                  setFormData({
                    flavor: currentAgent.flavor || 'leased',
                    systemPrompt: preset?.prompt || '',
                    temperature: 0.7,
                    topP: 0.9,
                    maxTokens: 4096
                  });
                }}
                className="px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium rounded-md transition-colors flex items-center space-x-1.5"
                title="Reset current agent form parameters"
              >
                <RotateCcw className="w-3.5 h-3.5 text-gray-400" />
                <span>Reset Current Agent</span>
              </button>

              <button
                onClick={() => {
                  if (confirm('Are you sure you want to clear all persisted local storage data and restore default agent configs and logs?')) {
                    resetPersistedStorage();
                    closeAgentConfigModal();
                  }
                }}
                className="px-3.5 py-2 bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/60 text-xs font-medium rounded-md transition-colors flex items-center space-x-1.5"
                title="Wipe LocalStorage and restore factory default configs and log history"
              >
                <HardDrive className="w-3.5 h-3.5 text-red-400" />
                <span>Clear Persisted Storage</span>
              </button>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={closeAgentConfigModal}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold rounded-md transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  handleSave();
                  if (!isCreatingNew) {
                    closeAgentConfigModal();
                  }
                }}
                className={cn(
                  "px-5 py-2 text-white text-xs font-semibold rounded-md transition-colors flex items-center space-x-1.5 shadow-md",
                  isCreatingNew ? "bg-emerald-600 hover:bg-emerald-500" : "bg-purple-600 hover:bg-purple-500"
                )}
              >
                <Save className="w-4 h-4" />
                <span>{isCreatingNew ? 'Create Agent' : 'Save & Apply Agent Matrix'}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
