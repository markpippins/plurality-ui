import React, { useState, useMemo } from 'react';
import { useSimulation } from '../hooks/useSimulation';
import { 
  X, Bell, AlertTriangle, AlertCircle, Info, Sliders, 
  Clock, Zap, Activity, Cpu, CheckCircle2, Shield, 
  RotateCcw, Plus, Trash2, Edit3, Copy, Play, Volume2, 
  VolumeX, Terminal, FileText, Check, ChevronRight, Sparkles, Filter, 
  ArrowRight, Search, Layers, RefreshCw, AlertOctagon, History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { 
  PerformanceAlertRule, 
  AlertMetricType, 
  AlertOperator, 
  AlertSeverity, 
  DEFAULT_ALERT_RULES 
} from '../types';

const METRIC_METADATA: Record<AlertMetricType, { label: string; unit: string; icon: React.ComponentType<{ className?: string }>; description: string; defaultThreshold: number; defaultOperator: AlertOperator; min: number; max: number; step: number }> = {
  latency: {
    label: 'Execution Latency',
    unit: 'ms',
    icon: Clock,
    description: 'Agent turn execution time or completion duration',
    defaultThreshold: 200,
    defaultOperator: '>',
    min: 50,
    max: 10000,
    step: 50
  },
  tokensPerSec: {
    label: 'Throughput Speed',
    unit: 'tok/s',
    icon: Zap,
    description: 'Generation throughput velocity in tokens per second',
    defaultThreshold: 100,
    defaultOperator: '<',
    min: 10,
    max: 500,
    step: 10
  },
  tokenUsage: {
    label: 'Step Token Count',
    unit: 'tokens',
    icon: Layers,
    description: 'Total tokens (prompt + completion) consumed in a single turn',
    defaultThreshold: 2500,
    defaultOperator: '>',
    min: 200,
    max: 20000,
    step: 100
  },
  totalTokens: {
    label: 'Session Total Tokens',
    unit: 'tokens',
    icon: Activity,
    description: 'Cumulative total tokens consumed across the entire workflow session',
    defaultThreshold: 100000,
    defaultOperator: '>',
    min: 10000,
    max: 1000000,
    step: 5000
  },
  errorCount: {
    label: 'Execution Errors',
    unit: 'errors',
    icon: AlertOctagon,
    description: 'Agent execution failures, syntax exceptions, or typecheck errors',
    defaultThreshold: 1,
    defaultOperator: '>=',
    min: 1,
    max: 10,
    step: 1
  },
  successRate: {
    label: 'Success Rate SLA',
    unit: '%',
    icon: CheckCircle2,
    description: 'Percentage of successful workflow steps and completed tasks',
    defaultThreshold: 95,
    defaultOperator: '<',
    min: 50,
    max: 100,
    step: 1
  },
  riskScore: {
    label: 'Critic Risk Score',
    unit: '%',
    icon: Shield,
    description: 'Security & integrity critique risk score assigned by Reviewer',
    defaultThreshold: 30,
    defaultOperator: '>',
    min: 5,
    max: 100,
    step: 5
  }
};

const SUGGESTED_PRESETS: Array<{
  name: string;
  metric: AlertMetricType;
  threshold: number;
  operator: AlertOperator;
  unit: string;
  severity: AlertSeverity;
  targetAgentId: 'all' | string;
  description: string;
}> = [
  {
    name: 'Latency SLA Breach (> 200ms)',
    metric: 'latency',
    threshold: 200,
    operator: '>',
    unit: 'ms',
    severity: 'warn',
    targetAgentId: 'all',
    description: 'Notifies when any agent turn exceeds 200ms latency.'
  },
  {
    name: 'Builder Timeout Spike (> 2000ms)',
    metric: 'latency',
    threshold: 2000,
    operator: '>',
    unit: 'ms',
    severity: 'error',
    targetAgentId: 'a3',
    description: 'Triggers when Coder agent takes over 2 seconds.'
  },
  {
    name: 'Slow Generation Throughput (< 100 tok/s)',
    metric: 'tokensPerSec',
    threshold: 100,
    operator: '<',
    unit: 'tok/s',
    severity: 'warn',
    targetAgentId: 'all',
    description: 'Alerts when token throughput falls below 100 t/s.'
  },
  {
    name: 'High Prompt Token Usage (> 2500 tokens)',
    metric: 'tokenUsage',
    threshold: 2500,
    operator: '>',
    unit: 'tokens',
    severity: 'warn',
    targetAgentId: 'all',
    description: 'Warns when a single step exceeds 2,500 tokens.'
  },
  {
    name: 'Zero Error Tolerance (>= 1 error)',
    metric: 'errorCount',
    threshold: 1,
    operator: '>=',
    unit: 'errors',
    severity: 'error',
    targetAgentId: 'all',
    description: 'Immediate alert on any execution failure.'
  }
];

export function PerformanceAlertsModal() {
  const {
    isAlertsModalOpen,
    closePerformanceAlertsModal,
    alertRules,
    alertHistory,
    alertSettings,
    saveAlertRule,
    deleteAlertRule,
    toggleAlertRule,
    resetAlertRulesToDefaults,
    testFireAlertRule,
    simulateLatencySpike,
    acknowledgeBreach,
    acknowledgeAllBreaches,
    clearAlertHistory,
    updateAlertSettings,
    activeAgents,
    selectAgentForLogs
  } = useSimulation();

  const [activeTab, setActiveTab] = useState<'rules' | 'history' | 'settings'>('rules');
  const [selectedMetricFilter, setSelectedMetricFilter] = useState<'all' | AlertMetricType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Editor Form State
  const [isEditingRule, setIsEditingRule] = useState<boolean>(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formMetric, setFormMetric] = useState<AlertMetricType>('latency');
  const [formTargetAgentId, setFormTargetAgentId] = useState<'all' | string>('all');
  const [formOperator, setFormOperator] = useState<AlertOperator>('>');
  const [formThreshold, setFormThreshold] = useState<number>(200);
  const [formSeverity, setFormSeverity] = useState<AlertSeverity>('warn');
  const [formCooldownSec, setFormCooldownSec] = useState<number>(10);
  const [formToastEnabled, setFormToastEnabled] = useState<boolean>(true);
  const [formTerminalEnabled, setFormTerminalEnabled] = useState<boolean>(true);
  const [formSoundEnabled, setFormSoundEnabled] = useState<boolean>(true);
  const [formAgentLogEnabled, setFormAgentLogEnabled] = useState<boolean>(true);

  if (!isAlertsModalOpen) return null;

  const handleOpenCreate = () => {
    setEditingRuleId(null);
    setFormName('Global Latency Warning (> 200ms)');
    setFormDescription('Alerts whenever agent execution duration exceeds 200ms target response.');
    setFormMetric('latency');
    setFormTargetAgentId('all');
    setFormOperator('>');
    setFormThreshold(200);
    setFormSeverity('warn');
    setFormCooldownSec(10);
    setFormToastEnabled(true);
    setFormTerminalEnabled(true);
    setFormSoundEnabled(true);
    setFormAgentLogEnabled(true);
    setIsEditingRule(true);
  };

  const handleOpenEdit = (rule: PerformanceAlertRule) => {
    setEditingRuleId(rule.id);
    setFormName(rule.name);
    setFormDescription(rule.description || '');
    setFormMetric(rule.metric);
    setFormTargetAgentId(rule.targetAgentId);
    setFormOperator(rule.operator);
    setFormThreshold(rule.threshold);
    setFormSeverity(rule.severity);
    setFormCooldownSec(rule.cooldownSec ?? 10);
    setFormToastEnabled(rule.notificationChannels?.toast ?? true);
    setFormTerminalEnabled(rule.notificationChannels?.terminal ?? true);
    setFormSoundEnabled(rule.notificationChannels?.sound ?? true);
    setFormAgentLogEnabled(rule.notificationChannels?.agentLog ?? true);
    setIsEditingRule(true);
  };

  const handleApplyPreset = (preset: typeof SUGGESTED_PRESETS[0]) => {
    setFormName(preset.name);
    setFormDescription(preset.description);
    setFormMetric(preset.metric);
    setFormTargetAgentId(preset.targetAgentId);
    setFormOperator(preset.operator);
    setFormThreshold(preset.threshold);
    setFormSeverity(preset.severity);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    const meta = METRIC_METADATA[formMetric];
    const newRule: PerformanceAlertRule = {
      id: editingRuleId || `rule-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: formName.trim() || `${meta.label} Alert`,
      description: formDescription.trim(),
      metric: formMetric,
      targetAgentId: formTargetAgentId,
      operator: formOperator,
      threshold: Number(formThreshold),
      unit: meta.unit,
      severity: formSeverity,
      enabled: true,
      cooldownSec: Number(formCooldownSec) || 10,
      notificationChannels: {
        toast: formToastEnabled,
        terminal: formTerminalEnabled,
        sound: formSoundEnabled,
        agentLog: formAgentLogEnabled
      },
      triggerCount: 0,
      createdAt: new Date().toISOString()
    };

    saveAlertRule(newRule);
    setIsEditingRule(false);
  };

  const handleDuplicate = (rule: PerformanceAlertRule) => {
    const duplicated: PerformanceAlertRule = {
      ...rule,
      id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: `${rule.name} (Copy)`,
      triggerCount: 0,
      createdAt: new Date().toISOString()
    };
    saveAlertRule(duplicated);
  };

  const filteredRules = useMemo(() => {
    return alertRules.filter(rule => {
      const matchesMetric = selectedMetricFilter === 'all' || rule.metric === selectedMetricFilter;
      const matchesSearch = searchQuery === '' || 
        rule.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (rule.description && rule.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesMetric && matchesSearch;
    });
  }, [alertRules, selectedMetricFilter, searchQuery]);

  const activeRulesCount = alertRules.filter(r => r.enabled).length;
  const unreadBreachesCount = alertHistory.filter(h => !h.acknowledged).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-hidden select-none">
      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.16 }}
        className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl w-full max-w-5xl h-[88vh] max-h-[820px] flex flex-col overflow-hidden text-gray-100 relative"
      >
        {/* Top Header Bar */}
        <div className="px-5 py-3.5 border-b border-gray-800 bg-gray-950/80 flex items-center justify-between shrink-0 gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h2 className="text-base font-semibold text-gray-100 tracking-tight">
                  Performance Threshold Alerts
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-blue-950/80 text-blue-300 border border-blue-800/60">
                  {activeRulesCount} Active Rules
                </span>
                {unreadBreachesCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-rose-950/90 text-rose-300 border border-rose-800/80 animate-pulse">
                    {unreadBreachesCount} Unread Breaches
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400">
                Configure SLA thresholds, latency limits (e.g. &gt; 200ms), and automated toast notifications.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {/* Quick Test Fire Latency Button */}
            <button
              onClick={() => simulateLatencySpike('a1', 340)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 transition-colors shadow-sm"
              title="Simulate Latency Spike (> 200ms) to verify toast notification"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>Simulate Latency Spike (&gt; 200ms)</span>
            </button>

            <button
              onClick={handleOpenCreate}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Alert Rule</span>
            </button>

            <button
              onClick={closePerformanceAlertsModal}
              className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-gray-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-Header & Navigation Tabs */}
        <div className="px-5 py-2 border-b border-gray-800 bg-gray-900/90 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-1">
            <button
              onClick={() => { setActiveTab('rules'); setIsEditingRule(false); }}
              className={cn(
                "flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                activeTab === 'rules' && !isEditingRule
                  ? "bg-gray-800 text-white font-semibold shadow-sm border border-gray-700"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
              )}
            >
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              <span>Alert Rules</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-gray-950 text-gray-300">
                {alertRules.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('history'); setIsEditingRule(false); }}
              className={cn(
                "flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                activeTab === 'history'
                  ? "bg-gray-800 text-white font-semibold shadow-sm border border-gray-700"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
              )}
            >
              <History className="w-3.5 h-3.5 text-purple-400" />
              <span>Breach Audit Log</span>
              {unreadBreachesCount > 0 ? (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-900/80 text-rose-300">
                  {unreadBreachesCount} new
                </span>
              ) : (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-gray-950 text-gray-400">
                  {alertHistory.length}
                </span>
              )}
            </button>

            <button
              onClick={() => { setActiveTab('settings'); setIsEditingRule(false); }}
              className={cn(
                "flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                activeTab === 'settings'
                  ? "bg-gray-800 text-white font-semibold shadow-sm border border-gray-700"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
              )}
            >
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              <span>Engine Settings</span>
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 text-xs text-gray-400">
              <span>Engine Master:</span>
              <button
                onClick={() => updateAlertSettings({ isGloballyEnabled: !alertSettings.isGloballyEnabled })}
                className={cn(
                  "flex items-center space-x-1.5 px-2 py-0.5 rounded text-[11px] font-medium transition-colors border",
                  alertSettings.isGloballyEnabled
                    ? "bg-emerald-950/80 border-emerald-700 text-emerald-300"
                    : "bg-gray-800 border-gray-700 text-gray-400"
                )}
              >
                <span className={cn("w-1.5 h-1.5 rounded-full", alertSettings.isGloballyEnabled ? "bg-emerald-400 animate-pulse" : "bg-gray-500")} />
                <span>{alertSettings.isGloballyEnabled ? 'Active' : 'Muted'}</span>
              </button>
            </div>

            <button
              onClick={resetAlertRulesToDefaults}
              className="flex items-center space-x-1 px-2 py-1 rounded text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
              title="Reset all alert rules to factory default configuration"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">Reset Defaults</span>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col bg-gray-950/60">
          {/* TAB 1: RULES LIST */}
          {activeTab === 'rules' && !isEditingRule && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col space-y-4">
              {/* Filter Bar & Search */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
                <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                  <button
                    onClick={() => setSelectedMetricFilter('all')}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors",
                      selectedMetricFilter === 'all'
                        ? "bg-blue-600 text-white font-semibold"
                        : "bg-gray-800/80 text-gray-400 hover:text-gray-200 hover:bg-gray-700/80"
                    )}
                  >
                    All Metrics ({alertRules.length})
                  </button>

                  <button
                    onClick={() => setSelectedMetricFilter('latency')}
                    className={cn(
                      "flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors",
                      selectedMetricFilter === 'latency'
                        ? "bg-blue-600 text-white font-semibold"
                        : "bg-gray-800/80 text-gray-400 hover:text-gray-200 hover:bg-gray-700/80"
                    )}
                  >
                    <Clock className="w-3 h-3 text-blue-400" />
                    <span>Latency</span>
                  </button>

                  <button
                    onClick={() => setSelectedMetricFilter('tokensPerSec')}
                    className={cn(
                      "flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors",
                      selectedMetricFilter === 'tokensPerSec'
                        ? "bg-emerald-600 text-white font-semibold"
                        : "bg-gray-800/80 text-gray-400 hover:text-gray-200 hover:bg-gray-700/80"
                    )}
                  >
                    <Zap className="w-3 h-3 text-emerald-400" />
                    <span>Throughput</span>
                  </button>

                  <button
                    onClick={() => setSelectedMetricFilter('tokenUsage')}
                    className={cn(
                      "flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors",
                      selectedMetricFilter === 'tokenUsage'
                        ? "bg-amber-600 text-white font-semibold"
                        : "bg-gray-800/80 text-gray-400 hover:text-gray-200 hover:bg-gray-700/80"
                    )}
                  >
                    <Layers className="w-3 h-3 text-amber-400" />
                    <span>Tokens</span>
                  </button>

                  <button
                    onClick={() => setSelectedMetricFilter('errorCount')}
                    className={cn(
                      "flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors",
                      selectedMetricFilter === 'errorCount'
                        ? "bg-rose-600 text-white font-semibold"
                        : "bg-gray-800/80 text-gray-400 hover:text-gray-200 hover:bg-gray-700/80"
                    )}
                  >
                    <AlertOctagon className="w-3 h-3 text-rose-400" />
                    <span>Errors</span>
                  </button>

                  <button
                    onClick={() => setSelectedMetricFilter('successRate')}
                    className={cn(
                      "flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors",
                      selectedMetricFilter === 'successRate'
                        ? "bg-indigo-600 text-white font-semibold"
                        : "bg-gray-800/80 text-gray-400 hover:text-gray-200 hover:bg-gray-700/80"
                    )}
                  >
                    <CheckCircle2 className="w-3 h-3 text-indigo-400" />
                    <span>Success Rate</span>
                  </button>
                </div>

                <div className="relative w-full sm:w-60 shrink-0">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search rules..."
                    className="w-full pl-8 pr-3 py-1 bg-gray-900 border border-gray-800 rounded-md text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Rules Cards List */}
              <div className="space-y-2.5">
                {filteredRules.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 border border-dashed border-gray-800 rounded-xl">
                    <AlertCircle className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-300">No alert rules match your criteria</p>
                    <p className="text-xs text-gray-500 mt-1">Try changing the metric filter or create a new alert rule.</p>
                    <button
                      onClick={handleOpenCreate}
                      className="mt-3 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-md inline-flex items-center space-x-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create New Rule</span>
                    </button>
                  </div>
                ) : (
                  filteredRules.map(rule => {
                    const meta = METRIC_METADATA[rule.metric] || METRIC_METADATA.latency;
                    const MetricIcon = meta.icon;
                    const targetAgent = activeAgents.find(a => a.id === rule.targetAgentId);

                    return (
                      <div
                        key={rule.id}
                        className={cn(
                          "p-3.5 rounded-lg border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3",
                          rule.enabled
                            ? "bg-gray-900/90 border-gray-800 hover:border-gray-700 shadow-sm"
                            : "bg-gray-950/60 border-gray-800/50 opacity-60"
                        )}
                      >
                        <div className="flex items-start space-x-3.5 flex-1 min-w-0">
                          {/* Toggle Switch */}
                          <div className="pt-0.5">
                            <button
                              type="button"
                              onClick={() => toggleAlertRule(rule.id)}
                              className={cn(
                                "w-9 h-5 rounded-full transition-colors relative focus:outline-none",
                                rule.enabled ? "bg-blue-600" : "bg-gray-700"
                              )}
                              title={rule.enabled ? 'Click to disable rule' : 'Click to enable rule'}
                            >
                              <span
                                className={cn(
                                  "w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform",
                                  rule.enabled ? "left-4" : "left-1"
                                )}
                              />
                            </button>
                          </div>

                          {/* Rule Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-sm font-semibold text-gray-100 truncate">
                                {rule.name}
                              </h3>

                              {/* Severity Badge */}
                              <span className={cn(
                                "px-1.5 py-0.2 text-[10px] font-bold rounded uppercase tracking-wider",
                                rule.severity === 'error' && "bg-rose-950 text-rose-300 border border-rose-800/80",
                                rule.severity === 'warn' && "bg-amber-950 text-amber-300 border border-amber-800/80",
                                rule.severity === 'info' && "bg-blue-950 text-blue-300 border border-blue-800/80"
                              )}>
                                {rule.severity === 'error' ? 'CRITICAL' : rule.severity.toUpperCase()}
                              </span>

                              {/* Metric & Threshold Expression */}
                              <span className="px-2 py-0.5 rounded bg-gray-950 border border-gray-800 text-blue-300 font-mono text-xs font-semibold flex items-center gap-1.5">
                                <MetricIcon className="w-3 h-3 text-blue-400" />
                                {meta.label} {rule.operator} {rule.threshold}{rule.unit}
                              </span>

                              {/* Scope Badge */}
                              <span className="px-2 py-0.5 rounded bg-gray-950 border border-gray-800 text-gray-300 text-[11px] font-medium flex items-center gap-1">
                                <Cpu className="w-3 h-3 text-purple-400" />
                                {rule.targetAgentId === 'all' 
                                  ? 'All Sub-Agents' 
                                  : targetAgent ? `${targetAgent.name} (${targetAgent.role})` : rule.targetAgentId}
                              </span>
                            </div>

                            {rule.description && (
                              <p className="text-xs text-gray-400 mt-1 leading-relaxed line-clamp-1">
                                {rule.description}
                              </p>
                            )}

                            {/* Rule Metadata Ribbon */}
                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-500 mt-2 font-mono">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-gray-400" />
                                Cooldown: {rule.cooldownSec ?? 10}s
                              </span>

                              <span>•</span>

                              <span className="flex items-center gap-1 text-gray-400">
                                Triggered: <strong className="text-gray-200">{rule.triggerCount || 0}x</strong>
                              </span>

                              {rule.lastTriggered && (
                                <>
                                  <span>•</span>
                                  <span className="text-gray-400">
                                    Last fired: {new Date(rule.lastTriggered).toLocaleTimeString()}
                                  </span>
                                </>
                              )}

                              <span>•</span>

                              <div className="flex items-center space-x-1.5 text-gray-400">
                                {rule.notificationChannels?.toast && (
                                  <span className="px-1 rounded bg-blue-950/60 text-blue-300 border border-blue-900/50 text-[10px]">
                                    Toast
                                  </span>
                                )}
                                {rule.notificationChannels?.terminal && (
                                  <span className="px-1 rounded bg-purple-950/60 text-purple-300 border border-purple-900/50 text-[10px]">
                                    Terminal
                                  </span>
                                )}
                                {rule.notificationChannels?.sound && (
                                  <span className="px-1 rounded bg-amber-950/60 text-amber-300 border border-amber-900/50 text-[10px]">
                                    Audio
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Actions Toolbar */}
                        <div className="flex items-center space-x-1.5 self-end sm:self-center shrink-0">
                          <button
                            onClick={() => testFireAlertRule(rule.id)}
                            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-colors"
                            title="Test fire this alert rule to preview the toast notification"
                          >
                            <Play className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span>Test Fire</span>
                          </button>

                          <button
                            onClick={() => handleOpenEdit(rule)}
                            className="p-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition-colors"
                            title="Edit rule parameters"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDuplicate(rule)}
                            className="p-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition-colors"
                            title="Duplicate this rule"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => deleteAlertRule(rule.id)}
                            className="p-1.5 rounded-md bg-gray-800 hover:bg-rose-900/60 text-gray-400 hover:text-rose-300 border border-gray-700 hover:border-rose-700 transition-colors"
                            title="Delete this rule"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 1 MODAL FORM: CREATE / EDIT RULE */}
          {isEditingRule && (
            <div className="flex-1 overflow-y-auto p-5">
              <div className="max-w-3xl mx-auto bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-lg">
                <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-4">
                  <div>
                    <h3 className="text-base font-bold text-gray-100 flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-blue-400" />
                      {editingRuleId ? 'Edit Performance Alert Rule' : 'Create New Threshold Alert Rule'}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Define condition logic and notification behavior for agent execution metrics.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsEditingRule(false)}
                    className="p-1.5 text-gray-400 hover:text-gray-200 rounded-lg hover:bg-gray-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Quick Presets Carousel */}
                <div className="mb-4 p-3 rounded-lg bg-gray-950 border border-gray-800">
                  <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    Quick Preset Templates:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {SUGGESTED_PRESETS.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleApplyPreset(p)}
                        className="px-2.5 py-1 rounded bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-200 text-xs font-medium transition-colors flex items-center space-x-1"
                      >
                        <span>{p.name}</span>
                        <ChevronRight className="w-3 h-3 text-gray-500" />
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleSaveForm} className="space-y-4 text-xs">
                  {/* Row 1: Rule Name */}
                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">
                      Rule Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g., Global Latency Warning (> 200ms)"
                      className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
                    />
                  </div>

                  {/* Row 2: Metric & Target Agent */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-300 font-semibold mb-1">
                        Performance Metric <span className="text-rose-400">*</span>
                      </label>
                      <select
                        value={formMetric}
                        onChange={(e) => {
                          const m = e.target.value as AlertMetricType;
                          setFormMetric(m);
                          const meta = METRIC_METADATA[m];
                          setFormThreshold(meta.defaultThreshold);
                          setFormOperator(meta.defaultOperator);
                        }}
                        className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-gray-100 focus:outline-none focus:border-blue-500"
                      >
                        {Object.entries(METRIC_METADATA).map(([key, meta]) => (
                          <option key={key} value={key}>
                            {meta.label} ({meta.unit})
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-gray-500 mt-1">
                        {METRIC_METADATA[formMetric].description}
                      </p>
                    </div>

                    <div>
                      <label className="block text-gray-300 font-semibold mb-1">
                        Target Sub-Agent Scope <span className="text-rose-400">*</span>
                      </label>
                      <select
                        value={formTargetAgentId}
                        onChange={(e) => setFormTargetAgentId(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-gray-100 focus:outline-none focus:border-blue-500"
                      >
                        <option value="all">⚡ All Sub-Agents (Global)</option>
                        {activeAgents.map(agent => (
                          <option key={agent.id} value={agent.id}>
                            {agent.name} — {agent.role} ({agent.flavor})
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-gray-500 mt-1">
                        Apply threshold to all agents or isolate to specific specialist.
                      </p>
                    </div>
                  </div>

                  {/* Row 3: Condition Operator & Threshold Value */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-gray-950/80 rounded-lg border border-gray-800">
                    <div>
                      <label className="block text-gray-300 font-semibold mb-1">
                        Comparison Operator
                      </label>
                      <select
                        value={formOperator}
                        onChange={(e) => setFormOperator(e.target.value as AlertOperator)}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-blue-500 font-mono"
                      >
                        <option value=">">&gt; Greater than</option>
                        <option value=">=">&gt;= At least / Greater or Equal</option>
                        <option value="<">&lt; Less than (Floor breach)</option>
                        <option value="<=">&lt;= At most / Less or Equal</option>
                        <option value="==">== Exactly equals</option>
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-gray-300 font-semibold">
                          Threshold Value ({METRIC_METADATA[formMetric].unit})
                        </label>
                        <span className="font-mono font-bold text-blue-400 text-sm">
                          {formThreshold} {METRIC_METADATA[formMetric].unit}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          required
                          min={METRIC_METADATA[formMetric].min}
                          max={METRIC_METADATA[formMetric].max}
                          step={METRIC_METADATA[formMetric].step}
                          value={formThreshold}
                          onChange={(e) => setFormThreshold(Number(e.target.value))}
                          className="w-28 px-3 py-1.5 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 font-mono text-sm focus:outline-none focus:border-blue-500"
                        />
                        <input
                          type="range"
                          min={METRIC_METADATA[formMetric].min}
                          max={METRIC_METADATA[formMetric].max}
                          step={METRIC_METADATA[formMetric].step}
                          value={formThreshold}
                          onChange={(e) => setFormThreshold(Number(e.target.value))}
                          className="flex-1 accent-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 4: Severity & Cooldown */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-300 font-semibold mb-1">
                        Alert Severity Level
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setFormSeverity('info')}
                          className={cn(
                            "py-2 rounded-lg text-xs font-semibold border flex items-center justify-center space-x-1 transition-all",
                            formSeverity === 'info'
                              ? "bg-blue-950 border-blue-600 text-blue-200 shadow-sm"
                              : "bg-gray-950 border-gray-800 text-gray-400 hover:text-gray-200"
                          )}
                        >
                          <Info className="w-3.5 h-3.5 text-blue-400" />
                          <span>Info</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setFormSeverity('warn')}
                          className={cn(
                            "py-2 rounded-lg text-xs font-semibold border flex items-center justify-center space-x-1 transition-all",
                            formSeverity === 'warn'
                              ? "bg-amber-950 border-amber-600 text-amber-200 shadow-sm"
                              : "bg-gray-950 border-gray-800 text-gray-400 hover:text-gray-200"
                          )}
                        >
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                          <span>Warning</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setFormSeverity('error')}
                          className={cn(
                            "py-2 rounded-lg text-xs font-semibold border flex items-center justify-center space-x-1 transition-all",
                            formSeverity === 'error'
                              ? "bg-rose-950 border-rose-600 text-rose-200 shadow-sm"
                              : "bg-gray-950 border-gray-800 text-gray-400 hover:text-gray-200"
                          )}
                        >
                          <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                          <span>Critical</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-gray-300 font-semibold">
                          Cooldown Period (Anti-Flood)
                        </label>
                        <span className="font-mono text-gray-400 text-xs">
                          {formCooldownSec}s
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="120"
                        step="5"
                        value={formCooldownSec}
                        onChange={(e) => setFormCooldownSec(Number(e.target.value))}
                        className="w-full accent-blue-500"
                      />
                      <p className="text-[11px] text-gray-500 mt-1">
                        Minimum seconds between consecutive toast alerts to prevent screen spam.
                      </p>
                    </div>
                  </div>

                  {/* Row 5: Notification Channels */}
                  <div>
                    <label className="block text-gray-300 font-semibold mb-1.5">
                      Notification Dispatch Channels
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <label className="flex items-center space-x-2 p-2.5 rounded-lg bg-gray-950 border border-gray-800 cursor-pointer hover:bg-gray-800/40">
                        <input
                          type="checkbox"
                          checked={formToastEnabled}
                          onChange={(e) => setFormToastEnabled(e.target.checked)}
                          className="rounded text-blue-600 focus:ring-0"
                        />
                        <span className="text-xs text-gray-200 font-medium flex items-center gap-1">
                          <Bell className="w-3.5 h-3.5 text-blue-400" /> Toast Popup
                        </span>
                      </label>

                      <label className="flex items-center space-x-2 p-2.5 rounded-lg bg-gray-950 border border-gray-800 cursor-pointer hover:bg-gray-800/40">
                        <input
                          type="checkbox"
                          checked={formTerminalEnabled}
                          onChange={(e) => setFormTerminalEnabled(e.target.checked)}
                          className="rounded text-blue-600 focus:ring-0"
                        />
                        <span className="text-xs text-gray-200 font-medium flex items-center gap-1">
                          <Terminal className="w-3.5 h-3.5 text-purple-400" /> Terminal Log
                        </span>
                      </label>

                      <label className="flex items-center space-x-2 p-2.5 rounded-lg bg-gray-950 border border-gray-800 cursor-pointer hover:bg-gray-800/40">
                        <input
                          type="checkbox"
                          checked={formSoundEnabled}
                          onChange={(e) => setFormSoundEnabled(e.target.checked)}
                          className="rounded text-blue-600 focus:ring-0"
                        />
                        <span className="text-xs text-gray-200 font-medium flex items-center gap-1">
                          <Volume2 className="w-3.5 h-3.5 text-amber-400" /> Sound Chime
                        </span>
                      </label>

                      <label className="flex items-center space-x-2 p-2.5 rounded-lg bg-gray-950 border border-gray-800 cursor-pointer hover:bg-gray-800/40">
                        <input
                          type="checkbox"
                          checked={formAgentLogEnabled}
                          onChange={(e) => setFormAgentLogEnabled(e.target.checked)}
                          className="rounded text-blue-600 focus:ring-0"
                        />
                        <span className="text-xs text-gray-200 font-medium flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 text-emerald-400" /> Agent Drawer
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Toast Preview Card */}
                  <div className="p-3.5 rounded-lg bg-gray-950 border border-gray-800">
                    <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      Live Toast Notification Preview:
                    </div>
                    <div className={cn(
                      "p-3 rounded-lg border flex items-start space-x-3 text-xs shadow-md",
                      formSeverity === 'error' && "bg-rose-950/80 border-rose-800 text-rose-100",
                      formSeverity === 'warn' && "bg-amber-950/80 border-amber-800 text-amber-100",
                      formSeverity === 'info' && "bg-blue-950/80 border-blue-800 text-blue-100"
                    )}>
                      {formSeverity === 'error' ? (
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      ) : formSeverity === 'warn' ? (
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      ) : (
                        <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-100">
                          {formSeverity === 'error' ? '🚨' : formSeverity === 'warn' ? '⚠️' : 'ℹ️'} {formName || 'Performance Alert'}
                        </div>
                        <div className="text-gray-300 text-[11px] mt-0.5">
                          Agent Coder (Builder) observed 340{METRIC_METADATA[formMetric].unit} which breached threshold ({formOperator} {formThreshold}{METRIC_METADATA[formMetric].unit}).
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-gray-900 border border-gray-700 text-gray-300 text-[10px] font-medium shrink-0">
                        Configure Alerts
                      </span>
                    </div>
                  </div>

                  {/* Form Action Buttons */}
                  <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-800">
                    <button
                      type="button"
                      onClick={() => setIsEditingRule(false)}
                      className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold transition-colors"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors shadow-sm flex items-center space-x-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>{editingRuleId ? 'Save Rule Changes' : 'Create Alert Rule'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: BREACH AUDIT HISTORY LOG */}
          {activeTab === 'history' && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col space-y-3">
              <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-semibold text-gray-200">
                    Historical Threshold Breaches ({alertHistory.length})
                  </h3>
                  <span className="text-xs text-gray-500">
                    Audit log of SLA violations and performance spikes.
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  {unreadBreachesCount > 0 && (
                    <button
                      onClick={acknowledgeAllBreaches}
                      className="px-2.5 py-1 rounded bg-blue-950 hover:bg-blue-900 border border-blue-800 text-blue-300 text-xs font-medium transition-colors"
                    >
                      Acknowledge All ({unreadBreachesCount})
                    </button>
                  )}

                  {alertHistory.length > 0 && (
                    <button
                      onClick={clearAlertHistory}
                      className="px-2.5 py-1 rounded bg-gray-800 hover:bg-rose-950 hover:text-rose-300 border border-gray-700 text-gray-400 text-xs font-medium transition-colors flex items-center space-x-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Clear Audit Log</span>
                    </button>
                  )}
                </div>
              </div>

              {alertHistory.length === 0 ? (
                <div className="py-16 text-center text-gray-400 border border-dashed border-gray-800 rounded-xl">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500/80 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gray-200">No Threshold Breaches Recorded</p>
                  <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                    All sub-agents are performing cleanly within configured SLA boundaries.
                  </p>
                  <button
                    onClick={() => simulateLatencySpike('a1', 350)}
                    className="mt-3 px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-semibold rounded-md inline-flex items-center space-x-1.5"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Simulate Latency Spike to Test</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {alertHistory.map(record => (
                    <div
                      key={record.id}
                      className={cn(
                        "p-3 rounded-lg border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs",
                        record.acknowledged
                          ? "bg-gray-900/60 border-gray-800/80 text-gray-400"
                          : "bg-gray-900 border-amber-900/60 text-gray-200 shadow-sm"
                      )}
                    >
                      <div className="flex items-start space-x-3 flex-1 min-w-0">
                        <div className="pt-0.5">
                          {record.severity === 'error' ? (
                            <div className="p-1.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                              <AlertCircle className="w-4 h-4" />
                            </div>
                          ) : record.severity === 'warn' ? (
                            <div className="p-1.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              <AlertTriangle className="w-4 h-4" />
                            </div>
                          ) : (
                            <div className="p-1.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              <Info className="w-4 h-4" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-gray-100">
                              {record.ruleName}
                            </span>
                            <span className="font-mono text-gray-400 text-[11px]">
                              {new Date(record.timestamp).toLocaleTimeString()}
                            </span>
                            {!record.acknowledged && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-bold">
                                UNACKNOWLEDGED
                              </span>
                            )}
                          </div>

                          <p className="text-gray-300 mt-1">
                            {record.message}
                          </p>

                          <div className="mt-1.5 flex items-center gap-3 font-mono text-[11px] text-gray-400">
                            <span>Observed: <strong className="text-rose-300">{record.observedValue}{record.unit}</strong></span>
                            <span>•</span>
                            <span>Threshold: <strong className="text-gray-300">{record.operator} {record.thresholdValue}{record.unit}</strong></span>
                            {record.agentName && (
                              <>
                                <span>•</span>
                                <span>Agent: <strong className="text-blue-300">{record.agentName}</strong></span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 self-end sm:self-center shrink-0">
                        {record.agentId && (
                          <button
                            onClick={() => {
                              selectAgentForLogs(record.agentId!);
                              closePerformanceAlertsModal();
                            }}
                            className="px-2.5 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium transition-colors"
                          >
                            View Logs
                          </button>
                        )}

                        {!record.acknowledged && (
                          <button
                            onClick={() => acknowledgeBreach(record.id)}
                            className="px-2.5 py-1 rounded bg-blue-950 hover:bg-blue-900 border border-blue-800 text-blue-200 text-xs font-semibold transition-colors"
                          >
                            Acknowledge
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ENGINE SETTINGS */}
          {activeTab === 'settings' && (
            <div className="flex-1 overflow-y-auto p-5">
              <div className="max-w-2xl mx-auto space-y-4">
                <div className="p-4 rounded-xl bg-gray-900 border border-gray-800 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-gray-100 border-b border-gray-800 pb-2">
                    Alert Engine Global Parameters
                  </h3>

                  {/* Setting 1: Global Master Switch */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-gray-200">Alert Engine Master Toggle</div>
                      <div className="text-[11px] text-gray-400">Globally evaluate all incoming agent metrics and telemetry.</div>
                    </div>
                    <button
                      onClick={() => updateAlertSettings({ isGloballyEnabled: !alertSettings.isGloballyEnabled })}
                      className={cn(
                        "w-11 h-6 rounded-full transition-colors relative focus:outline-none",
                        alertSettings.isGloballyEnabled ? "bg-emerald-600" : "bg-gray-700"
                      )}
                    >
                      <span
                        className={cn(
                          "w-4 h-4 rounded-full bg-white absolute top-1 transition-transform",
                          alertSettings.isGloballyEnabled ? "left-6" : "left-1"
                        )}
                      />
                    </button>
                  </div>

                  {/* Setting 2: Web Audio Synthesized Chime */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-gray-200">Synthesized Audio Alert Chimes</div>
                      <div className="text-[11px] text-gray-400">Play harmonized Web Audio bells when threshold is breached.</div>
                    </div>
                    <button
                      onClick={() => updateAlertSettings({ soundEnabled: !alertSettings.soundEnabled })}
                      className={cn(
                        "w-11 h-6 rounded-full transition-colors relative focus:outline-none",
                        alertSettings.soundEnabled ? "bg-blue-600" : "bg-gray-700"
                      )}
                    >
                      <span
                        className={cn(
                          "w-4 h-4 rounded-full bg-white absolute top-1 transition-transform",
                          alertSettings.soundEnabled ? "left-6" : "left-1"
                        )}
                      />
                    </button>
                  </div>

                  {/* Setting 3: Default Cooldown */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-200">Default Flood Cooldown</span>
                      <span className="font-mono font-bold text-blue-400">{alertSettings.defaultCooldownSec}s</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="60"
                      step="5"
                      value={alertSettings.defaultCooldownSec}
                      onChange={(e) => updateAlertSettings({ defaultCooldownSec: Number(e.target.value) })}
                      className="w-full accent-blue-500"
                    />
                    <div className="text-[11px] text-gray-500">
                      Standard suppression delay for repeated metric violations of the same rule.
                    </div>
                  </div>

                  {/* Setting 4: Retention */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-200">Audit History Retention Limit</span>
                      <span className="font-mono font-bold text-blue-400">{alertSettings.retentionMaxRecords} entries</span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="200"
                      step="10"
                      value={alertSettings.retentionMaxRecords}
                      onChange={(e) => updateAlertSettings({ retentionMaxRecords: Number(e.target.value) })}
                      className="w-full accent-blue-500"
                    />
                  </div>
                </div>

                {/* Simulation Playground Bar */}
                <div className="p-4 rounded-xl bg-gray-900 border border-gray-800 space-y-3">
                  <h3 className="text-sm font-bold text-gray-100 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400" />
                    Interactive Breach Simulation Bar
                  </h3>
                  <p className="text-xs text-gray-400">
                    Instantly simulate metric spikes to test toast notifications and sound alarms:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      onClick={() => simulateLatencySpike('a1', 340)}
                      className="p-2.5 rounded-lg bg-gray-950 hover:bg-gray-800 border border-gray-700 text-left flex items-start space-x-2.5 transition-colors"
                    >
                      <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-semibold text-gray-200">Simulate Latency Spike (340ms)</div>
                        <div className="text-[11px] text-gray-500">Breaches &gt; 200ms latency threshold</div>
                      </div>
                    </button>

                    <button
                      onClick={() => simulateLatencySpike('a3', 2400)}
                      className="p-2.5 rounded-lg bg-gray-950 hover:bg-gray-800 border border-gray-700 text-left flex items-start space-x-2.5 transition-colors"
                    >
                      <Clock className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-semibold text-gray-200">Simulate Coder Timeout (2.4s)</div>
                        <div className="text-[11px] text-gray-500">Breaches &gt; 2000ms critical threshold</div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t border-gray-800 bg-gray-950/80 flex items-center justify-between text-xs text-gray-400 shrink-0">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-gray-500">STORAGE:</span>
            <span className="text-gray-300">Local persistent rule store active</span>
          </div>

          <div className="flex items-center space-x-2">
            <kbd className="px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded text-[10px] font-mono text-gray-400">
              Esc to close
            </kbd>
            <button
              onClick={closePerformanceAlertsModal}
              className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 font-medium rounded-md transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
