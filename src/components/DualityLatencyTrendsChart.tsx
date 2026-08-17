import React, { useState, useMemo } from 'react';
import { useSimulation } from '../hooks/useSimulation';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ReferenceArea
} from 'recharts';
import {
  Clock,
  Zap,
  TrendingUp,
  TrendingDown,
  Activity,
  Cpu,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  ShieldCheck,
  Download,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  Sparkles,
  BarChart2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { DualityPerformanceMetrics, DualityTurnMetric } from '../types';

export type DualityChartMode = 'latency_trend' | 'delta_spread' | 'sla_compliance' | 'speed_throughput';
export type DualityLineStyle = 'monotone' | 'linear' | 'step';

export interface DualityLatencyTrendsChartProps {
  className?: string;
  defaultChartMode?: DualityChartMode;
  compact?: boolean;
  onBenchmarkTrigger?: () => void;
}

export function DualityLatencyTrendsChart({
  className,
  defaultChartMode = 'latency_trend',
  compact = false,
  onBenchmarkTrigger
}: DualityLatencyTrendsChartProps) {
  const { dualityState, runDualityBenchmark, resetDualityMetrics, BackendService } = useSimulation();

  const [chartMode, setChartMode] = useState<DualityChartMode>(defaultChartMode);
  const [lineStyle, setLineStyle] = useState<DualityLineStyle>('monotone');
  const [turnsRange, setTurnsRange] = useState<'all' | '10' | '5'>('all');
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Series visibility toggles
  const [showPrimary, setShowPrimary] = useState(true);
  const [showSecondary, setShowSecondary] = useState(true);
  const [showSlaLines, setShowSlaLines] = useState(true);
  const [showAvgLines, setShowAvgLines] = useState(true);
  const [showDeltaArea, setShowDeltaArea] = useState(true);
  const [showTokensCurve, setShowTokensCurve] = useState(false);

  const perf: DualityPerformanceMetrics = dualityState.performanceMetrics || {
    primary: {
      agentId: dualityState.primaryAgentId || 'a5',
      role: dualityState.primaryRole || 'System Architect',
      agentName: 'Architect',
      model: dualityState.primaryModel || 'claude-3-7-sonnet',
      turnsCount: 2,
      lastLatencyMs: 1280,
      avgLatencyMs: 1240,
      minLatencyMs: 980,
      maxLatencyMs: 1450,
      totalTokensUsed: 3200,
      promptTokens: 2100,
      completionTokens: 1100,
      tokensPerSec: 42,
      cacheHitPct: 78,
      estimatedCostUsd: 0.022,
      slaTargetMs: 1400,
      status: 'idle',
      latencyHistory: [1150, 1320, 1280, 1210],
      tokensHistory: [2900, 3100, 3200, 3050]
    },
    secondary: {
      agentId: dualityState.secondaryAgentId || 'a3',
      role: dualityState.secondaryRole || 'Builder',
      agentName: 'Coder',
      model: dualityState.secondaryModel || 'qwen2.5-coder:latest',
      turnsCount: 2,
      lastLatencyMs: 780,
      avgLatencyMs: 760,
      minLatencyMs: 620,
      maxLatencyMs: 890,
      totalTokensUsed: 4100,
      promptTokens: 1500,
      completionTokens: 2600,
      tokensPerSec: 68,
      cacheHitPct: 64,
      estimatedCostUsd: 0.003,
      slaTargetMs: 900,
      status: 'idle',
      latencyHistory: [820, 740, 780, 700],
      tokensHistory: [3800, 4200, 4100, 3950]
    },
    totalSessionTokens: 7300,
    totalSessionCostUsd: 0.025,
    totalTurns: 4,
    lastUpdated: new Date().toISOString(),
    recentTurns: [],
    benchmarkRunning: false
  };

  const primary = perf.primary;
  const secondary = perf.secondary;
  const isBenchmarkRunning = perf.benchmarkRunning;

  // Synthesize rich chronological turn series for both agents
  const chartData = useMemo(() => {
    const primaryHistory = primary.latencyHistory && primary.latencyHistory.length > 0
      ? primary.latencyHistory
      : [1100, 1250, 1180, 1240];
    const secondaryHistory = secondary.latencyHistory && secondary.latencyHistory.length > 0
      ? secondary.latencyHistory
      : [720, 780, 690, 760];

    const primaryTokensHist = primary.tokensHistory && primary.tokensHistory.length > 0
      ? primary.tokensHistory
      : [2400, 3100, 2900, 3200];
    const secondaryTokensHist = secondary.tokensHistory && secondary.tokensHistory.length > 0
      ? secondary.tokensHistory
      : [3200, 4100, 3800, 4100];

    // Determine total length (take maximum of histories or recentTurns pairs)
    const length = Math.max(primaryHistory.length, secondaryHistory.length, 4);

    const points = [];
    const baseTime = Date.now() - length * 45000;

    let primCumSum = 0;
    let secCumSum = 0;

    for (let i = 0; i < length; i++) {
      const primVal = primaryHistory[i] ?? primary.avgLatencyMs;
      const secVal = secondaryHistory[i] ?? secondary.avgLatencyMs;
      const primTokens = primaryTokensHist[i] ?? Math.round(primary.totalTokensUsed / Math.max(length, 1));
      const secTokens = secondaryTokensHist[i] ?? Math.round(secondary.totalTokensUsed / Math.max(length, 1));

      primCumSum += primVal;
      secCumSum += secVal;

      const primRollingAvg = Math.round(primCumSum / (i + 1));
      const secRollingAvg = Math.round(secCumSum / (i + 1));

      const turnTime = new Date(baseTime + i * 45000);
      const timeLabel = turnTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      // Action labels
      const primAction = i === 0 ? 'INGEST_SPEC' : i === 1 ? 'REASON_BLUEPRINT' : i === 2 ? 'EVAL_TRADE_OFFS' : 'VERIFY_CONTRACT';
      const secAction = i === 0 ? 'PARSE_AST' : i === 1 ? 'SYNTHESIZE_CODE' : i === 2 ? 'LINT_TYPECHECK' : 'COMPILE_UNIT';

      // Estimated t/s for that turn
      const primTps = Math.round((primTokens * 0.45) / (primVal / 1000 || 1));
      const secTps = Math.round((secTokens * 0.70) / (secVal / 1000 || 1));

      const delta = primVal - secVal;
      const fasterAgent = delta > 0 ? secondary.role : primary.role;
      const deltaPct = Math.round((Math.abs(delta) / Math.max(primVal, secVal)) * 100);

      points.push({
        turnIndex: i + 1,
        turnLabel: `T${i + 1}`,
        fullLabel: `Turn ${i + 1}`,
        time: timeLabel,
        rawTimestamp: turnTime,
        primaryLatency: primVal,
        secondaryLatency: secVal,
        primaryRollingAvg: primRollingAvg,
        secondaryRollingAvg: secRollingAvg,
        primarySla: primary.slaTargetMs,
        secondarySla: secondary.slaTargetMs,
        deltaLatency: Math.abs(delta),
        signedDelta: delta,
        fasterAgent,
        deltaPct,
        primaryTokens: primTokens,
        secondaryTokens: secTokens,
        totalTurnTokens: primTokens + secTokens,
        primaryTps: primTps,
        secondaryTps: secTps,
        primaryAction: primAction,
        secondaryAction: secAction,
        // SLA breach flags
        primarySlaBreached: primVal > primary.slaTargetMs,
        secondarySlaBreached: secVal > secondary.slaTargetMs
      });
    }

    // Filter by turnsRange
    if (turnsRange === '5') {
      return points.slice(-5);
    } else if (turnsRange === '10') {
      return points.slice(-10);
    }
    return points;
  }, [primary, secondary, turnsRange]);

  // Statistical calculations
  const stats = useMemo(() => {
    if (!chartData.length) return null;

    const primLatencies = chartData.map(d => d.primaryLatency);
    const secLatencies = chartData.map(d => d.secondaryLatency);

    const primAvg = Math.round(primLatencies.reduce((a, b) => a + b, 0) / primLatencies.length);
    const secAvg = Math.round(secLatencies.reduce((a, b) => a + b, 0) / secLatencies.length);

    const primMin = Math.min(...primLatencies);
    const secMin = Math.min(...secLatencies);

    const primMax = Math.max(...primLatencies);
    const secMax = Math.max(...secLatencies);

    // Standard deviation (jitter)
    const primVar = primLatencies.reduce((acc, val) => acc + Math.pow(val - primAvg, 2), 0) / primLatencies.length;
    const secVar = secLatencies.reduce((acc, val) => acc + Math.pow(val - secAvg, 2), 0) / secLatencies.length;
    const primStdDev = Math.round(Math.sqrt(primVar));
    const secStdDev = Math.round(Math.sqrt(secVar));

    // SLA Adherence %
    const primUnderSla = chartData.filter(d => d.primaryLatency <= primary.slaTargetMs).length;
    const secUnderSla = chartData.filter(d => d.secondaryLatency <= secondary.slaTargetMs).length;
    const primSlaPct = Math.round((primUnderSla / chartData.length) * 100);
    const secSlaPct = Math.round((secUnderSla / chartData.length) * 100);

    return {
      primAvg,
      secAvg,
      primMin,
      secMin,
      primMax,
      secMax,
      primStdDev,
      secStdDev,
      primSlaPct,
      secSlaPct,
      turnsCount: chartData.length
    };
  }, [chartData, primary.slaTargetMs, secondary.slaTargetMs]);

  // Custom Rich Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0]?.payload;
    if (!data) return null;

    return (
      <div className="bg-gray-900/95 border border-gray-700/90 rounded-lg p-3.5 shadow-2xl backdrop-blur-md text-xs text-gray-100 min-w-[280px] z-50 space-y-2.5 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-2">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-bold text-gray-100">{data.fullLabel}</span>
            <span className="text-[10px] font-mono text-gray-400">({data.time})</span>
          </div>
          <span className="text-[10px] font-mono bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded border border-gray-700">
            Δ {data.deltaLatency}ms ({data.deltaPct}%)
          </span>
        </div>

        {/* Primary Agent Metric Row */}
        <div className="p-2 rounded bg-indigo-950/40 border border-indigo-900/60 space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-indigo-300 flex items-center space-x-1.5">
              <span className="w-3.5 h-3.5 rounded bg-indigo-600 text-white flex items-center justify-center text-[9px] font-bold">A</span>
              <span>{primary.role}</span>
            </span>
            <span className="font-mono font-bold text-indigo-200">{data.primaryLatency} ms</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono">
            <span>Model: {primary.model}</span>
            <span className={cn(
              data.primaryLatency <= primary.slaTargetMs ? "text-emerald-400" : "text-amber-400 font-bold"
            )}>
              {data.primaryLatency <= primary.slaTargetMs ? '✓ Under SLA' : `+${data.primaryLatency - primary.slaTargetMs}ms SLA Breach`}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono">
            <span>Tokens: {data.primaryTokens}t</span>
            <span>Speed: {data.primaryTps} t/s</span>
          </div>
        </div>

        {/* Secondary Agent Metric Row */}
        <div className="p-2 rounded bg-emerald-950/40 border border-emerald-900/60 space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-emerald-300 flex items-center space-x-1.5">
              <span className="w-3.5 h-3.5 rounded bg-emerald-600 text-white flex items-center justify-center text-[9px] font-bold">B</span>
              <span>{secondary.role}</span>
            </span>
            <span className="font-mono font-bold text-emerald-200">{data.secondaryLatency} ms</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono">
            <span>Model: {secondary.model}</span>
            <span className={cn(
              data.secondaryLatency <= secondary.slaTargetMs ? "text-emerald-400" : "text-amber-400 font-bold"
            )}>
              {data.secondaryLatency <= secondary.slaTargetMs ? '✓ Under SLA' : `+${data.secondaryLatency - secondary.slaTargetMs}ms SLA Breach`}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono">
            <span>Tokens: {data.secondaryTokens}t</span>
            <span>Speed: {data.secondaryTps} t/s</span>
          </div>
        </div>

        {/* Delta Verdict */}
        <div className="text-[11px] pt-1 border-t border-gray-800 flex items-center justify-between text-gray-300">
          <span>Faster Response:</span>
          <strong className="text-cyan-300 font-mono">
            {data.fasterAgent} (+{data.deltaPct}%)
          </strong>
        </div>
      </div>
    );
  };

  const handleCopyTelemetry = () => {
    const summary = {
      timestamp: new Date().toISOString(),
      primary: {
        role: primary.role,
        model: primary.model,
        avgLatencyMs: stats?.primAvg,
        minLatencyMs: stats?.primMin,
        maxLatencyMs: stats?.primMax,
        jitterMs: stats?.primStdDev,
        slaAdherencePct: stats?.primSlaPct
      },
      secondary: {
        role: secondary.role,
        model: secondary.model,
        avgLatencyMs: stats?.secAvg,
        minLatencyMs: stats?.secMin,
        maxLatencyMs: stats?.secMax,
        jitterMs: stats?.secStdDev,
        slaAdherencePct: stats?.secSlaPct
      },
      turnHistory: chartData
    };
    navigator.clipboard.writeText(JSON.stringify(summary, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCsv = () => {
    const headers = ['Turn,Time,PrimaryRole,PrimaryModel,PrimaryLatencyMs,PrimaryTokens,PrimaryTps,SecondaryRole,SecondaryModel,SecondaryLatencyMs,SecondaryTokens,SecondaryTps,DeltaMs,FasterAgent\n'];
    const rows = chartData.map(d => 
      `${d.turnIndex},"${d.time}","${primary.role}","${primary.model}",${d.primaryLatency},${d.primaryTokens},${d.primaryTps},"${secondary.role}","${secondary.model}",${d.secondaryLatency},${d.secondaryTokens},${d.secondaryTps},${d.deltaLatency},"${d.fasterAgent}"`
    );
    const blob = new Blob([headers.concat(rows.join('\n')).join('')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `duality-latency-telemetry-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      id="duality-latency-trends-chart-container"
      className={cn(
        "flex flex-col bg-gray-950 border border-gray-800 rounded-lg overflow-hidden text-gray-200 transition-all",
        isExpanded ? "fixed inset-4 z-50 shadow-2xl bg-gray-950 border-cyan-800/80" : "w-full",
        className
      )}
    >
      {/* Visualizer Top Control Bar */}
      <div className="p-3 bg-gray-900/90 border-b border-gray-800 flex flex-wrap items-center justify-between gap-2.5">
        {/* Title and Telemetry Badges */}
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-md bg-gradient-to-br from-indigo-950 to-emerald-950 border border-indigo-700/60 text-cyan-300 shadow-sm">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xs font-bold text-gray-100 uppercase tracking-wider">
                Session Latency Trend Visualizer
              </h3>
              <span className="text-[10px] font-mono bg-cyan-950/70 text-cyan-300 border border-cyan-800/70 px-1.5 py-0.2 rounded font-semibold">
                Live Dual-Axis
              </span>
            </div>
            <p className="text-[11px] text-gray-400">
              Comparative response latency trajectory and SLA boundary tracking
            </p>
          </div>
        </div>

        {/* Top Right Action & Benchmark Buttons */}
        <div className="flex items-center space-x-2">
          <button
            id="btn-duality-chart-benchmark"
            onClick={onBenchmarkTrigger || runDualityBenchmark}
            disabled={isBenchmarkRunning}
            className={cn(
              "text-xs px-2.5 py-1.5 rounded font-semibold flex items-center space-x-1.5 transition-all shadow-sm",
              isBenchmarkRunning
                ? "bg-amber-950/80 text-amber-300 border border-amber-800 cursor-wait"
                : "bg-cyan-600 hover:bg-cyan-500 text-white border border-cyan-500 hover:shadow-cyan-500/20"
            )}
            title="Execute synchronous latency benchmarking turn"
          >
            <RefreshCw className={cn("w-3 h-3", isBenchmarkRunning && "animate-spin text-amber-300")} />
            <span>{isBenchmarkRunning ? 'Benchmarking...' : '⚡ Record Turn'}</span>
          </button>

          <button
            id="btn-duality-chart-copy"
            onClick={handleCopyTelemetry}
            className="text-[11px] text-gray-400 hover:text-gray-200 hover:bg-gray-800 border border-gray-800 px-2 py-1.5 rounded transition-colors flex items-center space-x-1"
            title="Copy telemetry JSON to clipboard"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'JSON'}</span>
          </button>

          <button
            id="btn-duality-chart-csv"
            onClick={handleDownloadCsv}
            className="text-[11px] text-gray-400 hover:text-gray-200 hover:bg-gray-800 border border-gray-800 px-2 py-1.5 rounded transition-colors flex items-center space-x-1"
            title="Export CSV data"
          >
            <Download className="w-3 h-3" />
            <span>CSV</span>
          </button>

          <button
            id="btn-duality-chart-expand"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[11px] text-gray-400 hover:text-gray-200 hover:bg-gray-800 border border-gray-800 p-1.5 rounded transition-colors"
            title={isExpanded ? 'Collapse view' : 'Expand full-screen'}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5 text-cyan-400" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Mode Selectors & Series Filter Controls */}
      <div className="px-3 py-2 bg-gray-900/60 border-b border-gray-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Chart Visual Mode Tabs */}
        <div className="flex items-center space-x-1 bg-gray-950 p-0.5 rounded-lg border border-gray-800">
          <button
            id="btn-chart-mode-latency"
            onClick={() => setChartMode('latency_trend')}
            className={cn(
              "px-2.5 py-1 rounded-md transition-all font-medium flex items-center space-x-1",
              chartMode === 'latency_trend'
                ? "bg-indigo-950/90 text-indigo-200 border border-indigo-800/80 font-bold shadow-sm"
                : "text-gray-400 hover:text-gray-200"
            )}
          >
            <Clock className="w-3 h-3 text-indigo-400" />
            <span>Response Latency</span>
          </button>

          <button
            id="btn-chart-mode-delta"
            onClick={() => setChartMode('delta_spread')}
            className={cn(
              "px-2.5 py-1 rounded-md transition-all font-medium flex items-center space-x-1",
              chartMode === 'delta_spread'
                ? "bg-purple-950/90 text-purple-200 border border-purple-800/80 font-bold shadow-sm"
                : "text-gray-400 hover:text-purple-300"
            )}
          >
            <TrendingUp className="w-3 h-3 text-purple-400" />
            <span>Delta Spread</span>
          </button>

          <button
            id="btn-chart-mode-sla"
            onClick={() => setChartMode('sla_compliance')}
            className={cn(
              "px-2.5 py-1 rounded-md transition-all font-medium flex items-center space-x-1",
              chartMode === 'sla_compliance'
                ? "bg-emerald-950/90 text-emerald-200 border border-emerald-800/80 font-bold shadow-sm"
                : "text-gray-400 hover:text-emerald-300"
            )}
          >
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>SLA Compliance</span>
          </button>

          <button
            id="btn-chart-mode-speed"
            onClick={() => setChartMode('speed_throughput')}
            className={cn(
              "px-2.5 py-1 rounded-md transition-all font-medium flex items-center space-x-1",
              chartMode === 'speed_throughput'
                ? "bg-cyan-950/90 text-cyan-200 border border-cyan-800/80 font-bold shadow-sm"
                : "text-gray-400 hover:text-cyan-300"
            )}
          >
            <Zap className="w-3 h-3 text-cyan-400" />
            <span>Tokens / Sec</span>
          </button>
        </div>

        {/* Filters & Options: Series Checkboxes and Range Switcher */}
        <div className="flex flex-wrap items-center space-x-2 text-[11px]">
          {/* Series toggles */}
          <label className="flex items-center space-x-1 text-indigo-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showPrimary}
              onChange={(e) => setShowPrimary(e.target.checked)}
              className="rounded bg-gray-900 border-gray-700 text-indigo-600 focus:ring-0 focus:ring-offset-0 w-3 h-3"
            />
            <span className="font-semibold">{primary.role}</span>
          </label>

          <label className="flex items-center space-x-1 text-emerald-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showSecondary}
              onChange={(e) => setShowSecondary(e.target.checked)}
              className="rounded bg-gray-900 border-gray-700 text-emerald-600 focus:ring-0 focus:ring-offset-0 w-3 h-3"
            />
            <span className="font-semibold">{secondary.role}</span>
          </label>

          <label className="flex items-center space-x-1 text-gray-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showSlaLines}
              onChange={(e) => setShowSlaLines(e.target.checked)}
              className="rounded bg-gray-900 border-gray-700 text-amber-500 focus:ring-0 focus:ring-offset-0 w-3 h-3"
            />
            <span>SLA Lines</span>
          </label>

          <label className="flex items-center space-x-1 text-gray-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showAvgLines}
              onChange={(e) => setShowAvgLines(e.target.checked)}
              className="rounded bg-gray-900 border-gray-700 text-cyan-500 focus:ring-0 focus:ring-offset-0 w-3 h-3"
            />
            <span>Averages</span>
          </label>

          {/* Range Switcher */}
          <div className="flex items-center bg-gray-950 p-0.5 rounded border border-gray-800 text-[10px] font-mono">
            <button
              onClick={() => setTurnsRange('5')}
              className={cn("px-1.5 py-0.5 rounded", turnsRange === '5' ? "bg-gray-800 text-white font-bold" : "text-gray-400")}
            >
              5T
            </button>
            <button
              onClick={() => setTurnsRange('10')}
              className={cn("px-1.5 py-0.5 rounded", turnsRange === '10' ? "bg-gray-800 text-white font-bold" : "text-gray-400")}
            >
              10T
            </button>
            <button
              onClick={() => setTurnsRange('all')}
              className={cn("px-1.5 py-0.5 rounded", turnsRange === 'all' ? "bg-gray-800 text-white font-bold" : "text-gray-400")}
            >
              All
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Analytical Summary Badges */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 p-2.5 bg-gray-950 border-b border-gray-800/80 text-[11px] font-mono">
          <div className="p-2 rounded bg-indigo-950/20 border border-indigo-900/50">
            <span className="text-[9px] text-gray-400 uppercase tracking-wider block">
              {primary.role} Avg
            </span>
            <div className="flex items-baseline space-x-1 mt-0.5">
              <strong className="text-xs text-indigo-300 font-bold">{stats.primAvg} ms</strong>
              <span className="text-[9px] text-gray-500">(±{stats.primStdDev}ms)</span>
            </div>
            <span className="text-[9px] text-indigo-400/80 block mt-0.5 truncate">
              {primary.model}
            </span>
          </div>

          <div className="p-2 rounded bg-emerald-950/20 border border-emerald-900/50">
            <span className="text-[9px] text-gray-400 uppercase tracking-wider block">
              {secondary.role} Avg
            </span>
            <div className="flex items-baseline space-x-1 mt-0.5">
              <strong className="text-xs text-emerald-300 font-bold">{stats.secAvg} ms</strong>
              <span className="text-[9px] text-gray-500">(±{stats.secStdDev}ms)</span>
            </div>
            <span className="text-[9px] text-emerald-400/80 block mt-0.5 truncate">
              {secondary.model}
            </span>
          </div>

          <div className="p-2 rounded bg-gray-900/70 border border-gray-800">
            <span className="text-[9px] text-gray-400 uppercase tracking-wider block">
              Fastest Response
            </span>
            <div className="flex items-baseline space-x-1 mt-0.5">
              <strong className="text-xs text-cyan-300 font-bold">
                {Math.min(stats.primMin, stats.secMin)} ms
              </strong>
              <span className="text-[9px] text-gray-500">
                ({stats.secMin < stats.primMin ? secondary.role : primary.role})
              </span>
            </div>
            <span className="text-[9px] text-gray-500 block mt-0.5">
              Peak: {Math.max(stats.primMax, stats.secMax)}ms
            </span>
          </div>

          <div className="p-2 rounded bg-gray-900/70 border border-gray-800">
            <span className="text-[9px] text-gray-400 uppercase tracking-wider block">
              SLA Adherence
            </span>
            <div className="flex items-baseline space-x-1 mt-0.5">
              <strong className="text-xs text-emerald-400 font-bold">
                A: {stats.primSlaPct}% | B: {stats.secSlaPct}%
              </strong>
            </div>
            <span className="text-[9px] text-gray-500 block mt-0.5">
              Target: {primary.slaTargetMs}ms / {secondary.slaTargetMs}ms
            </span>
          </div>

          <div className="p-2 rounded bg-gray-900/70 border border-gray-800">
            <span className="text-[9px] text-gray-400 uppercase tracking-wider block">
              Latency Spread
            </span>
            <div className="flex items-baseline space-x-1 mt-0.5">
              <strong className="text-xs text-purple-300 font-bold">
                {Math.abs(stats.primAvg - stats.secAvg)} ms
              </strong>
              <span className="text-[9px] text-gray-500">
                ({Math.round((Math.abs(stats.primAvg - stats.secAvg) / Math.max(stats.primAvg, stats.secAvg)) * 100)}%)
              </span>
            </div>
            <span className="text-[9px] text-purple-400/80 block mt-0.5">
              {stats.secAvg < stats.primAvg ? `${secondary.role} faster` : `${primary.role} faster`}
            </span>
          </div>

          <div className="p-2 rounded bg-gray-900/70 border border-gray-800">
            <span className="text-[9px] text-gray-400 uppercase tracking-wider block">
              Session Profile
            </span>
            <div className="flex items-baseline space-x-1 mt-0.5">
              <strong className="text-xs text-gray-200 font-bold">
                {stats.turnsCount} turns logged
              </strong>
            </div>
            <span className="text-[9px] text-emerald-400 block mt-0.5">
              Est. ${perf.totalSessionCostUsd.toFixed(4)}
            </span>
          </div>
        </div>
      )}

      {/* Main Recharts Canvas */}
      <div className={cn("p-3 w-full bg-gray-950", isExpanded ? "h-[calc(100vh-280px)]" : compact ? "h-64" : "h-80")}>
        <ResponsiveContainer width="100%" height="100%">
          {chartMode === 'delta_spread' ? (
            <AreaChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="gradientDelta" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="gradientPrimary" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="gradientSecondary" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis dataKey="turnLabel" stroke="#4b5563" tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <YAxis stroke="#4b5563" tick={{ fill: '#9ca3af', fontSize: 11 }} unit="ms" />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />

              {showDeltaArea && (
                <Area
                  type="monotone"
                  dataKey="deltaLatency"
                  name="Latency Differential (Δ ms)"
                  stroke="#c084fc"
                  strokeWidth={2}
                  fill="url(#gradientDelta)"
                />
              )}

              {showPrimary && (
                <Line
                  type="monotone"
                  dataKey="primaryLatency"
                  name={`${primary.role} Latency`}
                  stroke="#818cf8"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#6366f1', strokeWidth: 1.5, stroke: '#ffffff' }}
                  activeDot={{ r: 6, fill: '#818cf8' }}
                />
              )}

              {showSecondary && (
                <Line
                  type="monotone"
                  dataKey="secondaryLatency"
                  name={`${secondary.role} Latency`}
                  stroke="#34d399"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#10b981', strokeWidth: 1.5, stroke: '#ffffff' }}
                  activeDot={{ r: 6, fill: '#34d399' }}
                />
              )}
            </AreaChart>
          ) : chartMode === 'speed_throughput' ? (
            <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis dataKey="turnLabel" stroke="#4b5563" tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <YAxis yAxisId="left" stroke="#4b5563" tick={{ fill: '#9ca3af', fontSize: 11 }} unit="ms" />
              <YAxis yAxisId="right" orientation="right" stroke="#4b5563" tick={{ fill: '#9ca3af', fontSize: 11 }} unit=" t/s" />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />

              <Bar yAxisId="right" dataKey="primaryTps" name={`${primary.role} Speed (t/s)`} fill="#4338ca" opacity={0.6} radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="secondaryTps" name={`${secondary.role} Speed (t/s)`} fill="#065f46" opacity={0.6} radius={[4, 4, 0, 0]} />

              {showPrimary && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="primaryLatency"
                  name={`${primary.role} Latency (ms)`}
                  stroke="#818cf8"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#6366f1' }}
                />
              )}

              {showSecondary && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="secondaryLatency"
                  name={`${secondary.role} Latency (ms)`}
                  stroke="#34d399"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#10b981' }}
                />
              )}
            </ComposedChart>
          ) : chartMode === 'sla_compliance' ? (
            <AreaChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="gradientPrimarySla" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="gradientSecondarySla" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis dataKey="turnLabel" stroke="#4b5563" tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <YAxis stroke="#4b5563" tick={{ fill: '#9ca3af', fontSize: 11 }} unit="ms" />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />

              {/* Reference SLA target lines */}
              {showSlaLines && (
                <>
                  <ReferenceLine
                    y={primary.slaTargetMs}
                    stroke="#818cf8"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{ value: `Primary SLA (${primary.slaTargetMs}ms)`, fill: '#818cf8', fontSize: 10, position: 'insideTopRight' }}
                  />
                  <ReferenceLine
                    y={secondary.slaTargetMs}
                    stroke="#34d399"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{ value: `Secondary SLA (${secondary.slaTargetMs}ms)`, fill: '#34d399', fontSize: 10, position: 'insideBottomRight' }}
                  />
                </>
              )}

              {showPrimary && (
                <Area
                  type="monotone"
                  dataKey="primaryLatency"
                  name={`${primary.role} Latency`}
                  stroke="#818cf8"
                  strokeWidth={2.5}
                  fill="url(#gradientPrimarySla)"
                  dot={{ r: 4, fill: '#6366f1' }}
                />
              )}

              {showSecondary && (
                <Area
                  type="monotone"
                  dataKey="secondaryLatency"
                  name={`${secondary.role} Latency`}
                  stroke="#34d399"
                  strokeWidth={2.5}
                  fill="url(#gradientSecondarySla)"
                  dot={{ r: 4, fill: '#10b981' }}
                />
              )}
            </AreaChart>
          ) : (
            /* Default: Standard Response Latency Dual-Line / Area Chart */
            <AreaChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="gradientPrimaryLat" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="gradientSecondaryLat" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis dataKey="turnLabel" stroke="#4b5563" tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <YAxis stroke="#4b5563" tick={{ fill: '#9ca3af', fontSize: 11 }} unit="ms" />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />

              {/* SLA Target Reference Lines */}
              {showSlaLines && (
                <>
                  <ReferenceLine
                    y={primary.slaTargetMs}
                    stroke="#818cf8"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{ value: `SLA: ${primary.slaTargetMs}ms`, fill: '#818cf8', fontSize: 10, position: 'insideTopLeft' }}
                  />
                  <ReferenceLine
                    y={secondary.slaTargetMs}
                    stroke="#34d399"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{ value: `SLA: ${secondary.slaTargetMs}ms`, fill: '#34d399', fontSize: 10, position: 'insideBottomLeft' }}
                  />
                </>
              )}

              {/* Session Rolling Average Lines */}
              {showAvgLines && (
                <>
                  <ReferenceLine
                    y={stats?.primAvg || primary.avgLatencyMs}
                    stroke="#a5b4fc"
                    strokeDasharray="2 2"
                    strokeWidth={1}
                  />
                  <ReferenceLine
                    y={stats?.secAvg || secondary.avgLatencyMs}
                    stroke="#6ee7b7"
                    strokeDasharray="2 2"
                    strokeWidth={1}
                  />
                </>
              )}

              {showPrimary && (
                <Area
                  type="monotone"
                  dataKey="primaryLatency"
                  name={`${primary.role} (${primary.model})`}
                  stroke="#818cf8"
                  strokeWidth={2.5}
                  fill="url(#gradientPrimaryLat)"
                  dot={{ r: 4, fill: '#6366f1', strokeWidth: 1.5, stroke: '#ffffff' }}
                  activeDot={{ r: 6, fill: '#818cf8' }}
                />
              )}

              {showSecondary && (
                <Area
                  type="monotone"
                  dataKey="secondaryLatency"
                  name={`${secondary.role} (${secondary.model})`}
                  stroke="#34d399"
                  strokeWidth={2.5}
                  fill="url(#gradientSecondaryLat)"
                  dot={{ r: 4, fill: '#10b981', strokeWidth: 1.5, stroke: '#ffffff' }}
                  activeDot={{ r: 6, fill: '#34d399' }}
                />
              )}
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Bottom Footer: Quick Insight & Interactive Benchmarking status */}
      <div className="px-3 py-2 bg-gray-900/90 border-t border-gray-800 flex flex-wrap items-center justify-between text-xs text-gray-400 gap-2">
        <div className="flex items-center space-x-2 text-[11px]">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="font-mono text-gray-300">
            {secondary.role} ({secondary.model}) is currently averaging{' '}
            <strong className="text-emerald-300">{stats?.secAvg}ms</strong> vs{' '}
            {primary.role} at <strong className="text-indigo-300">{stats?.primAvg}ms</strong> (
            <span className="text-cyan-300 font-bold">
              {stats && stats.primAvg > stats.secAvg
                ? `${Math.round(((stats.primAvg - stats.secAvg) / stats.primAvg) * 100)}% faster response`
                : `${Math.round(((stats.secAvg - stats.primAvg) / stats.secAvg) * 100)}% faster response`}
            </span>
            )
          </span>
        </div>

        <div className="flex items-center space-x-3 text-[10px] font-mono text-gray-500">
          <span>Target SLA: Architect ≤ {primary.slaTargetMs}ms | Builder ≤ {secondary.slaTargetMs}ms</span>
        </div>
      </div>
    </div>
  );
}
