// Plurality live provider — environment-gated. When VITE_PLURALITY_MODE=live
// (the installed unit's default), the app hydrates its work-request surface
// from canonical services (broker worker.execution catalog / conduit-srv:3104)
// instead of simulating success, and reports upstream availability to the UI.
// The in-browser simulator remains available only when mock mode is explicitly
// selected (VITE_PLURALITY_MODE=mock).
import {
  WorkRequest,
  TaskPriority,
  AppState,
  buildDefaultWorkRequestDetail,
} from '../types';

export type PluralityMode = 'live' | 'mock';

export interface UpstreamStatus {
  executionSrv: 'ok' | 'down';
  conduitSrv: 'ok' | 'down';
  nebulaSrv: 'ok' | 'down';
}

export interface LiveStatus {
  mode: PluralityMode;
  probing: boolean;
  upstreams: UpstreamStatus;
  error: string | null;
}

// LAC (thread 83d2fd5c): env sole authority; mock = explicit VITE_PLURALITY_
// MODE=mock; default live.
export const pluralityMode: PluralityMode =
  (import.meta as any).env?.VITE_PLURALITY_MODE === 'mock' ? 'mock' : 'live';

// M2 cutover: default execution surface is the broker gateway's
// worker.execution catalog (same 18-route contract as legacy execution-srv,
// mounted at /api/workers/execution — paths below are catalog-relative).
// Rollback: VITE_EXECUTION_SRV_URL=http://localhost:3110 restores legacy,
// but the /api/execution infix below must come back with it (broker paths
// are catalog-relative by design).
const EXECUTION_SRV_URL = (import.meta as any).env?.VITE_EXECUTION_SRV_URL || 'http://localhost:4080/api/workers/execution';
const CONDUIT_SRV_URL = (import.meta as any).env?.VITE_CONDUIT_SRV_URL || 'http://localhost:3104';
const NEBULA_SRV_URL = (import.meta as any).env?.VITE_NEBULA_SRV_URL || 'http://localhost:3101';

export async function probeUpstreams(): Promise<UpstreamStatus> {
  const check = async (url: string): Promise<'ok' | 'down'> => {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 3000);
      const res = await fetch(`${url}/health`, { signal: ctrl.signal });
      clearTimeout(t);
      return res.ok ? 'ok' : 'down';
    } catch {
      return 'down';
    }
  };
  const [executionSrv, conduitSrv, nebulaSrv] = await Promise.all([
    check(EXECUTION_SRV_URL),
    check(CONDUIT_SRV_URL),
    check(NEBULA_SRV_URL),
  ]);
  return { executionSrv, conduitSrv, nebulaSrv };
}

// Map a real execution-catalog request row to the plurality WorkRequest shape.
function mapExecutionRequest(row: any): WorkRequest {
  const rawStatus = String(row?.status || 'READY');
  // Execution catalog uses READY/RUNNING/COMPLETED/CANCELLED/FAILED/DRAFT
  // (identical on legacy execution-srv and broker worker.execution — verified
  // M2 parity); map onto the plurality AppState vocabulary used by the UI.
  const status: AppState =
    rawStatus === 'COMPLETED' ? 'VALIDATE' :
    rawStatus === 'CANCELLED' || rawStatus === 'FAILED' ? 'FAILED' :
    rawStatus === 'RUNNING' ? 'EXEC' :
    rawStatus === 'DRAFT' ? 'NEW' : 'PLAN';
  const priority: TaskPriority =
    (row?.priority as TaskPriority) || 'Medium';
  const id = row?.id || row?.business_key || `wr-${Date.now()}`;
  const intent = row?.title || row?.objective || row?.business_key || id;
  return {
    id,
    intent,
    status,
    priority,
    created_at: row?.created_at ? new Date(row.created_at) : new Date(),
    rawPayload: row,
    detail: buildDefaultWorkRequestDetail(id, intent, status, priority),
  };
}

/** Fetch the real work-request list from the execution surface. Throws on failure. */
export async function fetchLiveWorkRequests(limit = 100): Promise<WorkRequest[]> {
  const res = await fetch(`${EXECUTION_SRV_URL}/requests?limit=${limit}`);
  if (!res.ok) throw new Error(`execution surface returned HTTP ${res.status}`);
  const data = await res.json();
  const items = data?.items || [];
  return items.map(mapExecutionRequest);
}

/** Fetch real plan/workflow data from conduit-srv. Throws on failure. */
export async function fetchLivePlans(): Promise<any[]> {
  const res = await fetch(`${CONDUIT_SRV_URL}/workflows`);
  if (!res.ok) throw new Error(`conduit-srv returned HTTP ${res.status}`);
  const data = await res.json();
  return data?.workflows || [];
}

// Plans domain (LAC spec: plans → nebula-srv). Canonical implementation-plan
// summaries for live surfaces; failures throw — never synthetic rows.
export interface PlanSummary {
  number: string;
  title: string;
  status: string | null;
}

export async function fetchLivePlanSummaries(limit = 50): Promise<PlanSummary[]> {
  const res = await fetch(`${NEBULA_SRV_URL}/api/plans?pageSize=${limit}`);
  if (!res.ok) throw new Error(`nebula-srv returned HTTP ${res.status}`);
  const data = await res.json();
  const items = Array.isArray(data?.items) ? data.items : [];
  return items.map((p: any) => ({
    number: String(p?.planNumber ?? p?.number ?? ''),
    title: String(p?.title ?? ''),
    status: p?.status ?? null,
  }));
}

export { EXECUTION_SRV_URL, CONDUIT_SRV_URL, NEBULA_SRV_URL };
