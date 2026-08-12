import { BehaviorSubject, Subject, delay, of, tap } from 'rxjs';
import { 
  Workspace, FileNode, ChatMessage, AgentLog, ProviderConfig,
  WorkRequest, WorkRequestDetail, buildDefaultWorkRequestDetail, PlanIR, CritiqueIR, SpecIR, ExecutionIR, ValidationIR, AppState, ActiveAgent, AgentLogEntry, ToastNotification,
  AgentVote, RoundtableSession, AppTheme
} from '../types';

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
    created_at: new Date('2026-06-18T13:51:30.324Z'),
    detail: {
      id: "wr-0133-1781805090",
      version: 1,
      intent: {
        problem_statement: "Test opencode harness + ollama provider combo for qwen2.5-coder. Write /tmp/pipeline-test-0133.txt identifying which model ran.",
        desired_outcome: "Model chain test: opencode + ollama combo",
        domain: "nexus",
        priority: "medium",
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
    created_at: new Date(Date.now() - 3600000),
    detail: buildDefaultWorkRequestDetail('wr-1', 'Build an E-commerce API', 'NEW')
  },
  { 
    id: 'wr-2', 
    intent: 'Implement a React IDE', 
    status: 'PLAN', 
    created_at: new Date(Date.now() - 1800000),
    detail: buildDefaultWorkRequestDetail('wr-2', 'Implement a React IDE', 'PLAN')
  },
  { 
    id: 'wr-3', 
    intent: 'Refactor Authentication Pipeline', 
    status: 'VALIDATE', 
    created_at: new Date(Date.now() - 7200000),
    detail: buildDefaultWorkRequestDetail('wr-3', 'Refactor Authentication Pipeline', 'VALIDATE')
  },
  { 
    id: 'wr-4', 
    intent: 'Migrate Legacy Database Schemas', 
    status: 'FAILED', 
    created_at: new Date(Date.now() - 5400000),
    detail: buildDefaultWorkRequestDetail('wr-4', 'Migrate Legacy Database Schemas', 'FAILED')
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

  private isShortcutsOpenSubject = new BehaviorSubject<boolean>(false);
  public isShortcutsOpen$ = this.isShortcutsOpenSubject.asObservable();

  private isWorkRequestDetailOpenSubject = new BehaviorSubject<boolean>(false);
  public isWorkRequestDetailOpen$ = this.isWorkRequestDetailOpenSubject.asObservable();

  private selectedWorkRequestForDetailSubject = new BehaviorSubject<WorkRequest | null>(null);
  public selectedWorkRequestForDetail$ = this.selectedWorkRequestForDetailSubject.asObservable();

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

  private themeSubject = new BehaviorSubject<AppTheme>(loadPersistedTheme());
  public theme$ = this.themeSubject.asObservable();

  constructor() {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', this.themeSubject.getValue());
    }
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
      this.activeAgentsSubject.next(sortAgentsByRole(MOCK_ACTIVE_AGENTS));
      this.agentLogsSubject.next(INITIAL_AGENT_LOGS);
      this.addToast({
        title: '🔄 Storage Reset',
        message: 'Restored default agent persona configs and execution logs.',
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
    const found = agents.find(a => a.id === agentId) || null;
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

  public createWorkRequest(intent: string) {
    const id = `wr-${Date.now()}`;
    const newWR: WorkRequest = {
      id,
      intent,
      status: 'NEW',
      created_at: new Date(),
      detail: buildDefaultWorkRequestDetail(id, intent, 'NEW')
    };
    this.workRequestsSubject.next([...this.workRequestsSubject.getValue(), newWR]);
    
    this.addToast({
      title: 'Work Request Created',
      message: `Created work request [${newWR.id}]: "${intent}". Initiating planning stage.`,
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

