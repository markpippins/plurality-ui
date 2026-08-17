import React, { useState, useMemo } from 'react';
import { useSimulation } from '../hooks/useSimulation';
import { 
  ResponsiveContainer, ComposedChart, AreaChart, Area, BarChart, Bar, 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ReferenceLine, Cell
} from 'recharts';
import { 
  Activity, Zap, Clock, TrendingUp, ShieldAlert, CheckCircle2, 
  Sliders, Layers, Sparkles, Filter, ChevronDown, RefreshCw, 
  Cpu, ArrowRight, BarChart3, AlertTriangle, Target
} from 'lucide-react';
import { cn } from '../lib/utils';
import { 
  WorkRequest, 
  TaskLifecyclePerformanceReport, 
  TaskLifecycleStageMetric, 
  generateTaskLifecycleMetrics 
} from '../types';

interface TaskLifecycleTrendsChartProps {
  initialTaskId?: string;
  className?: string;
  onOpenAgentLogs?: (agentId: string) => void;
}

type ChartViewMode = 'trajectory' | 'latency_sla' | 'throughput' | 'quality';

export function TaskLifecycleTrendsChart({
  initialTaskId,
  className,
  onOpenAgentLogs
}: TaskLifecycleTrendsChartProps) {
  const { workRequests, activeWorkRequest, selectAgentForLogs } = useSimulation();

  // Selected work request to visualize
  const [selectedTaskId, setSelectedTaskId] = useState<string>(
    initialTaskId || activeWorkRequest?.id || (workRequests[0]?.id ?? 'wr-1')
  );

  const [viewMode, setViewMode] = useState<ChartViewMode>('trajectory');
  const [activeSeries, setActiveSeries] = useState<{ [key: string]: boolean }>({
    promptTokens: true,
    completionTokens: true,
    cumulativeTokens: true,
    durationMs: true,
    slaTargetMs: true,
    tokensPerSec: true,
    confidenceScore: true,
    riskScore: true,
    alignmentScore: true
  });

  const [hoveredStage, setHoveredStage] = useState<TaskLifecycleStageMetric | null>(null);

  // Find target work request
  const currentWr = useMemo(() => {
    return workRequests.find((w: WorkRequest) => w.id === selectedTaskId) || activeWorkRequest || workRequests[0];
  }, [workRequests, selectedTaskId, activeWorkRequest]);

  // Generate lifecycle metrics report for selected task
  const report: TaskLifecyclePerformanceReport = useMemo(() => {
    if (!currentWr) {
      return generateTaskLifecycleMetrics('wr-1', 'Build OAuth2 Authentication Layer', 'VALIDATE');
    }
    return generateTaskLifecycleMetrics(currentWr.id, currentWr.intent, currentWr.status);
  }, [currentWr]);

  const toggleSeries = (key: string) => {
    setActiveSeries(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const formatMs = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatNumber = (n: number) => new Intl.NumberFormat().format(n);

  // Custom Tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const stageData: TaskLifecycleStageMetric = payload[0]?.payload;
    if (!stageData) return null;

    return (
      <div className="bg-gray-900/95 border border-gray-700/90 rounded-lg p-3 shadow-xl backdrop-blur-md text-xs text-gray-200 min-w-[240px] z-50">
        <div className="flex items-center justify-between border-b border-gray-800 pb-2 mb-2">
          <div>
            <div className="font-bold text-gray-100 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              {stageData.stage}
            </div>
            <div className="text-[10px] text-gray-400 font-mono">
              Phase: {stageData.phaseKey.toUpperCase()} • Agent: {stageData.agentName} ({stageData.agentRole})
            </div>
          </div>
          <span className={cn(
            "text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase",
            stageData.status === 'completed' ? "bg-emerald-950 text-emerald-300 border border-emerald-800" :
            stageData.status === 'in_progress' ? "bg-blue-950 text-blue-300 border border-blue-800 animate-pulse" :
            "bg-gray-800 text-gray-400"
          )}>
            {stageData.status}
          </span>
        </div>

        <div className="space-y-1.5 font-mono text-[11px]">
          <div className="flex justify-between">
            <span className="text-gray-400">Stage Duration:</span>
            <span className="font-bold text-blue-300">{formatMs(stageData.durationMs)} (SLA: {formatMs(stageData.slaTargetMs)})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Cumulative Time:</span>
            <span className="text-gray-300">{formatMs(stageData.cumulativeDurationMs)}</span>
          </div>
          <div className="flex justify-between border-t border-gray-800/80 pt-1">
            <span className="text-gray-400">Stage Tokens:</span>
            <span className="font-bold text-amber-300">{formatNumber(stageData.totalTokens)} tok</span>
          </div>
          <div className="flex justify-between text-[10px] text-gray-400">
            <span>Prompt: {formatNumber(stageData.promptTokens)}</span>
            <span>Gen: {formatNumber(stageData.completionTokens)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Throughput:</span>
            <span className="text-purple-300">{stageData.tokensPerSec} tok/s</span>
          </div>
          <div className="flex justify-between border-t border-gray-800/80 pt-1">
            <span className="text-gray-400">Alignment / Risk:</span>
            <span className="text-emerald-300">{stageData.alignmentScore}% align / <span className="text-rose-300">{stageData.riskScore}% risk</span></span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={cn("flex flex-col bg-gray-950 text-gray-100 rounded-xl border border-gray-800 overflow-hidden shadow-lg", className)}>
      {/* Header & Controls Toolbar */}
      <div className="p-3 bg-gray-900/90 border-b border-gray-800 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-blue-950/80 border border-blue-800/60 text-blue-400">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-gray-100 tracking-wide">
                Agent Performance Lifecycle Trends
              </h3>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                RECHARTS v2.15
              </span>
            </div>
            <p className="text-[11px] text-gray-400 truncate max-w-sm sm:max-w-md">
              Task [{report.taskId}]: {report.taskIntent}
            </p>
          </div>
        </div>

        {/* Task Selector & View Mode Switcher */}
        <div className="flex items-center space-x-2">
          {/* Work Request Selector */}
          <div className="relative">
            <select
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              className="bg-gray-950 border border-gray-700 text-gray-200 text-xs rounded-lg px-2.5 py-1.5 outline-none focus:border-blue-500 font-mono"
            >
              {workRequests.map((wr: WorkRequest) => (
                <option key={wr.id} value={wr.id}>
                  {wr.id}: {wr.intent.slice(0, 30)}...
                </option>
              ))}
            </select>
          </div>

          {/* Mode Selector Tabs */}
          <div className="flex items-center bg-gray-950 p-0.5 rounded-lg border border-gray-800">
            <button
              onClick={() => setViewMode('trajectory')}
              className={cn(
                "px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1",
                viewMode === 'trajectory' 
                  ? "bg-blue-600 text-white shadow-xs" 
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-850"
              )}
              title="Trajectory: Cumulative Tokens & Duration Trajectory"
            >
              <Zap className="w-3 h-3" />
              <span className="hidden md:inline">Trajectory</span>
            </button>

            <button
              onClick={() => setViewMode('latency_sla')}
              className={cn(
                "px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1",
                viewMode === 'latency_sla' 
                  ? "bg-blue-600 text-white shadow-xs" 
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-850"
              )}
              title="Stage Latency vs SLA Benchmark"
            >
              <Clock className="w-3 h-3" />
              <span className="hidden md:inline">Latency / SLA</span>
            </button>

            <button
              onClick={() => setViewMode('throughput')}
              className={cn(
                "px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1",
                viewMode === 'throughput' 
                  ? "bg-blue-600 text-white shadow-xs" 
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-850"
              )}
              title="Agent Velocity & Tokens/Sec"
            >
              <Activity className="w-3 h-3" />
              <span className="hidden md:inline">Throughput</span>
            </button>

            <button
              onClick={() => setViewMode('quality')}
              className={cn(
                "px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1",
                viewMode === 'quality' 
                  ? "bg-blue-600 text-white shadow-xs" 
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-850"
              )}
              title="Quality & Risk Trajectory"
            >
              <Target className="w-3 h-3" />
              <span className="hidden md:inline">Quality</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-gray-900/50 border-b border-gray-800/80 text-xs">
        <div className="p-2 rounded-lg bg-gray-950/70 border border-gray-800">
          <div className="text-[10px] text-gray-400 font-medium">Total Lifecycle Duration</div>
          <div className="text-base font-bold font-mono text-blue-300 mt-0.5">
            {formatMs(report.totalDurationMs)}
          </div>
          <div className="text-[9px] text-gray-500 font-mono">{report.stages.length} lifecycle phases</div>
        </div>

        <div className="p-2 rounded-lg bg-gray-950/70 border border-gray-800">
          <div className="text-[10px] text-gray-400 font-medium">Total Token Footprint</div>
          <div className="text-base font-bold font-mono text-amber-300 mt-0.5">
            {formatNumber(report.totalTokens)}
          </div>
          <div className="text-[9px] text-gray-500 font-mono">
            {Math.round((report.totalPromptTokens / report.totalTokens) * 100)}% in / {Math.round((report.totalCompletionTokens / report.totalTokens) * 100)}% out
          </div>
        </div>

        <div className="p-2 rounded-lg bg-gray-950/70 border border-gray-800">
          <div className="text-[10px] text-gray-400 font-medium">Throughput Velocity</div>
          <div className="text-base font-bold font-mono text-purple-300 mt-0.5">
            {report.overallEfficiencyTokPerSec} tok/s
          </div>
          <div className="text-[9px] text-gray-500 font-mono">peak: 160 tok/s</div>
        </div>

        <div className="p-2 rounded-lg bg-gray-950/70 border border-gray-800">
          <div className="text-[10px] text-gray-400 font-medium">Pipeline Status</div>
          <div className="text-base font-bold font-mono text-emerald-300 mt-0.5 uppercase">
            {report.status}
          </div>
          <div className="text-[9px] text-gray-500 font-mono">100% verified steps</div>
        </div>
      </div>

      {/* Series Toggle Filters Bar */}
      <div className="px-3 py-1.5 bg-gray-950/90 border-b border-gray-800/80 flex items-center justify-between text-[11px] overflow-x-auto">
        <div className="flex items-center space-x-2">
          <span className="text-gray-500 font-mono text-[10px] uppercase">Toggle Metrics:</span>
          {viewMode === 'trajectory' && (
            <>
              <button
                onClick={() => toggleSeries('promptTokens')}
                className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-mono border transition-all",
                  activeSeries.promptTokens 
                    ? "bg-indigo-950 text-indigo-300 border-indigo-700" 
                    : "bg-gray-900 text-gray-500 border-gray-800 line-through"
                )}
              >
                Prompt Tokens
              </button>
              <button
                onClick={() => toggleSeries('completionTokens')}
                className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-mono border transition-all",
                  activeSeries.completionTokens 
                    ? "bg-purple-950 text-purple-300 border-purple-700" 
                    : "bg-gray-900 text-gray-500 border-gray-800 line-through"
                )}
              >
                Completion Tokens
              </button>
              <button
                onClick={() => toggleSeries('cumulativeDurationMs')}
                className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-mono border transition-all",
                  activeSeries.cumulativeDurationMs 
                    ? "bg-blue-950 text-blue-300 border-blue-700" 
                    : "bg-gray-900 text-gray-500 border-gray-800 line-through"
                )}
              >
                Cumulative Latency
              </button>
            </>
          )}

          {viewMode === 'latency_sla' && (
            <>
              <button
                onClick={() => toggleSeries('durationMs')}
                className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-mono border transition-all",
                  activeSeries.durationMs 
                    ? "bg-blue-950 text-blue-300 border-blue-700" 
                    : "bg-gray-900 text-gray-500 border-gray-800 line-through"
                )}
              >
                Stage Duration (Actual)
              </button>
              <button
                onClick={() => toggleSeries('slaTargetMs')}
                className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-mono border transition-all",
                  activeSeries.slaTargetMs 
                    ? "bg-rose-950 text-rose-300 border-rose-700" 
                    : "bg-gray-900 text-gray-500 border-gray-800 line-through"
                )}
              >
                SLA Budget
              </button>
            </>
          )}

          {viewMode === 'throughput' && (
            <>
              <button
                onClick={() => toggleSeries('tokensPerSec')}
                className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-mono border transition-all",
                  activeSeries.tokensPerSec 
                    ? "bg-amber-950 text-amber-300 border-amber-700" 
                    : "bg-gray-900 text-gray-500 border-gray-800 line-through"
                )}
              >
                Tokens / Sec
              </button>
            </>
          )}

          {viewMode === 'quality' && (
            <>
              <button
                onClick={() => toggleSeries('alignmentScore')}
                className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-mono border transition-all",
                  activeSeries.alignmentScore 
                    ? "bg-emerald-950 text-emerald-300 border-emerald-700" 
                    : "bg-gray-900 text-gray-500 border-gray-800 line-through"
                )}
              >
                Intent Alignment %
              </button>
              <button
                onClick={() => toggleSeries('confidenceScore')}
                className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-mono border transition-all",
                  activeSeries.confidenceScore 
                    ? "bg-blue-950 text-blue-300 border-blue-700" 
                    : "bg-gray-900 text-gray-500 border-gray-800 line-through"
                )}
              >
                Agent Confidence %
              </button>
              <button
                onClick={() => toggleSeries('riskScore')}
                className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-mono border transition-all",
                  activeSeries.riskScore 
                    ? "bg-rose-950 text-rose-300 border-rose-700" 
                    : "bg-gray-900 text-gray-500 border-gray-800 line-through"
                )}
              >
                Risk Score %
              </button>
            </>
          )}
        </div>

        <div className="text-[10px] text-gray-500 font-mono hidden sm:block">
          Hover points for granular agent payload telemetry
        </div>
      </div>

      {/* Main Chart Canvas Area */}
      <div className="p-3 sm:p-4 h-72 sm:h-80 w-full relative bg-gray-950">
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === 'trajectory' ? (
            <ComposedChart
              data={report.stages}
              margin={{ top: 15, right: 30, left: 10, bottom: 20 }}
            >
              <defs>
                <linearGradient id="promptGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="compGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#A855F7" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#A855F7" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
              
              <XAxis 
                dataKey="stageShort" 
                stroke="#6B7280" 
                tick={{ fill: '#9CA3AF', fontSize: 11, fontFamily: 'monospace' }}
                dy={8}
              />
              
              <YAxis 
                yAxisId="tokens"
                stroke="#6B7280" 
                tick={{ fill: '#9CA3AF', fontSize: 11, fontFamily: 'monospace' }}
                tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                domain={[0, 'auto']}
              />

              <YAxis 
                yAxisId="latency"
                orientation="right"
                stroke="#3B82F6" 
                tick={{ fill: '#60A5FA', fontSize: 11, fontFamily: 'monospace' }}
                tickFormatter={(val) => `${(val / 1000).toFixed(1)}s`}
                domain={[0, 'auto']}
              />

              <Tooltip content={<CustomTooltip />} />

              {activeSeries.promptTokens && (
                <Area 
                  yAxisId="tokens"
                  type="monotone" 
                  dataKey="promptTokens" 
                  name="Prompt Tokens" 
                  stroke="#6366F1" 
                  fill="url(#promptGrad)" 
                  strokeWidth={2}
                />
              )}

              {activeSeries.completionTokens && (
                <Area 
                  yAxisId="tokens"
                  type="monotone" 
                  dataKey="completionTokens" 
                  name="Completion Tokens" 
                  stroke="#A855F7" 
                  fill="url(#compGrad)" 
                  strokeWidth={2}
                />
              )}

              {activeSeries.cumulativeDurationMs && (
                <Line 
                  yAxisId="latency"
                  type="monotone" 
                  dataKey="cumulativeDurationMs" 
                  name="Cumulative Duration" 
                  stroke="#38BDF8" 
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#0284C7', stroke: '#38BDF8', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#38BDF8' }}
                />
              )}
            </ComposedChart>
          ) : viewMode === 'latency_sla' ? (
            <BarChart
              data={report.stages}
              margin={{ top: 15, right: 30, left: 10, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
              
              <XAxis 
                dataKey="stageShort" 
                stroke="#6B7280" 
                tick={{ fill: '#9CA3AF', fontSize: 11, fontFamily: 'monospace' }}
                dy={8}
              />
              
              <YAxis 
                stroke="#6B7280" 
                tick={{ fill: '#9CA3AF', fontSize: 11, fontFamily: 'monospace' }}
                tickFormatter={(val) => `${val}ms`}
              />

              <Tooltip content={<CustomTooltip />} />

              {activeSeries.durationMs && (
                <Bar dataKey="durationMs" name="Actual Duration" fill="#3B82F6" radius={[4, 4, 0, 0]}>
                  {report.stages.map((entry, index) => {
                    const isExceeding = entry.durationMs > entry.slaTargetMs;
                    return (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={isExceeding ? '#F43F5E' : '#3B82F6'} 
                      />
                    );
                  })}
                </Bar>
              )}

              {activeSeries.slaTargetMs && (
                <Bar dataKey="slaTargetMs" name="SLA Target" fill="#374151" radius={[4, 4, 0, 0]} opacity={0.6} />
              )}
            </BarChart>
          ) : viewMode === 'throughput' ? (
            <LineChart
              data={report.stages}
              margin={{ top: 15, right: 30, left: 10, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
              
              <XAxis 
                dataKey="stageShort" 
                stroke="#6B7280" 
                tick={{ fill: '#9CA3AF', fontSize: 11, fontFamily: 'monospace' }}
                dy={8}
              />
              
              <YAxis 
                stroke="#6B7280" 
                tick={{ fill: '#9CA3AF', fontSize: 11, fontFamily: 'monospace' }}
                domain={[0, 200]}
                tickFormatter={(val) => `${val} t/s`}
              />

              <ReferenceLine y={120} stroke="#10B981" strokeDasharray="3 3" label={{ value: 'Target Baseline (120 t/s)', fill: '#10B981', fontSize: 10 }} />

              <Tooltip content={<CustomTooltip />} />

              {activeSeries.tokensPerSec && (
                <Line 
                  type="monotone" 
                  dataKey="tokensPerSec" 
                  name="Tokens / Sec" 
                  stroke="#F59E0B" 
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#D97706', stroke: '#FDE68A', strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: '#F59E0B' }}
                />
              )}
            </LineChart>
          ) : (
            <LineChart
              data={report.stages}
              margin={{ top: 15, right: 30, left: 10, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
              
              <XAxis 
                dataKey="stageShort" 
                stroke="#6B7280" 
                tick={{ fill: '#9CA3AF', fontSize: 11, fontFamily: 'monospace' }}
                dy={8}
              />
              
              <YAxis 
                stroke="#6B7280" 
                tick={{ fill: '#9CA3AF', fontSize: 11, fontFamily: 'monospace' }}
                domain={[0, 100]}
                tickFormatter={(val) => `${val}%`}
              />

              <Tooltip content={<CustomTooltip />} />

              {activeSeries.alignmentScore && (
                <Line 
                  type="monotone" 
                  dataKey="alignmentScore" 
                  name="Intent Alignment" 
                  stroke="#10B981" 
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#059669' }}
                />
              )}

              {activeSeries.confidenceScore && (
                <Line 
                  type="monotone" 
                  dataKey="confidenceScore" 
                  name="Agent Confidence" 
                  stroke="#60A5FA" 
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#2563EB' }}
                />
              )}

              {activeSeries.riskScore && (
                <Line 
                  type="monotone" 
                  dataKey="riskScore" 
                  name="Critic Risk" 
                  stroke="#F43F5E" 
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 4, fill: '#E11D48' }}
                />
              )}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Stage Progression Footnote & Agent Milestones */}
      <div className="p-3 bg-gray-900/90 border-t border-gray-800">
        <div className="text-[10px] font-mono uppercase text-gray-400 mb-2 flex items-center justify-between">
          <span>Lifecycle Stage Milestones & Agent Attribution</span>
          <span className="text-gray-500">Click any stage to filter agent telemetry</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {report.stages.map((stage) => {
            const isHovered = hoveredStage?.phaseKey === stage.phaseKey;
            return (
              <div
                key={stage.phaseKey}
                onMouseEnter={() => setHoveredStage(stage)}
                onMouseLeave={() => setHoveredStage(null)}
                onClick={() => {
                  if (onOpenAgentLogs) {
                    onOpenAgentLogs(stage.agentId);
                  } else {
                    selectAgentForLogs(stage.agentId);
                  }
                }}
                className={cn(
                  "p-2 rounded-lg border transition-all cursor-pointer select-none group flex flex-col justify-between",
                  isHovered 
                    ? "bg-gray-800 border-blue-500/80 shadow-md scale-[1.02]" 
                    : "bg-gray-950/80 border-gray-800 hover:border-gray-700"
                )}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono text-gray-500">{stage.timestamp}</span>
                    <span className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      stage.status === 'completed' ? "bg-emerald-400" :
                      stage.status === 'in_progress' ? "bg-blue-400 animate-pulse" : "bg-gray-600"
                    )} />
                  </div>
                  <div className="font-semibold text-xs text-gray-200 group-hover:text-blue-300 truncate">
                    {stage.stageShort}
                  </div>
                  <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                    {stage.agentName}
                  </div>
                </div>

                <div className="mt-2 pt-1.5 border-t border-gray-800/80 flex items-center justify-between text-[10px] font-mono">
                  <span className="text-blue-300 font-medium">{formatMs(stage.durationMs)}</span>
                  <span className="text-amber-400 font-medium">{(stage.totalTokens / 1000).toFixed(1)}k</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
