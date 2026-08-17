import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSimulation } from '../hooks/useSimulation';
import { ActiveAgent, AgentMetricItem, AgentConfigTemplate } from '../types';
import { 
  Sliders, Zap, Clock, Cpu, CheckCircle2, ShieldAlert, 
  Flame, Terminal, ArrowLeftRight, Check, Copy, 
  Bookmark, Sparkles, AlertCircle, FileText, ChevronDown, 
  Eye, RefreshCw, BarChart2, TrendingUp, TrendingDown, Layers, HardDrive, Filter, X,
  Activity, LineChart as LineChartIcon, Gauge,
  Play, Pause, RotateCcw, FastForward, Rewind, SkipBack, SkipForward,
  History, BookmarkCheck, Compass, Radio, Timer, AlertTriangle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  Tooltip, Cell, RadarChart, PolarGrid, PolarAngleAxis, 
  PolarRadiusAxis, Radar, Legend, LineChart, Line, AreaChart, Area, ReferenceLine 
} from 'recharts';
import { SaveTemplateDialog } from './SaveTemplateDialog';

interface MiniSparklineProps {
  data: number[];
  strokeColor?: string;
  fillColor?: string;
  width?: number;
  height?: number;
  className?: string;
  metricName?: string;
  unit?: string;
  agentName?: string;
  formatValue?: (val: number) => string;
  lowerIsBetter?: boolean;
}

function MiniSparkline({
  data,
  strokeColor = '#a855f7',
  fillColor = 'rgba(168, 85, 247, 0.15)',
  width = 100,
  height = 26,
  className,
  metricName = 'Metric',
  unit = '',
  agentName = '',
  formatValue,
  lowerIsBetter = false
}: MiniSparklineProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min === 0 ? 1 : max - min;
  const avg = Math.round(data.reduce((acc, v) => acc + v, 0) / data.length);
  
  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 6) - 3;
    return { x, y, val, idx };
  });
  
  const pathD = `M ${points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')}`;
  const areaD = `M 0,${height} L ${points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')} L ${width},${height} Z`;
  const lastPoint = points[points.length - 1];

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX;
    const relX = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const ratio = relX / (rect.width || 1);
    const idx = Math.max(0, Math.min(data.length - 1, Math.round(ratio * (data.length - 1))));
    setHoverIdx(idx);
  };

  const handlePointerLeave = () => {
    setHoverIdx(null);
  };

  const activePoint = hoverIdx !== null ? points[hoverIdx] : null;
  const prevVal = hoverIdx !== null && hoverIdx > 0 ? data[hoverIdx - 1] : (activePoint ? activePoint.val : 0);
  const deltaPrev = activePoint ? activePoint.val - prevVal : 0;
  const deltaPrevPct = prevVal !== 0 ? Math.round(((activePoint?.val || 0) - prevVal) / Math.abs(prevVal) * 100) : 0;

  const formatFn = formatValue || ((v: number) => `${v}${unit ? (unit.startsWith(' ') || unit.startsWith('%') ? unit : ` ${unit}`) : ''}`);

  return (
    <div 
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative group cursor-crosshair inline-flex items-center justify-end flex-1 max-w-[120px]"
    >
      <svg 
        viewBox={`0 0 ${width} ${height}`} 
        className={cn("overflow-visible w-full touch-none", className)} 
        style={{ height }}
      >
        <defs>
          <linearGradient id={`grad-${strokeColor.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.35" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <motion.path 
          initial={false}
          animate={{ d: areaD }} 
          transition={{ duration: 0.45, ease: "easeOut" }}
          fill={fillColor || `url(#grad-${strokeColor.replace('#', '')})`} 
        />
        <motion.path 
          initial={false}
          animate={{ d: pathD }} 
          transition={{ duration: 0.45, ease: "easeOut" }}
          fill="none" 
          stroke={strokeColor} 
          strokeWidth="1.75" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />

        {/* Hover Laser Guide & Active Point */}
        {activePoint ? (
          <>
            <line
              x1={activePoint.x}
              y1={0}
              x2={activePoint.x}
              y2={height}
              stroke={strokeColor}
              strokeWidth="1.2"
              strokeDasharray="2 2"
              strokeOpacity="0.85"
            />
            <circle
              cx={activePoint.x}
              cy={activePoint.y}
              r="3.5"
              fill={strokeColor}
              stroke="#0f172a"
              strokeWidth="1.5"
            />
            <circle
              cx={activePoint.x}
              cy={activePoint.y}
              r="6.5"
              fill="none"
              stroke={strokeColor}
              strokeWidth="1"
              strokeOpacity="0.6"
            />
          </>
        ) : (
          <>
            <motion.circle
              initial={false}
              animate={{ cx: lastPoint.x, cy: lastPoint.y }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              r="2.5"
              fill={strokeColor}
              className="animate-pulse"
            />
            <motion.circle
              key={`${lastPoint.x}-${lastPoint.y}`}
              initial={{ r: 2.5, opacity: 0.8 }}
              animate={{ r: 7, opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              cx={lastPoint.x}
              cy={lastPoint.y}
              fill="none"
              stroke={strokeColor}
              strokeWidth="1.2"
            />
          </>
        )}
      </svg>

      {/* Floating Precision Hover Tooltip */}
      <AnimatePresence>
        {activePoint && hoverIdx !== null && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 2, scale: 0.94 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            className={cn(
              "absolute z-50 pointer-events-none bg-gray-950/95 backdrop-blur-md text-gray-100 text-[10px] rounded-lg p-2 shadow-2xl border border-gray-700/80 min-w-[130px] whitespace-nowrap",
              hoverIdx >= data.length - 2
                ? "right-0"
                : hoverIdx <= 1
                ? "left-0"
                : "left-1/2 -translate-x-1/2",
              "bottom-[calc(100%+6px)]"
            )}
          >
            <div className="flex items-center justify-between gap-1.5 border-b border-gray-800 pb-1 mb-1 text-[9px] font-mono">
              <span className="text-gray-300 font-semibold truncate max-w-[80px]">
                {agentName || 'Telemetry'}
              </span>
              <span className="text-gray-400 bg-gray-900 px-1 rounded border border-gray-800 shrink-0">
                {hoverIdx === data.length - 1 ? 'Latest' : `T-${data.length - 1 - hoverIdx}`}
              </span>
            </div>

            <div className="flex items-baseline justify-between gap-2">
              <span className="text-gray-400 font-medium text-[9px]">{metricName}:</span>
              <span className="font-bold font-mono text-xs text-white" style={{ color: strokeColor }}>
                {formatFn(activePoint.val)}
              </span>
            </div>

            {hoverIdx > 0 && deltaPrev !== 0 ? (
              <div className="flex items-center justify-between text-[9px] font-mono text-gray-400 pt-1 mt-1 border-t border-gray-800/60">
                <span>vs prev:</span>
                <span className={cn(
                  "font-bold",
                  (lowerIsBetter ? deltaPrev < 0 : deltaPrev > 0)
                    ? "text-emerald-400"
                    : "text-rose-400"
                )}>
                  {deltaPrev > 0 ? `+${deltaPrev}` : deltaPrev}{unit ? (unit.startsWith(' ') || unit.startsWith('%') ? unit : ` ${unit}`) : ''} ({deltaPrevPct > 0 ? `+${deltaPrevPct}%` : `${deltaPrevPct}%`})
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between text-[8px] font-mono text-gray-500 pt-0.5 mt-0.5 border-t border-gray-800/40">
                <span>Window Avg:</span>
                <span className="text-gray-300 font-mono">{formatFn(avg)}</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface CustomTelemetrySparklineTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  sparklineConfig: any;
  agentA?: ActiveAgent;
  agentB?: ActiveAgent;
}

function CustomTelemetrySparklineTooltip({
  active,
  payload,
  label,
  sparklineConfig,
  agentA,
  agentB
}: CustomTelemetrySparklineTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const dataPoint = payload[0]?.payload;
  if (!dataPoint) return null;

  const valA = Number(dataPoint[sparklineConfig.keyA]);
  const valB = Number(dataPoint[sparklineConfig.keyB]);
  const delta = Math.abs(valA - valB);
  const isAWinner = sparklineConfig.lowerIsBetter ? valA < valB : valA > valB;
  const isBWinner = sparklineConfig.lowerIsBetter ? valB < valA : valB > valA;
  const baselineMax = Math.max(valA, valB) || 1;
  const deltaPct = Math.round((delta / baselineMax) * 100);

  const passesSlaA = sparklineConfig.slaTarget 
    ? (sparklineConfig.lowerIsBetter ? valA <= sparklineConfig.slaTarget : valA >= sparklineConfig.slaTarget)
    : null;
  const passesSlaB = sparklineConfig.slaTarget 
    ? (sparklineConfig.lowerIsBetter ? valB <= sparklineConfig.slaTarget : valB >= sparklineConfig.slaTarget)
    : null;

  return (
    <div className="bg-gray-950/95 backdrop-blur-md border border-gray-700/90 rounded-xl p-3 shadow-2xl min-w-[260px] text-xs space-y-2.5 z-50">
      {/* Header with Turn & Time info */}
      <div className="flex items-center justify-between border-b border-gray-800/80 pb-1.5">
        <div className="flex items-center space-x-1.5 font-mono text-[11px] font-bold text-gray-200">
          <Clock className="w-3.5 h-3.5 text-purple-400" />
          <span>{label}</span>
          <span className="text-gray-500 font-normal">({dataPoint.time})</span>
        </div>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-900 border border-gray-800 text-gray-400">
          Turn #{dataPoint.index + 1}
        </span>
      </div>

      {/* Comparison Grid between Agent A and Agent B */}
      <div className="grid grid-cols-2 gap-2">
        {/* Agent A Box */}
        <div className="p-2 rounded-lg bg-purple-950/40 border border-purple-900/60 space-y-1">
          <div className="flex items-center space-x-1 text-[10px] font-semibold text-purple-300 truncate">
            <span className="w-2 h-2 rounded-full bg-purple-500 inline-block shrink-0" />
            <span className="truncate">{agentA?.name || 'Agent A'}</span>
          </div>
          <div className="text-sm font-bold font-mono text-gray-100">
            {sparklineConfig.formatValue(valA)}
          </div>
          {passesSlaA !== null && (
            <div className={cn(
              "text-[9px] font-mono font-semibold flex items-center gap-0.5",
              passesSlaA ? "text-emerald-400" : "text-rose-400"
            )}>
              <span>{passesSlaA ? '✓ Met SLA' : '⚠ Exceeded SLA'}</span>
            </div>
          )}
        </div>

        {/* Agent B Box */}
        <div className="p-2 rounded-lg bg-cyan-950/40 border border-cyan-900/60 space-y-1">
          <div className="flex items-center space-x-1 text-[10px] font-semibold text-cyan-300 truncate">
            <span className="w-2 h-2 rounded-full bg-cyan-500 inline-block shrink-0" />
            <span className="truncate">{agentB?.name || 'Agent B'}</span>
          </div>
          <div className="text-sm font-bold font-mono text-gray-100">
            {sparklineConfig.formatValue(valB)}
          </div>
          {passesSlaB !== null && (
            <div className={cn(
              "text-[9px] font-mono font-semibold flex items-center gap-0.5",
              passesSlaB ? "text-emerald-400" : "text-rose-400"
            )}>
              <span>{passesSlaB ? '✓ Met SLA' : '⚠ Exceeded SLA'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Turn Delta & Advantage Banner */}
      <div className="pt-1.5 border-t border-gray-800/80 flex items-center justify-between text-[10px] font-mono">
        <span className="text-gray-400">Turn Delta:</span>
        <span className={cn(
          "px-1.5 py-0.5 rounded font-bold border inline-flex items-center gap-1",
          isAWinner
            ? "bg-purple-950/90 text-purple-300 border-purple-800"
            : isBWinner
            ? "bg-cyan-950/90 text-cyan-300 border-cyan-800"
            : "bg-gray-800 text-gray-400 border-gray-700"
        )}>
          {isAWinner
            ? `⚡ ${agentA?.name} +${sparklineConfig.unit === '%' ? delta + '%' : delta + sparklineConfig.unit} (${deltaPct}% lead)`
            : isBWinner
            ? `⚡ ${agentB?.name} +${sparklineConfig.unit === '%' ? delta + '%' : delta + sparklineConfig.unit} (${deltaPct}% lead)`
            : 'Exact Parity (0 delta)'}
        </span>
      </div>

      {/* SLA Target Reference Line */}
      {sparklineConfig.slaTarget && (
        <div className="text-[9px] font-mono text-gray-500 flex items-center justify-between">
          <span>Target SLA Benchmark:</span>
          <span className="text-emerald-400 font-semibold">{sparklineConfig.slaLabel}</span>
        </div>
      )}
    </div>
  );
}

interface AnimatedBadgeProps {
  children: React.ReactNode;
  className?: string;
  badgeKey?: string | number;
}

function AnimatedBadge({ children, className, badgeKey }: AnimatedBadgeProps) {
  return (
    <motion.span
      key={badgeKey}
      initial={{ scale: 0.93, opacity: 0.7 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.span>
  );
}

interface AnimatedValueProps {
  value: React.ReactNode;
  className?: string;
  unit?: string;
}

function AnimatedValue({ value, className, unit }: AnimatedValueProps) {
  return (
    <motion.span
      key={String(value)}
      initial={{ opacity: 0.55, y: -2, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className={className}
    >
      {value}{unit}
    </motion.span>
  );
}

interface AgentSplitViewCompareProps {
  onClose?: () => void;
}

const COMPARISON_PRESETS: Array<{ label: string; idA: string; idB: string; description: string }> = [
  { 
    label: 'Planner vs Architect', 
    idA: 'a1', 
    idB: 'a5', 
    description: 'Compare Goal Decomposition & Milestone Sequencer vs Structural Interface Architect' 
  },
  { 
    label: 'Builder vs QA Validator', 
    idA: 'a3', 
    idB: 'a4', 
    description: 'Compare Code Generation Craftsman vs Multi-Tier Test & Assertion Engine' 
  },
  { 
    label: 'Reviewer vs Reasoning Auditor', 
    idA: 'a2', 
    idB: 'a9', 
    description: 'Compare OWASP Security & Integrity Reviewer vs Epistemic Truth & Logic Auditor' 
  },
  { 
    label: 'DBA vs Network Topologist', 
    idA: 'a11', 
    idB: 'a12', 
    description: 'Compare High-Throughput Schema & ACID Specialist vs Graph Clustering & Lattice Router' 
  }
];

export function AgentSplitViewCompare({ onClose }: AgentSplitViewCompareProps) {
  const { 
    activeAgents, 
    performanceMetrics, 
    openAgentConfigModal, 
    selectAgentForLogs, 
    addToast 
  } = useSimulation();

  // Selected agent IDs
  const [agentAId, setAgentAId] = useState<string>(() => activeAgents[0]?.id || 'a1');
  const [agentBId, setAgentBId] = useState<string>(() => activeAgents[1]?.id || activeAgents[0]?.id || 'a2');

  // View preferences
  const [highlightDiffs, setHighlightDiffs] = useState<boolean>(true);
  const [expandedPrompts, setExpandedPrompts] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'hyperparams' | 'performance' | 'prompts'>('overview');
  const [chartMode, setChartMode] = useState<'radar' | 'bars'>('bars');

  // Sparkline Trend State
  const [selectedSparklineMetric, setSelectedSparklineMetric] = useState<'latency' | 'throughput' | 'tokens' | 'reliability'>('latency');
  const [sparklineChartType, setSparklineChartType] = useState<'area' | 'line'>('area');
  const [sparklinePointCount, setSparklinePointCount] = useState<number>(10);

  // Historical Timeline Scrubbing State
  const [selectedTimeIndex, setSelectedTimeIndex] = useState<number>(9);
  const [isPlayingTimeline, setIsPlayingTimeline] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isLooping, setIsLooping] = useState<boolean>(true);
  const [timelineHoverIndex, setTimelineHoverIndex] = useState<number | null>(null);

  // Save template modal
  const [savingTemplateAgent, setSavingTemplateAgent] = useState<Partial<ActiveAgent> | null>(null);

  // Agents lookup
  const agentA = useMemo(() => activeAgents.find(a => a.id === agentAId) || activeAgents[0], [activeAgents, agentAId]);
  const agentB = useMemo(() => activeAgents.find(a => a.id === agentBId) || activeAgents[1] || activeAgents[0], [activeAgents, agentBId]);

  // Live Metrics lookup (ground truth current state)
  const metricA = useMemo<AgentMetricItem>(() => {
    return performanceMetrics.agentMetrics.find(m => m.agentId === agentA?.id) || {
      agentId: agentA?.id || '',
      agentName: agentA?.name || 'Agent A',
      agentRole: agentA?.role || 'Role',
      tasksCompleted: 4,
      avgCompletionTimeMs: 1150,
      totalTokensUsed: 14200,
      promptTokens: 8600,
      completionTokens: 5600,
      tokensPerSec: 68.4,
      errorCount: 0
    };
  }, [performanceMetrics, agentA]);

  const metricB = useMemo<AgentMetricItem>(() => {
    return performanceMetrics.agentMetrics.find(m => m.agentId === agentB?.id) || {
      agentId: agentB?.id || '',
      agentName: agentB?.name || 'Agent B',
      agentRole: agentB?.role || 'Role',
      tasksCompleted: 3,
      avgCompletionTimeMs: 820,
      totalTokensUsed: 9800,
      promptTokens: 5200,
      completionTokens: 4600,
      tokensPerSec: 84.2,
      errorCount: 0
    };
  }, [performanceMetrics, agentB]);

  // Generate deterministic time-series sparkline data for both agents across simulation history
  const sparklineTimeSeries = useMemo(() => {
    const count = sparklinePointCount;
    const seedA = (agentA?.id?.charCodeAt(agentA.id.length - 1) || 1) * 7;
    const seedB = (agentB?.id?.charCodeAt(agentB.id.length - 1) || 2) * 11;
    const baseTokensPerTaskA = metricA.tasksCompleted > 0 ? Math.round(metricA.totalTokensUsed / metricA.tasksCompleted) : 2400;
    const baseTokensPerTaskB = metricB.tasksCompleted > 0 ? Math.round(metricB.totalTokensUsed / metricB.tasksCompleted) : 2100;
    
    return Array.from({ length: count }, (_, i) => {
      const turnLabel = i === count - 1 ? 'T-0 (Now)' : `T-${count - 1 - i}`;
      const timeOffsetSec = (count - 1 - i) * 12;
      const timeLabel = timeOffsetSec === 0 ? 'Latest' : `-${timeOffsetSec}s`;

      // 1. Latency (ms): realistic jitter around avgCompletionTimeMs
      const latWiggleA = Math.sin((i * 1.3) + seedA) * (metricA.avgCompletionTimeMs * 0.12) + (Math.cos(i * 0.8) * 35);
      const latWiggleB = Math.sin((i * 1.5) + seedB) * (metricB.avgCompletionTimeMs * 0.12) + (Math.cos(i * 0.7) * 30);
      const latencyA = Math.max(120, Math.round(metricA.avgCompletionTimeMs + latWiggleA));
      const latencyB = Math.max(120, Math.round(metricB.avgCompletionTimeMs + latWiggleB));

      // 2. Throughput (t/s): realistic jitter around tokensPerSec
      const tpsWiggleA = Math.cos((i * 1.1) + seedA) * (metricA.tokensPerSec * 0.08);
      const tpsWiggleB = Math.cos((i * 1.4) + seedB) * (metricB.tokensPerSec * 0.08);
      const throughputA = Math.max(10, parseFloat((metricA.tokensPerSec + tpsWiggleA).toFixed(1)));
      const throughputB = Math.max(10, parseFloat((metricB.tokensPerSec + tpsWiggleB).toFixed(1)));

      // 3. Tokens per task
      const tokWiggleA = Math.sin((i * 1.6) + seedA) * (baseTokensPerTaskA * 0.12);
      const tokWiggleB = Math.cos((i * 1.2) + seedB) * (baseTokensPerTaskB * 0.12);
      const tokensA = Math.max(200, Math.round(baseTokensPerTaskA + tokWiggleA));
      const tokensB = Math.max(200, Math.round(baseTokensPerTaskB + tokWiggleB));

      // 4. Reliability (%): 100% or small dips if errors
      const errDipA = metricA.errorCount > 0 && (i % 3 === 0) ? (metricA.errorCount * 5) : 0;
      const errDipB = metricB.errorCount > 0 && (i % 4 === 0) ? (metricB.errorCount * 5) : 0;
      const reliabilityA = Math.max(60, Math.min(100, Math.round(100 - errDipA)));
      const reliabilityB = Math.max(60, Math.min(100, Math.round(100 - errDipB)));

      return {
        turn: turnLabel,
        time: timeLabel,
        index: i,
        latencyA,
        latencyB,
        throughputA,
        throughputB,
        tokensA,
        tokensB,
        reliabilityA,
        reliabilityB
      };
    });
  }, [agentA, agentB, metricA, metricB, sparklinePointCount]);

  // Adjust selectedTimeIndex on point count changes
  useEffect(() => {
    setSelectedTimeIndex(prev => Math.min(prev, sparklineTimeSeries.length - 1));
  }, [sparklineTimeSeries.length]);

  // Comprehensive simulation historical snapshots for scrubber playback
  const simulationHistorySnapshots = useMemo(() => {
    const phases = [
      { name: 'Intent Ingest & Constraint Extraction', category: 'ingest' as const, icon: '🎯' },
      { name: 'Decomposition Lattice & Task DAG', category: 'decomp' as const, icon: '🧩' },
      { name: 'AST Spec Synthesis & Interface Contracts', category: 'spec' as const, icon: '📐' },
      { name: 'Deterministic Code Synthesis Sprint', category: 'craft' as const, icon: '⚡' },
      { name: 'Multi-Tier Assertion & Test Harness', category: 'audit' as const, icon: '🧪' },
      { name: 'OWASP Security & Boundary Gate', category: 'audit' as const, icon: '🛡️' },
      { name: 'Roundtable Consensus & Policy Vote', category: 'consensus' as const, icon: '🗳️' },
      { name: 'Live Runtime Telemetry & Stabilization', category: 'live' as const, icon: '🚀' }
    ];

    const agentAActions = [
      `Decomposing goal into verifiable milestone sub-tasks`,
      `Analyzing architectural constraints and resource budget`,
      `Generating schema interfaces and TypeScript typings`,
      `Synthesizing deterministic handler functions`,
      `Running unit test assertions and coverage analysis`,
      `Evaluating OWASP compliance and static security checks`,
      `Voting in Roundtable consensus verification`,
      `Monitoring runtime telemetry and execution throughput`
    ];

    const agentBActions = [
      `Parsing input invariants and boundary criteria`,
      `Building task dependency graph and worker pools`,
      `Validating interface contract compatibility`,
      `Executing code transpilation and type check`,
      `Fuzz-testing boundary invariants and edge cases`,
      `Auditing AST memory allocation patterns`,
      `Deliberating on risk score in Roundtable vote`,
      `Streaming live token generations to stdout`
    ];

    return sparklineTimeSeries.map((d, i) => {
      const isLatest = i === sparklineTimeSeries.length - 1;
      const phaseIdx = Math.min(phases.length - 1, Math.floor((i / (sparklineTimeSeries.length - 1 || 1)) * (phases.length - 1)));
      const phaseObj = phases[phaseIdx];
      
      const fraction = (i + 1) / sparklineTimeSeries.length;
      const promptTokA = Math.round(metricA.promptTokens * fraction);
      const compTokA = Math.round(metricA.completionTokens * fraction);
      const totalTokA = promptTokA + compTokA;

      const promptTokB = Math.round(metricB.promptTokens * fraction);
      const compTokB = Math.round(metricB.completionTokens * fraction);
      const totalTokB = promptTokB + compTokB;

      const tasksA = Math.max(1, Math.round(fraction * metricA.tasksCompleted));
      const tasksB = Math.max(1, Math.round(fraction * metricB.tasksCompleted));

      const errorsA = d.reliabilityA < 100 ? Math.max(1, Math.round(metricA.errorCount || 1)) : 0;
      const errorsB = d.reliabilityB < 100 ? Math.max(1, Math.round(metricB.errorCount || 1)) : 0;

      const actionA = agentAActions[phaseIdx % agentAActions.length];
      const actionB = agentBActions[phaseIdx % agentBActions.length];

      return {
        index: i,
        turnLabel: d.turn,
        timeLabel: d.time,
        timestamp: `T-${(sparklineTimeSeries.length - 1 - i) * 12}s`,
        phase: phaseObj.name,
        phaseCategory: phaseObj.category,
        phaseIcon: phaseObj.icon,
        isLatest,
        eventHeadline: isLatest ? 'Live Telemetry State' : `Step ${i + 1}/${sparklineTimeSeries.length}: ${phaseObj.name}`,
        agentAState: {
          agentId: agentA?.id || '',
          agentName: agentA?.name || 'Agent A',
          agentRole: agentA?.role || 'Role',
          tasksCompleted: tasksA,
          avgCompletionTimeMs: d.latencyA,
          totalTokensUsed: totalTokA,
          promptTokens: promptTokA,
          completionTokens: compTokA,
          tokensPerSec: d.throughputA,
          errorCount: errorsA,
          reliability: d.reliabilityA,
          action: actionA,
          cpuPct: Math.round(32 + Math.abs(Math.sin(i * 1.5)) * 28),
          memoryMb: Math.round(260 + (i * 22))
        },
        agentBState: {
          agentId: agentB?.id || '',
          agentName: agentB?.name || 'Agent B',
          agentRole: agentB?.role || 'Role',
          tasksCompleted: tasksB,
          avgCompletionTimeMs: d.latencyB,
          totalTokensUsed: totalTokB,
          promptTokens: promptTokB,
          completionTokens: compTokB,
          tokensPerSec: d.throughputB,
          errorCount: errorsB,
          reliability: d.reliabilityB,
          action: actionB,
          cpuPct: Math.round(38 + Math.abs(Math.cos(i * 1.3)) * 26),
          memoryMb: Math.round(290 + (i * 26))
        }
      };
    });
  }, [sparklineTimeSeries, metricA, metricB, agentA, agentB]);

  // Current active scrub snapshot
  const activeScrubIndex = Math.max(0, Math.min(simulationHistorySnapshots.length - 1, selectedTimeIndex));
  const currentSnapshot = simulationHistorySnapshots[activeScrubIndex] || simulationHistorySnapshots[simulationHistorySnapshots.length - 1];
  const isLiveMode = activeScrubIndex === simulationHistorySnapshots.length - 1;

  // Auto playback loop effect
  useEffect(() => {
    if (!isPlayingTimeline) return;
    const intervalMs = Math.max(250, Math.round(1200 / playbackSpeed));
    const timer = setInterval(() => {
      setSelectedTimeIndex(prev => {
        const next = prev + 1;
        if (next >= simulationHistorySnapshots.length) {
          if (isLooping) return 0;
          setIsPlayingTimeline(false);
          return simulationHistorySnapshots.length - 1;
        }
        return next;
      });
    }, intervalMs);
    return () => clearInterval(timer);
  }, [isPlayingTimeline, playbackSpeed, isLooping, simulationHistorySnapshots.length]);

  // Effective metrics for Agent A and Agent B (reactive to scrubber or live)
  const effectiveMetricA = useMemo<AgentMetricItem>(() => {
    if (isLiveMode) return metricA;
    return {
      agentId: agentA?.id || '',
      agentName: agentA?.name || 'Agent A',
      agentRole: agentA?.role || 'Role',
      tasksCompleted: currentSnapshot.agentAState.tasksCompleted,
      avgCompletionTimeMs: currentSnapshot.agentAState.avgCompletionTimeMs,
      totalTokensUsed: currentSnapshot.agentAState.totalTokensUsed,
      promptTokens: currentSnapshot.agentAState.promptTokens,
      completionTokens: currentSnapshot.agentAState.completionTokens,
      tokensPerSec: currentSnapshot.agentAState.tokensPerSec,
      errorCount: currentSnapshot.agentAState.errorCount
    };
  }, [isLiveMode, metricA, agentA, currentSnapshot]);

  const effectiveMetricB = useMemo<AgentMetricItem>(() => {
    if (isLiveMode) return metricB;
    return {
      agentId: agentB?.id || '',
      agentName: agentB?.name || 'Agent B',
      agentRole: agentB?.role || 'Role',
      tasksCompleted: currentSnapshot.agentBState.tasksCompleted,
      avgCompletionTimeMs: currentSnapshot.agentBState.avgCompletionTimeMs,
      totalTokensUsed: currentSnapshot.agentBState.totalTokensUsed,
      promptTokens: currentSnapshot.agentBState.promptTokens,
      completionTokens: currentSnapshot.agentBState.completionTokens,
      tokensPerSec: currentSnapshot.agentBState.tokensPerSec,
      errorCount: currentSnapshot.agentBState.errorCount
    };
  }, [isLiveMode, metricB, agentB, currentSnapshot]);

  // Swapping agents
  const handleSwap = () => {
    const temp = agentAId;
    setAgentAId(agentBId);
    setAgentBId(temp);
  };

  // Preset selection
  const handleApplyPreset = (preset: typeof COMPARISON_PRESETS[0]) => {
    const hasA = activeAgents.some(a => a.id === preset.idA);
    const hasB = activeAgents.some(a => a.id === preset.idB);
    if (hasA) setAgentAId(preset.idA);
    if (hasB) setAgentBId(preset.idB);
  };

  const getTempDescription = (temp: number) => {
    if (temp <= 0.2) return { text: 'Deterministic / High Precision', color: 'text-blue-400', badgeBg: 'bg-blue-950/80 text-blue-300 border-blue-800' };
    if (temp <= 0.5) return { text: 'Balanced / Reliable Execution', color: 'text-emerald-400', badgeBg: 'bg-emerald-950/80 text-emerald-300 border-emerald-800' };
    if (temp <= 0.8) return { text: 'Creative / Exploratory Synthesis', color: 'text-purple-400', badgeBg: 'bg-purple-950/80 text-purple-300 border-purple-800' };
    return { text: 'High Exploration / Experimental', color: 'text-amber-400', badgeBg: 'bg-amber-950/80 text-amber-300 border-amber-800' };
  };

  const copyToClipboard = (text: string, title: string) => {
    navigator.clipboard.writeText(text);
    addToast({
      title: '📋 Copied to Clipboard',
      message: `${title} copied successfully.`,
      type: 'info'
    });
  };

  // Comparative normalized benchmark data derived from active effective metrics
  const comparisonChartData = useMemo(() => {
    if (!agentA || !agentB) return [];

    const tempA = (agentA.temperature ?? 0.7) * 100;
    const tempB = (agentB.temperature ?? 0.7) * 100;

    const topPA = (agentA.topP ?? 0.9) * 100;
    const topPB = (agentB.topP ?? 0.9) * 100;

    const maxTokA = ((agentA.maxTokens ?? 4096) / 16384) * 100;
    const maxTokB = ((agentB.maxTokens ?? 4096) / 16384) * 100;

    // Invert speed so faster is higher score
    const speedScoreA = Math.max(10, Math.min(100, Math.round(100 - (effectiveMetricA.avgCompletionTimeMs / 2500) * 100)));
    const speedScoreB = Math.max(10, Math.min(100, Math.round(100 - (effectiveMetricB.avgCompletionTimeMs / 2500) * 100)));

    const throughputScoreA = Math.min(100, Math.round((effectiveMetricA.tokensPerSec / 120) * 100));
    const throughputScoreB = Math.min(100, Math.round((effectiveMetricB.tokensPerSec / 120) * 100));

    const promptLengthA = Math.min(100, Math.round(((agentA.systemPrompt?.length || 500) / 2000) * 100));
    const promptLengthB = Math.min(100, Math.round(((agentB.systemPrompt?.length || 500) / 2000) * 100));

    return [
      { metric: 'Creativity (Temp)', [agentA.name]: tempA, [agentB.name]: tempB, unit: '%' },
      { metric: 'Top-P Sampling', [agentA.name]: topPA, [agentB.name]: topPB, unit: '%' },
      { metric: 'Max Token Limit', [agentA.name]: maxTokA, [agentB.name]: maxTokB, unit: '%' },
      { metric: 'Execution Speed', [agentA.name]: speedScoreA, [agentB.name]: speedScoreB, unit: 'pts' },
      { metric: 'Throughput (t/s)', [agentA.name]: throughputScoreA, [agentB.name]: throughputScoreB, unit: 'pts' },
      { metric: 'Prompt Depth', [agentA.name]: promptLengthA, [agentB.name]: promptLengthB, unit: 'pts' },
    ];
  }, [agentA, agentB, effectiveMetricA, effectiveMetricB]);

  // Delta calculations from effective metrics
  const tempDelta = ((agentA?.temperature ?? 0.7) - (agentB?.temperature ?? 0.7)).toFixed(2);
  const latencyDeltaMs = effectiveMetricA.avgCompletionTimeMs - effectiveMetricB.avgCompletionTimeMs;
  const latencyPercent = effectiveMetricB.avgCompletionTimeMs > 0 
    ? Math.abs(Math.round(((effectiveMetricA.avgCompletionTimeMs - effectiveMetricB.avgCompletionTimeMs) / effectiveMetricB.avgCompletionTimeMs) * 100))
    : 0;

  const tpsDelta = (effectiveMetricA.tokensPerSec - effectiveMetricB.tokensPerSec).toFixed(1);
  const tpsPercent = effectiveMetricB.tokensPerSec > 0
    ? Math.abs(Math.round(((effectiveMetricA.tokensPerSec - effectiveMetricB.tokensPerSec) / effectiveMetricB.tokensPerSec) * 100))
    : 0;

  // Error rate calculations from effective metrics
  const errorRateA = (effectiveMetricA.tasksCompleted + effectiveMetricA.errorCount > 0)
    ? ((effectiveMetricA.errorCount / (effectiveMetricA.tasksCompleted + effectiveMetricA.errorCount)) * 100).toFixed(1)
    : '0.0';
  const errorRateB = (effectiveMetricB.tasksCompleted + effectiveMetricB.errorCount > 0)
    ? ((effectiveMetricB.errorCount / (effectiveMetricB.tasksCompleted + effectiveMetricB.errorCount)) * 100).toFixed(1)
    : '0.0';
  const errorRateDiff = Math.abs(parseFloat(errorRateA) - parseFloat(errorRateB)).toFixed(1);

  // Tokens per task efficiency from effective metrics
  const tokensPerTaskA = effectiveMetricA.tasksCompleted > 0 ? Math.round(effectiveMetricA.totalTokensUsed / effectiveMetricA.tasksCompleted) : 0;
  const tokensPerTaskB = effectiveMetricB.tasksCompleted > 0 ? Math.round(effectiveMetricB.totalTokensUsed / effectiveMetricB.tasksCompleted) : 0;
  const tokenPerTaskDelta = Math.abs(tokensPerTaskA - tokensPerTaskB);

  // SLA assessment
  const isALatencyWinner = effectiveMetricA.avgCompletionTimeMs < effectiveMetricB.avgCompletionTimeMs;
  const isBLatencyWinner = effectiveMetricB.avgCompletionTimeMs < effectiveMetricA.avgCompletionTimeMs;
  const isAThroughputWinner = effectiveMetricA.tokensPerSec > effectiveMetricB.tokensPerSec;
  const isBThroughputWinner = effectiveMetricB.tokensPerSec > effectiveMetricA.tokensPerSec;
  const isAErrorWinner = effectiveMetricA.errorCount < effectiveMetricB.errorCount;
  const isBErrorWinner = effectiveMetricB.errorCount < effectiveMetricA.errorCount;

  // Mini sparkline histories for individual metric dials
  const latencySparklineA = useMemo(() => sparklineTimeSeries.map(d => d.latencyA), [sparklineTimeSeries]);
  const latencySparklineB = useMemo(() => sparklineTimeSeries.map(d => d.latencyB), [sparklineTimeSeries]);
  const throughputSparklineA = useMemo(() => sparklineTimeSeries.map(d => d.throughputA), [sparklineTimeSeries]);
  const throughputSparklineB = useMemo(() => sparklineTimeSeries.map(d => d.throughputB), [sparklineTimeSeries]);
  const tokenSparklineA = useMemo(() => sparklineTimeSeries.map(d => d.tokensA), [sparklineTimeSeries]);
  const tokenSparklineB = useMemo(() => sparklineTimeSeries.map(d => d.tokensB), [sparklineTimeSeries]);
  const errorSparklineA = useMemo(() => sparklineTimeSeries.map(d => d.reliabilityA), [sparklineTimeSeries]);
  const errorSparklineB = useMemo(() => sparklineTimeSeries.map(d => d.reliabilityB), [sparklineTimeSeries]);

  // Selected metric sparkline configuration & statistical analysis
  const sparklineConfig = useMemo(() => {
    switch (selectedSparklineMetric) {
      case 'latency':
        return {
          title: 'Latency Response Time (ms)',
          description: 'Turn-by-turn execution latency SLA and response stability',
          unit: 'ms',
          keyA: 'latencyA',
          keyB: 'latencyB',
          slaTarget: 1000,
          slaLabel: '1000ms SLA Target',
          lowerIsBetter: true,
          badgeColor: 'text-blue-300 bg-blue-950/80 border-blue-800',
          formatValue: (v: number) => `${v}ms`
        };
      case 'throughput':
        return {
          title: 'Generation Throughput Velocity (t/s)',
          description: 'Streaming token generation speed and computational bandwidth',
          unit: 't/s',
          keyA: 'throughputA',
          keyB: 'throughputB',
          slaTarget: 100,
          slaLabel: '100 t/s High-Perf SLA',
          lowerIsBetter: false,
          badgeColor: 'text-amber-300 bg-amber-950/80 border-amber-800',
          formatValue: (v: number) => `${v} t/s`
        };
      case 'tokens':
        return {
          title: 'Token Economy & Context Footprint (tok)',
          description: 'Tokens consumed per invocation and prompt efficiency',
          unit: 'tok',
          keyA: 'tokensA',
          keyB: 'tokensB',
          slaTarget: 2500,
          slaLabel: '2500 tok Budget Ceiling',
          lowerIsBetter: true,
          badgeColor: 'text-cyan-300 bg-cyan-950/80 border-cyan-800',
          formatValue: (v: number) => `${v} tok`
        };
      case 'reliability':
        return {
          title: 'Reliability & Confidence Index (%)',
          description: 'Execution consistency, schema validation score, and zero-error uptime',
          unit: '%',
          keyA: 'reliabilityA',
          keyB: 'reliabilityB',
          slaTarget: 95,
          slaLabel: '95% Enterprise SLA',
          lowerIsBetter: false,
          badgeColor: 'text-emerald-300 bg-emerald-950/80 border-emerald-800',
          formatValue: (v: number) => `${v}%`
        };
    }
  }, [selectedSparklineMetric]);

  // Statistical calculations over the current sparkline window
  const sparklineStats = useMemo(() => {
    const valsA = sparklineTimeSeries.map(d => Number((d as any)[sparklineConfig.keyA]));
    const valsB = sparklineTimeSeries.map(d => Number((d as any)[sparklineConfig.keyB]));

    const minA = Math.min(...valsA);
    const maxA = Math.max(...valsA);
    const avgA = Math.round(valsA.reduce((acc, v) => acc + v, 0) / valsA.length);
    const firstA = valsA[0] || 1;
    const lastA = valsA[valsA.length - 1] || 1;
    const trendDeltaA = Math.round(((lastA - firstA) / firstA) * 100);
    const jitterA = Math.round(((maxA - minA) / (avgA || 1)) * 100);

    const minB = Math.min(...valsB);
    const maxB = Math.max(...valsB);
    const avgB = Math.round(valsB.reduce((acc, v) => acc + v, 0) / valsB.length);
    const firstB = valsB[0] || 1;
    const lastB = valsB[valsB.length - 1] || 1;
    const trendDeltaB = Math.round(((lastB - firstB) / firstB) * 100);
    const jitterB = Math.round(((maxB - minB) / (avgB || 1)) * 100);

    const isAWinner = sparklineConfig.lowerIsBetter ? avgA < avgB : avgA > avgB;
    const isBWinner = sparklineConfig.lowerIsBetter ? avgB < avgA : avgB > avgA;
    const deltaDiff = Math.abs(avgA - avgB);
    const deltaPct = Math.round((deltaDiff / ((sparklineConfig.lowerIsBetter ? Math.max(avgA, avgB) : Math.min(avgA, avgB)) || 1)) * 100);

    return {
      minA, maxA, avgA, lastA, trendDeltaA, jitterA,
      minB, maxB, avgB, lastB, trendDeltaB, jitterB,
      isAWinner, isBWinner, deltaDiff, deltaPct
    };
  }, [sparklineTimeSeries, sparklineConfig]);

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-900 text-gray-100 overflow-hidden select-none">
      
      {/* Top Controls Bar */}
      <div className="px-4 py-3 bg-gray-950/90 border-b border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        
        {/* Preset Selector */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Sliders className="w-3 h-3 text-purple-400" />
            <span>Compare Archetypes:</span>
          </span>

          <div className="flex items-center space-x-1.5 shrink-0">
            {COMPARISON_PRESETS.map(preset => {
              const isActive = (agentAId === preset.idA && agentBId === preset.idB) || (agentAId === preset.idB && agentBId === preset.idA);
              return (
                <button
                  key={preset.label}
                  onClick={() => handleApplyPreset(preset)}
                  className={cn(
                    "text-xs px-2.5 py-1 rounded-md transition-all font-medium border",
                    isActive
                      ? "bg-purple-950/80 text-purple-200 border-purple-700/80 shadow-sm"
                      : "bg-gray-900 text-gray-400 hover:text-gray-200 border-gray-800 hover:bg-gray-800/60"
                  )}
                  title={preset.description}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Global Toolbar Options */}
        <div className="flex items-center space-x-2 self-end sm:self-auto shrink-0">
          {/* Diff Highlighter Toggle */}
          <button
            onClick={() => setHighlightDiffs(!highlightDiffs)}
            className={cn(
              "text-xs px-2.5 py-1 rounded-md border font-medium flex items-center space-x-1.5 transition-colors",
              highlightDiffs
                ? "bg-purple-950/70 text-purple-300 border-purple-700"
                : "bg-gray-900 text-gray-400 border-gray-800 hover:text-gray-300"
            )}
            title="Highlight fields that differ between the two agents"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Highlight Diffs</span>
          </button>

          {/* Swap Button */}
          <button
            onClick={handleSwap}
            className="text-xs px-2.5 py-1 bg-gray-900 hover:bg-gray-800 text-gray-300 border border-gray-800 rounded-md font-medium flex items-center space-x-1.5 transition-colors"
            title="Swap Agent A and Agent B columns"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-cyan-400" />
            <span>Swap Columns</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
              title="Close split comparison view"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Split-View Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* Side-by-Side Agent Header Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Agent A Card Header */}
          <div className="bg-gray-950/80 border border-purple-900/40 rounded-xl p-3.5 space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-purple-400 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                <span>Primary Agent (A)</span>
              </span>

              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => openAgentConfigModal(agentA?.id)}
                  className="text-[11px] px-2 py-0.5 bg-gray-900 hover:bg-gray-800 text-purple-300 border border-gray-800 rounded font-medium transition-colors"
                  title="Configure this agent's parameters"
                >
                  Configure
                </button>
                <button
                  onClick={() => selectAgentForLogs(agentA?.id)}
                  className="text-[11px] px-2 py-0.5 bg-gray-900 hover:bg-gray-800 text-gray-300 border border-gray-800 rounded font-medium transition-colors"
                  title="View agent execution logs"
                >
                  Logs
                </button>
              </div>
            </div>

            {/* Selector Dropdown */}
            <div className="flex items-center space-x-3">
              {agentA?.avatarUrl ? (
                <img 
                  src={agentA.avatarUrl} 
                  alt={agentA.name} 
                  referrerPolicy="no-referrer"
                  className="w-11 h-11 rounded-full object-cover border-2 border-purple-500/60 shrink-0" 
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-purple-950 border border-purple-800 flex items-center justify-center font-bold text-sm text-purple-300 shrink-0">
                  {agentA?.name?.[0] || 'A'}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <select
                  value={agentAId}
                  onChange={e => setAgentAId(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700/80 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-100 focus:outline-none focus:border-purple-500"
                >
                  {activeAgents.map(ag => (
                    <option key={ag.id} value={ag.id}>
                      {ag.name} — {ag.role} ({ag.flavor === 'harness' ? 'Harness' : 'Leased'})
                    </option>
                  ))}
                </select>

                <div className="flex items-center space-x-2 mt-1.5">
                  <span className={cn(
                    "text-[10px] font-semibold px-2 py-0.5 rounded border",
                    agentA?.flavor === 'harness'
                      ? "bg-amber-950/80 text-amber-300 border-amber-800"
                      : "bg-blue-950/80 text-blue-300 border-blue-800"
                  )}>
                    {agentA?.flavor === 'harness' ? 'Harness Role' : 'Leased Role'}
                  </span>

                  <span className="text-[10px] font-mono text-gray-400 bg-gray-900 px-1.5 py-0.5 rounded border border-gray-800 truncate">
                    {agentA?.model || 'qwen2.5-coder:latest'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Agent B Card Header */}
          <div className="bg-gray-950/80 border border-cyan-900/40 rounded-xl p-3.5 space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-cyan-400 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                <span>Comparison Target (B)</span>
              </span>

              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => openAgentConfigModal(agentB?.id)}
                  className="text-[11px] px-2 py-0.5 bg-gray-900 hover:bg-gray-800 text-cyan-300 border border-gray-800 rounded font-medium transition-colors"
                  title="Configure this agent's parameters"
                >
                  Configure
                </button>
                <button
                  onClick={() => selectAgentForLogs(agentB?.id)}
                  className="text-[11px] px-2 py-0.5 bg-gray-900 hover:bg-gray-800 text-gray-300 border border-gray-800 rounded font-medium transition-colors"
                  title="View agent execution logs"
                >
                  Logs
                </button>
              </div>
            </div>

            {/* Selector Dropdown */}
            <div className="flex items-center space-x-3">
              {agentB?.avatarUrl ? (
                <img 
                  src={agentB.avatarUrl} 
                  alt={agentB.name} 
                  referrerPolicy="no-referrer"
                  className="w-11 h-11 rounded-full object-cover border-2 border-cyan-500/60 shrink-0" 
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-cyan-950 border border-cyan-800 flex items-center justify-center font-bold text-sm text-cyan-300 shrink-0">
                  {agentB?.name?.[0] || 'B'}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <select
                  value={agentBId}
                  onChange={e => setAgentBId(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700/80 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-100 focus:outline-none focus:border-cyan-500"
                >
                  {activeAgents.map(ag => (
                    <option key={ag.id} value={ag.id}>
                      {ag.name} — {ag.role} ({ag.flavor === 'harness' ? 'Harness' : 'Leased'})
                    </option>
                  ))}
                </select>

                <div className="flex items-center space-x-2 mt-1.5">
                  <span className={cn(
                    "text-[10px] font-semibold px-2 py-0.5 rounded border",
                    agentB?.flavor === 'harness'
                      ? "bg-amber-950/80 text-amber-300 border-amber-800"
                      : "bg-blue-950/80 text-blue-300 border-blue-800"
                  )}>
                    {agentB?.flavor === 'harness' ? 'Harness Role' : 'Leased Role'}
                  </span>

                  <span className="text-[10px] font-mono text-gray-400 bg-gray-900 px-1.5 py-0.5 rounded border border-gray-800 truncate">
                    {agentB?.model || 'qwen2.5-coder:latest'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Simulation Historical Time-Point Scrubber & Telemetry Evolution Bar */}
        <div className="bg-gradient-to-r from-purple-950/40 via-gray-950/90 to-cyan-950/40 border border-purple-900/50 rounded-xl p-4 space-y-3.5 shadow-lg relative overflow-hidden">
          
          {/* Header & Status Indicator */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-gray-800/80">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-lg bg-purple-950/90 border border-purple-700 text-purple-300 shadow-sm flex items-center justify-center">
                <History className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-100 flex items-center gap-1.5">
                    <span>Simulation Evolution Scrubber</span>
                    <span className="text-[10px] text-purple-400 font-mono font-normal">
                      (Historical Time-Series)
                    </span>
                  </h3>
                  
                  {isLiveMode ? (
                    <span className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-950/90 text-emerald-300 border border-emerald-700 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      <span>🔴 LIVE TELEMETRY</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-amber-950/90 text-amber-300 border border-amber-700 shadow-sm animate-pulse">
                      <Timer className="w-3 h-3 text-amber-400" />
                      <span>⏳ HISTORICAL SNAPSHOT ({currentSnapshot.turnLabel})</span>
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-400">
                  Scrub through recorded simulation checkpoints to inspect how latency, tokens, reliability, and actions evolved over time.
                </p>
              </div>
            </div>

            {/* Quick Actions & Live Reset */}
            <div className="flex items-center space-x-2 self-end sm:self-auto">
              {!isLiveMode && (
                <button
                  onClick={() => {
                    setSelectedTimeIndex(simulationHistorySnapshots.length - 1);
                    if (isPlayingTimeline) setIsPlayingTimeline(false);
                    addToast({
                      title: '⚡ Jumped to Live State',
                      message: 'Metrics view restored to real-time active telemetry.',
                      type: 'info'
                    });
                  }}
                  className="px-2.5 py-1 text-xs font-semibold bg-emerald-950/90 hover:bg-emerald-900 text-emerald-200 border border-emerald-700 rounded-lg flex items-center space-x-1.5 transition-all shadow-sm"
                >
                  <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span>Return to Live (T-0)</span>
                </button>
              )}

              <div className="text-[11px] font-mono text-gray-400 bg-gray-900/90 px-2.5 py-1 rounded-lg border border-gray-800 flex items-center gap-1.5">
                <span className="text-gray-500">Step:</span>
                <span className="text-purple-300 font-bold">{activeScrubIndex + 1}</span>
                <span className="text-gray-600">/</span>
                <span>{simulationHistorySnapshots.length}</span>
              </div>
            </div>
          </div>

          {/* Scrubber Playback Bar & Range Slider */}
          <div className="space-y-2.5">
            {/* Playback Controls & Preset Jump Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              
              {/* Left Playback Toolbar */}
              <div className="flex items-center space-x-1.5 bg-gray-900/90 p-1 rounded-lg border border-gray-800">
                {/* Step Back */}
                <button
                  onClick={() => {
                    setSelectedTimeIndex(prev => Math.max(0, prev - 1));
                    if (isPlayingTimeline) setIsPlayingTimeline(false);
                  }}
                  disabled={activeScrubIndex === 0}
                  className="p-1.5 text-gray-400 hover:text-gray-100 disabled:opacity-40 disabled:hover:text-gray-400 rounded hover:bg-gray-800 transition-colors"
                  title="Step Backward (Previous checkpoint)"
                >
                  <SkipBack className="w-3.5 h-3.5" />
                </button>

                {/* Play / Pause Toggle */}
                <button
                  onClick={() => setIsPlayingTimeline(!isPlayingTimeline)}
                  className={cn(
                    "px-3 py-1 text-xs rounded-md font-semibold flex items-center space-x-1.5 transition-all shadow-sm",
                    isPlayingTimeline
                      ? "bg-amber-600 hover:bg-amber-500 text-white"
                      : "bg-purple-600 hover:bg-purple-500 text-white"
                  )}
                  title={isPlayingTimeline ? "Pause historical timeline playback" : "Play timeline simulation from current checkpoint"}
                >
                  {isPlayingTimeline ? (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{activeScrubIndex === simulationHistorySnapshots.length - 1 ? 'Replay' : 'Play'}</span>
                    </>
                  )}
                </button>

                {/* Step Forward */}
                <button
                  onClick={() => {
                    setSelectedTimeIndex(prev => Math.min(simulationHistorySnapshots.length - 1, prev + 1));
                    if (isPlayingTimeline) setIsPlayingTimeline(false);
                  }}
                  disabled={activeScrubIndex === simulationHistorySnapshots.length - 1}
                  className="p-1.5 text-gray-400 hover:text-gray-100 disabled:opacity-40 disabled:hover:text-gray-400 rounded hover:bg-gray-800 transition-colors"
                  title="Step Forward (Next checkpoint)"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                </button>

                <div className="h-4 w-px bg-gray-800 mx-1" />

                {/* Speed Selector */}
                <div className="flex items-center space-x-1 text-[10px]">
                  {[0.5, 1, 2].map(speed => (
                    <button
                      key={speed}
                      onClick={() => setPlaybackSpeed(speed)}
                      className={cn(
                        "px-1.5 py-0.5 rounded font-mono transition-colors",
                        playbackSpeed === speed
                          ? "bg-purple-950 text-purple-300 font-bold border border-purple-800"
                          : "text-gray-400 hover:text-gray-200"
                      )}
                      title={`Playback speed: ${speed}x`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>

                <div className="h-4 w-px bg-gray-800 mx-1" />

                {/* Loop Toggle */}
                <button
                  onClick={() => setIsLooping(!isLooping)}
                  className={cn(
                    "p-1.5 rounded transition-colors text-[10px] flex items-center space-x-1",
                    isLooping
                      ? "text-purple-300 bg-purple-950/80 border border-purple-800"
                      : "text-gray-500 hover:text-gray-300"
                  )}
                  title={isLooping ? "Looping enabled: auto-repeats on finish" : "Looping disabled"}
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>

              {/* Preset Milestone Jump Buttons */}
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">
                  Jump to:
                </span>
                {[
                  { label: 'Genesis (T-0)', idx: 0 },
                  { label: 'Decomposition', idx: Math.floor((simulationHistorySnapshots.length - 1) * 0.25) },
                  { label: 'Code Synthesis', idx: Math.floor((simulationHistorySnapshots.length - 1) * 0.5) },
                  { label: 'Consensus Gate', idx: Math.floor((simulationHistorySnapshots.length - 1) * 0.75) },
                  { label: 'Latest (Live)', idx: simulationHistorySnapshots.length - 1 }
                ].map(preset => (
                  <button
                    key={preset.label}
                    onClick={() => {
                      setSelectedTimeIndex(preset.idx);
                      if (isPlayingTimeline) setIsPlayingTimeline(false);
                    }}
                    className={cn(
                      "text-[10px] px-2 py-1 rounded-md font-mono transition-all border shrink-0",
                      activeScrubIndex === preset.idx
                        ? "bg-purple-950 text-purple-200 border-purple-700 font-bold shadow-sm"
                        : "bg-gray-900/80 text-gray-400 hover:text-gray-200 border-gray-800 hover:bg-gray-800/80"
                    )}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Slider Track with Glowing Cursor and Progress Bar */}
            <div className="relative pt-2 pb-1">
              <div className="relative flex items-center">
                <input
                  type="range"
                  min={0}
                  max={simulationHistorySnapshots.length - 1}
                  step={1}
                  value={activeScrubIndex}
                  onChange={(e) => {
                    setSelectedTimeIndex(Number(e.target.value));
                    if (isPlayingTimeline) setIsPlayingTimeline(false);
                  }}
                  className="w-full h-2.5 bg-gray-800/90 rounded-lg appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400 focus:outline-none transition-all"
                  style={{
                    background: `linear-gradient(to right, #a855f7 0%, #06b6d4 ${(activeScrubIndex / (simulationHistorySnapshots.length - 1 || 1)) * 100}%, #1f2937 ${(activeScrubIndex / (simulationHistorySnapshots.length - 1 || 1)) * 100}%, #1f2937 100%)`
                  }}
                />
              </div>

              {/* Tick Markers along the track */}
              <div className="flex justify-between items-center px-1 pt-1.5 text-[9px] font-mono text-gray-500">
                {simulationHistorySnapshots.map((snap, i) => {
                  const isSelected = i === activeScrubIndex;
                  return (
                    <button
                      key={snap.turnLabel}
                      onClick={() => {
                        setSelectedTimeIndex(i);
                        if (isPlayingTimeline) setIsPlayingTimeline(false);
                      }}
                      className={cn(
                        "flex flex-col items-center group transition-colors",
                        isSelected ? "text-purple-300 font-bold" : "hover:text-gray-300"
                      )}
                    >
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full transition-all mb-0.5",
                        isSelected 
                          ? "w-2.5 h-2.5 bg-purple-400 ring-2 ring-purple-500/50 shadow-md" 
                          : i === simulationHistorySnapshots.length - 1 
                          ? "bg-cyan-500" 
                          : "bg-gray-700 group-hover:bg-gray-500"
                      )} />
                      <span className={cn(
                        "hidden sm:inline-block",
                        i === 0 || i === simulationHistorySnapshots.length - 1 || i % 3 === 0 ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      )}>
                        {snap.turnLabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Current Historical Snapshot Context HUD */}
          <div className="bg-gray-900/90 border border-gray-800 rounded-xl p-3 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <span className="text-base">{currentSnapshot.phaseIcon}</span>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-gray-200">
                      {currentSnapshot.eventHeadline}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-purple-950 text-purple-300 border border-purple-800">
                      {currentSnapshot.timestamp} ({currentSnapshot.timeLabel})
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono">
                    Phase: {currentSnapshot.phase}
                  </span>
                </div>
              </div>

              {/* Delta vs Live state indicator */}
              <div className="flex items-center space-x-2 text-[10px] font-mono">
                <span className="text-gray-500">Live Delta:</span>
                <span className={cn(
                  "px-2 py-0.5 rounded border font-semibold",
                  effectiveMetricA.avgCompletionTimeMs <= metricA.avgCompletionTimeMs
                    ? "bg-emerald-950/80 text-emerald-300 border-emerald-800"
                    : "bg-rose-950/80 text-rose-300 border-rose-800"
                )}>
                  A: {effectiveMetricA.avgCompletionTimeMs}ms ({effectiveMetricA.avgCompletionTimeMs - metricA.avgCompletionTimeMs >= 0 ? '+' : ''}{effectiveMetricA.avgCompletionTimeMs - metricA.avgCompletionTimeMs}ms vs Live)
                </span>
                <span className={cn(
                  "px-2 py-0.5 rounded border font-semibold",
                  effectiveMetricB.avgCompletionTimeMs <= metricB.avgCompletionTimeMs
                    ? "bg-emerald-950/80 text-emerald-300 border-emerald-800"
                    : "bg-rose-950/80 text-rose-300 border-rose-800"
                )}>
                  B: {effectiveMetricB.avgCompletionTimeMs}ms ({effectiveMetricB.avgCompletionTimeMs - metricB.avgCompletionTimeMs >= 0 ? '+' : ''}{effectiveMetricB.avgCompletionTimeMs - metricB.avgCompletionTimeMs}ms vs Live)
                </span>
              </div>
            </div>

            {/* Active Micro Actions for Agent A and Agent B at this precise timestamp */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-2 border-t border-gray-800/80">
              <div className="p-2 rounded-lg bg-gray-950/80 border border-purple-900/40 text-[11px] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-purple-300 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    <span>{agentA?.name} at {currentSnapshot.turnLabel}</span>
                  </span>
                  <div className="flex items-center space-x-2 text-[10px] font-mono text-gray-400">
                    <span>CPU: {currentSnapshot.agentAState.cpuPct}%</span>
                    <span>RAM: {currentSnapshot.agentAState.memoryMb}MB</span>
                  </div>
                </div>
                <p className="text-gray-300 font-mono text-[10px] italic">
                  "{currentSnapshot.agentAState.action}"
                </p>
                <div className="flex items-center space-x-3 text-[10px] font-mono text-gray-400 pt-0.5">
                  <span>Latency: <strong className="text-blue-300">{currentSnapshot.agentAState.avgCompletionTimeMs}ms</strong></span>
                  <span>Throughput: <strong className="text-amber-300">{currentSnapshot.agentAState.tokensPerSec} t/s</strong></span>
                  <span>Tokens: <strong className="text-cyan-300">{currentSnapshot.agentAState.totalTokensUsed.toLocaleString()} tok</strong></span>
                </div>
              </div>

              <div className="p-2 rounded-lg bg-gray-950/80 border border-cyan-900/40 text-[11px] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-cyan-300 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    <span>{agentB?.name} at {currentSnapshot.turnLabel}</span>
                  </span>
                  <div className="flex items-center space-x-2 text-[10px] font-mono text-gray-400">
                    <span>CPU: {currentSnapshot.agentBState.cpuPct}%</span>
                    <span>RAM: {currentSnapshot.agentBState.memoryMb}MB</span>
                  </div>
                </div>
                <p className="text-gray-300 font-mono text-[10px] italic">
                  "{currentSnapshot.agentBState.action}"
                </p>
                <div className="flex items-center space-x-3 text-[10px] font-mono text-gray-400 pt-0.5">
                  <span>Latency: <strong className="text-blue-300">{currentSnapshot.agentBState.avgCompletionTimeMs}ms</strong></span>
                  <span>Throughput: <strong className="text-amber-300">{currentSnapshot.agentBState.tokensPerSec} t/s</strong></span>
                  <span>Tokens: <strong className="text-cyan-300">{currentSnapshot.agentBState.totalTokensUsed.toLocaleString()} tok</strong></span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Top Executive Performance Differences & Delta Badges */}
        <div className="bg-gray-950/90 border border-gray-800/90 rounded-xl p-3.5 space-y-2.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-gray-400 flex items-center space-x-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>Executive Performance Comparison & SLA Delta</span>
            </span>
            <span className="text-[10px] text-gray-500 font-mono">
              Auto-Evaluated from Runtime Telemetry {isLiveMode ? '(Live)' : `(${currentSnapshot.turnLabel})`}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Latency Delta Badge */}
            <motion.div 
              layout
              className={cn(
                "p-2.5 rounded-lg border flex flex-col justify-between space-y-1 transition-colors duration-300",
                isBLatencyWinner
                  ? "bg-emerald-950/30 border-emerald-800/80 text-emerald-300"
                  : isALatencyWinner
                  ? "bg-purple-950/30 border-purple-800/80 text-purple-300"
                  : "bg-gray-900/80 border-gray-800 text-gray-300"
              )}
            >
              <span className="text-[10px] text-gray-400 font-medium flex items-center space-x-1">
                <Clock className="w-3 h-3 text-blue-400" />
                <span>Latency Delta</span>
              </span>
              <div className="flex items-baseline justify-between">
                <AnimatedValue
                  value={Math.abs(latencyDeltaMs)}
                  unit="ms diff"
                  className="text-xs font-bold font-mono inline-block"
                />
                <AnimatedBadge
                  badgeKey={`${isBLatencyWinner}-${isALatencyWinner}-${latencyPercent}`}
                  className={cn(
                    "text-[9px] px-1.5 py-0.5 rounded font-bold font-mono border inline-block",
                    isBLatencyWinner
                      ? "bg-emerald-900/70 text-emerald-200 border-emerald-700"
                      : isALatencyWinner
                      ? "bg-purple-900/70 text-purple-200 border-purple-700"
                      : "bg-gray-800 text-gray-400 border-gray-700"
                  )}
                >
                  {isBLatencyWinner ? `${agentB?.name} Faster ⚡` : isALatencyWinner ? `${agentA?.name} Faster ⚡` : 'Parity'}
                </AnimatedBadge>
              </div>
              <span className="text-[9px] text-gray-400 font-mono">
                {isBLatencyWinner 
                  ? `${agentB?.name} is ${latencyPercent}% faster (${effectiveMetricB.avgCompletionTimeMs}ms vs ${effectiveMetricA.avgCompletionTimeMs}ms)`
                  : isALatencyWinner
                  ? `${agentA?.name} is ${latencyPercent}% faster (${effectiveMetricA.avgCompletionTimeMs}ms vs ${effectiveMetricB.avgCompletionTimeMs}ms)`
                  : 'Identical response latency'}
              </span>
            </motion.div>

            {/* Error Rate & Reliability Badge */}
            <motion.div 
              layout
              className={cn(
                "p-2.5 rounded-lg border flex flex-col justify-between space-y-1 transition-colors duration-300",
                effectiveMetricA.errorCount === 0 && effectiveMetricB.errorCount === 0
                  ? "bg-emerald-950/30 border-emerald-800/80 text-emerald-300"
                  : isAErrorWinner
                  ? "bg-emerald-950/30 border-emerald-800/80 text-emerald-300"
                  : isBErrorWinner
                  ? "bg-cyan-950/30 border-cyan-800/80 text-cyan-300"
                  : "bg-rose-950/30 border-rose-800/80 text-rose-300"
              )}
            >
              <span className="text-[10px] text-gray-400 font-medium flex items-center space-x-1">
                <ShieldAlert className="w-3 h-3 text-emerald-400" />
                <span>Error Rate Delta</span>
              </span>
              <div className="flex items-baseline justify-between">
                <AnimatedValue
                  value={errorRateDiff}
                  unit="% diff"
                  className="text-xs font-bold font-mono inline-block"
                />
                <AnimatedBadge
                  badgeKey={`${isAErrorWinner}-${isBErrorWinner}-${effectiveMetricA.errorCount}-${effectiveMetricB.errorCount}`}
                  className={cn(
                    "text-[9px] px-1.5 py-0.5 rounded font-bold font-mono border inline-block",
                    effectiveMetricA.errorCount === 0 && effectiveMetricB.errorCount === 0
                      ? "bg-emerald-900/70 text-emerald-200 border-emerald-700"
                      : isAErrorWinner
                      ? "bg-purple-900/70 text-purple-200 border-purple-700"
                      : isBErrorWinner
                      ? "bg-cyan-900/70 text-cyan-200 border-cyan-700"
                      : "bg-rose-900/70 text-rose-200 border-rose-700"
                  )}
                >
                  {effectiveMetricA.errorCount === 0 && effectiveMetricB.errorCount === 0
                    ? '0.0% Clean 🛡️'
                    : isAErrorWinner
                    ? `${agentA?.name} Lower Risk`
                    : isBErrorWinner
                    ? `${agentB?.name} Lower Risk`
                    : 'Equal Errors'}
                </AnimatedBadge>
              </div>
              <span className="text-[9px] text-gray-400 font-mono">
                {effectiveMetricA.errorCount === 0 && effectiveMetricB.errorCount === 0
                  ? 'Both agents maintain 100% zero-error SLA'
                  : `${agentA?.name}: ${errorRateA}% err vs ${agentB?.name}: ${errorRateB}% err`}
              </span>
            </motion.div>

            {/* Throughput Delta Badge */}
            <motion.div 
              layout
              className={cn(
                "p-2.5 rounded-lg border flex flex-col justify-between space-y-1 transition-colors duration-300",
                isBThroughputWinner
                  ? "bg-cyan-950/30 border-cyan-800/80 text-cyan-300"
                  : isAThroughputWinner
                  ? "bg-purple-950/30 border-purple-800/80 text-purple-300"
                  : "bg-gray-900/80 border-gray-800 text-gray-300"
              )}
            >
              <span className="text-[10px] text-gray-400 font-medium flex items-center space-x-1">
                <Zap className="w-3 h-3 text-amber-400" />
                <span>Throughput Delta</span>
              </span>
              <div className="flex items-baseline justify-between">
                <AnimatedValue
                  value={Math.abs(parseFloat(tpsDelta))}
                  unit=" t/s diff"
                  className="text-xs font-bold font-mono text-amber-300 inline-block"
                />
                <AnimatedBadge
                  badgeKey={`${isBThroughputWinner}-${isAThroughputWinner}-${tpsPercent}`}
                  className={cn(
                    "text-[9px] px-1.5 py-0.5 rounded font-bold font-mono border inline-block",
                    isBThroughputWinner
                      ? "bg-cyan-900/70 text-cyan-200 border-cyan-700"
                      : isAThroughputWinner
                      ? "bg-purple-900/70 text-purple-200 border-purple-700"
                      : "bg-gray-800 text-gray-400 border-gray-700"
                  )}
                >
                  {isBThroughputWinner ? `+${tpsPercent}% ${agentB?.name}` : isAThroughputWinner ? `+${tpsPercent}% ${agentA?.name}` : 'Equal TPS'}
                </AnimatedBadge>
              </div>
              <span className="text-[9px] text-gray-400 font-mono">
                {effectiveMetricA.tokensPerSec} t/s (A) vs {effectiveMetricB.tokensPerSec} t/s (B)
              </span>
            </motion.div>

            {/* Token Economy / Efficiency Badge */}
            <motion.div 
              layout
              className={cn(
                "p-2.5 rounded-lg border flex flex-col justify-between space-y-1 transition-colors duration-300",
                tokensPerTaskA < tokensPerTaskB
                  ? "bg-purple-950/30 border-purple-800/80 text-purple-300"
                  : tokensPerTaskB < tokensPerTaskA
                  ? "bg-cyan-950/30 border-cyan-800/80 text-cyan-300"
                  : "bg-gray-900/80 border-gray-800 text-gray-300"
              )}
            >
              <span className="text-[10px] text-gray-400 font-medium flex items-center space-x-1">
                <Cpu className="w-3 h-3 text-cyan-400" />
                <span>Token Economy</span>
              </span>
              <div className="flex items-baseline justify-between">
                <AnimatedValue
                  value={tokenPerTaskDelta}
                  unit=" tok/task"
                  className="text-xs font-bold font-mono text-cyan-300 inline-block"
                />
                <AnimatedBadge
                  badgeKey={`${tokensPerTaskA}-${tokensPerTaskB}`}
                  className={cn(
                    "text-[9px] px-1.5 py-0.5 rounded font-bold font-mono border inline-block",
                    tokensPerTaskA < tokensPerTaskB
                      ? "bg-purple-900/70 text-purple-200 border-purple-700"
                      : tokensPerTaskB < tokensPerTaskA
                      ? "bg-cyan-900/70 text-cyan-200 border-cyan-700"
                      : "bg-gray-800 text-gray-400 border-gray-700"
                  )}
                >
                  {tokensPerTaskA < tokensPerTaskB ? `${agentA?.name} Leaner` : tokensPerTaskB < tokensPerTaskA ? `${agentB?.name} Leaner` : 'Equal'}
                </AnimatedBadge>
              </div>
              <span className="text-[9px] text-gray-400 font-mono">
                {tokensPerTaskA} tok/task (A) vs {tokensPerTaskB} tok/task (B)
              </span>
            </motion.div>
          </div>
        </div>

        {/* Normalized Radar & Bar Comparison Chart */}
        <div className="bg-gray-950/90 border border-gray-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BarChart2 className="w-4 h-4 text-purple-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-200">
                Normalized Comparative Matrix & Benchmarks
              </h4>
            </div>

            <div className="flex items-center space-x-1 bg-gray-900 p-1 rounded-lg border border-gray-800 text-[10px]">
              <button
                onClick={() => setChartMode('bars')}
                className={cn(
                  "px-2 py-0.5 rounded font-medium transition-colors",
                  chartMode === 'bars' ? "bg-purple-950 text-purple-200 font-bold" : "text-gray-400 hover:text-gray-200"
                )}
              >
                Bar Gauge
              </button>
              <button
                onClick={() => setChartMode('radar')}
                className={cn(
                  "px-2 py-0.5 rounded font-medium transition-colors",
                  chartMode === 'radar' ? "bg-purple-950 text-purple-200 font-bold" : "text-gray-400 hover:text-gray-200"
                )}
              >
                Radar Profile
              </button>
            </div>
          </div>

          {/* Chart Rendering */}
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartMode === 'bars' ? (
                <BarChart 
                  data={comparisonChartData} 
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 90, bottom: 5 }}
                >
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 10 }} unit="%" />
                  <YAxis type="category" dataKey="metric" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                    formatter={(value: any, name: any) => [`${Math.round(Number(value))}%`, name]}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                  <Bar dataKey={agentA?.name || 'Agent A'} fill="#a855f7" radius={[0, 4, 4, 0]} barSize={10} />
                  <Bar dataKey={agentB?.name || 'Agent B'} fill="#06b6d4" radius={[0, 4, 4, 0]} barSize={10} />
                </BarChart>
              ) : (
                <RadarChart data={comparisonChartData} margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
                  <PolarGrid stroke="#374151" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Radar name={agentA?.name || 'Agent A'} dataKey={agentA?.name || 'Agent A'} stroke="#a855f7" fill="#a855f7" fillOpacity={0.4} />
                  <Radar name={agentB?.name || 'Agent B'} dataKey={agentB?.name || 'Agent B'} stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.3} />
                </RadarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Performance Metric Trends & Sparkline Comparison Chart */}
        <div className="bg-gray-950/90 border border-gray-800 rounded-xl p-4 space-y-3.5 shadow-sm">
          {/* Header & Metric Switcher Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1 border-b border-gray-800/80">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-purple-950/80 border border-purple-800 text-purple-300">
                <LineChartIcon className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-200">
                    Performance Metric Trend Sparklines
                  </h4>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-900 text-gray-400 border border-gray-800 font-mono">
                    Time-Series Telemetry
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 font-mono">
                  {sparklineConfig.description}
                </p>
              </div>
            </div>

            {/* Metric Selectors & View Controls */}
            <div className="flex items-center flex-wrap gap-1.5">
              {/* Metric Buttons */}
              <div className="flex items-center bg-gray-900 p-0.5 rounded-lg border border-gray-800 text-[10px]">
                <button
                  onClick={() => setSelectedSparklineMetric('latency')}
                  className={cn(
                    "px-2.5 py-1 rounded font-medium transition-all flex items-center space-x-1",
                    selectedSparklineMetric === 'latency'
                      ? "bg-blue-950 text-blue-200 font-bold shadow-sm border border-blue-800"
                      : "text-gray-400 hover:text-gray-200"
                  )}
                >
                  <Clock className="w-3 h-3 text-blue-400" />
                  <span>Latency</span>
                </button>
                <button
                  onClick={() => setSelectedSparklineMetric('throughput')}
                  className={cn(
                    "px-2.5 py-1 rounded font-medium transition-all flex items-center space-x-1",
                    selectedSparklineMetric === 'throughput'
                      ? "bg-amber-950 text-amber-200 font-bold shadow-sm border border-amber-800"
                      : "text-gray-400 hover:text-gray-200"
                  )}
                >
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>Throughput</span>
                </button>
                <button
                  onClick={() => setSelectedSparklineMetric('tokens')}
                  className={cn(
                    "px-2.5 py-1 rounded font-medium transition-all flex items-center space-x-1",
                    selectedSparklineMetric === 'tokens'
                      ? "bg-cyan-950 text-cyan-200 font-bold shadow-sm border border-cyan-800"
                      : "text-gray-400 hover:text-gray-200"
                  )}
                >
                  <Cpu className="w-3 h-3 text-cyan-400" />
                  <span>Token Economy</span>
                </button>
                <button
                  onClick={() => setSelectedSparklineMetric('reliability')}
                  className={cn(
                    "px-2.5 py-1 rounded font-medium transition-all flex items-center space-x-1",
                    selectedSparklineMetric === 'reliability'
                      ? "bg-emerald-950 text-emerald-200 font-bold shadow-sm border border-emerald-800"
                      : "text-gray-400 hover:text-gray-200"
                  )}
                >
                  <ShieldAlert className="w-3 h-3 text-emerald-400" />
                  <span>Reliability</span>
                </button>
              </div>

              {/* Chart Style (Area / Line) & Window Points (10T / 20T) */}
              <div className="flex items-center space-x-1 bg-gray-900 p-0.5 rounded-lg border border-gray-800 text-[10px]">
                <button
                  onClick={() => setSparklineChartType('area')}
                  className={cn(
                    "px-2 py-1 rounded font-medium transition-colors",
                    sparklineChartType === 'area' ? "bg-purple-950 text-purple-200 font-bold" : "text-gray-400 hover:text-gray-200"
                  )}
                >
                  Area
                </button>
                <button
                  onClick={() => setSparklineChartType('line')}
                  className={cn(
                    "px-2 py-1 rounded font-medium transition-colors",
                    sparklineChartType === 'line' ? "bg-purple-950 text-purple-200 font-bold" : "text-gray-400 hover:text-gray-200"
                  )}
                >
                  Line
                </button>
              </div>

              <div className="flex items-center space-x-1 bg-gray-900 p-0.5 rounded-lg border border-gray-800 text-[10px]">
                <button
                  onClick={() => setSparklinePointCount(10)}
                  className={cn(
                    "px-2 py-1 rounded font-medium transition-colors",
                    sparklinePointCount === 10 ? "bg-purple-950 text-purple-200 font-bold" : "text-gray-400 hover:text-gray-200"
                  )}
                >
                  10 Turns
                </button>
                <button
                  onClick={() => setSparklinePointCount(20)}
                  className={cn(
                    "px-2 py-1 rounded font-medium transition-colors",
                    sparklinePointCount === 20 ? "bg-purple-950 text-purple-200 font-bold" : "text-gray-400 hover:text-gray-200"
                  )}
                >
                  20 Turns
                </button>
              </div>
            </div>
          </div>

          {/* Sparkline Chart Component */}
          <div className="h-56 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              {sparklineChartType === 'area' ? (
                <AreaChart
                  data={sparklineTimeSeries}
                  margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
                  onClick={(e: any) => {
                    if (e && e.activeTooltipIndex !== undefined && e.activeTooltipIndex !== null) {
                      setSelectedTimeIndex(e.activeTooltipIndex);
                      if (isPlayingTimeline) setIsPlayingTimeline(false);
                    }
                  }}
                >
                  <defs>
                    <linearGradient id="sparklineGradA" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="sparklineGradB" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="turn" 
                    tick={{ fill: '#6b7280', fontSize: 10 }} 
                    axisLine={{ stroke: '#374151' }}
                    tickLine={{ stroke: '#374151' }}
                  />
                  <YAxis 
                    tick={{ fill: '#9ca3af', fontSize: 10 }} 
                    axisLine={{ stroke: '#374151' }}
                    tickLine={{ stroke: '#374151' }}
                    unit={sparklineConfig.unit === '%' ? '%' : ''}
                  />
                  <Tooltip
                    content={
                      <CustomTelemetrySparklineTooltip
                        sparklineConfig={sparklineConfig}
                        agentA={agentA}
                        agentB={agentB}
                      />
                    }
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                  {sparklineConfig.slaTarget && (
                    <ReferenceLine 
                      y={sparklineConfig.slaTarget} 
                      stroke="#10b981" 
                      strokeDasharray="3 3" 
                      label={{ 
                        value: sparklineConfig.slaLabel, 
                        fill: '#34d399', 
                        fontSize: 9, 
                        position: 'insideTopRight' 
                      }} 
                    />
                  )}
                  {/* Current Historical Scrub Laser Indicator */}
                  {currentSnapshot && (
                    <ReferenceLine
                      x={currentSnapshot.turnLabel}
                      stroke="#ec4899"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      label={{
                        value: `📍 ${currentSnapshot.turnLabel}`,
                        fill: '#f472b6',
                        fontSize: 9,
                        position: 'top'
                      }}
                    />
                  )}
                  <Area
                    type="monotone"
                    dataKey={sparklineConfig.keyA}
                    name={`${agentA?.name || 'Agent A'} (A)`}
                    stroke="#a855f7"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#sparklineGradA)"
                    activeDot={{ r: 5, stroke: '#c084fc', strokeWidth: 2 }}
                  />
                  <Area
                    type="monotone"
                    dataKey={sparklineConfig.keyB}
                    name={`${agentB?.name || 'Agent B'} (B)`}
                    stroke="#06b6d4"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#sparklineGradB)"
                    activeDot={{ r: 5, stroke: '#22d3ee', strokeWidth: 2 }}
                  />
                </AreaChart>
              ) : (
                <LineChart
                  data={sparklineTimeSeries}
                  margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
                  onClick={(e: any) => {
                    if (e && e.activeTooltipIndex !== undefined && e.activeTooltipIndex !== null) {
                      setSelectedTimeIndex(e.activeTooltipIndex);
                      if (isPlayingTimeline) setIsPlayingTimeline(false);
                    }
                  }}
                >
                  <XAxis 
                    dataKey="turn" 
                    tick={{ fill: '#6b7280', fontSize: 10 }} 
                    axisLine={{ stroke: '#374151' }}
                    tickLine={{ stroke: '#374151' }}
                  />
                  <YAxis 
                    tick={{ fill: '#9ca3af', fontSize: 10 }} 
                    axisLine={{ stroke: '#374151' }}
                    tickLine={{ stroke: '#374151' }}
                    unit={sparklineConfig.unit === '%' ? '%' : ''}
                  />
                  <Tooltip
                    content={
                      <CustomTelemetrySparklineTooltip
                        sparklineConfig={sparklineConfig}
                        agentA={agentA}
                        agentB={agentB}
                      />
                    }
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                  {sparklineConfig.slaTarget && (
                    <ReferenceLine 
                      y={sparklineConfig.slaTarget} 
                      stroke="#10b981" 
                      strokeDasharray="3 3" 
                      label={{ 
                        value: sparklineConfig.slaLabel, 
                        fill: '#34d399', 
                        fontSize: 9, 
                        position: 'insideTopRight' 
                      }} 
                    />
                  )}
                  {/* Current Historical Scrub Laser Indicator */}
                  {currentSnapshot && (
                    <ReferenceLine
                      x={currentSnapshot.turnLabel}
                      stroke="#ec4899"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      label={{
                        value: `📍 ${currentSnapshot.turnLabel}`,
                        fill: '#f472b6',
                        fontSize: 9,
                        position: 'top'
                      }}
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey={sparklineConfig.keyA}
                    name={`${agentA?.name || 'Agent A'} (A)`}
                    stroke="#a855f7"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#a855f7' }}
                    activeDot={{ r: 6, stroke: '#c084fc', strokeWidth: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey={sparklineConfig.keyB}
                    name={`${agentB?.name || 'Agent B'} (B)`}
                    stroke="#06b6d4"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#06b6d4' }}
                    activeDot={{ r: 6, stroke: '#22d3ee', strokeWidth: 2 }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Statistical Trend Summaries & Direction Badges */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 border-t border-gray-800/80 text-xs">
            {/* Agent A Trend Summary */}
            <motion.div 
              layout
              className="p-2.5 rounded-lg bg-gray-900/80 border border-purple-900/50 space-y-1.5 transition-colors duration-300"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-purple-300 font-mono text-[11px] flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
                  <span>{agentA?.name} (A) Trajectory</span>
                </span>
                <span className="text-[10px] font-mono text-gray-400">
                  Avg: <strong className="text-gray-100"><AnimatedValue value={sparklineConfig.formatValue(sparklineStats.avgA)} /></strong>
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-gray-400">
                <span>Range: {sparklineConfig.formatValue(sparklineStats.minA)} – {sparklineConfig.formatValue(sparklineStats.maxA)}</span>
                <AnimatedBadge
                  badgeKey={`${sparklineStats.trendDeltaA}`}
                  className={cn(
                    "px-1.5 py-0.5 rounded font-bold border inline-block",
                    sparklineStats.trendDeltaA < 0 
                      ? "bg-emerald-950/80 text-emerald-300 border-emerald-800" 
                      : sparklineStats.trendDeltaA > 0 
                      ? "bg-purple-950/80 text-purple-300 border-purple-800" 
                      : "bg-gray-800 text-gray-300 border-gray-700"
                  )}
                >
                  {sparklineStats.trendDeltaA > 0 ? `+${sparklineStats.trendDeltaA}%` : `${sparklineStats.trendDeltaA}%`} shift
                </AnimatedBadge>
              </div>
              <div className="text-[10px] text-gray-400 flex items-center justify-between">
                <span>Jitter / Stability:</span>
                <span className="font-mono text-purple-300"><AnimatedValue value={sparklineStats.jitterA} unit="% variance" /></span>
              </div>
            </motion.div>

            {/* Agent B Trend Summary */}
            <motion.div 
              layout
              className="p-2.5 rounded-lg bg-gray-900/80 border border-cyan-900/50 space-y-1.5 transition-colors duration-300"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-cyan-300 font-mono text-[11px] flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-cyan-500 inline-block" />
                  <span>{agentB?.name} (B) Trajectory</span>
                </span>
                <span className="text-[10px] font-mono text-gray-400">
                  Avg: <strong className="text-gray-100"><AnimatedValue value={sparklineConfig.formatValue(sparklineStats.avgB)} /></strong>
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-gray-400">
                <span>Range: {sparklineConfig.formatValue(sparklineStats.minB)} – {sparklineConfig.formatValue(sparklineStats.maxB)}</span>
                <AnimatedBadge
                  badgeKey={`${sparklineStats.trendDeltaB}`}
                  className={cn(
                    "px-1.5 py-0.5 rounded font-bold border inline-block",
                    sparklineStats.trendDeltaB < 0 
                      ? "bg-emerald-950/80 text-emerald-300 border-emerald-800" 
                      : sparklineStats.trendDeltaB > 0 
                      ? "bg-cyan-950/80 text-cyan-300 border-cyan-800" 
                      : "bg-gray-800 text-gray-300 border-gray-700"
                  )}
                >
                  {sparklineStats.trendDeltaB > 0 ? `+${sparklineStats.trendDeltaB}%` : `${sparklineStats.trendDeltaB}%`} shift
                </AnimatedBadge>
              </div>
              <div className="text-[10px] text-gray-400 flex items-center justify-between">
                <span>Jitter / Stability:</span>
                <span className="font-mono text-cyan-300"><AnimatedValue value={sparklineStats.jitterB} unit="% variance" /></span>
              </div>
            </motion.div>

            {/* Window Trend Verdict */}
            <motion.div 
              layout
              className="p-2.5 rounded-lg bg-gray-900/80 border border-gray-800 flex flex-col justify-between space-y-1.5 transition-colors duration-300"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-300 font-mono flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Trend Winner</span>
                </span>
                <AnimatedBadge
                  badgeKey={`${sparklineStats.isBWinner}-${sparklineStats.isAWinner}-${sparklineStats.deltaPct}`}
                  className={cn(
                    "text-[9px] px-1.5 py-0.5 rounded font-bold font-mono border inline-block",
                    sparklineStats.isBWinner 
                      ? "bg-cyan-950 text-cyan-200 border-cyan-800"
                      : sparklineStats.isAWinner
                      ? "bg-purple-950 text-purple-200 border-purple-800"
                      : "bg-gray-800 text-gray-300 border-gray-700"
                  )}
                >
                  {sparklineStats.isBWinner ? `${agentB?.name} Advantage` : sparklineStats.isAWinner ? `${agentA?.name} Advantage` : 'Trend Parity'}
                </AnimatedBadge>
              </div>
              <p className="text-[10px] text-gray-400 font-mono">
                {sparklineStats.isBWinner
                  ? `${agentB?.name} outperforms by ${sparklineStats.deltaPct}% average advantage across ${sparklinePointCount} turns.`
                  : sparklineStats.isAWinner
                  ? `${agentA?.name} outperforms by ${sparklineStats.deltaPct}% average advantage across ${sparklinePointCount} turns.`
                  : `Both agents demonstrate identical historical performance profiles.`}
              </p>
            </motion.div>
          </div>
        </div>

        {/* Detailed Side-by-Side Comparison Metrics Grid with Color-Coded Badges */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center space-x-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Real-Time Performance & SLA Dials</span>
            </h4>
            <div className="flex items-center space-x-2 text-[10px]">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Performance Advantage
              </span>
              <span className="flex items-center gap-1 text-rose-400">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> Elevated Latency / Error
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Agent A Performance Metrics Card */}
            <motion.div layout className="bg-gray-950/70 border border-gray-800/80 rounded-xl p-4 space-y-3.5">
              <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-purple-300 font-mono">{agentA?.name} Metrics</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800 font-mono">
                    Primary
                  </span>
                </div>
                <span className="text-[10px] font-mono text-gray-400">
                  <AnimatedValue value={metricA.tasksCompleted} unit=" Tasks Logged" />
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                {/* Latency with Color-Coded Badge */}
                <motion.div 
                  layout
                  className={cn(
                    "p-2.5 rounded-lg border bg-gray-900/80 flex flex-col justify-between space-y-1.5 transition-colors duration-300",
                    highlightDiffs && isALatencyWinner
                      ? "border-emerald-700/80 bg-emerald-950/20 shadow-sm"
                      : highlightDiffs && isBLatencyWinner
                      ? "border-amber-900/60 bg-amber-950/10"
                      : "border-gray-800"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-blue-400" />
                      <span>Avg Latency</span>
                    </span>
                    <AnimatedBadge
                      badgeKey={`${metricA.avgCompletionTimeMs < 1000 ? 'sub' : metricA.avgCompletionTimeMs < 2000 ? 'std' : 'high'}`}
                      className={cn(
                        "text-[9px] px-1.5 py-0.5 rounded font-mono font-bold border inline-block",
                        metricA.avgCompletionTimeMs < 1000
                          ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                          : metricA.avgCompletionTimeMs < 2000
                          ? "bg-blue-950 text-blue-300 border-blue-800"
                          : "bg-rose-950 text-rose-300 border-rose-800"
                      )}
                    >
                      {metricA.avgCompletionTimeMs < 1000 ? 'Sub-Sec SLA' : metricA.avgCompletionTimeMs < 2000 ? 'Standard SLA' : 'High Latency'}
                    </AnimatedBadge>
                  </div>

                  {/* Latency Value & Delta */}
                  <div className="flex items-baseline justify-between pt-0.5">
                    <span className="text-base font-bold font-mono text-gray-100">
                      <AnimatedValue value={metricA.avgCompletionTimeMs} unit="ms" />
                    </span>
                    {isALatencyWinner ? (
                      <AnimatedBadge
                        badgeKey={`winnerA-${latencyPercent}`}
                        className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800 flex items-center gap-1"
                      >
                        <span>-{latencyPercent}%</span>
                        <span>⚡ Faster</span>
                      </AnimatedBadge>
                    ) : isBLatencyWinner ? (
                      <AnimatedBadge
                        badgeKey={`loserA-${latencyPercent}`}
                        className="text-[10px] text-rose-400 font-mono font-bold bg-rose-950/80 px-1.5 py-0.5 rounded border border-rose-800 inline-block"
                      >
                        +{latencyPercent}% Slower
                      </AnimatedBadge>
                    ) : (
                      <span className="text-[10px] text-gray-400 font-mono">Parity</span>
                    )}
                  </div>

                  {/* Sparkline Trend */}
                  <div className="pt-1 border-t border-gray-800/60 flex items-center justify-between">
                    <span className="text-[9px] text-gray-500 font-mono">10-Turn Trend</span>
                    <MiniSparkline 
                      data={latencySparklineA} 
                      strokeColor="#a855f7" 
                      fillColor="rgba(168, 85, 247, 0.18)" 
                      width={90} 
                      height={20} 
                      metricName="Avg Latency"
                      unit="ms"
                      agentName={agentA?.name || 'Agent A'}
                      formatValue={(v) => `${v}ms`}
                      lowerIsBetter={true}
                    />
                  </div>
                </motion.div>

                {/* Error Rate & Reliability with Color-Coded Badge */}
                <motion.div 
                  layout
                  className={cn(
                    "p-2.5 rounded-lg border bg-gray-900/80 flex flex-col justify-between space-y-1.5 transition-colors duration-300",
                    highlightDiffs && metricA.errorCount === 0
                      ? "border-emerald-700/80 bg-emerald-950/20"
                      : highlightDiffs && metricA.errorCount > 0
                      ? "border-rose-700/80 bg-rose-950/30"
                      : "border-gray-800"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 flex items-center space-x-1">
                      <ShieldAlert className="w-3 h-3 text-emerald-400" />
                      <span>Error Rate / Reliability</span>
                    </span>
                    <AnimatedBadge
                      badgeKey={`${metricA.errorCount === 0 ? 'zero' : 'nonzero'}-${errorRateA}`}
                      className={cn(
                        "text-[9px] px-1.5 py-0.5 rounded font-mono font-bold border inline-block",
                        metricA.errorCount === 0
                          ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                          : "bg-rose-950 text-rose-300 border-rose-800"
                      )}
                    >
                      {metricA.errorCount === 0 ? '0.0% Error Rate' : `${errorRateA}% Error Rate`}
                    </AnimatedBadge>
                  </div>

                  <div className="flex items-baseline justify-between pt-0.5">
                    <span className={cn(
                      "text-base font-bold font-mono",
                      metricA.errorCount === 0 ? "text-emerald-400" : "text-rose-400"
                    )}>
                      <AnimatedValue value={metricA.errorCount === 0 ? '100% Success' : `${metricA.errorCount} Errors`} />
                    </span>
                    {isAErrorWinner ? (
                      <AnimatedBadge
                        badgeKey="zero-fail-A"
                        className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800 inline-block"
                      >
                        🛡️ Zero Failures
                      </AnimatedBadge>
                    ) : isBErrorWinner ? (
                      <AnimatedBadge
                        badgeKey={`fail-diff-A-${metricA.errorCount}`}
                        className="text-[10px] text-rose-400 font-mono font-bold bg-rose-950/80 px-1.5 py-0.5 rounded border border-rose-800 inline-block"
                      >
                        +{metricA.errorCount - metricB.errorCount} Errors vs B
                      </AnimatedBadge>
                    ) : (
                      <span className="text-[10px] text-emerald-400 font-mono">Clean Run</span>
                    )}
                  </div>

                  {/* Sparkline Trend */}
                  <div className="pt-1 border-t border-gray-800/60 flex items-center justify-between">
                    <span className="text-[9px] text-gray-500 font-mono">Reliability Curve</span>
                    <MiniSparkline 
                      data={errorSparklineA} 
                      strokeColor="#10b981" 
                      fillColor="rgba(16, 185, 129, 0.18)" 
                      width={90} 
                      height={20} 
                      metricName="Reliability"
                      unit="%"
                      agentName={agentA?.name || 'Agent A'}
                      formatValue={(v) => `${v}%`}
                      lowerIsBetter={false}
                    />
                  </div>
                </motion.div>

                {/* Throughput */}
                <motion.div 
                  layout
                  className={cn(
                    "p-2.5 rounded-lg border bg-gray-900/80 flex flex-col justify-between space-y-1.5 transition-colors duration-300",
                    highlightDiffs && isAThroughputWinner
                      ? "border-purple-700/80 bg-purple-950/20"
                      : "border-gray-800"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 flex items-center space-x-1">
                      <Zap className="w-3 h-3 text-amber-400" />
                      <span>Throughput Rate</span>
                    </span>
                    <AnimatedBadge
                      badgeKey={metricA.tokensPerSec > 130 ? 'turbo' : 'std'}
                      className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-800 inline-block"
                    >
                      {metricA.tokensPerSec > 130 ? 'Turbo Tier' : 'Standard'}
                    </AnimatedBadge>
                  </div>

                  <div className="flex items-baseline justify-between pt-0.5">
                    <span className="text-base font-bold font-mono text-amber-300">
                      <AnimatedValue value={metricA.tokensPerSec} unit=" t/s" />
                    </span>
                    {isAThroughputWinner ? (
                      <AnimatedBadge
                        badgeKey={`tps-A-win-${tpsPercent}`}
                        className="text-[10px] text-purple-400 font-mono font-bold bg-purple-950/80 px-1.5 py-0.5 rounded border border-purple-800 inline-block"
                      >
                        +{tpsPercent}% ⚡
                      </AnimatedBadge>
                    ) : isBThroughputWinner ? (
                      <span className="text-[10px] text-gray-500 font-mono">
                        -{tpsPercent}% vs B
                      </span>
                    ) : null}
                  </div>

                  {/* Sparkline Trend */}
                  <div className="pt-1 border-t border-gray-800/60 flex items-center justify-between">
                    <span className="text-[9px] text-gray-500 font-mono">TPS Trajectory</span>
                    <MiniSparkline 
                      data={throughputSparklineA} 
                      strokeColor="#f59e0b" 
                      fillColor="rgba(245, 158, 11, 0.18)" 
                      width={90} 
                      height={20} 
                      metricName="Throughput"
                      unit=" t/s"
                      agentName={agentA?.name || 'Agent A'}
                      formatValue={(v) => `${v} t/s`}
                      lowerIsBetter={false}
                    />
                  </div>
                </motion.div>

                {/* Token Consumption & Cost Profile */}
                <motion.div 
                  layout
                  className="p-2.5 rounded-lg border border-gray-800 bg-gray-900/80 flex flex-col justify-between space-y-1.5 transition-colors duration-300"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 flex items-center space-x-1">
                      <Cpu className="w-3 h-3 text-cyan-400" />
                      <span>Token Economy</span>
                    </span>
                    <AnimatedBadge
                      badgeKey={tokensPerTaskA}
                      className="text-[9px] px-1.5 py-0.5 rounded font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-800 inline-block"
                    >
                      {tokensPerTaskA} t/task
                    </AnimatedBadge>
                  </div>

                  <div className="flex items-baseline justify-between pt-0.5">
                    <span className="text-base font-bold font-mono text-cyan-300">
                      <AnimatedValue value={(metricA.totalTokensUsed / 1000).toFixed(1)} unit="k" />
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">
                      {metricA.promptTokens}p / {metricA.completionTokens}c
                    </span>
                  </div>

                  {/* Sparkline Trend */}
                  <div className="pt-1 border-t border-gray-800/60 flex items-center justify-between">
                    <span className="text-[9px] text-gray-500 font-mono">Token Trend</span>
                    <MiniSparkline 
                      data={tokenSparklineA} 
                      strokeColor="#06b6d4" 
                      fillColor="rgba(6, 182, 212, 0.18)" 
                      width={90} 
                      height={20} 
                      metricName="Token Usage"
                      unit=" tok"
                      agentName={agentA?.name || 'Agent A'}
                      formatValue={(v) => `${v} tok`}
                      lowerIsBetter={true}
                    />
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Agent B Performance Metrics Card */}
            <motion.div layout className="bg-gray-950/70 border border-gray-800/80 rounded-xl p-4 space-y-3.5">
              <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-cyan-300 font-mono">{agentB?.name} Metrics</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800 font-mono">
                    Target
                  </span>
                </div>
                <span className="text-[10px] font-mono text-gray-400">
                  <AnimatedValue value={metricB.tasksCompleted} unit=" Tasks Logged" />
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                {/* Latency with Color-Coded Badge */}
                <motion.div 
                  layout
                  className={cn(
                    "p-2.5 rounded-lg border bg-gray-900/80 flex flex-col justify-between space-y-1.5 transition-colors duration-300",
                    highlightDiffs && isBLatencyWinner
                      ? "border-emerald-700/80 bg-emerald-950/20 shadow-sm"
                      : highlightDiffs && isALatencyWinner
                      ? "border-amber-900/60 bg-amber-950/10"
                      : "border-gray-800"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-blue-400" />
                      <span>Avg Latency</span>
                    </span>
                    <AnimatedBadge
                      badgeKey={`${metricB.avgCompletionTimeMs < 1000 ? 'sub' : metricB.avgCompletionTimeMs < 2000 ? 'std' : 'high'}`}
                      className={cn(
                        "text-[9px] px-1.5 py-0.5 rounded font-mono font-bold border inline-block",
                        metricB.avgCompletionTimeMs < 1000
                          ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                          : metricB.avgCompletionTimeMs < 2000
                          ? "bg-blue-950 text-blue-300 border-blue-800"
                          : "bg-rose-950 text-rose-300 border-rose-800"
                      )}
                    >
                      {metricB.avgCompletionTimeMs < 1000 ? 'Sub-Sec SLA' : metricB.avgCompletionTimeMs < 2000 ? 'Standard SLA' : 'High Latency'}
                    </AnimatedBadge>
                  </div>

                  <div className="flex items-baseline justify-between pt-0.5">
                    <span className="text-base font-bold font-mono text-gray-100">
                      <AnimatedValue value={metricB.avgCompletionTimeMs} unit="ms" />
                    </span>
                    {isBLatencyWinner ? (
                      <AnimatedBadge
                        badgeKey={`winnerB-${latencyPercent}`}
                        className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800 flex items-center gap-1"
                      >
                        <span>-{latencyPercent}%</span>
                        <span>⚡ Faster</span>
                      </AnimatedBadge>
                    ) : isALatencyWinner ? (
                      <AnimatedBadge
                        badgeKey={`loserB-${latencyPercent}`}
                        className="text-[10px] text-rose-400 font-mono font-bold bg-rose-950/80 px-1.5 py-0.5 rounded border border-rose-800 inline-block"
                      >
                        +{latencyPercent}% Slower
                      </AnimatedBadge>
                    ) : (
                      <span className="text-[10px] text-gray-400 font-mono">Parity</span>
                    )}
                  </div>

                  {/* Sparkline Trend */}
                  <div className="pt-1 border-t border-gray-800/60 flex items-center justify-between">
                    <span className="text-[9px] text-gray-500 font-mono">10-Turn Trend</span>
                    <MiniSparkline 
                      data={latencySparklineB} 
                      strokeColor="#06b6d4" 
                      fillColor="rgba(6, 182, 212, 0.18)" 
                      width={90} 
                      height={20} 
                      metricName="Avg Latency"
                      unit="ms"
                      agentName={agentB?.name || 'Agent B'}
                      formatValue={(v) => `${v}ms`}
                      lowerIsBetter={true}
                    />
                  </div>
                </motion.div>

                {/* Error Rate & Reliability with Color-Coded Badge */}
                <motion.div 
                  layout
                  className={cn(
                    "p-2.5 rounded-lg border bg-gray-900/80 flex flex-col justify-between space-y-1.5 transition-colors duration-300",
                    highlightDiffs && metricB.errorCount === 0
                      ? "border-emerald-700/80 bg-emerald-950/20"
                      : highlightDiffs && metricB.errorCount > 0
                      ? "border-rose-700/80 bg-rose-950/30"
                      : "border-gray-800"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 flex items-center space-x-1">
                      <ShieldAlert className="w-3 h-3 text-emerald-400" />
                      <span>Error Rate / Reliability</span>
                    </span>
                    <AnimatedBadge
                      badgeKey={`${metricB.errorCount === 0 ? 'zero' : 'nonzero'}-${errorRateB}`}
                      className={cn(
                        "text-[9px] px-1.5 py-0.5 rounded font-mono font-bold border inline-block",
                        metricB.errorCount === 0
                          ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                          : "bg-rose-950 text-rose-300 border-rose-800"
                      )}
                    >
                      {metricB.errorCount === 0 ? '0.0% Error Rate' : `${errorRateB}% Error Rate`}
                    </AnimatedBadge>
                  </div>

                  <div className="flex items-baseline justify-between pt-0.5">
                    <span className={cn(
                      "text-base font-bold font-mono",
                      metricB.errorCount === 0 ? "text-emerald-400" : "text-rose-400"
                    )}>
                      <AnimatedValue value={metricB.errorCount === 0 ? '100% Success' : `${metricB.errorCount} Errors`} />
                    </span>
                    {isBErrorWinner ? (
                      <AnimatedBadge
                        badgeKey="zero-fail-B"
                        className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800 inline-block"
                      >
                        🛡️ Zero Failures
                      </AnimatedBadge>
                    ) : isAErrorWinner ? (
                      <AnimatedBadge
                        badgeKey={`fail-diff-B-${metricB.errorCount}`}
                        className="text-[10px] text-rose-400 font-mono font-bold bg-rose-950/80 px-1.5 py-0.5 rounded border border-rose-800 inline-block"
                      >
                        +{metricB.errorCount - metricA.errorCount} Errors vs A
                      </AnimatedBadge>
                    ) : (
                      <span className="text-[10px] text-emerald-400 font-mono">Clean Run</span>
                    )}
                  </div>

                  {/* Sparkline Trend */}
                  <div className="pt-1 border-t border-gray-800/60 flex items-center justify-between">
                    <span className="text-[9px] text-gray-500 font-mono">Reliability Curve</span>
                    <MiniSparkline 
                      data={errorSparklineB} 
                      strokeColor="#10b981" 
                      fillColor="rgba(16, 185, 129, 0.18)" 
                      width={90} 
                      height={20} 
                      metricName="Reliability"
                      unit="%"
                      agentName={agentB?.name || 'Agent B'}
                      formatValue={(v) => `${v}%`}
                      lowerIsBetter={false}
                    />
                  </div>
                </motion.div>

                {/* Throughput */}
                <motion.div 
                  layout
                  className={cn(
                    "p-2.5 rounded-lg border bg-gray-900/80 flex flex-col justify-between space-y-1.5 transition-colors duration-300",
                    highlightDiffs && isBThroughputWinner
                      ? "border-cyan-700/80 bg-cyan-950/20"
                      : "border-gray-800"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 flex items-center space-x-1">
                      <Zap className="w-3 h-3 text-amber-400" />
                      <span>Throughput Rate</span>
                    </span>
                    <AnimatedBadge
                      badgeKey={metricB.tokensPerSec > 130 ? 'turbo' : 'std'}
                      className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-800 inline-block"
                    >
                      {metricB.tokensPerSec > 130 ? 'Turbo Tier' : 'Standard'}
                    </AnimatedBadge>
                  </div>

                  <div className="flex items-baseline justify-between pt-0.5">
                    <span className="text-base font-bold font-mono text-amber-300">
                      <AnimatedValue value={metricB.tokensPerSec} unit=" t/s" />
                    </span>
                    {isBThroughputWinner ? (
                      <AnimatedBadge
                        badgeKey={`tps-B-win-${tpsPercent}`}
                        className="text-[10px] text-cyan-400 font-mono font-bold bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800 inline-block"
                      >
                        +{tpsPercent}% ⚡
                      </AnimatedBadge>
                    ) : isAThroughputWinner ? (
                      <span className="text-[10px] text-gray-500 font-mono">
                        -{tpsPercent}% vs A
                      </span>
                    ) : null}
                  </div>

                  {/* Sparkline Trend */}
                  <div className="pt-1 border-t border-gray-800/60 flex items-center justify-between">
                    <span className="text-[9px] text-gray-500 font-mono">TPS Trajectory</span>
                    <MiniSparkline 
                      data={throughputSparklineB} 
                      strokeColor="#f59e0b" 
                      fillColor="rgba(245, 158, 11, 0.18)" 
                      width={90} 
                      height={20} 
                      metricName="Throughput"
                      unit=" t/s"
                      agentName={agentB?.name || 'Agent B'}
                      formatValue={(v) => `${v} t/s`}
                      lowerIsBetter={false}
                    />
                  </div>
                </motion.div>

                {/* Token Consumption & Cost Profile */}
                <motion.div 
                  layout
                  className="p-2.5 rounded-lg border border-gray-800 bg-gray-900/80 flex flex-col justify-between space-y-1.5 transition-colors duration-300"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 flex items-center space-x-1">
                      <Cpu className="w-3 h-3 text-cyan-400" />
                      <span>Token Economy</span>
                    </span>
                    <AnimatedBadge
                      badgeKey={tokensPerTaskB}
                      className="text-[9px] px-1.5 py-0.5 rounded font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-800 inline-block"
                    >
                      {tokensPerTaskB} t/task
                    </AnimatedBadge>
                  </div>

                  <div className="flex items-baseline justify-between pt-0.5">
                    <span className="text-base font-bold font-mono text-cyan-300">
                      <AnimatedValue value={(metricB.totalTokensUsed / 1000).toFixed(1)} unit="k" />
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">
                      {metricB.promptTokens}p / {metricB.completionTokens}c
                    </span>
                  </div>

                  {/* Sparkline Trend */}
                  <div className="pt-1 border-t border-gray-800/60 flex items-center justify-between">
                    <span className="text-[9px] text-gray-500 font-mono">Token Trend</span>
                    <MiniSparkline 
                      data={tokenSparklineB} 
                      strokeColor="#06b6d4" 
                      fillColor="rgba(6, 182, 212, 0.18)" 
                      width={90} 
                      height={20} 
                      metricName="Token Usage"
                      unit=" tok"
                      agentName={agentB?.name || 'Agent B'}
                      formatValue={(v) => `${v} tok`}
                      lowerIsBetter={true}
                    />
                  </div>
                </motion.div>
              </div>
            </motion.div>

          </div>
        </div>

        {/* Tabular Metric Differences Breakdown Table with Color Badges */}
        <div className="bg-gray-950/90 border border-gray-800 rounded-xl overflow-hidden shadow-sm space-y-0">
          <div className="p-3 bg-gray-900/90 border-b border-gray-800 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>Comparative Metrics Matrix & Verdict</span>
            </span>
            <span className="text-[10px] text-gray-500">
              Color-coded relative to SLA & baseline
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-900/50 border-b border-gray-800 text-[10px] uppercase font-mono text-gray-400">
                  <th className="py-2.5 px-3.5 font-semibold">Metric Indicator</th>
                  <th className="py-2.5 px-3.5 font-semibold text-purple-300">{agentA?.name} (A)</th>
                  <th className="py-2.5 px-3.5 font-semibold text-cyan-300">{agentB?.name} (B)</th>
                  <th className="py-2.5 px-3.5 font-semibold text-right">Comparative Verdict / Delta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 font-mono text-[11px]">
                {/* Row: Latency */}
                <tr className="hover:bg-gray-900/30 transition-colors">
                  <td className="py-2.5 px-3.5 text-gray-300 font-sans font-medium flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    <span>Average Latency</span>
                  </td>
                  <td className="py-2.5 px-3.5 font-semibold text-gray-100"><AnimatedValue value={metricA.avgCompletionTimeMs} unit="ms" /></td>
                  <td className="py-2.5 px-3.5 font-semibold text-gray-100"><AnimatedValue value={metricB.avgCompletionTimeMs} unit="ms" /></td>
                  <td className="py-2.5 px-3.5 text-right">
                    <AnimatedBadge
                      badgeKey={`${isALatencyWinner}-${isBLatencyWinner}-${latencyDeltaMs}`}
                      className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-bold border inline-block",
                        isALatencyWinner
                          ? "bg-purple-950/90 text-purple-300 border-purple-700"
                          : isBLatencyWinner
                          ? "bg-emerald-950/90 text-emerald-300 border-emerald-700"
                          : "bg-gray-800 text-gray-400 border-gray-700"
                      )}
                    >
                      {isALatencyWinner
                        ? `${agentA?.name} -${Math.abs(latencyDeltaMs)}ms (${latencyPercent}% faster)`
                        : isBLatencyWinner
                        ? `${agentB?.name} -${Math.abs(latencyDeltaMs)}ms (${latencyPercent}% faster)`
                        : 'Identical (0ms delta)'}
                    </AnimatedBadge>
                  </td>
                </tr>

                {/* Row: Error Rate */}
                <tr className="hover:bg-gray-900/30 transition-colors">
                  <td className="py-2.5 px-3.5 text-gray-300 font-sans font-medium flex items-center space-x-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Error Rate</span>
                  </td>
                  <td className="py-2.5 px-3.5">
                    <AnimatedBadge
                      badgeKey={`${metricA.errorCount}-${errorRateA}`}
                      className={cn(
                        "px-1.5 py-0.5 rounded text-[10px] font-bold border inline-block",
                        metricA.errorCount === 0
                          ? "bg-emerald-950/80 text-emerald-300 border-emerald-800"
                          : "bg-rose-950/80 text-rose-300 border-rose-800"
                      )}
                    >
                      {errorRateA}% ({metricA.errorCount} err)
                    </AnimatedBadge>
                  </td>
                  <td className="py-2.5 px-3.5">
                    <AnimatedBadge
                      badgeKey={`${metricB.errorCount}-${errorRateB}`}
                      className={cn(
                        "px-1.5 py-0.5 rounded text-[10px] font-bold border inline-block",
                        metricB.errorCount === 0
                          ? "bg-emerald-950/80 text-emerald-300 border-emerald-800"
                          : "bg-rose-950/80 text-rose-300 border-rose-800"
                      )}
                    >
                      {errorRateB}% ({metricB.errorCount} err)
                    </AnimatedBadge>
                  </td>
                  <td className="py-2.5 px-3.5 text-right">
                    <AnimatedBadge
                      badgeKey={`${metricA.errorCount === 0 && metricB.errorCount === 0}-${isAErrorWinner}-${isBErrorWinner}-${errorRateDiff}`}
                      className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-bold border inline-block",
                        metricA.errorCount === 0 && metricB.errorCount === 0
                          ? "bg-emerald-950/90 text-emerald-300 border-emerald-700"
                          : isAErrorWinner
                          ? "bg-purple-950/90 text-purple-300 border-purple-700"
                          : isBErrorWinner
                          ? "bg-cyan-950/90 text-cyan-300 border-cyan-700"
                          : "bg-rose-950/90 text-rose-300 border-rose-700"
                      )}
                    >
                      {metricA.errorCount === 0 && metricB.errorCount === 0
                        ? '🛡️ Perfect Parity (0 Errors)'
                        : isAErrorWinner
                        ? `${agentA?.name} Lower Error (${errorRateDiff}% adv)`
                        : isBErrorWinner
                        ? `${agentB?.name} Lower Error (${errorRateDiff}% adv)`
                        : 'Equal Error Count'}
                    </AnimatedBadge>
                  </td>
                </tr>

                {/* Row: Throughput */}
                <tr className="hover:bg-gray-900/30 transition-colors">
                  <td className="py-2.5 px-3.5 text-gray-300 font-sans font-medium flex items-center space-x-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Generation Throughput</span>
                  </td>
                  <td className="py-2.5 px-3.5 font-semibold text-amber-300"><AnimatedValue value={metricA.tokensPerSec} unit=" t/s" /></td>
                  <td className="py-2.5 px-3.5 font-semibold text-amber-300"><AnimatedValue value={metricB.tokensPerSec} unit=" t/s" /></td>
                  <td className="py-2.5 px-3.5 text-right">
                    <AnimatedBadge
                      badgeKey={`${isAThroughputWinner}-${isBThroughputWinner}-${tpsDelta}`}
                      className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-bold border inline-block",
                        isAThroughputWinner
                          ? "bg-purple-950/90 text-purple-300 border-purple-700"
                          : isBThroughputWinner
                          ? "bg-cyan-950/90 text-cyan-300 border-cyan-700"
                          : "bg-gray-800 text-gray-400 border-gray-700"
                      )}
                    >
                      {isAThroughputWinner
                        ? `${agentA?.name} +${tpsDelta} t/s (+${tpsPercent}%)`
                        : isBThroughputWinner
                        ? `${agentB?.name} +${Math.abs(parseFloat(tpsDelta))} t/s (+${tpsPercent}%)`
                        : 'Identical Speed'}
                    </AnimatedBadge>
                  </td>
                </tr>

                {/* Row: Token per Task */}
                <tr className="hover:bg-gray-900/30 transition-colors">
                  <td className="py-2.5 px-3.5 text-gray-300 font-sans font-medium flex items-center space-x-1.5">
                    <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Tokens per Completed Task</span>
                  </td>
                  <td className="py-2.5 px-3.5 text-gray-200"><AnimatedValue value={tokensPerTaskA} unit=" tok/task" /></td>
                  <td className="py-2.5 px-3.5 text-gray-200"><AnimatedValue value={tokensPerTaskB} unit=" tok/task" /></td>
                  <td className="py-2.5 px-3.5 text-right">
                    <AnimatedBadge
                      badgeKey={`${tokensPerTaskA < tokensPerTaskB}-${tokensPerTaskB < tokensPerTaskA}-${tokenPerTaskDelta}`}
                      className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-bold border inline-block",
                        tokensPerTaskA < tokensPerTaskB
                          ? "bg-purple-950/90 text-purple-300 border-purple-700"
                          : tokensPerTaskB < tokensPerTaskA
                          ? "bg-cyan-950/90 text-cyan-300 border-cyan-700"
                          : "bg-gray-800 text-gray-400 border-gray-700"
                      )}
                    >
                      {tokensPerTaskA < tokensPerTaskB
                        ? `${agentA?.name} -${tokenPerTaskDelta} tok (Leaner)`
                        : tokensPerTaskB < tokensPerTaskA
                        ? `${agentB?.name} -${tokenPerTaskDelta} tok (Leaner)`
                        : 'Equal Token Usage'}
                    </AnimatedBadge>
                  </td>
                </tr>

                {/* Row: Sampling Temperature */}
                <tr className="hover:bg-gray-900/30 transition-colors">
                  <td className="py-2.5 px-3.5 text-gray-300 font-sans font-medium flex items-center space-x-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span>Temperature / Mode</span>
                  </td>
                  <td className="py-2.5 px-3.5 text-amber-400">{(agentA?.temperature ?? 0.7).toFixed(2)}</td>
                  <td className="py-2.5 px-3.5 text-amber-400">{(agentB?.temperature ?? 0.7).toFixed(2)}</td>
                  <td className="py-2.5 px-3.5 text-right">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-gray-900 text-gray-300 border-gray-800 inline-block">
                      {parseFloat(tempDelta) > 0 ? `${agentA?.name} +${tempDelta} more exploratory` : parseFloat(tempDelta) < 0 ? `${agentB?.name} +${Math.abs(parseFloat(tempDelta))} more exploratory` : 'Identical Temp'}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Hyperparameters & Sampling Comparison Matrix */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center space-x-1.5">
              <Sliders className="w-3.5 h-3.5 text-purple-400" />
              <span>Hyperparameters & Sampling Configuration</span>
            </h4>
          </div>

          <div className="bg-gray-950/80 border border-gray-800 rounded-xl overflow-hidden text-xs divide-y divide-gray-800/80">
            
            {/* Row 1: Temperature */}
            <div className="p-3.5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={cn(
                "p-3 rounded-lg border flex flex-col justify-between space-y-2",
                highlightDiffs && agentA?.temperature !== agentB?.temperature ? "border-amber-900/60 bg-amber-950/10" : "border-gray-800 bg-gray-900/40"
              )}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-gray-400 flex items-center space-x-1">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span>Temperature (Creativity)</span>
                  </span>
                  <span className="font-mono font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-900">
                    {(agentA?.temperature ?? 0.7).toFixed(2)}
                  </span>
                </div>
                
                {/* Progress bar */}
                <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-amber-500 h-full rounded-full" 
                    style={{ width: `${(agentA?.temperature ?? 0.7) * 100}%` }}
                  />
                </div>

                <div className="text-[10px] text-gray-400">
                  {getTempDescription(agentA?.temperature ?? 0.7).text}
                </div>
              </div>

              <div className={cn(
                "p-3 rounded-lg border flex flex-col justify-between space-y-2",
                highlightDiffs && agentA?.temperature !== agentB?.temperature ? "border-amber-900/60 bg-amber-950/10" : "border-gray-800 bg-gray-900/40"
              )}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-gray-400 flex items-center space-x-1">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span>Temperature (Creativity)</span>
                  </span>
                  <span className="font-mono font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-900">
                    {(agentB?.temperature ?? 0.7).toFixed(2)}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-amber-500 h-full rounded-full" 
                    style={{ width: `${(agentB?.temperature ?? 0.7) * 100}%` }}
                  />
                </div>

                <div className="text-[10px] text-gray-400">
                  {getTempDescription(agentB?.temperature ?? 0.7).text}
                </div>
              </div>
            </div>

            {/* Row 2: Top-P & Max Tokens */}
            <div className="p-3.5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Top-P Nucleus:</span>
                  <span className="font-mono font-bold text-purple-300">{(agentA?.topP ?? 0.9).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Max Token Allowance:</span>
                  <span className="font-mono font-bold text-cyan-300">{agentA?.maxTokens ?? 4096} tokens</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">System Prompt Size:</span>
                  <span className="font-mono text-gray-300">{(agentA?.systemPrompt || '').length} chars</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Top-P Nucleus:</span>
                  <span className="font-mono font-bold text-purple-300">{(agentB?.topP ?? 0.9).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Max Token Allowance:</span>
                  <span className="font-mono font-bold text-cyan-300">{agentB?.maxTokens ?? 4096} tokens</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">System Prompt Size:</span>
                  <span className="font-mono text-gray-300">{(agentB?.systemPrompt || '').length} chars</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* System Instructions Prompt Side-by-Side */}
        <div className="bg-gray-950/90 border border-gray-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-purple-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-200">
                System Instructions & Role Prompts
              </h4>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setExpandedPrompts(!expandedPrompts)}
                className="text-xs text-purple-400 hover:text-purple-300 font-medium hover:underline flex items-center space-x-1"
              >
                <span>{expandedPrompts ? 'Collapse Prompts' : 'Expand Full Text'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Prompt A */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span className="font-semibold text-purple-300">{agentA?.name} Role Prompt</span>
                <button
                  onClick={() => copyToClipboard(agentA?.systemPrompt || '', `${agentA?.name} Prompt`)}
                  className="hover:text-purple-300 flex items-center space-x-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </button>
              </div>

              <pre className={cn(
                "p-3 bg-gray-900 border border-gray-800 rounded-lg font-mono text-[11px] text-gray-300 whitespace-pre-wrap leading-relaxed overflow-y-auto",
                expandedPrompts ? "max-h-96" : "max-h-36"
              )}>
                {agentA?.systemPrompt || 'No system prompt defined.'}
              </pre>
            </div>

            {/* Prompt B */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span className="font-semibold text-cyan-300">{agentB?.name} Role Prompt</span>
                <button
                  onClick={() => copyToClipboard(agentB?.systemPrompt || '', `${agentB?.name} Prompt`)}
                  className="hover:text-cyan-300 flex items-center space-x-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </button>
              </div>

              <pre className={cn(
                "p-3 bg-gray-900 border border-gray-800 rounded-lg font-mono text-[11px] text-gray-300 whitespace-pre-wrap leading-relaxed overflow-y-auto",
                expandedPrompts ? "max-h-96" : "max-h-36"
              )}>
                {agentB?.systemPrompt || 'No system prompt defined.'}
              </pre>
            </div>

          </div>
        </div>

        {/* Architectural Synthesis & Trade-off Insights */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-purple-950/30 via-gray-950/80 to-cyan-950/30 border border-purple-900/40 text-xs space-y-2">
          <div className="flex items-center space-x-2 text-purple-300 font-bold">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>Architectural Synthesis & Operational Fit</span>
          </div>

          <p className="text-gray-300 leading-relaxed">
            <strong className="text-purple-300">{agentA?.name} ({agentA?.role})</strong> is calibrated with 
            temperature <span className="font-mono text-amber-400">{agentA?.temperature?.toFixed(2)}</span> ({getTempDescription(agentA?.temperature ?? 0.7).text.toLowerCase()}), 
            averaging <span className="font-mono text-blue-300">{metricA.avgCompletionTimeMs}ms</span> latency.
            Meanwhile, <strong className="text-cyan-300">{agentB?.name} ({agentB?.role})</strong> operates at 
            temperature <span className="font-mono text-amber-400">{agentB?.temperature?.toFixed(2)}</span> with 
            throughput of <span className="font-mono text-amber-300">{metricB.tokensPerSec} t/s</span>.
          </p>
        </div>

      </div>

      {/* Save Template Dialog */}
      {savingTemplateAgent && (
        <SaveTemplateDialog
          isOpen={!!savingTemplateAgent}
          onClose={() => setSavingTemplateAgent(null)}
          initialData={savingTemplateAgent}
          onSaved={(savedTmpl) => {
            addToast({
              title: '💾 Archetype Template Saved',
              message: `Configuration template "${savedTmpl.name}" saved to template library.`,
              type: 'success'
            });
          }}
        />
      )}

    </div>
  );
}
