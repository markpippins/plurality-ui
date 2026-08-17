import { ActiveAgent, AgentLogEntry, PerformanceMetricsSummary, HeatmapDataCell, HeatmapTimeGranularity, HeatmapMetricMode } from '../types';

export interface HeatmapSessionSummary {
  cells: HeatmapDataCell[];
  agents: ActiveAgent[];
  timeBuckets: {
    index: number;
    label: string;
    timeStart: Date;
    timeEnd: Date;
    totalComputePct: number;
    totalTokens: number;
    totalTasks: number;
    avgLatencyMs: number;
    errorCount: number;
  }[];
  agentSummaries: {
    agentId: string;
    agentName: string;
    agentRole: string;
    agentAvatarUrl?: string;
    flavor?: 'leased' | 'harness';
    model?: string;
    totalTasks: number;
    totalTokens: number;
    avgComputeLoadPct: number;
    avgLatencyMs: number;
    totalErrors: number;
    peakComputePct: number;
  }[];
  clusterStats: {
    totalSessionDurationMinutes: number;
    totalTasksExecuted: number;
    totalTokensConsumed: number;
    avgClusterUtilizationPct: number;
    peakComputeTimestamp: string;
    peakComputeAgentName: string;
    activeAgentsCount: number;
    totalErrorsRecorded: number;
  };
}

export function generateSessionHeatmapData(
  agents: ActiveAgent[],
  logs: AgentLogEntry[],
  metrics: PerformanceMetricsSummary,
  granularity: HeatmapTimeGranularity = '30s',
  totalBuckets: number = 24
): HeatmapSessionSummary {
  // Determine duration per bucket in seconds
  let bucketDurationSec = 30;
  if (granularity === '10s') bucketDurationSec = 10;
  else if (granularity === '30s') bucketDurationSec = 30;
  else if (granularity === '1m') bucketDurationSec = 60;
  else if (granularity === '5m') bucketDurationSec = 300;

  const now = new Date();
  const sessionStart = new Date(now.getTime() - totalBuckets * bucketDurationSec * 1000);

  // Fallback if agents list is empty
  const activeAgentList = agents.length > 0 ? agents : [
    { id: 'a1', name: 'Planner', role: 'Architect', status: 'idle', flavor: 'harness', model: 'claude-3-5-sonnet' },
    { id: 'a2', name: 'Critic', role: 'Reviewer', status: 'idle', flavor: 'harness', model: 'gpt-4o' },
    { id: 'a3', name: 'Coder', role: 'Builder', status: 'working', flavor: 'harness', model: 'claude-3-5-sonnet' },
    { id: 'a4', name: 'Validator', role: 'QA & Compliance', status: 'idle', flavor: 'harness', model: 'gpt-4o' },
  ] as ActiveAgent[];

  const timeBuckets: HeatmapSessionSummary['timeBuckets'] = [];
  for (let i = 0; i < totalBuckets; i++) {
    const bStart = new Date(sessionStart.getTime() + i * bucketDurationSec * 1000);
    const bEnd = new Date(bStart.getTime() + bucketDurationSec * 1000);

    const pad = (n: number) => n.toString().padStart(2, '0');
    const label = `${pad(bStart.getMinutes())}:${pad(bStart.getSeconds())}`;

    timeBuckets.push({
      index: i,
      label,
      timeStart: bStart,
      timeEnd: bEnd,
      totalComputePct: 0,
      totalTokens: 0,
      totalTasks: 0,
      avgLatencyMs: 0,
      errorCount: 0,
    });
  }

  // Pre-seed agent base profiles for natural simulation telemetry
  const agentProfiles: Record<string, { baseLoad: number; tokenMultiplier: number; latencyBase: number; errorWeight: number; defaultActions: string[] }> = {
    a1: { baseLoad: 45, tokenMultiplier: 1.2, latencyBase: 1350, errorWeight: 0.02, defaultActions: ['DECOMPOSE_DAG', 'SYNTHESIZE_GOAL', 'SPECIFY_CONTRACT'] },
    a2: { baseLoad: 35, tokenMultiplier: 0.8, latencyBase: 920, errorWeight: 0.01, defaultActions: ['SECURITY_AUDIT', 'VALIDATE_CRITIQUE', 'CHECK_RISK'] },
    a3: { baseLoad: 75, tokenMultiplier: 1.8, latencyBase: 2280, errorWeight: 0.08, defaultActions: ['CODE_GENERATE', 'APPLY_AST_DIFF', 'REFRACTOR_MODULE', 'COMPILE_CHECK'] },
    a4: { baseLoad: 40, tokenMultiplier: 0.9, latencyBase: 1090, errorWeight: 0.03, defaultActions: ['LINT_VERIFY', 'EXECUTE_UNIT_TEST', 'COMPLIANCE_SIGN'] },
    a5: { baseLoad: 50, tokenMultiplier: 1.1, latencyBase: 1200, errorWeight: 0.02, defaultActions: ['SCHEMA_CONTRACT', 'INTERFACE_DESIGN', 'MODULAR_BOUND'] },
    a6: { baseLoad: 65, tokenMultiplier: 1.5, latencyBase: 1950, errorWeight: 0.05, defaultActions: ['ALGO_OPTIMIZE', 'TREE_REWRITE', 'CONCURRENCY_TUNE'] },
    a7: { baseLoad: 30, tokenMultiplier: 0.7, latencyBase: 880, errorWeight: 0.01, defaultActions: ['VULN_SCAN', 'SANITIZE_INPUT', 'DEPENDENCY_AUDIT'] },
    a8: { baseLoad: 38, tokenMultiplier: 0.85, latencyBase: 1050, errorWeight: 0.02, defaultActions: ['ONTOLOGY_MAP', 'SCHEMA_CHECK', 'TYPE_ASSERT'] },
    a9: { baseLoad: 55, tokenMultiplier: 1.4, latencyBase: 2800, errorWeight: 0.03, defaultActions: ['LOGICAL_INFERENCE', 'PROOF_AUDIT', 'ASSERTION_CHECK'] },
    a10: { baseLoad: 28, tokenMultiplier: 0.65, latencyBase: 840, errorWeight: 0.01, defaultActions: ['AUDIT_TRAIL_LOG', 'POLICY_MONITOR', 'GOVERNANCE_SEAL'] },
    a11: { baseLoad: 60, tokenMultiplier: 1.3, latencyBase: 1650, errorWeight: 0.04, defaultActions: ['MIGRATION_EXEC', 'QUERY_PLAN_OPT', 'INDEX_REINDEX'] },
    a12: { baseLoad: 42, tokenMultiplier: 0.95, latencyBase: 1150, errorWeight: 0.02, defaultActions: ['TOPOLOGY_INVARIANT', 'CYCLE_DETECT', 'ROUTING_TABLE'] },
  };

  const cells: HeatmapDataCell[] = [];

  activeAgentList.forEach((agent, agentIdx) => {
    const profile = agentProfiles[agent.id] || {
      baseLoad: 40,
      tokenMultiplier: 1.0,
      latencyBase: 1200,
      errorWeight: 0.03,
      defaultActions: ['PROCESS_SUBTASK', 'COMMUNICATE_STATE']
    };

    timeBuckets.forEach((bucket, bIdx) => {
      // Create organic multi-wave variation using sinusoidal phase interference
      const wave1 = Math.sin((bIdx + agentIdx * 2.3) * 0.55);
      const wave2 = Math.cos((bIdx * 1.2 - agentIdx * 1.8) * 0.4);
      const burstFactor = Math.abs(wave1 * 0.6 + wave2 * 0.4);

      // Tasks count in bucket (0 to 4 tasks)
      let taskCount = Math.round(burstFactor * 3.2);
      if (bIdx === totalBuckets - 1 && agent.status === 'working') taskCount = Math.max(1, taskCount);

      // Compute load percentage (0 - 98%)
      let computeLoadPct = Math.min(98, Math.max(2, Math.round(profile.baseLoad * (0.4 + burstFactor * 1.1))));
      if (taskCount === 0 && burstFactor < 0.25) {
        computeLoadPct = Math.floor(Math.random() * 8) + 2; // idle baseline
      }

      // Tokens calculation
      const baseTokens = Math.round(computeLoadPct * 28 * profile.tokenMultiplier);
      const promptTokens = Math.round(baseTokens * 0.68);
      const completionTokens = baseTokens - promptTokens;
      const tokensUsed = promptTokens + completionTokens;

      // Latency calculation
      const latencyVariation = Math.sin(bIdx + agentIdx) * 220;
      const avgLatencyMs = Math.max(280, Math.round(profile.latencyBase + latencyVariation + (computeLoadPct > 70 ? 450 : 0)));

      // Error count
      const isError = (burstFactor > 0.85 && Math.random() < profile.errorWeight * 3) ? 1 : 0;
      const errorCount = isError;

      // CPU & Memory
      const cpuPct = Math.min(100, Math.max(5, Math.round(computeLoadPct * 0.9 + Math.random() * 10)));
      const memoryMb = Math.round(180 + computeLoadPct * 3.4 + agentIdx * 25);

      // Active actions in this slice
      const actionsCount = Math.max(1, Math.min(3, taskCount));
      const activeActions: string[] = [];
      for (let k = 0; k < actionsCount; k++) {
        const actName = profile.defaultActions[(bIdx + k) % profile.defaultActions.length];
        activeActions.push(actName);
      }

      // State
      let dominantState: HeatmapDataCell['dominantState'] = 'idle';
      if (errorCount > 0) dominantState = 'error';
      else if (computeLoadPct > 65 || taskCount > 1) dominantState = 'working';
      else if (computeLoadPct > 20) dominantState = 'waiting';

      // Normalized density score (0.0 to 1.0)
      const densityScore = Number(Math.min(1.0, Math.max(0.02, (
        (computeLoadPct / 100) * 0.45 +
        (Math.min(taskCount, 4) / 4) * 0.30 +
        (Math.min(tokensUsed, 4000) / 4000) * 0.25
      ))).toFixed(3));

      const cell: HeatmapDataCell = {
        agentId: agent.id,
        agentName: agent.name,
        agentRole: agent.role,
        agentAvatarUrl: agent.avatarUrl,
        flavor: agent.flavor,
        model: agent.model,
        bucketIndex: bIdx,
        bucketLabel: bucket.label,
        timeStart: bucket.timeStart.toISOString(),
        timeEnd: bucket.timeEnd.toISOString(),
        taskCount,
        computeLoadPct,
        tokensUsed,
        promptTokens,
        completionTokens,
        avgLatencyMs,
        errorCount,
        cpuPct,
        memoryMb,
        activeActions,
        dominantState,
        densityScore,
      };

      cells.push(cell);

      // Accumulate into time bucket aggregates
      bucket.totalComputePct += computeLoadPct;
      bucket.totalTokens += tokensUsed;
      bucket.totalTasks += taskCount;
      bucket.avgLatencyMs += avgLatencyMs;
      bucket.errorCount += errorCount;
    });
  });

  // Normalize time bucket averages
  timeBuckets.forEach(b => {
    b.avgLatencyMs = activeAgentList.length > 0 ? Math.round(b.avgLatencyMs / activeAgentList.length) : 0;
    b.totalComputePct = activeAgentList.length > 0 ? Math.round(b.totalComputePct / activeAgentList.length) : 0;
  });

  // Calculate agent-level aggregates
  const agentSummaries: HeatmapSessionSummary['agentSummaries'] = activeAgentList.map(agent => {
    const agentCells = cells.filter(c => c.agentId === agent.id);
    const totalTasks = agentCells.reduce((acc, c) => acc + c.taskCount, 0);
    const totalTokens = agentCells.reduce((acc, c) => acc + c.tokensUsed, 0);
    const avgComputeLoadPct = Math.round(agentCells.reduce((acc, c) => acc + c.computeLoadPct, 0) / (agentCells.length || 1));
    const avgLatencyMs = Math.round(agentCells.reduce((acc, c) => acc + c.avgLatencyMs, 0) / (agentCells.length || 1));
    const totalErrors = agentCells.reduce((acc, c) => acc + c.errorCount, 0);
    const peakComputePct = Math.max(...agentCells.map(c => c.computeLoadPct), 0);

    return {
      agentId: agent.id,
      agentName: agent.name,
      agentRole: agent.role,
      agentAvatarUrl: agent.avatarUrl,
      flavor: agent.flavor,
      model: agent.model,
      totalTasks,
      totalTokens,
      avgComputeLoadPct,
      avgLatencyMs,
      totalErrors,
      peakComputePct,
    };
  });

  // Cluster stats
  const totalTasksExecuted = cells.reduce((acc, c) => acc + c.taskCount, 0);
  const totalTokensConsumed = cells.reduce((acc, c) => acc + c.tokensUsed, 0);
  const totalErrorsRecorded = cells.reduce((acc, c) => acc + c.errorCount, 0);
  const avgClusterUtilizationPct = Math.round(cells.reduce((acc, c) => acc + c.computeLoadPct, 0) / (cells.length || 1));

  let maxLoadCell = cells[0];
  cells.forEach(c => {
    if (c.computeLoadPct > (maxLoadCell?.computeLoadPct || 0)) {
      maxLoadCell = c;
    }
  });

  return {
    cells,
    agents: activeAgentList,
    timeBuckets,
    agentSummaries,
    clusterStats: {
      totalSessionDurationMinutes: Math.round((totalBuckets * bucketDurationSec) / 60),
      totalTasksExecuted,
      totalTokensConsumed,
      avgClusterUtilizationPct,
      peakComputeTimestamp: maxLoadCell?.bucketLabel || '00:00',
      peakComputeAgentName: maxLoadCell?.agentName || 'Coder',
      activeAgentsCount: activeAgentList.length,
      totalErrorsRecorded,
    }
  };
}

export function getHeatmapMetricValue(cell: HeatmapDataCell, metric: HeatmapMetricMode): number {
  switch (metric) {
    case 'compute': return cell.computeLoadPct;
    case 'tasks': return cell.taskCount;
    case 'tokens': return cell.tokensUsed;
    case 'latency': return cell.avgLatencyMs;
    case 'errors': return cell.errorCount;
    case 'density': return cell.densityScore * 100;
    default: return cell.computeLoadPct;
  }
}

export function formatHeatmapMetricDisplay(value: number, metric: HeatmapMetricMode): string {
  switch (metric) {
    case 'compute': return `${value}%`;
    case 'tasks': return `${value} tasks`;
    case 'tokens': return `${value.toLocaleString()} tok`;
    case 'latency': return `${value}ms`;
    case 'errors': return `${value} err`;
    case 'density': return `${value.toFixed(1)} pts`;
    default: return `${value}`;
  }
}
