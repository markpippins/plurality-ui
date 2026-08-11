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

export type AppState = 'NEW' | 'PLAN' | 'REVIEW' | 'APPROVAL' | 'SPEC' | 'EXEC' | 'VALIDATE';

export interface WorkRequest {
  id: string;
  intent: string;
  status: AppState;
  created_at: Date;
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
  status: 'idle' | 'working' | 'waiting';
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


