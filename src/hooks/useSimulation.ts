import { useEffect, useState } from 'react';
import { BackendService } from '../services/SimulatedBackendService';
import { FileNode, WorkRequest, PlanIR, CritiqueIR, SpecIR, ExecutionIR, ValidationIR, ActiveAgent, AgentLogEntry, Workspace, ChatMessage, AgentLog, ToastNotification, RoundtableSession, AppTheme } from '../types';

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
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [isWorkRequestDetailOpen, setIsWorkRequestDetailOpen] = useState<boolean>(false);
  const [selectedWorkRequestForDetail, setSelectedWorkRequestForDetail] = useState<WorkRequest | null>(null);
  const [selectedAgentForConfig, setSelectedAgentForConfig] = useState<string>('a1');
  const [theme, setThemeState] = useState<AppTheme>('steel');

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
      BackendService.isShortcutsOpen$.subscribe(setIsShortcutsOpen),
      BackendService.isWorkRequestDetailOpen$.subscribe(setIsWorkRequestDetailOpen),
      BackendService.selectedWorkRequestForDetail$.subscribe(setSelectedWorkRequestForDetail),
      BackendService.selectedAgentForConfig$.subscribe(setSelectedAgentForConfig),
      BackendService.theme$.subscribe(setThemeState),
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
    isShortcutsOpen,
    isWorkRequestDetailOpen,
    selectedWorkRequestForDetail,
    selectedAgentForConfig,
    theme,
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
    updateAgentConfig: (agentId: string, updates: Partial<ActiveAgent>) => BackendService.updateAgentConfig(agentId, updates),
    addAgent: (agentData: { name: string; role: string; flavor?: 'leased' | 'harness'; model?: string; systemPrompt?: string; temperature?: number; topP?: number; maxTokens?: number; avatarPrompt?: string; avatarUrl?: string }) => BackendService.addAgent(agentData),
    deleteAgent: (agentId: string) => BackendService.deleteAgent(agentId),
    openShortcutsModal: () => BackendService.openShortcutsModal(),
    closeShortcutsModal: () => BackendService.closeShortcutsModal(),
    toggleShortcutsModal: () => BackendService.toggleShortcutsModal(),
    resetPersistedStorage: () => BackendService.resetPersistedStorage(),
    BackendService
  };
}



