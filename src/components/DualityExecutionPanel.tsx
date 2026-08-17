import React, { useState, useRef, useEffect } from 'react';
import { useSimulation } from '../hooks/useSimulation';
import { 
  Bot, Cpu, Code2, CheckCircle2, ArrowRight, Play, RefreshCw, 
  Trash2, Sliders, ShieldCheck, Terminal, FileCode, Check, 
  AlertTriangle, ArrowLeftRight, Clock, Zap, Sparkles, Layers,
  Split, GitCommit, Search, Activity, BarChart2, DollarSign
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { InterAgentDialogMessage, BuilderTraceEvent } from '../types';
import { DualityPerformanceMetricsView } from './DualityPerformanceMetricsView';

const BUILDER_ROLES = [
  { id: 'Builder', label: 'Builder (Coder)', agentId: 'a3', desc: 'Code synthesis and file mutations' },
  { id: 'Conduit Engine', label: 'Conduit Engine', agentId: 'a6', desc: 'State integration and reactive streaming' },
  { id: 'Frontend Specialist', label: 'Frontend Specialist', agentId: 'a3', desc: 'Component scaffolding & Tailwind UI' },
  { id: 'Test & QA Validator', label: 'Test & QA Validator', agentId: 'a4', desc: 'Unit tests and invariant assertions' },
  { id: 'Database Engineer', label: 'Database Engineer', agentId: 'a7', desc: 'SQL schema & query implementation' }
];

const BUILDER_MODELS = [
  { id: 'qwen2.5-coder:latest', name: 'Qwen 2.5 Coder 32B', provider: 'OpenCode', tag: 'Code Master' },
  { id: 'claude-3-7-sonnet', name: 'Claude 3.7 Sonnet', provider: 'Anthropic', tag: 'Hybrid' },
  { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', tag: 'Coding' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', tag: 'Omni' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'Google', tag: 'Fast' },
  { id: 'deepseek-r1', name: 'DeepSeek R1', provider: 'DeepSeek', tag: 'Reasoning' }
];

export function DualityExecutionPanel() {
  const { 
    dualityState, 
    setDualitySecondaryRole, 
    dispatchDualitySpecToBuilder, 
    clearDualityInterAgentDialog,
    activeAgents 
  } = useSimulation();

  const [activeTab, setActiveTab] = useState<'both' | 'dialog' | 'trace' | 'metrics'>('both');
  const [customSpecInput, setCustomSpecInput] = useState('');
  const [isSpecInputOpen, setIsSpecInputOpen] = useState(false);
  const [showEmbeddedMetrics, setShowEmbeddedMetrics] = useState(true);

  const dialogEndRef = useRef<HTMLDivElement>(null);
  const traceEndRef = useRef<HTMLDivElement>(null);

  const primaryRole = dualityState.primaryRole || 'System Architect';
  const primaryModel = dualityState.primaryModel || 'claude-3-7-sonnet';
  const secondaryRole = dualityState.secondaryRole || 'Builder';
  const secondaryModel = dualityState.secondaryModel || 'qwen2.5-coder:latest';
  const isExecuting = dualityState.isExecuting;

  const dialogMessages = dualityState.interAgentDialog || [];
  const builderTrace = dualityState.builderTrace || [];
  const perf = dualityState.performanceMetrics;

  // Scroll to bottom on updates
  useEffect(() => {
    dialogEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [dialogMessages, isExecuting]);

  const handleRoleChange = (newRole: string) => {
    const roleObj = BUILDER_ROLES.find(r => r.id === newRole);
    setDualitySecondaryRole(newRole, secondaryModel, roleObj?.agentId);
  };

  const handleModelChange = (newModel: string) => {
    setDualitySecondaryRole(secondaryRole, newModel, dualityState.secondaryAgentId);
  };

  const handleDispatchCustomSpec = () => {
    if (!customSpecInput.trim()) return;
    dispatchDualitySpecToBuilder(customSpecInput.trim());
    setCustomSpecInput('');
    setIsSpecInputOpen(false);
  };

  return (
    <div id="duality-execution-panel" className="flex-1 flex flex-col h-full bg-gray-900 overflow-hidden">
      {/* Top Header: Role & Model Selector Combo */}
      <div className="p-3 border-b border-gray-800 bg-gray-950/70 shrink-0 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5 text-emerald-400" />
              Secondary Role: {secondaryRole}
            </span>
            <span className="text-[10px] font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 px-2 py-0.5 rounded font-semibold">
              Architect ↔ Builder Link
            </span>
            <span 
              id="duality-builder-autosave-indicator"
              className="hidden sm:inline-flex items-center space-x-1 text-[10px] font-mono bg-emerald-950/70 text-emerald-300 border border-emerald-800/60 px-1.5 py-0.5 rounded"
              title="Session state auto-persisted to local storage."
            >
              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
              <span>Persisted</span>
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {/* View Mode Tabs */}
            <div className="flex items-center bg-gray-900 p-0.5 rounded-md border border-gray-800 text-[11px]">
              <button
                id="tab-duality-split"
                onClick={() => setActiveTab('both')}
                className={cn(
                  "px-2 py-0.5 rounded font-medium transition-colors",
                  activeTab === 'both' ? "bg-gray-800 text-white font-semibold" : "text-gray-400 hover:text-gray-200"
                )}
              >
                Split View
              </button>
              <button
                id="tab-duality-dialog"
                onClick={() => setActiveTab('dialog')}
                className={cn(
                  "px-2 py-0.5 rounded font-medium transition-colors",
                  activeTab === 'dialog' ? "bg-gray-800 text-white font-semibold" : "text-gray-400 hover:text-gray-200"
                )}
              >
                Dialog ({dialogMessages.length})
              </button>
              <button
                id="tab-duality-trace"
                onClick={() => setActiveTab('trace')}
                className={cn(
                  "px-2 py-0.5 rounded font-medium transition-colors",
                  activeTab === 'trace' ? "bg-gray-800 text-white font-semibold" : "text-gray-400 hover:text-gray-200"
                )}
              >
                Trace ({builderTrace.length})
              </button>
              <button
                id="tab-duality-metrics"
                onClick={() => setActiveTab('metrics')}
                className={cn(
                  "px-2 py-0.5 rounded font-medium transition-colors flex items-center space-x-1",
                  activeTab === 'metrics' ? "bg-cyan-950/80 text-cyan-300 border border-cyan-800/80 font-bold" : "text-gray-400 hover:text-cyan-300"
                )}
              >
                <BarChart2 className="w-3 h-3 text-cyan-400" />
                <span>Side-by-Side Metrics</span>
              </button>
            </div>

            <button
              onClick={() => clearDualityInterAgentDialog()}
              className="text-[11px] text-gray-400 hover:text-gray-200 hover:bg-gray-800 px-2 py-1 rounded transition-colors flex items-center space-x-1"
              title="Clear inter-agent dialogue and trace records"
            >
              <Trash2 className="w-3 h-3 text-gray-500" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Role & Model Combo Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-gray-900/90 p-2 rounded-lg border border-gray-800">
          {/* Secondary Role Selector */}
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center space-x-1">
              <Bot className="w-3 h-3 text-emerald-400" />
              <span>Secondary Role (Builder)</span>
            </label>
            <select
              id="duality-secondary-role-select"
              value={secondaryRole}
              onChange={(e) => handleRoleChange(e.target.value)}
              className="w-full bg-gray-950 border border-gray-700 text-gray-200 text-xs rounded-md px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 font-medium"
            >
              {BUILDER_ROLES.map(role => (
                <option key={role.id} value={role.id}>
                  {role.label} ({role.desc.slice(0, 28)}...)
                </option>
              ))}
            </select>
          </div>

          {/* Secondary Model Selector */}
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center space-x-1">
              <Cpu className="w-3 h-3 text-cyan-400" />
              <span>Inference Engine</span>
            </label>
            <select
              id="duality-secondary-model-select"
              value={secondaryModel}
              onChange={(e) => handleModelChange(e.target.value)}
              className="w-full bg-gray-950 border border-gray-700 text-gray-200 text-xs rounded-md px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 font-medium"
            >
              {BUILDER_MODELS.map(model => (
                <option key={model.id} value={model.id}>
                  {model.name} [{model.tag}]
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Spec Action & Quick Telemetry Pill Bar */}
        <div className="flex flex-wrap items-center justify-between text-xs pt-0.5 gap-2">
          <div className="flex items-center space-x-3 text-[11px] text-gray-400">
            <span className="font-mono text-gray-400">
              Active Link: <span className="text-indigo-300 font-semibold">{primaryRole}</span> ⇄ <span className="text-emerald-300 font-semibold">{secondaryRole}</span>
            </span>

            {/* Quick side-by-side latency pill */}
            {perf && (
              <div className="hidden sm:flex items-center space-x-2 bg-gray-950/70 border border-gray-800 px-2 py-0.5 rounded font-mono text-[10px]">
                <span className="text-indigo-300 font-semibold">A: {perf.primary.lastLatencyMs}ms</span>
                <span className="text-gray-600">|</span>
                <span className="text-emerald-300 font-semibold">B: {perf.secondary.lastLatencyMs}ms</span>
                <span className="text-gray-600">|</span>
                <span className="text-cyan-300">{perf.totalSessionTokens.toLocaleString()} tokens</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              id="btn-duality-toggle-embedded-metrics"
              onClick={() => setShowEmbeddedMetrics(!showEmbeddedMetrics)}
              className={cn(
                "text-[11px] px-2 py-1 rounded transition-colors flex items-center space-x-1 border font-medium",
                showEmbeddedMetrics 
                  ? "bg-cyan-950/70 text-cyan-300 border-cyan-800/80" 
                  : "bg-gray-900 text-gray-400 border-gray-800 hover:text-gray-200"
              )}
              title="Toggle side-by-side performance metrics bar"
            >
              <BarChart2 className="w-3 h-3 text-cyan-400" />
              <span>{showEmbeddedMetrics ? 'Hide Metrics Bar' : 'Show Metrics Bar'}</span>
            </button>

            <button
              onClick={() => setIsSpecInputOpen(!isSpecInputOpen)}
              className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-800/80 px-2.5 py-1 rounded transition-colors flex items-center space-x-1"
            >
              <Play className="w-3 h-3 fill-emerald-400/40" />
              <span>Dispatch Custom Spec</span>
            </button>
          </div>
        </div>

        {/* Expandable Custom Spec Input */}
        {isSpecInputOpen && (
          <div className="p-2.5 bg-gray-900 rounded-lg border border-emerald-800/70 space-y-2 animate-in fade-in">
            <label className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">
              Manual Spec Handoff to {secondaryRole}
            </label>
            <textarea
              rows={2}
              value={customSpecInput}
              onChange={(e) => setCustomSpecInput(e.target.value)}
              placeholder="Enter interface specifications, AST requirements, or code generation directives..."
              className="w-full bg-gray-950 border border-gray-700 rounded p-2 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsSpecInputOpen(false)}
                className="text-xs text-gray-400 hover:text-gray-200 px-2 py-1"
              >
                Cancel
              </button>
              <button
                onClick={handleDispatchCustomSpec}
                disabled={!customSpecInput.trim()}
                className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-3 py-1 rounded shadow-sm transition-colors disabled:opacity-50"
              >
                Dispatch Spec
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Embedded Side-by-Side Performance Metrics Bar (if toggled on or if in metrics tab) */}
      {(showEmbeddedMetrics || activeTab === 'metrics') && (
        <div className={cn(
          "border-b border-gray-800 bg-gray-950/90",
          activeTab === 'metrics' ? "flex-1 overflow-y-auto p-4 space-y-4" : "p-3 shrink-0"
        )}>
          <DualityPerformanceMetricsView compact={activeTab !== 'metrics'} />
        </div>
      )}

      {/* Main Content Pane: Inter-Agent Dialogue & Builder Trace (hidden if dedicated metrics tab active) */}
      {activeTab !== 'metrics' && (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left / Top Side of Pane: Inter-Agent Dialogue */}
          {(activeTab === 'both' || activeTab === 'dialog') && (
            <div className={cn(
              "flex flex-col bg-gray-900/60 border-b md:border-b-0 md:border-r border-gray-800 overflow-hidden",
              activeTab === 'both' ? "flex-1 md:w-3/5" : "w-full flex-1"
            )}>
              <div className="p-2 bg-gray-950/60 border-b border-gray-800 flex items-center justify-between shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center space-x-1.5">
                  <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Inter-Agent Protocol Stream</span>
                </span>
                <span className="text-[10px] font-mono text-gray-500">
                  {dialogMessages.length} exchanges
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-3.5">
                {dialogMessages.map((msg) => {
                  const isFromPrimary = msg.senderRole === primaryRole || msg.senderAgentId === 'a5';
                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        "p-3 rounded-lg border text-xs space-y-2 transition-all",
                        isFromPrimary
                          ? "bg-indigo-950/20 border-indigo-900/60 text-indigo-100"
                          : "bg-emerald-950/20 border-emerald-900/60 text-emerald-100"
                      )}
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className={cn(
                            "w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white shadow-sm",
                            isFromPrimary ? "bg-indigo-600" : "bg-emerald-600"
                          )}>
                            {isFromPrimary ? 'A' : 'B'}
                          </div>
                          <div>
                            <span className={cn("font-bold", isFromPrimary ? "text-indigo-300" : "text-emerald-300")}>
                              {msg.senderRole}
                            </span>
                            <span className="text-gray-500 mx-1">→</span>
                            <span className="text-gray-400">{msg.recipientRole}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1.5">
                          {/* Live message telemetry chips */}
                          {msg.latencyMs && (
                            <span className="text-[9px] font-mono bg-gray-950 px-1.5 py-0.2 rounded border border-gray-800 text-cyan-300 font-semibold">
                              {msg.latencyMs}ms
                            </span>
                          )}
                          {msg.tokensUsed && (
                            <span className="text-[9px] font-mono bg-gray-950 px-1.5 py-0.2 rounded border border-gray-800 text-purple-300">
                              {msg.tokensUsed}t
                            </span>
                          )}
                          <span className={cn(
                            "text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded border",
                            msg.type === 'spec_handoff' && "bg-blue-950 text-blue-300 border-blue-800",
                            msg.type === 'code_proposal' && "bg-emerald-950 text-emerald-300 border-emerald-800",
                            msg.type === 'validation_ack' && "bg-purple-950 text-purple-300 border-purple-800",
                            msg.type === 'clarification' && "bg-amber-950 text-amber-300 border-amber-800"
                          )}>
                            {msg.type.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] text-gray-500 font-mono">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="whitespace-pre-wrap leading-relaxed text-gray-200">
                        {msg.content}
                      </div>

                      {/* Code Snippet Box if available */}
                      {msg.codeSnippet && (
                        <div className="rounded border border-gray-800 bg-gray-950 overflow-hidden mt-2">
                          <div className="bg-gray-900/90 px-2.5 py-1 border-b border-gray-800 flex items-center justify-between text-[10px] font-mono text-gray-400">
                            <span className="flex items-center space-x-1 text-emerald-400">
                              <FileCode className="w-3 h-3" />
                              <span>{msg.codeSnippet.filename}</span>
                            </span>
                            {msg.diffSummary && (
                              <span className="text-emerald-400 font-bold">
                                +{msg.diffSummary.added} / -{msg.diffSummary.removed}
                              </span>
                            )}
                          </div>
                          <pre className="p-2.5 text-[11px] font-mono text-gray-300 overflow-x-auto leading-tight bg-gray-950/80">
                            <code>{msg.codeSnippet.code}</code>
                          </pre>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* In Progress indicator */}
                {isExecuting && (
                  <div className="p-3 bg-gray-800/40 border border-indigo-700/40 rounded-lg text-xs text-indigo-200 flex items-center space-x-2 animate-pulse">
                    <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                    <span>Exchanging interface definitions and code contracts...</span>
                  </div>
                )}

                <div ref={dialogEndRef} />
              </div>
            </div>
          )}

          {/* Right / Bottom Side of Pane: Live Builder Trace */}
          {(activeTab === 'both' || activeTab === 'trace') && (
            <div className={cn(
              "flex flex-col bg-gray-950 overflow-hidden",
              activeTab === 'both' ? "flex-1 md:w-2/5" : "w-full flex-1"
            )}>
              <div className="p-2 bg-gray-950 border-b border-gray-800 flex items-center justify-between shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center space-x-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Live Builder Trace</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-400/80 bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.2 rounded font-bold">
                  AST Trace Active
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
                {builderTrace.map((event) => (
                  <div
                    key={event.id}
                    className={cn(
                      "p-2 rounded border font-mono text-[11px] space-y-1 transition-all",
                      event.status === 'success' && "bg-gray-900/80 border-gray-800 text-gray-300",
                      event.status === 'running' && "bg-emerald-950/30 border-emerald-700 text-emerald-200 animate-pulse",
                      event.status === 'warning' && "bg-amber-950/30 border-amber-800 text-amber-200",
                      event.status === 'error' && "bg-rose-950/30 border-rose-800 text-rose-200"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 font-bold">
                        <span className={cn(
                          "w-2 h-2 rounded-full",
                          event.status === 'success' && "bg-emerald-400",
                          event.status === 'running' && "bg-amber-400 animate-ping",
                          event.status === 'warning' && "bg-amber-400",
                          event.status === 'error' && "bg-rose-400"
                        )} />
                        <span className="text-gray-100">{event.step}</span>
                      </div>

                      <div className="flex items-center space-x-1.5 text-[9px] text-gray-500">
                        {event.durationMs && (
                          <span className="text-cyan-400 font-semibold">{event.durationMs}ms</span>
                        )}
                        {event.tokensUsed && (
                          <span className="text-purple-400 font-semibold">{event.tokensUsed}t</span>
                        )}
                        <span>
                          {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 text-[10px] text-emerald-400">
                      <span>action:</span>
                      <strong className="text-gray-200">{event.action}</strong>
                      {event.toolUsed && (
                        <span className="text-cyan-400 bg-gray-950 px-1 rounded border border-gray-800">
                          tool: {event.toolUsed}
                        </span>
                      )}
                    </div>

                    <p className="text-[10px] text-gray-400 leading-snug">
                      {event.details}
                    </p>
                  </div>
                ))}

                <div ref={traceEndRef} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

