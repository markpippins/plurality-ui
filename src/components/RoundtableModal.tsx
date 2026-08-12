import React, { useState } from 'react';
import { useSimulation } from '../hooks/useSimulation';
import { AgentVote } from '../types';
import { 
  X, Users, CheckCircle2, ShieldAlert, Sparkles, RefreshCw, 
  HelpCircle, AlertTriangle, ArrowRight, ThumbsUp, ThumbsDown, Vote
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const PRESET_TOPICS = [
  'Approve Current WorkRequest & PlanIR Strategy',
  'Security Boundary & Risk Mitigation Check',
  'Database Schema & Data Persistence Strategy',
  'Code Architecture & React Hook Modular Structure',
  'Final Release Signoff & QA Test Coverage'
];

export function RoundtableModal() {
  const { 
    isRoundtableOpen, closeRoundtableModal, roundtableSession, 
    triggerRoundtableVote, activeAgents, activeWorkRequest, BackendService
  } = useSimulation();

  const [customTopic, setCustomTopic] = useState('');
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>(['a1', 'a2', 'a3', 'a4']);

  if (!isRoundtableOpen) return null;

  const currentTopic = roundtableSession?.topic || (activeWorkRequest ? `Approve WorkRequest: "${activeWorkRequest.intent}"` : PRESET_TOPICS[0]);
  const isVoting = roundtableSession?.status === 'voting';
  const votes = roundtableSession?.votes || [];

  const handleStartVote = (topicToUse?: string) => {
    const topic = topicToUse || customTopic || currentTopic;
    triggerRoundtableVote(topic, undefined, selectedParticipantIds);
  };

  const toggleAgentSelection = (agentId: string) => {
    setSelectedParticipantIds(prev => {
      if (prev.includes(agentId)) {
        if (prev.length === 1) return prev; // Keep at least 1 agent selected
        return prev.filter(id => id !== agentId);
      } else {
        return [...prev, agentId];
      }
    });
  };

  const getVoteBadge = (vote: AgentVote['vote']) => {
    switch (vote) {
      case 'approve':
        return {
          label: 'APPROVE',
          bg: 'bg-green-950/80 text-green-300 border-green-700/80',
          icon: <ThumbsUp className="w-3.5 h-3.5 text-green-400" />
        };
      case 'reject':
        return {
          label: 'REJECT',
          bg: 'bg-red-950/80 text-red-300 border-red-700/80',
          icon: <ThumbsDown className="w-3.5 h-3.5 text-red-400" />
        };
      case 'conditional':
        return {
          label: 'CONDITIONAL',
          bg: 'bg-amber-950/80 text-amber-300 border-amber-700/80',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
        };
      case 'abstain':
      default:
        return {
          label: 'ABSTAIN',
          bg: 'bg-gray-800 text-gray-400 border-gray-700',
          icon: <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
        };
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-md">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-gray-100"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-800 bg-gray-900/90 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-400">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-base font-bold text-gray-100 tracking-wide">
                    Agent Roundtable Consensus
                  </h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800">
                    Plurality Protocol v2.4
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  Trigger a multi-agent vote between Planner, Critic, Coder & Validator to establish consensus on key decisions.
                </p>
              </div>
            </div>

            <button 
              onClick={closeRoundtableModal}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Topic Selector & Launch */}
            <div className="bg-gray-950/60 border border-gray-800 rounded-lg p-4 space-y-3">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Consensus Topic / Task
              </label>

              <div className="flex space-x-2">
                <input 
                  type="text"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  placeholder={`Default: "${currentTopic}"`}
                  className="flex-1 bg-gray-900 border border-gray-700/80 rounded-md px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button
                  onClick={() => handleStartVote()}
                  disabled={isVoting}
                  className={cn(
                    "px-4 py-2 rounded-md font-medium text-sm flex items-center space-x-2 transition-all shadow-md shrink-0",
                    isVoting 
                      ? "bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700" 
                      : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border border-blue-500/40"
                  )}
                >
                  {isVoting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                      <span>Voting in Progress...</span>
                    </>
                  ) : (
                    <>
                      <Vote className="w-4 h-4" />
                      <span>Convene Roundtable Vote</span>
                    </>
                  )}
                </button>
              </div>

              {/* Quick Presets */}
              <div className="pt-1">
                <span className="text-[11px] text-gray-500 font-medium block mb-1.5">Quick Presets:</span>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_TOPICS.map((topic) => (
                    <button
                      key={topic}
                      onClick={() => {
                        setCustomTopic(topic);
                        handleStartVote(topic);
                      }}
                      disabled={isVoting}
                      className="text-xs bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 text-gray-300 px-2.5 py-1 rounded transition-colors"
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>

              {/* Participating Agent Subset Selection */}
              <div className="space-y-2 pt-3 border-t border-gray-800/80">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center space-x-1.5">
                    <Users className="w-3.5 h-3.5 text-blue-400" />
                    <span>Participating Consensus Agents ({selectedParticipantIds.length}/{activeAgents.length})</span>
                  </label>

                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedParticipantIds(activeAgents.map(a => a.id))}
                      disabled={isVoting}
                      className="text-[10px] font-mono text-blue-300 hover:text-blue-200 bg-blue-950/60 hover:bg-blue-900/70 px-2 py-0.5 rounded border border-blue-800/80 transition-colors"
                    >
                      All Agents ({activeAgents.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedParticipantIds(['a1', 'a2'])}
                      disabled={isVoting}
                      className="text-[10px] font-mono text-purple-300 hover:text-purple-200 bg-purple-950/60 hover:bg-purple-900/70 px-2 py-0.5 rounded border border-purple-800/80 transition-colors"
                    >
                      Architects (Planner & Critic)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedParticipantIds(['a3', 'a4'])}
                      disabled={isVoting}
                      className="text-[10px] font-mono text-emerald-300 hover:text-emerald-200 bg-emerald-950/60 hover:bg-emerald-900/70 px-2 py-0.5 rounded border border-emerald-800/80 transition-colors"
                    >
                      Builders (Coder & QA)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[...activeAgents]
                    .sort((a, b) => a.role.localeCompare(b.role, undefined, { sensitivity: 'base' }))
                    .map(agent => {
                    const isSelected = selectedParticipantIds.includes(agent.id);
                    return (
                      <button
                        key={agent.id}
                        type="button"
                        onClick={() => toggleAgentSelection(agent.id)}
                        disabled={isVoting}
                        className={cn(
                          "p-2.5 rounded-lg border text-left transition-all flex items-center space-x-2.5",
                          isSelected 
                            ? "bg-blue-950/50 border-blue-500/80 text-gray-100 shadow-sm" 
                            : "bg-gray-900/60 border-gray-800 text-gray-500 hover:border-gray-700 opacity-60"
                        )}
                      >
                        <div className={cn(
                          "w-4 h-4 rounded flex items-center justify-center border shrink-0 text-[10px]",
                          isSelected ? "bg-blue-600 border-blue-400 text-white font-bold" : "border-gray-700 bg-gray-950"
                        )}>
                          {isSelected && '✓'}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold truncate">{agent.name}</div>
                          <div className="text-[10px] font-mono text-gray-400 truncate uppercase">{agent.role}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Current Active Roundtable Status Banner */}
            {roundtableSession && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-gray-950/80 p-4 rounded-lg border border-gray-800 gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest block">
                        Active Consensus Session
                      </span>
                      {roundtableSession.participantAgentIds && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800/80">
                          Subset: {roundtableSession.participantAgentIds.length}/{activeAgents.length} Agents
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-gray-100 mt-0.5">
                      {roundtableSession.topic}
                    </h3>
                  </div>

                  {/* Gauge */}
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <span className="text-xs text-gray-400 block">Approval Rate</span>
                      <span className={cn(
                        "text-lg font-bold font-mono",
                        roundtableSession.approvalRate >= 75 ? "text-green-400" : roundtableSession.approvalRate >= 50 ? "text-amber-400" : "text-red-400"
                      )}>
                        {roundtableSession.approvalRate}%
                      </span>
                    </div>

                    <div className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border flex items-center space-x-1.5",
                      roundtableSession.status === 'passed' ? "bg-green-950/80 text-green-300 border-green-800" :
                      roundtableSession.status === 'rejected' ? "bg-red-950/80 text-red-300 border-red-800" :
                      "bg-blue-950/80 text-blue-300 border-blue-800 animate-pulse"
                    )}>
                      {roundtableSession.status === 'passed' && <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />}
                      {roundtableSession.status === 'rejected' && <ShieldAlert className="w-3.5 h-3.5 text-red-400" />}
                      {roundtableSession.status === 'voting' && <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />}
                      <span>{roundtableSession.status.toUpperCase()}</span>
                    </div>
                  </div>
                </div>

                {/* Agent Vote Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[...activeAgents]
                    .sort((a, b) => a.role.localeCompare(b.role, undefined, { sensitivity: 'base' }))
                    .map((agent) => {
                    const isParticipant = !roundtableSession.participantAgentIds || roundtableSession.participantAgentIds.includes(agent.id);
                    const agentVote = votes.find(v => v.agentId === agent.id);
                    const badge = agentVote ? getVoteBadge(agentVote.vote) : null;

                    if (!isParticipant) {
                      return (
                        <div 
                          key={agent.id}
                          className="p-4 rounded-xl border border-gray-800/60 bg-gray-950/30 opacity-40 flex flex-col justify-between space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-9 h-9 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center text-xs font-bold text-gray-500">
                                {agent.name[0]}
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-gray-400">{agent.name}</h4>
                                <span className="text-[10px] uppercase tracking-widest text-gray-600 block">
                                  {agent.role}
                                </span>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-900 text-gray-500 border border-gray-800">
                              EXCLUDED FROM SUBSET
                            </span>
                          </div>
                          <div className="text-[11px] text-gray-500 italic py-1">
                            Agent was omitted from participating in this specific consensus vote.
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div 
                        key={agent.id}
                        className={cn(
                          "p-4 rounded-xl border bg-gray-950/60 transition-all flex flex-col justify-between space-y-3",
                          agentVote ? "border-gray-700/80 shadow-md" : "border-gray-800 opacity-60"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {agent.avatarUrl ? (
                              <img 
                                src={agent.avatarUrl} 
                                alt={agent.name} 
                                referrerPolicy="no-referrer"
                                className="w-10 h-10 rounded-full object-cover border border-gray-700 shadow-sm"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-sm font-bold text-gray-300">
                                {agent.name[0]}
                              </div>
                            )}

                            <div>
                              <div className="flex items-center space-x-2">
                                <h4 className="text-sm font-bold text-gray-100">{agent.name}</h4>
                                <span className="text-[10px] text-gray-400 bg-gray-900 border border-gray-800 px-1.5 py-0.2 rounded font-mono">
                                  {agent.model}
                                </span>
                              </div>
                              <span className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold block">
                                {agent.role}
                              </span>
                            </div>
                          </div>

                          {badge ? (
                            <div className={cn("px-2.5 py-1 rounded-md text-xs font-bold border flex items-center space-x-1.5", badge.bg)}>
                              {badge.icon}
                              <span>{badge.label}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500 italic flex items-center space-x-1">
                              <RefreshCw className="w-3 h-3 animate-spin text-gray-600" />
                              <span>Evaluating...</span>
                            </span>
                          )}
                        </div>

                        {/* Reasoning & Confidence */}
                        {agentVote ? (
                          <div className="space-y-2 pt-2 border-t border-gray-800/80">
                            <p className="text-xs text-gray-300 leading-relaxed font-sans bg-gray-900/60 p-2.5 rounded border border-gray-850">
                              "{agentVote.reasoning}"
                            </p>

                            {agentVote.suggestedAlternative && (
                              <div className="text-[11px] text-amber-300/90 bg-amber-950/40 p-2 rounded border border-amber-900/40 flex items-start space-x-1.5">
                                <Sparkles className="w-3 h-3 mt-0.5 shrink-0 text-amber-400" />
                                <span><strong>Suggestion:</strong> {agentVote.suggestedAlternative}</span>
                              </div>
                            )}

                            <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 pt-1">
                              <span>Confidence Score</span>
                              <span className="font-bold text-blue-400">{Math.round(agentVote.confidence * 100)}%</span>
                            </div>
                            <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500 rounded-full transition-all duration-500" 
                                style={{ width: `${agentVote.confidence * 100}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="py-4 text-center text-xs text-gray-600 font-mono">
                            Awaiting vote payload...
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-gray-800 bg-gray-900/90 flex items-center justify-between shrink-0">
            <div className="text-xs text-gray-400">
              {roundtableSession?.consensusSummary || 'Select or enter a task to convene the agent roundtable.'}
            </div>

            <div className="flex space-x-3">
              {roundtableSession?.status === 'passed' && activeWorkRequest && activeWorkRequest.status === 'APPROVAL' && (
                <button
                  onClick={() => {
                    BackendService.approvePlan(activeWorkRequest.id);
                    closeRoundtableModal();
                  }}
                  className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-xs font-semibold rounded-md transition-colors flex items-center space-x-1.5 shadow-md"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Enforce Consensus & Advance Plan</span>
                </button>
              )}

              <button
                onClick={closeRoundtableModal}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold rounded-md transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
