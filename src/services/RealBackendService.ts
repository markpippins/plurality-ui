import {
  WorkRequest,
  PlanIR,
  CritiqueIR,
  SpecIR,
  ExecutionIR,
  ValidationIR,
  TransitionEvent,
  AppState,
} from '../types';

const API_BASE = import.meta.env.VITE_LOSM_API_URL || 'http://localhost:8000';

export interface WorkRequestCreate {
  intent: string;
  constraints?: Record<string, unknown>;
  priority?: number;
  context?: Record<string, unknown>;
}

export interface WorkRequestResponse {
  id: number;
  wr_id: string;
  intent: string;
  constraints?: Record<string, unknown>;
  priority: number;
  context?: Record<string, unknown>;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CritiqueSummary {
  critique_id: string;
  recommendation: string;
  created_at: string;
}

export interface ExecutionSummary {
  execution_id: string;
  status: string;
  created_at: string;
  step_count: number;
}

export interface ValidationSummary {
  validation_id: string;
  status: string;
  recommendation: string;
  created_at: string;
}

function mapWorkRequest(wr: WorkRequestResponse): WorkRequest {
  const statusMap: Record<string, AppState> = {
    NEW: 'NEW',
    PLANNING: 'PLAN',
    REVIEW: 'REVIEW',
    APPROVAL: 'APPROVAL',
    SPEC: 'SPEC',
    EXECUTING: 'EXEC',
    VALIDATING: 'VALIDATE',
    COMPLETE: 'VALIDATE',
  };
  return {
    id: wr.wr_id,
    dbId: wr.id,
    intent: wr.intent,
    status: statusMap[wr.status] || wr.status as AppState,
    created_at: new Date(wr.created_at),
  };
}

export class RealBackendService {
  public async createWorkRequest(payload: WorkRequestCreate): Promise<WorkRequest> {
    const res = await fetch(`${API_BASE}/work-requests/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Failed to create work request: ${res.statusText}`);
    const data: WorkRequestResponse = await res.json();
    return mapWorkRequest(data);
  }

  public async listWorkRequests(): Promise<WorkRequest[]> {
    const res = await fetch(`${API_BASE}/work-requests/`);
    if (!res.ok) throw new Error(`Failed to list work requests: ${res.statusText}`);
    const data: WorkRequestResponse[] = await res.json();
    return data.map(mapWorkRequest);
  }

  public async getWorkRequest(dbId: number): Promise<WorkRequest> {
    const res = await fetch(`${API_BASE}/work-requests/${dbId}`);
    if (!res.ok) throw new Error(`Failed to get work request: ${res.statusText}`);
    const data: WorkRequestResponse = await res.json();
    return mapWorkRequest(data);
  }

  public async generatePlan(dbId: number): Promise<PlanIR> {
    const res = await fetch(`${API_BASE}/work-requests/${dbId}/plan`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error(`Failed to generate plan: ${res.statusText}`);
    return res.json();
  }

  public async createCritique(dbId: number): Promise<CritiqueIR> {
    const res = await fetch(`${API_BASE}/work-requests/${dbId}/critique`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error(`Failed to create critique: ${res.statusText}`);
    return res.json();
  }

  public async listCritiques(dbId: number): Promise<CritiqueSummary[]> {
    const res = await fetch(`${API_BASE}/work-requests/${dbId}/critiques`);
    if (!res.ok) throw new Error(`Failed to list critiques: ${res.statusText}`);
    return res.json();
  }

  public async generateSpec(dbId: number): Promise<SpecIR> {
    const res = await fetch(`${API_BASE}/work-requests/${dbId}/spec`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error(`Failed to generate spec: ${res.statusText}`);
    return res.json();
  }

  public async executePlan(dbId: number): Promise<ExecutionIR> {
    const res = await fetch(`${API_BASE}/work-requests/${dbId}/execute`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error(`Failed to execute plan: ${res.statusText}`);
    return res.json();
  }

  public async listExecutions(dbId: number): Promise<ExecutionSummary[]> {
    const res = await fetch(`${API_BASE}/work-requests/${dbId}/executions`);
    if (!res.ok) throw new Error(`Failed to list executions: ${res.statusText}`);
    return res.json();
  }

  public async validateExecution(dbId: number, executionId: string): Promise<ValidationIR> {
    const res = await fetch(
      `${API_BASE}/work-requests/${dbId}/validate?execution_id=${executionId}`,
      { method: 'POST' }
    );
    if (!res.ok) throw new Error(`Failed to validate execution: ${res.statusText}`);
    return res.json();
  }

  public async listValidations(dbId: number): Promise<ValidationSummary[]> {
    const res = await fetch(`${API_BASE}/work-requests/${dbId}/validations`);
    if (!res.ok) throw new Error(`Failed to list validations: ${res.statusText}`);
    return res.json();
  }

  public async transition(dbId: number, toState: string, reason?: string): Promise<void> {
    const res = await fetch(`${API_BASE}/work-requests/${dbId}/transition`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to_state: toState, reason }),
    });
    if (!res.ok) throw new Error(`Failed to transition: ${res.statusText}`);
  }

  public async getTransitions(dbId: number): Promise<TransitionEvent[]> {
    const res = await fetch(`${API_BASE}/work-requests/${dbId}/transitions`);
    if (!res.ok) throw new Error(`Failed to get transitions: ${res.statusText}`);
    const raw: { from: string; to: string; timestamp: string }[] = await res.json();
    return raw.map((t) => ({
      from: t.from as AppState,
      to: t.to as AppState,
      timestamp: new Date(t.timestamp),
    }));
  }
}

export const BackendService = new RealBackendService();
