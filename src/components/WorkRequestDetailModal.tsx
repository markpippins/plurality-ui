import React, { useState, useEffect } from 'react';
import { useSimulation } from '../hooks/useSimulation';
import { 
  X, Copy, Check, FileText, Code, Shield, CheckCircle2, AlertTriangle, 
  Layers, GitFork, Cpu, Terminal, Sparkles, Folder, ArrowRight, Activity, 
  ExternalLink, Download, ListChecks, Hash, Clock, UserCheck, TrendingUp, BarChart2,
  AlertCircle, Zap, GitBranch, GitCommit, GitMerge, FolderTree, Share2, CornerDownRight,
  ChevronDown, ChevronRight, Box, RefreshCw, Network, PlayCircle, Search, Filter, RotateCcw, Home, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { WorkRequest, WorkRequestDetail, buildDefaultWorkRequestDetail } from '../types';
import { TaskLifecycleTrendsChart } from './TaskLifecycleTrendsChart';

export function WorkRequestDetailModal() {
  const { 
    isWorkRequestDetailOpen, 
    closeWorkRequestDetailModal, 
    selectedWorkRequestForDetail,
    activeWorkRequest,
    workRequests,
    openWorkRequestDetailModal,
    agentLogs
  } = useSimulation();

  const [activeTab, setActiveTab] = useState<'overview' | 'telemetry' | 'plan' | 'requirements' | 'validation' | 'lineage' | 'activity' | 'json'>('overview');
  const [copiedId, setCopiedId] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [hoveredBucketIdx, setHoveredBucketIdx] = useState<number | null>(null);
  const [selectedBucketIdx, setSelectedBucketIdx] = useState<number | null>(null);
  const [activityLogLevel, setActivityLogLevel] = useState<'all' | 'info' | 'success' | 'warn' | 'error'>('all');
  const [activitySearch, setActivitySearch] = useState('');
  const [timestampMode, setTimestampMode] = useState<'relative' | 'absolute'>('relative');
  const [sparklineMetric, setSparklineMetric] = useState<'throughput' | 'latency'>('throughput');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [lineageViewMode, setLineageViewMode] = useState<'tree' | 'graph'>('tree');
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({ parents: true, current: true, children: true });

  // Fallback to active work request if selected is null
  const currentWr: WorkRequest | null = selectedWorkRequestForDetail || activeWorkRequest;

  // Ensure detail structure exists
  const detail: WorkRequestDetail | null = currentWr 
    ? (currentWr.detail || buildDefaultWorkRequestDetail(currentWr.id, currentWr.intent, currentWr.status))
    : null;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isWorkRequestDetailOpen) {
        closeWorkRequestDetailModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isWorkRequestDetailOpen, closeWorkRequestDetailModal]);

  if (!isWorkRequestDetailOpen || !currentWr || !detail) return null;

  // System & Parent hierarchy calculation for Breadcrumb Navigation Trail
  const parentIds = detail.lineage.derived_from || [];
  const breadcrumbParents = parentIds.map(pId => {
    const match = workRequests.find(w => w.id === pId || w.id === `wr-${pId}`);
    return {
      id: pId.startsWith('wr-') ? pId : `wr-${pId}`,
      rawId: pId,
      title: match ? match.intent : `Parent Spec Blueprint ${pId}`,
      status: match ? (match.detail?.execution_state?.status || 'completed') : 'completed',
      realWr: match || null
    };
  });

  if (breadcrumbParents.length === 0) {
    breadcrumbParents.push({
      id: 'wr-0133',
      rawId: '0133',
      title: 'Root Architectural Intent & System IR Spec',
      status: 'completed',
      realWr: workRequests.find(w => w.id === '0133' || w.id === 'wr-0133') || null
    });
  }

  const copyToClipboard = (text: string, type: 'id' | 'json') => {
    navigator.clipboard.writeText(text);
    if (type === 'id') {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } else {
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    }
  };

  const downloadJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(detail, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${detail.id}_work_request.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getNodeStatusBadge = (st: string) => {
    switch (st ? st.toLowerCase() : '') {
      case 'completed':
        return { bg: 'bg-emerald-950/80 text-emerald-400 border-emerald-800', icon: CheckCircle2, label: 'completed' };
      case 'running':
      case 'exec':
        return { bg: 'bg-blue-950/80 text-blue-400 border-blue-800 animate-pulse', icon: PlayCircle, label: 'running' };
      case 'failed':
        return { bg: 'bg-rose-950/80 text-rose-400 border-rose-800', icon: AlertCircle, label: 'failed' };
      default:
        return { bg: 'bg-amber-950/80 text-amber-400 border-amber-800', icon: Clock, label: 'pending' };
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
        return 'bg-emerald-950 text-emerald-300 border-emerald-800';
      case 'running':
      case 'in_progress':
      case 'exec':
        return 'bg-blue-950 text-blue-300 border-blue-800 animate-pulse';
      case 'pending':
      case 'plan':
        return 'bg-amber-950 text-amber-300 border-amber-800';
      case 'failed':
      case 'error':
        return 'bg-rose-950 text-rose-300 border-rose-800';
      default:
        return 'bg-gray-800 text-gray-300 border-gray-700';
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div 
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="relative w-full max-w-5xl max-h-[90vh] bg-gray-900 border border-gray-800 rounded-xl shadow-2xl flex flex-col overflow-hidden text-gray-200"
        >
          {/* Top Modal Header */}
          <div className="px-6 py-4 bg-gray-950/90 border-b border-gray-800 flex items-start justify-between shrink-0">
            <div className="space-y-1.5 max-w-3xl">
              <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
                <span className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
                  <FileText className="w-4 h-4" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Work Request Detail</span>
                <div className="flex items-center space-x-1 bg-gray-900 px-2 py-0.5 rounded border border-gray-800 text-xs font-mono text-gray-300">
                  <span>{detail.id}</span>
                  <button 
                    onClick={() => copyToClipboard(detail.id, 'id')}
                    className="p-1 hover:text-white text-gray-400 transition-colors"
                    title="Copy Request ID"
                  >
                    {copiedId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>

                <span className={cn("text-[11px] px-2 py-0.5 rounded border font-semibold uppercase tracking-wider", getStatusBadgeClass(detail.execution_state.status))}>
                  Status: {detail.execution_state.status}
                </span>

                <span className="text-[11px] px-2 py-0.5 rounded border border-indigo-800/80 bg-indigo-950/80 text-indigo-300 font-semibold uppercase tracking-wider">
                  Stage: {currentWr.status}
                </span>

                <span className="text-[11px] px-2 py-0.5 rounded border border-cyan-800/80 bg-cyan-950/80 text-cyan-300 font-semibold uppercase tracking-wider">
                  Domain: {detail.intent.domain}
                </span>

                {detail.intent.priority && (
                  <span className="text-[11px] px-2 py-0.5 rounded border border-purple-800/80 bg-purple-950/80 text-purple-300 font-semibold uppercase tracking-wider">
                    Priority: {detail.intent.priority}
                  </span>
                )}
              </div>

              <h2 className="text-base sm:text-lg font-semibold text-gray-100 leading-snug">
                {detail.intent.desired_outcome || detail.intent.problem_statement}
              </h2>
            </div>

            <button
              onClick={closeWorkRequestDetailModal}
              className="p-1.5 rounded-lg bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Breadcrumb Navigation Trail Bar */}
          <div className="bg-gray-950 border-b border-gray-800/80 px-6 py-2 flex items-center space-x-2 text-xs text-gray-400 overflow-x-auto font-mono shrink-0 scrollbar-none shadow-inner">
            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider shrink-0 mr-1 flex items-center gap-1 font-sans">
              <Network className="w-3 h-3 text-purple-400" />
              <span>Hierarchy:</span>
            </span>

            {/* Level 1: System / Workspace Root */}
            <div className="flex items-center space-x-1 shrink-0 text-gray-300 hover:text-white transition-colors">
              <Home className="w-3.5 h-3.5 text-purple-400" />
              <span className="font-semibold tracking-wide">Workspace</span>
            </div>

            <ChevronRight className="w-3.5 h-3.5 text-gray-600 shrink-0" />

            {/* Level 2: System Domain */}
            <div className="flex items-center space-x-1 shrink-0 bg-gray-900/90 px-2 py-0.5 rounded border border-gray-800 text-cyan-300">
              <Folder className="w-3 h-3 text-cyan-400" />
              <span className="font-medium text-[11px]">{detail.intent.domain || 'system_core'}</span>
            </div>

            <ChevronRight className="w-3.5 h-3.5 text-gray-600 shrink-0" />

            {/* Level 3: Parent Spec Requests in Lineage */}
            {breadcrumbParents.map((parentItem, idx) => (
              <React.Fragment key={idx}>
                <button
                  onClick={() => {
                    if (parentItem.realWr) {
                      openWorkRequestDetailModal(parentItem.realWr);
                    } else {
                      setActiveTab('lineage');
                    }
                  }}
                  className={cn(
                    "flex items-center space-x-1.5 px-2 py-0.5 rounded border transition-all text-xs font-mono shrink-0 max-w-[210px] truncate group",
                    parentItem.realWr
                      ? "bg-purple-950/60 hover:bg-purple-900/80 border-purple-800/80 text-purple-200 hover:border-purple-500 cursor-pointer shadow-sm"
                      : "bg-gray-900 hover:bg-gray-800 border-gray-800 text-gray-300 cursor-pointer"
                  )}
                  title={parentItem.realWr ? `Navigate to Parent: ${parentItem.title}` : `Parent Spec ID: ${parentItem.id}`}
                >
                  <GitFork className="w-3 h-3 text-purple-400 shrink-0 group-hover:rotate-180 transition-transform duration-200" />
                  <span className="font-bold shrink-0">{parentItem.id}</span>
                  <span className="text-[10px] text-gray-400 group-hover:text-purple-200 truncate hidden sm:inline">
                    {parentItem.title}
                  </span>
                </button>

                <ChevronRight className="w-3.5 h-3.5 text-gray-600 shrink-0" />
              </React.Fragment>
            ))}

            {/* Level 4: Active Current Work Request */}
            <div className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-md bg-blue-950/90 border border-blue-500/70 text-blue-200 font-bold font-mono shrink-0 shadow-[0_0_10px_rgba(59,130,246,0.25)]">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <span>{detail.id}</span>
              <span className="text-[10px] text-blue-300 font-normal max-w-[180px] sm:max-w-[240px] truncate">
                ({detail.intent.desired_outcome || detail.intent.problem_statement})
              </span>
            </div>

            {/* Level 5: Active Step Execution (if in step execution state) */}
            {detail.execution_state.current_step && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                <div className="flex items-center space-x-1 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-[11px] font-mono shrink-0">
                  <Cpu className="w-3 h-3 text-emerald-400" />
                  <span>Step: {detail.execution_state.current_step}</span>
                </div>
              </>
            )}
          </div>

          {/* Quick Details Ribbon */}
          <div className="bg-gray-950/50 border-b border-gray-800/80 px-6 py-2.5 flex items-center justify-between text-xs text-gray-400 overflow-x-auto gap-4 shrink-0">
            <div className="flex items-center space-x-4 shrink-0">
              <div className="flex items-center space-x-1.5">
                <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-gray-500">Role:</span>
                <span className="font-mono text-gray-200">{detail.metadata.role} ({detail.metadata.agent_id})</span>
              </div>
              <div className="h-3 w-px bg-gray-800" />
              <div className="flex items-center space-x-1.5">
                <Cpu className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-gray-500">Backend:</span>
                <span className="font-mono text-gray-200">{detail.metadata.harness} / {detail.metadata.model}</span>
              </div>
              <div className="h-3 w-px bg-gray-800" />
              <div className="flex items-center space-x-1.5">
                <Folder className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-gray-500">Source Path:</span>
                <span className="font-mono text-gray-300 truncate max-w-[200px]">{detail.path}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={downloadJson}
                className="flex items-center space-x-1 px-2.5 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-medium transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-gray-400" />
                <span>Export JSON</span>
              </button>
            </div>
          </div>

          {/* Modal Tab Bar */}
          <div className="px-6 bg-gray-950/80 border-b border-gray-800 flex items-center space-x-1 overflow-x-auto shrink-0 pt-2">
            {[
              { id: 'overview', label: 'Title & Source', icon: FileText },
              { id: 'telemetry', label: 'Lifecycle Telemetry', icon: TrendingUp },
              { id: 'plan', label: 'Specification & Plan', icon: Layers },
              { id: 'requirements', label: 'Requirements & Safety', icon: Shield },
              { id: 'validation', label: 'Validation & Criteria', icon: ListChecks },
              { id: 'lineage', label: 'Parent / Children', icon: GitFork },
              { id: 'activity', label: 'Activity & State', icon: Activity },
              { id: 'json', label: 'Raw JSON', icon: Code },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "flex items-center space-x-2 px-3.5 py-2 text-xs font-medium rounded-t-lg transition-colors whitespace-nowrap border-b-2 -mb-px",
                    isActive 
                      ? "bg-gray-900 text-blue-400 border-blue-500 font-semibold" 
                      : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/40 border-transparent"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Modal Tab Content Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* TELEMETRY & LIFECYCLE TRENDS TAB */}
            {activeTab === 'telemetry' && (
              <div className="space-y-6">
                <TaskLifecycleTrendsChart initialTaskId={detail.id} />
              </div>
            )}

            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Problem Statement Card */}
                <div className="bg-gray-950/60 border border-gray-800 rounded-lg p-4 space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-blue-400">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Problem Statement / User Intent</span>
                  </div>
                  <p className="text-sm text-gray-200 leading-relaxed font-mono bg-gray-950 p-3 rounded border border-gray-800/80">
                    {detail.intent.problem_statement}
                  </p>
                </div>

                {/* Grid of Key Properties */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-gray-950/40 border border-gray-800 p-3.5 rounded-lg space-y-1">
                    <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Desired Outcome</span>
                    <p className="text-xs text-gray-200 font-medium">{detail.intent.desired_outcome}</p>
                  </div>

                  <div className="bg-gray-950/40 border border-gray-800 p-3.5 rounded-lg space-y-1">
                    <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Assigned Role & Agent</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-emerald-400 font-mono font-semibold">{detail.metadata.role}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-300 font-mono">ID: {detail.metadata.agent_id}</span>
                    </div>
                  </div>

                  <div className="bg-gray-950/40 border border-gray-800 p-3.5 rounded-lg space-y-1">
                    <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Execution Backend</span>
                    <p className="text-xs font-mono text-purple-300">{detail.metadata.harness} ({detail.metadata.model})</p>
                  </div>

                  <div className="bg-gray-950/40 border border-gray-800 p-3.5 rounded-lg space-y-1">
                    <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">User Intent Trace ID</span>
                    <p className="text-xs font-mono text-amber-300">{detail.intent.user_intent_trace || 'N/A'}</p>
                  </div>

                  <div className="bg-gray-950/40 border border-gray-800 p-3.5 rounded-lg space-y-1">
                    <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Abstraction Level</span>
                    <p className="text-xs text-gray-300 uppercase tracking-wide font-mono">{detail.intent.abstraction_level}</p>
                  </div>

                  <div className="bg-gray-950/40 border border-gray-800 p-3.5 rounded-lg space-y-1">
                    <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Session Identifier</span>
                    <p className="text-xs font-mono text-gray-300 truncate">{detail.metadata.session_id}</p>
                  </div>
                </div>

                {/* Source Path Section */}
                <div className="bg-gray-950/40 border border-gray-800 p-4 rounded-lg flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Source Workspace Path</span>
                    <p className="text-xs font-mono text-blue-300">{detail.path}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] px-2 py-1 rounded bg-gray-800 text-gray-300 font-mono">Mode: {detail.metadata.mode}</span>
                  </div>
                </div>

                {/* Tags */}
                {detail.metadata.tags && detail.metadata.tags.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Associated Tags</span>
                    <div className="flex flex-wrap gap-1.5">
                      {detail.metadata.tags.map((tag, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-700 text-xs font-mono">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SPECIFICATION & PLAN TAB */}
            {activeTab === 'plan' && (
              <div className="space-y-6">
                {/* Decomposition Strategy Header */}
                <div className="bg-gray-950/60 border border-gray-800 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
                      <Layers className="w-3.5 h-3.5" />
                      <span>Decomposition Strategy</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs">
                      <span className="text-gray-400">Parallelism:</span>
                      <span className="font-mono text-gray-200 uppercase">{detail.decomposition.parallelism_model}</span>
                      <span className="text-gray-600">•</span>
                      <span className="text-gray-400">Recursion Allowed:</span>
                      <span className={cn("font-bold", detail.decomposition.recursion_allowed ? "text-emerald-400" : "text-gray-400")}>
                        {detail.decomposition.recursion_allowed ? "YES" : "NO"}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-300 font-mono bg-gray-950 p-2.5 rounded border border-gray-800">
                    {detail.decomposition.strategy}
                  </p>
                </div>

                {/* Implementation Plan Steps */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center justify-between">
                    <span>Implementation Steps ({detail.decomposition.steps.length})</span>
                  </h3>

                  {detail.decomposition.steps.map((step, idx) => (
                    <div key={step.step_id || idx} className="bg-gray-950/50 border border-gray-800 rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-gray-800/80 pb-2">
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-mono text-xs font-bold">
                            {step.step_id}
                          </span>
                          <span className="text-xs text-gray-400 uppercase font-mono">Type: {step.type}</span>
                        </div>
                        {step.dependencies && step.dependencies.length > 0 && (
                          <div className="text-xs text-gray-400">
                            Deps: <span className="font-mono text-amber-300">{step.dependencies.join(', ')}</span>
                          </div>
                        )}
                      </div>

                      <pre className="text-xs text-gray-200 font-mono whitespace-pre-wrap leading-relaxed bg-gray-950 p-3 rounded border border-gray-800/60 overflow-x-auto">
                        {step.description}
                      </pre>

                      {step.outputs && step.outputs.length > 0 && (
                        <div className="flex items-center space-x-2 text-xs pt-1">
                          <span className="text-gray-400">Expected Outputs:</span>
                          {step.outputs.map((out, oIdx) => (
                            <span key={oIdx} className="px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800 font-mono text-[11px]">
                              {out}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* REQUIREMENTS & SAFETY TAB */}
            {activeTab === 'requirements' && (
              <div className="space-y-6">
                {/* Safety Constraints */}
                <div className="bg-gray-950/60 border border-gray-800 rounded-lg p-4 space-y-3">
                  <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                    <Shield className="w-4 h-4" />
                    <span>Safety Constraints & Rules ({detail.constraints.safety_constraints?.length || 0})</span>
                  </div>

                  {detail.constraints.safety_constraints && detail.constraints.safety_constraints.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {detail.constraints.safety_constraints.map((rule, idx) => (
                        <div key={idx} className="flex items-start space-x-2 p-2.5 rounded bg-gray-950 border border-gray-800 text-xs">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="text-gray-200 font-mono">{rule}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 italic">No explicit safety constraints declared.</p>
                  )}
                </div>

                {/* Forbidden Actions */}
                {detail.constraints.forbidden_actions && detail.constraints.forbidden_actions.length > 0 && (
                  <div className="bg-rose-950/20 border border-rose-900/40 rounded-lg p-4 space-y-2">
                    <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-rose-400">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Forbidden Actions</span>
                    </div>
                    <ul className="list-disc list-inside text-xs text-rose-200 space-y-1 font-mono">
                      {detail.constraints.forbidden_actions.map((act, idx) => (
                        <li key={idx}>{act}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Requirements Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Functional Requirements */}
                  <div className="bg-gray-950/40 border border-gray-800 p-4 rounded-lg space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Functional Requirements</span>
                    {detail.requirements.functional && detail.requirements.functional.length > 0 ? (
                      <ul className="list-disc list-inside text-xs text-gray-300 space-y-1">
                        {detail.requirements.functional.map((req, idx) => (
                          <li key={idx}>{req}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-gray-500 italic">None specified</p>
                    )}
                  </div>

                  {/* Tool Requirements */}
                  <div className="bg-gray-950/40 border border-gray-800 p-4 rounded-lg space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-400">Tool Requirements</span>
                    {detail.requirements.tool_requirements && detail.requirements.tool_requirements.length > 0 ? (
                      <ul className="list-disc list-inside text-xs text-gray-300 space-y-1 font-mono">
                        {detail.requirements.tool_requirements.map((req, idx) => (
                          <li key={idx}>{req}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-gray-500 italic">None specified</p>
                    )}
                  </div>

                  {/* System Requirements */}
                  <div className="bg-gray-950/40 border border-gray-800 p-4 rounded-lg space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">System Requirements</span>
                    {detail.requirements.system_requirements && detail.requirements.system_requirements.length > 0 ? (
                      <ul className="list-disc list-inside text-xs text-gray-300 space-y-1 font-mono">
                        {detail.requirements.system_requirements.map((req, idx) => (
                          <li key={idx}>{req}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-gray-500 italic">None specified</p>
                    )}
                  </div>

                  {/* Architectural Constraints */}
                  <div className="bg-gray-950/40 border border-gray-800 p-4 rounded-lg space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Architectural Constraints</span>
                    {detail.constraints.architectural_constraints && detail.constraints.architectural_constraints.length > 0 ? (
                      <ul className="list-disc list-inside text-xs text-gray-300 space-y-1">
                        {detail.constraints.architectural_constraints.map((req, idx) => (
                          <li key={idx}>{req}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-gray-500 italic">None specified</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* VALIDATION TAB */}
            {activeTab === 'validation' && (
              <div className="space-y-6">
                {/* Failure Modes */}
                <div className="bg-gray-950/60 border border-gray-800 rounded-lg p-4 space-y-3">
                  <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-rose-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Identified Failure Modes ({detail.success_criteria.failure_modes?.length || 0})</span>
                  </div>

                  {detail.success_criteria.failure_modes && detail.success_criteria.failure_modes.length > 0 ? (
                    <div className="space-y-2">
                      {detail.success_criteria.failure_modes.map((mode, idx) => (
                        <div key={idx} className="flex items-center space-x-2 p-2.5 rounded bg-gray-950 border border-rose-950/60 text-xs text-rose-200 font-mono">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                          <span>{mode}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 italic">No failure modes registered.</p>
                  )}
                </div>

                {/* Validation Rules & Acceptance Tests */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-950/40 border border-gray-800 p-4 rounded-lg space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Validation Rules</span>
                    {detail.success_criteria.validation_rules && detail.success_criteria.validation_rules.length > 0 ? (
                      <ul className="list-disc list-inside text-xs text-gray-300 space-y-1 font-mono">
                        {detail.success_criteria.validation_rules.map((rule, idx) => (
                          <li key={idx}>{rule}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-gray-500 italic">Standard pipeline rules apply</p>
                    )}
                  </div>

                  <div className="bg-gray-950/40 border border-gray-800 p-4 rounded-lg space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Acceptance Tests</span>
                    {detail.success_criteria.acceptance_tests && detail.success_criteria.acceptance_tests.length > 0 ? (
                      <ul className="list-disc list-inside text-xs text-gray-300 space-y-1 font-mono">
                        {detail.success_criteria.acceptance_tests.map((test, idx) => (
                          <li key={idx}>{test}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-gray-500 italic">Standard assertion suite apply</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* LINEAGE, PARENT / CHILDREN TREE & DEPENDENCY GRAPH TAB */}
            {activeTab === 'lineage' && (() => {
              // Extract Parent requests
              const parentIds = detail.lineage.derived_from || [];
              const parentNodes = parentIds.map(pId => {
                const match = workRequests.find(w => w.id === pId || w.id === `wr-${pId}`);
                if (match) {
                  return {
                    id: match.id,
                    intent: match.intent,
                    status: match.detail?.execution_state?.status || (match.status === 'VALIDATE' ? 'completed' : match.status === 'EXEC' ? 'running' : 'pending'),
                    role: match.detail?.metadata?.role || 'architect',
                    isReal: true,
                    wrRef: match
                  };
                }
                return {
                  id: pId.startsWith('wr-') ? pId : `wr-${pId}`,
                  intent: `Root Spec & Architectural Blueprint ${pId}`,
                  status: 'completed',
                  role: 'architect',
                  isReal: false,
                  wrRef: null
                };
              });

              if (parentNodes.length === 0) {
                parentNodes.push({
                  id: '0133',
                  intent: 'Root Spec IR Blueprint & Architectural Intent',
                  status: 'completed',
                  role: 'architect',
                  isReal: false,
                  wrRef: null
                });
              }

              // Extract Child requests & Step Decomposition
              const childWorkRequests = workRequests.filter(w => {
                if (w.id === currentWr.id) return false;
                const derived = w.detail?.lineage?.derived_from || [];
                return derived.includes(currentWr.id) || derived.includes(currentWr.id.replace('wr-', '')) || w.id.includes(currentWr.id);
              });

              // Internal decomposition steps as child tree nodes
              const stepChildNodes = (detail.decomposition.steps || []).map((st, idx) => ({
                id: st.step_id || `step_${idx + 1}`,
                intent: (st.description || `Step ${idx + 1} Execution`).split('\n')[0],
                status: detail.execution_state.status === 'completed' ? 'completed' : detail.execution_state.status === 'running' ? (idx === 0 ? 'running' : 'pending') : 'pending',
                role: 'builder',
                type: 'step' as const,
                dependencies: st.dependencies || []
              }));

              // Synthetic sub-tasks if no explicit child work request is linked
              const syntheticChildren = childWorkRequests.length > 0 ? [] : [
                {
                  id: `${detail.id}-sub-01`,
                  intent: 'Artifact Integrity Audit & Type Validation',
                  status: detail.execution_state.status === 'completed' ? 'completed' : 'running',
                  role: 'validator',
                  type: 'child_request' as const,
                  wrRef: null
                },
                {
                  id: `${detail.id}-sub-02`,
                  intent: 'Safety Guardrails & Policy Check',
                  status: detail.execution_state.status === 'completed' ? 'completed' : 'pending',
                  role: 'builder',
                  type: 'child_request' as const,
                  wrRef: null
                }
              ];

              const isParentsExpanded = expandedNodes['parents'] ?? true;
              const isChildrenExpanded = expandedNodes['children'] ?? true;

              const toggleExpand = (key: string) => {
                setExpandedNodes(prev => ({ ...prev, [key]: !prev[key] }));
              };

              const getNodeStatusBadge = (st: string) => {
                switch (st.toLowerCase()) {
                  case 'completed':
                    return { bg: 'bg-emerald-950/80 text-emerald-400 border-emerald-800', icon: CheckCircle2, label: 'completed' };
                  case 'running':
                  case 'exec':
                    return { bg: 'bg-blue-950/80 text-blue-400 border-blue-800 animate-pulse', icon: PlayCircle, label: 'running' };
                  case 'failed':
                    return { bg: 'bg-rose-950/80 text-rose-400 border-rose-800', icon: AlertCircle, label: 'failed' };
                  default:
                    return { bg: 'bg-amber-950/80 text-amber-400 border-amber-800', icon: Clock, label: 'pending' };
                }
              };

              return (
                <div className="space-y-6">
                  {/* Top Lineage View Switcher Header */}
                  <div className="bg-gray-950/70 border border-gray-800 rounded-lg p-4 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800/80 pb-3">
                      <div className="flex items-center space-x-2">
                        <span className="p-1.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400">
                          <GitFork className="w-4 h-4" />
                        </span>
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-200">Parent / Child Hierarchy & Provenance</h4>
                          <p className="text-[11px] text-gray-400">Visual dependency graph and lineage tree for request <span className="font-mono text-purple-300">{detail.id}</span></p>
                        </div>
                      </div>

                      {/* Mode Toggle Controls */}
                      <div className="flex items-center space-x-2 shrink-0">
                        <div className="bg-gray-900 p-1 rounded-lg border border-gray-800 flex items-center space-x-1">
                          <button
                            onClick={() => setLineageViewMode('tree')}
                            className={cn(
                              "flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all",
                              lineageViewMode === 'tree'
                                ? "bg-purple-600 text-white shadow-sm font-bold"
                                :"text-gray-400 hover:text-gray-200 hover:bg-gray-800"
                            )}
                          >
                            <FolderTree className="w-3.5 h-3.5" />
                            <span>Tree View</span>
                          </button>
                          <button
                            onClick={() => setLineageViewMode('graph')}
                            className={cn(
                              "flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all",
                              lineageViewMode === 'graph'
                                ? "bg-purple-600 text-white shadow-sm font-bold"
                                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
                            )}
                          >
                            <Share2 className="w-3.5 h-3.5" />
                            <span>Flow Graph</span>
                          </button>
                        </div>

                        {lineageViewMode === 'tree' && (
                          <button
                            onClick={() => {
                              const allExpanded = isParentsExpanded && isChildrenExpanded;
                              setExpandedNodes({ parents: !allExpanded, current: true, children: !allExpanded });
                            }}
                            className="p-1.5 rounded bg-gray-900 border border-gray-800 text-gray-400 hover:text-white transition-colors"
                            title="Toggle Expand/Collapse All"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* MODE 1: INTERACTIVE MINI TREE-VIEW */}
                    {lineageViewMode === 'tree' && (
                      <div className="bg-gray-950 p-4 rounded-lg border border-gray-800/80 space-y-4">
                        {/* Tier 1: Parent Nodes */}
                        <div className="space-y-2">
                          <div 
                            onClick={() => toggleExpand('parents')}
                            className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-purple-400 cursor-pointer hover:text-purple-300 select-none"
                          >
                            {isParentsExpanded ? <ChevronDown className="w-4 h-4 text-purple-400" /> : <ChevronRight className="w-4 h-4 text-purple-400" />}
                            <GitBranch className="w-3.5 h-3.5" />
                            <span>Parent Provenance ({parentNodes.length})</span>
                            <span className="text-[10px] text-gray-500 font-normal font-mono">(derived_from)</span>
                          </div>

                          <AnimatePresence>
                            {isParentsExpanded && (
                              <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="ml-3 pl-3 border-l-2 border-purple-900/60 space-y-2"
                              >
                                {parentNodes.map((pNode, pIdx) => {
                                  const statusBadge = getNodeStatusBadge(pNode.status);
                                  const StatusIcon = statusBadge.icon;
                                  return (
                                    <div key={pIdx} className="flex items-center space-x-2 group">
                                      <CornerDownRight className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                                      <div className="flex-1 bg-gray-900/80 border border-gray-800 hover:border-purple-500/40 p-2.5 rounded-md flex items-center justify-between transition-all">
                                        <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                                          <StatusIcon className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                                          <span className="font-mono text-xs font-bold text-purple-300 shrink-0">{pNode.id}</span>
                                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-300 font-mono shrink-0 uppercase">{pNode.role}</span>
                                          <span className="text-xs text-gray-300 truncate">{pNode.intent}</span>
                                        </div>

                                        <div className="flex items-center space-x-2 shrink-0">
                                          <span className={cn("text-[10px] px-1.5 py-0.5 rounded border font-mono uppercase font-semibold", statusBadge.bg)}>
                                            {statusBadge.label}
                                          </span>
                                          {pNode.wrRef && (
                                            <button
                                              onClick={() => openWorkRequestDetailModal(pNode.wrRef!)}
                                              className="p-1 rounded bg-gray-800 hover:bg-purple-900/50 text-gray-300 hover:text-purple-200 transition-colors"
                                              title="Inspect Parent Request"
                                            >
                                              <ExternalLink className="w-3 h-3" />
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Connector Line to Current Node */}
                        <div className="flex items-center ml-3.5 space-x-2">
                          <div className="w-0.5 h-6 bg-gradient-to-b from-purple-500 to-blue-500" />
                          <span className="text-[10px] text-blue-400 font-mono uppercase font-bold tracking-wider">➔ Inherits Context</span>
                        </div>

                        {/* Tier 2: Current Focus Target Request Node */}
                        <div className="relative bg-gradient-to-r from-blue-950/80 via-gray-900 to-indigo-950/80 border-2 border-blue-500/60 p-3.5 rounded-lg shadow-lg space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="p-1 rounded bg-blue-500/20 text-blue-300">
                                <Box className="w-4 h-4 animate-bounce" />
                              </span>
                              <span className="font-mono text-xs font-bold text-blue-300">{detail.id}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 border border-blue-500/40 text-blue-300 font-bold uppercase tracking-wider">
                                CURRENT FOCUS TARGET
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-emerald-400 font-mono font-semibold">
                                Role: {detail.metadata.role}
                              </span>
                            </div>

                            <span className={cn("text-[10px] px-2 py-0.5 rounded border font-mono uppercase font-bold", getNodeStatusBadge(detail.execution_state.status).bg)}>
                              {detail.execution_state.status}
                            </span>
                          </div>

                          <p className="text-xs text-gray-100 font-medium font-mono pl-1">
                            {detail.intent.problem_statement}
                          </p>

                          <div className="flex items-center space-x-4 pt-1 text-[11px] font-mono text-gray-400">
                            <span>Step: <strong className="text-blue-300">{detail.execution_state.current_step || '1'}</strong></span>
                            <span>Progress: <strong className="text-cyan-300">{(detail.execution_state.progress * 100).toFixed(0)}%</strong></span>
                            <span>Backend: <strong className="text-purple-300">{detail.metadata.harness} / {detail.metadata.model}</strong></span>
                          </div>
                        </div>

                        {/* Connector Line to Children */}
                        <div className="flex items-center ml-3.5 space-x-2">
                          <div className="w-0.5 h-6 bg-gradient-to-b from-blue-500 to-indigo-500" />
                          <span className="text-[10px] text-indigo-400 font-mono uppercase font-bold tracking-wider">➔ Spawns Sub-Tasks & Steps</span>
                        </div>

                        {/* Tier 3: Children Work Requests & Step Decomposition */}
                        <div className="space-y-2">
                          <div 
                            onClick={() => toggleExpand('children')}
                            className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-indigo-400 cursor-pointer hover:text-indigo-300 select-none"
                          >
                            {isChildrenExpanded ? <ChevronDown className="w-4 h-4 text-indigo-400" /> : <ChevronRight className="w-4 h-4 text-indigo-400" />}
                            <GitMerge className="w-3.5 h-3.5" />
                            <span>Child Executions & Step Decomposition ({childWorkRequests.length + stepChildNodes.length + syntheticChildren.length})</span>
                          </div>

                          <AnimatePresence>
                            {isChildrenExpanded && (
                              <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="ml-3 pl-3 border-l-2 border-indigo-900/60 space-y-2"
                              >
                                {/* Child Work Requests */}
                                {childWorkRequests.map((cWr, cIdx) => {
                                  const statusBadge = getNodeStatusBadge(cWr.detail?.execution_state?.status || 'pending');
                                  const StatusIcon = statusBadge.icon;
                                  return (
                                    <div key={`c-wr-${cIdx}`} className="flex items-center space-x-2">
                                      <CornerDownRight className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                      <div className="flex-1 bg-gray-900/80 border border-indigo-900/50 hover:border-indigo-500/50 p-2.5 rounded-md flex items-center justify-between transition-all">
                                        <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                                          <StatusIcon className="w-3.5 h-3.5 shrink-0 text-blue-400" />
                                          <span className="font-mono text-xs font-bold text-indigo-300 shrink-0">{cWr.id}</span>
                                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-950 border border-indigo-800 text-indigo-300 font-mono shrink-0 uppercase">Child WR</span>
                                          <span className="text-xs text-gray-300 truncate">{cWr.intent}</span>
                                        </div>

                                        <button
                                          onClick={() => openWorkRequestDetailModal(cWr)}
                                          className="p-1 rounded bg-gray-800 hover:bg-indigo-900/60 text-gray-300 hover:text-indigo-200 transition-colors shrink-0"
                                          title="Inspect Child Work Request"
                                        >
                                          <ExternalLink className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}

                                {/* Internal Plan Step Decomposition Nodes */}
                                {stepChildNodes.map((stNode, sIdx) => {
                                  const statusBadge = getNodeStatusBadge(stNode.status);
                                  const StatusIcon = statusBadge.icon;
                                  return (
                                    <div key={`step-${sIdx}`} className="flex items-center space-x-2">
                                      <CornerDownRight className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                      <div className="flex-1 bg-gray-900/60 border border-gray-800 hover:border-blue-500/30 p-2 rounded-md flex items-center justify-between transition-all">
                                        <div className="flex items-center space-x-2 min-w-0 pr-2">
                                          <StatusIcon className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
                                          <span className="font-mono text-xs font-bold text-cyan-300 shrink-0">{stNode.id}</span>
                                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 font-mono shrink-0 uppercase">Plan Step</span>
                                          <span className="text-xs text-gray-300 truncate">{stNode.intent}</span>
                                        </div>

                                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded border font-mono uppercase font-semibold shrink-0", statusBadge.bg)}>
                                          {statusBadge.label}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}

                                {/* Synthetic Linked Sub-Tasks */}
                                {syntheticChildren.map((syn, synIdx) => {
                                  const statusBadge = getNodeStatusBadge(syn.status);
                                  const StatusIcon = statusBadge.icon;
                                  return (
                                    <div key={`syn-${synIdx}`} className="flex items-center space-x-2">
                                      <CornerDownRight className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                                      <div className="flex-1 bg-gray-950/80 border border-gray-800 p-2 rounded-md flex items-center justify-between">
                                        <div className="flex items-center space-x-2 min-w-0 pr-2">
                                          <StatusIcon className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                                          <span className="font-mono text-xs font-bold text-gray-400 shrink-0">{syn.id}</span>
                                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-900 text-gray-400 font-mono shrink-0 uppercase">Sub-Task</span>
                                          <span className="text-xs text-gray-400 truncate">{syn.intent}</span>
                                        </div>

                                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded border font-mono uppercase font-semibold shrink-0", statusBadge.bg)}>
                                          {statusBadge.label}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    )}

                    {/* MODE 2: VISUAL DEPENDENCY FLOW GRAPH */}
                    {lineageViewMode === 'graph' && (
                      <div className="relative bg-gray-950 p-5 rounded-lg border border-gray-800/80 overflow-x-auto min-w-[650px]">
                        {/* Horizontal 3-Column Node Diagram */}
                        <div className="grid grid-cols-3 gap-6 items-center relative z-10">
                          
                          {/* Column 1: Parent Provenance */}
                          <div className="space-y-3">
                            <div className="flex items-center space-x-1.5 text-xs font-bold text-purple-400 uppercase tracking-wider border-b border-purple-900/50 pb-2">
                              <GitBranch className="w-3.5 h-3.5" />
                              <span>Parents (Provenance)</span>
                            </div>

                            <div className="space-y-2.5">
                              {parentNodes.map((pNode, pIdx) => (
                                <div 
                                  key={pIdx} 
                                  className="bg-gray-900/90 border border-purple-800/60 p-3 rounded-lg space-y-1.5 shadow-md hover:border-purple-500/80 transition-all cursor-pointer group"
                                  onClick={() => pNode.wrRef && openWorkRequestDetailModal(pNode.wrRef)}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-mono text-xs font-bold text-purple-300">{pNode.id}</span>
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 uppercase font-mono font-bold">
                                      {pNode.role}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-gray-300 line-clamp-2 leading-tight font-mono">{pNode.intent}</p>
                                  <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1">
                                    <span>Status: <strong className="text-emerald-400">{pNode.status}</strong></span>
                                    {pNode.wrRef && <ExternalLink className="w-3 h-3 text-purple-400 group-hover:scale-110 transition-transform" />}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Column 2: Current Focus Target Node */}
                          <div className="space-y-3">
                            <div className="flex items-center space-x-1.5 text-xs font-bold text-blue-400 uppercase tracking-wider border-b border-blue-900/50 pb-2 justify-center">
                              <Box className="w-3.5 h-3.5" />
                              <span>Current Request Node</span>
                            </div>

                            <div className="bg-gradient-to-b from-blue-950/90 via-gray-900 to-indigo-950/90 border-2 border-blue-500/70 p-4 rounded-xl shadow-2xl space-y-3 text-center relative overflow-hidden">
                              <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500 animate-pulse" />
                              
                              <div className="flex items-center justify-center space-x-2">
                                <span className="font-mono text-xs font-bold text-blue-300">{detail.id}</span>
                                <span className={cn("text-[9px] px-2 py-0.5 rounded border font-mono font-bold uppercase", getNodeStatusBadge(detail.execution_state.status).bg)}>
                                  {detail.execution_state.status}
                                </span>
                              </div>

                              <p className="text-xs text-gray-100 font-medium font-mono leading-snug">
                                {detail.intent.problem_statement}
                              </p>

                              <div className="w-full bg-gray-950 rounded-full h-2 border border-gray-800 overflow-hidden">
                                <div 
                                  className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full transition-all duration-300" 
                                  style={{ width: `${Math.max(detail.execution_state.progress * 100, 10)}%` }}
                                />
                              </div>

                              <div className="flex items-center justify-around text-[10px] font-mono text-gray-400 border-t border-gray-800 pt-2">
                                <span>Role: <strong className="text-emerald-400">{detail.metadata.role}</strong></span>
                                <span>Trace: <strong className="text-amber-400">{detail.intent.user_intent_trace || '0086'}</strong></span>
                              </div>
                            </div>
                          </div>

                          {/* Column 3: Children & Steps */}
                          <div className="space-y-3">
                            <div className="flex items-center space-x-1.5 text-xs font-bold text-indigo-400 uppercase tracking-wider border-b border-indigo-900/50 pb-2 justify-end">
                              <GitMerge className="w-3.5 h-3.5" />
                              <span>Children & Step Executions</span>
                            </div>

                            <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                              {/* Child WRs */}
                              {childWorkRequests.map((cWr, cIdx) => (
                                <div 
                                  key={`g-c-${cIdx}`}
                                  onClick={() => openWorkRequestDetailModal(cWr)}
                                  className="bg-gray-900/90 border border-indigo-800/60 p-2.5 rounded-lg space-y-1 hover:border-indigo-500/80 transition-all cursor-pointer group"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-mono text-xs font-bold text-indigo-300">{cWr.id}</span>
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-mono uppercase font-bold">Child WR</span>
                                  </div>
                                  <p className="text-[11px] text-gray-300 truncate font-mono">{cWr.intent}</p>
                                </div>
                              ))}

                              {/* Steps */}
                              {stepChildNodes.map((sNode, sIdx) => (
                                <div key={`g-s-${sIdx}`} className="bg-gray-900/70 border border-gray-800 p-2 rounded-lg flex items-center justify-between">
                                  <div className="space-y-0.5 min-w-0 pr-2">
                                    <div className="flex items-center space-x-1.5">
                                      <span className="font-mono text-xs font-bold text-cyan-300">{sNode.id}</span>
                                      <span className="text-[9px] px-1 py-0.5 rounded bg-gray-800 text-gray-400 font-mono uppercase">Step</span>
                                    </div>
                                    <p className="text-[10px] text-gray-400 truncate">{sNode.intent}</p>
                                  </div>
                                  <span className={cn("text-[9px] px-1.5 py-0.5 rounded border font-mono uppercase font-bold shrink-0", getNodeStatusBadge(sNode.status).bg)}>
                                    {sNode.status}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Background SVG Dependency Flow Connectors */}
                        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                          <svg className="w-full h-full opacity-30">
                            <line x1="30%" y1="50%" x2="40%" y2="50%" stroke="#a855f7" strokeWidth="2" strokeDasharray="4 4" />
                            <line x1="60%" y1="50%" x2="70%" y2="50%" stroke="#6366f1" strokeWidth="2" strokeDasharray="4 4" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Lineage Metadata & Receipts Artifacts Section */}
                  <div className="bg-gray-950/50 border border-gray-800 rounded-lg p-4 space-y-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-1.5">
                      <Box className="w-3.5 h-3.5" />
                      <span>Receipts & Produced Artifact Provenance</span>
                    </span>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                      <div className="p-3 bg-gray-950 rounded-lg border border-gray-800 space-y-2">
                        <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider block">Produced Files ({detail.artifacts.produced_files?.length || 0})</span>
                        {detail.artifacts.produced_files && detail.artifacts.produced_files.length > 0 ? (
                          <ul className="space-y-1">
                            {detail.artifacts.produced_files.map((file, idx) => (
                              <li key={idx} className="flex items-center space-x-2 text-gray-200 bg-gray-900/60 px-2 py-1 rounded border border-gray-800">
                                <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                <span className="truncate">{file}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-gray-500 italic">No output files produced yet</p>
                        )}
                      </div>

                      <div className="p-3 bg-gray-950 rounded-lg border border-gray-800 space-y-2">
                        <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider block">Intermediate Outputs ({detail.artifacts.intermediate_outputs?.length || 0})</span>
                        {detail.artifacts.intermediate_outputs && detail.artifacts.intermediate_outputs.length > 0 ? (
                          <ul className="space-y-1">
                            {detail.artifacts.intermediate_outputs.map((out, idx) => (
                              <li key={idx} className="flex items-center space-x-2 text-gray-200 bg-gray-900/60 px-2 py-1 rounded border border-gray-800">
                                <Code className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                                <span className="truncate">{out}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-gray-500 italic">No intermediate outputs</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ACTIVITY & STATE TAB */}
            {activeTab === 'activity' && (() => {
              // Time intervals for telemetry rate
              const timeLabels = ['T-30m', 'T-25m', 'T-20m', 'T-15m', 'T-12m', 'T-10m', 'T-8m', 'T-6m', 'T-4m', 'T-2m', 'T-1m', 'Now'];
              
              let seed = 0;
              for (let i = 0; i < detail.id.length; i++) {
                seed = (seed << 5) - seed + detail.id.charCodeAt(i);
                seed |= 0;
              }
              const absSeed = Math.abs(seed);

              const baseCounts = [
                3 + (absSeed % 3),
                6 + (absSeed % 4),
                12 + (absSeed % 5),
                18 + (absSeed % 7),
                28 + (absSeed % 9), // peak execution step
                22 + (absSeed % 6),
                15 + (absSeed % 5),
                9 + (absSeed % 4),
                19 + (absSeed % 8), // validation check burst
                8 + (absSeed % 3),
                4 + (absSeed % 2),
                7 + (absSeed % 3)
              ];

              const baseLatenciesMs = [
                140, 260, 480, 820, 1450, 920, 610, 390, 1180, 310, 220, 180
              ];

              const sparklineBuckets = timeLabels.map((label, idx) => {
                const count = baseCounts[idx] || 6;
                const latencyMs = (baseLatenciesMs[idx] || 350) + ((absSeed * (idx + 3)) % 220);
                const error = (idx === 4 && absSeed % 6 === 0) ? 1 : 0;
                const warn = (idx % 4 === 0) ? 1 + (absSeed % 2) : 0;
                const info = Math.max(0, count - warn - error);
                return { label, count, latencyMs, info, warn, error };
              });

              const totalLogCount = sparklineBuckets.reduce((acc, b) => acc + b.count, 0);
              const maxBucketCount = Math.max(...sparklineBuckets.map(b => b.count), 1);
              const avgLogRate = (totalLogCount / sparklineBuckets.length).toFixed(1);
              const totalErrors = sparklineBuckets.reduce((acc, b) => acc + b.error, 0);
              const totalWarnings = sparklineBuckets.reduce((acc, b) => acc + b.warn, 0);

              const maxLatencyMs = Math.max(...sparklineBuckets.map(b => b.latencyMs), 1);
              const minLatencyMs = Math.min(...sparklineBuckets.map(b => b.latencyMs));
              const avgLatencyMs = Math.round(sparklineBuckets.reduce((acc, b) => acc + b.latencyMs, 0) / sparklineBuckets.length);

              // SVG layout parameters for Sparkline
              const svgWidth = 500;
              const svgHeight = 110;
              const padX = 20;
              const padY = 16;
              const graphWidth = svgWidth - padX * 2;
              const graphHeight = svgHeight - padY * 2;

              const maxMetricVal = sparklineMetric === 'throughput' ? maxBucketCount : maxLatencyMs;

              const points = sparklineBuckets.map((b, idx) => {
                const val = sparklineMetric === 'throughput' ? b.count : b.latencyMs;
                const x = padX + idx * (graphWidth / (sparklineBuckets.length - 1));
                const y = (padY + graphHeight) - (val / maxMetricVal) * graphHeight;
                return { x, y, val, ...b };
              });

              // Construct smooth Bezier SVG curve
              let linePath = `M ${points[0].x},${points[0].y}`;
              for (let i = 0; i < points.length - 1; i++) {
                const p0 = points[i];
                const p1 = points[i + 1];
                const cx = (p0.x + p1.x) / 2;
                linePath += ` C ${cx},${p0.y} ${cx},${p1.y} ${p1.x},${p1.y}`;
              }

              const areaPath = `${linePath} L ${points[points.length - 1].x},${padY + graphHeight} L ${points[0].x},${padY + graphHeight} Z`;

              const activeHoverPoint = hoveredBucketIdx !== null ? points[hoveredBucketIdx] : null;

              // Anchor base time for relative / absolute timestamp calculations
              const baseLogTimeMs = React.useMemo(() => {
                if (detail.metadata.created_at) {
                  const parsed = new Date(detail.metadata.created_at).getTime();
                  if (!isNaN(parsed)) return parsed + 30 * 60 * 1000; // created_at was T-30m
                }
                return Date.now();
              }, [detail.id, detail.metadata.created_at]);

              const getFormattedLogTimes = (offsetMins: number, rawTag: string) => {
                const relTime = offsetMins === 0 ? 'just now' : `${offsetMins}m ago`;
                const dateObj = new Date(baseLogTimeMs - offsetMins * 60 * 1000);
                const absTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                return { relTime, absTime, rawTag };
              };

              // Complete audit log items corresponding to work request execution timeline
              const rawAuditLogs = [
                { id: 'log-12', bucketIdx: 11, offsetMins: 0, time: 'Now', level: 'info' as const, status: (detail.execution_state.status === 'completed' ? 'Success' : detail.execution_state.status === 'failed' ? 'Error' : 'Running'), agent: detail.metadata.role, action: 'TELEMETRY_SYNC', msg: `Step ${detail.execution_state.current_step || 'final'} progress updated to ${(detail.execution_state.progress * 100).toFixed(0)}%`, metadata: { progress: detail.execution_state.progress, status: detail.execution_state.status } },
                { id: 'log-11', bucketIdx: 10, offsetMins: 1, time: 'T-1m', level: 'success' as const, status: 'Success', agent: 'validator', action: 'ASSERTION_PASS', msg: `Validation assertions verified for workspace path ${detail.path}`, metadata: { passedRules: 14, score: 0.99 } },
                { id: 'log-10', bucketIdx: 9, offsetMins: 2, time: 'T-2m', level: 'info' as const, status: 'Success', agent: 'builder', action: 'AST_MUTATION', msg: `Applied AST patch to target files (${detail.artifacts.produced_files?.length || 1} files updated)`, metadata: { files: detail.artifacts.produced_files } },
                { id: 'log-09', bucketIdx: 8, offsetMins: 4, time: 'T-4m', level: 'info' as const, status: 'Success', agent: 'validator', action: 'TYPE_CHECK_RUN', msg: `Executed TypeScript compiler pass — 0 fatal type errors encountered`, metadata: { tscExitCode: 0, durationMs: 310 } },
                { id: 'log-08', bucketIdx: 7, offsetMins: 6, time: 'T-6m', level: 'info' as const, status: 'Pending', agent: 'builder', action: 'SPAWN_MODEL_STEP', msg: `Execution step step_1 spawned on model ${detail.metadata.model}`, metadata: { model: detail.metadata.model, temperature: 0.2 } },
                { id: 'log-07', bucketIdx: 6, offsetMins: 8, time: 'T-8m', level: 'warn' as const, status: 'Warning', agent: 'critic', action: 'EDGE_CASE_FLAG', msg: `Identified edge case in component bounds; applying safe fallback handler`, metadata: { retryCount: detail.execution_state.retries, severity: 'low' } },
                { id: 'log-06', bucketIdx: 5, offsetMins: 10, time: 'T-10m', level: 'info' as const, status: 'Success', agent: 'architect', action: 'SPEC_IR_FINALIZE', msg: `Spec IR decomposition finalized using strategy: ${detail.decomposition.strategy}`, metadata: { strategy: detail.decomposition.strategy, parallelism: detail.decomposition.parallelism_model } },
                { id: 'log-05', bucketIdx: 4, offsetMins: 12, time: 'T-12m', level: (absSeed % 6 === 0 ? 'error' as const : 'info' as const), status: (absSeed % 6 === 0 ? 'Error' : 'Success'), agent: 'coder', action: 'CODEGEN_TRANSFORM', msg: `Synthesized code generation blocks for problem: "${detail.intent.problem_statement.slice(0, 45)}..."`, metadata: { loc: 142, tokens: 1850 } },
                { id: 'log-04', bucketIdx: 3, offsetMins: 15, time: 'T-15m', level: 'info' as const, status: 'Success', agent: 'planner', action: 'GOAL_MAPPING', msg: `Mapped desired outcome: ${detail.intent.desired_outcome}`, metadata: { stepsCount: detail.decomposition.steps.length } },
                { id: 'log-03', bucketIdx: 2, offsetMins: 20, time: 'T-20m', level: 'success' as const, status: 'Success', agent: 'conduit', action: 'SECURITY_AUDIT', msg: `Verified prompt safety and workspace access permissions`, metadata: { sandboxMode: true, networkAccess: false } },
                { id: 'log-02', bucketIdx: 1, offsetMins: 25, time: 'T-25m', level: 'info' as const, status: 'Success', agent: 'conduit', action: 'PARSE_REQUIREMENTS', msg: `Parsed requirements and system factors (${detail.requirements.functional.length} functional rules)`, metadata: { constraints: detail.requirements.functional } },
                { id: 'log-01', bucketIdx: 0, offsetMins: 30, time: 'T-30m', level: 'info' as const, status: 'Success', agent: 'conduit', action: 'WORK_REQUEST_INIT', msg: `Initialized Work Request [${detail.id}] from provenance source`, metadata: { created_at: detail.metadata.created_at } },
              ];

              const auditLogs = rawAuditLogs.map(log => {
                const times = getFormattedLogTimes(log.offsetMins, log.time);
                return {
                  ...log,
                  relTime: times.relTime,
                  absTime: times.absTime,
                  displayTime: timestampMode === 'relative' ? times.relTime : times.absTime
                };
              });

              const getLogStatusBadge = (statusStr: string) => {
                switch (statusStr.toLowerCase()) {
                  case 'success':
                  case 'passed':
                  case 'completed':
                    return {
                      bg: 'bg-emerald-950/90 text-emerald-300 border-emerald-800 shadow-[0_0_8px_rgba(16,185,129,0.2)]',
                      icon: CheckCircle2,
                      label: 'Success'
                    };
                  case 'error':
                  case 'failed':
                    return {
                      bg: 'bg-rose-950/90 text-rose-300 border-rose-800 shadow-[0_0_8px_rgba(244,63,94,0.2)]',
                      icon: AlertCircle,
                      label: 'Error'
                    };
                  case 'warning':
                  case 'warn':
                    return {
                      bg: 'bg-amber-950/90 text-amber-300 border-amber-800 shadow-[0_0_8px_rgba(245,158,11,0.2)]',
                      icon: AlertTriangle,
                      label: 'Warning'
                    };
                  case 'running':
                  case 'executing':
                    return {
                      bg: 'bg-blue-950/90 text-blue-300 border-blue-800 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.2)]',
                      icon: PlayCircle,
                      label: 'Running'
                    };
                  case 'pending':
                  default:
                    return {
                      bg: 'bg-slate-900/90 text-slate-300 border-slate-700',
                      icon: Clock,
                      label: 'Pending'
                    };
                }
              };

              const filteredAuditLogs = auditLogs.filter(log => {
                const matchesLevel = activityLogLevel === 'all' || log.level === activityLogLevel;
                const matchesSearch = !activitySearch || 
                  log.msg.toLowerCase().includes(activitySearch.toLowerCase()) ||
                  log.action.toLowerCase().includes(activitySearch.toLowerCase()) ||
                  log.agent.toLowerCase().includes(activitySearch.toLowerCase()) ||
                  log.time.toLowerCase().includes(activitySearch.toLowerCase()) ||
                  log.relTime.toLowerCase().includes(activitySearch.toLowerCase()) ||
                  log.absTime.toLowerCase().includes(activitySearch.toLowerCase()) ||
                  log.status.toLowerCase().includes(activitySearch.toLowerCase());
                const matchesBucket = selectedBucketIdx === null || log.bucketIdx === selectedBucketIdx;

                return matchesLevel && matchesSearch && matchesBucket;
              });

              return (
                <div className="space-y-5">
                  {/* Progress Bar & Execution State Bar */}
                  <div className="bg-gray-950/60 border border-gray-800 rounded-lg p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold uppercase tracking-wider text-blue-400 font-mono">Execution State Progress</span>
                        <span className={cn("text-[9px] px-1.5 py-0.2 rounded border font-mono uppercase font-bold", getNodeStatusBadge(detail.execution_state.status).bg)}>
                          {detail.execution_state.status}
                        </span>
                      </div>
                      <span className="font-mono text-gray-300 font-bold">{(detail.execution_state.progress * 100).toFixed(0)}%</span>
                    </div>

                    <div className="w-full h-2 bg-gray-950 rounded-full overflow-hidden border border-gray-800">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300"
                        style={{ width: `${Math.max(detail.execution_state.progress * 100, 5)}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                      <div className="p-2 bg-gray-950 rounded border border-gray-800 space-y-0.5">
                        <span className="text-gray-500 uppercase text-[9px]">Current Step</span>
                        <p className="font-mono text-gray-200 font-bold text-xs truncate">{detail.execution_state.current_step || 'N/A'}</p>
                      </div>

                      <div className="p-2 bg-gray-950 rounded border border-gray-800 space-y-0.5">
                        <span className="text-gray-500 uppercase text-[9px]">Retries</span>
                        <p className="font-mono text-gray-200 font-bold text-xs">{detail.execution_state.retries}</p>
                      </div>

                      <div className="p-2 bg-gray-950 rounded border border-gray-800 space-y-0.5">
                        <span className="text-gray-500 uppercase text-[9px]">Error State</span>
                        <p className="font-mono text-emerald-400 font-bold text-xs">{detail.execution_state.error_state || 'None'}</p>
                      </div>

                      <div className="p-2 bg-gray-950 rounded border border-gray-800 space-y-0.5">
                        <span className="text-gray-500 uppercase text-[9px]">Last Updated</span>
                        <p className="font-mono text-gray-300 text-[10px] truncate">{new Date(detail.execution_state.last_updated).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* SPLIT-PANE AUDITABILITY CONTAINER */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

                    {/* LEFT PANE: SPARKLINE TELEMETRY & INTERVAL SELECTOR */}
                    <div className="lg:col-span-5 space-y-4 bg-gray-950/70 border border-gray-800 rounded-lg p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-800 pb-2.5">
                        <div className="flex items-center space-x-2">
                          <span className={cn(
                            "p-1.5 rounded border transition-colors",
                            sparklineMetric === 'throughput' 
                              ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                              : "bg-purple-500/10 border-purple-500/20 text-purple-400"
                          )}>
                            {sparklineMetric === 'throughput' ? <TrendingUp className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                          </span>
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-200">
                              {sparklineMetric === 'throughput' ? 'Telemetry Rate Sparkline' : 'Step Latency Sparkline'}
                            </h4>
                            <p className="text-[10px] text-gray-400">
                              {sparklineMetric === 'throughput' ? 'Log events density over T-30m' : 'Step execution latency (ms)'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {/* Throughput / Latency Metric Toggle */}
                          <div className="flex items-center bg-gray-900 p-0.5 rounded-md border border-gray-800 text-[10px] font-mono">
                            <button
                              onClick={() => setSparklineMetric('throughput')}
                              className={cn(
                                "px-2 py-0.5 rounded flex items-center space-x-1 font-bold transition-all",
                                sparklineMetric === 'throughput' 
                                  ? "bg-blue-950 text-blue-300 border border-blue-700 shadow-sm" 
                                  : "text-gray-400 hover:text-gray-200"
                              )}
                              title="Visualize log throughput rate"
                            >
                              <TrendingUp className="w-3 h-3" />
                              <span>Rate</span>
                            </button>
                            <button
                              onClick={() => setSparklineMetric('latency')}
                              className={cn(
                                "px-2 py-0.5 rounded flex items-center space-x-1 font-bold transition-all",
                                sparklineMetric === 'latency' 
                                  ? "bg-purple-950 text-purple-300 border border-purple-700 shadow-sm" 
                                  : "text-gray-400 hover:text-gray-200"
                              )}
                              title="Visualize step execution latency"
                            >
                              <Zap className="w-3 h-3" />
                              <span>Latency</span>
                            </button>
                          </div>

                          {selectedBucketIdx !== null && (
                            <button 
                              onClick={() => setSelectedBucketIdx(null)}
                              className="text-[10px] text-purple-400 hover:text-purple-300 font-mono font-bold flex items-center gap-1 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800 shrink-0"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Reset</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Sparkline Metrics summary */}
                      <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                        {sparklineMetric === 'throughput' ? (
                          <>
                            <div className="bg-gray-900/90 p-2 rounded border border-gray-800">
                              <span className="text-gray-500 text-[9px] block uppercase">Total Logs</span>
                              <span className="font-bold text-gray-100 text-sm">{totalLogCount}</span>
                            </div>
                            <div className="bg-gray-900/90 p-2 rounded border border-gray-800">
                              <span className="text-gray-500 text-[9px] block uppercase">Peak Rate</span>
                              <span className="font-bold text-blue-400 text-sm">{maxBucketCount}/min</span>
                            </div>
                            <div className="bg-gray-900/90 p-2 rounded border border-gray-800">
                              <span className="text-gray-500 text-[9px] block uppercase">Avg Velocity</span>
                              <span className="font-bold text-cyan-400 text-sm">{avgLogRate}/int</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="bg-gray-900/90 p-2 rounded border border-gray-800">
                              <span className="text-gray-500 text-[9px] block uppercase">Avg Latency</span>
                              <span className="font-bold text-purple-300 text-sm">{avgLatencyMs}ms</span>
                            </div>
                            <div className="bg-gray-900/90 p-2 rounded border border-gray-800">
                              <span className="text-gray-500 text-[9px] block uppercase">Peak Latency</span>
                              <span className="font-bold text-amber-400 text-sm">{maxLatencyMs}ms</span>
                            </div>
                            <div className="bg-gray-900/90 p-2 rounded border border-gray-800">
                              <span className="text-gray-500 text-[9px] block uppercase">Min Latency</span>
                              <span className="font-bold text-emerald-400 text-sm">{minLatencyMs}ms</span>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Interactive Sparkline Canvas */}
                      <div className="relative bg-gray-950 p-2 rounded-lg border border-gray-800/80 overflow-hidden">
                        <svg 
                          viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
                          className="w-full h-28 overflow-visible cursor-pointer"
                        >
                          <defs>
                            <linearGradient id={`sparkline-grad-${detail.id}-${sparklineMetric}`} x1="0" y1="0" x2="0" y2="1">
                              {sparklineMetric === 'throughput' ? (
                                <>
                                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.45" />
                                  <stop offset="60%" stopColor="#3b82f6" stopOpacity="0.1" />
                                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                                </>
                              ) : (
                                <>
                                  <stop offset="0%" stopColor="#a855f7" stopOpacity="0.45" />
                                  <stop offset="60%" stopColor="#a855f7" stopOpacity="0.1" />
                                  <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
                                </>
                              )}
                            </linearGradient>
                          </defs>

                          {/* Horizontal Grid Baseline Rules */}
                          {[0.25, 0.5, 0.75, 1.0].map((ratio, idx) => {
                            const yRule = padY + graphHeight * (1 - ratio);
                            return (
                              <line 
                                key={idx}
                                x1={padX} 
                                y1={yRule} 
                                x2={padX + graphWidth} 
                                y2={yRule} 
                                stroke="rgba(255, 255, 255, 0.06)" 
                                strokeDasharray="2 4"
                              />
                            );
                          })}

                          {/* Gradient Area Fill */}
                          <path 
                            d={areaPath} 
                            fill={`url(#sparkline-grad-${detail.id}-${sparklineMetric})`} 
                          />

                          {/* Main Sparkline Stroke */}
                          <path 
                            d={linePath} 
                            fill="none" 
                            stroke={sparklineMetric === 'throughput' ? "#38bdf8" : "#c084fc"} 
                            strokeWidth="2.5" 
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />

                          {/* Hover or Selected Vertical Guide Line */}
                          {(activeHoverPoint || (selectedBucketIdx !== null ? points[selectedBucketIdx] : null)) && (
                            <line 
                              x1={(activeHoverPoint || points[selectedBucketIdx!]).x} 
                              y1={padY} 
                              x2={(activeHoverPoint || points[selectedBucketIdx!]).x} 
                              y2={padY + graphHeight} 
                              stroke={selectedBucketIdx !== null ? "#a855f7" : sparklineMetric === 'throughput' ? "#60a5fa" : "#c084fc"} 
                              strokeWidth="1.5"
                              strokeDasharray="3 3"
                              opacity="0.9"
                            />
                          )}

                          {/* Sparkline Data Points */}
                          {points.map((pt, idx) => {
                            const isHovered = hoveredBucketIdx === idx;
                            const isSelected = selectedBucketIdx === idx;

                            return (
                              <g key={idx} className="transition-all duration-150">
                                <rect
                                  x={pt.x - graphWidth / (sparklineBuckets.length * 2)}
                                  y={0}
                                  width={graphWidth / sparklineBuckets.length}
                                  height={svgHeight}
                                  fill="transparent"
                                  onMouseEnter={() => setHoveredBucketIdx(idx)}
                                  onMouseLeave={() => setHoveredBucketIdx(null)}
                                  onClick={() => setSelectedBucketIdx(isSelected ? null : idx)}
                                />

                                <circle 
                                  cx={pt.x} 
                                  cy={pt.y} 
                                  r={isSelected ? 6 : isHovered ? 5 : 3} 
                                  fill={isSelected ? "#a855f7" : isHovered ? (sparklineMetric === 'throughput' ? "#38bdf8" : "#e9d5ff") : "#1e293b"} 
                                  stroke={isSelected ? "#ffffff" : isHovered ? "#ffffff" : (sparklineMetric === 'throughput' ? "#60a5fa" : "#c084fc")} 
                                  strokeWidth={isSelected || isHovered ? 2 : 1.5}
                                  className="transition-all duration-150"
                                />

                                {(isHovered || isSelected) && (
                                  <circle 
                                    cx={pt.x} 
                                    cy={pt.y} 
                                    r="9" 
                                    fill="none" 
                                    stroke={isSelected ? "#a855f7" : (sparklineMetric === 'throughput' ? "#38bdf8" : "#c084fc")} 
                                    strokeWidth="1"
                                    className="animate-ping opacity-60"
                                  />
                                )}
                              </g>
                            );
                          })}
                        </svg>

                        {/* Interval Buttons Bar */}
                        <div className="grid grid-cols-6 sm:grid-cols-12 gap-0.5 pt-1 border-t border-gray-800/40">
                          {sparklineBuckets.map((b, idx) => {
                            const isSelected = selectedBucketIdx === idx;
                            const isHovered = hoveredBucketIdx === idx;

                            return (
                              <button
                                key={idx}
                                onClick={() => setSelectedBucketIdx(isSelected ? null : idx)}
                                onMouseEnter={() => setHoveredBucketIdx(idx)}
                                onMouseLeave={() => setHoveredBucketIdx(null)}
                                className={cn(
                                  "py-0.5 text-[8px] font-mono text-center rounded transition-all truncate border",
                                  isSelected 
                                    ? "bg-purple-900/90 text-purple-200 border-purple-500 font-bold"
                                    : isHovered
                                    ? sparklineMetric === 'throughput'
                                      ? "bg-blue-900/60 text-blue-200 border-blue-500"
                                      : "bg-purple-900/60 text-purple-200 border-purple-500"
                                    : "bg-gray-900 text-gray-500 border-gray-800 hover:text-gray-300"
                                )}
                              >
                                {b.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Click Instruction / Active Filter Info */}
                      <div className="p-2 bg-gray-900/80 rounded border border-gray-800 text-[10px] font-mono text-gray-400 flex items-center justify-between">
                        {selectedBucketIdx !== null ? (
                          <span className="text-purple-300 flex items-center gap-1.5 font-bold">
                            <Filter className="w-3 h-3 text-purple-400" />
                            Interval: {sparklineBuckets[selectedBucketIdx].label} (
                              {sparklineMetric === 'throughput' 
                                ? `${sparklineBuckets[selectedBucketIdx].count} events`
                                : `Latency: ${sparklineBuckets[selectedBucketIdx].latencyMs}ms`
                              }
                            )
                          </span>
                        ) : (
                          <span className="text-gray-500 italic">Click point on chart to filter log pane to interval</span>
                        )}

                        <div className="flex items-center space-x-2 text-[9px]">
                          <span className="text-emerald-400 font-bold">{totalLogCount - totalErrors - totalWarnings} Info</span>
                          <span className="text-amber-400 font-bold">{totalWarnings} Warn</span>
                          <span className="text-rose-400 font-bold">{totalErrors} Err</span>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT PANE: CHRONOLOGICAL AUDIT LOG STREAM */}
                    <div className="lg:col-span-7 space-y-3 bg-gray-950/70 border border-gray-800 rounded-lg p-4">
                      {/* Search & Level Filter Toolbar */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-800 pb-3">
                        <div className="flex items-center space-x-2">
                          <Terminal className="w-4 h-4 text-purple-400" />
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-200">Chronological Audit Log Stream</h4>
                            <p className="text-[10px] text-gray-400">Audit trail of execution events</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {/* Relative / Absolute Toggle */}
                          <div className="flex items-center bg-gray-900 p-0.5 rounded-md border border-gray-800 text-[10px] font-mono">
                            <button
                              onClick={() => setTimestampMode('relative')}
                              className={cn(
                                "px-2 py-0.5 rounded flex items-center space-x-1 transition-colors font-bold",
                                timestampMode === 'relative' 
                                  ? "bg-purple-900 text-purple-200 border border-purple-700" 
                                  : "text-gray-400 hover:text-gray-200"
                              )}
                              title="Display relative timestamps (e.g. 2m ago)"
                            >
                              <Clock className="w-3 h-3" />
                              <span>Relative</span>
                            </button>
                            <button
                              onClick={() => setTimestampMode('absolute')}
                              className={cn(
                                "px-2 py-0.5 rounded flex items-center space-x-1 transition-colors font-bold",
                                timestampMode === 'absolute' 
                                  ? "bg-purple-900 text-purple-200 border border-purple-700" 
                                  : "text-gray-400 hover:text-gray-200"
                              )}
                              title="Display absolute timestamps (e.g. 12:45:10 PM)"
                            >
                              <Calendar className="w-3 h-3" />
                              <span>Absolute</span>
                            </button>
                          </div>

                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-900 border border-gray-800 text-gray-300 font-bold shrink-0">
                            {filteredAuditLogs.length} / {auditLogs.length}
                          </span>
                        </div>
                      </div>

                      {/* Filters bar */}
                      <div className="flex items-center space-x-2">
                        {/* Search Input */}
                        <div className="relative flex-1">
                          <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2 top-2" />
                          <input
                            type="text"
                            placeholder="Filter audit logs..."
                            value={activitySearch}
                            onChange={(e) => setActivitySearch(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-800 rounded-md pl-7 pr-2 py-1 text-xs text-gray-200 focus:outline-none focus:border-purple-500 font-mono"
                          />
                        </div>

                        {/* Level Filter Pills */}
                        <div className="flex items-center bg-gray-900 p-0.5 rounded-md border border-gray-800 text-[10px] font-mono">
                          {(['all', 'info', 'success', 'warn', 'error'] as const).map(lvl => (
                            <button
                              key={lvl}
                              onClick={() => setActivityLogLevel(lvl)}
                              className={cn(
                                "px-2 py-0.5 rounded uppercase font-bold transition-colors",
                                activityLogLevel === lvl 
                                  ? "bg-purple-900 text-purple-200 border border-purple-700" 
                                  : "text-gray-400 hover:text-gray-200"
                              )}
                            >
                              {lvl}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Log Stream Card List */}
                      <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 font-mono text-xs scrollbar-thin scrollbar-thumb-gray-800">
                        {filteredAuditLogs.length === 0 ? (
                          <div className="py-12 text-center text-gray-500 space-y-2 border border-dashed border-gray-800 rounded-lg">
                            <AlertCircle className="w-6 h-6 text-gray-600 mx-auto" />
                            <p className="text-xs text-gray-400">No matching audit events for current filter.</p>
                            <button
                              onClick={() => { setActivitySearch(''); setActivityLogLevel('all'); setSelectedBucketIdx(null); }}
                              className="text-[10px] text-purple-400 hover:underline font-bold"
                            >
                              Reset all activity filters
                            </button>
                          </div>
                        ) : (
                          filteredAuditLogs.map(log => {
                            const isExpanded = expandedLogId === log.id;
                            const isBucketMatch = (hoveredBucketIdx !== null && log.bucketIdx === hoveredBucketIdx) || 
                              (selectedBucketIdx !== null && log.bucketIdx === selectedBucketIdx);
                            const statusBadge = getLogStatusBadge(log.status);
                            const StatusIcon = statusBadge.icon;

                            return (
                              <div
                                key={log.id}
                                className={cn(
                                  "p-2.5 rounded-lg border transition-all space-y-1.5",
                                  isBucketMatch
                                    ? "bg-purple-950/40 border-purple-500/80 shadow-[0_0_10px_rgba(168,85,247,0.2)]"
                                    : "bg-gray-900/80 border-gray-800/80 hover:border-gray-700"
                                )}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center space-x-1.5 min-w-0 flex-wrap gap-y-1">
                                    <span 
                                      className="text-[10px] px-1.5 py-0.2 rounded bg-gray-950 text-gray-300 border border-gray-800 shrink-0 font-mono font-medium"
                                      title={timestampMode === 'relative' ? `Absolute time: ${log.absTime}` : `Relative time: ${log.relTime}`}
                                    >
                                      {log.displayTime}
                                    </span>

                                    {/* Visual Outcome Status Badge */}
                                    <span className={cn(
                                      "text-[9px] px-2 py-0.5 rounded-full font-bold shrink-0 border flex items-center gap-1 font-sans uppercase tracking-wider",
                                      statusBadge.bg
                                    )}>
                                      <StatusIcon className="w-3 h-3 shrink-0" />
                                      <span>{statusBadge.label}</span>
                                    </span>

                                    <span className={cn(
                                      "text-[9px] px-1.5 py-0.2 rounded uppercase font-bold shrink-0 border",
                                      log.level === 'success' ? "bg-emerald-950 text-emerald-300 border-emerald-800" :
                                      log.level === 'error' ? "bg-rose-950 text-rose-300 border-rose-800" :
                                      log.level === 'warn' ? "bg-amber-950 text-amber-300 border-amber-800" :
                                      "bg-blue-950 text-blue-300 border-blue-800"
                                    )}>
                                      {log.level}
                                    </span>

                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-950/60 text-purple-300 border border-purple-800 font-bold shrink-0">
                                      [{log.agent}]
                                    </span>

                                    <span className="text-xs font-bold text-gray-200 truncate">{log.action}</span>
                                  </div>

                                  <button
                                    onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                                    className="text-[10px] text-gray-500 hover:text-gray-300 underline shrink-0 ml-2"
                                  >
                                    {isExpanded ? 'Hide Payload' : 'Payload'}
                                  </button>
                                </div>

                                <p className="text-xs text-gray-300 leading-snug">{log.msg}</p>

                                {/* Expanded JSON Metadata Drawer */}
                                {isExpanded && (
                                  <div className="p-2 bg-gray-950 rounded border border-gray-800 text-[10px] text-emerald-400 overflow-x-auto space-y-1">
                                    <span className="text-gray-500 text-[9px] block uppercase font-bold">Log Metadata</span>
                                    <pre>{JSON.stringify({ status: log.status, ...log.metadata }, null, 2)}</pre>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* RAW JSON TAB */}
            {activeTab === 'json' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Complete Raw JSON Payload</span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => copyToClipboard(JSON.stringify(detail, null, 2), 'json')}
                      className="flex items-center space-x-1 px-2.5 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-medium transition-colors"
                    >
                      {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedJson ? 'Copied!' : 'Copy JSON'}</span>
                    </button>
                  </div>
                </div>

                <pre className="p-4 rounded-lg bg-gray-950 border border-gray-800 font-mono text-xs text-emerald-400 overflow-x-auto max-h-[500px] overflow-y-auto leading-relaxed">
                  {JSON.stringify(detail, null, 2)}
                </pre>
              </div>
            )}

          </div>

          {/* Modal Footer */}
          <div className="px-6 py-3 bg-gray-950/90 border-t border-gray-800 flex items-center justify-between text-xs text-gray-400 shrink-0">
            <div className="flex items-center space-x-2">
              <Clock className="w-3.5 h-3.5 text-gray-500" />
              <span>Created: {new Date(detail.metadata.created_at).toLocaleString()}</span>
            </div>

            <button
              onClick={closeWorkRequestDetailModal}
              className="px-4 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
