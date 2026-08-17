import { AgentConfigTemplate, AgentArchetypeCategory } from '../types';

const STORAGE_KEY_TEMPLATES = 'plurality_agent_config_templates_v2';

export const BUILTIN_ARCHETYPE_TEMPLATES: AgentConfigTemplate[] = [
  {
    id: 'tmpl-plan-lead',
    name: 'Lead Task Planner & Decomposer',
    description: 'Specializes in decomposing complex product requirements into strictly ordered, modular PlanIR sequences with explicit dependency constraints.',
    archetype: 'planning',
    role: 'Lead Task Planner',
    flavor: 'leased',
    systemPrompt: `You are the Lead Task Planner in the Plurality workflow. Your primary goal is to synthesize user intents into structured execution sequences, decompose goals into modular PlanIR steps, and estimate task dependencies and risk profiles.

Core Guidelines:
1. Always formulate atomic, sequentially verified phases before code generation.
2. Formulate explicit pre-conditions, rollback criteria, and post-conditions for every task.
3. Identify cross-cutting dependencies and label high-risk blast radiuses.`,
    temperature: 0.25,
    topP: 0.85,
    maxTokens: 4096,
    avatarPrompt: '3D hyper-detailed holographic cybernetic task orchestrator portrait, cyan and purple accents, high precision',
    isBuiltIn: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    tags: ['plan-ir', 'dag', 'milestones', 'decomposition'],
    recommendedModel: 'claude-3-5-sonnet'
  },
  {
    id: 'tmpl-plan-strict',
    name: 'Strict Milestone & Phase Sequencer',
    description: 'Enforces rigorous step gating, atomic transactional phases, and contract checkpoints before advancing the pipeline state.',
    archetype: 'planning',
    role: 'Milestone & Dependencies Planner',
    flavor: 'leased',
    systemPrompt: `You are a Milestone & Dependencies Planner. Deconstruct workflows into atomic, sequentially verified phases.

Strict Protocol:
1. Require explicit pre-conditions and post-conditions before transitioning phases.
2. Never permit overlapping step side-effects.
3. Enforce deterministic state transitions with immediate abort on unverified invariants.`,
    temperature: 0.15,
    topP: 0.8,
    maxTokens: 4096,
    avatarPrompt: 'Futuristic crystalline sentinel with glowing geometry, obsidian and amber, cybernetic precision',
    isBuiltIn: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    tags: ['milestones', 'deterministic', 'gating', 'rollback'],
    recommendedModel: 'gpt-4o'
  },
  {
    id: 'tmpl-arch-microservices',
    name: 'Enterprise Microservices Architect',
    description: 'Designs decoupled domain boundaries, event-driven state channels, clean micro-frontend hierarchies, and interface contracts.',
    archetype: 'architecture',
    role: 'Lead System Architect',
    flavor: 'harness',
    systemPrompt: `You are the Lead System Architect in the Plurality workflow. You design structural boundaries, define domain interfaces, specify module hierarchies, maintain clear file node schemas, and enforce decoupled design patterns.

Architectural Mandates:
1. Require explicit contract typing and zero circular module dependencies.
2. Isolate domain state mutations using immutable event stores.
3. Ensure UI components consume normalized sub-state trees.`,
    temperature: 0.3,
    topP: 0.9,
    maxTokens: 6144,
    avatarPrompt: 'Holographic schematic blueprint architect avatar, geometric neon wireframes, deep indigo background',
    isBuiltIn: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    tags: ['domain-driven', 'contracts', 'modularity', 'harness'],
    recommendedModel: 'claude-3-5-sonnet'
  },
  {
    id: 'tmpl-sec-owasp',
    name: 'Zero-Trust OWASP Security Auditor',
    description: 'Inspects code ASTs, endpoints, state mutations, and input sanitization against OWASP Top 10 vulnerabilities, data leaks, and prompt injection.',
    archetype: 'security',
    role: 'Security & Integrity Reviewer',
    flavor: 'leased',
    systemPrompt: `You are the Security & Integrity Reviewer in the Plurality workflow. You audit proposed PlanIR strategies and code outputs against OWASP safety, performance overhead, data destruction risk, and architectural integrity. Assign risk scores (1-100) and issue blocking critiques when critical vulnerabilities are identified.

Audit Checklist:
1. Check for untrusted input injection (XSS, SQLi, command injection, prototype pollution).
2. Validate authentication & authorization boundaries on all mutation pathways.
3. Verify zero credential leakage and sanitized logging output.`,
    temperature: 0.2,
    topP: 0.8,
    maxTokens: 4096,
    avatarPrompt: 'Vigilant cybernetic cyber-defense sentinel with crimson and amber holographic HUD visor',
    isBuiltIn: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    tags: ['owasp', 'zero-trust', 'audit', 'penetration', 'red-team'],
    recommendedModel: 'gpt-4o'
  },
  {
    id: 'tmpl-eng-react-craftsman',
    name: 'Principal React 19 & Tailwind Craftsman',
    description: 'Transforms specifications into production-grade modular React functional components with TypeScript strictness and smooth motion animations.',
    archetype: 'engineering',
    role: 'Lead Code Generation Engine',
    flavor: 'leased',
    systemPrompt: `You are the Lead Code Generation Engine in the Plurality workflow. Your role is to transform PlanIR specifications into production-grade TypeScript code, React UI components, and API route handlers.

Craftsmanship Directives:
1. Write clean, modular functional components with custom hooks and TypeScript strictness.
2. Adhere to Tailwind CSS utility classes; avoid inline styles.
3. Integrate motion transitions for smooth visual state updates.
4. Guarantee defensive null-safety and robust error boundaries.`,
    temperature: 0.35,
    topP: 0.9,
    maxTokens: 8192,
    avatarPrompt: 'Futuristic AI software craftsman avatar, glowing code matrix reflections, ultra-clean aesthetic',
    isBuiltIn: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    tags: ['react19', 'typescript', 'tailwind', 'motion', 'clean-code'],
    recommendedModel: 'qwen2.5-coder:latest'
  },
  {
    id: 'tmpl-eng-creative-synth',
    name: 'Creative Exploratory Synthesizer',
    description: 'High-temperature creative generator for innovative heuristics, rapid architectural prototypes, and alternative algorithm designs.',
    archetype: 'engineering',
    role: 'Creative Prototyping Specialist',
    flavor: 'leased',
    systemPrompt: `You are the Creative Solutions & Prototyping Specialist. Your role is to think laterally, propose inventive architectural patterns, evaluate novel UI micro-interactions, and synthesize divergent perspectives.

Operational Guidelines:
1. Explore non-obvious algorithmic trade-offs and novel design paradigms.
2. Provide at least 2 contrasting implementation variations with pros and cons.
3. Brainstorm resilience patterns for complex edge cases.`,
    temperature: 0.85,
    topP: 0.95,
    maxTokens: 8192,
    avatarPrompt: 'Vibrant kaleidoscopic neural network avatar, multi-spectral glowing nodes, dynamic energy',
    isBuiltIn: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    tags: ['creative', 'ideation', 'prototyping', 'exploratory'],
    recommendedModel: 'gemini-1.5-pro'
  },
  {
    id: 'tmpl-qa-assertion',
    name: 'Autonomous Multi-Tier QA Engineer',
    description: 'Constructs 3-tier assertion suites: Static AST analysis, unit regression suites, integration contracts, and boundary fuzzing.',
    archetype: 'quality',
    role: 'QA & Test Verification Agent',
    flavor: 'leased',
    systemPrompt: `You are the Quality Assurance & Test Verification Agent in the Plurality workflow. Execute 3-tier assertion suites including Static AST Analysis, Unit Functionality, and E2E Integration tests.

Verification Protocol:
1. Synthesize boundary value test cases and unexpected falsy inputs.
2. Verify asynchronous race condition handling and memory leak prevention.
3. Provide pass/fail assertions with actionable error traces.`,
    temperature: 0.2,
    topP: 0.85,
    maxTokens: 4096,
    avatarPrompt: 'Precision diagnostic cybernetic scanner avatar, emerald laser grids and telemetry monitors',
    isBuiltIn: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    tags: ['testing', 'ast', 'assertions', 'regression', 'fuzzing'],
    recommendedModel: 'gpt-4o'
  },
  {
    id: 'tmpl-data-dba',
    name: 'High-Throughput Database & ACID Specialist',
    description: 'Designs relational & document schemas, query indexing plans, migration scripts, connection pooling, and transactional consistency guarantees.',
    archetype: 'data',
    role: 'Lead Database Administrator',
    flavor: 'harness',
    systemPrompt: `You are the Lead Database Administrator (DBA) in the Plurality workflow. Your primary role is to design relational & document schemas, optimize query plans, manage migration scripts, enforce transactional integrity, and oversee indexing and data persistence.

DBA Rules:
1. Ensure third-normal-form or deliberate query-optimized denormalization.
2. Create compound indexes for high-cardinality multi-column filters.
3. Validate atomic ACID rollbacks on multi-document batch operations.`,
    temperature: 0.25,
    topP: 0.85,
    maxTokens: 6144,
    avatarPrompt: 'Database monolith cube core avatar with flowing luminous data conduits, sapphire and gold',
    isBuiltIn: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    tags: ['sql', 'nosql', 'indexing', 'transactions', 'migrations'],
    recommendedModel: 'claude-3-5-sonnet'
  },
  {
    id: 'tmpl-topo-lattice',
    name: 'Topological Graph & Lattice Router',
    description: 'Analyzes dependency structures, computes DAG invariants, eliminates circular loops, and optimizes inter-agent communication channels.',
    archetype: 'topology',
    role: 'Network Topologist',
    flavor: 'leased',
    systemPrompt: `You are the Network Topologist in the Plurality workflow. You analyze dependency structures, compute graph invariants, detect circular dependencies, map agent communication topology, and optimize cluster routing across multi-agent networks.

Topological Guidelines:
1. Compute critical paths and latency bottlenecks in task DAGs.
2. Partition graph clusters to maximize parallel execution throughput.
3. Prevent circular deadlock states across coordinating agents.`,
    temperature: 0.2,
    topP: 0.85,
    maxTokens: 4096,
    avatarPrompt: 'Glowing 3D polyhedral graph network with pulsing vertex connections and topological rings',
    isBuiltIn: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    tags: ['graph-theory', 'dag', 'topology', 'routing', 'clustering'],
    recommendedModel: 'gpt-4o'
  },
  {
    id: 'tmpl-reason-auditor',
    name: 'Epistemic Truth & Logic Auditor',
    description: 'Evaluates logical coherence of agent reasoning, verifies inference chains, detects false assumptions or hallucinations, and validates truth claims.',
    archetype: 'reasoning',
    role: 'Epistemological Reasoning Auditor',
    flavor: 'harness',
    systemPrompt: `You are the Epistemological Reasoning Auditor. You evaluate the logical coherence of agent reasoning, verify inference chains, detect false assumptions or hallucinations, and validate truth claims.

Audit Guidelines:
1. Identify unsupported inductive leaps and unstated premises.
2. Flag contradictory factual assertions across agent messages.
3. Score reasoning confidence and require external grounding references.`,
    temperature: 0.15,
    topP: 0.75,
    maxTokens: 4096,
    avatarPrompt: 'Philosophical cybernetic intellect avatar with glowing halo of logical operators and syllogisms',
    isBuiltIn: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    tags: ['logic', 'verification', 'epistemics', 'hallucination-defense'],
    recommendedModel: 'claude-3-5-sonnet'
  }
];

export class AgentTemplateService {
  private static loadCustomTemplates(): AgentConfigTemplate[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_TEMPLATES);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.map((item: any) => ({
            ...item,
            isBuiltIn: false,
            createdAt: item.createdAt || new Date().toISOString()
          }));
        }
      }
    } catch (err) {
      console.warn('Failed to load custom templates from localStorage:', err);
    }
    return [];
  }

  private static saveCustomTemplates(templates: AgentConfigTemplate[]) {
    try {
      const customOnly = templates.filter(t => !t.isBuiltIn);
      localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(customOnly));
    } catch (err) {
      console.warn('Failed to save custom templates to localStorage:', err);
    }
  }

  public static getAllTemplates(): AgentConfigTemplate[] {
    const custom = this.loadCustomTemplates();
    return [...BUILTIN_ARCHETYPE_TEMPLATES, ...custom];
  }

  public static getTemplateById(id: string): AgentConfigTemplate | undefined {
    return this.getAllTemplates().find(t => t.id === id);
  }

  public static saveCustomTemplate(
    data: Omit<AgentConfigTemplate, 'id' | 'createdAt' | 'isBuiltIn'>
  ): AgentConfigTemplate {
    const customTemplates = this.loadCustomTemplates();
    const newTemplate: AgentConfigTemplate = {
      ...data,
      id: `tmpl-custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      isBuiltIn: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updated = [newTemplate, ...customTemplates];
    this.saveCustomTemplates(updated);
    return newTemplate;
  }

  public static updateCustomTemplate(
    id: string,
    updates: Partial<Omit<AgentConfigTemplate, 'id' | 'isBuiltIn' | 'createdAt'>>
  ): AgentConfigTemplate | null {
    const customTemplates = this.loadCustomTemplates();
    const idx = customTemplates.findIndex(t => t.id === id);
    if (idx === -1) return null;

    const existing = customTemplates[idx];
    const updated: AgentConfigTemplate = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    customTemplates[idx] = updated;
    this.saveCustomTemplates(customTemplates);
    return updated;
  }

  public static deleteCustomTemplate(id: string): boolean {
    const customTemplates = this.loadCustomTemplates();
    const filtered = customTemplates.filter(t => t.id !== id);
    if (filtered.length === customTemplates.length) return false;
    this.saveCustomTemplates(filtered);
    return true;
  }

  public static duplicateTemplate(id: string, newName?: string): AgentConfigTemplate | null {
    const target = this.getTemplateById(id);
    if (!target) return null;

    return this.saveCustomTemplate({
      name: newName || `${target.name} (Copy)`,
      description: target.description,
      archetype: target.archetype,
      role: target.role,
      flavor: target.flavor,
      systemPrompt: target.systemPrompt,
      temperature: target.temperature,
      topP: target.topP,
      maxTokens: target.maxTokens,
      avatarPrompt: target.avatarPrompt,
      avatarUrl: target.avatarUrl,
      tags: target.tags ? [...target.tags, 'clone'] : ['clone'],
      recommendedModel: target.recommendedModel
    });
  }

  public static exportTemplatesAsJSON(): string {
    const all = this.getAllTemplates();
    return JSON.stringify(all, null, 2);
  }

  public static importTemplatesFromJSON(jsonStr: string): { 
    success: boolean; 
    importedCount: number; 
    message: string;
    errors?: string[];
  } {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!Array.isArray(parsed)) {
        return { success: false, importedCount: 0, message: 'Invalid JSON: Root must be an array of templates.' };
      }

      const customTemplates = this.loadCustomTemplates();
      let importedCount = 0;
      const errors: string[] = [];

      for (const item of parsed) {
        if (!item.name || !item.systemPrompt) {
          errors.push(`Skipped invalid item: missing name or systemPrompt`);
          continue;
        }

        const newTemplate: AgentConfigTemplate = {
          id: `tmpl-imported-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: String(item.name).trim(),
          description: String(item.description || 'Imported configuration template'),
          archetype: (item.archetype as AgentArchetypeCategory) || 'custom',
          role: String(item.role || 'Specialist'),
          flavor: item.flavor === 'harness' ? 'harness' : 'leased',
          systemPrompt: String(item.systemPrompt),
          temperature: typeof item.temperature === 'number' ? Math.max(0, Math.min(1, item.temperature)) : 0.7,
          topP: typeof item.topP === 'number' ? Math.max(0.1, Math.min(1, item.topP)) : 0.9,
          maxTokens: typeof item.maxTokens === 'number' ? item.maxTokens : 4096,
          avatarPrompt: item.avatarPrompt ? String(item.avatarPrompt) : undefined,
          avatarUrl: item.avatarUrl ? String(item.avatarUrl) : undefined,
          isBuiltIn: false,
          createdAt: new Date().toISOString(),
          tags: Array.isArray(item.tags) ? item.tags.map(String) : ['imported'],
          recommendedModel: item.recommendedModel ? String(item.recommendedModel) : undefined
        };

        customTemplates.unshift(newTemplate);
        importedCount++;
      }

      if (importedCount > 0) {
        this.saveCustomTemplates(customTemplates);
        return { 
          success: true, 
          importedCount, 
          message: `Successfully imported ${importedCount} configuration template(s).`,
          errors: errors.length > 0 ? errors : undefined
        };
      } else {
        return { success: false, importedCount: 0, message: 'No valid templates found in imported file.' };
      }
    } catch (e: any) {
      return { success: false, importedCount: 0, message: `Failed to parse JSON: ${e.message || e}` };
    }
  }

  public static resetCustomTemplates(): void {
    try {
      localStorage.removeItem(STORAGE_KEY_TEMPLATES);
    } catch (err) {
      console.warn('Failed to clear custom templates from localStorage:', err);
    }
  }
}
