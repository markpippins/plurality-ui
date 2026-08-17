import { BehaviorSubject, Subject, delay, of, tap } from 'rxjs';
import { 
  Workspace, FileNode, ChatMessage, AgentLog, ProviderConfig,
  WorkRequest, WorkRequestDetail, buildDefaultWorkRequestDetail, TaskPriority, PlanIR, CritiqueIR, SpecIR, ExecutionIR, ValidationIR, AppState, ActiveAgent, AgentLogEntry, ToastNotification,
  AgentVote, RoundtableSession, AppTheme, PerformanceMetricsSummary, AgentMetricItem, TaskMetricRecord,
  PerformanceAlertRule, AlertBreachRecord,
  DualityState, DualityMessage, DecisionCard, DecisionCardOption, InterAgentDialogMessage, BuilderTraceEvent,
  DualityTurnMetric, DualityAgentMetric, DualityPerformanceMetrics,
  WorkspaceLayoutMode, WorkspaceLayoutConfig,
  AgentTaskItem, AgentTaskStatus, AgentTaskPriority, AgentTaskAssignee, AgentTaskQueueStats, AgentSubStep, AgentTaskCodeSnippet
} from '../types';
import { AlertService } from './PerformanceAlertsService';

import avatarPlanner from '../assets/images/avatar_planner_1786461702771.jpg';
import avatarCritic from '../assets/images/avatar_critic_1786461719701.jpg';
import avatarCoder from '../assets/images/avatar_coder_1786461737022.jpg';
import avatarValidator from '../assets/images/avatar_validator_1786461750478.jpg';

import avatarPlannerAlt from '../assets/images/avatar_planner_alt_1786462226175.jpg';
import avatarCriticAlt from '../assets/images/avatar_critic_alt_1786462239763.jpg';
import avatarCoderAlt from '../assets/images/avatar_coder_alt_1786462252537.jpg';
import avatarValidatorAlt from '../assets/images/avatar_validator_alt_1786462263142.jpg';

export const AVATAR_PRESETS: Record<string, string[]> = {
  a1: [avatarPlanner, avatarPlannerAlt],
  a2: [avatarCritic, avatarCriticAlt],
  a3: [avatarCoder, avatarCoderAlt],
  a4: [avatarValidator, avatarValidatorAlt],
  a5: [avatarPlannerAlt, avatarPlanner],
  a6: [avatarCoderAlt, avatarCoder],
  a7: [avatarCriticAlt, avatarCritic],
  a8: [avatarValidatorAlt, avatarValidator],
  a9: [avatarPlanner, avatarCriticAlt],
  a10: [avatarCritic, avatarValidatorAlt],
  a11: [avatarCoderAlt, avatarValidator],
  a12: [avatarPlannerAlt, avatarCriticAlt],
};

const STORAGE_KEY_AGENTS = 'plurality_agent_configs_v1';
const STORAGE_KEY_LOGS = 'plurality_agent_logs_v1';
const STORAGE_KEY_THEME = 'plurality_theme_v1';
const STORAGE_KEY_METRICS = 'plurality_agent_metrics_v1';
const STORAGE_KEY_DUALITY_ENABLED = 'plurality_duality_enabled_v2';
const STORAGE_KEY_DUALITY_STATE = 'plurality_duality_state_v2';
const STORAGE_KEY_LAYOUT = 'plurality_layout_config_v2';
const STORAGE_KEY_TASK_QUEUE = 'plurality_agent_task_queue_v1';

export const DEFAULT_LAYOUT_CONFIGS: Record<WorkspaceLayoutMode, WorkspaceLayoutConfig> = {
  default: {
    mode: 'default',
    showWorkRequests: true,
    showTimeline: true,
    showTerminal: true,
    showFileTree: true,
    showLogDrawer: false,
    showTaskQueue: false,
    planPanelExpanded: false,
    executionPanelExpanded: false,
  },
  analysis: {
    mode: 'analysis',
    showWorkRequests: true,
    showTimeline: true,
    showTerminal: false,
    showFileTree: true,
    showLogDrawer: false,
    showTaskQueue: false,
    planPanelExpanded: true,
    executionPanelExpanded: false,
  },
  execution: {
    mode: 'execution',
    showWorkRequests: false,
    showTimeline: true,
    showTerminal: true,
    showFileTree: true,
    showLogDrawer: false,
    showTaskQueue: false,
    planPanelExpanded: false,
    executionPanelExpanded: true,
  },
  debugging: {
    mode: 'debugging',
    showWorkRequests: false,
    showTimeline: false,
    showTerminal: true,
    showFileTree: true,
    showLogDrawer: true,
    showTaskQueue: false,
    planPanelExpanded: false,
    executionPanelExpanded: true,
  },
  duality: {
    mode: 'duality',
    showWorkRequests: false,
    showTimeline: false,
    showTerminal: false,
    showFileTree: false,
    showLogDrawer: false,
    showTaskQueue: false,
    planPanelExpanded: false,
    executionPanelExpanded: false,
  },
  queue: {
    mode: 'queue',
    showWorkRequests: false,
    showTimeline: true,
    showTerminal: false,
    showFileTree: false,
    showLogDrawer: false,
    showTaskQueue: true,
    planPanelExpanded: false,
    executionPanelExpanded: false,
  }
};

export const INITIAL_AGENT_TASK_QUEUE: AgentTaskItem[] = [
  {
    id: 'task-arch-001',
    title: 'Synthesize Abstract System Blueprint & Schema Specs',
    description: 'Deconstruct incoming operator work intent into formal AST state machine interfaces, API type definitions, and safety policy guarantees.',
    assignedAgent: 'architect',
    agentId: 'a5',
    agentName: 'Architect',
    agentRole: 'System Architect',
    model: 'claude-3-7-sonnet',
    status: 'completed',
    priority: 'critical',
    progress: 100,
    createdAt: new Date(Date.now() - 900000).toISOString(),
    startedAt: new Date(Date.now() - 840000).toISOString(),
    completedAt: new Date(Date.now() - 720000).toISOString(),
    estimatedDurationMs: 1200,
    actualDurationMs: 1140,
    tokensUsed: 2840,
    promptTokens: 1920,
    completionTokens: 920,
    tokensPerSec: 162,
    dependencies: [],
    outputs: ['src/types.ts', 'docs/architecture-spec.json'],
    substeps: [
      { id: 'sub-1-1', name: 'Ingest operator domain constraints', status: 'completed', details: 'Validated strict typing rules and memory bounds', durationMs: 220 },
      { id: 'sub-1-2', name: 'Formulate typed schema interfaces', status: 'completed', details: 'Generated 14 immutable TypeScript interfaces', durationMs: 540 },
      { id: 'sub-1-3', name: 'Sign cryptographic spec token', status: 'completed', details: 'Handoff signature verified by validator', durationMs: 380 }
    ]
  },
  {
    id: 'task-bld-002',
    title: 'Implement AST Stream Coordinator & RxJS Hooks',
    description: 'Construct reactive state listeners, localStorage auto-persistence pipes, and real-time subscription lifecycle management.',
    assignedAgent: 'builder',
    agentId: 'a3',
    agentName: 'Coder / Builder',
    agentRole: 'Lead Builder',
    model: 'qwen2.5-coder:latest',
    status: 'completed',
    priority: 'high',
    progress: 100,
    createdAt: new Date(Date.now() - 700000).toISOString(),
    startedAt: new Date(Date.now() - 660000).toISOString(),
    completedAt: new Date(Date.now() - 480000).toISOString(),
    estimatedDurationMs: 2200,
    actualDurationMs: 2080,
    tokensUsed: 3650,
    promptTokens: 2100,
    completionTokens: 1550,
    tokensPerSec: 138,
    dependencies: ['task-arch-001'],
    outputs: ['src/services/SimulatedBackendService.ts', 'src/hooks/useSimulation.ts'],
    substeps: [
      { id: 'sub-2-1', name: 'Mount BehaviorSubject state streams', status: 'completed', details: 'Initialized reactive observables with strict null checks', durationMs: 460 },
      { id: 'sub-2-2', name: 'Wire persistent localStorage pipelines', status: 'completed', details: 'Added deep date parsing and serialization guard', durationMs: 980 },
      { id: 'sub-2-3', name: 'Run static type-checker & lint verification', status: 'completed', details: '0 errors, 0 warnings emitted', durationMs: 640 }
    ],
    codeSnippet: {
      filename: 'src/hooks/useSimulation.ts',
      language: 'typescript',
      code: `const [taskQueue, setTaskQueue] = useState<AgentTaskItem[]>([]);\nuseEffect(() => {\n  const sub = BackendService.agentTaskQueue$.subscribe(setTaskQueue);\n  return () => sub.unsubscribe();\n}, []);`
    }
  },
  {
    id: 'task-arch-003',
    title: 'Design Real-Time Queue Verification & Metric Bounds',
    description: 'Establish latency SLA boundaries (<200ms target), token consumption ceilings, and error interception protocols for pending sub-tasks.',
    assignedAgent: 'architect',
    agentId: 'a5',
    agentName: 'Architect',
    agentRole: 'System Architect',
    model: 'claude-3-7-sonnet',
    status: 'active',
    priority: 'high',
    progress: 65,
    createdAt: new Date(Date.now() - 360000).toISOString(),
    startedAt: new Date(Date.now() - 240000).toISOString(),
    estimatedDurationMs: 1500,
    actualDurationMs: 920,
    tokensUsed: 1780,
    promptTokens: 1200,
    completionTokens: 580,
    tokensPerSec: 155,
    dependencies: ['task-bld-002'],
    outputs: ['src/services/PerformanceAlertsService.ts'],
    substeps: [
      { id: 'sub-3-1', name: 'Map SLA threshold matrices', status: 'completed', details: 'Configured 200ms latency warning floor', durationMs: 380 },
      { id: 'sub-3-2', name: 'Synthesize inter-agent telemetry probes', status: 'running', details: 'Injecting live throughput monitoring hooks...', durationMs: 540 },
      { id: 'sub-3-3', name: 'Publish consensus validation schema', status: 'pending', details: 'Awaiting completion of telemetry probes' }
    ]
  },
  {
    id: 'task-bld-004',
    title: 'Construct Dedicated Agent Task Queue UI Panel',
    description: 'Build interactive queue dashboard supporting status tabs (Pending, Active, Completed), live execution timers, dependency trees, and instant manual task dispatching.',
    assignedAgent: 'builder',
    agentId: 'a3',
    agentName: 'Coder / Builder',
    agentRole: 'Lead Builder',
    model: 'qwen2.5-coder:latest',
    status: 'active',
    priority: 'critical',
    progress: 40,
    createdAt: new Date(Date.now() - 240000).toISOString(),
    startedAt: new Date(Date.now() - 120000).toISOString(),
    estimatedDurationMs: 2600,
    actualDurationMs: 1120,
    tokensUsed: 2140,
    promptTokens: 1450,
    completionTokens: 690,
    tokensPerSec: 142,
    dependencies: ['task-arch-003'],
    outputs: ['src/components/AgentTaskQueuePanel.tsx'],
    substeps: [
      { id: 'sub-4-1', name: 'Scaffold responsive Kanban & List views', status: 'completed', details: 'Constructed status column layout and filter controls', durationMs: 520 },
      { id: 'sub-4-2', name: 'Integrate real-time status tracker & timers', status: 'running', details: 'Connecting RxJS queue streams with step progress triggers...', durationMs: 600 },
      { id: 'sub-4-3', name: 'Implement task dispatch modal & quick actions', status: 'pending', details: 'Pending real-time timer binding' }
    ],
    codeSnippet: {
      filename: 'src/components/AgentTaskQueuePanel.tsx',
      language: 'typescript',
      code: `export function AgentTaskQueuePanel() {\n  const { agentTaskQueue, runTask, pauseTask } = useSimulation();\n  return <div className="queue-container">...</div>;\n}`
    }
  },
  {
    id: 'task-arch-005',
    title: 'Formulate Dynamic Work Request Decomposition Pipeline',
    description: 'Generate recursive sub-task breakdown heuristics for complex multi-agent coding instructions.',
    assignedAgent: 'architect',
    agentId: 'a5',
    agentName: 'Architect',
    agentRole: 'System Architect',
    model: 'claude-3-7-sonnet',
    status: 'pending',
    priority: 'medium',
    progress: 0,
    createdAt: new Date(Date.now() - 180000).toISOString(),
    estimatedDurationMs: 1800,
    dependencies: ['task-bld-004'],
    outputs: ['src/services/TaskDecomposer.ts'],
    substeps: [
      { id: 'sub-5-1', name: 'Define recursive DAG tree structure', status: 'pending', details: 'Pending Builder UI completion' },
      { id: 'sub-5-2', name: 'Compute critical path bottleneck estimator', status: 'pending', details: 'Pending DAG tree structure' }
    ]
  },
  {
    id: 'task-bld-006',
    title: 'Execute Automated Unit & Integration Verification Suite',
    description: 'Run exhaustive test suite across AST parser, queue dispatcher, and localStorage sync engines.',
    assignedAgent: 'builder',
    agentId: 'a3',
    agentName: 'Coder / Builder',
    agentRole: 'Lead Builder',
    model: 'qwen2.5-coder:latest',
    status: 'pending',
    priority: 'high',
    progress: 0,
    createdAt: new Date(Date.now() - 120000).toISOString(),
    estimatedDurationMs: 2400,
    dependencies: ['task-arch-005'],
    outputs: ['tests/taskQueue.spec.ts', 'coverage/lcov.info'],
    substeps: [
      { id: 'sub-6-1', name: 'Run static TypeScript typecheck (tsc --noEmit)', status: 'pending' },
      { id: 'sub-6-2', name: 'Verify reactive event propagation across threads', status: 'pending' }
    ]
  }
];

function loadPersistedTaskQueue(): AgentTaskItem[] {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY_TASK_QUEUE) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to load task queue from localStorage:', err);
  }
  return INITIAL_AGENT_TASK_QUEUE;
}

function savePersistedTaskQueue(queue: AgentTaskItem[]) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_TASK_QUEUE, JSON.stringify(queue));
    }
  } catch (err) {
    console.warn('Failed to save task queue to localStorage:', err);
  }
}

function loadPersistedLayoutConfig(): WorkspaceLayoutConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LAYOUT);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.mode && typeof parsed.showWorkRequests === 'boolean') {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to load layout config from localStorage:', err);
  }
  return DEFAULT_LAYOUT_CONFIGS.default;
}

function savePersistedLayoutConfig(config: WorkspaceLayoutConfig) {
  try {
    localStorage.setItem(STORAGE_KEY_LAYOUT, JSON.stringify(config));
  } catch (err) {
    console.warn('Failed to save layout config to localStorage:', err);
  }
}

export const MODEL_PERF_BASELINES: Record<string, {
  name: string;
  provider: string;
  baseLatencyMs: number;
  tokensPerSec: number;
  slaTargetMs: number;
  costPerMprompt: number;
  costPerMcomp: number;
  cacheHitBaseline: number;
}> = {
  'claude-3-7-sonnet': {
    name: 'Claude 3.7 Sonnet',
    provider: 'Anthropic',
    baseLatencyMs: 920,
    tokensPerSec: 132,
    slaTargetMs: 1400,
    costPerMprompt: 3.0,
    costPerMcomp: 15.0,
    cacheHitBaseline: 94
  },
  'claude-3-5-sonnet': {
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    baseLatencyMs: 840,
    tokensPerSec: 145,
    slaTargetMs: 1200,
    costPerMprompt: 3.0,
    costPerMcomp: 15.0,
    cacheHitBaseline: 92
  },
  'gpt-4o': {
    name: 'GPT-4o',
    provider: 'OpenAI',
    baseLatencyMs: 780,
    tokensPerSec: 140,
    slaTargetMs: 1100,
    costPerMprompt: 2.5,
    costPerMcomp: 10.0,
    cacheHitBaseline: 90
  },
  'gemini-2.0-flash': {
    name: 'Gemini 2.0 Flash',
    provider: 'Google',
    baseLatencyMs: 420,
    tokensPerSec: 220,
    slaTargetMs: 600,
    costPerMprompt: 0.10,
    costPerMcomp: 0.40,
    cacheHitBaseline: 96
  },
  'gemini-1.5-pro': {
    name: 'Gemini 1.5 Pro',
    provider: 'Google',
    baseLatencyMs: 1150,
    tokensPerSec: 110,
    slaTargetMs: 1600,
    costPerMprompt: 1.25,
    costPerMcomp: 5.0,
    cacheHitBaseline: 88
  },
  'qwen2.5-coder:latest': {
    name: 'Qwen 2.5 Coder 32B',
    provider: 'OpenCode',
    baseLatencyMs: 590,
    tokensPerSec: 172,
    slaTargetMs: 900,
    costPerMprompt: 0.20,
    costPerMcomp: 0.60,
    cacheHitBaseline: 89
  },
  'deepseek-r1': {
    name: 'DeepSeek R1',
    provider: 'DeepSeek',
    baseLatencyMs: 1650,
    tokensPerSec: 88,
    slaTargetMs: 2200,
    costPerMprompt: 0.55,
    costPerMcomp: 2.19,
    cacheHitBaseline: 85
  }
};

export const INITIAL_DUALITY_PERFORMANCE_METRICS: DualityPerformanceMetrics = {
  primary: {
    agentId: 'a5',
    role: 'System Architect',
    agentName: 'Architect',
    model: 'claude-3-7-sonnet',
    turnsCount: 3,
    lastLatencyMs: 920,
    avgLatencyMs: 875,
    minLatencyMs: 780,
    maxLatencyMs: 960,
    totalTokensUsed: 6450,
    promptTokens: 4200,
    completionTokens: 2250,
    tokensPerSec: 132,
    cacheHitPct: 94,
    estimatedCostUsd: 0.046,
    slaTargetMs: 1400,
    status: 'idle',
    latencyHistory: [820, 890, 920],
    tokensHistory: [1800, 2200, 2450]
  },
  secondary: {
    agentId: 'a3',
    role: 'Builder',
    agentName: 'Coder',
    model: 'qwen2.5-coder:latest',
    turnsCount: 3,
    lastLatencyMs: 640,
    avgLatencyMs: 590,
    minLatencyMs: 520,
    maxLatencyMs: 680,
    totalTokensUsed: 8820,
    promptTokens: 3100,
    completionTokens: 5720,
    tokensPerSec: 172,
    cacheHitPct: 89,
    estimatedCostUsd: 0.004,
    slaTargetMs: 900,
    status: 'idle',
    latencyHistory: [540, 590, 640],
    tokensHistory: [2100, 3100, 3620]
  },
  totalSessionTokens: 15270,
  totalSessionCostUsd: 0.050,
  totalTurns: 6,
  lastUpdated: new Date().toISOString(),
  recentTurns: [
    {
      turnId: 'turn-init-1',
      timestamp: new Date(Date.now() - 300000),
      role: 'System Architect',
      agentName: 'Architect',
      agentId: 'a5',
      model: 'claude-3-7-sonnet',
      action: 'INGEST_USER_INTENT',
      latencyMs: 920,
      promptTokens: 1800,
      completionTokens: 650,
      totalTokens: 2450,
      tokensPerSec: 132,
      status: 'success'
    },
    {
      turnId: 'turn-init-2',
      timestamp: new Date(Date.now() - 240000),
      role: 'System Architect',
      agentName: 'Architect',
      agentId: 'a5',
      model: 'claude-3-7-sonnet',
      action: 'SPEC_BLUEPRINT_SYNTHESIS',
      latencyMs: 890,
      promptTokens: 1400,
      completionTokens: 800,
      totalTokens: 2200,
      tokensPerSec: 135,
      status: 'success'
    },
    {
      turnId: 'turn-init-3',
      timestamp: new Date(Date.now() - 180000),
      role: 'Builder',
      agentName: 'Coder',
      agentId: 'a3',
      model: 'qwen2.5-coder:latest',
      action: 'SYNTHESIZE_CODE_MODULE',
      latencyMs: 640,
      promptTokens: 1200,
      completionTokens: 2420,
      totalTokens: 3620,
      tokensPerSec: 172,
      status: 'success'
    },
    {
      turnId: 'turn-init-4',
      timestamp: new Date(Date.now() - 120000),
      role: 'Builder',
      agentName: 'Coder',
      agentId: 'a3',
      model: 'qwen2.5-coder:latest',
      action: 'STATIC_TYPE_VERIFICATION',
      latencyMs: 590,
      promptTokens: 1000,
      completionTokens: 2100,
      totalTokens: 3100,
      tokensPerSec: 168,
      status: 'success'
    }
  ],
  benchmarkRunning: false
};

export const INITIAL_DUALITY_STATE: DualityState = {
  enabled: false,
  primaryRole: 'System Architect',
  primaryModel: 'claude-3-7-sonnet',
  primaryAgentId: 'a5',
  secondaryRole: 'Builder',
  secondaryModel: 'qwen2.5-coder:latest',
  secondaryAgentId: 'a3',
  isExecuting: false,
  performanceMetrics: INITIAL_DUALITY_PERFORMANCE_METRICS,
  userMessages: [
    {
      id: 'd-msg-1',
      sender: 'primary_agent',
      role: 'System Architect',
      agentName: 'Architect',
      agentId: 'a5',
      model: 'claude-3-7-sonnet',
      timestamp: new Date(Date.now() - 300000),
      content: `Welcome to **Duality Mode**. You are directly interacting 1:1 with me as your **System Architect**.\n\nIn this mode, you formulate user intents, iterate on architecture designs, and resolve trade-offs. I can provide structural recommendations and **Decision Cards** for critical system choices. Once you select or confirm a path, I will synthesize interface contracts and dispatch execution tasks to the **Builder** agent on the right.`,
      decisionCards: [
        {
          id: 'card-init-1',
          title: 'Architecture Decision: State Synchronization Pattern',
          description: 'Select the primary state orchestration architecture for this client-side IDE:',
          category: 'architecture',
          status: 'pending',
          options: [
            {
              id: 'opt-rxjs',
              label: 'Reactive RxJS BehaviorSubject Streams',
              description: 'Zero-latency push architecture with fine-grained subscriptions and deterministic multi-subscriber broadcasting.',
              impact: { latency: '< 5ms', complexity: 'Low', resilience: 'High (99.8%)' },
              recommended: true
            },
            {
              id: 'opt-cqrs',
              label: 'Event-Sourced CQRS with Immutable Log',
              description: 'Audit-first event stream with full temporal replay capabilities and transaction checkpointing.',
              impact: { latency: '12-18ms', complexity: 'Medium', resilience: 'High (99.9%)' }
            },
            {
              id: 'opt-pubsub',
              label: 'Distributed Web Worker Pub/Sub Channel',
              description: 'Offloads computation to background worker threads, preventing UI blocking during heavy AST compilation.',
              impact: { latency: '8-14ms', complexity: 'High', resilience: 'Medium (98.5%)' }
            }
          ]
        }
      ]
    }
  ],
  interAgentDialog: [
    {
      id: 'diag-1',
      senderAgentId: 'a5',
      senderName: 'Architect',
      senderRole: 'System Architect',
      recipientAgentId: 'a3',
      recipientName: 'Coder',
      recipientRole: 'Builder',
      type: 'spec_handoff',
      timestamp: new Date(Date.now() - 240000),
      status: 'approved',
      content: `### Spec Handoff: State Synchronization Engine\nImplement reactive \`BehaviorSubject\` state coordinator with strict TypeScript definitions and subscription teardown logic. Enforce single-point-of-truth mutation barriers.`
    },
    {
      id: 'diag-2',
      senderAgentId: 'a3',
      senderName: 'Coder',
      senderRole: 'Builder',
      recipientAgentId: 'a5',
      recipientName: 'Architect',
      recipientRole: 'System Architect',
      type: 'code_proposal',
      timestamp: new Date(Date.now() - 180000),
      status: 'approved',
      content: `Parsed architecture constraints. Scaffolding \`/src/services/SimulatedBackendService.ts\` with type-safe event dispatches. Here is the implementation preview:`,
      codeSnippet: {
        filename: '/src/services/SimulatedBackendService.ts',
        language: 'typescript',
        code: `export class StateEngine {\n  private state$ = new BehaviorSubject<AppState>(INITIAL_STATE);\n  public state = this.state$.asObservable();\n\n  public dispatch(event: ActionEvent) {\n    const next = this.reducer(this.state$.getValue(), event);\n    this.state$.next(next);\n  }\n}`
      },
      diffSummary: { added: 48, removed: 4, file: '/src/services/SimulatedBackendService.ts' }
    },
    {
      id: 'diag-3',
      senderAgentId: 'a5',
      senderName: 'Architect',
      senderRole: 'System Architect',
      recipientAgentId: 'a3',
      recipientName: 'Coder',
      recipientRole: 'Builder',
      type: 'validation_ack',
      timestamp: new Date(Date.now() - 120000),
      status: 'approved',
      content: `✓ Code reviewed and verified. AST signature complies with interface constraints. Greenlit for execution pipeline.`
    }
  ],
  builderTrace: [
    {
      id: 'tr-1',
      timestamp: new Date(Date.now() - 240000),
      step: 'RECEIVE_SPEC',
      agent: 'Coder (Builder)',
      action: 'PARSE_AST_CONTRACT',
      details: 'Ingested 3 contract invariants from Architect [claude-3-7-sonnet]',
      status: 'success',
      durationMs: 120,
      tokensUsed: 450,
      toolUsed: 'ast_analyzer'
    },
    {
      id: 'tr-2',
      timestamp: new Date(Date.now() - 180000),
      step: 'CODE_SYNTHESIS',
      agent: 'Coder (Builder)',
      action: 'GENERATE_TYPESCRIPT',
      details: 'Generated state coordinator with RxJS streaming wrappers',
      status: 'success',
      durationMs: 840,
      tokensUsed: 1820,
      toolUsed: 'typescript_engine'
    },
    {
      id: 'tr-3',
      timestamp: new Date(Date.now() - 120000),
      step: 'TEST_VERIFICATION',
      agent: 'Coder (Builder)',
      action: 'RUN_STATIC_LINT',
      details: 'Zero AST lint errors detected. Output verified against tsconfig strict mode.',
      status: 'success',
      durationMs: 310,
      tokensUsed: 310,
      toolUsed: 'eslint_ast_checker'
    }
  ]
};

function loadPersistedDualityEnabled(): boolean {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY_DUALITY_ENABLED) : null;
    if (raw !== null) {
      return raw === 'true';
    }
  } catch (err) {
    console.warn('Failed to load duality enabled flag:', err);
  }
  return false;
}

function loadPersistedDualityState(): DualityState {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY_DUALITY_STATE) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      const perfMetrics = parsed.performanceMetrics || INITIAL_DUALITY_PERFORMANCE_METRICS;
      return {
        ...INITIAL_DUALITY_STATE,
        ...parsed,
        isExecuting: false, // Ensure loading spinner is not stuck after a page refresh
        performanceMetrics: {
          ...INITIAL_DUALITY_PERFORMANCE_METRICS,
          ...perfMetrics,
          primary: {
            ...INITIAL_DUALITY_PERFORMANCE_METRICS.primary,
            ...(perfMetrics.primary || {})
          },
          secondary: {
            ...INITIAL_DUALITY_PERFORMANCE_METRICS.secondary,
            ...(perfMetrics.secondary || {})
          },
          recentTurns: (Array.isArray(perfMetrics.recentTurns) ? perfMetrics.recentTurns : INITIAL_DUALITY_PERFORMANCE_METRICS.recentTurns).map((rt: any) => ({
            ...rt,
            timestamp: rt.timestamp ? new Date(rt.timestamp) : new Date()
          }))
        },
        userMessages: (Array.isArray(parsed.userMessages) ? parsed.userMessages : INITIAL_DUALITY_STATE.userMessages).map((m: any) => ({
          ...m,
          timestamp: m.timestamp ? new Date(m.timestamp) : new Date()
        })),
        interAgentDialog: (Array.isArray(parsed.interAgentDialog) ? parsed.interAgentDialog : INITIAL_DUALITY_STATE.interAgentDialog).map((d: any) => ({
          ...d,
          timestamp: d.timestamp ? new Date(d.timestamp) : new Date()
        })),
        builderTrace: (Array.isArray(parsed.builderTrace) ? parsed.builderTrace : INITIAL_DUALITY_STATE.builderTrace).map((t: any) => ({
          ...t,
          timestamp: t.timestamp ? new Date(t.timestamp) : new Date()
        }))
      };
    }
  } catch (err) {
    console.warn('Failed to load duality state from localStorage:', err);
  }
  return INITIAL_DUALITY_STATE;
}

function savePersistedDualityState(state: DualityState) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_DUALITY_STATE, JSON.stringify(state));
      localStorage.setItem(STORAGE_KEY_DUALITY_ENABLED, String(state.enabled));
    }
  } catch (err) {
    console.warn('Failed to save duality state to localStorage:', err);
  }
}

export const INITIAL_PERFORMANCE_METRICS: PerformanceMetricsSummary = {
  totalTasksCompleted: 18,
  activeTasksRunning: 1,
  avgTaskDurationMs: 3840,
  lastTaskDurationMs: 3620,
  totalTokens: 74890,
  totalPromptTokens: 51200,
  totalCompletionTokens: 23690,
  avgTokensPerSec: 126,
  successRatePercent: 97.4,
  agentMetrics: [
    {
      agentId: 'a1',
      agentName: 'Planner',
      agentRole: 'Architect',
      tasksCompleted: 18,
      avgCompletionTimeMs: 1350,
      totalTokensUsed: 21400,
      promptTokens: 14800,
      completionTokens: 6600,
      tokensPerSec: 132,
      errorCount: 0
    },
    {
      agentId: 'a2',
      agentName: 'Critic',
      agentRole: 'Reviewer',
      tasksCompleted: 18,
      avgCompletionTimeMs: 920,
      totalTokensUsed: 13800,
      promptTokens: 10200,
      completionTokens: 3600,
      tokensPerSec: 144,
      errorCount: 0
    },
    {
      agentId: 'a3',
      agentName: 'Coder',
      agentRole: 'Builder',
      tasksCompleted: 17,
      avgCompletionTimeMs: 2280,
      totalTokensUsed: 26900,
      promptTokens: 16800,
      completionTokens: 10100,
      tokensPerSec: 108,
      errorCount: 1
    },
    {
      agentId: 'a4',
      agentName: 'Validator',
      agentRole: 'QA & Compliance',
      tasksCompleted: 18,
      avgCompletionTimeMs: 1090,
      totalTokensUsed: 12790,
      promptTokens: 9400,
      completionTokens: 3390,
      tokensPerSec: 148,
      errorCount: 0
    }
  ],
  recentTaskHistory: [
    {
      id: 'wr-1',
      intent: 'Build auth middleware with OAuth2 and PKCE validation',
      durationMs: 4120,
      tokensUsed: 6420,
      completedAt: new Date(Date.now() - 1000 * 60 * 8),
      status: 'success'
    },
    {
      id: 'wr-2',
      intent: 'Generate PostgreSQL Drizzle schema and migrations',
      durationMs: 3640,
      tokensUsed: 5280,
      completedAt: new Date(Date.now() - 1000 * 60 * 22),
      status: 'success'
    },
    {
      id: 'wr-3',
      intent: 'Optimize React render cycle for state timeline component',
      durationMs: 4760,
      tokensUsed: 7350,
      completedAt: new Date(Date.now() - 1000 * 60 * 45),
      status: 'success'
    }
  ]
};

function loadPersistedMetrics(): PerformanceMetricsSummary {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_METRICS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.totalTokens === 'number') {
        return {
          ...parsed,
          recentTaskHistory: (parsed.recentTaskHistory || []).map((t: any) => ({
            ...t,
            completedAt: t.completedAt ? new Date(t.completedAt) : new Date()
          }))
        };
      }
    }
  } catch (err) {
    console.warn('Failed to load performance metrics from localStorage:', err);
  }
  return INITIAL_PERFORMANCE_METRICS;
}

function savePersistedMetrics(metrics: PerformanceMetricsSummary) {
  try {
    localStorage.setItem(STORAGE_KEY_METRICS, JSON.stringify(metrics));
  } catch (err) {
    console.warn('Failed to save performance metrics to localStorage:', err);
  }
}

function loadPersistedTheme(): AppTheme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_THEME);
    if (saved === 'steel' || saved === 'dark' || saved === 'light') {
      return saved;
    }
  } catch (e) {
    console.warn('Failed to load persisted theme', e);
  }
  return 'steel';
}

export function sortAgentsByRole(agents: ActiveAgent[]): ActiveAgent[] {
  return [...agents].sort((a, b) => a.role.localeCompare(b.role, undefined, { sensitivity: 'base' }));
}

function loadPersistedAgents(): ActiveAgent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AGENTS);
    if (raw) {
      const parsed = JSON.parse(raw) as ActiveAgent[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        const mergedDefaults = MOCK_ACTIVE_AGENTS.map(defaultAgent => {
          const found = parsed.find(p => p.id === defaultAgent.id);
          if (!found) return defaultAgent;
          return {
            ...defaultAgent,
            ...found,
            status: 'idle' as const,
            lastActive: found.lastActive ? new Date(found.lastActive) : new Date()
          };
        });
        const customAgents = parsed
          .filter(p => !MOCK_ACTIVE_AGENTS.some(d => d.id === p.id))
          .map(p => ({
            ...p,
            status: 'idle' as const,
            lastActive: p.lastActive ? new Date(p.lastActive) : new Date()
          }));
        return sortAgentsByRole([...mergedDefaults, ...customAgents]);
      }
    }
  } catch (err) {
    console.warn('Failed to load agent configs from localStorage:', err);
  }
  return sortAgentsByRole(MOCK_ACTIVE_AGENTS);
}

function loadPersistedLogs(): AgentLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOGS);
    if (raw) {
      const parsed = JSON.parse(raw) as AgentLogEntry[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(log => ({
          ...log,
          timestamp: log.timestamp ? new Date(log.timestamp) : new Date()
        }));
      }
    }
  } catch (err) {
    console.warn('Failed to load agent logs from localStorage:', err);
  }
  return INITIAL_AGENT_LOGS;
}

function savePersistedAgents(agents: ActiveAgent[]) {
  try {
    localStorage.setItem(STORAGE_KEY_AGENTS, JSON.stringify(agents));
  } catch (err) {
    console.warn('Failed to save agent configs to localStorage:', err);
  }
}

function savePersistedLogs(logs: AgentLogEntry[]) {
  try {
    const trimmed = logs.slice(0, 200);
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(trimmed));
  } catch (err) {
    console.warn('Failed to save agent logs to localStorage:', err);
  }
}

// Initial Mock Data
const MOCK_WORK_REQUESTS: WorkRequest[] = [
  {
    id: 'wr-0133-1781805090',
    intent: 'Test opencode harness + ollama provider combo for qwen2.5-coder',
    status: 'PLAN',
    priority: 'High',
    created_at: new Date('2026-06-18T13:51:30.324Z'),
    detail: {
      id: "wr-0133-1781805090",
      version: 1,
      intent: {
        problem_statement: "Test opencode harness + ollama provider combo for qwen2.5-coder. Write /tmp/pipeline-test-0133.txt identifying which model ran.",
        desired_outcome: "Model chain test: opencode + ollama combo",
        domain: "nexus",
        priority: "high",
        user_intent_trace: "0086",
        abstraction_level: "task"
      },
      decomposition: {
        strategy: "Direct implementation of plan steps",
        steps: [
          {
            step_id: "step_1",
            description: "Plan 0133: Model chain test: opencode + ollama combo\n\nGoal: Test opencode harness + ollama provider combo for qwen2.5-coder. Write /tmp/pipeline-test-0133.txt identifying which model ran.\n\nContent: \n\nAcceptance criteria:\n- Verify model chain execution\n- Output text written to /tmp/pipeline-test-0133.txt",
            dependencies: [],
            outputs: [
              "changes_committed"
            ],
            type: "execution"
          }
        ],
        parallelism_model: "sequential",
        recursion_allowed: false
      },
      requirements: {
        functional: ["Execute model chain test for qwen2.5-coder", "Generate model verification file at /tmp/pipeline-test-0133.txt"],
        non_functional: ["Deterministic response timing", "Non-blocking execution"],
        system_requirements: ["Linux container with opencode harness"],
        tool_requirements: ["ollama provider", "qwen2.5-coder:latest"]
      },
      constraints: {
        forbidden_actions: ["Do not delete or overwrite historical plan artifacts"],
        safety_constraints: [
          "Do not delete or overwrite historical plan artifacts",
          "Do not modify .conduit-data/ directory structure",
          "Preserve existing receipt and audit records",
          "Follow existing project conventions when editing code"
        ],
        resource_limits: null,
        architectural_constraints: ["Operate within /home/codex/dev/nexus boundary"]
      },
      success_criteria: {
        validation_rules: ["Verify /tmp/pipeline-test-0133.txt exists", "Check model identifier string in execution log"],
        acceptance_tests: ["Run automated harness integration check"],
        completion_conditions: ["Outputs match changes_committed"],
        failure_modes: [
          "Files affected list does not match actual changes",
          "Acceptance criteria not satisfied",
          "Typecheck or tests fail"
        ]
      },
      execution_state: {
        status: "pending",
        current_step: "step_1",
        progress: 0.0,
        retries: 0,
        error_state: null,
        context_snapshot_ref: null,
        last_updated: "2026-06-18T13:51:30.324165Z"
      },
      lineage: {
        derived_from: [
          "0133"
        ],
        supersedes: null,
        branches: [],
        merge_history: []
      },
      artifacts: {
        produced_files: ["/tmp/pipeline-test-0133.txt"],
        intermediate_outputs: ["plan_ir_0133.json"]
      },
      metadata: {
        created_at: "2026-06-18T13:51:30.324165Z",
        updated_at: "2026-06-18T13:51:30.324165Z",
        agent_id: "conduit",
        mode: "default",
        tags: [
          "plan-migration",
          "builder"
        ],
        role: "builder",
        harness: "opencode",
        model: "qwen2.5-coder:latest",
        session_id: "builder-20260618-135128"
      },
      path: "/home/codex/dev/nexus"
    }
  },
  { 
    id: 'wr-1', 
    intent: 'Build an E-commerce API', 
    status: 'NEW', 
    priority: 'High',
    created_at: new Date(Date.now() - 3600000),
    detail: buildDefaultWorkRequestDetail('wr-1', 'Build an E-commerce API', 'NEW', 'High')
  },
  { 
    id: 'wr-2', 
    intent: 'Implement a React IDE', 
    status: 'PLAN', 
    priority: 'Medium',
    created_at: new Date(Date.now() - 1800000),
    detail: buildDefaultWorkRequestDetail('wr-2', 'Implement a React IDE', 'PLAN', 'Medium')
  },
  { 
    id: 'wr-3', 
    intent: 'Refactor Authentication Pipeline', 
    status: 'VALIDATE', 
    priority: 'High',
    created_at: new Date(Date.now() - 7200000),
    detail: buildDefaultWorkRequestDetail('wr-3', 'Refactor Authentication Pipeline', 'VALIDATE', 'High')
  },
  { 
    id: 'wr-4', 
    intent: 'Migrate Legacy Database Schemas', 
    status: 'FAILED', 
    priority: 'Low',
    created_at: new Date(Date.now() - 5400000),
    detail: buildDefaultWorkRequestDetail('wr-4', 'Migrate Legacy Database Schemas', 'FAILED', 'Low')
  },
];

const INITIAL_FILE_TREE: FileNode[] = [
  {
    id: 'root', name: 'OpenCode-Clone', type: 'folder', children: [
      { id: 'src', name: 'src', type: 'folder', children: [
        { id: 'f1', name: 'App.tsx', type: 'file' },
        { id: 'f2', name: 'main.tsx', type: 'file' }
      ]},
      { id: 'pkg', name: 'package.json', type: 'file' }
    ]
  }
];

export const AVAILABLE_PROVIDERS: ProviderConfig[] = [
  { id: 'oai', name: 'OpenAI', models: ['gpt-4-turbo', 'gpt-4o', 'gpt-4o-mini', 'o1-preview'] },
  { id: 'ath', name: 'Anthropic', models: ['claude-3-5-sonnet', 'claude-3-opus', 'claude-3-haiku'] },
  { id: 'gem', name: 'Google Gemini', models: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-2.0-flash'] }
];

const MOCK_ACTIVE_AGENTS: ActiveAgent[] = [
  { 
    id: 'a1', 
    name: 'Planner', 
    role: 'Planner', 
    status: 'idle', 
    flavor: 'harness',
    model: 'claude-3-5-sonnet', 
    lastActive: new Date(Date.now() - 300000), 
    avatarUrl: avatarPlanner,
    systemPrompt: `You are the Lead Task Planner in the Plurality workflow. Your primary goal is to synthesize user intents into structured execution sequences, decompose goals into modular PlanIR steps, and estimate task dependencies and risk profiles.`,
    temperature: 0.70,
    topP: 0.90,
    maxTokens: 4096,
    avatarPrompt: 'Futuristic AI planner avatar portrait, minimalist 3D render, holographic flowchart nodes glowing blue'
  },
  { 
    id: 'a5', 
    name: 'Architect', 
    role: 'System Architect', 
    status: 'idle', 
    flavor: 'harness',
    model: 'claude-3-5-sonnet', 
    lastActive: new Date(Date.now() - 280000), 
    avatarUrl: avatarPlannerAlt,
    systemPrompt: `You are the Lead System Architect in the Plurality workflow. You design structural boundaries, define domain interfaces, specify module hierarchies, maintain clear file node schemas, and enforce decoupled design patterns.`,
    temperature: 0.60,
    topP: 0.85,
    maxTokens: 4096,
    avatarPrompt: 'Futuristic AI architect avatar portrait, minimalist 3D render, holographic blueprint line lattice glowing cyan'
  },
  { 
    id: 'a2', 
    name: 'Critic', 
    role: 'Reviewer', 
    status: 'idle', 
    flavor: 'harness',
    model: 'gpt-4o', 
    lastActive: new Date(Date.now() - 240000), 
    avatarUrl: avatarCritic,
    systemPrompt: `You are the Security & Integrity Reviewer in the Plurality workflow. You audit proposed PlanIR strategies and code outputs against OWASP safety, performance overhead, data destruction risk, and architectural integrity. Assign risk scores (1-100) and issue blocking critiques when critical vulnerabilities are identified.`,
    temperature: 0.20,
    topP: 0.30,
    maxTokens: 2048,
    avatarPrompt: 'Futuristic sleek AI reviewer critic avatar portrait, minimalist 3D render, glowing amber optical scanner visor'
  },
  { 
    id: 'a3', 
    name: 'Coder', 
    role: 'Builder', 
    status: 'idle', 
    flavor: 'leased',
    model: 'gpt-4o', 
    lastActive: new Date(Date.now() - 120000), 
    avatarUrl: avatarCoder,
    systemPrompt: `You are the Lead Code Generation Engine in the Plurality workflow. Your role is to transform PlanIR specifications into production-grade TypeScript code, React UI components, and API route handlers. Always include complete typing, proper error handling, robust state managers, and responsive Tailwind styling.`,
    temperature: 0.50,
    topP: 0.80,
    maxTokens: 8192,
    avatarPrompt: 'Futuristic cybernetic AI builder coder avatar portrait, minimalist 3D render, glowing neon purple matrix code stream'
  },
  { 
    id: 'a6', 
    name: 'Engineer', 
    role: 'Engineering Lead', 
    status: 'idle', 
    flavor: 'leased',
    model: 'gpt-4o-mini', 
    lastActive: new Date(Date.now() - 100000), 
    avatarUrl: avatarCoderAlt,
    systemPrompt: `You are the Systems & Infrastructure Engineer. You optimize build configurations, verify runtime environment constraints, establish module bundling, resolve dependencies, and ensure high runtime performance and container safety.`,
    temperature: 0.30,
    topP: 0.70,
    maxTokens: 4096,
    avatarPrompt: 'Futuristic cybernetic systems engineer avatar portrait, minimalist 3D render, glowing orange circuit gears'
  },
  { 
    id: 'a4', 
    name: 'Validator', 
    role: 'QA', 
    status: 'idle', 
    flavor: 'leased',
    model: 'gemini-1.5-pro', 
    lastActive: new Date(Date.now() - 60000), 
    avatarUrl: avatarValidator,
    systemPrompt: `You are the Quality Assurance & Test Verification Agent in the Plurality workflow. Execute 3-tier assertion suites including Static AST Analysis, Unit Functionality, and E2E Integration tests. Verify contract compliance against original user intent and produce deterministic pass/fail reports.`,
    temperature: 0.10,
    topP: 0.20,
    maxTokens: 2048,
    avatarPrompt: 'Futuristic cybernetic QA validator avatar portrait, minimalist 3D render, glowing emerald green shield laser visor'
  },
  { 
    id: 'a7', 
    name: 'Analyst', 
    role: 'Requirements Analyst', 
    status: 'idle', 
    flavor: 'leased',
    model: 'gemini-1.5-pro', 
    lastActive: new Date(Date.now() - 50000), 
    avatarUrl: avatarCriticAlt,
    systemPrompt: `You are the Requirements & Data Analyst. You dissect user intents for edge cases, non-functional constraints, domain metrics, business rules, and hidden data invariants to ensure complete specification coverage.`,
    temperature: 0.40,
    topP: 0.70,
    maxTokens: 4096,
    avatarPrompt: 'Futuristic data analyst avatar portrait, minimalist 3D render, glowing teal analytics visual graphs'
  },
  { 
    id: 'a8', 
    name: 'Ontologist', 
    role: 'Knowledge Specialist', 
    status: 'idle', 
    flavor: 'leased',
    model: 'claude-3-opus', 
    lastActive: new Date(Date.now() - 40000), 
    avatarUrl: avatarValidatorAlt,
    systemPrompt: `You are the Knowledge & Domain Ontologist. You map domain entities, taxonomies, state machine models, and semantic data contracts to maintain coherent terminology across all agent specifications.`,
    temperature: 0.30,
    topP: 0.60,
    maxTokens: 4096,
    avatarPrompt: 'Futuristic domain ontologist avatar portrait, minimalist 3D render, glowing golden knowledge graph nodes'
  },
  { 
    id: 'a9', 
    name: 'Epistemologist', 
    role: 'Truth & Reasoning Auditor', 
    status: 'idle', 
    flavor: 'harness',
    model: 'o1-preview', 
    lastActive: new Date(Date.now() - 30000), 
    avatarUrl: avatarPlanner,
    systemPrompt: `You are the Epistemological Reasoning Auditor. You evaluate the logical coherence of agent reasoning, verify inference chains, detect false assumptions or hallucinations, and validate truth claims before execution.`,
    temperature: 0.10,
    topP: 0.10,
    maxTokens: 8192,
    avatarPrompt: 'Futuristic epistemologist auditor avatar portrait, minimalist 3D render, glowing white crystalline truth lattice'
  },
  { 
    id: 'a10', 
    name: 'Auditor', 
    role: 'Compliance Auditor', 
    status: 'idle', 
    flavor: 'harness',
    model: 'gpt-4o', 
    lastActive: new Date(Date.now() - 20000), 
    avatarUrl: avatarCritic,
    systemPrompt: `You are the Governance & Compliance Auditor. You monitor activity logs, audit trail completeness, policy adherence, privacy bounds, and multi-agent coordination records to ensure transparent accountability.`,
    temperature: 0.20,
    topP: 0.40,
    maxTokens: 4096,
    avatarPrompt: 'Futuristic governance auditor avatar portrait, minimalist 3D render, glowing silver crest shield'
  },
  { 
    id: 'a11', 
    name: 'DBA', 
    role: 'Database Specialist', 
    status: 'idle', 
    flavor: 'leased',
    model: 'gpt-4o', 
    lastActive: new Date(Date.now() - 15000), 
    avatarUrl: avatarCoderAlt,
    systemPrompt: `You are the Lead Database Administrator (DBA) in the Plurality workflow. Your primary role is to design relational & document schemas, optimize query plans, manage migration scripts, enforce transactional integrity, and oversee indexing and data persistence.`,
    temperature: 0.30,
    topP: 0.60,
    maxTokens: 4096,
    avatarPrompt: 'Futuristic database administrator avatar portrait, minimalist 3D render, glowing metallic storage cylinders and SQL query nodes'
  },
  { 
    id: 'a12', 
    name: 'Topologist', 
    role: 'Network Topologist', 
    status: 'idle', 
    flavor: 'harness',
    model: 'claude-3-5-sonnet', 
    lastActive: new Date(Date.now() - 10000), 
    avatarUrl: avatarPlannerAlt,
    systemPrompt: `You are the Network Topologist in the Plurality workflow. You analyze dependency structures, compute graph invariants, detect circular dependencies, map agent communication topology, and optimize cluster routing across multi-agent networks.`,
    temperature: 0.40,
    topP: 0.70,
    maxTokens: 4096,
    avatarPrompt: 'Futuristic network topologist avatar portrait, minimalist 3D render, glowing geometric web mesh and high-dimensional graph lattice'
  }
];

function generateHistoricalSeedLogs(): AgentLogEntry[] {
  const baseLogs: AgentLogEntry[] = [
    {
      id: 'log-101',
      agentId: 'a1',
      agentName: 'Planner',
      timestamp: new Date(Date.now() - 300000),
      level: 'info',
      action: 'INITIALIZE_ACTOR',
      details: 'Planner actor initialized with System Prompt [Plurality-Planner-v1] and model [claude-3-5-sonnet].',
      metadata: { provider: 'Anthropic', maxTokens: 4096 }
    },
    {
      id: 'log-102',
      agentId: 'a1',
      agentName: 'Planner',
      timestamp: new Date(Date.now() - 290000),
      level: 'info',
      action: 'PARSE_INTENT',
      details: 'Received WorkRequest [wr-2]: "Implement a React IDE". Parsed goals, dependencies, and constraints.',
      metadata: { intentLength: 21, constraintsCount: 2 }
    },
    {
      id: 'log-103',
      agentId: 'a1',
      agentName: 'Planner',
      timestamp: new Date(Date.now() - 280000),
      level: 'success',
      action: 'EMIT_PLAN_IR',
      details: 'Generated PlanIR with 2 execution steps (s1: Scaffold Components, s2: Wire State) and 1 risk factor.',
      metadata: { stepsCount: 2, riskScore: 0.25 }
    },
    {
      id: 'log-201',
      agentId: 'a2',
      agentName: 'Critic',
      timestamp: new Date(Date.now() - 240000),
      level: 'info',
      action: 'INITIALIZE_ACTOR',
      details: 'Critic actor loaded. Subscribed to PlanIR review channel.',
    },
    {
      id: 'log-202',
      agentId: 'a2',
      agentName: 'Critic',
      timestamp: new Date(Date.now() - 230000),
      level: 'warn',
      action: 'EVALUATE_PLAN_IR',
      details: 'Critique complete. Identified 1 potential edge case: "Ensure components have Error Boundaries". Risk Score: 0.2.',
      metadata: { recommendation: 'approve', severity: 'low' }
    },
    {
      id: 'log-301',
      agentId: 'a3',
      agentName: 'Coder',
      timestamp: new Date(Date.now() - 120000),
      level: 'info',
      action: 'INITIALIZE_ACTOR',
      details: 'Coder actor ready. Waiting for SpecIR artifact generation.',
    },
    {
      id: 'log-302',
      agentId: 'a3',
      agentName: 'Coder',
      timestamp: new Date(Date.now() - 110000),
      level: 'success',
      action: 'WORKSPACE_MUTATION',
      details: 'Synthesized file nodes and generated NewComponent.tsx in src/ directory.',
      metadata: { createdFiles: ['src/NewComponent.tsx'], loc: 42 }
    },
    {
      id: 'log-401',
      agentId: 'a4',
      agentName: 'Validator',
      timestamp: new Date(Date.now() - 60000),
      level: 'info',
      action: 'RUN_VALIDATION_SUITE',
      details: 'Executing 3-tier validation: Intent Alignment, Rule Compliance, Code Correctness.',
    },
    {
      id: 'log-402',
      agentId: 'a4',
      agentName: 'Validator',
      timestamp: new Date(Date.now() - 50000),
      level: 'success',
      action: 'VALIDATION_PASSED',
      details: 'All validation criteria passed. Intent Alignment: 98%, Compliance: 100%, Correctness: 100%.',
      metadata: { score: 0.99, recommendation: 'complete' }
    }
  ];

  const agents = [
    { id: 'a1', name: 'Planner' },
    { id: 'a5', name: 'Architect' },
    { id: 'a2', name: 'Critic' },
    { id: 'a3', name: 'Coder' },
    { id: 'a4', name: 'Validator' },
    { id: 'a7', name: 'Analyst' },
    { id: 'a8', name: 'Ontologist' },
    { id: 'a9', name: 'Epistemologist' },
    { id: 'a10', name: 'Auditor' },
    { id: 'a11', name: 'DBA' },
    { id: 'a12', name: 'Topologist' },
  ];

  const actions = [
    { action: 'SYNTHESIZE_SPEC', level: 'info' as const, template: 'Synthesized specification constraints and model bounds.' },
    { action: 'EXECUTE_STEP', level: 'success' as const, template: 'Executed pipeline step with 0 type errors.' },
    { action: 'AUDIT_POLICY', level: 'info' as const, template: 'Verified safety policy boundaries against OWASP framework.' },
    { action: 'OPTIMIZE_SCHEMA', level: 'success' as const, template: 'Optimized index constraints and query plan.' },
    { action: 'DETECT_LATENCY_SPIKE', level: 'warn' as const, template: 'Sub-agent response time exceeded 450ms target threshold.' },
    { action: 'VALIDATE_CONTRACT', level: 'success' as const, template: 'Typecheck and contract verification succeeded.' },
    { action: 'RETRY_SUBTASK', level: 'warn' as const, template: 'Transient API rate limit encountered. Retried attempt #1.' },
    { action: 'CHECK_EPHEMERAL_STATE', level: 'info' as const, template: 'Checked memory snapshot integrity across cluster nodes.' },
  ];

  let logCounter = 1000;
  for (let dayOffset = 1; dayOffset <= 6; dayOffset++) {
    const logsTodayCount = Math.floor(Math.abs(Math.sin(dayOffset * 1.8)) * 5) + 6;
    for (let i = 0; i < logsTodayCount; i++) {
      const agent = agents[(dayOffset * 3 + i) % agents.length];
      const act = actions[(i + dayOffset) % actions.length];
      const hourOffset = (i * 3 + dayOffset * 2) % 24;
      const minuteOffset = (i * 19) % 60;

      const logDate = new Date();
      logDate.setDate(logDate.getDate() - dayOffset);
      logDate.setHours(hourOffset, minuteOffset, 0, 0);

      baseLogs.push({
        id: `log-hist-${logCounter++}`,
        agentId: agent.id,
        agentName: agent.name,
        timestamp: logDate,
        level: act.level,
        action: act.action,
        details: `${act.template} (Historical Execution)`,
        metadata: { dayOffset, hour: hourOffset, synthetic: true }
      });
    }
  }

  return baseLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

const INITIAL_AGENT_LOGS: AgentLogEntry[] = generateHistoricalSeedLogs();

export class SimulatedBackendService {
  // Legacy Streams
  private workspacesSubject = new BehaviorSubject<Workspace[]>([]);
  public workspaces$ = this.workspacesSubject.asObservable();
  
  private activeWorkspaceSubject = new BehaviorSubject<Workspace | null>(null);
  public activeWorkspace$ = this.activeWorkspaceSubject.asObservable();

  private fileTreeSubject = new BehaviorSubject<FileNode[]>(INITIAL_FILE_TREE);
  public fileTree$ = this.fileTreeSubject.asObservable();

  private architectChatSubject = new BehaviorSubject<ChatMessage[]>([]);
  public architectChat$ = this.architectChatSubject.asObservable();

  private builderLogsSubject = new BehaviorSubject<AgentLog[]>([]);
  public builderLogs$ = this.builderLogsSubject.asObservable();

  public terminalOutput$ = new Subject<string>();

  // Plurality Streams
  private workRequestsSubject = new BehaviorSubject<WorkRequest[]>(MOCK_WORK_REQUESTS);
  public workRequests$ = this.workRequestsSubject.asObservable();

  private activeWorkRequestSubject = new BehaviorSubject<WorkRequest | null>(MOCK_WORK_REQUESTS[1]);
  public activeWorkRequest$ = this.activeWorkRequestSubject.asObservable();

  private planIRSubject = new BehaviorSubject<PlanIR | null>(null);
  public planIR$ = this.planIRSubject.asObservable();

  private critiqueIRSubject = new BehaviorSubject<CritiqueIR | null>(null);
  public critiqueIR$ = this.critiqueIRSubject.asObservable();

  private specIRSubject = new BehaviorSubject<SpecIR | null>(null);
  public specIR$ = this.specIRSubject.asObservable();

  private executionIRSubject = new BehaviorSubject<ExecutionIR | null>(null);
  public executionIR$ = this.executionIRSubject.asObservable();

  private validationIRSubject = new BehaviorSubject<ValidationIR | null>(null);
  public validationIR$ = this.validationIRSubject.asObservable();
  
  private activeAgentsSubject = new BehaviorSubject<ActiveAgent[]>(loadPersistedAgents());
  public activeAgents$ = this.activeAgentsSubject.asObservable();

  private agentLogsSubject = new BehaviorSubject<AgentLogEntry[]>(loadPersistedLogs());
  public agentLogs$ = this.agentLogsSubject.asObservable();

  private selectedAgentSubject = new BehaviorSubject<ActiveAgent | null>(null);
  public selectedAgent$ = this.selectedAgentSubject.asObservable();

  private toastsSubject = new BehaviorSubject<ToastNotification[]>([]);
  public toasts$ = this.toastsSubject.asObservable();

  private roundtableSessionSubject = new BehaviorSubject<RoundtableSession | null>(null);
  public roundtableSession$ = this.roundtableSessionSubject.asObservable();

  private isRoundtableOpenSubject = new BehaviorSubject<boolean>(false);
  public isRoundtableOpen$ = this.isRoundtableOpenSubject.asObservable();

  private isAgentConfigOpenSubject = new BehaviorSubject<boolean>(false);
  public isAgentConfigOpen$ = this.isAgentConfigOpenSubject.asObservable();

  private isDependencyGraphOpenSubject = new BehaviorSubject<boolean>(false);
  public isDependencyGraphOpen$ = this.isDependencyGraphOpenSubject.asObservable();

  public openDependencyGraphModal() {
    this.isDependencyGraphOpenSubject.next(true);
  }

  public closeDependencyGraphModal() {
    this.isDependencyGraphOpenSubject.next(false);
  }

  public toggleDependencyGraphModal() {
    this.isDependencyGraphOpenSubject.next(!this.isDependencyGraphOpenSubject.getValue());
  }

  // Global Agent Activity Heatmap Modal Stream
  private isHeatmapModalOpenSubject = new BehaviorSubject<boolean>(false);
  public isHeatmapModalOpen$ = this.isHeatmapModalOpenSubject.asObservable();

  public openHeatmapModal() {
    this.isHeatmapModalOpenSubject.next(true);
  }

  public closeHeatmapModal() {
    this.isHeatmapModalOpenSubject.next(false);
  }

  public toggleHeatmapModal() {
    this.isHeatmapModalOpenSubject.next(!this.isHeatmapModalOpenSubject.getValue());
  }

  private isShortcutsOpenSubject = new BehaviorSubject<boolean>(false);
  public isShortcutsOpen$ = this.isShortcutsOpenSubject.asObservable();

  private isOnboardingOpenSubject = new BehaviorSubject<boolean>(
    typeof localStorage !== 'undefined' ? localStorage.getItem('plurality_onboarding_completed') !== 'true' : true
  );
  public isOnboardingOpen$ = this.isOnboardingOpenSubject.asObservable();

  public openOnboardingModal() {
    this.isOnboardingOpenSubject.next(true);
  }

  public closeOnboardingModal() {
    this.isOnboardingOpenSubject.next(false);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('plurality_onboarding_completed', 'true');
      }
    } catch (e) {
      console.warn('Failed to save onboarding preference', e);
    }
  }

  public toggleOnboardingModal() {
    const current = this.isOnboardingOpenSubject.getValue();
    if (current) {
      this.closeOnboardingModal();
    } else {
      this.openOnboardingModal();
    }
  }

  private isWorkRequestDetailOpenSubject = new BehaviorSubject<boolean>(false);
  public isWorkRequestDetailOpen$ = this.isWorkRequestDetailOpenSubject.asObservable();

  private selectedWorkRequestForDetailSubject = new BehaviorSubject<WorkRequest | null>(null);
  public selectedWorkRequestForDetail$ = this.selectedWorkRequestForDetailSubject.asObservable();

  // Workspace Layout Manager Streams
  private layoutConfigSubject = new BehaviorSubject<WorkspaceLayoutConfig>(loadPersistedLayoutConfig());
  public layoutConfig$ = this.layoutConfigSubject.asObservable();

  public getLayoutConfig(): WorkspaceLayoutConfig {
    return this.layoutConfigSubject.getValue();
  }

  public setLayoutMode(mode: WorkspaceLayoutMode) {
    const preset = DEFAULT_LAYOUT_CONFIGS[mode] || DEFAULT_LAYOUT_CONFIGS.default;
    this.layoutConfigSubject.next(preset);
    savePersistedLayoutConfig(preset);

    // If duality mode is selected, also sync isDualityModeSubject
    if (mode === 'duality') {
      if (!this.isDualityModeSubject.getValue()) {
        this.setDualityMode(true);
      }
    } else if (this.isDualityModeSubject.getValue()) {
      // If switching to another mode, turn off duality
      this.setDualityMode(false);
    }

    const modeLabels: Record<WorkspaceLayoutMode, string> = {
      default: 'Default Multi-Pane Mode',
      analysis: 'Analysis & Plan Mode',
      execution: 'Execution & Code Mode',
      debugging: 'Debugging & Logs Mode',
      duality: '1:1 Duality Mode',
      queue: 'Agent Task Queue Mode'
    };

    this.addToast({
      title: `📐 Layout: ${modeLabels[mode]}`,
      message: `Workspace panels adjusted for ${mode} workflow.`,
      type: 'info'
    });

    this.addAgentLog({
      agentId: 'a1',
      agentName: 'Planner',
      level: 'info',
      action: 'LAYOUT_MODE_CHANGED',
      details: `Workspace layout switched to [${mode}]. Panels updated: WorkRequests=${preset.showWorkRequests}, Terminal=${preset.showTerminal}, Timeline=${preset.showTimeline}, FileTree=${preset.showFileTree}, Logs=${preset.showLogDrawer}, Queue=${preset.showTaskQueue}.`,
      metadata: { mode, config: preset }
    });
  }

  public togglePanelVisibility(panel: keyof Omit<WorkspaceLayoutConfig, 'mode'>) {
    const current = this.layoutConfigSubject.getValue();
    const updated: WorkspaceLayoutConfig = {
      ...current,
      [panel]: !current[panel]
    };
    this.layoutConfigSubject.next(updated);
    savePersistedLayoutConfig(updated);
  }

  // Agent Task Queue Streams & Methods
  private agentTaskQueueSubject = new BehaviorSubject<AgentTaskItem[]>(loadPersistedTaskQueue());
  public agentTaskQueue$ = this.agentTaskQueueSubject.asObservable();

  private isTaskQueueOpenSubject = new BehaviorSubject<boolean>(false);
  public isTaskQueueOpen$ = this.isTaskQueueOpenSubject.asObservable();

  private selectedTaskForDetailSubject = new BehaviorSubject<AgentTaskItem | null>(null);
  public selectedTaskForDetail$ = this.selectedTaskForDetailSubject.asObservable();

  public openTaskQueueModal() {
    this.isTaskQueueOpenSubject.next(true);
  }

  public closeTaskQueueModal() {
    this.isTaskQueueOpenSubject.next(false);
  }

  public toggleTaskQueueModal() {
    this.isTaskQueueOpenSubject.next(!this.isTaskQueueOpenSubject.getValue());
  }

  public setSelectedTaskForDetail(task: AgentTaskItem | null) {
    this.selectedTaskForDetailSubject.next(task);
  }

  public getTaskQueue(): AgentTaskItem[] {
    return this.agentTaskQueueSubject.getValue();
  }

  public getTaskQueueStats(): AgentTaskQueueStats {
    const queue = this.agentTaskQueueSubject.getValue();
    const totalCount = queue.length;
    const pendingCount = queue.filter(t => t.status === 'pending').length;
    const activeCount = queue.filter(t => t.status === 'active').length;
    const completedCount = queue.filter(t => t.status === 'completed').length;
    const failedCount = queue.filter(t => t.status === 'failed').length;
    const pausedCount = queue.filter(t => t.status === 'paused').length;
    const architectCount = queue.filter(t => t.assignedAgent === 'architect').length;
    const builderCount = queue.filter(t => t.assignedAgent === 'builder').length;
    const totalTokens = queue.reduce((acc, t) => acc + (t.tokensUsed || 0), 0);
    const completedTasks = queue.filter(t => t.status === 'completed' && t.actualDurationMs);
    const avgDurationMs = completedTasks.length > 0 
      ? Math.round(completedTasks.reduce((acc, t) => acc + (t.actualDurationMs || 0), 0) / completedTasks.length)
      : 1800;
    const completionRatePercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return {
      totalCount,
      pendingCount,
      activeCount,
      completedCount,
      failedCount,
      pausedCount,
      architectCount,
      builderCount,
      totalTokens,
      avgDurationMs,
      completionRatePercent
    };
  }

  public addTaskToQueue(taskInput: Partial<AgentTaskItem>): AgentTaskItem {
    const currentQueue = this.agentTaskQueueSubject.getValue();
    const assignedAgent = taskInput.assignedAgent || 'builder';
    const isArch = assignedAgent === 'architect';
    
    const newTask: AgentTaskItem = {
      id: taskInput.id || `task-${assignedAgent === 'architect' ? 'arch' : 'bld'}-${Date.now().toString().slice(-4)}`,
      title: taskInput.title || 'Untitled Sub-Task',
      description: taskInput.description || 'Decomposed task unit for agent execution pipeline.',
      assignedAgent,
      agentId: taskInput.agentId || (isArch ? 'a5' : 'a3'),
      agentName: taskInput.agentName || (isArch ? 'Architect' : 'Coder / Builder'),
      agentRole: taskInput.agentRole || (isArch ? 'System Architect' : 'Lead Builder'),
      model: taskInput.model || (isArch ? 'claude-3-7-sonnet' : 'qwen2.5-coder:latest'),
      status: taskInput.status || 'pending',
      priority: taskInput.priority || 'medium',
      progress: taskInput.progress || 0,
      createdAt: new Date().toISOString(),
      estimatedDurationMs: taskInput.estimatedDurationMs || (isArch ? 1500 : 2200),
      dependencies: taskInput.dependencies || [],
      outputs: taskInput.outputs || [],
      substeps: taskInput.substeps || [
        { id: `sub-${Date.now()}-1`, name: `Analyze input parameters & constraints`, status: 'pending' },
        { id: `sub-${Date.now()}-2`, name: `Execute synthesis pass`, status: 'pending' },
        { id: `sub-${Date.now()}-3`, name: `Validate output artifacts`, status: 'pending' }
      ],
      codeSnippet: taskInput.codeSnippet,
      parentWorkRequestId: taskInput.parentWorkRequestId
    };

    const updated = [newTask, ...currentQueue];
    this.agentTaskQueueSubject.next(updated);
    savePersistedTaskQueue(updated);

    this.addToast({
      title: `📋 Sub-Task Enqueued: ${newTask.title.slice(0, 30)}...`,
      message: `Assigned to ${newTask.agentName} [${newTask.priority.toUpperCase()} priority]`,
      type: 'info',
      agentId: newTask.agentId,
      agentName: newTask.agentName,
      agentRole: newTask.agentRole
    });

    this.addAgentLog({
      agentId: newTask.agentId,
      agentName: newTask.agentName,
      level: 'info',
      action: 'TASK_ENQUEUED',
      details: `Sub-task [${newTask.id}] "${newTask.title}" added to queue for ${newTask.agentName} (${newTask.assignedAgent.toUpperCase()}).`,
      metadata: { taskId: newTask.id, priority: newTask.priority, dependencies: newTask.dependencies }
    });

    return newTask;
  }

  public updateTaskInQueue(taskId: string, updates: Partial<AgentTaskItem>) {
    const currentQueue = this.agentTaskQueueSubject.getValue();
    const updated = currentQueue.map(t => {
      if (t.id === taskId) {
        return { ...t, ...updates };
      }
      return t;
    });
    this.agentTaskQueueSubject.next(updated);
    savePersistedTaskQueue(updated);
  }

  public deleteTaskFromQueue(taskId: string) {
    const currentQueue = this.agentTaskQueueSubject.getValue();
    const task = currentQueue.find(t => t.id === taskId);
    const updated = currentQueue.filter(t => t.id !== taskId);
    this.agentTaskQueueSubject.next(updated);
    savePersistedTaskQueue(updated);

    if (task) {
      this.addToast({
        title: 'Task Removed',
        message: `Removed "${task.title.slice(0, 35)}..." from the queue.`,
        type: 'info'
      });
    }
  }

  public clearCompletedTasks() {
    const currentQueue = this.agentTaskQueueSubject.getValue();
    const beforeCount = currentQueue.length;
    const updated = currentQueue.filter(t => t.status !== 'completed');
    const removedCount = beforeCount - updated.length;
    this.agentTaskQueueSubject.next(updated);
    savePersistedTaskQueue(updated);

    this.addToast({
      title: 'Queue Cleaned',
      message: `Cleared ${removedCount} completed sub-task${removedCount === 1 ? '' : 's'} from view.`,
      type: 'info'
    });
  }

  public resetTaskQueueToDefault() {
    this.agentTaskQueueSubject.next(INITIAL_AGENT_TASK_QUEUE);
    savePersistedTaskQueue(INITIAL_AGENT_TASK_QUEUE);
    this.addToast({
      title: 'Queue Reset',
      message: 'Restored baseline Architect & Builder sub-task queue.',
      type: 'info'
    });
  }

  public pauseTask(taskId: string) {
    const task = this.agentTaskQueueSubject.getValue().find(t => t.id === taskId);
    if (!task) return;
    this.updateTaskInQueue(taskId, { status: 'paused' });
    this.updateAgentStatus(task.agentId, 'idle');
    this.addToast({
      title: '⏸️ Task Paused',
      message: `Execution paused for "${task.title.slice(0, 35)}..."`,
      type: 'warn',
      agentId: task.agentId,
      agentName: task.agentName
    });
  }

  public resumeTask(taskId: string) {
    const task = this.agentTaskQueueSubject.getValue().find(t => t.id === taskId);
    if (!task) return;
    this.startTaskExecution(taskId);
  }

  public retryTask(taskId: string) {
    this.updateTaskInQueue(taskId, {
      status: 'pending',
      progress: 0,
      startedAt: undefined,
      completedAt: undefined,
      actualDurationMs: undefined,
      errorMessage: undefined,
      substeps: this.agentTaskQueueSubject.getValue().find(t => t.id === taskId)?.substeps.map(s => ({ ...s, status: 'pending' })) || []
    });
    this.startTaskExecution(taskId);
  }

  public markTaskCompleted(taskId: string) {
    const task = this.agentTaskQueueSubject.getValue().find(t => t.id === taskId);
    if (!task) return;
    const nowStr = new Date().toISOString();
    const duration = task.actualDurationMs || task.estimatedDurationMs || 1500;
    const tokens = task.tokensUsed || 2400;

    this.updateTaskInQueue(taskId, {
      status: 'completed',
      progress: 100,
      completedAt: nowStr,
      actualDurationMs: duration,
      tokensUsed: tokens,
      substeps: task.substeps.map(s => ({ ...s, status: 'completed' }))
    });
    this.updateAgentStatus(task.agentId, 'idle');

    this.addToast({
      title: `✅ Sub-Task Completed: ${task.title.slice(0, 35)}...`,
      message: `Finished by ${task.agentName} in ${(duration / 1000).toFixed(1)}s (${tokens} tokens)`,
      type: 'success',
      agentId: task.agentId,
      agentName: task.agentName,
      agentRole: task.agentRole
    });
  }

  public startTaskExecution(taskId: string) {
    const queue = this.agentTaskQueueSubject.getValue();
    const task = queue.find(t => t.id === taskId);
    if (!task || task.status === 'completed') return;

    if (task.dependencies && task.dependencies.length > 0) {
      const unfulfilled = queue.filter(t => task.dependencies.includes(t.id) && t.status !== 'completed');
      if (unfulfilled.length > 0) {
        this.addToast({
          title: '⚠️ Prerequisite Dependency Pending',
          message: `Task relies on ${unfulfilled.map(u => u.id).join(', ')}. Executing dependency chain...`,
          type: 'warn'
        });
      }
    }

    const now = new Date();
    this.updateAgentStatus(task.agentId, 'working');
    
    this.updateTaskInQueue(taskId, {
      status: 'active',
      startedAt: now.toISOString(),
      progress: Math.max(task.progress || 0, 15),
      substeps: task.substeps.map((s, idx) => ({
        ...s,
        status: idx === 0 ? 'running' : s.status === 'completed' ? 'completed' : 'pending'
      }))
    });

    this.terminalOutput$.next(`\r\n\x1b[35m[AGENT QUEUE]\x1b[0m Starting execution of [${task.id}] "${task.title}" via ${task.agentName} [${task.model}]...\r\n`);
    
    this.addAgentLog({
      agentId: task.agentId,
      agentName: task.agentName,
      level: 'info',
      action: 'TASK_EXECUTION_START',
      details: `Started sub-task execution [${task.id}]: "${task.title}". Priority: ${task.priority.toUpperCase()}, Est: ${task.estimatedDurationMs}ms.`,
      metadata: { taskId: task.id, model: task.model, dependencies: task.dependencies }
    });

    const totalEst = task.estimatedDurationMs || 2000;
    const stepTime = Math.round(totalEst / 4);

    setTimeout(() => {
      const current = this.agentTaskQueueSubject.getValue().find(t => t.id === taskId);
      if (!current || current.status !== 'active') return;

      this.updateTaskInQueue(taskId, {
        progress: 45,
        substeps: current.substeps.map((s, idx) => ({
          ...s,
          status: idx === 0 ? 'completed' : idx === 1 ? 'running' : 'pending'
        }))
      });
      this.terminalOutput$.next(`\x1b[32m[${task.agentName}]\x1b[0m Executed substep 1: ${current.substeps[0]?.name || 'Parameters processed'}\r\n`);
    }, stepTime);

    setTimeout(() => {
      const current = this.agentTaskQueueSubject.getValue().find(t => t.id === taskId);
      if (!current || current.status !== 'active') return;

      this.updateTaskInQueue(taskId, {
        progress: 80,
        substeps: current.substeps.map((s, idx) => ({
          ...s,
          status: idx <= 1 ? 'completed' : idx === 2 ? 'running' : 'pending'
        }))
      });
      this.terminalOutput$.next(`\x1b[32m[${task.agentName}]\x1b[0m Synthesizing artifacts for substep 2: ${current.substeps[1]?.name || 'Synthesis complete'}\r\n`);
    }, stepTime * 2.2);

    setTimeout(() => {
      const current = this.agentTaskQueueSubject.getValue().find(t => t.id === taskId);
      if (!current || current.status !== 'active') return;

      const duration = Math.round(totalEst * (0.9 + Math.random() * 0.2));
      const promptTok = current.promptTokens || (1200 + Math.round(Math.random() * 800));
      const compTok = current.completionTokens || (600 + Math.round(Math.random() * 900));
      const totalTok = promptTok + compTok;
      const tps = Math.round((totalTok / (duration / 1000)));

      this.updateTaskInQueue(taskId, {
        status: 'completed',
        progress: 100,
        completedAt: new Date().toISOString(),
        actualDurationMs: duration,
        promptTokens: promptTok,
        completionTokens: compTok,
        tokensUsed: totalTok,
        tokensPerSec: tps,
        substeps: current.substeps.map(s => ({ ...s, status: 'completed' }))
      });

      this.updateAgentStatus(task.agentId, 'idle');

      this.terminalOutput$.next(`\x1b[32m✓ [${task.agentName}]\x1b[0m Sub-task [${task.id}] completed successfully in ${duration}ms (${totalTok} tokens @ ${tps} tok/s).\r\n`);

      this.addToast({
        title: `✅ Sub-Task Completed: ${task.title.slice(0, 35)}...`,
        message: `${task.agentName} produced outputs: ${task.outputs?.join(', ') || 'verified artifacts'}`,
        type: 'success',
        agentId: task.agentId,
        agentName: task.agentName,
        agentRole: task.agentRole
      });

      this.addAgentLog({
        agentId: task.agentId,
        agentName: task.agentName,
        level: 'success',
        action: 'TASK_EXECUTION_COMPLETE',
        details: `Sub-task [${task.id}] "${task.title}" completed. Tokens: ${totalTok} (${tps} tok/s), Duration: ${duration}ms.`,
        metadata: { taskId: task.id, durationMs: duration, tokensUsed: totalTok, outputs: task.outputs }
      });
    }, totalEst);
  }

  public runAllPendingTasks() {
    const queue = this.agentTaskQueueSubject.getValue();
    const pending = queue.filter(t => t.status === 'pending' || t.status === 'paused');
    if (pending.length === 0) {
      this.addToast({
        title: 'Queue Empty',
        message: 'No pending sub-tasks to run. All tasks are completed or running.',
        type: 'info'
      });
      return;
    }

    this.addToast({
      title: '🚀 Batch Queue Dispatch',
      message: `Sequencing execution of ${pending.length} pending sub-task${pending.length === 1 ? '' : 's'} across Architect & Builder...`,
      type: 'info'
    });

    pending.forEach((task, idx) => {
      setTimeout(() => {
        this.startTaskExecution(task.id);
      }, idx * 1200);
    });
  }

  public updateLayoutConfig(updates: Partial<WorkspaceLayoutConfig>) {
    const current = this.layoutConfigSubject.getValue();
    const updated: WorkspaceLayoutConfig = {
      ...current,
      ...updates
    };
    this.layoutConfigSubject.next(updated);
    savePersistedLayoutConfig(updated);
  }

  public resetLayout() {
    this.setLayoutMode('default');
  }

  // Duality Mode Streams
  private isDualityModeSubject = new BehaviorSubject<boolean>(loadPersistedDualityEnabled());
  public isDualityMode$ = this.isDualityModeSubject.asObservable();

  private dualityStateSubject = new BehaviorSubject<DualityState>(loadPersistedDualityState());
  public dualityState$ = this.dualityStateSubject.asObservable();

  public setDualityMode(enabled: boolean) {
    this.isDualityModeSubject.next(enabled);
    const current = this.dualityStateSubject.getValue();
    const updated = { ...current, enabled };
    this.dualityStateSubject.next(updated);
    savePersistedDualityState(updated);

    this.addToast({
      title: enabled ? '⚡ Duality Mode Activated' : 'Duality Mode Deactivated',
      message: enabled 
        ? 'Engaged 1:1 Operator ↔ Architect channel with live Builder inter-agent execution.'
        : 'Returned to standard Multi-Agent orchestration workspace.',
      type: enabled ? 'success' : 'info'
    });

    this.addAgentLog({
      agentId: current.primaryAgentId || 'a5',
      agentName: 'Architect',
      level: 'info',
      action: 'DUALITY_MODE_TOGGLE',
      details: `Duality Mode ${enabled ? 'ENABLED' : 'DISABLED'}. Primary Role: ${current.primaryRole} [${current.primaryModel}], Secondary Role: ${current.secondaryRole} [${current.secondaryModel}].`,
      metadata: { enabled, primaryRole: current.primaryRole, secondaryRole: current.secondaryRole }
    });
  }

  public toggleDualityMode() {
    this.setDualityMode(!this.isDualityModeSubject.getValue());
  }

  public setDualityPrimaryRole(role: string, model: string = 'claude-3-7-sonnet', agentId?: string) {
    const current = this.dualityStateSubject.getValue();
    const resolvedAgentId = agentId || (this.activeAgentsSubject.getValue().find(a => a.role.toLowerCase() === role.toLowerCase() || a.name.toLowerCase() === role.toLowerCase())?.id || 'a5');
    const baseline = MODEL_PERF_BASELINES[model] || MODEL_PERF_BASELINES['claude-3-7-sonnet'];

    const perf = current.performanceMetrics || INITIAL_DUALITY_PERFORMANCE_METRICS;
    const updatedMetrics: DualityPerformanceMetrics = {
      ...perf,
      primary: {
        ...perf.primary,
        role,
        model,
        agentId: resolvedAgentId,
        slaTargetMs: baseline.slaTargetMs,
        tokensPerSec: baseline.tokensPerSec,
        cacheHitPct: baseline.cacheHitBaseline
      }
    };

    const updated: DualityState = {
      ...current,
      primaryRole: role,
      primaryModel: model,
      primaryAgentId: resolvedAgentId,
      performanceMetrics: updatedMetrics
    };
    this.dualityStateSubject.next(updated);
    savePersistedDualityState(updated);

    this.addToast({
      title: `Primary Role: ${role}`,
      message: `Model set to ${model} (Target SLA: ${baseline.slaTargetMs}ms).`,
      type: 'info'
    });
  }

  public setDualitySecondaryRole(role: string, model: string = 'qwen2.5-coder:latest', agentId?: string) {
    const current = this.dualityStateSubject.getValue();
    const resolvedAgentId = agentId || (this.activeAgentsSubject.getValue().find(a => a.role.toLowerCase() === role.toLowerCase() || a.name.toLowerCase() === role.toLowerCase())?.id || 'a3');
    const baseline = MODEL_PERF_BASELINES[model] || MODEL_PERF_BASELINES['qwen2.5-coder:latest'];

    const perf = current.performanceMetrics || INITIAL_DUALITY_PERFORMANCE_METRICS;
    const updatedMetrics: DualityPerformanceMetrics = {
      ...perf,
      secondary: {
        ...perf.secondary,
        role,
        model,
        agentId: resolvedAgentId,
        slaTargetMs: baseline.slaTargetMs,
        tokensPerSec: baseline.tokensPerSec,
        cacheHitPct: baseline.cacheHitBaseline
      }
    };

    const updated: DualityState = {
      ...current,
      secondaryRole: role,
      secondaryModel: model,
      secondaryAgentId: resolvedAgentId,
      performanceMetrics: updatedMetrics
    };
    this.dualityStateSubject.next(updated);
    savePersistedDualityState(updated);

    this.addToast({
      title: `Secondary Role: ${role}`,
      message: `Builder target model set to ${model} (Target SLA: ${baseline.slaTargetMs}ms).`,
      type: 'info'
    });
  }

  public recordDualityTurnMetric(
    agentType: 'primary' | 'secondary',
    metric: {
      action: string;
      latencyMs: number;
      promptTokens: number;
      completionTokens: number;
      status?: 'success' | 'warn' | 'error';
    }
  ) {
    const current = this.dualityStateSubject.getValue();
    const perf = current.performanceMetrics || INITIAL_DUALITY_PERFORMANCE_METRICS;
    const agent = agentType === 'primary' ? perf.primary : perf.secondary;
    const model = agentType === 'primary' ? current.primaryModel : current.secondaryModel;
    const role = agentType === 'primary' ? current.primaryRole : current.secondaryRole;
    const agentId = agentType === 'primary' ? current.primaryAgentId : current.secondaryAgentId;
    const baseline = MODEL_PERF_BASELINES[model] || MODEL_PERF_BASELINES['claude-3-7-sonnet'];

    const totalTokens = metric.promptTokens + metric.completionTokens;
    const tokensPerSec = metric.latencyMs > 0 ? Math.round(metric.completionTokens / (metric.latencyMs / 1000)) : baseline.tokensPerSec;
    const turnCost = (metric.promptTokens / 1_000_000 * baseline.costPerMprompt) + (metric.completionTokens / 1_000_000 * baseline.costPerMcomp);

    const newTurnsCount = agent.turnsCount + 1;
    const newTotalTokens = agent.totalTokensUsed + totalTokens;
    const newPromptTokens = agent.promptTokens + metric.promptTokens;
    const newCompletionTokens = agent.completionTokens + metric.completionTokens;
    const newCost = Number((agent.estimatedCostUsd + turnCost).toFixed(4));

    const updatedLatencyHist = [...(agent.latencyHistory || []), metric.latencyMs].slice(-12);
    const updatedTokensHist = [...(agent.tokensHistory || []), totalTokens].slice(-12);
    const avgLatency = Math.round(updatedLatencyHist.reduce((a, b) => a + b, 0) / updatedLatencyHist.length);
    const minLatency = Math.min(...updatedLatencyHist);
    const maxLatency = Math.max(...updatedLatencyHist);

    const updatedAgentMetric: DualityAgentMetric = {
      ...agent,
      role,
      model,
      agentId,
      turnsCount: newTurnsCount,
      lastLatencyMs: metric.latencyMs,
      avgLatencyMs: avgLatency,
      minLatencyMs: minLatency,
      maxLatencyMs: maxLatency,
      totalTokensUsed: newTotalTokens,
      promptTokens: newPromptTokens,
      completionTokens: newCompletionTokens,
      tokensPerSec: tokensPerSec,
      estimatedCostUsd: newCost,
      latencyHistory: updatedLatencyHist,
      tokensHistory: updatedTokensHist,
      status: 'idle'
    };

    const newTurn: DualityTurnMetric = {
      turnId: `turn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date(),
      role,
      agentName: agentType === 'primary' ? 'Architect' : 'Coder',
      agentId,
      model,
      action: metric.action,
      latencyMs: metric.latencyMs,
      promptTokens: metric.promptTokens,
      completionTokens: metric.completionTokens,
      totalTokens,
      tokensPerSec,
      status: metric.status || 'success'
    };

    const updatedPerf: DualityPerformanceMetrics = {
      ...perf,
      primary: agentType === 'primary' ? updatedAgentMetric : perf.primary,
      secondary: agentType === 'secondary' ? updatedAgentMetric : perf.secondary,
      totalSessionTokens: perf.totalSessionTokens + totalTokens,
      totalSessionCostUsd: Number((perf.totalSessionCostUsd + turnCost).toFixed(4)),
      totalTurns: perf.totalTurns + 1,
      lastUpdated: new Date().toISOString(),
      recentTurns: [newTurn, ...(perf.recentTurns || [])].slice(0, 30)
    };

    const updatedState: DualityState = {
      ...current,
      performanceMetrics: updatedPerf
    };
    this.dualityStateSubject.next(updatedState);
    savePersistedDualityState(updatedState);
  }

  public runDualityBenchmark() {
    const current = this.dualityStateSubject.getValue();
    const perf = current.performanceMetrics || INITIAL_DUALITY_PERFORMANCE_METRICS;
    if (perf.benchmarkRunning) return;

    const stateWithBenchmark: DualityState = {
      ...current,
      performanceMetrics: {
        ...perf,
        benchmarkRunning: true
      }
    };
    this.dualityStateSubject.next(stateWithBenchmark);

    this.addToast({
      title: '⚡ Duality Benchmark Initiated',
      message: `Executing concurrent latency & token generation test for ${current.primaryRole} [${current.primaryModel}] vs ${current.secondaryRole} [${current.secondaryModel}]...`,
      type: 'info'
    });

    this.terminalOutput$.next(`\r\n\x1b[33m[DUALITY BENCHMARK]\x1b[0m Commencing side-by-side performance profiling...\r\n`);

    setTimeout(() => {
      const primaryBase = MODEL_PERF_BASELINES[current.primaryModel] || MODEL_PERF_BASELINES['claude-3-7-sonnet'];
      const secondaryBase = MODEL_PERF_BASELINES[current.secondaryModel] || MODEL_PERF_BASELINES['qwen2.5-coder:latest'];

      const primLatency = Math.round(primaryBase.baseLatencyMs * (0.92 + Math.random() * 0.16));
      const primPrompt = 1450 + Math.round(Math.random() * 200);
      const primComp = Math.round((primLatency / 1000) * primaryBase.tokensPerSec);

      const secLatency = Math.round(secondaryBase.baseLatencyMs * (0.92 + Math.random() * 0.16));
      const secPrompt = 1200 + Math.round(Math.random() * 200);
      const secComp = Math.round((secLatency / 1000) * secondaryBase.tokensPerSec);

      this.recordDualityTurnMetric('primary', {
        action: 'BENCHMARK_INTENT_REASONING',
        latencyMs: primLatency,
        promptTokens: primPrompt,
        completionTokens: primComp,
        status: 'success'
      });

      this.recordDualityTurnMetric('secondary', {
        action: 'BENCHMARK_CODE_SYNTHESIS',
        latencyMs: secLatency,
        promptTokens: secPrompt,
        completionTokens: secComp,
        status: 'success'
      });

      const updated = this.dualityStateSubject.getValue();
      const updatedPerf = {
        ...(updated.performanceMetrics || INITIAL_DUALITY_PERFORMANCE_METRICS),
        benchmarkRunning: false
      };

      const finalState = {
        ...updated,
        performanceMetrics: updatedPerf
      };
      this.dualityStateSubject.next(finalState);
      savePersistedDualityState(finalState);

      const latencyDiff = Math.abs(primLatency - secLatency);
      const fasterAgent = primLatency < secLatency ? current.primaryRole : current.secondaryRole;
      const speedDiffPct = Math.round((latencyDiff / Math.max(primLatency, secLatency)) * 100);

      this.terminalOutput$.next(`\x1b[32m[DUALITY BENCHMARK COMPLETE]\x1b[0m ${current.primaryRole} (${primLatency}ms, ${primaryBase.tokensPerSec} t/s) | ${current.secondaryRole} (${secLatency}ms, ${secondaryBase.tokensPerSec} t/s). ${fasterAgent} is ${speedDiffPct}% faster response.\r\n`);

      this.addToast({
        title: '✓ Benchmark Complete',
        message: `${fasterAgent} responded ${speedDiffPct}% faster (${Math.min(primLatency, secLatency)}ms vs ${Math.max(primLatency, secLatency)}ms). Telemetry metrics updated.`,
        type: 'success'
      });
    }, 1400);
  }

  public resetDualityMetrics() {
    const current = this.dualityStateSubject.getValue();
    const primBase = MODEL_PERF_BASELINES[current.primaryModel] || MODEL_PERF_BASELINES['claude-3-7-sonnet'];
    const secBase = MODEL_PERF_BASELINES[current.secondaryModel] || MODEL_PERF_BASELINES['qwen2.5-coder:latest'];

    const cleanMetrics: DualityPerformanceMetrics = {
      primary: {
        agentId: current.primaryAgentId || 'a5',
        role: current.primaryRole,
        agentName: 'Architect',
        model: current.primaryModel,
        turnsCount: 1,
        lastLatencyMs: primBase.baseLatencyMs,
        avgLatencyMs: primBase.baseLatencyMs,
        minLatencyMs: primBase.baseLatencyMs,
        maxLatencyMs: primBase.baseLatencyMs,
        totalTokensUsed: 2200,
        promptTokens: 1500,
        completionTokens: 700,
        tokensPerSec: primBase.tokensPerSec,
        cacheHitPct: primBase.cacheHitBaseline,
        estimatedCostUsd: 0.015,
        slaTargetMs: primBase.slaTargetMs,
        status: 'idle',
        latencyHistory: [primBase.baseLatencyMs],
        tokensHistory: [2200]
      },
      secondary: {
        agentId: current.secondaryAgentId || 'a3',
        role: current.secondaryRole,
        agentName: 'Coder',
        model: current.secondaryModel,
        turnsCount: 1,
        lastLatencyMs: secBase.baseLatencyMs,
        avgLatencyMs: secBase.baseLatencyMs,
        minLatencyMs: secBase.baseLatencyMs,
        maxLatencyMs: secBase.baseLatencyMs,
        totalTokensUsed: 2800,
        promptTokens: 1200,
        completionTokens: 1600,
        tokensPerSec: secBase.tokensPerSec,
        cacheHitPct: secBase.cacheHitBaseline,
        estimatedCostUsd: 0.001,
        slaTargetMs: secBase.slaTargetMs,
        status: 'idle',
        latencyHistory: [secBase.baseLatencyMs],
        tokensHistory: [2800]
      },
      totalSessionTokens: 5000,
      totalSessionCostUsd: 0.016,
      totalTurns: 2,
      lastUpdated: new Date().toISOString(),
      recentTurns: [
        {
          turnId: `turn-reset-1`,
          timestamp: new Date(),
          role: current.primaryRole,
          agentName: 'Architect',
          agentId: current.primaryAgentId || 'a5',
          model: current.primaryModel,
          action: 'INITIAL_INTENT_CALIBRATION',
          latencyMs: primBase.baseLatencyMs,
          promptTokens: 1500,
          completionTokens: 700,
          totalTokens: 2200,
          tokensPerSec: primBase.tokensPerSec,
          status: 'success'
        }
      ],
      benchmarkRunning: false
    };

    const updatedState: DualityState = {
      ...current,
      performanceMetrics: cleanMetrics
    };
    this.dualityStateSubject.next(updatedState);
    savePersistedDualityState(updatedState);

    this.addToast({
      title: 'Metrics Reset',
      message: 'Telemetry counters and turn history reset to baseline.',
      type: 'info'
    });
  }

  public sendDualityUserPrompt(promptText: string) {
    const text = promptText.trim();
    if (!text) return;

    const current = this.dualityStateSubject.getValue();
    const userMsg: DualityMessage = {
      id: `d-user-${Date.now()}`,
      sender: 'user',
      role: 'User Operator',
      content: text,
      timestamp: new Date()
    };

    const updatedWithUser: DualityState = {
      ...current,
      isExecuting: true,
      userMessages: [...current.userMessages, userMsg]
    };
    this.dualityStateSubject.next(updatedWithUser);
    savePersistedDualityState(updatedWithUser);

    this.updateAgentStatus(current.primaryAgentId || 'a5', 'working');
    this.terminalOutput$.next(`\r\n\x1b[36m[${current.primaryRole}]\x1b[0m Ingesting user prompt: "${text}"...\r\n`);

    // Simulate intelligent Architect synthesis and response
    setTimeout(() => {
      const lower = text.toLowerCase();
      let responseContent = '';
      let decisionCard: DecisionCard | undefined;

      if (lower.includes('auth') || lower.includes('security') || lower.includes('login') || lower.includes('token') || lower.includes('rbac')) {
        responseContent = `I have analyzed your authentication and authorization requirements for: **"${text}"**.\n\n### Architectural Assessment:\n1. **Zero-Trust Token Boundary**: Recommend decoupling identity claims verification from domain services.\n2. **Session Lifecycle**: Must support cryptographically signed tokens with automatic background rotation.\n3. **RBAC Granularity**: Define role-based capability bits mapped to endpoint guards.\n\nPlease select your preferred security architecture below:`;
        decisionCard = {
          id: `card-${Date.now()}`,
          title: 'Security Architecture: Identity & Session Strategy',
          description: 'Determine the authentication mechanism and session persistence topology:',
          category: 'security',
          status: 'pending',
          options: [
            {
              id: 'opt-jwt-cookie',
              label: 'HttpOnly Signed JWT Cookies with Refresh Rotation',
              description: 'Stateless verification at edge API gateway with rotating cryptographic refresh tokens and CSRF double-submit protection.',
              impact: { latency: '< 3ms', complexity: 'Low', security: 'High (OWASP Compliant)' },
              recommended: true
            },
            {
              id: 'opt-redis-session',
              label: 'Centralized Redis Session Store with OIDC Claims',
              description: 'Stateful instantaneous session revocation with clustered cache lookups and federated OpenID Connect synchronization.',
              impact: { latency: '8-12ms', complexity: 'Medium', security: 'Maximum (Instant Revocation)' }
            },
            {
              id: 'opt-webauthn',
              label: 'FIDO2 / WebAuthn Passkeys First',
              description: 'Hardware-backed biometric passkey authentication eliminating passwords completely, with fallback magic link verification.',
              impact: { latency: '15-25ms', complexity: 'High', security: 'Maximum (Phishing-Resistant)' }
            }
          ]
        };
      } else if (lower.includes('data') || lower.includes('sql') || lower.includes('database') || lower.includes('schema') || lower.includes('model') || lower.includes('persist')) {
        responseContent = `Evaluating data persistence topology for: **"${text}"**.\n\n### Schema & Persistence Strategy:\n1. **Normalized Entity Relations**: Establish deterministic primary keys and foreign key constraints.\n2. **Index Optimization**: Composite indexing on query hot-paths to guarantee sub-millisecond lookups.\n3. **Migration Integrity**: Automated schema diffing with reversible migration rollbacks.\n\nChoose the schema governance model:`;
        decisionCard = {
          id: `card-${Date.now()}`,
          title: 'Database Architecture: Schema & Query Layer',
          description: 'Select the database engine and type-safe query abstraction layer:',
          category: 'schema',
          status: 'pending',
          options: [
            {
              id: 'opt-drizzle-pg',
              label: 'Drizzle ORM + PostgreSQL with Connection Pooling',
              description: 'Zero-overhead TypeScript query builder with native SQL-like syntax and lightweight connection pooling.',
              impact: { latency: '< 4ms', complexity: 'Low', resilience: 'High (99.9%)' },
              recommended: true
            },
            {
              id: 'opt-event-sourcing',
              label: 'Event Sourcing with CQRS Projections',
              description: 'Immutable append-only event store with specialized read-model projections for complex analytical queries.',
              impact: { latency: '10-20ms', complexity: 'High', resilience: 'Maximum (Full Audit Trail)' }
            },
            {
              id: 'opt-embedded-sqlite',
              label: 'Embedded SQLite / LibSQL with Cloud Replica',
              description: 'Ultra-fast in-memory edge execution with asynchronous background syncing to distributed cloud storage.',
              impact: { latency: '< 1ms (Local)', complexity: 'Medium', resilience: 'High (99.5%)' }
            }
          ]
        };
      } else if (lower.includes('api') || lower.includes('rest') || lower.includes('graphql') || lower.includes('grpc') || lower.includes('endpoint')) {
        responseContent = `Designing API Gateway and protocol contract for: **"${text}"**.\n\n### Protocol Decomposition:\n1. **Interface Contract**: Strict OpenAPI / Protocol Buffer contracts with schema validation at ingress.\n2. **Error Envelope**: Structured RFC 7807 Problem Details for consistent error reporting.\n3. **Rate Limiting**: Token bucket rate limiting with Redis-backed distributed counters.\n\nSelect your target API protocol:`;
        decisionCard = {
          id: `card-${Date.now()}`,
          title: 'API Architecture: Protocol & Interface Standard',
          description: 'Choose the communication protocol and client-server contract format:',
          category: 'architecture',
          status: 'pending',
          options: [
            {
              id: 'opt-rest-openapi',
              label: 'RESTful API with OpenAPI 3.1 & Zod Validation',
              description: 'Standard HTTP semantics with universal tooling support and end-to-end TypeScript type inference from Zod schemas.',
              impact: { latency: '< 8ms', complexity: 'Low', resilience: 'High (99.9%)' },
              recommended: true
            },
            {
              id: 'opt-trpc-rpc',
              label: 'tRPC End-to-End Type-Safe RPC',
              description: 'Zero-schema-generation RPC bridge with seamless auto-completion across client and server without compile-step overhead.',
              impact: { latency: '< 6ms', complexity: 'Low', resilience: 'High (99.7%)' }
            },
            {
              id: 'opt-grpc-web',
              label: 'gRPC-Web with Protocol Buffers',
              description: 'Binary serialization over HTTP/2 with bi-directional streaming and ultra-compact payload footprints.',
              impact: { latency: '< 3ms', complexity: 'High', resilience: 'Maximum (Binary Strictness)' }
            }
          ]
        };
      } else {
        responseContent = `I have reviewed your intent: **"${text}"**.\n\n### Architectural Plan & Blueprint:\n- **System Boundary**: Establishing modular component boundaries with isolated state domains.\n- **Interface Contract**: Formalizing input/output signatures to prevent regression across module boundaries.\n- **Execution Sequencing**: Splitting work into an initial contract scaffolding step followed by implementation synthesis and test verification.\n\nPlease choose your preferred implementation blueprint:`;
        decisionCard = {
          id: `card-${Date.now()}`,
          title: 'Implementation Strategy: Architecture Pattern',
          description: `Select the execution pattern for "${text.slice(0, 45)}...":`,
          category: 'implementation',
          status: 'pending',
          options: [
            {
              id: 'opt-modular-composable',
              label: 'Modular Composable Service Architecture',
              description: 'Isolate business logic inside pure helper services and bind to React components through custom hooks.',
              impact: { latency: '< 5ms', complexity: 'Low', resilience: 'High (99.8%)' },
              recommended: true
            },
            {
              id: 'opt-event-driven-pipe',
              label: 'Event-Driven Reactive Pipeline',
              description: 'Decouple producers and consumers using an asynchronous event bus with replayable buffer queues.',
              impact: { latency: '6-12ms', complexity: 'Medium', resilience: 'High (99.9%)' }
            }
          ]
        };
      }

      const primaryBase = MODEL_PERF_BASELINES[current.primaryModel] || MODEL_PERF_BASELINES['claude-3-7-sonnet'];
      const turnLatency = Math.round(primaryBase.baseLatencyMs * (0.9 + Math.random() * 0.2));
      const promptToks = 1400 + Math.round(Math.random() * 300);
      const compToks = Math.round((turnLatency / 1000) * primaryBase.tokensPerSec);
      const turnTokensPerSec = turnLatency > 0 ? Math.round(compToks / (turnLatency / 1000)) : primaryBase.tokensPerSec;

      const architectMsg: DualityMessage = {
        id: `d-agent-${Date.now()}`,
        sender: 'primary_agent',
        role: current.primaryRole,
        agentName: 'Architect',
        agentId: current.primaryAgentId || 'a5',
        model: current.primaryModel,
        content: responseContent,
        decisionCards: decisionCard ? [decisionCard] : [],
        timestamp: new Date(),
        latencyMs: turnLatency,
        promptTokens: promptToks,
        completionTokens: compToks,
        tokensUsed: promptToks + compToks,
        tokensPerSec: turnTokensPerSec
      };

      const finalState: DualityState = {
        ...this.dualityStateSubject.getValue(),
        isExecuting: false,
        userMessages: [...this.dualityStateSubject.getValue().userMessages, architectMsg]
      };
      this.dualityStateSubject.next(finalState);
      savePersistedDualityState(finalState);

      this.updateAgentStatus(current.primaryAgentId || 'a5', 'idle');
      this.recordAgentWork(current.primaryAgentId || 'a5', turnLatency, promptToks, compToks);
      this.recordDualityTurnMetric('primary', {
        action: decisionCard ? 'SYNTHESIZE_DECISION_BLUEPRINT' : 'ARCHITECTURAL_INTENT_ASSESSMENT',
        latencyMs: turnLatency,
        promptTokens: promptToks,
        completionTokens: compToks,
        status: 'success'
      });

      this.addToast({
        title: `${current.primaryRole} Responded (${turnLatency}ms)`,
        message: decisionCard ? 'Synthesized blueprint with Decision Card for your selection.' : 'Provided architectural assessment.',
        type: 'info'
      });
    }, 900);
  }

  public selectDualityDecisionCardOption(messageId: string, cardId: string, optionId: string) {
    const current = this.dualityStateSubject.getValue();
    let selectedOptionLabel = optionId;
    let selectedOptionDesc = '';

    // Mark option as selected in state
    const updatedMessages = current.userMessages.map(msg => {
      if (msg.id !== messageId || !msg.decisionCards) return msg;
      const updatedCards = msg.decisionCards.map(card => {
        if (card.id !== cardId) return card;
        const opt = card.options.find(o => o.id === optionId);
        if (opt) {
          selectedOptionLabel = opt.label;
          selectedOptionDesc = opt.description;
        }
        return {
          ...card,
          selectedOptionId: optionId,
          status: 'resolved' as const
        };
      });
      return { ...msg, decisionCards: updatedCards };
    });

    // Append confirmation message
    const confirmationMsg: DualityMessage = {
      id: `d-choice-${Date.now()}`,
      sender: 'user',
      role: 'User Operator',
      content: `✓ **Selected Decision**: ${selectedOptionLabel}\n> *${selectedOptionDesc}*\n\nInitiating spec handoff to Builder agent [${current.secondaryRole} (${current.secondaryModel})].`,
      timestamp: new Date()
    };

    const intermediateState: DualityState = {
      ...current,
      userMessages: [...updatedMessages, confirmationMsg],
      isExecuting: true
    };
    this.dualityStateSubject.next(intermediateState);
    savePersistedDualityState(intermediateState);

    this.addToast({
      title: '✓ Decision Confirmed',
      message: `Adopted "${selectedOptionLabel}". Dispatching to ${current.secondaryRole}...`,
      type: 'success'
    });

    // Trigger inter-agent dialog and trace pipeline
    this.dispatchDualitySpecToBuilder(
      `Adopted Architectural Choice: "${selectedOptionLabel}". Spec constraints: ${selectedOptionDesc}. Please scaffold components and wire reactive interfaces.`
    );
  }

  public dispatchDualitySpecToBuilder(specContent?: string) {
    const current = this.dualityStateSubject.getValue();
    const spec = specContent || `Implement specification for active architectural decision: Scaffold type-safe domain models and export clean interface definitions.`;

    const handoffMsg: InterAgentDialogMessage = {
      id: `diag-${Date.now()}-handoff`,
      senderAgentId: current.primaryAgentId || 'a5',
      senderName: 'Architect',
      senderRole: current.primaryRole,
      recipientAgentId: current.secondaryAgentId || 'a3',
      recipientName: 'Coder',
      recipientRole: current.secondaryRole,
      type: 'spec_handoff',
      status: 'approved',
      content: `### Spec Handoff to ${current.secondaryRole}\n${spec}\n\n**AST Constraints**: Strict TypeScript types, zero runtime side-effects in render functions, modular separation of concerns.`,
      timestamp: new Date()
    };

    const newTrace1: BuilderTraceEvent = {
      id: `tr-${Date.now()}-1`,
      timestamp: new Date(),
      step: 'RECEIVE_SPEC',
      agent: `${current.secondaryRole} (${current.secondaryModel})`,
      action: 'INGEST_ARCHITECT_SPEC',
      details: `Received contract from ${current.primaryRole} [${current.primaryModel}]. Validating AST AST grammar.`,
      status: 'running',
      durationMs: 140,
      tokensUsed: 420,
      toolUsed: 'ast_analyzer'
    };

    const stateWithHandoff: DualityState = {
      ...this.dualityStateSubject.getValue(),
      isExecuting: true,
      interAgentDialog: [...this.dualityStateSubject.getValue().interAgentDialog, handoffMsg],
      builderTrace: [newTrace1, ...this.dualityStateSubject.getValue().builderTrace]
    };
    this.dualityStateSubject.next(stateWithHandoff);
    savePersistedDualityState(stateWithHandoff);

    this.updateAgentStatus(current.secondaryAgentId || 'a3', 'working');
    this.terminalOutput$.next(`\r\n\x1b[35m[${current.secondaryRole}]\x1b[0m Ingesting spec from ${current.primaryRole}...\r\n`);

    // Builder responds with implementation proposal
    setTimeout(() => {
      newTrace1.status = 'success';
      const secondaryBase = MODEL_PERF_BASELINES[current.secondaryModel] || MODEL_PERF_BASELINES['qwen2.5-coder:latest'];
      const buildLatency = Math.round(secondaryBase.baseLatencyMs * (0.88 + Math.random() * 0.24));
      const buildPromptToks = 1100 + Math.round(Math.random() * 250);
      const buildCompToks = 1650;
      const buildTokensPerSec = buildLatency > 0 ? Math.round(buildCompToks / (buildLatency / 1000)) : secondaryBase.tokensPerSec;

      const newTrace2: BuilderTraceEvent = {
        id: `tr-${Date.now()}-2`,
        timestamp: new Date(),
        step: 'CODE_SYNTHESIS',
        agent: `${current.secondaryRole} (${current.secondaryModel})`,
        action: 'SYNTHESIZE_MODULE',
        details: 'Generated component interfaces and state subscription hooks.',
        status: 'success',
        durationMs: buildLatency,
        tokensUsed: buildPromptToks + buildCompToks,
        toolUsed: 'typescript_code_generator'
      };

      const proposalMsg: InterAgentDialogMessage = {
        id: `diag-${Date.now()}-proposal`,
        senderAgentId: current.secondaryAgentId || 'a3',
        senderName: 'Coder',
        senderRole: current.secondaryRole,
        recipientAgentId: current.primaryAgentId || 'a5',
        recipientName: 'Architect',
        recipientRole: current.primaryRole,
        type: 'code_proposal',
        status: 'processing',
        content: `Scaffolded implementation satisfying interface invariants. Here is the generated module code:`,
        codeSnippet: {
          filename: '/src/services/DualityCoordinator.ts',
          language: 'typescript',
          code: `import { BehaviorSubject, Observable } from 'rxjs';\n\nexport interface CoordinatorState {\n  readonly ready: boolean;\n  readonly activeTask: string;\n}\n\nexport class DualityCoordinator {\n  private state$ = new BehaviorSubject<CoordinatorState>({\n    ready: true,\n    activeTask: 'idle'\n  });\n\n  public getState(): Observable<CoordinatorState> {\n    return this.state$.asObservable();\n  }\n}`
        },
        diffSummary: {
          added: 36,
          removed: 2,
          file: '/src/services/DualityCoordinator.ts'
        },
        timestamp: new Date(),
        latencyMs: buildLatency,
        promptTokens: buildPromptToks,
        completionTokens: buildCompToks,
        tokensUsed: buildPromptToks + buildCompToks,
        tokensPerSec: buildTokensPerSec
      };

      const stateWithProposal: DualityState = {
        ...this.dualityStateSubject.getValue(),
        interAgentDialog: [...this.dualityStateSubject.getValue().interAgentDialog, proposalMsg],
        builderTrace: [newTrace2, ...this.dualityStateSubject.getValue().builderTrace]
      };
      this.dualityStateSubject.next(stateWithProposal);
      savePersistedDualityState(stateWithProposal);

      this.recordDualityTurnMetric('secondary', {
        action: 'SYNTHESIZE_CODE_MODULE',
        latencyMs: buildLatency,
        promptTokens: buildPromptToks,
        completionTokens: buildCompToks,
        status: 'success'
      });

      this.terminalOutput$.next(`\x1b[32m[${current.secondaryRole}]\x1b[0m Synthesized code module (36 lines added) in ${buildLatency}ms\r\n`);

      // Architect performs verification
      setTimeout(() => {
        const primaryBase = MODEL_PERF_BASELINES[current.primaryModel] || MODEL_PERF_BASELINES['claude-3-7-sonnet'];
        const valLatency = Math.round(primaryBase.baseLatencyMs * 0.45);
        const valPrompt = 950;
        const valComp = 310;
        const valTokensPerSec = valLatency > 0 ? Math.round(valComp / (valLatency / 1000)) : primaryBase.tokensPerSec;

        const newTrace3: BuilderTraceEvent = {
          id: `tr-${Date.now()}-3`,
          timestamp: new Date(),
          step: 'VALIDATION',
          agent: `${current.primaryRole} (${current.primaryModel})`,
          action: 'STATIC_AST_AUDIT',
          details: 'Validated TypeScript types, interface contracts, and error handling.',
          status: 'success',
          durationMs: valLatency,
          tokensUsed: valPrompt + valComp,
          toolUsed: 'contract_verifier'
        };

        const ackMsg: InterAgentDialogMessage = {
          id: `diag-${Date.now()}-ack`,
          senderAgentId: current.primaryAgentId || 'a5',
          senderName: 'Architect',
          senderRole: current.primaryRole,
          recipientAgentId: current.secondaryAgentId || 'a3',
          recipientName: 'Coder',
          recipientRole: current.secondaryRole,
          type: 'validation_ack',
          status: 'approved',
          content: `✓ **Verification Approved**: Generated code conforms to spec. Clean type coverage, zero mutation leaks. Pipeline marked complete.`,
          timestamp: new Date(),
          latencyMs: valLatency,
          promptTokens: valPrompt,
          completionTokens: valComp,
          tokensUsed: valPrompt + valComp,
          tokensPerSec: valTokensPerSec
        };

        proposalMsg.status = 'approved';

        const finalState: DualityState = {
          ...this.dualityStateSubject.getValue(),
          isExecuting: false,
          interAgentDialog: [...this.dualityStateSubject.getValue().interAgentDialog, ackMsg],
          builderTrace: [newTrace3, ...this.dualityStateSubject.getValue().builderTrace]
        };
        this.dualityStateSubject.next(finalState);
        savePersistedDualityState(finalState);

        this.updateAgentStatus(current.secondaryAgentId || 'a3', 'idle');
        this.recordAgentWork(current.secondaryAgentId || 'a3', buildLatency, buildPromptToks, buildCompToks);
        this.recordDualityTurnMetric('primary', {
          action: 'VALIDATION_AST_AUDIT',
          latencyMs: valLatency,
          promptTokens: valPrompt,
          completionTokens: valComp,
          status: 'success'
        });

        this.addToast({
          title: '✓ Builder Pipeline Complete',
          message: `${current.secondaryRole} generated module (${buildLatency}ms) and passed ${current.primaryRole} validation (${valLatency}ms).`,
          type: 'success'
        });
      }, 1000);
    }, 1200);
  }

  public runAutomatedDualityExchange() {
    this.sendDualityUserPrompt('Design and implement a high-throughput event buffer for telemetry events.');
  }

  public clearDualityChat() {
    const current = this.dualityStateSubject.getValue();
    const updated: DualityState = {
      ...current,
      userMessages: [
        {
          id: `d-msg-reset-${Date.now()}`,
          sender: 'primary_agent',
          role: current.primaryRole,
          agentName: 'Architect',
          agentId: current.primaryAgentId,
          model: current.primaryModel,
          content: `Chat session reset. Ready for new architectural intents and specifications.`,
          timestamp: new Date()
        }
      ]
    };
    this.dualityStateSubject.next(updated);
    savePersistedDualityState(updated);
    this.addToast({
      title: 'Chat Cleared',
      message: 'Operator dialogue history reset.',
      type: 'info'
    });
  }

  public clearDualityInterAgentDialog() {
    const current = this.dualityStateSubject.getValue();
    const updated: DualityState = {
      ...current,
      interAgentDialog: [],
      builderTrace: []
    };
    this.dualityStateSubject.next(updated);
    savePersistedDualityState(updated);
    this.addToast({
      title: 'Inter-Agent Dialog Cleared',
      message: 'Dialogue and builder trace records cleared.',
      type: 'info'
    });
  }

  public resetDualityState() {
    this.dualityStateSubject.next(INITIAL_DUALITY_STATE);
    this.isDualityModeSubject.next(false);
    savePersistedDualityState(INITIAL_DUALITY_STATE);
    this.addToast({
      title: 'Duality Reset',
      message: 'Restored default Duality state and configurations.',
      type: 'info'
    });
  }

  public openWorkRequestDetailModal(wr?: WorkRequest) {
    const target = wr || this.activeWorkRequestSubject.getValue() || this.workRequestsSubject.getValue()[0];
    if (target) {
      this.selectedWorkRequestForDetailSubject.next(target);
      this.isWorkRequestDetailOpenSubject.next(true);
    }
  }

  public closeWorkRequestDetailModal() {
    this.isWorkRequestDetailOpenSubject.next(false);
  }

  public toggleWorkRequestDetailModal(wr?: WorkRequest) {
    const current = this.isWorkRequestDetailOpenSubject.getValue();
    if (current) {
      this.closeWorkRequestDetailModal();
    } else {
      this.openWorkRequestDetailModal(wr);
    }
  }

  private performanceMetricsSubject = new BehaviorSubject<PerformanceMetricsSummary>(loadPersistedMetrics());
  public performanceMetrics$ = this.performanceMetricsSubject.asObservable();

  public getPerformanceMetrics(): PerformanceMetricsSummary {
    return this.performanceMetricsSubject.getValue();
  }

  public recordAgentWork(agentId: string, durationMs: number, promptTokens: number, completionTokens: number, isError = false) {
    const current = this.performanceMetricsSubject.getValue();
    const totalTokens = promptTokens + completionTokens;
    const tokensPerSec = durationMs > 0 ? Math.round((totalTokens / (durationMs / 1000))) : 100;

    let foundAgent = false;
    const updatedAgentMetrics = current.agentMetrics.map(am => {
      if (am.agentId === agentId) {
        foundAgent = true;
        const newCount = am.tasksCompleted + 1;
        const newAvgTime = Math.round((am.avgCompletionTimeMs * am.tasksCompleted + durationMs) / newCount);
        const newTotalTokens = am.totalTokensUsed + totalTokens;
        const newPromptTokens = am.promptTokens + promptTokens;
        const newCompletionTokens = am.completionTokens + completionTokens;
        const newErrorCount = am.errorCount + (isError ? 1 : 0);
        return {
          ...am,
          tasksCompleted: newCount,
          avgCompletionTimeMs: newAvgTime,
          totalTokensUsed: newTotalTokens,
          promptTokens: newPromptTokens,
          completionTokens: newCompletionTokens,
          tokensPerSec,
          errorCount: newErrorCount,
          lastActiveTimestamp: new Date()
        };
      }
      return am;
    });

    if (!foundAgent) {
      const activeAgents = this.activeAgentsSubject.getValue();
      const agentObj = activeAgents.find(a => a.id === agentId);
      updatedAgentMetrics.push({
        agentId,
        agentName: agentObj?.name || 'Specialist',
        agentRole: agentObj?.role || 'Agent',
        tasksCompleted: 1,
        avgCompletionTimeMs: durationMs,
        totalTokensUsed: totalTokens,
        promptTokens,
        completionTokens,
        tokensPerSec,
        errorCount: isError ? 1 : 0,
        lastActiveTimestamp: new Date()
      });
    }

    const newTotalTokens = current.totalTokens + totalTokens;
    const newTotalPrompt = current.totalPromptTokens + promptTokens;
    const newTotalCompletion = current.totalCompletionTokens + completionTokens;
    const newAvgTokensPerSec = Math.round((current.avgTokensPerSec * 0.8) + (tokensPerSec * 0.2));

    const updated: PerformanceMetricsSummary = {
      ...current,
      totalTokens: newTotalTokens,
      totalPromptTokens: newTotalPrompt,
      totalCompletionTokens: newTotalCompletion,
      avgTokensPerSec: newAvgTokensPerSec,
      agentMetrics: updatedAgentMetrics
    };

    this.performanceMetricsSubject.next(updated);
    savePersistedMetrics(updated);

    // Evaluate live performance threshold alerts (e.g. latency > 200ms)
    AlertService.checkAgentWork(agentId, durationMs, promptTokens, completionTokens, isError);
  }

  public recordTaskFinished(taskId: string, intent: string, durationMs: number, tokensUsed: number, status: 'success' | 'failed' = 'success') {
    const current = this.performanceMetricsSubject.getValue();
    const newCompleted = current.totalTasksCompleted + 1;
    const newAvgDuration = Math.round((current.avgTaskDurationMs * current.totalTasksCompleted + durationMs) / newCompleted);
    
    const newRecord: TaskMetricRecord = {
      id: taskId,
      intent,
      durationMs,
      tokensUsed,
      completedAt: new Date(),
      status
    };

    const newHistory = [newRecord, ...current.recentTaskHistory].slice(0, 10);
    const successCount = newHistory.filter(h => h.status === 'success').length;
    const successRatePercent = Math.round((successCount / newHistory.length) * 100);

    const updated: PerformanceMetricsSummary = {
      ...current,
      totalTasksCompleted: newCompleted,
      lastTaskDurationMs: durationMs,
      avgTaskDurationMs: newAvgDuration,
      successRatePercent,
      recentTaskHistory: newHistory
    };

    this.performanceMetricsSubject.next(updated);
    savePersistedMetrics(updated);

    // Evaluate task-level threshold alerts (success rate, total tokens)
    AlertService.checkTaskCompletion(taskId, durationMs, tokensUsed, successRatePercent, status === 'success');
  }

  public resetPerformanceMetrics() {
    this.performanceMetricsSubject.next(INITIAL_PERFORMANCE_METRICS);
    savePersistedMetrics(INITIAL_PERFORMANCE_METRICS);
  }

  public openPerformanceAlertsModal() {
    AlertService.openModal();
  }

  public closePerformanceAlertsModal() {
    AlertService.closeModal();
  }

  public togglePerformanceAlertsModal() {
    AlertService.toggleModal();
  }

  private themeSubject = new BehaviorSubject<AppTheme>(loadPersistedTheme());
  public theme$ = this.themeSubject.asObservable();

  constructor() {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', this.themeSubject.getValue());
    }

    // Connect AlertService dispatchers
    AlertService.toastDispatcher = (toast) => this.addToast(toast);
    AlertService.logDispatcher = (log) => this.addAgentLog(log);
    AlertService.terminalDispatcher = (text) => this.terminalOutput$.next(text);
    AlertService.activeAgentsGetter = () => this.activeAgentsSubject.getValue();

    // Auto-persist Duality session state to localStorage on every update
    this.dualityStateSubject.subscribe(state => {
      savePersistedDualityState(state);
    });
  }

  public setTheme(theme: AppTheme) {
    this.themeSubject.next(theme);
    try {
      localStorage.setItem(STORAGE_KEY_THEME, theme);
    } catch (e) {
      console.warn('Failed to persist theme', e);
    }
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }

  public openShortcutsModal() {
    this.isShortcutsOpenSubject.next(true);
  }

  public closeShortcutsModal() {
    this.isShortcutsOpenSubject.next(false);
  }

  public toggleShortcutsModal() {
    this.isShortcutsOpenSubject.next(!this.isShortcutsOpenSubject.getValue());
  }

  private selectedAgentForConfigSubject = new BehaviorSubject<string>('a1');
  public selectedAgentForConfig$ = this.selectedAgentForConfigSubject.asObservable();

  public openAgentConfigModal(agentId?: string) {
    if (agentId) {
      this.selectedAgentForConfigSubject.next(agentId);
    }
    this.isAgentConfigOpenSubject.next(true);
  }

  public closeAgentConfigModal() {
    this.isAgentConfigOpenSubject.next(false);
  }

  public updateAgentConfig(agentId: string, updates: Partial<ActiveAgent>) {
    const agents = this.activeAgentsSubject.getValue();
    const idx = agents.findIndex(a => a.id === agentId);
    if (idx !== -1) {
      const updatedAgent = { ...agents[idx], ...updates };
      agents[idx] = updatedAgent;
      const updatedList = sortAgentsByRole([...agents]);
      this.activeAgentsSubject.next(updatedList);
      savePersistedAgents(updatedList);

      this.addAgentLog({
        agentId: updatedAgent.id,
        agentName: updatedAgent.name,
        level: 'info',
        action: 'UPDATE_CONFIG',
        details: `Updated parameters: temp=${updatedAgent.temperature}, model=${updatedAgent.model}, prompt length=${updatedAgent.systemPrompt?.length || 0} chars`,
        metadata: { updates }
      });

      this.addToast({
        title: `⚙️ Config Updated: ${updatedAgent.name}`,
        message: `System prompt & params saved (Temp: ${updatedAgent.temperature}, Model: ${updatedAgent.model})`,
        type: 'info',
        agentId: updatedAgent.id,
        agentName: updatedAgent.name,
        agentRole: updatedAgent.role
      });
    }
  }

  public resetPersistedStorage() {
    try {
      localStorage.removeItem(STORAGE_KEY_AGENTS);
      localStorage.removeItem(STORAGE_KEY_LOGS);
      localStorage.removeItem(STORAGE_KEY_DUALITY_STATE);
      localStorage.removeItem(STORAGE_KEY_DUALITY_ENABLED);
      localStorage.removeItem(STORAGE_KEY_TASK_QUEUE);
      this.activeAgentsSubject.next(sortAgentsByRole(MOCK_ACTIVE_AGENTS));
      this.agentLogsSubject.next(INITIAL_AGENT_LOGS);
      this.dualityStateSubject.next(INITIAL_DUALITY_STATE);
      this.agentTaskQueueSubject.next(INITIAL_AGENT_TASK_QUEUE);
      this.isDualityModeSubject.next(false);
      this.addToast({
        title: '🔄 Storage Reset',
        message: 'Restored default agent persona configs, execution logs, task queue, and Duality session state.',
        type: 'info'
      });
    } catch (err) {
      console.warn('Failed to reset localStorage:', err);
    }
  }

  public openRoundtableModal(topic?: string) {
    this.isRoundtableOpenSubject.next(true);
    if (topic && (!this.roundtableSessionSubject.getValue() || this.roundtableSessionSubject.getValue()?.status !== 'voting')) {
      this.triggerRoundtableVote(topic);
    }
  }

  public closeRoundtableModal() {
    this.isRoundtableOpenSubject.next(false);
  }

  public triggerRoundtableVote(topic: string, description?: string, participantAgentIds?: string[]) {
    const allAgents = this.activeAgentsSubject.getValue();
    const participantIds = (participantAgentIds && participantAgentIds.length > 0) 
      ? participantAgentIds 
      : allAgents.map(a => a.id);
    
    const participatingAgents = allAgents.filter(a => participantIds.includes(a.id));
    const totalParticipants = participatingAgents.length;

    const session: RoundtableSession = {
      id: `rt-${Date.now()}`,
      topic,
      description: description || `Consensus vote requested by operator for task: "${topic}"`,
      workRequestId: this.activeWorkRequestSubject.getValue()?.id,
      status: 'voting',
      votes: [],
      approvalRate: 0,
      consensusSummary: `Convening ${totalParticipants} agent(s) for task parameter evaluation...`,
      createdAt: new Date(),
      participantAgentIds: participantIds
    };

    this.roundtableSessionSubject.next(session);
    this.isRoundtableOpenSubject.next(true);

    this.terminalOutput$.next(`\r\n\x1b[35m[Roundtable]\x1b[0m Convening ${totalParticipants} Agent(s) for Consensus Check on: "${topic}"...\r\n`);

    this.addToast({
      title: '🏛️ Roundtable Vote Triggered',
      message: `Convening ${totalParticipants} agent(s) for consensus check on: "${topic}"`,
      type: 'info'
    });

    // Set participating agents to working
    participatingAgents.forEach(a => this.updateAgentStatus(a.id, 'working'));

    const defaultTemplates: Record<string, {
      vote: AgentVote['vote'];
      confidence: number;
      reasoning: string;
      suggestedAlternative?: string;
    }> = {
      'a1': {
        vote: 'approve',
        confidence: 0.95,
        reasoning: `PlanIR step sequencing supports "${topic}". High modular alignment with existing architecture.`
      },
      'a2': {
        vote: topic.toLowerCase().includes('delete') || topic.toLowerCase().includes('drop') ? 'reject' : 'conditional',
        confidence: 0.89,
        reasoning: topic.toLowerCase().includes('delete') ? 'High data destruction risk detected.' : 'Approved provided robust error boundaries and rate limits are enforced.',
        suggestedAlternative: 'Enforce audit logging on state changes.'
      },
      'a3': {
        vote: 'approve',
        confidence: 0.93,
        reasoning: `Implementation feasible with React functional state & RxJS observables. Standard component scaffold.`
      },
      'a4': {
        vote: 'approve',
        confidence: 0.97,
        reasoning: `Full test coverage and spec assertion checks can verify correctness without regression.`
      }
    };

    const voteTemplates = participatingAgents.map((agent, index) => {
      const template = defaultTemplates[agent.id] || {
        vote: 'approve' as const,
        confidence: 0.90,
        reasoning: `Agent ${agent.name} evaluated "${topic}" and confirmed strategy alignment.`
      };

      return {
        agent,
        delay: (index + 1) * 800,
        ...template
      };
    });

    voteTemplates.forEach(({ agent, delay: stepDelay, vote, confidence, reasoning, suggestedAlternative }) => {
      setTimeout(() => {
        const voteObj: AgentVote = {
          agentId: agent.id,
          agentName: agent.name,
          agentRole: agent.role,
          avatarUrl: agent.avatarUrl,
          vote,
          confidence,
          reasoning,
          suggestedAlternative,
          timestamp: new Date()
        };

        const currentSession = this.roundtableSessionSubject.getValue();
        if (!currentSession) return;

        const updatedVotes = [...currentSession.votes, voteObj];
        const approves = updatedVotes.filter(v => v.vote === 'approve' || v.vote === 'conditional').length;
        const rate = Math.round((approves / totalParticipants) * 100);

        this.addAgentLog({
          agentId: agent.id,
          agentName: agent.name,
          level: vote === 'approve' ? 'success' : vote === 'conditional' ? 'warn' : 'error',
          action: 'ROUNDTABLE_VOTE',
          details: `Voted [${vote.toUpperCase()}] (${Math.round(confidence * 100)}% confidence): ${reasoning}`,
          metadata: { topic, vote, confidence, totalParticipants }
        });

        this.terminalOutput$.next(`\x1b[36m[${agent.name}]\x1b[0m Voted \x1b[1m${vote.toUpperCase()}\x1b[0m (${Math.round(confidence * 100)}% confidence)\r\n`);

        const isFinished = updatedVotes.length === totalParticipants;
        let finalStatus: RoundtableSession['status'] = 'voting';
        let summary = `Collected ${updatedVotes.length}/${totalParticipants} agent votes (${rate}% approval rate).`;

        if (isFinished) {
          finalStatus = rate >= 75 ? 'passed' : 'rejected';
          summary = finalStatus === 'passed' 
            ? `Consensus Reached! ${rate}% Approval across ${totalParticipants} participating agent(s). Task greenlit.`
            : `Consensus Failed (${rate}% approval across ${totalParticipants} agent(s)). Revisions or human intervention required.`;

          // Reset participating agents to idle
          participatingAgents.forEach(a => this.updateAgentStatus(a.id, 'idle'));

          this.addToast({
            title: finalStatus === 'passed' ? '✓ Consensus Reached' : '⚠️ Consensus Warning',
            message: summary,
            type: finalStatus === 'passed' ? 'success' : 'warn'
          });
        }

        this.roundtableSessionSubject.next({
          ...currentSession,
          votes: updatedVotes,
          approvalRate: rate,
          status: finalStatus,
          consensusSummary: summary
        });
      }, stepDelay);
    });
  }

  public addToast(toast: Omit<ToastNotification, 'id' | 'timestamp'>) {
    const newToast: ToastNotification = {
      ...toast,
      id: `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date(),
      duration: toast.duration ?? 4500
    };
    const current = this.toastsSubject.getValue();
    this.toastsSubject.next([...current, newToast]);
  }

  public removeToast(id: string) {
    const current = this.toastsSubject.getValue();
    this.toastsSubject.next(current.filter(t => t.id !== id));
  }

  public clearAllToasts() {
    this.toastsSubject.next([]);
  }

  public setActiveWorkspace(ws: Workspace) {
    this.activeWorkspaceSubject.next(ws);
  }

  public sendUserMessage(msg: string) {
    const current = this.architectChatSubject.getValue();
    const userMsg: ChatMessage = { id: `msg-${Date.now()}`, role: 'user', content: msg, timestamp: new Date() };
    this.architectChatSubject.next([...current, userMsg]);
    
    setTimeout(() => {
      const botMsg: ChatMessage = { id: `msg-bot-${Date.now()}`, role: 'architect', content: `Understood: "${msg}". Processing within Plurality orchestration pipeline.`, timestamp: new Date() };
      this.architectChatSubject.next([...this.architectChatSubject.getValue(), botMsg]);
    }, 1000);
  }

  // Methods
  public selectAgentForLogs(agentId: string | null) {
    if (!agentId) {
      this.selectedAgentSubject.next(null);
      return;
    }
    const agents = this.activeAgentsSubject.getValue();
    let found = agents.find(a => a.id === agentId) || null;

    if (this.isDualityModeSubject.getValue()) {
      const ds = this.dualityStateSubject.getValue();
      if (agentId === ds.primaryAgentId || agentId === 'a5' || agentId === 'architect' || agentId === 'primary') {
        const base = found || agents.find(a => a.id === 'a5') || agents[0];
        found = {
          ...base,
          id: ds.primaryAgentId || 'a5',
          name: 'Architect',
          role: ds.primaryRole || 'System Architect',
          status: ds.isExecuting ? 'working' : 'idle',
          flavor: 'harness',
          model: ds.primaryModel || 'claude-3-7-sonnet',
          avatarUrl: avatarPlannerAlt,
          lastActive: new Date()
        };
      } else if (agentId === ds.secondaryAgentId || agentId === 'a3' || agentId === 'coder' || agentId === 'builder' || agentId === 'secondary') {
        const base = found || agents.find(a => a.id === 'a3') || agents[1] || agents[0];
        found = {
          ...base,
          id: ds.secondaryAgentId || 'a3',
          name: 'Builder',
          role: ds.secondaryRole || 'Implementation Builder',
          status: ds.isExecuting ? 'working' : 'idle',
          flavor: 'leased',
          model: ds.secondaryModel || 'qwen2.5-coder',
          avatarUrl: avatarCoder,
          lastActive: new Date()
        };
      }
    }

    this.selectedAgentSubject.next(found);
  }

  public addAgentLog(entry: Omit<AgentLogEntry, 'id' | 'timestamp'>) {
    const newLog: AgentLogEntry = {
      ...entry,
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date()
    };
    const current = this.agentLogsSubject.getValue();
    const updated = [newLog, ...current];
    this.agentLogsSubject.next(updated);
    savePersistedLogs(updated);
  }

  public clearLogsForAgent(agentId: string) {
    const current = this.agentLogsSubject.getValue();
    const updated = current.filter(l => l.agentId !== agentId);
    this.agentLogsSubject.next(updated);
    savePersistedLogs(updated);
  }

  public setActiveWorkRequest(wr: WorkRequest) {
    this.activeWorkRequestSubject.next(wr);
    this.terminalOutput$.next(`\r\n\x1b[32mSwitching to WorkRequest: ${wr.id}\x1b[0m\r\n`);
    
    // reset IRs
    this.planIRSubject.next(null);
    this.critiqueIRSubject.next(null);
    this.specIRSubject.next(null);
    this.executionIRSubject.next(null);
    this.validationIRSubject.next(null);
    
    // Auto-progress based on status for mock
    if (wr.status === 'PLAN') {
      this.generatePlan(wr.id);
    }
  }

  public updateAgentStatus(id: string, status: 'idle' | 'working' | 'waiting') {
    const agents = this.activeAgentsSubject.getValue();
    const idx = agents.findIndex(a => a.id === id);
    if (idx !== -1) {
      const prevStatus = agents[idx].status;
      if (prevStatus !== status) {
        agents[idx].status = status;
        agents[idx].lastActive = new Date();
        const updatedList = [...agents];
        this.activeAgentsSubject.next(updatedList);
        savePersistedAgents(updatedList);

        const agent = agents[idx];
        let toastType: ToastNotification['type'] = 'agent_state';
        let title = `${agent.name} is now ${status.toUpperCase()}`;
        let message = `${agent.name} (${agent.role}) transitioned from ${prevStatus} to ${status}.`;

        if (status === 'working') {
          toastType = 'info';
          title = `⚡ ${agent.name} Working`;
          message = `${agent.name} (${agent.role}) started processing workflow task.`;
        } else if (status === 'idle' && prevStatus === 'working') {
          toastType = 'success';
          title = `✓ ${agent.name} Completed Step`;
          message = `${agent.name} finished task execution and returned to idle.`;
        }

        this.addToast({
          title,
          message,
          type: toastType,
          agentId: agent.id,
          agentName: agent.name,
          agentRole: agent.role,
          actionLabel: 'View Logs',
          onAction: () => this.selectAgentForLogs(agent.id)
        });
      }
    }
  }

  public reorderWorkRequests(reordered: WorkRequest[]) {
    this.workRequestsSubject.next(reordered);
  }

  public updateWorkRequestPriority(wrId: string, priority: TaskPriority) {
    const current = this.workRequestsSubject.getValue();
    const idx = current.findIndex(w => w.id === wrId);
    if (idx !== -1) {
      const updatedWR = { ...current[idx], priority };
      if (updatedWR.detail?.intent) {
        updatedWR.detail = {
          ...updatedWR.detail,
          intent: {
            ...updatedWR.detail.intent,
            priority: priority.toLowerCase()
          }
        };
      }
      current[idx] = updatedWR;
      this.workRequestsSubject.next([...current]);

      const activeWR = this.activeWorkRequestSubject.getValue();
      if (activeWR && activeWR.id === wrId) {
        this.activeWorkRequestSubject.next(updatedWR);
      }

      this.addAgentLog({
        agentId: 'a1',
        agentName: 'Planner',
        level: 'info',
        action: 'UPDATE_PRIORITY',
        details: `Updated task [${wrId}] priority to "${priority}".`,
        metadata: { wrId, priority }
      });

      this.addToast({
        title: `Priority Updated: ${priority}`,
        message: `Task [${wrId}] set to ${priority} priority`,
        type: priority === 'High' ? 'warn' : priority === 'Medium' ? 'info' : 'info'
      });
    }
  }

  public sortByPriority(order: 'desc' | 'asc' = 'desc') {
    const priorityWeight: Record<TaskPriority, number> = {
      High: 3,
      Medium: 2,
      Low: 1
    };

    const current = [...this.workRequestsSubject.getValue()];
    current.sort((a, b) => {
      const pA = priorityWeight[a.priority || 'Medium'] || 2;
      const pB = priorityWeight[b.priority || 'Medium'] || 2;
      return order === 'desc' ? pB - pA : pA - pB;
    });

    this.workRequestsSubject.next(current);
    this.addToast({
      title: 'Tasks Sorted by Priority',
      message: `Reordered ${current.length} tasks (${order === 'desc' ? 'High → Low' : 'Low → High'})`,
      type: 'info'
    });
  }

  public createWorkRequest(intent: string, priority: TaskPriority = 'Medium') {
    const id = `wr-${Date.now()}`;
    const newWR: WorkRequest = {
      id,
      intent,
      status: 'NEW',
      priority,
      created_at: new Date(),
      detail: buildDefaultWorkRequestDetail(id, intent, 'NEW', priority)
    };
    this.workRequestsSubject.next([...this.workRequestsSubject.getValue(), newWR]);
    
    this.addToast({
      title: 'Work Request Created',
      message: `Created [${priority}] priority work request [${newWR.id}]: "${intent}". Initiating planning stage.`,
      type: 'info'
    });

    this.setActiveWorkRequest(newWR);
    
    setTimeout(() => {
      this.generatePlan(newWR.id);
    }, 500);
  }

  public generatePlan(wrId: string) {
    this.updateAgentStatus('a1', 'working');
    this.addAgentLog({
      agentId: 'a1',
      agentName: 'Planner',
      level: 'info',
      action: 'START_PLANNING',
      details: `Initiating plan generation for WorkRequest [${wrId}].`
    });

    this.addToast({
      title: 'Planning Initiated',
      message: 'Planner agent synthesizing execution steps and risk matrix.',
      type: 'info',
      agentId: 'a1',
      agentName: 'Planner',
      agentRole: 'Architect',
      actionLabel: 'View Logs',
      onAction: () => this.selectAgentForLogs('a1')
    });

    this.terminalOutput$.next('\r\n\x1b[36m[Planner]\x1b[0m Generating PlanIR...\r\n');
    
    setTimeout(() => {
      this.planIRSubject.next({
        id: `plan-${Date.now()}`,
        goal: 'Implement requested feature securely and efficiently.',
        steps: [
          { id: 's1', name: 'Scaffold Components', description: 'Create React components', risk_level: 'low' },
          { id: 's2', name: 'Wire State', description: 'Connect RxJS observables', risk_level: 'medium' }
        ],
        risks: ['State mutation leakage'],
        assumptions: ['React 18 is installed']
      });
      
      this.addAgentLog({
        agentId: 'a1',
        agentName: 'Planner',
        level: 'success',
        action: 'PLAN_GENERATED',
        details: 'Successfully synthesized PlanIR. Transferred control to Critic agent for review.',
        metadata: { goal: 'Implement requested feature securely and efficiently.', stepCount: 2 }
      });

      this.addToast({
        title: 'PlanIR Synthesized',
        message: 'Planner generated 2 execution steps. Transferring to Critic for review.',
        type: 'success',
        agentId: 'a1',
        agentName: 'Planner',
        agentRole: 'Architect',
        actionLabel: 'View Logs',
        onAction: () => this.selectAgentForLogs('a1')
      });

      const wrs = this.workRequestsSubject.getValue();
      const idx = wrs.findIndex(w => w.id === wrId);
      if (idx !== -1) {
        wrs[idx].status = 'REVIEW';
        this.workRequestsSubject.next([...wrs]);
        this.activeWorkRequestSubject.next(wrs[idx]);
      }
      this.updateAgentStatus('a1', 'idle');
      this.recordAgentWork('a1', 2000, 1850, 1200);
      this.critiquePlan(wrId);
    }, 2000);
  }

  public critiquePlan(wrId: string) {
    this.updateAgentStatus('a2', 'working');
    this.addAgentLog({
      agentId: 'a2',
      agentName: 'Critic',
      level: 'info',
      action: 'START_CRITIQUE',
      details: `Analyzing PlanIR for risk assessment and contract validation.`
    });

    this.addToast({
      title: 'Critic Assessment',
      message: 'Critic agent evaluating PlanIR for security boundaries and edge cases.',
      type: 'warn',
      agentId: 'a2',
      agentName: 'Critic',
      agentRole: 'Reviewer',
      actionLabel: 'View Logs',
      onAction: () => this.selectAgentForLogs('a2')
    });

    this.terminalOutput$.next('\r\n\x1b[33m[Critic]\x1b[0m Reviewing PlanIR...\r\n');
    
    setTimeout(() => {
      this.critiqueIRSubject.next({
        id: `crit-${Date.now()}`,
        issues: [{ severity: 'low', description: 'Ensure components have Error Boundaries' }],
        risk_score: 0.2,
        recommendation: 'approve'
      });
      
      this.addAgentLog({
        agentId: 'a2',
        agentName: 'Critic',
        level: 'success',
        action: 'CRITIQUE_COMPLETE',
        details: 'PlanIR approved with risk score 0.2. Waiting for operator approval gate.',
        metadata: { recommendation: 'approve', issuesCount: 1 }
      });

      this.addToast({
        title: 'Plan Approved by Critic',
        message: 'Risk Score: 0.2 (Low). Awaiting human operator approval.',
        type: 'success',
        agentId: 'a2',
        agentName: 'Critic',
        agentRole: 'Reviewer',
        actionLabel: 'View Logs',
        onAction: () => this.selectAgentForLogs('a2')
      });

      const wrs = this.workRequestsSubject.getValue();
      const idx = wrs.findIndex(w => w.id === wrId);
      if (idx !== -1) {
        wrs[idx].status = 'APPROVAL';
        this.workRequestsSubject.next([...wrs]);
        this.activeWorkRequestSubject.next(wrs[idx]);
      }
      this.updateAgentStatus('a2', 'idle');
      this.recordAgentWork('a2', 1500, 1400, 650);
    }, 1500);
  }
  
  public approvePlan(wrId: string) {
    this.addAgentLog({
      agentId: 'a1',
      agentName: 'Planner',
      level: 'info',
      action: 'OPERATOR_APPROVAL',
      details: `Operator manually approved PlanIR for WorkRequest [${wrId}]. Advancing to SPEC state.`
    });

    this.addToast({
      title: 'Operator Approved Plan',
      message: 'PlanIR approved by operator. Advancing to SPEC & EXECUTION.',
      type: 'success'
    });

    const wrs = this.workRequestsSubject.getValue();
    const idx = wrs.findIndex(w => w.id === wrId);
    if (idx !== -1) {
      wrs[idx].status = 'SPEC';
      this.workRequestsSubject.next([...wrs]);
      this.activeWorkRequestSubject.next(wrs[idx]);
      this.generateSpec(wrId);
    }
  }

  public generateSpec(wrId: string) {
    this.terminalOutput$.next('\r\n\x1b[34m[SpecGen]\x1b[0m Generating SpecIR...\r\n');

    this.addToast({
      title: 'Generating SpecIR',
      message: 'Translating architecture plan into low-level code generation specifications.',
      type: 'info'
    });

    setTimeout(() => {
      this.specIRSubject.next({ id: `spec-${Date.now()}`, details: 'React hooks and RxJS implementation details.' });
      this.recordAgentWork('a1', 1000, 1100, 950);
      
      const wrs = this.workRequestsSubject.getValue();
      const idx = wrs.findIndex(w => w.id === wrId);
      if (idx !== -1) {
        wrs[idx].status = 'EXEC';
        this.workRequestsSubject.next([...wrs]);
        this.activeWorkRequestSubject.next(wrs[idx]);
        this.execute(wrId);
      }
    }, 1000);
  }

  public execute(wrId: string) {
    this.updateAgentStatus('a3', 'working');
    this.addAgentLog({
      agentId: 'a3',
      agentName: 'Coder',
      level: 'info',
      action: 'START_EXECUTION',
      details: 'Received SpecIR. Beginning file code generation and state wiring.'
    });

    this.addToast({
      title: 'Code Execution Started',
      message: 'Coder agent synthesizing file nodes & wiring component state.',
      type: 'info',
      agentId: 'a3',
      agentName: 'Coder',
      agentRole: 'Builder',
      actionLabel: 'View Logs',
      onAction: () => this.selectAgentForLogs('a3')
    });

    this.terminalOutput$.next('\r\n\x1b[35m[Builder]\x1b[0m Executing SpecIR...\r\n');
    
    setTimeout(() => {
      const tree = JSON.parse(JSON.stringify(this.fileTreeSubject.getValue()));
      if (tree[0] && tree[0].children && tree[0].children[0]) {
        tree[0].children[0].children.push({
          id: 'new-' + Date.now(),
          name: 'NewComponent.tsx',
          type: 'file'
        });
        this.fileTreeSubject.next(tree);
      }

      this.executionIRSubject.next({
        id: `exec-${Date.now()}`,
        steps: [
           { step_id: 's1', result: 'Created components', status: 'success' },
           { step_id: 's2', result: 'Wired state', status: 'success' }
        ],
        trace: [
           { id: 't1', event_type: 'enter', message: 'Starting execution', timestamp: new Date() },
           { id: 't2', event_type: 'exit', message: 'Finished execution', timestamp: new Date() }
        ]
      });

      this.addAgentLog({
        agentId: 'a3',
        agentName: 'Coder',
        level: 'success',
        action: 'EXECUTION_COMPLETE',
        details: 'Execution step completed. Created 1 new file node (NewComponent.tsx). Passed to Validator.',
        metadata: { stepResults: ['s1: success', 's2: success'] }
      });

      this.addToast({
        title: 'Execution Complete',
        message: 'Coder agent created NewComponent.tsx. Passing artifacts to Validator.',
        type: 'success',
        agentId: 'a3',
        agentName: 'Coder',
        agentRole: 'Builder',
        actionLabel: 'View Logs',
        onAction: () => this.selectAgentForLogs('a3')
      });

      const wrs = this.workRequestsSubject.getValue();
      const idx = wrs.findIndex(w => w.id === wrId);
      if (idx !== -1) {
        wrs[idx].status = 'VALIDATE';
        this.workRequestsSubject.next([...wrs]);
        this.activeWorkRequestSubject.next(wrs[idx]);
        this.validate(wrId);
      }
      this.updateAgentStatus('a3', 'idle');
      this.recordAgentWork('a3', 2500, 2200, 1800);
    }, 2500);
  }

  public validate(wrId: string) {
    this.updateAgentStatus('a4', 'working');
    this.addAgentLog({
      agentId: 'a4',
      agentName: 'Validator',
      level: 'info',
      action: 'START_VALIDATION',
      details: 'Executing test assertions on generated code artifacts.'
    });

    this.addToast({
      title: 'Validation Running',
      message: 'Validator agent checking intent alignment, compliance & correctness.',
      type: 'info',
      agentId: 'a4',
      agentName: 'Validator',
      agentRole: 'QA',
      actionLabel: 'View Logs',
      onAction: () => this.selectAgentForLogs('a4')
    });

    this.terminalOutput$.next('\r\n\x1b[32m[Validator]\x1b[0m Checking results...\r\n');
    setTimeout(() => {
      this.validationIRSubject.next({
        id: `val-${Date.now()}`,
        scores: { intent_alignment: 0.98, compliance: 1.0, correctness: 1.0 },
        recommendation: 'complete'
      });

      this.addAgentLog({
        agentId: 'a4',
        agentName: 'Validator',
        level: 'success',
        action: 'VALIDATION_COMPLETE',
        details: 'Validation checks finished with 100% compliance. Workflow completed successfully.',
        metadata: { overallScore: '0.99' }
      });

      this.addToast({
        title: 'Workflow Validated 🎉',
        message: '100% compliance score! Plurality work request completed successfully.',
        type: 'success',
        agentId: 'a4',
        agentName: 'Validator',
        agentRole: 'QA',
        actionLabel: 'View Logs',
        onAction: () => this.selectAgentForLogs('a4')
      });

      this.updateAgentStatus('a4', 'idle');
      this.recordAgentWork('a4', 1500, 1300, 750);
      
      const wrs = this.workRequestsSubject.getValue();
      const targetWR = wrs.find(w => w.id === wrId);
      this.recordTaskFinished(
        wrId, 
        targetWR?.intent || 'Executed work request pipeline', 
        8500, 
        10550, 
        'success'
      );

      this.terminalOutput$.next('\x1b[32m[Validator] All tests passed.\x1b[0m\r\n$ ');
    }, 1500);
  }


  public addAgent(newAgentData: {
    name: string;
    role: string;
    flavor?: 'leased' | 'harness';
    model?: string;
    systemPrompt?: string;
    temperature?: number;
    topP?: number;
    maxTokens?: number;
    avatarPrompt?: string;
    avatarUrl?: string;
  }): ActiveAgent {
    const newAgent: ActiveAgent = {
      id: `agent-${Date.now()}`,
      name: newAgentData.name || 'Custom Agent',
      role: newAgentData.role || 'Specialist',
      status: 'idle',
      flavor: newAgentData.flavor || 'leased',
      model: newAgentData.model || 'claude-3-5-sonnet',
      lastActive: new Date(),
      avatarUrl: newAgentData.avatarUrl || avatarPlannerAlt,
      systemPrompt: newAgentData.systemPrompt || `You are ${newAgentData.name}, a specialized ${newAgentData.role} in the multi-agent system.`,
      temperature: newAgentData.temperature ?? 0.7,
      topP: newAgentData.topP ?? 0.9,
      maxTokens: newAgentData.maxTokens ?? 4096,
      avatarPrompt: newAgentData.avatarPrompt || `Futuristic portrait avatar for ${newAgentData.name}`
    };

    const current = this.activeAgentsSubject.getValue();
    const updated = sortAgentsByRole([...current, newAgent]);
    this.activeAgentsSubject.next(updated);
    savePersistedAgents(updated);

    this.addAgentLog({
      agentId: newAgent.id,
      agentName: newAgent.name,
      level: 'info',
      action: 'AGENT_CREATED',
      details: `Created new custom agent [${newAgent.name}] (${newAgent.role}) configured with role flavor [${newAgent.flavor?.toUpperCase()}].`,
      metadata: { flavor: newAgent.flavor, role: newAgent.role }
    });

    this.addToast({
      title: `🤖 New Agent Created: ${newAgent.name}`,
      message: `Added ${newAgent.name} (${newAgent.role}) to active agent workforce.`,
      type: 'success',
      agentId: newAgent.id,
      agentName: newAgent.name
    });

    return newAgent;
  }

  public deleteAgent(agentId: string) {
    const current = this.activeAgentsSubject.getValue();
    if (current.length <= 1) {
      this.addToast({
        title: '⚠️ Cannot Remove Agent',
        message: 'At least one active agent must remain in the pool.',
        type: 'warn'
      });
      return;
    }

    const agentToDelete = current.find(a => a.id === agentId);
    const updated = sortAgentsByRole(current.filter(a => a.id !== agentId));
    this.activeAgentsSubject.next(updated);
    savePersistedAgents(updated);

    if (agentToDelete) {
      this.addToast({
        title: '🗑️ Agent Removed',
        message: `Removed ${agentToDelete.name} (${agentToDelete.role}) from agent workforce.`,
        type: 'info'
      });
    }
  }
}

export const BackendService = new SimulatedBackendService();

