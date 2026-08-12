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

export interface WorkRequest {
  id: string;
  intent: string;
  status: AppState;
  created_at: Date;
  detail?: WorkRequestDetail;
  rawPayload?: Record<string, any>;
}

export function buildDefaultWorkRequestDetail(id: string, intentStr: string, statusStr: AppState): WorkRequestDetail {
  const nowStr = new Date().toISOString();
  return {
    id: id.startsWith('wr-') ? id : `wr-${id}`,
    version: 1,
    intent: {
      problem_statement: intentStr,
      desired_outcome: `Execute workflow task: ${intentStr}`,
      domain: 'nexus',
      priority: 'medium',
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


