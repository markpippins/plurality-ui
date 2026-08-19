import { useEffect, useState } from 'react';
import { BackendService } from '../services/SimulatedBackendService';
import { AlertService } from '../services/PerformanceAlertsService';
import { 
  FileNode, WorkRequest, PlanIR, CritiqueIR, SpecIR, ExecutionIR, ValidationIR, 
  ActiveAgent, AgentLogEntry, Workspace, ChatMessage, AgentLog, ToastNotification, 
  RoundtableSession, AppTheme, PerformanceMetricsSummary,
  PerformanceAlertRule, AlertBreachRecord, AlertEngineSettings,
  DualityState, WorkspaceLayoutConfig, WorkspaceLayoutMode,
  AgentTaskItem, AgentTaskQueueStats
} from '../types';
import { INITIAL_DUALITY_STATE, DEFAULT_LAYOUT_CONFIGS, INITIAL_AGENT_TASK_QUEUE } from '../services/SimulatedBackendService';

export function useSimulation() {
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [workRequests, setWorkRequests] = useState<WorkRequest[]>([]);
  const [activeWorkRequest, setActiveWorkRequest] = useState<WorkRequest | null>(null);
  const [planIR, setPlanIR] = useState<PlanIR | null>(null);
  const [critiqueIR, setCritiqueIR] = useState<CritiqueIR | null>(null);
  const [specIR, setSpecIR] = useState<SpecIR | null>(null);
  const [executionIR, setExecutionIR] = useState<ExecutionIR | null>(null);
  const [validationIR, setValidationIR] = useState<ValidationIR | null>(null);
  const [activeAgents, setActiveAgents] = useState<ActiveAgent[]>([]);
  const [agentLogs, setAgentLogs] = useState<AgentLogEntry[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<ActiveAgent | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [architectChat, setArchitectChat] = useState<ChatMessage[]>([]);
  const [builderLogs, setBuilderLogs] = useState<AgentLog[]>([]);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [roundtableSession, setRoundtableSession] = useState<RoundtableSession | null>(null);
  const [isRoundtableOpen, setIsRoundtableOpen] = useState<boolean>(false);
  const [isAgentConfigOpen, setIsAgentConfigOpen] = useState<boolean>(false);
  const [isDependencyGraphOpen, setIsDependencyGraphOpen] = useState<boolean>(false);
  const [isHeatmapOpen, setIsHeatmapOpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);
  const [isWorkRequestDetailOpen, setIsWorkRequestDetailOpen] = useState<boolean>(false);
  const [selectedWorkRequestForDetail, setSelectedWorkRequestForDetail] = useState<WorkRequest | null>(null);
  const [selectedAgentForConfig, setSelectedAgentForConfig] = useState<string>('a1');
  const [theme, setThemeState] = useState<AppTheme>('steel');
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetricsSummary>(BackendService.getPerformanceMetrics());

  // Workspace Layout Manager State
  const [layoutConfig, setLayoutConfig] = useState<WorkspaceLayoutConfig>(BackendService.getLayoutConfig());

  // Agent Task Queue State
  const [agentTaskQueue, setAgentTaskQueue] = useState<AgentTaskItem[]>(BackendService.getTaskQueue());
  const [isTaskQueueOpen, setIsTaskQueueOpen] = useState<boolean>(false);
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<AgentTaskItem | null>(null);

  // Duality Mode State
  const [isDualityMode, setIsDualityMode] = useState<boolean>(false);
  const [dualityState, setDualityState] = useState<DualityState>(INITIAL_DUALITY_STATE);

  // Performance Alert Rules State
  const [alertRules, setAlertRules] = useState<PerformanceAlertRule[]>(AlertService.getRules());
  const [alertHistory, setAlertHistory] = useState<AlertBreachRecord[]>(AlertService.getHistory());
  const [alertSettings, setAlertSettings] = useState<AlertEngineSettings>(AlertService.getSettings());
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const subs = [
      BackendService.fileTree$.subscribe(setFileTree),
      BackendService.workRequests$.subscribe(setWorkRequests),
      BackendService.activeWorkRequest$.subscribe(setActiveWorkRequest),
      BackendService.planIR$.subscribe(setPlanIR),
      BackendService.critiqueIR$.subscribe(setCritiqueIR),
      BackendService.specIR$.subscribe(setSpecIR),
      BackendService.executionIR$.subscribe(setExecutionIR),
      BackendService.validationIR$.subscribe(setValidationIR),
      BackendService.activeAgents$.subscribe(setActiveAgents),
      BackendService.agentLogs$.subscribe(setAgentLogs),
      BackendService.selectedAgent$.subscribe(setSelectedAgent),
      BackendService.workspaces$.subscribe(setWorkspaces),
      BackendService.activeWorkspace$.subscribe(setActiveWorkspace),
      BackendService.architectChat$.subscribe(setArchitectChat),
      BackendService.builderLogs$.subscribe(setBuilderLogs),
      BackendService.toasts$.subscribe(setToasts),
      BackendService.roundtableSession$.subscribe(setRoundtableSession),
      BackendService.isRoundtableOpen$.subscribe(setIsRoundtableOpen),
      BackendService.isAgentConfigOpen$.subscribe(setIsAgentConfigOpen),
      BackendService.isDependencyGraphOpen$.subscribe(setIsDependencyGraphOpen),
      BackendService.isHeatmapModalOpen$.subscribe(setIsHeatmapOpen),
      BackendService.isShortcutsOpen$.subscribe(setIsShortcutsOpen),
      BackendService.isOnboardingOpen$.subscribe(setIsOnboardingOpen),
      BackendService.isWorkRequestDetailOpen$.subscribe(setIsWorkRequestDetailOpen),
      BackendService.selectedWorkRequestForDetail$.subscribe(setSelectedWorkRequestForDetail),
      BackendService.selectedAgentForConfig$.subscribe(setSelectedAgentForConfig),
      BackendService.theme$.subscribe(setThemeState),
      BackendService.performanceMetrics$.subscribe(setPerformanceMetrics),

      // Layout subscriptions
      BackendService.layoutConfig$.subscribe(setLayoutConfig),

      // Task Queue subscriptions
      BackendService.agentTaskQueue$.subscribe(setAgentTaskQueue),
      BackendService.isTaskQueueOpen$.subscribe(setIsTaskQueueOpen),
      BackendService.selectedTaskForDetail$.subscribe(setSelectedTaskForDetail),

      // Duality subscriptions
      BackendService.isDualityMode$.subscribe(setIsDualityMode),
      BackendService.dualityState$.subscribe(setDualityState),

      // Alerts subscriptions
      AlertService.rules$.subscribe(setAlertRules),
      AlertService.history$.subscribe(setAlertHistory),
      AlertService.settings$.subscribe(setAlertSettings),
      AlertService.isModalOpen$.subscribe(setIsAlertsModalOpen)
    ];

    return () => subs.forEach(s => s.unsubscribe());
  }, []);

  return {
    fileTree,
    workRequests,
    activeWorkRequest,
    planIR,
    critiqueIR,
    specIR,
    executionIR,
    validationIR,
    activeAgents,
    agentLogs,
    selectedAgent,
    workspaces,
    activeWorkspace,
    architectChat,
    builderLogs,
    toasts,
    roundtableSession,
    isRoundtableOpen,
    isAgentConfigOpen,
    isDependencyGraphOpen,
    isHeatmapOpen,
    isShortcutsOpen,
    isOnboardingOpen,
    isWorkRequestDetailOpen,
    selectedWorkRequestForDetail,
    selectedAgentForConfig,
    theme,
    performanceMetrics,
    resetPerformanceMetrics: () => BackendService.resetPerformanceMetrics(),

    // Layout manager
    layoutConfig,
    setLayoutMode: (mode: WorkspaceLayoutMode) => BackendService.setLayoutMode(mode),
    togglePanelVisibility: (panel: keyof Omit<WorkspaceLayoutConfig, 'mode'>) => BackendService.togglePanelVisibility(panel),
    updateLayoutConfig: (updates: Partial<WorkspaceLayoutConfig>) => BackendService.updateLayoutConfig(updates),
    resetLayout: () => BackendService.resetLayout(),

    // Agent Task Queue
    agentTaskQueue,
    isTaskQueueOpen,
    selectedTaskForDetail,
    openTaskQueueModal: () => BackendService.openTaskQueueModal(),
    closeTaskQueueModal: () => BackendService.closeTaskQueueModal(),
    toggleTaskQueueModal: () => BackendService.toggleTaskQueueModal(),
    setSelectedTaskForDetail: (task: AgentTaskItem | null) => BackendService.setSelectedTaskForDetail(task),
    getTaskQueueStats: () => BackendService.getTaskQueueStats(),
    addTaskToQueue: (task: Partial<AgentTaskItem>) => BackendService.addTaskToQueue(task),
    updateTaskInQueue: (taskId: string, updates: Partial<AgentTaskItem>) => BackendService.updateTaskInQueue(taskId, updates),
    deleteTaskFromQueue: (taskId: string) => BackendService.deleteTaskFromQueue(taskId),
    startTaskExecution: (taskId: string) => BackendService.startTaskExecution(taskId),
    pauseTask: (taskId: string) => BackendService.pauseTask(taskId),
    resumeTask: (taskId: string) => BackendService.resumeTask(taskId),
    retryTask: (taskId: string) => BackendService.retryTask(taskId),
    markTaskCompleted: (taskId: string) => BackendService.markTaskCompleted(taskId),
    reorderAgentTaskQueue: (newQueue: AgentTaskItem[]) => BackendService.reorderAgentTaskQueue(newQueue),
    reorderPendingTasks: (sourceTaskId: string, targetTaskId: string, position?: 'above' | 'below', syncPriorityWithTarget?: boolean) => BackendService.reorderPendingTasks(sourceTaskId, targetTaskId, position, syncPriorityWithTarget),
    updateTaskPriority: (taskId: string, priority: AgentTaskItem['priority']) => BackendService.updateTaskPriority(taskId, priority),
    sortPendingTasksByPriority: (order?: 'desc' | 'asc') => BackendService.sortPendingTasksByPriority(order),
    runAllPendingTasks: () => BackendService.runAllPendingTasks(),
    clearCompletedTasks: () => BackendService.clearCompletedTasks(),
    resetTaskQueueToDefault: () => BackendService.resetTaskQueueToDefault(),

    // Duality mode
    isDualityMode,
    dualityState,
    setDualityMode: (enabled: boolean) => BackendService.setDualityMode(enabled),
    toggleDualityMode: () => BackendService.toggleDualityMode(),
    setDualityPrimaryRole: (role: string, model?: string, agentId?: string) => BackendService.setDualityPrimaryRole(role, model, agentId),
    setDualitySecondaryRole: (role: string, model?: string, agentId?: string) => BackendService.setDualitySecondaryRole(role, model, agentId),
    sendDualityUserPrompt: (promptText: string) => BackendService.sendDualityUserPrompt(promptText),
    selectDualityDecisionCardOption: (messageId: string, cardId: string, optionId: string) => BackendService.selectDualityDecisionCardOption(messageId, cardId, optionId),
    dispatchDualitySpecToBuilder: (specContent?: string) => BackendService.dispatchDualitySpecToBuilder(specContent),
    runAutomatedDualityExchange: () => BackendService.runAutomatedDualityExchange(),
    clearDualityChat: () => BackendService.clearDualityChat(),
    clearDualityInterAgentDialog: () => BackendService.clearDualityInterAgentDialog(),
    resetDualityState: () => BackendService.resetDualityState(),
    runDualityBenchmark: () => BackendService.runDualityBenchmark(),
    resetDualityMetrics: () => BackendService.resetDualityMetrics(),

    // Alert system state & actions
    alertRules,
    alertHistory,
    alertSettings,
    isAlertsModalOpen,
    openPerformanceAlertsModal: () => AlertService.openModal(),
    closePerformanceAlertsModal: () => AlertService.closeModal(),
    togglePerformanceAlertsModal: () => AlertService.toggleModal(),
    saveAlertRule: (rule: PerformanceAlertRule) => AlertService.saveRule(rule),
    deleteAlertRule: (id: string) => AlertService.deleteRule(id),
    toggleAlertRule: (id: string, enabled?: boolean) => AlertService.toggleRule(id, enabled),
    resetAlertRulesToDefaults: () => AlertService.resetRulesToDefaults(),
    testFireAlertRule: (id: string, customObserved?: number) => AlertService.testFireRule(id, customObserved),
    simulateLatencySpike: (agentId?: string, latencyMs?: number) => AlertService.simulateLatencySpike(agentId, latencyMs),
    acknowledgeBreach: (recordId: string) => AlertService.acknowledgeBreach(recordId),
    acknowledgeAllBreaches: () => AlertService.acknowledgeAllBreaches(),
    clearAlertHistory: () => AlertService.clearHistory(),
    updateAlertSettings: (updates: Partial<AlertEngineSettings>) => AlertService.updateSettings(updates),
    AlertService,

    openWorkRequestDetailModal: (wr?: WorkRequest) => BackendService.openWorkRequestDetailModal(wr),
    closeWorkRequestDetailModal: () => BackendService.closeWorkRequestDetailModal(),
    toggleWorkRequestDetailModal: (wr?: WorkRequest) => BackendService.toggleWorkRequestDetailModal(wr),
    setTheme: (t: AppTheme) => BackendService.setTheme(t),
    addToast: (toast: Omit<ToastNotification, 'id' | 'timestamp'>) => BackendService.addToast(toast),
    removeToast: (id: string) => BackendService.removeToast(id),
    clearAllToasts: () => BackendService.clearAllToasts(),
    selectAgentForLogs: (id: string | null) => BackendService.selectAgentForLogs(id),
    clearLogsForAgent: (id: string) => BackendService.clearLogsForAgent(id),
    openRoundtableModal: (topic?: string) => BackendService.openRoundtableModal(topic),
    closeRoundtableModal: () => BackendService.closeRoundtableModal(),
    triggerRoundtableVote: (topic: string, description?: string, participantAgentIds?: string[]) => BackendService.triggerRoundtableVote(topic, description, participantAgentIds),
    openAgentConfigModal: (agentId?: string) => BackendService.openAgentConfigModal(agentId),
    closeAgentConfigModal: () => BackendService.closeAgentConfigModal(),
    openDependencyGraphModal: () => BackendService.openDependencyGraphModal(),
    closeDependencyGraphModal: () => BackendService.closeDependencyGraphModal(),
    toggleDependencyGraphModal: () => BackendService.toggleDependencyGraphModal(),
    openHeatmapModal: () => BackendService.openHeatmapModal(),
    closeHeatmapModal: () => BackendService.closeHeatmapModal(),
    toggleHeatmapModal: () => BackendService.toggleHeatmapModal(),
    updateAgentConfig: (agentId: string, updates: Partial<ActiveAgent>) => BackendService.updateAgentConfig(agentId, updates),
    addAgent: (agentData: { name: string; role: string; flavor?: 'leased' | 'harness'; model?: string; systemPrompt?: string; temperature?: number; topP?: number; maxTokens?: number; avatarPrompt?: string; avatarUrl?: string }) => BackendService.addAgent(agentData),
    deleteAgent: (agentId: string) => BackendService.deleteAgent(agentId),
    openShortcutsModal: () => BackendService.openShortcutsModal(),
    closeShortcutsModal: () => BackendService.closeShortcutsModal(),
    toggleShortcutsModal: () => BackendService.toggleShortcutsModal(),
    openOnboardingModal: () => BackendService.openOnboardingModal(),
    closeOnboardingModal: () => BackendService.closeOnboardingModal(),
    toggleOnboardingModal: () => BackendService.toggleOnboardingModal(),
    resetPersistedStorage: () => BackendService.resetPersistedStorage(),
    BackendService
  };
}




