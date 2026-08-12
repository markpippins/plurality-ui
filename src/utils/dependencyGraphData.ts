import { AppState, ActiveAgent } from '../types';

export interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  role: string;
  status: 'working' | 'waiting' | 'idle' | 'completed' | 'error';
  flavor?: 'leased' | 'harness';
  model?: string;
  avatarUrl?: string;
  stage: 'intent' | 'plan' | 'review' | 'spec' | 'exec' | 'validate' | 'governance';
  activeTask?: string;
  waitingOn: string[];
  waitingReason?: string;
  stageOrder: number;
}

export interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  id: string;
  source: string | GraphNode;
  target: string | GraphNode;
  label: string;
  isWaiting: boolean;
  waitingReason?: string;
  status: 'active' | 'waiting' | 'completed' | 'idle';
  flowSpeed?: number;
}

export function computeGraphData(
  appState: AppState,
  agents: ActiveAgent[]
): { nodes: GraphNode[]; links: GraphLink[]; waitingPairs: Array<{ waiter: string; supplier: string; reason: string; artifact: string }> } {
  // Map agents to nodes
  const agentMap = new Map<string, ActiveAgent>();
  agents.forEach(a => agentMap.set(a.id, a));

  // Determine standard agent stages
  const getStageInfo = (role: string, id: string): { stage: GraphNode['stage']; stageOrder: number } => {
    const r = role.toLowerCase();
    if (id === 'a1' || r.includes('plan')) return { stage: 'plan', stageOrder: 1 };
    if (id === 'a5' || r.includes('architect')) return { stage: 'spec', stageOrder: 3 };
    if (id === 'a2' || r.includes('critic') || r.includes('review')) return { stage: 'review', stageOrder: 2 };
    if (id === 'a7' || r.includes('analyst')) return { stage: 'plan', stageOrder: 1 };
    if (id === 'a8' || r.includes('ontolog')) return { stage: 'spec', stageOrder: 3 };
    if (id === 'a3' || r.includes('coder') || r.includes('builder')) return { stage: 'exec', stageOrder: 4 };
    if (id === 'a6' || r.includes('engineer')) return { stage: 'exec', stageOrder: 4 };
    if (id === 'a4' || r.includes('validator') || r.includes('qa')) return { stage: 'validate', stageOrder: 5 };
    if (id === 'a9' || r.includes('epistemolog') || r.includes('truth')) return { stage: 'review', stageOrder: 2 };
    if (id === 'a10' || r.includes('audit') || r.includes('compliance')) return { stage: 'governance', stageOrder: 6 };
    return { stage: 'exec', stageOrder: 4 };
  };

  // Build nodes
  const nodes: GraphNode[] = agents.map(a => {
    const { stage, stageOrder } = getStageInfo(a.role, a.id);
    let status: GraphNode['status'] = a.status as GraphNode['status'];
    let activeTask = 'Idle / Standby';
    let waitingOn: string[] = [];
    let waitingReason: string | undefined = undefined;

    // Apply state-aware task and waiting statuses
    switch (appState) {
      case 'NEW':
      case 'PLAN':
        if (a.id === 'a1' || a.role.toLowerCase().includes('plan')) {
          status = 'working';
          activeTask = 'Synthesizing PlanIR steps & risk matrix from intent';
        } else if (a.id === 'a5' || a.id === 'a2' || a.id === 'a3' || a.id === 'a7') {
          status = 'waiting';
          waitingOn = ['a1'];
          waitingReason = 'Waiting for Planner to generate initial PlanIR artifact';
          activeTask = 'Awaiting PlanIR decomposition';
        } else {
          status = 'idle';
        }
        break;

      case 'REVIEW':
        if (a.id === 'a2' || a.id === 'a9' || a.role.toLowerCase().includes('critic')) {
          status = 'working';
          activeTask = 'Auditing PlanIR security boundaries & calculating risk score';
        } else if (a.id === 'a1') {
          status = 'completed';
          activeTask = 'PlanIR emitted successfully';
        } else if (a.id === 'a5' || a.id === 'a3') {
          status = 'waiting';
          waitingOn = ['a2'];
          waitingReason = 'Waiting for Critic security clearance & CritiqueIR assessment';
          activeTask = 'Awaiting CritiqueIR safety approval';
        } else {
          status = 'idle';
        }
        break;

      case 'APPROVAL':
        if (a.id === 'a1' || a.id === 'a2') {
          status = 'completed';
          activeTask = 'PlanIR & CritiqueIR ready for gate check';
        } else if (a.id === 'a3' || a.id === 'a5' || a.id === 'a6') {
          status = 'waiting';
          waitingOn = ['a1', 'a2'];
          waitingReason = 'Waiting on Operator / Agent Roundtable approval gate';
          activeTask = 'Awaiting human/roundtable consensus approval';
        } else {
          status = 'idle';
        }
        break;

      case 'SPEC':
        if (a.id === 'a5' || a.role.toLowerCase().includes('architect')) {
          status = 'working';
          activeTask = 'Generating SpecIR low-level code generation blueprints';
        } else if (a.id === 'a1' || a.id === 'a2') {
          status = 'completed';
        } else if (a.id === 'a3' || a.id === 'a6') {
          status = 'waiting';
          waitingOn = ['a5'];
          waitingReason = 'Waiting on Architect to finalize SpecIR implementation specs';
          activeTask = 'Awaiting SpecIR architecture blueprint';
        } else {
          status = 'idle';
        }
        break;

      case 'EXEC':
        if (a.id === 'a3' || a.id === 'a6' || a.role.toLowerCase().includes('coder')) {
          status = 'working';
          activeTask = 'Generating React components, state stores, and file nodes';
        } else if (a.id === 'a1' || a.id === 'a2' || a.id === 'a5') {
          status = 'completed';
        } else if (a.id === 'a4' || a.id === 'a10') {
          status = 'waiting';
          waitingOn = ['a3'];
          waitingReason = 'Waiting on Coder to complete workspace file generation & build output';
          activeTask = 'Awaiting build artifacts for validation';
        } else {
          status = 'idle';
        }
        break;

      case 'VALIDATE':
        if (a.id === 'a4' || a.id === 'a10' || a.role.toLowerCase().includes('validator')) {
          status = 'working';
          activeTask = 'Running 3-tier validation: AST analysis, compliance, correctness';
        } else if (a.id === 'a3' || a.id === 'a5' || a.id === 'a1' || a.id === 'a2') {
          status = 'completed';
          activeTask = 'Artifact creation completed';
        } else {
          status = 'idle';
        }
        break;

      default:
        status = a.status as GraphNode['status'];
        break;
    }

    return {
      id: a.id,
      name: a.name,
      role: a.role,
      status,
      flavor: a.flavor || 'leased',
      model: a.model,
      avatarUrl: a.avatarUrl,
      stage,
      stageOrder,
      activeTask,
      waitingOn,
      waitingReason
    };
  });

  // Build standard dependency links between agents
  const rawLinks: Array<{ source: string; target: string; label: string }> = [
    { source: 'a1', target: 'a7', label: 'WorkRequest Intent' },
    { source: 'a1', target: 'a2', label: 'PlanIR' },
    { source: 'a1', target: 'a5', label: 'PlanIR Decomposition' },
    { source: 'a7', target: 'a5', label: 'Invariants & Rules' },
    { source: 'a2', target: 'a9', label: 'Risk Profile' },
    { source: 'a2', target: 'a5', label: 'CritiqueIR' },
    { source: 'a5', target: 'a8', label: 'Domain Interfaces' },
    { source: 'a5', target: 'a3', label: 'SpecIR Blueprint' },
    { source: 'a5', target: 'a6', label: 'Build Specs' },
    { source: 'a3', target: 'a6', label: 'Source AST' },
    { source: 'a3', target: 'a4', label: 'Code Artifacts' },
    { source: 'a6', target: 'a4', label: 'Bundle & Assets' },
    { source: 'a4', target: 'a10', label: 'Test Report' },
    { source: 'a10', target: 'a1', label: 'Audit Log' }
  ];

  // Handle custom agents: connect custom agents to Architect or Coder
  const customAgents = nodes.filter(n => !['a1','a2','a3','a4','a5','a6','a7','a8','a9','a10'].includes(n.id));
  customAgents.forEach(ca => {
    rawLinks.push({ source: 'a1', target: ca.id, label: 'Task Assignment' });
    rawLinks.push({ source: ca.id, target: 'a3', label: 'Specialized Guidance' });
  });

  const nodeIds = new Set(nodes.map(n => n.id));
  const validLinks = rawLinks.filter(l => nodeIds.has(l.source) && nodeIds.has(l.target));

  const waitingPairs: Array<{ waiter: string; supplier: string; reason: string; artifact: string }> = [];

  const links: GraphLink[] = validLinks.map(rl => {
    const targetNode = nodes.find(n => n.id === rl.target);
    const sourceNode = nodes.find(n => n.id === rl.source);

    const isWaiting = !!(targetNode && targetNode.status === 'waiting' && targetNode.waitingOn.includes(rl.source));
    const waitingReason = isWaiting ? targetNode?.waitingReason : undefined;

    let linkStatus: GraphLink['status'] = 'idle';
    if (isWaiting) {
      linkStatus = 'waiting';
      if (targetNode && sourceNode) {
        waitingPairs.push({
          waiter: targetNode.name,
          supplier: sourceNode.name,
          reason: targetNode.waitingReason || `Waiting for ${rl.label}`,
          artifact: rl.label
        });
      }
    } else if (sourceNode?.status === 'working' || targetNode?.status === 'working') {
      linkStatus = 'active';
    } else if (sourceNode?.status === 'completed' && targetNode?.status === 'completed') {
      linkStatus = 'completed';
    }

    return {
      id: `${rl.source}->${rl.target}`,
      source: rl.source,
      target: rl.target,
      label: rl.label,
      isWaiting,
      waitingReason,
      status: linkStatus,
      flowSpeed: isWaiting ? 1.5 : linkStatus === 'active' ? 3 : 0
    };
  });

  return { nodes, links, waitingPairs };
}
