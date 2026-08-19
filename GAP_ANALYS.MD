# wind-srv API Specification: Gap Analysis & Recommended Additions

This document details the architectural review, functional gaps, and recommended additions for the `wind-srv` REST API specification.

---

## 1. Execution Context & Data Flow

### Current State
- `POST /api/instances` only accepts `{ "workflow_version_id": "uuid" }`.
- `POST /api/instances/:id/advance` only accepts `{ "ticket_id": "uuid", "outcome_id": "uuid" }`.
- Receipts store `outcome_code` and `task_name`.

### Gaps & Recommended Additions
1. **Initial Instance Ingestion**:
   - Allow passing runtime parameters and initial payload upon instance creation:
     ```json
     POST /api/instances
     {
       "workflow_version_id": "uuid",
       "initial_context": {},
       "correlation_id": "string?",
       "triggered_by": "string?"
     }
     ```
2. **Output Data Capture on Advance**:
   - Capture task execution outputs when advancing tickets:
     ```json
     POST /api/instances/:id/advance
     {
       "ticket_id": "uuid",
       "outcome_id": "uuid",
       "output_data": {}
     }
     ```
3. **Receipt Output Persistence & Context Propagation**:
   - Store `output_data` directly on the `receipts` record.
   - Maintain an instance-level execution state dictionary or support input/output data mapping expressions on edges (e.g., passing fields from Node A's output into Node B's `input_spec`).

---

## 2. Graph Topology: Parallelism & Joins (Fan-Out / Fan-In)

### Current State
- Edges connect `(from_node_id, from_task_id, outcome_id) -> to_node_id`.
- Multiple outgoing edges allow branching (fan-out).

### Gaps & Recommended Additions
1. **Join Synchronization (Fan-In)**:
   - When multiple nodes converge into a single target node (e.g., Node A and Node B both route to Node C), define when Node C's ticket is spawned.
   - Introduce a `join_mode` attribute on `nodes`:
     - `AND_JOIN` (default for barriers): Node C ticket is created only after *all* incoming predecessor branches complete.
     - `OR_JOIN` / `FIRST_COMPLETED`: Node C ticket is created as soon as *any* incoming branch completes.
2. **Conditional Edge Routing**:
   - Support optional guard expressions (e.g., JSONPath / boolean rule evaluation against output payload) on edges for finer-grained conditional traversal beyond static outcome IDs.

---

## 3. Version Lifecycle & Graph Immutability

### Current State
- Versions can be activated via `POST /api/versions/:id/activate`.
- Nodes, edges, and versions can be updated/deleted directly via CRUD endpoints.

### Gaps & Recommended Additions
1. **Graph Locking for Active / Executed Versions**:
   - Prevent breaking in-flight instances by enforcing graph immutability once a version is `ACTIVE` or has associated runtime `instances`.
2. **Explicit Lifecycle States**:
   - Define version states: `DRAFT`, `ACTIVE`, `DEPRECATED`, `ARCHIVED`.
3. **Version Cloning**:
   - Provide an endpoint to branch existing versions for safe iteration:
     ```
     POST /api/workflows/:id/versions/:version_id/clone
     ```

---

## 4. Event System & Event-Driven Triggers

### Current State
- `POST /api/events` publishes events and broadcasts to NATS.
- `POST /api/events/poll` claims unconsumed events via `FOR UPDATE SKIP LOCKED`.
- `Event Types` include an optional `workflow_id`.

### Gaps & Recommended Additions
1. **Automated Event-to-Workflow Triggering**:
   - Define whether `wind-srv` includes an internal consumer that auto-instantiates workflows when matching events arrive, or provide an endpoint / webhook trigger binding.
2. **Event Consumption Acknowledgments & Dead-Letter Handling**:
   - If a worker crashes after polling unconsumed events, provide explicit acknowledgment and dead-letter semantics:
     - `POST /api/events/:id/ack`: Mark event permanently consumed.
     - `POST /api/events/:id/nack`: Release lock and increment retry count with backoff.
3. **Event-Wait Nodes (Webhooks & External Synchronization)**:
   - Allow tickets to pause and wait for external correlated events (e.g., human approvals, third-party callbacks) before advancing.

---

## 5. Fault Tolerance, Retries & Dead-Letter Management

### Current State
- `POST /api/instances/:id/execute` runs the task harness.
- `POST /api/instances/:id/run` loops with step and timeout limits.

### Gaps & Recommended Additions
1. **Per-Task Retry Policies**:
   - Add configurable retry parameters to `tasks`:
     - `max_retries` (integer)
     - `retry_delay_ms` (integer)
     - `backoff_factor` (e.g., exponential)
2. **Ticket Retry & Recovery Endpoints**:
   - Allow operators to retry failed tickets or override contexts without restarting entire workflow instances:
     ```
     POST /api/tickets/:id/retry
     ```
3. **Instance-Level Failure Semantics**:
   - Support dead-letter queues or compensatory rollback pathways for terminal task failures.

---

## 6. Operational, Query & Security Ergonomics

### Gaps & Recommended Additions
1. **Standardized Pagination & Range Filtering**:
   - Ensure all list endpoints (`/api/instances`, `/api/tickets`, `/api/receipts`, `/api/events`) support standard query parameters:
     - `limit` (default 50, max 200)
     - `offset` / `cursor`
     - `sort_by` & `order` (`asc` / `desc`)
     - `created_after` & `created_before`
2. **Idempotency Safeguards**:
   - Support `Idempotency-Key` headers on state-mutating endpoints (`POST /api/instances`, `POST /api/instances/:id/advance`) to guard against network retries causing duplicate transitions.
3. **Real-Time Telemetry Streaming**:
   - Provide an SSE (Server-Sent Events) or WebSocket stream for live instance state transitions:
     ```
     GET /api/instances/:id/stream
     ```
4. **Audit Provenance & Actor Attribution**:
   - Record `actor_type` (`USER`, `AGENT`, `SYSTEM_WORKER`) and `actor_id` on tickets and receipts for security and telemetry auditing.
