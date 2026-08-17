import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSimulation } from '../hooks/useSimulation';
import { 
  Search, X, Cpu, Sliders, FileText, Target, 
  Activity, CheckCircle2, Clock, AlertCircle, ArrowRight, CornerDownLeft,
  Command, Zap, Users, Workflow, Shield, Moon, Sun, Keyboard, Plus, RefreshCw, Sparkles, Layers, HelpCircle, Flame, ListTodo
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { ActiveAgent, WorkRequest, AgentLogEntry } from '../types';

export type CommandCategory = 'all' | 'actions' | 'agents' | 'work_requests' | 'execution_steps' | 'logs';

interface CommandItem {
  id: string;
  category: 'actions' | 'agents' | 'work_requests' | 'execution_steps' | 'logs';
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
  badge?: string;
  badgeColor?: string;
  avatarUrl?: string;
  shortcutHint?: string;
  onSelect: () => void;
}

export function GlobalSearchBar() {
  const { 
    activeAgents, 
    agentLogs, 
    workRequests, 
    activeWorkRequest,
    planIR, 
    executionIR, 
    selectAgentForLogs, 
    openAgentConfigModal, 
    openRoundtableModal,
    openDependencyGraphModal,
    openHeatmapModal,
    openWorkRequestDetailModal,
    openShortcutsModal,
    openOnboardingModal,
    setTheme,
    resetPersistedStorage,
    addToast,
    BackendService 
  } = useSimulation();

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CommandCategory>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);

  // Global Keyboard Shortcut Listener (Ctrl+K, Cmd+K, or '/')
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k';
      const target = e.target as HTMLElement | null;
      const isInput = target && (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.tagName === 'SELECT' || 
        target.isContentEditable
      );

      const isSlash = e.key === '/' && !isInput;

      if (isCmdK || isSlash) {
        e.preventDefault();
        setIsOpen(prev => !prev);
        if (!isOpen) {
          setQuery('');
          setActiveCategory('all');
          setSelectedIndex(0);
        }
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [isOpen]);

  // Compute all available commands based on search query & active category filter
  const commandItems = useMemo<CommandItem[]>(() => {
    const trimmed = query.trim().toLowerCase();
    const items: CommandItem[] = [];

    // -------------------------------------------------------------
    // 1. SYSTEM QUICK ACTIONS & AGENT COMMANDS
    // -------------------------------------------------------------
    const systemActions: CommandItem[] = [
      {
        id: 'cmd-perf-alerts-config',
        category: 'actions',
        title: 'Configure Performance Threshold Alerts (Latency > 200ms, TPS, Tokens)',
        subtitle: 'Manage global SLA threshold alert rules, toast notification triggers, and audit history.',
        icon: <Zap className="w-4 h-4 text-amber-400" />,
        badge: 'ALERTS & SLA',
        badgeColor: 'bg-amber-950/90 text-amber-300 border-amber-700/80',
        shortcutHint: 'A',
        onSelect: () => {
          BackendService.openPerformanceAlertsModal();
        }
      },
      {
        id: 'cmd-test-latency-spike',
        category: 'actions',
        title: 'Test Latency Alert: Simulate Agent Spike (340ms > 200ms)',
        subtitle: 'Fires an automated toast notification breach alert across the notification stream.',
        icon: <Clock className="w-4 h-4 text-rose-400" />,
        badge: 'SIMULATE',
        badgeColor: 'bg-rose-950/90 text-rose-300 border-rose-700/80',
        onSelect: () => {
          BackendService.openPerformanceAlertsModal();
          setTimeout(() => {
            // trigger simulation
          }, 100);
        }
      },
      {
        id: 'cmd-task-queue',
        category: 'actions',
        title: 'Open Agent Sub-Task Queue (Architect & Builder DAG)',
        subtitle: 'Track real-time pending, active, and completed sub-tasks assigned to Architect and Builder.',
        icon: <ListTodo className="w-4 h-4 text-blue-400" />,
        badge: 'TASK QUEUE',
        badgeColor: 'bg-blue-950/90 text-blue-300 border-blue-700/80',
        shortcutHint: 'Q',
        onSelect: () => {
          BackendService.openTaskQueueModal();
        }
      },
      {
        id: 'cmd-agent-metrics-hud',
        category: 'actions',
        title: 'Open Agent Performance Metrics & Token Usage (HUD)',
        subtitle: 'Inspect task completion times, throughput tokens/sec, and per-agent token split.',
        icon: <Activity className="w-4 h-4 text-amber-400" />,
        badge: 'METRICS HUD',
        badgeColor: 'bg-amber-950/90 text-amber-300 border-amber-700/80',
        shortcutHint: 'M',
        onSelect: () => {
          addToast({
            title: '⚡ Agent Metrics HUD',
            message: 'Viewing real-time agent completion times & token consumption.',
            type: 'info'
          });
        }
      },
      {
        id: 'cmd-onboarding-tour',
        category: 'actions',
        title: 'Launch Interactive Onboarding Layout & Workflow Tour',
        subtitle: 'Guided walkthrough introducing layout sections, agent consensus, and task workflows.',
        icon: <HelpCircle className="w-4 h-4 text-blue-400" />,
        badge: 'TUTORIAL',
        badgeColor: 'bg-blue-950/90 text-blue-300 border-blue-700/80',
        shortcutHint: 'TOUR',
        onSelect: () => {
          openOnboardingModal();
        }
      },
      {
        id: 'cmd-roundtable',
        category: 'actions',
        title: 'Convene Agent Roundtable Consensus Vote',
        subtitle: 'Initiate a multi-agent debate and vote session across active agent roles.',
        icon: <Users className="w-4 h-4 text-blue-400" />,
        badge: 'GOVERNANCE',
        badgeColor: 'bg-blue-950/90 text-blue-300 border-blue-700/80',
        shortcutHint: 'R',
        onSelect: () => {
          openRoundtableModal();
          addToast({
            title: '🏛️ Roundtable Mode Convened',
            message: 'Opened multi-agent consensus voting session.',
            type: 'info'
          });
        }
      },
      {
        id: 'cmd-create-wr',
        category: 'actions',
        title: 'Create New Work Request Task',
        subtitle: 'Spawn a new user request into the task pipeline for agent processing.',
        icon: <Plus className="w-4 h-4 text-emerald-400" />,
        badge: 'PIPELINE',
        badgeColor: 'bg-emerald-950/90 text-emerald-300 border-emerald-700/80',
        onSelect: () => {
          BackendService.createWorkRequest('New User Request');
          addToast({
            title: '✨ Work Request Created',
            message: 'Spawned new task into pipeline.',
            type: 'success'
          });
        }
      },
      {
        id: 'cmd-dependency-graph',
        category: 'actions',
        title: 'Open Interactive D3.js Task & Dependency Graph',
        subtitle: 'Analyze task bottlenecks, wait states, and agent workflow topology.',
        icon: <Workflow className="w-4 h-4 text-teal-400" />,
        badge: 'VISUALIZER',
        badgeColor: 'bg-teal-950/90 text-teal-300 border-teal-700/80',
        shortcutHint: 'G',
        onSelect: () => {
          openDependencyGraphModal();
          addToast({
            title: '📊 D3 Task Graph Opened',
            message: 'Displaying interactive agent dependency topology.',
            type: 'info'
          });
        }
      },
      {
        id: 'cmd-agent-activity-heatmap',
        category: 'actions',
        title: 'Open Global Agent Activity & Compute Density Heatmap (D3.js)',
        subtitle: 'Visualize interactive task distribution, compute load, and token intensity across all agents.',
        icon: <Flame className="w-4 h-4 text-amber-400 fill-amber-400/20" />,
        badge: 'DENSITY HEATMAP',
        badgeColor: 'bg-purple-950/90 text-purple-300 border-purple-700/80',
        shortcutHint: 'H',
        onSelect: () => {
          openHeatmapModal();
          addToast({
            title: '🔥 Agent Activity Heatmap Opened',
            message: 'Displaying interactive compute load & task density matrix.',
            type: 'info'
          });
        }
      },
      {
        id: 'cmd-agent-config-matrix',
        category: 'actions',
        title: 'Configure Agent System Prompts & Parameters',
        subtitle: 'Edit system prompts, temperature settings, and model specifications.',
        icon: <Sliders className="w-4 h-4 text-purple-400" />,
        badge: 'CONFIG',
        badgeColor: 'bg-purple-950/90 text-purple-300 border-purple-700/80',
        shortcutHint: 'C',
        onSelect: () => {
          openAgentConfigModal();
          addToast({
            title: '⚙️ Agent Matrix Opened',
            message: 'Configure persona prompts and hyper-parameters.',
            type: 'info'
          });
        }
      },
      {
        id: 'cmd-wr-detail-modal',
        category: 'actions',
        title: 'Open Work Request Detail Popup Window',
        subtitle: 'Inspect intent specs, steps, tree topology, and produced artifacts.',
        icon: <FileText className="w-4 h-4 text-sky-400" />,
        badge: 'SPECS',
        badgeColor: 'bg-sky-950/90 text-sky-300 border-sky-700/80',
        shortcutHint: 'I',
        onSelect: () => {
          openWorkRequestDetailModal();
          addToast({
            title: '📋 Task Details Window',
            message: 'Displaying comprehensive work request specifications.',
            type: 'info'
          });
        }
      },
      {
        id: 'cmd-toggle-logs-drawer',
        category: 'actions',
        title: 'Toggle Agent Execution Log Drawer',
        subtitle: 'View live execution logs, filter by log level, and inspect detailed stack traces.',
        icon: <Activity className="w-4 h-4 text-amber-400" />,
        badge: 'DIAGNOSTICS',
        badgeColor: 'bg-amber-950/90 text-amber-300 border-amber-700/80',
        shortcutHint: 'L',
        onSelect: () => {
          selectAgentForLogs('a1');
          addToast({
            title: '📜 Execution Logs Drawer',
            message: 'Opened execution logs panel.',
            type: 'info'
          });
        }
      },
      {
        id: 'cmd-theme-steel',
        category: 'actions',
        title: 'Switch Workspace Theme: Steel Slate',
        subtitle: 'Cool slate gray workspace atmosphere designed for high-focus operations.',
        icon: <Shield className="w-4 h-4 text-blue-400" />,
        badge: 'THEME',
        badgeColor: 'bg-blue-950/90 text-blue-300 border-blue-800',
        onSelect: () => {
          setTheme('steel');
          addToast({ title: '🎨 Theme Updated', message: 'Switched to Steel theme.', type: 'info' });
        }
      },
      {
        id: 'cmd-theme-dark',
        category: 'actions',
        title: 'Switch Workspace Theme: Obsidian Dark',
        subtitle: 'Deep obsidian dark contrast canvas with glowing agent status tags.',
        icon: <Moon className="w-4 h-4 text-purple-400" />,
        badge: 'THEME',
        badgeColor: 'bg-purple-950/90 text-purple-300 border-purple-800',
        onSelect: () => {
          setTheme('dark');
          addToast({ title: '🎨 Theme Updated', message: 'Switched to Obsidian Dark theme.', type: 'info' });
        }
      },
      {
        id: 'cmd-theme-light',
        category: 'actions',
        title: 'Switch Workspace Theme: Light Operational Surface',
        subtitle: 'Clean, crisp light surface layout optimized for daytime viewing.',
        icon: <Sun className="w-4 h-4 text-amber-400" />,
        badge: 'THEME',
        badgeColor: 'bg-amber-950/90 text-amber-300 border-amber-800',
        onSelect: () => {
          setTheme('light');
          addToast({ title: '🎨 Theme Updated', message: 'Switched to Light theme.', type: 'info' });
        }
      },
      {
        id: 'cmd-shortcuts-help',
        category: 'actions',
        title: 'View Keyboard Hotkey Reference',
        subtitle: 'Inspect shortcut keys for quick system navigation.',
        icon: <Keyboard className="w-4 h-4 text-indigo-400" />,
        badge: 'HELP',
        badgeColor: 'bg-indigo-950/90 text-indigo-300 border-indigo-800',
        shortcutHint: '?',
        onSelect: () => {
          openShortcutsModal();
        }
      },
      {
        id: 'cmd-reset-storage',
        category: 'actions',
        title: 'Reset Workspace State & Re-seed Simulation',
        subtitle: 'Restore default work requests, initial agent logs, and mock file trees.',
        icon: <RefreshCw className="w-4 h-4 text-rose-400" />,
        badge: 'RESET',
        badgeColor: 'bg-rose-950/90 text-rose-300 border-rose-800',
        onSelect: () => {
          resetPersistedStorage();
          addToast({ title: '🧹 Workspace Reset', message: 'Restored initial simulation state.', type: 'warn' });
        }
      }
    ];

    systemActions.forEach(act => {
      const matchTitle = act.title.toLowerCase().includes(trimmed);
      const matchSub = act.subtitle.toLowerCase().includes(trimmed);
      const matchBadge = act.badge?.toLowerCase().includes(trimmed) || false;

      if (!trimmed || matchTitle || matchSub || matchBadge) {
        items.push(act);
      }
    });

    // -------------------------------------------------------------
    // 2. AGENTS (Logs & Configuration)
    // -------------------------------------------------------------
    activeAgents.forEach(agent => {
      const matchName = agent.name.toLowerCase().includes(trimmed);
      const matchRole = agent.role.toLowerCase().includes(trimmed);
      const matchFlavor = agent.flavor?.toLowerCase().includes(trimmed) || false;
      const matchId = agent.id.toLowerCase().includes(trimmed);

      if (!trimmed || matchName || matchRole || matchFlavor || matchId) {
        items.push({
          id: `agent-logs-${agent.id}`,
          category: 'agents',
          title: `Inspect Logs: ${agent.name}`,
          subtitle: `${agent.role} • Flavor: ${(agent.flavor || 'leased').toUpperCase()} • Activity: ${agent.status.toUpperCase()}`,
          icon: <Cpu className="w-4 h-4 text-blue-400" />,
          badge: 'AGENT LOGS',
          badgeColor: 'bg-blue-950/90 text-blue-300 border-blue-700/80',
          avatarUrl: agent.avatarUrl,
          onSelect: () => {
            selectAgentForLogs(agent.id);
            addToast({
              title: `📜 Agent Logs: ${agent.name}`,
              message: `Opened execution logs drawer for ${agent.name}.`,
              type: 'info',
              agentId: agent.id,
              agentName: agent.name
            });
          }
        });

        items.push({
          id: `agent-config-${agent.id}`,
          category: 'agents',
          title: `Configure Persona: ${agent.name}`,
          subtitle: `Edit System Prompt, Temp (${agent.temperature ?? 0.7}), Role Flavor & Settings`,
          icon: <Sliders className="w-4 h-4 text-purple-400" />,
          badge: 'AGENT CONFIG',
          badgeColor: 'bg-purple-950/90 text-purple-300 border-purple-700/80',
          avatarUrl: agent.avatarUrl,
          onSelect: () => {
            openAgentConfigModal(agent.id);
            addToast({
              title: `⚙️ Configure ${agent.name}`,
              message: `Opened configuration modal for ${agent.name}.`,
              type: 'info',
              agentId: agent.id,
              agentName: agent.name
            });
          }
        });
      }
    });

    // -------------------------------------------------------------
    // 3. WORK REQUESTS
    // -------------------------------------------------------------
    workRequests.forEach(wr => {
      const matchId = wr.id.toLowerCase().includes(trimmed);
      const matchIntent = wr.intent.toLowerCase().includes(trimmed);
      const matchStatus = wr.status.toLowerCase().includes(trimmed);

      if (!trimmed || matchId || matchIntent || matchStatus) {
        items.push({
          id: `wr-${wr.id}`,
          category: 'work_requests',
          title: `Switch Context to Work Request [${wr.id}]`,
          subtitle: `Intent: "${wr.intent}" • Status: ${wr.status}`,
          icon: <Target className="w-4 h-4 text-amber-400" />,
          badge: wr.status,
          badgeColor: wr.status === 'VALIDATE' ? 'bg-emerald-950/90 text-emerald-300 border-emerald-700/80' : 'bg-amber-950/90 text-amber-300 border-amber-700/80',
          onSelect: () => {
            BackendService.setActiveWorkRequest(wr);
            addToast({
              title: `📋 Context Switched`,
              message: `Active task set to ${wr.id}: "${wr.intent}"`,
              type: 'success'
            });
          }
        });
      }
    });

    // -------------------------------------------------------------
    // 4. EXECUTION & PLAN IR STEPS
    // -------------------------------------------------------------
    if (executionIR) {
      executionIR.steps.forEach(step => {
        const matchStepId = step.step_id.toLowerCase().includes(trimmed);
        const matchResult = step.result.toLowerCase().includes(trimmed);

        if (!trimmed || matchStepId || matchResult) {
          items.push({
            id: `exec-step-${step.step_id}`,
            category: 'execution_steps',
            title: `Execution Task Step #${step.step_id}`,
            subtitle: step.result,
            icon: <Activity className="w-4 h-4 text-teal-400" />,
            badge: step.status.toUpperCase(),
            badgeColor: step.status === 'success' ? 'bg-emerald-950/90 text-emerald-300 border-emerald-700' : 'bg-rose-950/90 text-rose-300 border-rose-700',
            onSelect: () => {
              addToast({
                title: `⚡ Execution Task #${step.step_id}`,
                message: `Result: ${step.result}`,
                type: step.status === 'success' ? 'success' : 'warn'
              });
            }
          });
        }
      });
    }

    if (planIR) {
      planIR.steps.forEach(step => {
        const matchId = step.id.toLowerCase().includes(trimmed);
        const matchName = step.name.toLowerCase().includes(trimmed);
        const matchDesc = step.description.toLowerCase().includes(trimmed);

        if (trimmed && (matchId || matchName || matchDesc)) {
          items.push({
            id: `plan-step-${step.id}`,
            category: 'execution_steps',
            title: `Plan Step #${step.id}: ${step.name}`,
            subtitle: `${step.description} • Risk: ${step.risk_level.toUpperCase()}`,
            icon: <Layers className="w-4 h-4 text-sky-400" />,
            badge: `RISK: ${step.risk_level.toUpperCase()}`,
            badgeColor: step.risk_level === 'high' ? 'bg-rose-950/90 text-rose-300 border-rose-700' : 'bg-gray-800 text-gray-300 border-gray-700',
            onSelect: () => {
              addToast({
                title: `📋 Plan Step #${step.id}`,
                message: `${step.name}: ${step.description}`,
                type: 'info'
              });
            }
          });
        }
      });
    }

    // -------------------------------------------------------------
    // 5. RECENT LOGS
    // -------------------------------------------------------------
    if (trimmed) {
      agentLogs.slice(0, 10).forEach(log => {
        const matchAction = log.action.toLowerCase().includes(trimmed);
        const matchDetails = log.details.toLowerCase().includes(trimmed);
        const matchAgentName = log.agentName.toLowerCase().includes(trimmed);

        if (matchAction || matchDetails || matchAgentName) {
          items.push({
            id: `log-${log.id}`,
            category: 'logs',
            title: `Log [${log.agentName}]: ${log.action}`,
            subtitle: `${log.details.slice(0, 80)}${log.details.length > 80 ? '...' : ''}`,
            icon: <FileText className="w-4 h-4 text-purple-400" />,
            badge: log.level.toUpperCase(),
            badgeColor: log.level === 'success' ? 'bg-emerald-950/90 text-emerald-300 border-emerald-700' :
                        log.level === 'error' ? 'bg-rose-950/90 text-rose-300 border-rose-700' :
                        log.level === 'warn' ? 'bg-amber-950/90 text-amber-300 border-amber-700' :
                        'bg-blue-950/90 text-blue-300 border-blue-700',
            onSelect: () => {
              selectAgentForLogs(log.agentId);
              addToast({
                title: `📜 Log Found: ${log.action}`,
                message: `[${log.agentName}] ${log.details}`,
                type: 'info',
                agentId: log.agentId,
                agentName: log.agentName
              });
            }
          });
        }
      });
    }

    // Filter by active category tab
    if (activeCategory === 'all') {
      return items;
    }
    return items.filter(item => item.category === activeCategory);
  }, [
    query, activeCategory, activeAgents, workRequests, planIR, executionIR, agentLogs, 
    selectAgentForLogs, openAgentConfigModal, openRoundtableModal, openDependencyGraphModal, 
    openWorkRequestDetailModal, openShortcutsModal, setTheme, resetPersistedStorage, addToast, BackendService
  ]);

  // Reset keyboard selection on query or tab change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, activeCategory]);

  // Keyboard navigation inside command palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || commandItems.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % commandItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + commandItems.length) % commandItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = commandItems[selectedIndex];
      if (selected) {
        selected.onSelect();
        setIsOpen(false);
      }
    }
  };

  const handleItemClick = (item: CommandItem) => {
    item.onSelect();
    setIsOpen(false);
  };

  // Compute category counts for tab badges
  const categoryCounts = useMemo(() => {
    return {
      all: commandItems.length,
      actions: commandItems.filter(i => i.category === 'actions').length,
      agents: commandItems.filter(i => i.category === 'agents').length,
      work_requests: commandItems.filter(i => i.category === 'work_requests').length,
      execution_steps: commandItems.filter(i => i.category === 'execution_steps').length,
      logs: commandItems.filter(i => i.category === 'logs').length,
    };
  }, [commandItems]);

  return (
    <>
      {/* TopBar Trigger Bar */}
      <div className="relative flex-1 max-w-md mx-2 font-sans">
        <button
          onClick={() => {
            setQuery('');
            setActiveCategory('all');
            setSelectedIndex(0);
            setIsOpen(true);
          }}
          className="w-full bg-gray-950/80 hover:bg-gray-900 border border-gray-700/80 hover:border-blue-500/60 text-gray-300 text-xs rounded-lg px-3 py-1.5 flex items-center justify-between transition-all shadow-inner group"
          title="Open Global Command Palette (Ctrl+K or Cmd+K)"
        >
          <div className="flex items-center space-x-2 text-gray-400 group-hover:text-gray-200">
            <Command className="w-3.5 h-3.5 text-blue-400" />
            <span className="truncate text-xs">Search actions, agents, tasks (e.g. 'Roundtable', 'Coder')...</span>
          </div>

          <div className="flex items-center space-x-1 shrink-0 ml-2">
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-gray-400 bg-gray-800/80 border border-gray-700 rounded shadow-sm group-hover:border-blue-500/50 group-hover:text-blue-300">
              ⌘K
            </kbd>
          </div>
        </button>
      </div>

      {/* Centered Command Palette Modal Overlay */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-gray-950/80 backdrop-blur-md">
            {/* Backdrop click dismiss */}
            <div 
              className="absolute inset-0" 
              onClick={() => setIsOpen(false)} 
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -10 }}
              transition={{ duration: 0.15 }}
              className="relative w-full max-w-2xl bg-gray-900 border border-gray-700/90 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] z-10 text-gray-100"
            >
              {/* Search Input Bar Header */}
              <div className="p-3 bg-gray-950/90 border-b border-gray-800 flex items-center space-x-3 shrink-0">
                <div className="p-2 rounded-lg bg-blue-950 border border-blue-800/80 text-blue-400 shrink-0">
                  <Command className="w-5 h-5" />
                </div>

                <div className="flex-1 relative flex items-center">
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a command, task, agent name, or shortcut..."
                    className="w-full bg-transparent text-gray-100 placeholder:text-gray-500 text-sm font-medium outline-none pr-8"
                  />
                  {query && (
                    <button
                      onClick={() => setQuery('')}
                      className="p-1 text-gray-400 hover:text-gray-200 rounded-full hover:bg-gray-800 transition-colors"
                      title="Clear text"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-colors shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Category Filter Tabs */}
              <div className="px-3 py-2 bg-gray-950/50 border-b border-gray-800/80 flex items-center space-x-1.5 overflow-x-auto text-xs font-medium scrollbar-none shrink-0">
                {(
                  [
                    { id: 'all', label: 'All Commands' },
                    { id: 'actions', label: 'Quick Actions' },
                    { id: 'agents', label: 'Agents' },
                    { id: 'work_requests', label: 'Work Requests' },
                    { id: 'execution_steps', label: 'Execution Steps' },
                    { id: 'logs', label: 'Logs' },
                  ] as const
                ).map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveCategory(tab.id)}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all shrink-0 flex items-center gap-1.5 border",
                      activeCategory === tab.id
                        ? "bg-blue-600/90 text-white border-blue-500 shadow-sm"
                        : "bg-gray-900/80 text-gray-400 border-gray-800 hover:text-gray-200 hover:bg-gray-800"
                    )}
                  >
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Command Items Results List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {commandItems.length === 0 ? (
                  <div className="py-12 text-center text-gray-500 flex flex-col items-center justify-center space-y-2">
                    <Search className="w-8 h-8 opacity-30 text-gray-400" />
                    <p className="text-sm font-medium">No commands or items found matching "{query}"</p>
                    <p className="text-xs text-gray-600">Try searching for 'Roundtable', 'Coder', 'wr-1', 'Theme', or 'Logs'.</p>
                  </div>
                ) : (
                  commandItems.map((item, idx) => {
                    const isSelected = idx === selectedIndex;
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleItemClick(item)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={cn(
                          "px-3.5 py-2.5 rounded-lg cursor-pointer flex items-center justify-between border transition-all text-xs group",
                          isSelected
                            ? "bg-blue-600/20 border-blue-500/80 text-gray-100 shadow-md translate-x-0.5"
                            : "bg-gray-950/40 border-gray-800/80 hover:bg-gray-800/50 hover:border-gray-700 text-gray-300"
                        )}
                      >
                        <div className="flex items-center space-x-3 overflow-hidden min-w-0 pr-2">
                          {item.avatarUrl ? (
                            <img
                              src={item.avatarUrl}
                              alt={item.title}
                              referrerPolicy="no-referrer"
                              className="w-7 h-7 rounded-full object-cover border border-blue-500/40 shrink-0"
                            />
                          ) : (
                            <div className={cn(
                              "p-2 rounded-lg border shrink-0 transition-colors",
                              isSelected 
                                ? "bg-blue-900 border-blue-500 text-blue-200" 
                                : "bg-gray-900 border-gray-800 text-gray-400"
                            )}>
                              {item.icon || <Sparkles className="w-4 h-4" />}
                            </div>
                          )}

                          <div className="truncate">
                            <div className="font-semibold text-gray-200 flex items-center space-x-2">
                              <span className={cn(isSelected && "text-blue-200 font-bold")}>{item.title}</span>
                            </div>
                            <div className="text-[11px] text-gray-400 truncate mt-0.5">{item.subtitle}</div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0 ml-2">
                          {item.badge && (
                            <span className={cn("px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider border", item.badgeColor)}>
                              {item.badge}
                            </span>
                          )}

                          {item.shortcutHint && (
                            <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-gray-400 bg-gray-900 border border-gray-700 rounded shadow-sm">
                              {item.shortcutHint}
                            </kbd>
                          )}

                          <div className={cn(
                            "p-1 rounded transition-colors",
                            isSelected ? "text-blue-400" : "text-gray-600 group-hover:text-gray-400"
                          )}>
                            <CornerDownLeft className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Command Palette Footer */}
              <div className="px-4 py-2.5 bg-gray-950 border-t border-gray-800 flex items-center justify-between text-[11px] text-gray-400 font-mono shrink-0">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center space-x-1">
                    <kbd className="px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded text-gray-300 font-bold">↑</kbd>
                    <kbd className="px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded text-gray-300 font-bold">↓</kbd>
                    <span>Navigate</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <kbd className="px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded text-gray-300 font-bold">↵</kbd>
                    <span>Run Command</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <kbd className="px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded text-gray-300 font-bold">ESC</kbd>
                    <span>Dismiss</span>
                  </span>
                </div>

                <div className="flex items-center space-x-2 text-gray-400 font-bold">
                  <Command className="w-3.5 h-3.5 text-blue-400" />
                  <span>Plurality Command Palette</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
