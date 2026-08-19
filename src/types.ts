export interface ProviderConfig {
  id: string;
  name: string;
  models: string[];
}

export interface Workspace {
  id: string;
  name: string;
  description: string;
}

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  content?: string;
  isOpen?: boolean;
}

export type Role = 'user' | 'architect' | 'builder' | 'system';

export type AppTheme = 'steel' | 'dark' | 'light';

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export interface DecisionCardOption {
  id: string;
  label: string;
  description: string;
  impact?: {
    latency?: string;
    complexity?: 'Low' | 'Medium' | 'High';
    security?: string;
    resilience?: string;
    score?: number;
  };
  recommended?: boolean;
}

export interface DecisionCard {
  id: string;
  title: string;
  description: string;
  category?: 'architecture' | 'implementation' | 'schema' | 'security' | 'library';
  options: DecisionCardOption[];
  selectedOptionId?: string | null;
  status: 'pending' | 'resolved' | 'dismissed';
}

export interface DualityMessage {
  id: string;
  sender: 'user' | 'primary_agent';
  role: string;
  agentName?: string;
  agentId?: string;
  model?: string;
  content: string;
  decisionCards?: DecisionCard[];
  timestamp: Date;
  isStreaming?: boolean;
  latencyMs?: number;
  tokensUsed?: number;
  promptTokens?: number;
  completionTokens?: number;
  tokensPerSec?: number;
}

export interface InterAgentDialogMessage {
  id: string;
  senderAgentId: string;
  senderName: string;
  senderRole: string;
  recipientAgentId: string;
  recipientName: string;
  recipientRole: string;
  type: 'spec_handoff' | 'clarification' | 'code_proposal' | 'review_feedback' | 'validation_ack' | 'tool_call';
  content: string;
  codeSnippet?: {
    filename: string;
    language: string;
    code: string;
  };
  diffSummary?: {
    added: number;
    removed: number;
    file: string;
  };
  status?: 'delivered' | 'processing' | 'approved' | 'rejected';
  timestamp: Date;
  latencyMs?: number;
  tokensUsed?: number;
  promptTokens?: number;
  completionTokens?: number;
  tokensPerSec?: number;
}

export interface DualityTurnMetric {
  turnId: string;
  timestamp: Date;
  role: string;
  agentName: string;
  agentId: string;
  model: string;
  action: string;
  latencyMs: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  tokensPerSec: number;
  status: 'success' | 'warn' | 'error';
}

export interface DualityAgentMetric {
  agentId: string;
  role: string;
  agentName: string;
  model: string;
  turnsCount: number;
  lastLatencyMs: number;
  avgLatencyMs: number;
  minLatencyMs: number;
  maxLatencyMs: number;
  totalTokensUsed: number;
  promptTokens: number;
  completionTokens: number;
  tokensPerSec: number;
  cacheHitPct: number;
  estimatedCostUsd: number;
  slaTargetMs: number;
  status: 'idle' | 'working' | 'ready';
  latencyHistory: number[];
  tokensHistory: number[];
}

export interface DualityPerformanceMetrics {
  primary: DualityAgentMetric;
  secondary: DualityAgentMetric;
  totalSessionTokens: number;
  totalSessionCostUsd: number;
  totalTurns: number;
  lastUpdated: string;
  recentTurns: DualityTurnMetric[];
  benchmarkRunning?: boolean;
}

export interface BuilderTraceEvent {
  id: string;
  timestamp: Date;
  step: string;
  agent: string;
  action: string;
  details: string;
  status: 'success' | 'running' | 'warning' | 'error';
  durationMs?: number;
  tokensUsed?: number;
  promptTokens?: number;
  completionTokens?: number;
  toolUsed?: string;
}

export interface DualityState {
  enabled: boolean;
  primaryRole: string;
  primaryModel: string;
  primaryAgentId: string;
  secondaryRole: string;
  secondaryModel: string;
  secondaryAgentId: string;
  isExecuting: boolean;
  userMessages: DualityMessage[];
  interAgentDialog: InterAgentDialogMessage[];
  builderTrace: BuilderTraceEvent[];
  performanceMetrics?: DualityPerformanceMetrics;
}

export type WorkspaceLayoutMode = 'default' | 'analysis' | 'execution' | 'debugging' | 'duality' | 'queue' | 'metrics';

export interface WorkspaceLayoutConfig {
  mode: WorkspaceLayoutMode;
  showWorkRequests: boolean;
  showTimeline: boolean;
  showTerminal: boolean;
  showFileTree: boolean;
  showLogDrawer: boolean;
  showTaskQueue?: boolean;
  planPanelExpanded?: boolean;
  executionPanelExpanded?: boolean;
}

export interface AgentLog {
  id: string;
  agent: 'architect' | 'builder';
  action: string;
  details: string;
  status: 'pending' | 'success' | 'error';
  timestamp: Date;
}

export type AppState = 'NEW' | 'PLAN' | 'REVIEW' | 'APPROVAL' | 'SPEC' | 'EXEC' | 'VALIDATE' | 'FAILED';

export interface WorkRequestStep {
  step_id: string;
  description: string;
  dependencies: string[];
  outputs: string[];
  type: string;
}

export interface WorkRequestDetail {
  id: string;
  version: number;
  intent: {
    problem_statement: string;
    desired_outcome: string;
    domain: string;
    priority: 'low' | 'medium' | 'high' | 'critical' | string;
    user_intent_trace: string;
    abstraction_level: string;
  };
  decomposition: {
    strategy: string;
    steps: WorkRequestStep[];
    parallelism_model: string;
    recursion_allowed: boolean;
  };
  requirements: {
    functional: string[];
    non_functional: string[];
    system_requirements: string[];
    tool_requirements: string[];
  };
  constraints: {
    forbidden_actions: string[];
    safety_constraints: string[];
    resource_limits: any;
    architectural_constraints: string[];
  };
  success_criteria: {
    validation_rules: string[];
    acceptance_tests: string[];
    completion_conditions: string[];
    failure_modes: string[];
  };
  execution_state: {
    status: 'pending' | 'running' | 'completed' | 'failed' | 'paused' | string;
    current_step: string;
    progress: number;
    retries: number;
    error_state: string | null;
    context_snapshot_ref: string | null;
    last_updated: string;
  };
  lineage: {
    derived_from: string[];
    supersedes: string | null;
    branches: string[];
    merge_history: string[];
  };
  artifacts: {
    produced_files: string[];
    intermediate_outputs: string[];
  };
  metadata: {
    created_at: string;
    updated_at: string;
    agent_id: string;
    mode: string;
    tags: string[];
    role: string;
    harness: string;
    model: string;
    session_id: string;
  };
  path: string;
}

export type TaskPriority = 'Low' | 'Medium' | 'High';

export interface WorkRequest {
  id: string;
  intent: string;
  status: AppState;
  created_at: Date;
  priority?: TaskPriority;
  detail?: WorkRequestDetail;
  rawPayload?: Record<string, any>;
}

export function buildDefaultWorkRequestDetail(id: string, intentStr: string, statusStr: AppState, priority: TaskPriority = 'Medium'): WorkRequestDetail {
  const nowStr = new Date().toISOString();
  const lowerPriority = priority.toLowerCase() as 'low' | 'medium' | 'high';
  return {
    id: id.startsWith('wr-') ? id : `wr-${id}`,
    version: 1,
    intent: {
      problem_statement: intentStr,
      desired_outcome: `Execute workflow task: ${intentStr}`,
      domain: 'nexus',
      priority: lowerPriority,
      user_intent_trace: '0086',
      abstraction_level: 'task'
    },
    decomposition: {
      strategy: 'Direct implementation of plan steps',
      steps: [
        {
          step_id: 'step_1',
          description: `Plan ${id}: ${intentStr}\n\nGoal: Execute work request pipeline.\n\nContent:\n\nAcceptance criteria:\n- Implementation verified\n- Code tests passing`,
          dependencies: [],
          outputs: ['changes_committed'],
          type: 'execution'
        }
      ],
      parallelism_model: 'sequential',
      recursion_allowed: false
    },
    requirements: {
      functional: ['Execute model chain pipeline', 'Generate verified artifacts'],
      non_functional: ['Complete execution safely within resource limits'],
      system_requirements: ['Linux environment', 'Conduit agent harness'],
      tool_requirements: ['opencode harness', 'ollama provider', 'qwen2.5-coder:latest']
    },
    constraints: {
      forbidden_actions: ['Do not modify root environment variables', 'Do not compromise safety policies'],
      safety_constraints: [
        'Do not delete or overwrite historical plan artifacts',
        'Do not modify .conduit-data/ directory structure',
        'Preserve existing receipt and audit records',
        'Follow existing project conventions when editing code'
      ],
      resource_limits: null,
      architectural_constraints: ['Operate within workspace boundary']
    },
    success_criteria: {
      validation_rules: ['Verify generated code files', 'Check static type correctness'],
      acceptance_tests: ['Run automated unit test suite'],
      completion_conditions: ['Outputs match changes_committed'],
      failure_modes: [
        'Files affected list does not match actual changes',
        'Acceptance criteria not satisfied',
        'Typecheck or tests fail'
      ]
    },
    execution_state: {
      status: statusStr === 'NEW' ? 'pending' : (statusStr === 'EXEC' || statusStr === 'PLAN') ? 'running' : statusStr === 'VALIDATE' ? 'completed' : statusStr === 'FAILED' ? 'failed' : 'pending',
      current_step: 'step_1',
      progress: statusStr === 'NEW' ? 0.0 : statusStr === 'VALIDATE' ? 1.0 : statusStr === 'FAILED' ? 0.4 : 0.5,
      retries: statusStr === 'FAILED' ? 2 : 0,
      error_state: statusStr === 'FAILED' ? 'Typecheck failed in step 1' : null,
      context_snapshot_ref: null,
      last_updated: nowStr
    },
    lineage: {
      derived_from: ['0133'],
      supersedes: null,
      branches: [],
      merge_history: []
    },
    artifacts: {
      produced_files: ['/src/App.tsx', '/src/components/WorkRequestDetailModal.tsx'],
      intermediate_outputs: ['plan_ir_0133.json', 'spec_ir_0133.json']
    },
    metadata: {
      created_at: nowStr,
      updated_at: nowStr,
      agent_id: 'conduit',
      mode: 'default',
      tags: ['plan-migration', 'builder', 'nexus'],
      role: 'builder',
      harness: 'opencode',
      model: 'qwen2.5-coder:latest',
      session_id: `builder-${Date.now()}`
    },
    path: '/home/codex/dev/nexus'
  };
}

export interface PlanStep {
  id: string;
  name: string;
  description: string;
  risk_level: 'low' | 'medium' | 'high';
}

export interface PlanIR {
  id: string;
  goal: string;
  steps: PlanStep[];
  risks: string[];
  assumptions: string[];
}

export interface CritiqueIssue {
  severity: string;
  description: string;
}

export interface CritiqueIR {
  id: string;
  issues: CritiqueIssue[];
  risk_score: number;
  recommendation: 'approve' | 'revise' | 'reject';
}

export interface SpecIR {
  id: string;
  details: string;
}

export interface ExecutionStep {
  step_id: string;
  result: string;
  status: 'success' | 'error' | 'pending';
}

export interface TraceEvent {
  id: string;
  event_type: 'enter' | 'exit' | 'error' | 'retry';
  message: string;
  timestamp: Date;
}

export interface ExecutionIR {
  id: string;
  steps: ExecutionStep[];
  trace: TraceEvent[];
}

export interface ValidationScores {
  intent_alignment: number;
  compliance: number;
  correctness: number;
}

export interface ValidationIR {
  id: string;
  scores: ValidationScores;
  recommendation: 'complete' | 'retry' | 'replan';
}

export interface TransitionEvent {
  from: AppState;
  to: AppState;
  timestamp: Date;
}

export interface Artifact {
  id: string;
  type: string;
  data: any;
  lineage: string[];
}

export interface ActiveAgent {
  id: string;
  name: string;
  role: string;
  status: 'idle' | 'working' | 'waiting' | 'error' | 'active';
  activityState?: 'idle' | 'planning' | 'executing' | 'validating' | 'waiting' | 'error';
  flavor?: 'leased' | 'harness';
  model?: string;
  lastActive?: Date;
  avatarUrl?: string;
  systemPrompt?: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  avatarPrompt?: string;
}

export type AgentArchetypeCategory = 
  | 'planning'
  | 'architecture'
  | 'security'
  | 'engineering'
  | 'quality'
  | 'data'
  | 'topology'
  | 'reasoning'
  | 'custom';

export interface AgentConfigTemplate {
  id: string;
  name: string;
  description: string;
  archetype: AgentArchetypeCategory;
  role: string;
  flavor: 'leased' | 'harness';
  systemPrompt: string;
  temperature: number;
  topP: number;
  maxTokens: number;
  avatarPrompt?: string;
  avatarUrl?: string;
  isBuiltIn?: boolean;
  createdAt: string;
  updatedAt?: string;
  tags?: string[];
  recommendedModel?: string;
}

export interface AgentLogEntry {
  id: string;
  agentId: string;
  agentName: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'success' | 'debug';
  action: string;
  details: string;
  metadata?: Record<string, any>;
}

export interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warn' | 'error' | 'agent_state';
  agentId?: string;
  agentName?: string;
  agentRole?: string;
  timestamp: Date;
  duration?: number; // ms, default 4000
  actionLabel?: string;
  onAction?: () => void;
}

export interface AgentVote {
  agentId: string;
  agentName: string;
  agentRole: string;
  avatarUrl?: string;
  vote: 'approve' | 'reject' | 'conditional' | 'abstain';
  confidence: number;
  reasoning: string;
  suggestedAlternative?: string;
  timestamp: Date;
}

export interface RoundtableSession {
  id: string;
  topic: string;
  description?: string;
  workRequestId?: string;
  status: 'voting' | 'passed' | 'rejected' | 'tied';
  votes: AgentVote[];
  approvalRate: number;
  consensusSummary: string;
  createdAt: Date;
  participantAgentIds?: string[];
}

export interface AgentMetricItem {
  agentId: string;
  agentName: string;
  agentRole: string;
  tasksCompleted: number;
  avgCompletionTimeMs: number;
  totalTokensUsed: number;
  promptTokens: number;
  completionTokens: number;
  tokensPerSec: number;
  errorCount: number;
  lastActiveTimestamp?: Date;
}

export interface TaskMetricRecord {
  id: string;
  intent: string;
  durationMs: number;
  tokensUsed: number;
  completedAt: Date;
  status: 'success' | 'failed';
}

export interface PerformanceMetricsSummary {
  totalTasksCompleted: number;
  activeTasksRunning: number;
  avgTaskDurationMs: number;
  lastTaskDurationMs: number;
  totalTokens: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  avgTokensPerSec: number;
  successRatePercent: number;
  agentMetrics: AgentMetricItem[];
  recentTaskHistory: TaskMetricRecord[];
}

export interface TaskLifecycleStageMetric {
  stage: string;
  stageShort: string;
  phaseKey: 'ingest' | 'plan' | 'critique' | 'spec' | 'exec' | 'validate' | 'done';
  agentId: string;
  agentName: string;
  agentRole: string;
  durationMs: number;
  cumulativeDurationMs: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cumulativeTokens: number;
  tokensPerSec: number;
  slaTargetMs: number;
  confidenceScore: number;
  alignmentScore: number;
  riskScore: number;
  status: 'completed' | 'in_progress' | 'pending' | 'warning' | 'failed';
  timestamp: string;
}

export interface TaskLifecyclePerformanceReport {
  taskId: string;
  taskIntent: string;
  totalDurationMs: number;
  totalTokens: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  overallEfficiencyTokPerSec: number;
  status: string;
  stages: TaskLifecycleStageMetric[];
}

export function generateTaskLifecycleMetrics(
  taskId: string, 
  intent: string, 
  currentStatus: AppState | string = 'VALIDATE'
): TaskLifecyclePerformanceReport {
  // Deterministic generator based on task id for realistic stage metrics
  const seed = (taskId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 100;
  
  const planDur = 1100 + (seed * 12);
  const critiqueDur = 850 + (seed * 8);
  const specDur = 720 + (seed * 6);
  const execDur = 1950 + (seed * 20);
  const validateDur = 980 + (seed * 10);

  const planPrompt = 2800 + (seed * 25);
  const planComp = 1200 + (seed * 15);
  
  const critiquePrompt = 1900 + (seed * 18);
  const critiqueComp = 750 + (seed * 10);

  const specPrompt = 2100 + (seed * 20);
  const specComp = 950 + (seed * 12);

  const execPrompt = 3400 + (seed * 35);
  const execComp = 2100 + (seed * 25);

  const valPrompt = 1800 + (seed * 15);
  const valComp = 650 + (seed * 8);

  const rawStages = [
    {
      stage: 'Intent Ingestion',
      stageShort: 'Ingest',
      phaseKey: 'ingest' as const,
      agentId: 'a1',
      agentName: 'Planner',
      agentRole: 'Planner',
      durationMs: 250,
      promptTokens: 800,
      completionTokens: 250,
      tokensPerSec: 160,
      slaTargetMs: 400,
      confidenceScore: 98,
      alignmentScore: 99,
      riskScore: 5,
      activeState: 'PLAN'
    },
    {
      stage: 'Plan Synthesis (IR)',
      stageShort: 'Plan IR',
      phaseKey: 'plan' as const,
      agentId: 'a1',
      agentName: 'Planner',
      agentRole: 'Planner',
      durationMs: planDur,
      promptTokens: planPrompt,
      completionTokens: planComp,
      tokensPerSec: 138,
      slaTargetMs: 1500,
      confidenceScore: 92,
      alignmentScore: 96,
      riskScore: 12,
      activeState: 'PLAN'
    },
    {
      stage: 'Architectural Critique',
      stageShort: 'Review',
      phaseKey: 'critique' as const,
      agentId: 'a2',
      agentName: 'Critic',
      agentRole: 'Reviewer',
      durationMs: critiqueDur,
      promptTokens: critiquePrompt,
      completionTokens: critiqueComp,
      tokensPerSec: 152,
      slaTargetMs: 1200,
      confidenceScore: 95,
      alignmentScore: 94,
      riskScore: 18,
      activeState: 'REVIEW'
    },
    {
      stage: 'Specification Blueprint',
      stageShort: 'Spec',
      phaseKey: 'spec' as const,
      agentId: 'a5',
      agentName: 'Architect',
      agentRole: 'Architect',
      durationMs: specDur,
      promptTokens: specPrompt,
      completionTokens: specComp,
      tokensPerSec: 145,
      slaTargetMs: 1000,
      confidenceScore: 97,
      alignmentScore: 98,
      riskScore: 8,
      activeState: 'SPEC'
    },
    {
      stage: 'Code Implementation',
      stageShort: 'Exec',
      phaseKey: 'exec' as const,
      agentId: 'a3',
      agentName: 'Coder',
      agentRole: 'Builder',
      durationMs: execDur,
      promptTokens: execPrompt,
      completionTokens: execComp,
      tokensPerSec: 116,
      slaTargetMs: 2500,
      confidenceScore: 89,
      alignmentScore: 95,
      riskScore: 22,
      activeState: 'EXEC'
    },
    {
      stage: 'Validation & Tests',
      stageShort: 'Validate',
      phaseKey: 'validate' as const,
      agentId: 'a4',
      agentName: 'Validator',
      agentRole: 'QA & Compliance',
      durationMs: validateDur,
      promptTokens: valPrompt,
      completionTokens: valComp,
      tokensPerSec: 150,
      slaTargetMs: 1400,
      confidenceScore: 99,
      alignmentScore: 99,
      riskScore: 4,
      activeState: 'VALIDATE'
    }
  ];

  let cumulativeDur = 0;
  let cumulativeTok = 0;

  const stages: TaskLifecycleStageMetric[] = rawStages.map((s, idx) => {
    const totalTok = s.promptTokens + s.completionTokens;
    cumulativeDur += s.durationMs;
    cumulativeTok += totalTok;

    // Status based on current app state
    let status: TaskLifecycleStageMetric['status'] = 'completed';
    if (currentStatus === 'PLAN' && idx > 1) status = 'pending';
    else if (currentStatus === 'PLAN' && idx === 1) status = 'in_progress';
    else if (currentStatus === 'REVIEW' && idx > 2) status = 'pending';
    else if (currentStatus === 'REVIEW' && idx === 2) status = 'in_progress';
    else if (currentStatus === 'SPEC' && idx > 3) status = 'pending';
    else if (currentStatus === 'SPEC' && idx === 3) status = 'in_progress';
    else if (currentStatus === 'EXEC' && idx > 4) status = 'pending';
    else if (currentStatus === 'EXEC' && idx === 4) status = 'in_progress';
    else if (currentStatus === 'VALIDATE' && idx > 5) status = 'pending';
    else if (currentStatus === 'VALIDATE' && idx === 5) status = 'in_progress';

    return {
      stage: s.stage,
      stageShort: s.stageShort,
      phaseKey: s.phaseKey,
      agentId: s.agentId,
      agentName: s.agentName,
      agentRole: s.agentRole,
      durationMs: s.durationMs,
      cumulativeDurationMs: cumulativeDur,
      promptTokens: s.promptTokens,
      completionTokens: s.completionTokens,
      totalTokens: totalTok,
      cumulativeTokens: cumulativeTok,
      tokensPerSec: s.tokensPerSec,
      slaTargetMs: s.slaTargetMs,
      confidenceScore: s.confidenceScore,
      alignmentScore: s.alignmentScore,
      riskScore: s.riskScore,
      status,
      timestamp: `+${(cumulativeDur / 1000).toFixed(1)}s`
    };
  });

  const totalDur = cumulativeDur;
  const totalTokens = cumulativeTok;
  const totalPromptTokens = stages.reduce((acc, s) => acc + s.promptTokens, 0);
  const totalCompletionTokens = stages.reduce((acc, s) => acc + s.completionTokens, 0);
  const overallEfficiency = totalDur > 0 ? Math.round((totalTokens / (totalDur / 1000))) : 130;

  return {
    taskId,
    taskIntent: intent,
    totalDurationMs: totalDur,
    totalTokens,
    totalPromptTokens,
    totalCompletionTokens,
    overallEfficiencyTokPerSec: overallEfficiency,
    status: currentStatus,
    stages
  };
}

// ==========================================
// Performance Threshold Alert System Types
// ==========================================

export type AlertMetricType = 
  | 'latency'           // Execution duration / latency (ms)
  | 'tokensPerSec'      // Generation speed (t/s)
  | 'tokenUsage'        // Step / turn token count
  | 'totalTokens'       // Cumulative session tokens
  | 'errorCount'        // Execution errors count
  | 'successRate'       // Success rate (%)
  | 'riskScore';        // Risk score (%)

export type AlertOperator = '>' | '>=' | '<' | '<=' | '==';

export type AlertSeverity = 'warn' | 'error' | 'info';

export interface AlertNotificationChannels {
  toast: boolean;
  terminal: boolean;
  sound: boolean;
  agentLog: boolean;
}

export interface PerformanceAlertRule {
  id: string;
  name: string;
  description?: string;
  metric: AlertMetricType;
  targetAgentId: 'all' | string; // 'all' or specific agent ID like 'a1', 'a2', 'a3'
  operator: AlertOperator;
  threshold: number;
  unit: string;
  severity: AlertSeverity;
  enabled: boolean;
  cooldownSec: number; // prevent toast storm
  notificationChannels: AlertNotificationChannels;
  customMessageTemplate?: string;
  lastTriggered?: string; // ISO date string
  triggerCount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface AlertBreachRecord {
  id: string;
  ruleId: string;
  ruleName: string;
  metric: AlertMetricType;
  targetAgentId: 'all' | string;
  agentId?: string;
  agentName?: string;
  agentRole?: string;
  observedValue: number;
  thresholdValue: number;
  operator: AlertOperator;
  unit: string;
  severity: AlertSeverity;
  message: string;
  timestamp: string; // ISO date
  acknowledged?: boolean;
}

export interface AlertEngineSettings {
  isGloballyEnabled: boolean;
  soundEnabled: boolean;
  defaultCooldownSec: number;
  autoOpenDrawerOnCritical: boolean;
  retentionMaxRecords: number;
}

export const DEFAULT_ALERT_RULES: PerformanceAlertRule[] = [
  {
    id: 'rule-latency-warning',
    name: 'Global Latency Warning (> 200ms)',
    description: 'Triggers when any agent turn execution exceeds the 200ms target response threshold.',
    metric: 'latency',
    targetAgentId: 'all',
    operator: '>',
    threshold: 200,
    unit: 'ms',
    severity: 'warn',
    enabled: true,
    cooldownSec: 10,
    notificationChannels: {
      toast: true,
      terminal: true,
      sound: true,
      agentLog: true
    },
    triggerCount: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'rule-coder-latency-critical',
    name: 'Builder Latency Spike (> 2000ms)',
    description: 'Triggers when the Coder/Builder agent takes longer than 2.0s on code generation.',
    metric: 'latency',
    targetAgentId: 'a3',
    operator: '>',
    threshold: 2000,
    unit: 'ms',
    severity: 'error',
    enabled: true,
    cooldownSec: 15,
    notificationChannels: {
      toast: true,
      terminal: true,
      sound: true,
      agentLog: true
    },
    triggerCount: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'rule-low-tps-floor',
    name: 'Throughput Degradation (< 100 t/s)',
    description: 'Triggers when agent generation throughput drops below the minimum 100 tokens/sec SLA floor.',
    metric: 'tokensPerSec',
    targetAgentId: 'all',
    operator: '<',
    threshold: 100,
    unit: 'tok/s',
    severity: 'warn',
    enabled: true,
    cooldownSec: 15,
    notificationChannels: {
      toast: true,
      terminal: true,
      sound: false,
      agentLog: true
    },
    triggerCount: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'rule-step-token-spike',
    name: 'High Step Token Consumption (> 2500 tokens)',
    description: 'Triggers when an individual agent task step consumes over 2,500 total tokens.',
    metric: 'tokenUsage',
    targetAgentId: 'all',
    operator: '>',
    threshold: 2500,
    unit: 'tokens',
    severity: 'warn',
    enabled: true,
    cooldownSec: 20,
    notificationChannels: {
      toast: true,
      terminal: true,
      sound: false,
      agentLog: true
    },
    triggerCount: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'rule-agent-error-detected',
    name: 'Zero Error Tolerance (Errors >= 1)',
    description: 'Immediate alert when any agent encounters an execution failure or typecheck error.',
    metric: 'errorCount',
    targetAgentId: 'all',
    operator: '>=',
    threshold: 1,
    unit: 'errors',
    severity: 'error',
    enabled: true,
    cooldownSec: 5,
    notificationChannels: {
      toast: true,
      terminal: true,
      sound: true,
      agentLog: true
    },
    triggerCount: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'rule-success-rate-floor',
    name: 'Success Rate SLA Floor (< 95%)',
    description: 'Triggers when the overall workflow success rate dips below the 95% SLA target.',
    metric: 'successRate',
    targetAgentId: 'all',
    operator: '<',
    threshold: 95,
    unit: '%',
    severity: 'error',
    enabled: true,
    cooldownSec: 30,
    notificationChannels: {
      toast: true,
      terminal: true,
      sound: true,
      agentLog: true
    },
    triggerCount: 0,
    createdAt: new Date().toISOString()
  }
];

export interface HeatmapDataCell {
  agentId: string;
  agentName: string;
  agentRole: string;
  agentAvatarUrl?: string;
  flavor?: 'leased' | 'harness';
  model?: string;
  bucketIndex: number;
  bucketLabel: string;
  timeStart: string;
  timeEnd: string;
  taskCount: number;
  computeLoadPct: number;
  tokensUsed: number;
  promptTokens: number;
  completionTokens: number;
  avgLatencyMs: number;
  errorCount: number;
  cpuPct: number;
  memoryMb: number;
  activeActions: string[];
  dominantState: 'idle' | 'working' | 'waiting' | 'error';
  densityScore: number;
}

export type HeatmapMetricMode = 'compute' | 'tasks' | 'tokens' | 'latency' | 'errors' | 'density';
export type HeatmapTimeGranularity = '10s' | '30s' | '1m' | '5m';
export type HeatmapColorPalette = 'cyberpunk' | 'turbo' | 'viridis' | 'plasma' | 'ember' | 'emerald';

// ==========================================
// Agent Task Queue Types (Architect & Builder)
// ==========================================

export type AgentTaskStatus = 'pending' | 'active' | 'completed' | 'failed' | 'paused';
export type AgentTaskPriority = 'critical' | 'high' | 'medium' | 'low';
export type AgentTaskAssignee = 'architect' | 'builder';

export interface AgentSubStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  details?: string;
  durationMs?: number;
}

export interface AgentTaskCodeSnippet {
  filename: string;
  language: string;
  code: string;
  diffSummary?: {
    added: number;
    removed: number;
  };
}

export interface AgentTaskItem {
  id: string;
  title: string;
  description: string;
  assignedAgent: AgentTaskAssignee;
  agentId: string;
  agentName: string;
  agentRole: string;
  model: string;
  status: AgentTaskStatus;
  priority: AgentTaskPriority;
  progress: number; // 0 to 100
  createdAt: string; // ISO date string
  startedAt?: string;
  completedAt?: string;
  estimatedDurationMs: number;
  actualDurationMs?: number;
  tokensUsed?: number;
  promptTokens?: number;
  completionTokens?: number;
  tokensPerSec?: number;
  dependencies: string[]; // Task IDs required before this can run
  outputs: string[];
  substeps: AgentSubStep[];
  codeSnippet?: AgentTaskCodeSnippet;
  parentWorkRequestId?: string;
  retryCount?: number;
  errorMessage?: string;
}

export interface AgentTaskQueueStats {
  totalCount: number;
  pendingCount: number;
  activeCount: number;
  completedCount: number;
  failedCount: number;
  pausedCount: number;
  architectCount: number;
  builderCount: number;
  totalTokens: number;
  avgDurationMs: number;
  completionRatePercent: number;
}


