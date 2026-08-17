import { BehaviorSubject } from 'rxjs';
import { 
  PerformanceAlertRule, 
  AlertBreachRecord, 
  AlertEngineSettings, 
  DEFAULT_ALERT_RULES,
  AlertMetricType,
  AlertOperator,
  AlertSeverity,
  ActiveAgent,
  ToastNotification
} from '../types';

const STORAGE_KEY_RULES = 'plurality_perf_alert_rules_v2';
const STORAGE_KEY_HISTORY = 'plurality_perf_alert_history_v2';
const STORAGE_KEY_SETTINGS = 'plurality_perf_alert_settings_v2';

const DEFAULT_SETTINGS: AlertEngineSettings = {
  isGloballyEnabled: true,
  soundEnabled: true,
  defaultCooldownSec: 10,
  autoOpenDrawerOnCritical: false,
  retentionMaxRecords: 100
};

// Web Audio API notification chime generator
function playAudioChime(severity: AlertSeverity = 'warn') {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (severity === 'error') {
      // Urgent double beep (higher dissonance)
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(440, now + 0.08);
      osc.frequency.setValueAtTime(880, now + 0.16);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (severity === 'warn') {
      // Warning chime (sine wave triad)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(739.99, now + 0.09); // F#5
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else {
      // Info chime (soft bell)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    }
  } catch {
    // Graceful fallback if browser policies block auto-audio
  }
}

function loadPersistedRules(): PerformanceAlertRule[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RULES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to load alert rules from localStorage:', err);
  }
  return DEFAULT_ALERT_RULES;
}

function savePersistedRules(rules: PerformanceAlertRule[]) {
  try {
    localStorage.setItem(STORAGE_KEY_RULES, JSON.stringify(rules));
  } catch (err) {
    console.warn('Failed to save alert rules to localStorage:', err);
  }
}

function loadPersistedHistory(): AlertBreachRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to load alert history from localStorage:', err);
  }
  // Generate some realistic seed records so the user sees historical activity
  return [
    {
      id: 'breach-seed-1',
      ruleId: 'rule-latency-warning',
      ruleName: 'Global Latency Warning (> 200ms)',
      metric: 'latency',
      targetAgentId: 'all',
      agentId: 'a3',
      agentName: 'Coder',
      agentRole: 'Builder',
      observedValue: 2280,
      thresholdValue: 200,
      operator: '>',
      unit: 'ms',
      severity: 'warn',
      message: 'Agent Coder response time of 2280ms exceeded latency threshold (200ms).',
      timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      acknowledged: true
    },
    {
      id: 'breach-seed-2',
      ruleId: 'rule-step-token-spike',
      ruleName: 'High Step Token Consumption (> 2500 tokens)',
      metric: 'tokenUsage',
      targetAgentId: 'all',
      agentId: 'a3',
      agentName: 'Coder',
      agentRole: 'Builder',
      observedValue: 2850,
      thresholdValue: 2500,
      operator: '>',
      unit: 'tokens',
      severity: 'warn',
      message: 'Agent Coder turn consumed 2850 tokens (threshold: 2500 tokens).',
      timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      acknowledged: false
    }
  ];
}

function savePersistedHistory(history: AlertBreachRecord[]) {
  try {
    const trimmed = history.slice(0, 100);
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(trimmed));
  } catch (err) {
    console.warn('Failed to save alert history to localStorage:', err);
  }
}

function loadPersistedSettings(): AlertEngineSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (err) {
    console.warn('Failed to load alert settings from localStorage:', err);
  }
  return DEFAULT_SETTINGS;
}

function savePersistedSettings(settings: AlertEngineSettings) {
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.warn('Failed to save alert settings to localStorage:', err);
  }
}

export class PerformanceAlertsService {
  private rulesSubject = new BehaviorSubject<PerformanceAlertRule[]>(loadPersistedRules());
  public rules$ = this.rulesSubject.asObservable();

  private historySubject = new BehaviorSubject<AlertBreachRecord[]>(loadPersistedHistory());
  public history$ = this.historySubject.asObservable();

  private settingsSubject = new BehaviorSubject<AlertEngineSettings>(loadPersistedSettings());
  public settings$ = this.settingsSubject.asObservable();

  private isModalOpenSubject = new BehaviorSubject<boolean>(false);
  public isModalOpen$ = this.isModalOpenSubject.asObservable();

  // In-memory cooldown tracking: ruleId -> timestamp of last fired alert
  private ruleLastFiredMap = new Map<string, number>();

  // External dispatcher hook (injected from SimulatedBackendService)
  public toastDispatcher: ((toast: Omit<ToastNotification, 'id' | 'timestamp'>) => void) | null = null;
  public logDispatcher: ((log: { agentId: string; agentName: string; level: 'warn' | 'error' | 'info'; action: string; details: string; metadata?: Record<string, any> }) => void) | null = null;
  public terminalDispatcher: ((text: string) => void) | null = null;
  public activeAgentsGetter: (() => ActiveAgent[]) | null = null;

  public getRules(): PerformanceAlertRule[] {
    return this.rulesSubject.getValue();
  }

  public getHistory(): AlertBreachRecord[] {
    return this.historySubject.getValue();
  }

  public getSettings(): AlertEngineSettings {
    return this.settingsSubject.getValue();
  }

  public openModal() {
    this.isModalOpenSubject.next(true);
  }

  public closeModal() {
    this.isModalOpenSubject.next(false);
  }

  public toggleModal() {
    this.isModalOpenSubject.next(!this.isModalOpenSubject.getValue());
  }

  public updateSettings(updates: Partial<AlertEngineSettings>) {
    const current = this.settingsSubject.getValue();
    const updated = { ...current, ...updates };
    this.settingsSubject.next(updated);
    savePersistedSettings(updated);
  }

  public saveRule(rule: PerformanceAlertRule) {
    const rules = this.rulesSubject.getValue();
    const index = rules.findIndex(r => r.id === rule.id);
    let updatedRules: PerformanceAlertRule[];

    if (index >= 0) {
      updatedRules = [...rules];
      updatedRules[index] = {
        ...rule,
        updatedAt: new Date().toISOString()
      };
    } else {
      updatedRules = [
        {
          ...rule,
          createdAt: rule.createdAt || new Date().toISOString(),
          triggerCount: rule.triggerCount || 0
        },
        ...rules
      ];
    }

    this.rulesSubject.next(updatedRules);
    savePersistedRules(updatedRules);
  }

  public deleteRule(id: string) {
    const rules = this.rulesSubject.getValue();
    const updated = rules.filter(r => r.id !== id);
    this.rulesSubject.next(updated);
    savePersistedRules(updated);
  }

  public toggleRule(id: string, enabled?: boolean) {
    const rules = this.rulesSubject.getValue();
    const updated = rules.map(r => {
      if (r.id === id) {
        return {
          ...r,
          enabled: enabled !== undefined ? enabled : !r.enabled,
          updatedAt: new Date().toISOString()
        };
      }
      return r;
    });
    this.rulesSubject.next(updated);
    savePersistedRules(updated);
  }

  public resetRulesToDefaults() {
    this.rulesSubject.next(DEFAULT_ALERT_RULES);
    savePersistedRules(DEFAULT_ALERT_RULES);
    this.ruleLastFiredMap.clear();
  }

  public acknowledgeBreach(recordId: string) {
    const history = this.historySubject.getValue();
    const updated = history.map(h => (h.id === recordId ? { ...h, acknowledged: true } : h));
    this.historySubject.next(updated);
    savePersistedHistory(updated);
  }

  public acknowledgeAllBreaches() {
    const history = this.historySubject.getValue();
    const updated = history.map(h => ({ ...h, acknowledged: true }));
    this.historySubject.next(updated);
    savePersistedHistory(updated);
  }

  public clearHistory() {
    this.historySubject.next([]);
    savePersistedHistory([]);
  }

  /**
   * Evaluates if a given value breaches a threshold operator
   */
  private evaluateCondition(observed: number, operator: AlertOperator, threshold: number): boolean {
    switch (operator) {
      case '>':
        return observed > threshold;
      case '>=':
        return observed >= threshold;
      case '<':
        return observed < threshold;
      case '<=':
        return observed <= threshold;
      case '==':
        return Math.abs(observed - threshold) < 0.0001;
      default:
        return false;
    }
  }

  /**
   * Main metric evaluation router called whenever an agent works or finishes a turn
   */
  public checkAgentWork(
    agentId: string,
    durationMs: number,
    promptTokens: number,
    completionTokens: number,
    isError: boolean = false,
    options: { forceNoCooldown?: boolean } = {}
  ) {
    const settings = this.settingsSubject.getValue();
    if (!settings.isGloballyEnabled) return;

    const totalTokens = promptTokens + completionTokens;
    const tokensPerSec = durationMs > 0 ? Math.round((totalTokens / (durationMs / 1000))) : 100;
    const activeAgents = this.activeAgentsGetter ? this.activeAgentsGetter() : [];
    const agent = activeAgents.find(a => a.id === agentId);
    const agentName = agent?.name || (agentId === 'a1' ? 'Planner' : agentId === 'a2' ? 'Critic' : agentId === 'a3' ? 'Coder' : agentId === 'a4' ? 'Validator' : 'Agent');
    const agentRole = agent?.role || 'Specialist';

    const rules = this.rulesSubject.getValue().filter(r => r.enabled);

    for (const rule of rules) {
      // Check target scope
      if (rule.targetAgentId !== 'all' && rule.targetAgentId !== agentId) {
        continue;
      }

      let observedValue: number | null = null;
      switch (rule.metric) {
        case 'latency':
          observedValue = durationMs;
          break;
        case 'tokensPerSec':
          observedValue = tokensPerSec;
          break;
        case 'tokenUsage':
          observedValue = totalTokens;
          break;
        case 'errorCount':
          if (isError) observedValue = 1;
          break;
        default:
          break;
      }

      if (observedValue !== null) {
        const isBreached = this.evaluateCondition(observedValue, rule.operator, rule.threshold);
        if (isBreached) {
          this.triggerAlert(rule, observedValue, {
            agentId,
            agentName,
            agentRole,
            forceNoCooldown: options.forceNoCooldown
          });
        }
      }
    }
  }

  /**
   * Evaluates task completion metrics (e.g. success rate, total tokens)
   */
  public checkTaskCompletion(
    taskId: string,
    durationMs: number,
    totalTokens: number,
    successRatePercent: number,
    isSuccess: boolean
  ) {
    const settings = this.settingsSubject.getValue();
    if (!settings.isGloballyEnabled) return;

    const rules = this.rulesSubject.getValue().filter(r => r.enabled);

    for (const rule of rules) {
      let observedValue: number | null = null;
      switch (rule.metric) {
        case 'successRate':
          observedValue = successRatePercent;
          break;
        case 'totalTokens':
          observedValue = totalTokens;
          break;
        case 'errorCount':
          if (!isSuccess) observedValue = 1;
          break;
        default:
          break;
      }

      if (observedValue !== null) {
        const isBreached = this.evaluateCondition(observedValue, rule.operator, rule.threshold);
        if (isBreached) {
          this.triggerAlert(rule, observedValue, {
            agentName: 'Workflow Engine',
            agentRole: 'Pipeline Orchestrator'
          });
        }
      }
    }
  }

  /**
   * Internal alert trigger implementation: checks cooldown, produces notification, audio, terminal log, and audit record
   */
  private triggerAlert(
    rule: PerformanceAlertRule,
    observedValue: number,
    context: {
      agentId?: string;
      agentName?: string;
      agentRole?: string;
      forceNoCooldown?: boolean;
      customMessage?: string;
    } = {}
  ) {
    const now = Date.now();
    const cooldownMs = (rule.cooldownSec ?? 10) * 1000;
    const lastFired = this.ruleLastFiredMap.get(rule.id) || 0;

    if (!context.forceNoCooldown && (now - lastFired < cooldownMs)) {
      // Cooldown active, suppress toast to prevent spamming
      return;
    }

    this.ruleLastFiredMap.set(rule.id, now);
    const settings = this.settingsSubject.getValue();

    // Format human-friendly breach message
    const formattedObserved = `${observedValue}${rule.unit}`;
    const formattedThreshold = `${rule.operator} ${rule.threshold}${rule.unit}`;
    const targetLabel = context.agentName ? `${context.agentName} (${context.agentRole || 'Agent'})` : 'Agent';

    let breachMessage = context.customMessage;
    if (!breachMessage) {
      if (rule.metric === 'latency') {
        breachMessage = `${targetLabel} execution duration reached ${formattedObserved}, exceeding threshold of ${formattedThreshold}.`;
      } else if (rule.metric === 'tokensPerSec') {
        breachMessage = `${targetLabel} generation throughput dropped to ${formattedObserved}, violating minimum SLA floor (${formattedThreshold}).`;
      } else if (rule.metric === 'tokenUsage') {
        breachMessage = `${targetLabel} consumed ${formattedObserved} in a single turn, exceeding budget threshold (${formattedThreshold}).`;
      } else if (rule.metric === 'errorCount') {
        breachMessage = `${targetLabel} experienced an execution failure (${formattedObserved}), breaching zero-error threshold (${formattedThreshold}).`;
      } else if (rule.metric === 'successRate') {
        breachMessage = `Pipeline success rate dropped to ${formattedObserved}, breaching reliability SLA (${formattedThreshold}).`;
      } else {
        breachMessage = `${targetLabel} metric "${rule.metric}" observed value ${formattedObserved} breached rule threshold (${formattedThreshold}).`;
      }
    }

    // 1. Play sound chime if enabled
    if (settings.soundEnabled && rule.notificationChannels.sound) {
      playAudioChime(rule.severity);
    }

    // 2. Dispatch Toast Notification
    if (rule.notificationChannels.toast && this.toastDispatcher) {
      const toastType: ToastNotification['type'] = rule.severity === 'error' ? 'error' : rule.severity === 'warn' ? 'warn' : 'info';
      const severityIcon = rule.severity === 'error' ? '🚨' : rule.severity === 'warn' ? '⚠️' : 'ℹ️';

      this.toastDispatcher({
        title: `${severityIcon} ${rule.name}`,
        message: breachMessage,
        type: toastType,
        agentId: context.agentId,
        agentName: context.agentName,
        agentRole: context.agentRole,
        duration: rule.severity === 'error' ? 7000 : 5500,
        actionLabel: 'Configure Alerts',
        onAction: () => this.openModal()
      });
    }

    // 3. Dispatch Terminal Output
    if (rule.notificationChannels.terminal && this.terminalDispatcher) {
      const colorCode = rule.severity === 'error' ? '\x1b[31;1m' : rule.severity === 'warn' ? '\x1b[33;1m' : '\x1b[36;1m';
      const resetCode = '\x1b[0m';
      this.terminalDispatcher(
        `\r\n${colorCode}[ALERT: ${rule.name.toUpperCase()}]${resetCode} ${breachMessage} (Observed: ${formattedObserved}, Rule: ${rule.id})\r\n`
      );
    }

    // 4. Dispatch Agent Log Entry
    if (rule.notificationChannels.agentLog && this.logDispatcher && context.agentId && context.agentName) {
      this.logDispatcher({
        agentId: context.agentId,
        agentName: context.agentName,
        level: rule.severity,
        action: 'PERF_THRESHOLD_BREACH',
        details: `[Threshold Alert] ${rule.name}: ${breachMessage}`,
        metadata: {
          ruleId: rule.id,
          metric: rule.metric,
          observed: observedValue,
          threshold: rule.threshold,
          operator: rule.operator
        }
      });
    }

    // 5. Update Rule trigger count & lastTriggered timestamp
    const allRules = this.rulesSubject.getValue();
    const ruleIdx = allRules.findIndex(r => r.id === rule.id);
    if (ruleIdx >= 0) {
      const updatedRules = [...allRules];
      updatedRules[ruleIdx] = {
        ...updatedRules[ruleIdx],
        triggerCount: (updatedRules[ruleIdx].triggerCount || 0) + 1,
        lastTriggered: new Date().toISOString()
      };
      this.rulesSubject.next(updatedRules);
      savePersistedRules(updatedRules);
    }

    // 6. Record to Alert History Log
    const record: AlertBreachRecord = {
      id: `breach-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      ruleId: rule.id,
      ruleName: rule.name,
      metric: rule.metric,
      targetAgentId: rule.targetAgentId,
      agentId: context.agentId,
      agentName: context.agentName,
      agentRole: context.agentRole,
      observedValue,
      thresholdValue: rule.threshold,
      operator: rule.operator,
      unit: rule.unit,
      severity: rule.severity,
      message: breachMessage,
      timestamp: new Date().toISOString(),
      acknowledged: false
    };

    const currentHistory = this.historySubject.getValue();
    const updatedHistory = [record, ...currentHistory].slice(0, settings.retentionMaxRecords || 100);
    this.historySubject.next(updatedHistory);
    savePersistedHistory(updatedHistory);
  }

  /**
   * Test fire an alert rule directly for interactive verification
   */
  public testFireRule(ruleId: string, customObserved?: number) {
    const rules = this.rulesSubject.getValue();
    const rule = rules.find(r => r.id === ruleId);
    if (!rule) return;

    let testObserved = customObserved;
    if (testObserved === undefined) {
      // Calculate a value that breaches the rule
      if (rule.operator === '>' || rule.operator === '>=') {
        testObserved = rule.metric === 'latency' ? rule.threshold + 150 : Math.round(rule.threshold * 1.3);
      } else {
        testObserved = Math.max(1, Math.round(rule.threshold * 0.7));
      }
    }

    const activeAgents = this.activeAgentsGetter ? this.activeAgentsGetter() : [];
    let targetAgent = activeAgents[0];
    if (rule.targetAgentId !== 'all') {
      const found = activeAgents.find(a => a.id === rule.targetAgentId);
      if (found) targetAgent = found;
    }

    this.triggerAlert(rule, testObserved, {
      agentId: targetAgent?.id || 'a1',
      agentName: targetAgent?.name || 'Planner',
      agentRole: targetAgent?.role || 'Architect',
      forceNoCooldown: true
    });
  }

  /**
   * Helper specifically for testing latency spike alert (e.g. latency > 200ms)
   */
  public simulateLatencySpike(agentId: string = 'a1', latencyMs: number = 380) {
    const activeAgents = this.activeAgentsGetter ? this.activeAgentsGetter() : [];
    const targetAgent = activeAgents.find(a => a.id === agentId) || activeAgents[0];
    
    // Check all rules for latency breach
    this.checkAgentWork(
      targetAgent?.id || agentId,
      latencyMs,
      1200,
      600,
      false,
      { forceNoCooldown: true }
    );
  }
}

export const AlertService = new PerformanceAlertsService();
