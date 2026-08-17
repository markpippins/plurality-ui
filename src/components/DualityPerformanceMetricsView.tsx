import React, { useState } from 'react';
import { useSimulation } from '../hooks/useSimulation';
import { 
  Zap, Clock, Cpu, Bot, ArrowRight, RefreshCw, BarChart2, 
  TrendingUp, TrendingDown, DollarSign, Award, Layers,
  ChevronDown, ChevronUp, Play, CheckCircle2, AlertTriangle, ShieldCheck, Database,
  Activity, LineChart as LineChartIcon
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { DualityAgentMetric, DualityPerformanceMetrics, DualityTurnMetric } from '../types';
import { DualityLatencyTrendsChart } from './DualityLatencyTrendsChart';

export interface DualityPerformanceMetricsViewProps {
  compact?: boolean;
}

export function DualityPerformanceMetricsView({ compact = false }: DualityPerformanceMetricsViewProps) {
  const { dualityState, runDualityBenchmark, resetDualityMetrics } = useSimulation();
  const [showTurnHistory, setShowTurnHistory] = useState(!compact);
  const [activeMetricTab, setActiveMetricTab] = useState<'latency' | 'tokens' | 'cost'>('latency');
  const [showFullChart, setShowFullChart] = useState(true);

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

  // Comparison metrics calculation
  const latencyDelta = primary.avgLatencyMs - secondary.avgLatencyMs;
  const fasterAgent = latencyDelta > 0 ? secondary.role : primary.role;
  const fasterByPct = Math.round((Math.abs(latencyDelta) / Math.max(primary.avgLatencyMs, secondary.avgLatencyMs || 1)) * 100);

  const tpsDelta = secondary.tokensPerSec - primary.tokensPerSec;
  const higherTpsAgent = tpsDelta >= 0 ? secondary.role : primary.role;
  const higherTpsPct = Math.round((Math.abs(tpsDelta) / Math.max(primary.tokensPerSec, secondary.tokensPerSec || 1)) * 100);

  // Mini sparkline renderer
  const renderSparkline = (history: number[], color: string, height: number = 24) => {
    if (!history || history.length === 0) return null;
    const min = Math.min(...history);
    const max = Math.max(...history);
    const range = max - min || 1;
    const width = 80;
    const step = width / Math.max(history.length - 1, 1);

    const points = history.map((val, idx) => {
      const x = idx * step;
      const y = height - ((val - min) / range) * (height - 6) - 3;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg width={width} height={height} className="overflow-visible">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
        {history.map((val, idx) => {
          const x = idx * step;
          const y = height - ((val - min) / range) * (height - 6) - 3;
          return (
            <circle
              key={idx}
              cx={x}
              cy={y}
              r="2"
              fill={color}
              className="opacity-90"
            />
          );
        })}
      </svg>
    );
  };

  return (
    <div id="duality-performance-metrics-view" className="flex flex-col bg-gray-950 border border-gray-800 rounded-lg overflow-hidden text-gray-200">
      {/* Metrics Header & Global Controls */}
      <div className="p-3 bg-gray-900/90 border-b border-gray-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-md bg-cyan-950/80 border border-cyan-800/80 text-cyan-400">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xs font-bold text-gray-100 uppercase tracking-wider">
                Duality Side-by-Side Performance
              </h3>
              <span className="text-[10px] font-mono bg-cyan-950/60 text-cyan-300 border border-cyan-800/60 px-1.5 py-0.2 rounded font-semibold">
                Telemetry Active
              </span>
            </div>
            <p className="text-[11px] text-gray-400">
              Live response latency, token throughput, and SLA comparison
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            id="btn-duality-run-benchmark"
            onClick={runDualityBenchmark}
            disabled={isBenchmarkRunning}
            className={cn(
              "text-xs px-2.5 py-1.5 rounded font-semibold flex items-center space-x-1.5 transition-all shadow-sm",
              isBenchmarkRunning
                ? "bg-amber-950/80 text-amber-300 border border-amber-800 cursor-wait"
                : "bg-cyan-600 hover:bg-cyan-500 text-white border border-cyan-500"
            )}
            title="Run concurrent benchmarking test for primary and secondary models"
          >
            <RefreshCw className={cn("w-3 h-3", isBenchmarkRunning && "animate-spin text-amber-300")} />
            <span>{isBenchmarkRunning ? 'Benchmarking...' : '⚡ Run Benchmark'}</span>
          </button>

          <button
            id="btn-duality-reset-metrics"
            onClick={resetDualityMetrics}
            className="text-[11px] text-gray-400 hover:text-gray-200 hover:bg-gray-800 border border-gray-800 px-2 py-1.5 rounded transition-colors"
            title="Reset telemetry metrics and turn counters"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Head-to-Head Comparison Banner */}
      <div className="px-3 py-2 bg-gradient-to-r from-indigo-950/40 via-gray-900 to-emerald-950/40 border-b border-gray-800/80 flex flex-wrap items-center justify-between text-xs gap-2">
        <div className="flex items-center space-x-3 text-[11px]">
          <span className="text-gray-400 flex items-center space-x-1">
            <Clock className="w-3 h-3 text-cyan-400" />
            <span>Latency Delta:</span>
            <strong className="text-emerald-300 font-mono">
              {fasterAgent} is {fasterByPct}% faster
            </strong>
          </span>
          <span className="text-gray-600">|</span>
          <span className="text-gray-400 flex items-center space-x-1">
            <Zap className="w-3 h-3 text-purple-400" />
            <span>Throughput:</span>
            <strong className="text-purple-300 font-mono">
              {higherTpsAgent} (+{higherTpsPct}%)
            </strong>
          </span>
        </div>

        <div className="flex items-center space-x-3 text-[11px] font-mono text-gray-400">
          <span>Session Tokens: <strong className="text-gray-200">{perf.totalSessionTokens.toLocaleString()}</strong></span>
          <span>Est. Cost: <strong className="text-emerald-400">${perf.totalSessionCostUsd.toFixed(4)}</strong></span>
          <span>Turns: <strong className="text-gray-200">{perf.totalTurns}</strong></span>
        </div>
      </div>

      {/* Interactive Response Latency Trend Visualizer */}
      <div className="p-3 bg-gray-950 border-b border-gray-800">
        <DualityLatencyTrendsChart compact={compact} />
      </div>

      {/* Side-by-Side Agent Metric Cards */}
      <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-950">
        {/* PRIMARY AGENT CARD (Architect) */}
        <div 
          id="card-duality-primary-metrics"
          className="rounded-lg border border-indigo-900/60 bg-indigo-950/15 p-3 space-y-3 flex flex-col justify-between"
        >
          {/* Agent Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-md bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                A
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs font-bold text-indigo-300">{primary.role}</span>
                  <span className="text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-800/80 px-1 rounded font-semibold">
                    Primary
                  </span>
                </div>
                <span className="text-[10px] font-mono text-gray-400 flex items-center space-x-1">
                  <Cpu className="w-2.5 h-2.5 text-indigo-400" />
                  <span>{primary.model}</span>
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className={cn(
                "text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase",
                primary.avgLatencyMs <= primary.slaTargetMs
                  ? "bg-emerald-950/80 text-emerald-300 border-emerald-800"
                  : "bg-amber-950/80 text-amber-300 border-amber-800"
              )}>
                {primary.avgLatencyMs <= primary.slaTargetMs ? '✓ SLA Target Met' : '⚠️ SLA Overrun'}
              </span>
              <div className="text-[9px] text-gray-500 font-mono mt-0.5">
                Target: {primary.slaTargetMs}ms
              </div>
            </div>
          </div>

          {/* Core Latency Metrics Row */}
          <div className="bg-gray-900/80 rounded-md p-2.5 border border-indigo-900/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-gray-300 flex items-center space-x-1">
                <Clock className="w-3 h-3 text-indigo-400" />
                <span>Response Latency</span>
              </span>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-mono font-bold text-indigo-300">
                  {primary.lastLatencyMs} ms
                </span>
                <span className="text-[10px] text-gray-500 font-mono">
                  (avg: {primary.avgLatencyMs}ms)
                </span>
              </div>
            </div>

            {/* Visual SLA Gauge Bar */}
            <div className="space-y-1">
              <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden flex">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    primary.avgLatencyMs <= primary.slaTargetMs ? "bg-indigo-500" : "bg-amber-500"
                  )}
                  style={{ width: `${Math.min((primary.avgLatencyMs / (primary.slaTargetMs * 1.3)) * 100, 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[9px] font-mono text-gray-500">
                <span>min: {primary.minLatencyMs}ms</span>
                <span>max: {primary.maxLatencyMs}ms</span>
                <span>SLA: {primary.slaTargetMs}ms</span>
              </div>
            </div>

            {/* Sparkline */}
            <div className="flex items-center justify-between pt-1 border-t border-gray-800/80">
              <span className="text-[9px] text-gray-500 uppercase tracking-wider">Latency Trend</span>
              {renderSparkline(primary.latencyHistory || [], '#818cf8', 20)}
            </div>
          </div>

          {/* Token Usage & Throughput Row */}
          <div className="grid grid-cols-3 gap-1.5 text-center font-mono">
            <div className="bg-gray-900/60 p-1.5 rounded border border-gray-800">
              <span className="text-[9px] text-gray-500 block uppercase">Tokens Used</span>
              <strong className="text-xs text-purple-300">{primary.totalTokensUsed.toLocaleString()}</strong>
              <div className="text-[8px] text-gray-500 mt-0.5">
                {primary.promptTokens}p / {primary.completionTokens}c
              </div>
            </div>

            <div className="bg-gray-900/60 p-1.5 rounded border border-gray-800">
              <span className="text-[9px] text-gray-500 block uppercase">Speed</span>
              <strong className="text-xs text-cyan-300">{primary.tokensPerSec} t/s</strong>
              <div className="text-[8px] text-emerald-400 mt-0.5">
                {primary.cacheHitPct}% cache
              </div>
            </div>

            <div className="bg-gray-900/60 p-1.5 rounded border border-gray-800">
              <span className="text-[9px] text-gray-500 block uppercase">Est. Cost</span>
              <strong className="text-xs text-emerald-300">${primary.estimatedCostUsd.toFixed(4)}</strong>
              <div className="text-[8px] text-gray-500 mt-0.5">
                {primary.turnsCount} turns
              </div>
            </div>
          </div>
        </div>

        {/* SECONDARY AGENT CARD (Builder) */}
        <div 
          id="card-duality-secondary-metrics"
          className="rounded-lg border border-emerald-900/60 bg-emerald-950/15 p-3 space-y-3 flex flex-col justify-between"
        >
          {/* Agent Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-md bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                B
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs font-bold text-emerald-300">{secondary.role}</span>
                  <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800/80 px-1 rounded font-semibold">
                    Secondary
                  </span>
                </div>
                <span className="text-[10px] font-mono text-gray-400 flex items-center space-x-1">
                  <Cpu className="w-2.5 h-2.5 text-emerald-400" />
                  <span>{secondary.model}</span>
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className={cn(
                "text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase",
                secondary.avgLatencyMs <= secondary.slaTargetMs
                  ? "bg-emerald-950/80 text-emerald-300 border-emerald-800"
                  : "bg-amber-950/80 text-amber-300 border-amber-800"
              )}>
                {secondary.avgLatencyMs <= secondary.slaTargetMs ? '✓ SLA Target Met' : '⚠️ SLA Overrun'}
              </span>
              <div className="text-[9px] text-gray-500 font-mono mt-0.5">
                Target: {secondary.slaTargetMs}ms
              </div>
            </div>
          </div>

          {/* Core Latency Metrics Row */}
          <div className="bg-gray-900/80 rounded-md p-2.5 border border-emerald-900/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-gray-300 flex items-center space-x-1">
                <Clock className="w-3 h-3 text-emerald-400" />
                <span>Response Latency</span>
              </span>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-mono font-bold text-emerald-300">
                  {secondary.lastLatencyMs} ms
                </span>
                <span className="text-[10px] text-gray-500 font-mono">
                  (avg: {secondary.avgLatencyMs}ms)
                </span>
              </div>
            </div>

            {/* Visual SLA Gauge Bar */}
            <div className="space-y-1">
              <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden flex">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    secondary.avgLatencyMs <= secondary.slaTargetMs ? "bg-emerald-500" : "bg-amber-500"
                  )}
                  style={{ width: `${Math.min((secondary.avgLatencyMs / (secondary.slaTargetMs * 1.3)) * 100, 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[9px] font-mono text-gray-500">
                <span>min: {secondary.minLatencyMs}ms</span>
                <span>max: {secondary.maxLatencyMs}ms</span>
                <span>SLA: {secondary.slaTargetMs}ms</span>
              </div>
            </div>

            {/* Sparkline */}
            <div className="flex items-center justify-between pt-1 border-t border-gray-800/80">
              <span className="text-[9px] text-gray-500 uppercase tracking-wider">Latency Trend</span>
              {renderSparkline(secondary.latencyHistory || [], '#34d399', 20)}
            </div>
          </div>

          {/* Token Usage & Throughput Row */}
          <div className="grid grid-cols-3 gap-1.5 text-center font-mono">
            <div className="bg-gray-900/60 p-1.5 rounded border border-gray-800">
              <span className="text-[9px] text-gray-500 block uppercase">Tokens Used</span>
              <strong className="text-xs text-purple-300">{secondary.totalTokensUsed.toLocaleString()}</strong>
              <div className="text-[8px] text-gray-500 mt-0.5">
                {secondary.promptTokens}p / {secondary.completionTokens}c
              </div>
            </div>

            <div className="bg-gray-900/60 p-1.5 rounded border border-gray-800">
              <span className="text-[9px] text-gray-500 block uppercase">Speed</span>
              <strong className="text-xs text-cyan-300">{secondary.tokensPerSec} t/s</strong>
              <div className="text-[8px] text-emerald-400 mt-0.5">
                {secondary.cacheHitPct}% cache
              </div>
            </div>

            <div className="bg-gray-900/60 p-1.5 rounded border border-gray-800">
              <span className="text-[9px] text-gray-500 block uppercase">Est. Cost</span>
              <strong className="text-xs text-emerald-300">${secondary.estimatedCostUsd.toFixed(4)}</strong>
              <div className="text-[8px] text-gray-500 mt-0.5">
                {secondary.turnsCount} turns
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Turn-by-Turn Telemetry Stream */}
      <div className="border-t border-gray-800 bg-gray-900/50">
        <button
          onClick={() => setShowTurnHistory(!showTurnHistory)}
          className="w-full px-3 py-2 flex items-center justify-between text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-900 transition-colors"
        >
          <span className="font-semibold flex items-center space-x-1.5">
            <BarChart2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Turn-by-Turn Telemetry Audit ({perf.recentTurns?.length || 0} recorded)</span>
          </span>
          <div className="flex items-center space-x-1 text-[11px] text-gray-500">
            <span>{showTurnHistory ? 'Hide Telemetry' : 'Show Telemetry'}</span>
            {showTurnHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </div>
        </button>

        <AnimatePresence>
          {showTurnHistory && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <div className="p-3 pt-0 space-y-1.5 max-h-48 overflow-y-auto font-mono text-[11px]">
                {(!perf.recentTurns || perf.recentTurns.length === 0) ? (
                  <div className="p-3 text-center text-gray-500 text-xs italic bg-gray-950/60 rounded border border-gray-800">
                    No recent turn metrics recorded yet. Send a prompt or run a benchmark to capture telemetry.
                  </div>
                ) : (
                  perf.recentTurns.map((turn) => {
                    const isPrimary = turn.role === primary.role;
                    return (
                      <div
                        key={turn.turnId}
                        className={cn(
                          "p-2 rounded border flex items-center justify-between gap-2 transition-all",
                          isPrimary
                            ? "bg-indigo-950/20 border-indigo-900/40 text-indigo-200"
                            : "bg-emerald-950/20 border-emerald-900/40 text-emerald-200"
                        )}
                      >
                        <div className="flex items-center space-x-2 min-w-0">
                          <span className={cn(
                            "w-4 h-4 rounded flex items-center justify-center text-[9px] font-bold text-white shrink-0",
                            isPrimary ? "bg-indigo-600" : "bg-emerald-600"
                          )}>
                            {isPrimary ? 'A' : 'B'}
                          </span>
                          <span className="font-bold text-gray-200 truncate">{turn.role}</span>
                          <span className="text-[10px] text-gray-500">[{turn.action}]</span>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0 text-[10px]">
                          <span className="text-cyan-300 font-bold">{turn.latencyMs}ms</span>
                          <span className="text-gray-600">|</span>
                          <span className="text-purple-300">{turn.totalTokens}t</span>
                          <span className="text-gray-600">|</span>
                          <span className="text-emerald-400">{turn.tokensPerSec} t/s</span>
                          <span className="text-gray-500">
                            {new Date(turn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
