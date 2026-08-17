import React, { useState, useRef, useEffect } from 'react';
import { useSimulation } from '../hooks/useSimulation';
import { 
  Send, Sparkles, Bot, User, CheckCircle2, ArrowRight, RefreshCw, 
  Trash2, Sliders, Shield, Zap, Database, Cpu, Layers, HelpCircle,
  Code2, Check, AlertCircle, Terminal, Flame, Info, Clock
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { DecisionCard, DecisionCardOption, DualityMessage } from '../types';

const AVAILABLE_ROLES = [
  { id: 'System Architect', label: 'System Architect', agentId: 'a5', icon: Layers, desc: 'High-level system decomposition and AST contracts' },
  { id: 'Technical Lead', label: 'Technical Lead', agentId: 'a1', icon: Cpu, desc: 'Engineering architecture and code structure standards' },
  { id: 'Security Architect', label: 'Security Architect', agentId: 'a2', icon: Shield, desc: 'Zero-trust boundaries, RBAC, and threat modeling' },
  { id: 'Database Architect', label: 'Database Architect', agentId: 'a7', icon: Database, desc: 'Schema topology, indexing, and ACID constraints' },
  { id: 'Product Strategist', label: 'Product Strategist', agentId: 'a9', icon: Zap, desc: 'User journeys, feature specifications, and SLA criteria' },
];

const AVAILABLE_MODELS = [
  { id: 'claude-3-7-sonnet', name: 'Claude 3.7 Sonnet', provider: 'Anthropic', tag: 'Hybrid Thinking' },
  { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', tag: 'Architect' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', tag: 'Omni' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'Google', tag: 'Fast' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'Google', tag: 'Large Context' },
  { id: 'qwen2.5-coder:latest', name: 'Qwen 2.5 Coder 32B', provider: 'OpenCode', tag: 'Code Specialist' },
  { id: 'deepseek-r1', name: 'DeepSeek R1', provider: 'DeepSeek', tag: 'Reasoning' }
];

const STARTER_PROMPTS = [
  'Design a high-throughput event buffer for telemetry data with sub-5ms latency.',
  'Specify a zero-trust JWT authentication and RBAC session architecture.',
  'Architect a real-time WebSocket state coordinator with optimistic local mutations.',
  'Create a modular GraphQL & REST hybrid API gateway specification.'
];

export function DualityIntentPanel() {
  const { 
    dualityState, 
    setDualityPrimaryRole, 
    sendDualityUserPrompt, 
    selectDualityDecisionCardOption, 
    clearDualityChat,
    activeAgents
  } = useSimulation();

  const [inputPrompt, setInputPrompt] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const primaryRole = dualityState.primaryRole || 'System Architect';
  const primaryModel = dualityState.primaryModel || 'claude-3-7-sonnet';
  const isExecuting = dualityState.isExecuting;
  const messages = dualityState.userMessages || [];

  // Scroll to bottom of message list on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isExecuting]);

  const handleSend = () => {
    if (!inputPrompt.trim() || isExecuting) return;
    sendDualityUserPrompt(inputPrompt.trim());
    setInputPrompt('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleRoleChange = (newRole: string) => {
    const roleObj = AVAILABLE_ROLES.find(r => r.id === newRole);
    setDualityPrimaryRole(newRole, primaryModel, roleObj?.agentId);
  };

  const handleModelChange = (newModel: string) => {
    setDualityPrimaryRole(primaryRole, newModel, dualityState.primaryAgentId);
  };

  return (
    <div id="duality-intent-panel" className="flex-1 flex flex-col h-full bg-gray-900 border-r border-gray-800 overflow-hidden">
      {/* Top Header: Role & Model Selector Combo */}
      <div className="p-3 border-b border-gray-800 bg-gray-950/70 shrink-0 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
            </span>
            <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              1:1 Operator Intent
            </span>
            <span className="text-[10px] font-mono bg-indigo-950/80 text-indigo-300 border border-indigo-800/80 px-2 py-0.5 rounded font-semibold">
              Duality Channel
            </span>
            <span 
              id="duality-autosave-indicator"
              className="inline-flex items-center space-x-1 text-[10px] font-mono bg-emerald-950/70 text-emerald-300 border border-emerald-800/60 px-1.5 py-0.5 rounded"
              title="Session auto-saved to localStorage. Automatically resumes after page refresh."
            >
              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
              <span>Auto-Saved</span>
            </span>
            {dualityState.performanceMetrics?.primary && (
              <span className="hidden sm:inline-flex items-center space-x-1 text-[10px] font-mono bg-gray-950 text-indigo-300 border border-indigo-900/60 px-1.5 py-0.5 rounded">
                <Clock className="w-2.5 h-2.5 text-indigo-400" />
                <span>{dualityState.performanceMetrics.primary.lastLatencyMs}ms</span>
              </span>
            )}
          </div>

          <button
            onClick={() => clearDualityChat()}
            className="text-[11px] text-gray-400 hover:text-gray-200 hover:bg-gray-800 px-2 py-1 rounded transition-colors flex items-center space-x-1"
            title="Clear operator conversation history"
          >
            <Trash2 className="w-3 h-3 text-gray-500" />
            <span>Clear Chat</span>
          </button>
        </div>

        {/* Role & Model Combo Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-gray-900/90 p-2 rounded-lg border border-gray-800">
          {/* Primary Role Selector */}
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center space-x-1">
              <Bot className="w-3 h-3 text-blue-400" />
              <span>Primary Role</span>
            </label>
            <select
              id="duality-primary-role-select"
              value={primaryRole}
              onChange={(e) => handleRoleChange(e.target.value)}
              className="w-full bg-gray-950 border border-gray-700 text-gray-200 text-xs rounded-md px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 font-medium"
            >
              {AVAILABLE_ROLES.map(role => (
                <option key={role.id} value={role.id}>
                  {role.label} ({role.desc.slice(0, 28)}...)
                </option>
              ))}
            </select>
          </div>

          {/* Primary Model Selector */}
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center space-x-1">
              <Cpu className="w-3 h-3 text-purple-400" />
              <span>Inference Model</span>
            </label>
            <select
              id="duality-primary-model-select"
              value={primaryModel}
              onChange={(e) => handleModelChange(e.target.value)}
              className="w-full bg-gray-950 border border-gray-700 text-gray-200 text-xs rounded-md px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 font-medium"
            >
              {AVAILABLE_MODELS.map(model => (
                <option key={model.id} value={model.id}>
                  {model.name} [{model.tag}]
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Conversation Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex flex-col space-y-1.5 max-w-[92%]",
              msg.sender === 'user' ? "ml-auto items-end" : "mr-auto items-start"
            )}
          >
            {/* Sender Badge */}
            <div className="flex items-center space-x-1.5 text-[11px] text-gray-400">
              {msg.sender === 'user' ? (
                <>
                  <span className="font-semibold text-blue-300">Operator</span>
                  <div className="w-4 h-4 rounded bg-blue-600/80 flex items-center justify-center text-[9px] text-white font-bold">
                    U
                  </div>
                </>
              ) : (
                <>
                  <div className="w-4 h-4 rounded bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-[9px] text-white font-bold">
                    A
                  </div>
                  <span className="font-semibold text-indigo-300">{msg.role || primaryRole}</span>
                  <span className="text-[9px] font-mono bg-gray-800 text-gray-400 px-1 rounded">
                    {msg.model || primaryModel}
                  </span>
                </>
              )}
              <span className="text-[10px] text-gray-500 font-mono">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {/* Message Bubble */}
            <div
              className={cn(
                "p-3.5 rounded-xl text-sm leading-relaxed border shadow-sm break-words",
                msg.sender === 'user'
                  ? "bg-blue-900/40 border-blue-700/60 text-blue-100 rounded-tr-none"
                  : "bg-gray-800/80 border-gray-700 text-gray-200 rounded-tl-none space-y-3"
              )}
            >
              {/* Formatted Content */}
              <div className="whitespace-pre-wrap">
                {msg.content}
              </div>

              {/* Interactive Decision Cards */}
              {msg.decisionCards && msg.decisionCards.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-gray-700/60">
                  {msg.decisionCards.map((card) => (
                    <div
                      key={card.id}
                      className={cn(
                        "p-3 rounded-lg border transition-all",
                        card.status === 'resolved'
                          ? "bg-emerald-950/30 border-emerald-800/60"
                          : "bg-gray-900/90 border-indigo-900/70 ring-1 ring-indigo-500/20"
                      )}
                    >
                      {/* Card Header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                          <span className="text-xs font-bold text-gray-100">{card.title}</span>
                        </div>
                        <span className={cn(
                          "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded font-mono border",
                          card.status === 'resolved'
                            ? "bg-emerald-950 text-emerald-300 border-emerald-700"
                            : "bg-indigo-950 text-indigo-300 border-indigo-700 animate-pulse"
                        )}>
                          {card.status === 'resolved' ? 'Resolved' : 'Decision Required'}
                        </span>
                      </div>

                      <p className="text-xs text-gray-400 mb-3">{card.description}</p>

                      {/* Card Options */}
                      <div className="space-y-2">
                        {card.options.map((opt) => {
                          const isSelected = card.selectedOptionId === opt.id;
                          return (
                            <div
                              key={opt.id}
                              onClick={() => {
                                if (card.status !== 'resolved' && !isExecuting) {
                                  selectDualityDecisionCardOption(msg.id, card.id, opt.id);
                                }
                              }}
                              className={cn(
                                "p-2.5 rounded-md border text-left transition-all relative group",
                                card.status === 'resolved'
                                  ? isSelected
                                    ? "bg-emerald-900/40 border-emerald-500 text-emerald-100"
                                    : "bg-gray-950/40 border-gray-800 text-gray-500 opacity-60"
                                  : isSelected
                                    ? "bg-indigo-900/60 border-indigo-400 text-white"
                                    : "bg-gray-950/80 border-gray-800 hover:border-indigo-500/80 hover:bg-gray-900 text-gray-200 cursor-pointer"
                              )}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2 font-semibold text-xs">
                                  <span className={cn(
                                    "w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold border",
                                    isSelected
                                      ? "bg-emerald-500 text-gray-950 border-emerald-400"
                                      : "border-gray-600 text-gray-400 group-hover:border-indigo-400 group-hover:text-indigo-300"
                                  )}>
                                    {isSelected ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : ''}
                                  </span>
                                  <span>{opt.label}</span>
                                </div>

                                {opt.recommended && (
                                  <span className="text-[9px] bg-amber-950 text-amber-300 border border-amber-800 px-1.5 py-0.2 rounded font-mono font-bold">
                                    Recommended
                                  </span>
                                )}
                              </div>

                              <p className="text-[11px] text-gray-400 mt-1 pl-6 leading-snug">
                                {opt.description}
                              </p>

                              {/* Impact metrics */}
                              {opt.impact && (
                                <div className="mt-2 pl-6 flex flex-wrap gap-2 text-[10px] font-mono text-gray-400">
                                  {opt.impact.latency && (
                                    <span className="bg-gray-900 px-1.5 py-0.5 rounded border border-gray-800">
                                      Latency: <strong className="text-gray-200">{opt.impact.latency}</strong>
                                    </span>
                                  )}
                                  {opt.impact.complexity && (
                                    <span className="bg-gray-900 px-1.5 py-0.5 rounded border border-gray-800">
                                      Complexity: <strong className="text-gray-200">{opt.impact.complexity}</strong>
                                    </span>
                                  )}
                                  {opt.impact.security && (
                                    <span className="bg-gray-900 px-1.5 py-0.5 rounded border border-gray-800">
                                      Security: <strong className="text-emerald-400">{opt.impact.security}</strong>
                                    </span>
                                  )}
                                  {opt.impact.resilience && (
                                    <span className="bg-gray-900 px-1.5 py-0.5 rounded border border-gray-800">
                                      Resilience: <strong className="text-blue-400">{opt.impact.resilience}</strong>
                                    </span>
                                  )}
                                </div>
                              )}

                              {card.status !== 'resolved' && (
                                <div className="mt-2 pl-6 flex justify-end">
                                  <span className="text-[10px] font-bold text-indigo-400 group-hover:text-indigo-300 flex items-center space-x-1">
                                    <span>Adopt & Dispatch to Builder</span>
                                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Thinking / Synthesizing Indicator */}
        {isExecuting && (
          <div className="flex flex-col space-y-1.5 max-w-[85%] mr-auto items-start">
            <div className="flex items-center space-x-1.5 text-[11px] text-gray-400">
              <div className="w-4 h-4 rounded bg-indigo-600 flex items-center justify-center text-[9px] text-white font-bold animate-pulse">
                A
              </div>
              <span className="font-semibold text-indigo-300">{primaryRole}</span>
              <span className="text-[9px] font-mono bg-gray-800 text-gray-400 px-1 rounded">
                Synthesizing...
              </span>
            </div>
            <div className="p-3 bg-gray-800/80 border border-indigo-700/60 rounded-xl rounded-tl-none text-xs text-indigo-200 flex items-center space-x-2">
              <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
              <span>Analyzing requirements, assessing risk matrix & synthesizing decision options...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Starter Prompts Bar */}
      <div className="px-3 py-1.5 border-t border-gray-800/80 bg-gray-950/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
        <span className="text-[10px] font-bold text-gray-500 shrink-0 uppercase tracking-wider">Quick Prompts:</span>
        {STARTER_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => {
              setInputPrompt(prompt);
              textareaRef.current?.focus();
            }}
            className="text-[11px] whitespace-nowrap bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-800 hover:border-indigo-500/50 px-2 py-1 rounded transition-colors"
          >
            {prompt.slice(0, 36)}...
          </button>
        ))}
      </div>

      {/* Input Composer Area */}
      <div className="p-3 border-t border-gray-800 bg-gray-950/90 shrink-0">
        <div className="relative bg-gray-900 border border-gray-700 rounded-xl focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/40 transition-all shadow-inner">
          <textarea
            ref={textareaRef}
            id="duality-user-intent-input"
            rows={2}
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Type architecture intent, requirements, or instructions for ${primaryRole}...`}
            className="w-full bg-transparent text-gray-100 text-xs p-3 pr-24 resize-none focus:outline-none placeholder-gray-500"
          />

          <div className="absolute right-2 bottom-2 flex items-center space-x-1.5">
            <button
              id="duality-send-intent-btn"
              onClick={handleSend}
              disabled={!inputPrompt.trim() || isExecuting}
              className={cn(
                "flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all",
                inputPrompt.trim() && !isExecuting
                  ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/50"
                  : "bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700/50"
              )}
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mt-2 text-[10px] text-gray-500 px-1">
          <span>Press <strong>Enter</strong> to send, <strong>Shift+Enter</strong> for newline</span>
          <span className="font-mono text-indigo-400">1:1 Role Pairing • Decision Card Enabled</span>
        </div>
      </div>
    </div>
  );
}
