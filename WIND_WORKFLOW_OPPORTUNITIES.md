# Unified System Architecture & Opportunities Blueprint: Wind-Srv & Nebula-Srv

**Document Version:** 2.0.0  
**Target Services:** 
- **`wind-srv`** (Port 3300, `/api`): Discrete multi-outcome state-machine workflow engine
- **`nebula-srv`** (Port 3101, `/api`): Bitemporal knowledge graph, compilation compiler, requirements hierarchy, and execution registry
**Context:** Multi-Agent Autonomous Software Engineering & Organizational Governance

---

## 1. Executive Summary & Dual-Engine Paradigm

The combination of **`nebula-srv`** and **`wind-srv`** creates a comprehensive full-lifecycle software engineering ecosystem:
- **`nebula-srv` is the Knowledge & Intent Substrate (The Brain & Memory)**: Stores systems, subsystems, requirements, 13-entity cross-references, vector embeddings, audit journals, bitemporal specs, and compiles requirements into operational Intermediate Representations (`WorkRequest IR` / Op Sequences).
- **`wind-srv` is the Execution & Workflow Substrate (The Engine & Nervous System)**: Coordinates autonomous agent harnesses and human titles across offices, advancing state machines through discrete outcome branches (`execute → advance → receipt → tickets`).

Together, they enable a closed-loop autonomous system:
```
Raw Ideas / Harvests (Nebula)
       ↓
Intent & Requirement Compilation (Nebula Stage 1 & 2 Compiler)
       ↓
Workflow Graph Instantiation & Dynamic Dispatch (Wind-Srv)
       ↓
Agent Harness / Human Ticket Execution (Wind-Srv + Harness-Srv)
       ↓
Receipts, Cross-References & Knowledge Provenance (Nebula + Wind-Srv)
```

---

## 2. Deep Architectural Comparison: `nebula-srv` vs. `wind-srv`

| Architecture Domain | `nebula-srv` (Knowledge & Intent) | `wind-srv` (Workflow Execution) | Integrated Synergy |
| :--- | :--- | :--- | :--- |
| **Domain Metaphor** | Systems → Subsystems → Features → Requirements | Offices → Titles → Tasks → Outcomes | Nebula requirements compile directly into Wind task graphs assigned to office titles. |
| **State Paradigm** | Bitemporal records, versioned specs, Kanban statuses (`Backlog` → `Accepted`) | Finite State Machine (Nodes & Outcome-keyed Edges) | High-level business milestones in Nebula drive low-level deterministic DAG transitions in Wind. |
| **Compilation** | Two-Stage Compiler: Semantic normalization → `op_registry` opcode emission | Graph Validation: Structural entry/terminal invariants & contract linting | Nebula compiles *what* actions are required; Wind guarantees *how* those actions are safely orchestrated. |
| **Audit & Ledger** | `agent_records`, `audit_files`, `artifact_provenance`, `evidence_links` | `tickets` (in-flight) and `receipts` (completed transitions) | Execution receipts in Wind become durable evidence links and provenance nodes in Nebula. |
| **Search & Discovery** | 768-dim semantic vector search + 13-entity parallel full-text search | Filtered runtime queries (`status`, `office_id`, `task_id`) | Real-time agent routing informed by semantic similarity over past executions. |
| **Role Governance** | `nebula.roles` with capabilities, scopes, and cron escalations | `wind.v_roles` mapping titles to execution harnesses | Strong role-based access control and capability boundaries for every automated step. |

---

## 3. Categorized Product & Feature Opportunities

---

### Category A: Visual Canvas & Workflow Design Studio

#### 1. Drag-and-Drop Directed Graph Studio
- **Description:** An interactive graphical node editor for authoring workflows, connecting task nodes via declared outcome ports.
- **API Integration:** `wind-srv`: `GET/POST /api/nodes`, `GET/POST /api/edges`, `GET /api/tasks`, `GET /api/outcomes`.
- **Key Features:**
  - Node color-coding and badging by **Office** and **Title**.
  - Dynamic output ports rendered from declared task `Outcomes`.
  - Edge drawing with live connection validation.

#### 2. Real-Time Graph Linter & Static Contract Analyzer
- **Description:** Live visual feedback flagging structural defects as workflows are constructed.
- **API Integration:** `wind-srv`: `GET /api/validate/:version_id`, `POST /api/validate/:version_id/structure`.
- **Key Features:**
  - Highlighting unreachable nodes (islands).
  - Flagging missing edges for unhandled outcomes.
  - Verifying single entrypoint and at least one reachable terminal node.
  - JSON Schema contract validation between `output_spec` of predecessor and `input_spec` of successor.

#### 3. Semantic Versioning & Live Version Switcher
- **Description:** Management interface for draft vs. active workflow versions.
- **API Integration:** `wind-srv`: `GET /api/versions`, `POST /api/versions`, `POST /api/versions/:id/activate`.
- **Key Features:**
  - Visual visual-diffing between workflow versions.
  - Instant zero-downtime version activation.
  - In-flight instance migration or drain-and-replace policies.

---

### Category B: Live Runtime Debugger & Execution Observability

#### 4. Petri-Net / Token-Based Live Execution Visualizer
- **Description:** Real-time animated canvas tracking active workflow instances as tokens traverse nodes.
- **API Integration:** `wind-srv`: `GET /api/instances/:id`, `GET /api/tickets`, `POST /api/instances/:id/advance`.
- **Key Features:**
  - Glowing tokens indicating active `Tickets` on nodes.
  - Pulse animations when an outcome is produced and downstream tickets spawn.
  - Direct status badges (`PENDING`, `IN_PROGRESS`, `COMPLETED`, `PAUSED`, `FAILED`).

#### 5. Step-by-Step Interactive Stepper / Debugger
- **Description:** Developer and operator controls to manually step through, pause, or resume workflow progression.
- **API Integration:** `wind-srv`: `POST /api/instances/:id/pause`, `POST /api/instances/:id/resume`, `POST /api/instances/:id/advance`, `POST /api/instances/:id/execute`.
- **Key Features:**
  - Single-step advancement with custom outcome injection for testing edge cases.
  - Breakpoints on specific nodes or outcomes.
  - Context payload inspection at each intermediate hop.

#### 6. Time-Travel Scrubber & Execution Replay
- **Description:** Historical timeline player built on the `Receipts` ledger and `agent_records`.
- **API Integration:** `wind-srv`: `GET /api/receipts`, `nebula-srv`: `GET /api/agent-records`, `GET /api/audit/graph`.
- **Key Features:**
  - Scrub backwards and forwards through an instance's lifecycle.
  - Compare actual execution path against alternative graph branches.
  - Export audit trail reports for compliance and post-mortems.

---

### Category C: Requirement Compilation & Opcode Synthesis (Nebula Engine)

#### 7. Automated Two-Stage Requirement Compiler
- **Description:** Converts high-level user requirements into concrete execution plans and opcode sequences.
- **API Integration:** `nebula-srv`: `POST /api/requirements/:id/compile`, `GET /api/op-registry`.
- **Key Features:**
  - **Stage 1 (Semantic Normalization):** Synthesizes intent summary, acceptance criteria, and hierarchy context.
  - **Stage 2 (Engineering Compilation):** Regex pattern matching against `op_registry` to produce deterministic opcode sequences (`WRITE_FILE`, `VALIDATE_SYNTAX`, `RUN_TESTS`).
  - **Automated Workflow Synthesis:** Directly generates a matching `wind-srv` workflow graph from the compiled opcode sequence.

#### 8. Compilation Readiness Framework (CPF) & Harvest Promotion
- **Description:** AI pipeline that processes unstructured transcripts and brainstorms into structured candidates, scoring them for automatic promotion.
- **API Integration:** `nebula-srv`: `GET /api/harvests`, `GET /api/cpf`, `POST /api/cpf/promote`, `POST /api/harvest-candidates/promote-to-plan`.
- **Key Features:**
  - Candidate readiness scoring (0.0 to 1.0) based on specificity, dependency clarity, and acceptance criteria.
  - One-click batch promotion of verified candidates into implementation plans and execution graphs.
  - Automated candidate discovery over conversation turns.

---

### Category D: Universal Knowledge Graph & Cross-Entity Discovery

#### 9. Unified 13-Entity Cross-Schema Search & Vector Explorer
- **Description:** Global command palette and visual graph explorer uniting requirements, plans, agent records, open questions, and audits.
- **API Integration:** `nebula-srv`: `GET /api/search?q=...`, `POST /api/search/semantic`, `GET /api/knowledge/summary`, `GET /api/cross-references`.
- **Key Features:**
  - Combined lexical (ILIKE) and 768-dimensional semantic vector search.
  - Interactive D3 force-directed knowledge graph with bidirectional relationship traversal (`depends_on`, `implements`, `spawns_plan`).
  - Evidence link visualization connecting agent decisions back to original harvest transcripts.

#### 10. Deliberation Hub & Open Question Resolver
- **Description:** Structured consensus and resolution interface for ambiguity, conflicts, and architectural trade-offs.
- **API Integration:** `nebula-srv`: `GET/POST /api/open-questions`, `GET/POST /api/open-questions/:id/answers`, `GET/POST /api/open-questions/:id/participants`.
- **Key Features:**
  - Per-role deliberation tracking with confidence levels (`HIGH`, `MEDIUM`, `LOW`).
  - Blocking question flags that automatically hold execution leases in `wind-srv` until resolved.
  - Interactive resolution timeline showing role contributions.

---

### Category E: Hybrid Multi-Agent & Human Dispatcher

#### 11. Unified Hybrid Ticket Inbox (Agent vs. Human Routing)
- **Description:** Dual-mode dispatch system that routes tickets to automated LLM agent harnesses (`harness-srv`) or human specialist inboxes.
- **API Integration:** `wind-srv`: `POST /api/instances/:id/execute`, `PUT /api/tickets/:id/status`, `POST /api/instances/:id/advance`, `nebula-srv`: `GET /api/roles`.
- **Key Features:**
  - Automated tasks invoke `harness-srv` with contextual prompt synthesis.
  - Human review tasks display an interactive approval/decision card with buttons for each possible `Outcome`.
  - Fallback escalation: If an agent produces `ESCALATE` or fails, route a ticket to a human title.

#### 12. Execution Lease Management & Distributed Agent Workers
- **Description:** Distributed concurrency control ensuring single-agent execution without race conditions.
- **API Integration:** `nebula-srv`: `POST /api/execution/leases/acquire`, `POST /api/execution/leases/:id/renew`, `POST /api/execution/leases/:id/release`, `wind-srv`: `POST /api/events/poll`.
- **Key Features:**
  - Heartbeat lease renewals for long-running agent execution tasks.
  - Atomic work-claiming via `FOR UPDATE SKIP LOCKED`.
  - Live execution dashboard showing active leases, attempts, and receipts.

---

## 4. Comprehensive Prioritization Matrix (Impact vs. Effort)

| Item | Feature Name | Primary Service | Impact | Effort | Priority | Strategic Value |
| :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| **A1** | **Visual Graph Studio & Editor** | `wind-srv` | High | Med | **P0 (Immediate)** | Core user experience for visual workflow modeling. |
| **B4** | **Live Token-Flow Execution Visualizer** | `wind-srv` | High | Med | **P0 (Immediate)** | Real-time observability of active agent state machines. |
| **C7** | **Two-Stage Requirement Compiler** | `nebula-srv` | High | Med | **P0 (Immediate)** | Bridges user intent to executable opcode sequences. |
| **B5** | **Interactive Step-by-Step Debugger** | `wind-srv` | High | Low | **P0 (Immediate)** | Essential for testing, verification, and manual step injection. |
| **D9** | **Unified Cross-Entity & Semantic Search**| `nebula-srv` | High | Low | **P1 (Near-Term)** | Global discovery across 13 entity types and vector embeddings. |
| **E11** | **Hybrid Human/Agent Ticket Inbox** | `wind-srv` + `nebula` | High | Med | **P1 (Near-Term)** | Demonstrates production viability with human-in-the-loop oversight. |
| **C8** | **CPF Readiness & Candidate Promotion** | `nebula-srv` | Med | Low | **P1 (Near-Term)** | Automated processing of transcripts into actionable plans. |
| **A2** | **Static Graph & Contract Linter** | `wind-srv` | High | Low | **P1 (Near-Term)** | Prevents runtime failures by surfacing validation errors early. |
| **D10** | **Deliberation Hub & Open Question Resolver** | `nebula-srv` | Med | Low | **P1 (Near-Term)** | Formalizes agent/human debate and consensus building. |
| **E12** | **Execution Lease & Distributed Polling**| `nebula` + `wind` | Med | Med | **P2 (Mid-Term)** | Scalable multi-worker execution cluster. |
| **B6** | **Receipt Ledger Time-Travel Playback** | `wind-srv` + `nebula` | Med | Med | **P2 (Mid-Term)** | Immutable compliance audit and historical replays. |
| **A3** | **Visual Version Diff & Live Migration** | `wind-srv` | Med | High | **P2 (Mid-Term)** | Advanced enterprise workflow lifecycle management. |

---

## 5. Integrated Multi-Phase Roadmap

```
Phase 1: Visual State Machines & Intent Compilation (Weeks 1-2)
  ├── Visual Graph Canvas (React Flow / D3) for wind-srv DAGs
  ├── Two-Stage Requirement Compiler (Nebula -> Opcode Sequences)
  └── Static Graph Linter & Invariant Validator

Phase 2: Live Execution Engine & Hybrid Dispatch (Weeks 3-4)
  ├── Live token state visualization on canvas
  ├── Step-through debugger with manual outcome injection
  ├── Execution Lease Manager & Distributed Worker Poller
  └── Hybrid Human/Agent Ticket Inbox

Phase 3: Knowledge Graph, Vector Search & Deliberation (Weeks 5-6)
  ├── 13-Entity Parallel Search + 768-dim Vector Similarity
  ├── Interactive D3 Force-Directed Knowledge Graph
  ├── Deliberation Hub for Open Questions & Multi-Role Consensus
  └── CPF Harvest Candidate Scoring & Auto-Promotion

Phase 4: Enterprise Audit, Time-Travel & Autonomous Pipelines (Weeks 7-8)
  ├── Receipt Ledger Time-Travel Scrubber & Audit Export
  ├── NATS Event Ingestion & Deduplication Pipelines
  └── Automated CI/CD, Architecture Review & Red-Teaming Flows
```

---

## 6. High-Priority Implementation Recommendations

1. **Unify the Common Intermediate Representation (IR)**:
   - Establish a shared JSON schema linking `nebula.requirements.compiles_to` with `wind.workflow_versions` so compiled requirements directly generate executable workflow DAGs.
2. **Standardize Role-to-Title Bindings**:
   - Align `nebula.roles` (capabilities, cron schedules) with `wind.titles` (task assignees) so agent permissions and dispatch routing are seamlessly shared.
3. **Bridge Execution Receipts to Evidence Links**:
   - Auto-create `knowledge.evidence_links` in `nebula-srv` whenever a `wind-srv` ticket produces an execution receipt.
