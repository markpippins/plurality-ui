import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useSimulation } from '../hooks/useSimulation';
import { 
  X, Trash2, Search, Terminal, Cpu, CheckCircle2, 
  AlertTriangle, Info, AlertCircle, ChevronDown, ChevronUp, Clock,
  Filter, Users, Shield, Zap, Database, Network,
  Calendar, Flame, Activity, RotateCcw, BarChart2, Grid, Sparkles,
  HeartPulse, Radio, Check, CircleDot, Copy, ArrowUpDown, 
  SlidersHorizontal, Tag, Maximize2, Minimize2, ArrowDown
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { AgentLogEntry, ActiveAgent } from '../types';
import avatarPlannerAlt from '../assets/images/avatar_planner_alt_1786462226175.jpg';
import avatarCoder from '../assets/images/avatar_coder_1786461737022.jpg';

function parseSafeDate(val: any): Date {
  if (!val) return new Date();
  const d = new Date(val);
  return isNaN(d.getTime()) ? new Date() : d;
}

export function AgentLogDrawer() {
  const { 
    selectedAgent, 
    activeAgents, 
    agentLogs, 
    selectAgentForLogs, 
    clearLogsForAgent,
    addToast,
    isDualityMode,
    dualityState
  } = useSimulation();

  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<'all' | 'info' | 'success' | 'warn' | 'error'>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | '15m' | '1h' | 'today' | '24h' | '7d'>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [agentStatusFilter, setAgentStatusFilter] = useState<'all' | 'active' | 'idle' | 'error' | 'waiting' | 'planning' | 'executing' | 'validating'>('all');
  const [agentSearch, setAgentSearch] = useState('');
  const [expandedLogIds, setExpandedLogIds] = useState<Record<string, boolean>>({});
  const [copiedLogId, setCopiedLogId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [showFilterBarDetails, setShowFilterBarDetails] = useState(false);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const logsContainerRef = useRef<HTMLDivElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut: '/' or 'Ctrl+F' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === '/' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f')) && 
          document.activeElement?.tagName !== 'INPUT' && 
          document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Heatmap state
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [heatmapViewMode, setHeatmapViewMode] = useState<'grid' | 'density'>('grid');
  const [hoveredDayKey, setHoveredDayKey] = useState<string | null>(null);
  const [hoveredSlotIndex, setHoveredSlotIndex] = useState<number | null>(null);

  // Filter logs for this agent with Duality trace/dialog expansion
  const agentSpecificLogs = useMemo(() => {
    if (!selectedAgent) return [];

    let baseLogs = agentLogs.filter(log => 
      log.agentId === selectedAgent.id || 
      (log.agentName && selectedAgent.name && log.agentName.toLowerCase() === selectedAgent.name.toLowerCase())
    );

    if (isDualityMode && dualityState) {
      const isPrimary = selectedAgent.id === (dualityState.primaryAgentId || 'a5') || 
        selectedAgent.name?.toLowerCase() === 'architect';
      const isSecondary = selectedAgent.id === (dualityState.secondaryAgentId || 'a3') || 
        selectedAgent.name?.toLowerCase() === 'builder' || 
        selectedAgent.name?.toLowerCase() === 'coder';

      if (isSecondary && dualityState.builderTrace && dualityState.builderTrace.length > 0) {
        const traceLogs: AgentLogEntry[] = dualityState.builderTrace.map(t => ({
          id: `trace-log-${t.id}`,
          agentId: selectedAgent.id,
          agentName: selectedAgent.name || 'Builder',
          timestamp: parseSafeDate(t.timestamp),
          level: t.status === 'error' ? 'error' : t.status === 'warning' ? 'warn' : t.status === 'running' ? 'info' : 'success',
          action: t.action || t.step || 'BUILDER_TRACE',
          details: t.details || `Executed builder step [${t.step}]. Tool: ${t.toolUsed || 'none'}`,
          metadata: {
            step: t.step,
            durationMs: t.durationMs,
            tokensUsed: t.tokensUsed,
            toolUsed: t.toolUsed
          }
        }));
        baseLogs = [...traceLogs, ...baseLogs];
      }

      if (dualityState.interAgentDialog && dualityState.interAgentDialog.length > 0) {
        const dialogLogs: AgentLogEntry[] = dualityState.interAgentDialog
          .filter(d => (isPrimary && (d.senderAgentId === 'a5' || d.senderName?.toLowerCase().includes('arch'))) ||
                       (isSecondary && (d.senderAgentId === 'a3' || d.senderName?.toLowerCase().includes('code') || d.senderName?.toLowerCase().includes('build'))))
          .map(d => ({
            id: `dialog-log-${d.id}`,
            agentId: selectedAgent.id,
            agentName: selectedAgent.name || (isPrimary ? 'Architect' : 'Builder'),
            timestamp: parseSafeDate(d.timestamp),
            level: d.status === 'rejected' ? 'error' : d.status === 'approved' ? 'success' : 'info',
            action: `INTER_AGENT_${(d.type || 'dialog').toUpperCase()}`,
            details: d.content || 'Inter-agent communication exchange.',
            metadata: {
              type: d.type,
              status: d.status,
              recipient: d.recipientName,
              codeSnippet: d.codeSnippet,
              diffSummary: d.diffSummary
            }
          }));
        baseLogs = [...dialogLogs, ...baseLogs];
      }
    }

    return baseLogs;
  }, [selectedAgent, agentLogs, isDualityMode, dualityState]);

  // Generate date entries for the past 7 days (rolling window)
  const past7Days = useMemo(() => {
    const result = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);

      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const key = `${year}-${month}-${day}`;

      const daysShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const dayName = i === 0 ? 'Today' : daysShort[d.getDay()];
      const dateLabel = `${monthsShort[d.getMonth()]} ${d.getDate()}`;
      const fullDateStr = d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });

      result.push({
        date: d,
        key,
        dayName,
        dateLabel,
        fullDateStr,
        isToday: i === 0
      });
    }
    return result;
  }, []);

  // Compute execution density statistics for the selected agent across past 7 days
  const heatmapStats = useMemo(() => {
    const dataByKey: Record<string, {
      total: number;
      slots: number[]; // [0: 00-06, 1: 06-12, 2: 12-18, 3: 18-24]
      hours: number[]; // 24 hours
      levels: { info: number; success: number; warn: number; error: number };
      actions: Record<string, number>;
    }> = {};

    past7Days.forEach(d => {
      dataByKey[d.key] = {
        total: 0,
        slots: [0, 0, 0, 0],
        hours: Array(24).fill(0),
        levels: { info: 0, success: 0, warn: 0, error: 0 },
        actions: {}
      };
    });

    agentSpecificLogs.forEach(log => {
      const logDate = parseSafeDate(log.timestamp);
      const year = logDate.getFullYear();
      const month = String(logDate.getMonth() + 1).padStart(2, '0');
      const day = String(logDate.getDate()).padStart(2, '0');
      const key = `${year}-${month}-${day}`;

      if (dataByKey[key]) {
        dataByKey[key].total += 1;

        const hour = logDate.getHours();
        if (hour >= 0 && hour < 24) {
          dataByKey[key].hours[hour] += 1;
        }

        const slot = Math.floor(hour / 6);
        if (slot >= 0 && slot < 4) {
          dataByKey[key].slots[slot] += 1;
        }

        if (log.level && log.level in dataByKey[key].levels) {
          dataByKey[key].levels[log.level as keyof typeof dataByKey[string]['levels']] += 1;
        }

        const act = log.action || 'ACTION';
        dataByKey[key].actions[act] = (dataByKey[key].actions[act] || 0) + 1;
      }
    });

    let total7DayLogs = 0;
    let activeDaysCount = 0;
    let maxCount = 0;
    let peakKey = '';

    Object.entries(dataByKey).forEach(([k, val]) => {
      total7DayLogs += val.total;
      if (val.total > 0) activeDaysCount += 1;
      if (val.total > maxCount) {
        maxCount = val.total;
        peakKey = k;
      }
    });

    return {
      dataByKey,
      total7DayLogs,
      activeDaysCount,
      peakKey,
      maxCount
    };
  }, [past7Days, agentSpecificLogs]);

  // Available agents based on mode
  const availableAgents = useMemo(() => {
    if (isDualityMode) {
      const primaryAgentId = dualityState?.primaryAgentId || 'a5';
      const secondaryAgentId = dualityState?.secondaryAgentId || 'a3';

      const primaryBase = activeAgents.find(a => a.id === primaryAgentId) || activeAgents.find(a => a.id === 'a5');
      const secondaryBase = activeAgents.find(a => a.id === secondaryAgentId) || activeAgents.find(a => a.id === 'a3');

      const primary: ActiveAgent = {
        id: primaryAgentId,
        name: 'Architect',
        role: dualityState?.primaryRole || 'System Architect',
        status: dualityState?.isExecuting ? 'working' : 'idle',
        flavor: 'harness',
        model: dualityState?.primaryModel || 'claude-3-7-sonnet',
        avatarUrl: primaryBase?.avatarUrl || avatarPlannerAlt,
        lastActive: new Date()
      };

      const secondary: ActiveAgent = {
        id: secondaryAgentId,
        name: 'Builder',
        role: dualityState?.secondaryRole || 'Implementation Builder',
        status: dualityState?.isExecuting ? 'working' : 'idle',
        flavor: 'leased',
        model: dualityState?.secondaryModel || 'qwen2.5-coder:latest',
        avatarUrl: secondaryBase?.avatarUrl || avatarCoder,
        lastActive: new Date()
      };

      return [primary, secondary];
    }
    return activeAgents;
  }, [isDualityMode, dualityState, activeAgents]);

  // Aggregate health status statistics across all active agents
  const agentHealthCounts = useMemo(() => {
    let active = 0;
    let idle = 0;
    let error = 0;
    let waiting = 0;

    availableAgents.forEach(ag => {
      const st = ag.status || 'idle';
      if (st === 'active' || st === 'working') {
        active++;
      } else if (st === 'error') {
        error++;
      } else if (st === 'waiting') {
        waiting++;
      } else {
        idle++;
      }
    });

    return { active, idle, error, waiting, total: availableAgents.length };
  }, [availableAgents]);

  // Aggregate action tags and frequencies for the selected agent
  const actionTags = useMemo(() => {
    const counts: Record<string, number> = {};
    agentSpecificLogs.forEach(log => {
      const act = log.action || 'ACTION';
      counts[act] = (counts[act] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count);
  }, [agentSpecificLogs]);

  // Real-time counts by severity level for the selected agent
  const levelCounts = useMemo(() => {
    const counts = { all: agentSpecificLogs.length, info: 0, success: 0, warn: 0, error: 0 };
    agentSpecificLogs.forEach(log => {
      if (log.level && log.level in counts) {
        counts[log.level as keyof typeof counts]++;
      }
    });
    return counts;
  }, [agentSpecificLogs]);
  
  // Robust search & multi-dimensional filtering
  const filteredLogs = useMemo(() => {
    const now = Date.now();

    const filtered = agentSpecificLogs.filter(log => {
      // 1. Severity Level Filter
      const matchesLevel = levelFilter === 'all' || log.level === levelFilter;
      if (!matchesLevel) return false;

      // 2. Action Category Filter
      const matchesAction = actionFilter === 'all' || 
        log.action.toLowerCase() === actionFilter.toLowerCase() ||
        log.action.toLowerCase().startsWith(actionFilter.toLowerCase());
      if (!matchesAction) return false;

      // 3. Time Window Filter
      if (timeFilter !== 'all') {
        const logTimeMs = new Date(log.timestamp).getTime();
        const diffMs = now - logTimeMs;
        if (timeFilter === '15m' && diffMs > 15 * 60 * 1000) return false;
        if (timeFilter === '1h' && diffMs > 60 * 60 * 1000) return false;
        if (timeFilter === '24h' && diffMs > 24 * 60 * 60 * 1000) return false;
        if (timeFilter === '7d' && diffMs > 7 * 24 * 60 * 60 * 1000) return false;
        if (timeFilter === 'today') {
          const logDate = new Date(log.timestamp);
          const today = new Date();
          if (logDate.toDateString() !== today.toDateString()) return false;
        }
      }

      // 4. Heatmap Selected Date Filter
      if (selectedDateKey) {
        const logDate = new Date(log.timestamp);
        const year = logDate.getFullYear();
        const month = String(logDate.getMonth() + 1).padStart(2, '0');
        const day = String(logDate.getDate()).padStart(2, '0');
        const key = `${year}-${month}-${day}`;
        if (key !== selectedDateKey) return false;
      }

      // 5. Keyword Search across Action, Details, and Metadata
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inAction = log.action.toLowerCase().includes(q);
        const inDetails = log.details.toLowerCase().includes(q);
        let inMeta = false;
        if (log.metadata) {
          try {
            const metaStr = JSON.stringify(log.metadata).toLowerCase();
            inMeta = metaStr.includes(q);
          } catch {
            inMeta = false;
          }
        }
        if (!inAction && !inDetails && !inMeta) return false;
      }

      return true;
    });

    // Sort order
    return filtered.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });
  }, [agentSpecificLogs, levelFilter, actionFilter, timeFilter, selectedDateKey, searchQuery, sortOrder]);

  // Helper to scroll the log container to newest log entries
  const scrollToNewestLogs = (smooth: boolean = true) => {
    if (!logsContainerRef.current) return;
    if (sortOrder === 'asc') {
      // In ascending order, newest logs are at the bottom
      logsContainerRef.current.scrollTo({
        top: logsContainerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      });
    } else {
      // In descending order, newest logs are at the top
      logsContainerRef.current.scrollTo({
        top: 0,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
  };

  // Auto-scroll when new log entries arrive if autoScroll is enabled
  useEffect(() => {
    if (autoScroll && logsContainerRef.current) {
      scrollToNewestLogs(true);
    }
  }, [agentSpecificLogs.length, filteredLogs.length, autoScroll, sortOrder]);

  // Helper to render keyword highlighting with high-visibility amber accent
  const renderHighlightedText = (text: string, query: string, customClassName?: string) => {
    if (!query || !query.trim() || !text) return <>{text}</>;
    const trimmed = query.trim();
    // Escape regex characters
    const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = text.split(regex);

    return (
      <>
        {parts.map((part, index) => 
          part.toLowerCase() === trimmed.toLowerCase() ? (
            <mark 
              key={index} 
              className={cn(
                "bg-amber-400/35 text-amber-100 font-bold border-b-2 border-amber-400 px-1 py-0.5 rounded-xs shadow-[0_0_8px_rgba(251,191,36,0.35)]",
                customClassName
              )}
            >
              {part}
            </mark>
          ) : (
            <span key={index}>{part}</span>
          )
        )}
      </>
    );
  };

  // Helper to render JSON metadata with syntax highlighting and search term highlights
  const renderHighlightedJson = (metadata: any, query: string) => {
    if (!metadata) return null;
    const jsonStr = JSON.stringify(metadata, null, 2);
    if (!query || !query.trim()) {
      return <span>{jsonStr}</span>;
    }

    const trimmed = query.trim();
    const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = jsonStr.split(regex);

    return (
      <>
        {parts.map((part, index) =>
          part.toLowerCase() === trimmed.toLowerCase() ? (
            <mark
              key={index}
              className="bg-amber-400/40 text-amber-100 font-bold border-b-2 border-amber-400 px-1 py-0.5 rounded-xs shadow-[0_0_10px_rgba(251,191,36,0.45)]"
            >
              {part}
            </mark>
          ) : (
            <span key={index}>{part}</span>
          )
        )}
      </>
    );
  };

  // Count search matches for a single log entry
  const getLogMatchCount = (log: AgentLogEntry, query: string) => {
    if (!query || !query.trim()) return 0;
    const trimmed = query.trim().toLowerCase();
    let count = 0;

    const countIn = (str: string) => {
      let pos = 0;
      const lower = str.toLowerCase();
      while ((pos = lower.indexOf(trimmed, pos)) !== -1) {
        count++;
        pos += trimmed.length;
      }
    };

    countIn(log.action || '');
    countIn(log.details || '');
    if (log.metadata) {
      try {
        countIn(JSON.stringify(log.metadata));
      } catch {
        // ignore
      }
    }
    return count;
  };

  // Check if search query matches inside metadata payload
  const hasMetadataMatch = (log: AgentLogEntry, query: string) => {
    if (!query || !query.trim() || !log.metadata) return false;
    try {
      return JSON.stringify(log.metadata).toLowerCase().includes(query.trim().toLowerCase());
    } catch {
      return false;
    }
  };

  // Compute total occurrences across all filtered logs
  const totalSearchOccurrences = useMemo(() => {
    if (!searchQuery.trim()) return 0;
    return filteredLogs.reduce((acc, log) => acc + getLogMatchCount(log, searchQuery), 0);
  }, [filteredLogs, searchQuery]);

  const handleCopyLog = (log: AgentLogEntry) => {
    navigator.clipboard.writeText(JSON.stringify(log, null, 2));
    setCopiedLogId(log.id);
    addToast({
      title: 'Log Entry Copied',
      message: `Copied ${log.action} (${log.level.toUpperCase()}) to clipboard`,
      type: 'info'
    });
    setTimeout(() => setCopiedLogId(null), 1800);
  };

  const handleCopyAllFilteredLogs = () => {
    if (filteredLogs.length === 0) return;
    navigator.clipboard.writeText(JSON.stringify(filteredLogs, null, 2));
    setCopiedAll(true);
    addToast({
      title: 'Logs Exported',
      message: `Copied ${filteredLogs.length} matching log entries to clipboard`,
      type: 'success'
    });
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleResetAllFilters = () => {
    setSearchQuery('');
    setLevelFilter('all');
    setActionFilter('all');
    setTimeFilter('all');
    setSelectedDateKey(null);
  };

  const toggleAllExpanded = () => {
    const willExpand = Object.keys(expandedLogIds).length !== filteredLogs.length;
    if (willExpand) {
      const allExpanded: Record<string, boolean> = {};
      filteredLogs.forEach(l => { allExpanded[l.id] = true; });
      setExpandedLogIds(allExpanded);
    } else {
      setExpandedLogIds({});
    }
  };

  const getAgentActivityState = (ag: ActiveAgent | null | undefined) => {
    if (!ag) return 'idle';
    if (ag.activityState) return ag.activityState;

    const normStatus = (ag.status || 'idle').toLowerCase();
    if (normStatus === 'error') return 'error';
    if (normStatus === 'waiting') return 'waiting';
    if (normStatus === 'idle') return 'idle';

    // For working/active status, determine fine-grained activity state based on role/name
    const roleLower = ((ag.role || '') + ' ' + (ag.name || '')).toLowerCase();
    if (roleLower.includes('plan') || roleLower.includes('arch') || roleLower.includes('topolog') || roleLower.includes('design')) {
      return 'planning';
    }
    if (roleLower.includes('crit') || roleLower.includes('valid') || roleLower.includes('test') || roleLower.includes('qa') || roleLower.includes('sec')) {
      return 'validating';
    }
    return 'executing';
  };

  /**
   * Colored Status Badge Renderer for Agent Health
   * Handles 'active', 'working', 'idle', 'error', 'waiting'
   */
  const renderAgentHealthBadge = (
    status: ActiveAgent['status'] | string, 
    options?: { 
      compact?: boolean; 
      showLabel?: boolean; 
      showDot?: boolean; 
      activityState?: string;
      withBorder?: boolean;
    }
  ) => {
    const { compact = false, showLabel = true, showDot = true, activityState, withBorder = true } = options || {};
    const normStatus = (status || 'idle').toLowerCase();
    const isActive = normStatus === 'active' || normStatus === 'working';
    const isError = normStatus === 'error';
    const isWaiting = normStatus === 'waiting';
    const isIdle = !isActive && !isError && !isWaiting;

    if (isActive) {
      return (
        <span 
          className={cn(
            "inline-flex items-center gap-1.5 font-mono uppercase font-bold rounded-full transition-all shrink-0 select-none",
            "bg-emerald-950/90 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.35)]",
            withBorder ? "border border-emerald-500/80" : "",
            compact ? "text-[8.5px] px-1.5 py-0.2" : "text-[10px] px-2 py-0.5"
          )}
          title="Health: Optimal / Active execution"
        >
          {showDot && (
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 shadow-xs" />
            </span>
          )}
          {showLabel && (
            <span className="tracking-wide">
              ACTIVE
              {activityState && activityState !== 'executing' && (
                <span className="opacity-80 font-normal ml-0.5 lowercase text-[8px]">
                  ({activityState})
                </span>
              )}
            </span>
          )}
        </span>
      );
    }

    if (isError) {
      return (
        <span 
          className={cn(
            "inline-flex items-center gap-1.5 font-mono uppercase font-bold rounded-full transition-all shrink-0 select-none animate-pulse",
            "bg-rose-950/95 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.4)]",
            withBorder ? "border border-rose-500/90" : "",
            compact ? "text-[8.5px] px-1.5 py-0.2" : "text-[10px] px-2 py-0.5"
          )}
          title="Health: Fault / Degraded state"
        >
          <AlertCircle className={cn(compact ? "w-2.5 h-2.5" : "w-3 h-3", "text-rose-400 shrink-0")} />
          {showLabel && <span className="tracking-wide">ERROR</span>}
        </span>
      );
    }

    if (isWaiting) {
      return (
        <span 
          className={cn(
            "inline-flex items-center gap-1.5 font-mono uppercase font-bold rounded-full transition-all shrink-0 select-none",
            "bg-amber-950/90 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.25)]",
            withBorder ? "border border-amber-500/80" : "",
            compact ? "text-[8.5px] px-1.5 py-0.2" : "text-[10px] px-2 py-0.5"
          )}
          title="Health: Blocked / Waiting on upstream task"
        >
          {showDot && (
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
            </span>
          )}
          {showLabel && <span className="tracking-wide">WAITING</span>}
        </span>
      );
    }

    // Default: IDLE / STANDBY
    return (
      <span 
        className={cn(
          "inline-flex items-center gap-1.5 font-mono uppercase font-medium rounded-full transition-all shrink-0 select-none",
          "bg-gray-900/90 text-gray-300",
          withBorder ? "border border-gray-700/80" : "",
          compact ? "text-[8.5px] px-1.5 py-0.2" : "text-[10px] px-2 py-0.5"
        )}
        title="Health: Standby / Ready for dispatch"
      >
        {showDot && <span className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />}
        {showLabel && <span className="tracking-wide text-gray-300">IDLE</span>}
      </span>
    );
  };

  const getAgentActivityIndicator = (ag: ActiveAgent, compact = false) => {
    const state = getAgentActivityState(ag);

    switch (state) {
      case 'planning':
        return (
          <span 
            className={cn(
              "inline-flex items-center gap-1 font-mono uppercase font-bold rounded-full border shadow-sm transition-all shrink-0",
              "bg-blue-950/90 text-blue-300 border-blue-500/80 shadow-[0_0_8px_rgba(59,130,246,0.35)]",
              compact ? "text-[8px] px-1.5 py-0.2" : "text-[9px] px-2 py-0.5"
            )}
            title={`Activity State: planning`}
          >
            <Sparkles className={cn(compact ? "w-2 h-2" : "w-2.5 h-2.5", "text-blue-400 animate-pulse shrink-0")} />
            <span>planning</span>
          </span>
        );
      case 'executing':
        return (
          <span 
            className={cn(
              "inline-flex items-center gap-1 font-mono uppercase font-bold rounded-full border shadow-sm transition-all shrink-0",
              "bg-emerald-950/90 text-emerald-300 border-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.35)]",
              compact ? "text-[8px] px-1.5 py-0.2" : "text-[9px] px-2 py-0.5"
            )}
            title={`Activity State: executing`}
          >
            <Zap className={cn(compact ? "w-2 h-2" : "w-2.5 h-2.5", "text-emerald-400 animate-bounce shrink-0")} />
            <span>executing</span>
          </span>
        );
      case 'validating':
        return (
          <span 
            className={cn(
              "inline-flex items-center gap-1 font-mono uppercase font-bold rounded-full border shadow-sm transition-all shrink-0",
              "bg-purple-950/90 text-purple-300 border-purple-500/80 shadow-[0_0_8px_rgba(168,85,247,0.35)]",
              compact ? "text-[8px] px-1.5 py-0.2" : "text-[9px] px-2 py-0.5"
            )}
            title={`Activity State: validating`}
          >
            <Activity className={cn(compact ? "w-2 h-2" : "w-2.5 h-2.5", "text-purple-400 animate-spin shrink-0")} />
            <span>validating</span>
          </span>
        );
      case 'waiting':
        return (
          <span 
            className={cn(
              "inline-flex items-center gap-1 font-mono uppercase font-bold rounded-full border shadow-sm transition-all shrink-0",
              "bg-amber-950/90 text-amber-300 border-amber-500/80 shadow-[0_0_8px_rgba(245,158,11,0.25)]",
              compact ? "text-[8px] px-1.5 py-0.2" : "text-[9px] px-2 py-0.5"
            )}
            title={`Activity State: waiting`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 animate-pulse" />
            <span>waiting</span>
          </span>
        );
      case 'error':
        return (
          <span 
            className={cn(
              "inline-flex items-center gap-1 font-mono uppercase font-bold rounded-full border shadow-sm transition-all shrink-0",
              "bg-rose-950/90 text-rose-300 border-rose-500/80 shadow-[0_0_8px_rgba(244,63,94,0.3)]",
              compact ? "text-[8px] px-1.5 py-0.2" : "text-[9px] px-2 py-0.5"
            )}
            title={`Activity State: error`}
          >
            <AlertCircle className={cn(compact ? "w-2 h-2" : "w-2.5 h-2.5", "text-rose-400 shrink-0")} />
            <span>error</span>
          </span>
        );
      case 'idle':
      default:
        return (
          <span 
            className={cn(
              "inline-flex items-center gap-1 font-mono uppercase font-medium rounded-full border transition-all shrink-0",
              "bg-gray-900/90 text-gray-400 border-gray-700/60",
              compact ? "text-[8px] px-1.5 py-0.2" : "text-[9px] px-2 py-0.5"
            )}
            title={`Activity State: idle`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-gray-500 shrink-0" />
            <span>idle</span>
          </span>
        );
    }
  };

  // Filtered agent directory for quick switching (sorted by role)
  const filteredListedAgents = [...availableAgents]
    .sort((a, b) => (a.role || '').localeCompare(b.role || '', undefined, { sensitivity: 'base' }))
    .filter(ag => {
      const actState = getAgentActivityState(ag);
      const normStatus = (ag.status || 'idle').toLowerCase();
      const isAct = normStatus === 'active' || normStatus === 'working';

      let matchesStatus = true;
      if (agentStatusFilter !== 'all') {
        if (agentStatusFilter === 'active') {
          matchesStatus = isAct;
        } else if (agentStatusFilter === 'idle') {
          matchesStatus = normStatus === 'idle';
        } else if (agentStatusFilter === 'error') {
          matchesStatus = normStatus === 'error';
        } else if (agentStatusFilter === 'waiting') {
          matchesStatus = normStatus === 'waiting';
        } else {
          matchesStatus = actState === agentStatusFilter;
        }
      }

      const matchesQuery = 
        (ag.name || '').toLowerCase().includes(agentSearch.toLowerCase()) ||
        (ag.role || '').toLowerCase().includes(agentSearch.toLowerCase()) ||
        actState.toLowerCase().includes(agentSearch.toLowerCase()) ||
        normStatus.toLowerCase().includes(agentSearch.toLowerCase());

      return matchesStatus && matchesQuery;
    });

  const toggleLogExpand = (id: string) => {
    setExpandedLogIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const slotNames = ['00-06 (Night)', '06-12 (Morning)', '12-18 (Afternoon)', '18-24 (Evening)'];

  const getSlotHeatColor = (count: number, isSelected: boolean) => {
    if (count === 0) {
      return isSelected
        ? "bg-purple-950/50 border-purple-500/70 text-purple-400"
        : "bg-gray-900/90 border-gray-800/80 text-gray-700 hover:border-gray-700";
    }
    if (count <= 2) {
      return isSelected
        ? "bg-emerald-950 text-emerald-300 border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.35)] font-semibold"
        : "bg-emerald-950/90 text-emerald-400 border-emerald-800/80 hover:border-emerald-600";
    }
    if (count <= 5) {
      return isSelected
        ? "bg-emerald-800 text-emerald-100 border-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.5)] font-bold"
        : "bg-emerald-900/90 text-emerald-300 border-emerald-700/80 hover:border-emerald-500";
    }
    if (count <= 8) {
      return isSelected
        ? "bg-emerald-600 text-white border-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.75)] font-extrabold"
        : "bg-emerald-700 text-emerald-100 border-emerald-500 hover:border-emerald-400";
    }
    return isSelected
      ? "bg-emerald-400 text-gray-950 border-white shadow-[0_0_16px_rgba(52,211,153,0.95)] font-extrabold"
      : "bg-emerald-500 text-gray-950 border-emerald-300 font-bold hover:bg-emerald-400";
  };

  const getLevelBadge = (level: AgentLogEntry['level']) => {
    switch (level) {
      case 'success':
        return <span className="bg-green-950/80 text-green-400 border border-green-800/60 px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-semibold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> SUCCESS</span>;
      case 'warn':
        return <span className="bg-yellow-950/80 text-yellow-400 border border-yellow-800/60 px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-semibold flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> WARN</span>;
      case 'error':
        return <span className="bg-rose-950/80 text-rose-400 border border-rose-800/60 px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-semibold flex items-center gap-1"><AlertCircle className="w-3 h-3" /> ERROR</span>;
      case 'info':
      default:
        return <span className="bg-blue-950/80 text-blue-400 border border-blue-800/60 px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-semibold flex items-center gap-1"><Info className="w-3 h-3" /> INFO</span>;
    }
  };

  return (
    <AnimatePresence>
      {selectedAgent && (
        <motion.div 
          key={selectedAgent.id}
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed top-14 right-0 bottom-0 w-[480px] max-w-[94vw] bg-gray-950/95 backdrop-blur-md border-l border-gray-800 shadow-2xl flex flex-col z-50 font-sans"
        >
        {/* Top Header - Selected Agent Info */}
        <div className="p-4 border-b border-gray-800 bg-gray-900/90 flex flex-col space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative shrink-0">
                {(selectedAgent.status === 'working' || selectedAgent.status === 'active') && (
                  <span className="absolute -inset-1 rounded-full bg-emerald-500/40 animate-ping opacity-75 pointer-events-none" />
                )}
                {selectedAgent.avatarUrl ? (
                  <img 
                    src={selectedAgent.avatarUrl} 
                    alt={`${selectedAgent.name} Avatar`} 
                    referrerPolicy="no-referrer"
                    className={cn(
                      "w-11 h-11 rounded-full object-cover border-2 shadow-md shrink-0 transition-all relative z-10",
                      selectedAgent.status === 'working' || selectedAgent.status === 'active'
                        ? "border-emerald-400 shadow-[0_0_16px_rgba(16,185,129,0.5)] animate-pulse"
                        : selectedAgent.status === 'error'
                        ? "border-rose-500 shadow-[0_0_14px_rgba(244,63,94,0.4)] ring-2 ring-rose-500/50"
                        : selectedAgent.status === 'waiting'
                        ? "border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                        : "border-blue-500/50"
                    )}
                  />
                ) : (
                  <div className="p-2.5 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 relative z-10">
                    <Cpu className="w-6 h-6" />
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-base font-bold text-gray-100 flex items-center gap-1.5">
                    <span>{selectedAgent.name}</span>
                    {getAgentActivityIndicator(selectedAgent)}
                  </h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-gray-800 text-gray-300 rounded border border-gray-700">
                    {selectedAgent.role}
                  </span>
                </div>

                <div className="flex items-center space-x-2 mt-1 flex-wrap gap-y-1">
                  {/* Visual Status Badge with colored state (Active, Idle, Error, Waiting) */}
                  {renderAgentHealthBadge(selectedAgent.status, {
                    activityState: getAgentActivityState(selectedAgent)
                  })}

                  {/* Flavor Badge */}
                  <span className={cn(
                    "text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold uppercase border",
                    selectedAgent.flavor === 'harness'
                      ? "bg-amber-950/80 text-amber-300 border-amber-800/80"
                      : "bg-blue-950/80 text-blue-300 border-blue-800/80"
                  )}>
                    {selectedAgent.flavor || 'leased'}
                  </span>

                  {selectedAgent.model && (
                    <span className="text-[10px] font-mono text-gray-500 truncate max-w-[120px]">
                      {selectedAgent.model}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0 ml-2">
              {/* Auto-scroll Toggle Switch in Header */}
              <div 
                className={cn(
                  "flex items-center space-x-2 px-2.5 py-1 rounded-lg border transition-all select-none",
                  autoScroll 
                    ? "bg-emerald-950/60 border-emerald-700/80 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.15)]" 
                    : "bg-gray-950/80 border-gray-800 text-gray-400 hover:border-gray-700"
                )}
                title={autoScroll ? "Auto-scroll to bottom is ENABLED (Click to disable auto-scrolling)" : "Auto-scroll to bottom is DISABLED (Click to enable auto-scrolling)"}
              >
                <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => setAutoScroll(prev => !prev)}>
                  <span className={cn(
                    "w-2 h-2 rounded-full transition-all shrink-0",
                    autoScroll 
                      ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse" 
                      : "bg-gray-600"
                  )} />
                  <span className="text-[11px] font-mono font-medium hidden sm:inline-block">
                    Auto-scroll
                  </span>
                </div>

                <button
                  id="agent-logs-autoscroll-toggle"
                  type="button"
                  role="switch"
                  aria-checked={autoScroll}
                  aria-label="Toggle auto-scroll to bottom when new log entries arrive"
                  onClick={() => {
                    setAutoScroll(prev => {
                      const nextVal = !prev;
                      addToast({
                        title: nextVal ? 'Auto-scroll Enabled' : 'Auto-scroll Disabled',
                        message: nextVal 
                          ? 'Log drawer will automatically follow and scroll to new entries' 
                          : 'Auto-scroll paused — log view stays at current position',
                        type: 'info'
                      });
                      return nextVal;
                    });
                  }}
                  className={cn(
                    "relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-emerald-400",
                    autoScroll ? "bg-emerald-500" : "bg-gray-700 hover:bg-gray-600"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
                      autoScroll ? "translate-x-3" : "translate-x-0"
                    )}
                  />
                </button>
              </div>

              <button 
                onClick={() => selectAgentForLogs(null)}
                className="p-1.5 hover:bg-gray-800 rounded-md text-gray-400 hover:text-gray-200 transition-colors"
                title="Close Drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Agent Switcher Grid / Directory with Colored Health Badges */}
          <div className="space-y-2 pt-1 border-t border-gray-800/60">
            <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono">
              <span className="flex items-center gap-1.5 text-gray-300 font-semibold">
                <Users className="w-3.5 h-3.5 text-purple-400" />
                Agent Health Roster ({activeAgents.length})
              </span>
              
              {/* Agent Health Summary Quick Filters */}
              <div className="flex items-center space-x-1 text-[9px] overflow-x-auto py-0.5 scrollbar-none">
                <button
                  onClick={() => setAgentStatusFilter('all')}
                  className={cn(
                    "px-1.5 py-0.2 rounded uppercase font-bold transition-all shrink-0",
                    agentStatusFilter === 'all'
                      ? "bg-purple-900 text-purple-200 border border-purple-700"
                      : "text-gray-500 hover:text-gray-300 hover:bg-gray-850"
                  )}
                >
                  All ({agentHealthCounts.total})
                </button>

                <button
                  onClick={() => setAgentStatusFilter('active')}
                  className={cn(
                    "px-1.5 py-0.2 rounded uppercase font-bold transition-all shrink-0 flex items-center gap-1",
                    agentStatusFilter === 'active'
                      ? "bg-emerald-900 text-emerald-200 border border-emerald-600 shadow-xs"
                      : "text-emerald-400 hover:bg-emerald-950/60"
                  )}
                  title="Filter Active Agents"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>Active ({agentHealthCounts.active})</span>
                </button>

                <button
                  onClick={() => setAgentStatusFilter('idle')}
                  className={cn(
                    "px-1.5 py-0.2 rounded uppercase font-bold transition-all shrink-0 flex items-center gap-1",
                    agentStatusFilter === 'idle'
                      ? "bg-gray-700 text-gray-100 border border-gray-500"
                      : "text-gray-400 hover:bg-gray-800"
                  )}
                  title="Filter Idle Agents"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                  <span>Idle ({agentHealthCounts.idle})</span>
                </button>

                {agentHealthCounts.error > 0 && (
                  <button
                    onClick={() => setAgentStatusFilter('error')}
                    className={cn(
                      "px-1.5 py-0.2 rounded uppercase font-bold transition-all shrink-0 flex items-center gap-1",
                      agentStatusFilter === 'error'
                        ? "bg-rose-900 text-rose-200 border border-rose-600 shadow-xs"
                        : "text-rose-400 hover:bg-rose-950/60"
                    )}
                    title="Filter Error State Agents"
                  >
                    <AlertCircle className="w-2.5 h-2.5 text-rose-400" />
                    <span>Error ({agentHealthCounts.error})</span>
                  </button>
                )}

                {agentHealthCounts.waiting > 0 && (
                  <button
                    onClick={() => setAgentStatusFilter('waiting')}
                    className={cn(
                      "px-1.5 py-0.2 rounded uppercase font-bold transition-all shrink-0 flex items-center gap-1",
                      agentStatusFilter === 'waiting'
                        ? "bg-amber-900 text-amber-200 border border-amber-600"
                        : "text-amber-400 hover:bg-amber-950/60"
                    )}
                    title="Filter Waiting Agents"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>Waiting ({agentHealthCounts.waiting})</span>
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable Agent List with prominent Colored Status Badges */}
            <div className="max-h-36 overflow-y-auto pr-1 space-y-1 scrollbar-thin scrollbar-thumb-gray-800">
              {filteredListedAgents.map(ag => {
                const isSelected = selectedAgent.id === ag.id;
                const isExecuting = ag.status === 'working' || ag.status === 'active';
                const isError = ag.status === 'error';
                const isWaiting = ag.status === 'waiting';
                const agentLogsCount = agentLogs.filter(l => l.agentId === ag.id).length;
                const activityState = getAgentActivityState(ag);

                return (
                  <button
                    key={ag.id}
                    onClick={() => {
                      selectAgentForLogs(ag.id);
                      setSelectedDateKey(null);
                    }}
                    className={cn(
                      "w-full p-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-between border text-left relative overflow-hidden group",
                      isError
                        ? isSelected
                          ? "bg-rose-950/90 border-rose-500 text-rose-100 shadow-[0_0_12px_rgba(244,63,94,0.35)]"
                          : "bg-rose-950/30 border-rose-800/80 text-rose-200 hover:bg-rose-900/40 hover:border-rose-600"
                        : isExecuting
                        ? isSelected
                          ? "bg-purple-950/80 border-emerald-400 text-purple-100 shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                          : "bg-emerald-950/40 border-emerald-500/80 text-emerald-100 hover:bg-emerald-900/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                        : isWaiting
                        ? isSelected
                          ? "bg-amber-950/80 border-amber-400 text-amber-100"
                          : "bg-amber-950/30 border-amber-800/80 text-amber-200 hover:bg-amber-900/40"
                        : isSelected 
                        ? "bg-purple-950/70 border-purple-500/80 text-purple-100 shadow-md" 
                        : "bg-gray-950/80 border-gray-800/80 text-gray-300 hover:bg-gray-900 hover:border-gray-700"
                    )}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0 z-10">
                      <div className="relative shrink-0">
                        {isExecuting && (
                          <span className="absolute -inset-0.5 rounded-full bg-emerald-400 animate-ping opacity-75" />
                        )}
                        {isError && (
                          <span className="absolute -inset-0.5 rounded-full bg-rose-500 animate-pulse opacity-75" />
                        )}
                        {ag.avatarUrl ? (
                          <img 
                            src={ag.avatarUrl} 
                            alt={ag.name} 
                            referrerPolicy="no-referrer"
                            className={cn(
                              "w-5 h-5 rounded-full object-cover shrink-0 relative z-10",
                              isExecuting ? "border-2 border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]" : 
                              isError ? "border-2 border-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" :
                              isWaiting ? "border border-amber-400" :
                              "border border-gray-700"
                            )} 
                          />
                        ) : (
                          <Cpu className="w-4 h-4 text-gray-400 shrink-0 relative z-10" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center space-x-1.5 flex-wrap gap-y-0.5">
                          <span className={cn(
                            "font-bold truncate",
                            isExecuting ? "text-emerald-200" :
                            isError ? "text-rose-200" :
                            isWaiting ? "text-amber-200" :
                            "text-gray-100"
                          )}>
                            {ag.name}
                          </span>
                          <span className="text-[10px] font-mono text-gray-400 truncate">({ag.role})</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Side: Colored Status Badge + Log Counter */}
                    <div className="flex items-center space-x-1.5 shrink-0 z-10">
                      {/* Colored Status Badge for every single agent */}
                      {renderAgentHealthBadge(ag.status, {
                        compact: true,
                        activityState: activityState
                      })}

                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-gray-900 text-gray-400 border border-gray-800 hidden sm:inline-block">
                        {agentLogsCount} logs
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Calendar Activity Heatmap Section (Past 7 Days) */}
        <div className="border-b border-gray-800 bg-gray-900/60 p-3 flex flex-col space-y-2 shrink-0">
          {/* Heatmap Section Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-md bg-emerald-950/80 border border-emerald-800/80 text-emerald-400">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-xs font-bold text-gray-200 font-mono flex items-center gap-1.5">
                    7-Day Activity Heatmap
                  </h3>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[9px] font-mono font-bold">
                    {heatmapStats.total7DayLogs} executions
                  </span>
                </div>
                <p className="text-[10px] text-gray-400">
                  Execution density for <strong className="text-gray-300">{selectedAgent.name}</strong> ({heatmapStats.activeDaysCount}/7 active days)
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => setHeatmapViewMode(m => m === 'grid' ? 'density' : 'grid')}
                className={cn(
                  "p-1 rounded text-[10px] font-mono border transition-colors flex items-center gap-1 px-1.5",
                  heatmapViewMode === 'density' 
                    ? "bg-purple-900/80 text-purple-200 border-purple-700" 
                    : "bg-gray-800 text-gray-400 border-gray-700 hover:text-gray-200"
                )}
                title="Toggle Matrix vs Hourly Curve"
              >
                {heatmapViewMode === 'grid' ? <Grid className="w-3 h-3" /> : <BarChart2 className="w-3 h-3" />}
                <span className="uppercase text-[9px] font-bold">{heatmapViewMode === 'grid' ? 'Grid' : 'Curve'}</span>
              </button>

              <button
                onClick={() => setShowHeatmap(!showHeatmap)}
                className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-gray-200 transition-colors"
                title={showHeatmap ? 'Collapse Heatmap' : 'Expand Heatmap'}
              >
                {showHeatmap ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Expanded Heatmap Visual Content */}
          {showHeatmap && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2 pt-1"
            >
              {/* Filter notification bar when date is selected */}
              {selectedDateKey && (
                <div className="flex items-center justify-between px-2.5 py-1 bg-purple-950/80 border border-purple-500/60 rounded text-[10px] font-mono text-purple-200 shadow-sm">
                  <div className="flex items-center space-x-1.5 min-w-0">
                    <Calendar className="w-3 h-3 text-purple-400 shrink-0" />
                    <span className="truncate">
                      Filtered: <strong className="text-purple-100">{past7Days.find(d => d.key === selectedDateKey)?.fullDateStr || selectedDateKey}</strong>
                    </span>
                    <span className="bg-purple-900 text-purple-200 px-1.5 py-0.2 rounded text-[9px] border border-purple-700 shrink-0">
                      {heatmapStats.dataByKey[selectedDateKey]?.total || 0} logs
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedDateKey(null)}
                    className="text-purple-300 hover:text-white ml-2 p-0.5 rounded hover:bg-purple-900/60 transition-colors shrink-0 flex items-center gap-1 font-semibold text-[9px]"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                </div>
              )}

              {/* View Mode 1: Calendar 7-Day Grid Matrix */}
              {heatmapViewMode === 'grid' ? (
                <div className="grid grid-cols-7 gap-1.5">
                  {past7Days.map(day => {
                    const stats = heatmapStats.dataByKey[day.key] || { total: 0, slots: [0,0,0,0], levels: { info:0, success:0, warn:0, error:0 }, actions: {} };
                    const isSelected = selectedDateKey === day.key;
                    const isHovered = hoveredDayKey === day.key;

                    return (
                      <div 
                        key={day.key}
                        className="relative flex flex-col items-center"
                        onMouseEnter={() => setHoveredDayKey(day.key)}
                        onMouseLeave={() => { setHoveredDayKey(null); setHoveredSlotIndex(null); }}
                      >
                        {/* Day Header Label */}
                        <div className="text-center mb-1">
                          <div className={cn("text-[10px] font-mono font-bold leading-none", day.isToday ? "text-purple-400" : "text-gray-300")}>
                            {day.dayName}
                          </div>
                          <div className="text-[8px] font-mono text-gray-500 mt-0.5">
                            {day.dateLabel}
                          </div>
                        </div>

                        {/* Interactive Day Density Card & 4 Time Slots */}
                        <button
                          onClick={() => setSelectedDateKey(isSelected ? null : day.key)}
                          className={cn(
                            "w-full p-1 rounded-md border flex flex-col items-center space-y-1 transition-all cursor-pointer group relative overflow-hidden",
                            isSelected
                              ? "bg-purple-950/90 border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.4)] ring-1 ring-purple-400"
                              : stats.total > 0
                              ? "bg-gray-900/90 border-gray-800 hover:border-emerald-500/80 hover:bg-gray-850"
                              : "bg-gray-950/60 border-gray-800/60 opacity-60 hover:opacity-100 hover:border-gray-700"
                          )}
                        >
                          {/* 4 Time Slots Mini-Matrix (00-06, 06-12, 12-18, 18-24) */}
                          <div className="grid grid-cols-2 gap-0.5 w-full">
                            {stats.slots.map((slotCount, slotIdx) => (
                              <div
                                key={slotIdx}
                                onMouseEnter={(e) => {
                                  e.stopPropagation();
                                  setHoveredSlotIndex(slotIdx);
                                }}
                                className={cn(
                                  "h-3.5 rounded-[2px] border text-[8px] font-mono font-bold flex items-center justify-center transition-all",
                                  getSlotHeatColor(slotCount, isSelected)
                                )}
                                title={`${slotNames[slotIdx]}: ${slotCount} executions`}
                              >
                                {slotCount > 0 ? slotCount : ''}
                              </div>
                            ))}
                          </div>

                          {/* Day Total Count Pill */}
                          <div className={cn(
                            "text-[9px] font-mono px-1 py-0.2 rounded-full font-bold transition-all border w-full text-center truncate",
                            stats.total === 0 
                              ? "bg-gray-950 text-gray-600 border-gray-800"
                              : isSelected
                              ? "bg-purple-900 text-purple-100 border-purple-500 font-extrabold"
                              : "bg-emerald-950 text-emerald-300 border-emerald-800"
                          )}>
                            {stats.total} {stats.total === 1 ? 'log' : 'logs'}
                          </div>
                        </button>

                        {/* Popover Tooltip on Hover */}
                        {isHovered && (
                          <div className="absolute top-full mt-1.5 z-30 w-44 bg-gray-900/95 border border-purple-500/60 rounded-lg p-2 shadow-2xl backdrop-blur-md text-[10px] font-mono text-gray-200 pointer-events-none animate-fadeIn">
                            <div className="font-bold text-purple-300 border-b border-gray-800 pb-1 mb-1 flex items-center justify-between">
                              <span>{day.fullDateStr}</span>
                              {day.isToday && <span className="text-[8px] bg-purple-950 text-purple-300 px-1 rounded border border-purple-700">TODAY</span>}
                            </div>
                            <div className="space-y-0.5 text-[9px] text-gray-300">
                              <div className="flex justify-between">
                                <span className="text-gray-400">Total Executions:</span>
                                <strong className="text-emerald-400">{stats.total}</strong>
                              </div>
                              {hoveredSlotIndex !== null && (
                                <div className="flex justify-between text-purple-300 border-t border-gray-800/60 pt-0.5 mt-0.5">
                                  <span>{slotNames[hoveredSlotIndex]}:</span>
                                  <strong>{stats.slots[hoveredSlotIndex]} logs</strong>
                                </div>
                              )}
                              <div className="flex justify-between pt-0.5 text-[8px] text-gray-400">
                                <span>Success/Info:</span>
                                <span className="text-green-400">{stats.levels.success + stats.levels.info}</span>
                              </div>
                              <div className="flex justify-between text-[8px] text-gray-400">
                                <span>Warn/Error:</span>
                                <span className="text-amber-400">{stats.levels.warn + stats.levels.error}</span>
                              </div>
                            </div>
                            <div className="mt-1 pt-1 border-t border-gray-800 text-[8px] text-purple-400 italic text-center">
                              Click block to filter logs
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* View Mode 2: 24-Hour Intensity Curve View */
                <div className="space-y-1.5 bg-black/40 p-2 rounded-lg border border-gray-800 font-mono">
                  <div className="flex justify-between text-[9px] text-gray-400 border-b border-gray-800 pb-1">
                    <span>24-Hour Combined Execution Curve (Past 7 Days)</span>
                    <span className="text-emerald-400 font-bold">{heatmapStats.total7DayLogs} total logs</span>
                  </div>
                  <div className="h-16 flex items-end gap-1 pt-2">
                    {Array.from({ length: 24 }).map((_, hr) => {
                      // Sum across all 7 days for this hour
                      const hrTotal = past7Days.reduce((acc, d) => {
                        return acc + (heatmapStats.dataByKey[d.key]?.hours[hr] || 0);
                      }, 0);

                      const maxHr = Math.max(1, ...past7Days.flatMap(d => heatmapStats.dataByKey[d.key]?.hours || []));
                      const pct = Math.min(100, Math.max(8, (hrTotal / maxHr) * 100));

                      return (
                        <div 
                          key={hr}
                          className="flex-1 flex flex-col items-center group relative"
                        >
                          <div 
                            style={{ height: `${pct}%` }}
                            className={cn(
                              "w-full rounded-t transition-all",
                              hrTotal === 0 ? "bg-gray-800/40" : hrTotal <= 2 ? "bg-emerald-800/80" : "bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.6)]"
                            )}
                          />
                          <span className="text-[7px] text-gray-600 mt-0.5 group-hover:text-gray-300">
                            {hr % 6 === 0 ? `${hr}h` : ''}
                          </span>

                          <div className="absolute bottom-full mb-1 hidden group-hover:block z-20 bg-gray-900 border border-purple-500 text-[9px] text-purple-200 px-1.5 py-0.5 rounded whitespace-nowrap shadow-lg">
                            {hr}:00 - {hr}:59 ➔ {hrTotal} logs
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Heatmap Legend & Summary Footnote */}
              <div className="flex items-center justify-between text-[9px] text-gray-400 font-mono pt-1">
                <div className="flex items-center space-x-1">
                  <span>Less</span>
                  <div className="w-2.5 h-2.5 rounded-[1px] bg-gray-900 border border-gray-800" title="0 logs" />
                  <div className="w-2.5 h-2.5 rounded-[1px] bg-emerald-950 border border-emerald-800" title="1-2 logs" />
                  <div className="w-2.5 h-2.5 rounded-[1px] bg-emerald-800 border border-emerald-600" title="3-5 logs" />
                  <div className="w-2.5 h-2.5 rounded-[1px] bg-emerald-600 border border-emerald-400" title="6-8 logs" />
                  <div className="w-2.5 h-2.5 rounded-[1px] bg-emerald-400 border border-white" title="9+ logs" />
                  <span>More</span>
                </div>

                <div className="flex items-center space-x-2 text-gray-400">
                  <span>Peak: <strong className="text-emerald-400">{heatmapStats.maxCount} logs/day</strong></span>
                  {selectedDateKey && (
                    <button 
                      onClick={() => setSelectedDateKey(null)}
                      className="text-purple-400 hover:text-purple-300 underline font-semibold"
                    >
                      Show All
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Search & Multi-Criteria Filter Bar */}
        <div className="p-3 border-b border-gray-800/90 bg-gray-900/60 flex flex-col space-y-2.5 text-xs shrink-0 backdrop-blur-xs">
          {/* Main Search Input & Primary Actions */}
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 group">
              <Search className="w-3.5 h-3.5 text-gray-500 group-focus-within:text-purple-400 absolute left-2.5 top-2.5 transition-colors" />
              <input 
                ref={searchInputRef}
                type="text" 
                placeholder={`Search actions, details, metadata (e.g. "TASK", "API", "error")...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-950/80 border border-gray-800 rounded-md pl-8 pr-28 py-1.5 text-gray-200 text-xs placeholder:text-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition-all font-mono"
              />
              
              <div className="absolute right-2 top-1.5 flex items-center space-x-1.5">
                {searchQuery ? (
                  <>
                    <span className="text-[10px] font-mono text-amber-300 bg-amber-950/80 border border-amber-800/80 px-1.5 py-0.2 rounded shadow-xs">
                      {totalSearchOccurrences} {totalSearchOccurrences === 1 ? 'match' : 'matches'}
                    </span>
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="p-1 text-gray-500 hover:text-gray-300 rounded hover:bg-gray-800 transition-colors"
                      title="Clear search query"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono text-gray-400 bg-gray-900 border border-gray-800 rounded shadow-xs pointer-events-none">
                    /
                  </kbd>
                )}
              </div>
            </div>

            {/* Quick Actions Menu */}
            <div className="flex items-center space-x-1 shrink-0">
              {/* Sort Order Toggle */}
              <button
                onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                className={cn(
                  "p-1.5 border rounded transition-colors text-xs flex items-center gap-1",
                  sortOrder === 'asc' 
                    ? "bg-purple-950/60 border-purple-800/80 text-purple-300" 
                    : "bg-gray-900 border-gray-800 hover:bg-gray-800 text-gray-400 hover:text-gray-200"
                )}
                title={sortOrder === 'desc' ? "Sorted Newest First (Click for Oldest First)" : "Sorted Oldest First (Click for Newest First)"}
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
              </button>

              {/* Expand / Collapse All Payloads */}
              <button
                onClick={toggleAllExpanded}
                className="p-1.5 border border-gray-800 bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-gray-200 rounded transition-colors"
                title={Object.keys(expandedLogIds).length > 0 ? "Collapse all payloads" : "Expand all payloads"}
              >
                {Object.keys(expandedLogIds).length > 0 ? (
                  <Minimize2 className="w-3.5 h-3.5" />
                ) : (
                  <Maximize2 className="w-3.5 h-3.5" />
                )}
              </button>

              {/* Copy All Filtered Logs */}
              <button
                onClick={handleCopyAllFilteredLogs}
                disabled={filteredLogs.length === 0}
                className={cn(
                  "p-1.5 border rounded transition-colors",
                  copiedAll 
                    ? "bg-emerald-950/80 border-emerald-700 text-emerald-300" 
                    : "border-gray-800 bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
                )}
                title="Copy filtered logs to clipboard as JSON"
              >
                {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              {/* Toggle Advanced Filters Drawer */}
              <button
                onClick={() => setShowFilterBarDetails(prev => !prev)}
                className={cn(
                  "p-1.5 border rounded transition-colors",
                  showFilterBarDetails || actionFilter !== 'all' || timeFilter !== 'all'
                    ? "bg-purple-950/70 border-purple-700 text-purple-300"
                    : "border-gray-800 bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-gray-200"
                )}
                title="Toggle Action & Time filters"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>

              {/* Clear Agent Logs */}
              <button
                onClick={() => clearLogsForAgent(selectedAgent.id)}
                className="p-1.5 border border-gray-800 bg-gray-900 hover:bg-red-950/60 hover:border-red-800/80 text-gray-400 hover:text-red-400 rounded transition-colors"
                title="Clear all execution logs for this agent"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Severity Level Filter Chips */}
          <div className="flex items-center justify-between gap-1 pt-0.5">
            <div className="flex items-center space-x-1 overflow-x-auto py-0.5 no-scrollbar">
              {/* All Levels */}
              <button
                onClick={() => setLevelFilter('all')}
                className={cn(
                  "px-2 py-1 rounded font-mono text-[10px] font-semibold transition-all flex items-center gap-1.5 shrink-0 border",
                  levelFilter === 'all'
                    ? "bg-purple-950/90 text-purple-200 border-purple-600 shadow-[0_0_8px_rgba(168,85,247,0.25)]"
                    : "bg-gray-950/60 text-gray-400 border-gray-800/80 hover:text-gray-200 hover:bg-gray-900"
                )}
              >
                <span>ALL</span>
                <span className={cn(
                  "px-1 py-0.2 rounded-full text-[9px]",
                  levelFilter === 'all' ? "bg-purple-800/60 text-purple-100" : "bg-gray-800 text-gray-400"
                )}>
                  {levelCounts.all}
                </span>
              </button>

              {/* Info Filter */}
              <button
                onClick={() => setLevelFilter(prev => prev === 'info' ? 'all' : 'info')}
                className={cn(
                  "px-2 py-1 rounded font-mono text-[10px] font-semibold transition-all flex items-center gap-1.5 shrink-0 border",
                  levelFilter === 'info'
                    ? "bg-blue-950/90 text-blue-200 border-blue-600 shadow-[0_0_8px_rgba(59,130,246,0.25)]"
                    : "bg-gray-950/60 text-gray-400 border-gray-800/80 hover:text-blue-300 hover:bg-gray-900"
                )}
              >
                <Info className="w-3 h-3 text-blue-400" />
                <span>INFO</span>
                <span className={cn(
                  "px-1 py-0.2 rounded-full text-[9px]",
                  levelFilter === 'info' ? "bg-blue-800/60 text-blue-100" : "bg-gray-800 text-gray-400"
                )}>
                  {levelCounts.info}
                </span>
              </button>

              {/* Success Filter */}
              <button
                onClick={() => setLevelFilter(prev => prev === 'success' ? 'all' : 'success')}
                className={cn(
                  "px-2 py-1 rounded font-mono text-[10px] font-semibold transition-all flex items-center gap-1.5 shrink-0 border",
                  levelFilter === 'success'
                    ? "bg-emerald-950/90 text-emerald-200 border-emerald-600 shadow-[0_0_8px_rgba(16,185,129,0.25)]"
                    : "bg-gray-950/60 text-gray-400 border-gray-800/80 hover:text-emerald-300 hover:bg-gray-900"
                )}
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>SUCCESS</span>
                <span className={cn(
                  "px-1 py-0.2 rounded-full text-[9px]",
                  levelFilter === 'success' ? "bg-emerald-800/60 text-emerald-100" : "bg-gray-800 text-gray-400"
                )}>
                  {levelCounts.success}
                </span>
              </button>

              {/* Warn Filter */}
              <button
                onClick={() => setLevelFilter(prev => prev === 'warn' ? 'all' : 'warn')}
                className={cn(
                  "px-2 py-1 rounded font-mono text-[10px] font-semibold transition-all flex items-center gap-1.5 shrink-0 border",
                  levelFilter === 'warn'
                    ? "bg-amber-950/90 text-amber-200 border-amber-600 shadow-[0_0_8px_rgba(245,158,11,0.25)]"
                    : "bg-gray-950/60 text-gray-400 border-gray-800/80 hover:text-amber-300 hover:bg-gray-900"
                )}
              >
                <AlertTriangle className="w-3 h-3 text-amber-400" />
                <span>WARN</span>
                <span className={cn(
                  "px-1 py-0.2 rounded-full text-[9px]",
                  levelFilter === 'warn' ? "bg-amber-800/60 text-amber-100" : "bg-gray-800 text-gray-400"
                )}>
                  {levelCounts.warn}
                </span>
              </button>

              {/* Error Filter */}
              <button
                onClick={() => setLevelFilter(prev => prev === 'error' ? 'all' : 'error')}
                className={cn(
                  "px-2 py-1 rounded font-mono text-[10px] font-semibold transition-all flex items-center gap-1.5 shrink-0 border",
                  levelFilter === 'error'
                    ? "bg-rose-950/90 text-rose-200 border-rose-600 shadow-[0_0_10px_rgba(244,63,94,0.35)] animate-pulse"
                    : levelCounts.error > 0 
                      ? "bg-rose-950/30 text-rose-300 border-rose-900/60 hover:bg-rose-950/60" 
                      : "bg-gray-950/60 text-gray-400 border-gray-800/80 hover:text-rose-300 hover:bg-gray-900"
                )}
              >
                <AlertCircle className="w-3 h-3 text-rose-400" />
                <span>ERROR</span>
                <span className={cn(
                  "px-1 py-0.2 rounded-full text-[9px]",
                  levelFilter === 'error' 
                    ? "bg-rose-800 text-rose-100" 
                    : levelCounts.error > 0 
                      ? "bg-rose-900/80 text-rose-300" 
                      : "bg-gray-800 text-gray-400"
                )}>
                  {levelCounts.error}
                </span>
              </button>
            </div>

            {/* Results Count Badge */}
            <div className="shrink-0 text-[10px] font-mono text-gray-400 bg-gray-950 border border-gray-800/80 px-2 py-0.5 rounded">
              <span className="text-purple-300 font-bold">{filteredLogs.length}</span>
              <span className="text-gray-500"> / {agentSpecificLogs.length}</span>
            </div>
          </div>

          {/* Expandable Advanced Filtering (Action Tags & Time Windows) */}
          <AnimatePresence>
            {showFilterBarDetails && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="pt-2 border-t border-gray-800/60 space-y-2 overflow-hidden"
              >
                {/* Time Window Filter */}
                <div className="flex items-center space-x-1.5 text-[10px]">
                  <span className="text-gray-500 font-mono flex items-center gap-1 shrink-0">
                    <Clock className="w-3 h-3 text-blue-400" /> Time:
                  </span>
                  <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar">
                    {(['all', '15m', '1h', 'today', '24h', '7d'] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => setTimeFilter(t)}
                        className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-mono uppercase transition-colors shrink-0",
                          timeFilter === t
                            ? "bg-blue-900/80 text-blue-200 font-bold border border-blue-700"
                            : "bg-gray-950/60 text-gray-400 border border-gray-800/60 hover:text-gray-200"
                        )}
                      >
                        {t === 'all' ? 'All Time' : t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action Type Filter Pills */}
                {actionTags.length > 0 && (
                  <div className="flex items-center space-x-1.5 text-[10px]">
                    <span className="text-gray-500 font-mono flex items-center gap-1 shrink-0">
                      <Tag className="w-3 h-3 text-purple-400" /> Action:
                    </span>
                    <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar py-0.5">
                      <button
                        onClick={() => setActionFilter('all')}
                        className={cn(
                          "px-2 py-0.5 rounded text-[9px] font-mono transition-colors shrink-0",
                          actionFilter === 'all'
                            ? "bg-purple-900/80 text-purple-200 font-bold border border-purple-700"
                            : "bg-gray-950/60 text-gray-400 border border-gray-800/60 hover:text-gray-200"
                        )}
                      >
                        All Actions
                      </button>
                      {actionTags.slice(0, 8).map(({ action, count }) => (
                        <button
                          key={action}
                          onClick={() => setActionFilter(prev => prev === action ? 'all' : action)}
                          className={cn(
                            "px-2 py-0.5 rounded text-[9px] font-mono transition-colors shrink-0 flex items-center gap-1 border",
                            actionFilter === action
                              ? "bg-purple-900/80 text-purple-200 font-bold border-purple-700"
                              : "bg-gray-950/60 text-gray-400 border-gray-800/60 hover:text-gray-200"
                          )}
                        >
                          <span>{action}</span>
                          <span className="text-[8px] opacity-70 bg-gray-800 px-1 rounded-full">{count}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Active Filter Chips / Reset Bar */}
          {(searchQuery || levelFilter !== 'all' || actionFilter !== 'all' || timeFilter !== 'all' || selectedDateKey) && (
            <div className="flex items-center justify-between pt-1 border-t border-gray-800/40 text-[10px]">
              <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                <span className="text-gray-500 font-mono">Active:</span>

                {searchQuery && (
                  <span className="inline-flex items-center gap-1 bg-purple-950/80 border border-purple-800/80 text-purple-300 px-1.5 py-0.5 rounded font-mono">
                    Query: "{searchQuery}"
                    <button onClick={() => setSearchQuery('')} className="hover:text-white"><X className="w-2.5 h-2.5" /></button>
                  </span>
                )}

                {levelFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1 bg-blue-950/80 border border-blue-800/80 text-blue-300 px-1.5 py-0.5 rounded font-mono uppercase">
                    Level: {levelFilter}
                    <button onClick={() => setLevelFilter('all')} className="hover:text-white"><X className="w-2.5 h-2.5" /></button>
                  </span>
                )}

                {actionFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1 bg-purple-950/80 border border-purple-800/80 text-purple-300 px-1.5 py-0.5 rounded font-mono">
                    Action: {actionFilter}
                    <button onClick={() => setActionFilter('all')} className="hover:text-white"><X className="w-2.5 h-2.5" /></button>
                  </span>
                )}

                {timeFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1 bg-blue-950/80 border border-blue-800/80 text-blue-300 px-1.5 py-0.5 rounded font-mono">
                    Time: {timeFilter}
                    <button onClick={() => setTimeFilter('all')} className="hover:text-white"><X className="w-2.5 h-2.5" /></button>
                  </span>
                )}

                {selectedDateKey && (
                  <span className="inline-flex items-center gap-1 bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 px-1.5 py-0.5 rounded font-mono">
                    Date: {selectedDateKey}
                    <button onClick={() => setSelectedDateKey(null)} className="hover:text-white"><X className="w-2.5 h-2.5" /></button>
                  </span>
                )}
              </div>

              <button
                onClick={handleResetAllFilters}
                className="text-[10px] text-purple-400 hover:text-purple-300 underline font-mono flex items-center gap-1 shrink-0 ml-2"
              >
                <RotateCcw className="w-3 h-3" /> Reset All
              </button>
            </div>
          )}
        </div>

        {/* Execution Logs List */}
        <div 
          ref={logsContainerRef}
          className="flex-1 overflow-y-auto p-3 space-y-2 font-mono text-xs relative scrollbar-thin scrollbar-thumb-gray-800"
        >
          {filteredLogs.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-gray-500 text-center p-6 bg-gray-950/30 rounded-lg border border-dashed border-gray-800 m-2">
              <div className="p-3 rounded-full bg-purple-950/40 border border-purple-800/40 text-purple-400 mb-3">
                <Search className="w-6 h-6 opacity-70" />
              </div>
              <p className="text-xs text-gray-300 font-semibold mb-1">No matching execution logs found</p>
              <p className="text-[11px] text-gray-500 max-w-[280px] leading-relaxed mb-4">
                {searchQuery ? `No records match search term "${searchQuery}"` : 'No logs match the current filter parameters.'}
              </p>

              <button
                onClick={handleResetAllFilters}
                className="px-3 py-1.5 rounded-md bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-semibold transition-colors flex items-center gap-1.5 shadow-lg shadow-purple-900/30"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset All Filters
              </button>
            </div>
          ) : (
            <>
              {filteredLogs.map(log => {
                const isExpanded = !!expandedLogIds[log.id];
                const isCopied = copiedLogId === log.id;
                const logDateObj = new Date(log.timestamp);
                const logTime = logDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                const logDateStr = logDateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });
                const matchCount = getLogMatchCount(log, searchQuery);
                const hasMetaMatch = hasMetadataMatch(log, searchQuery);

                return (
                  <div 
                    key={log.id}
                    className={cn(
                      "bg-gray-900/80 border rounded-md p-2.5 transition-all space-y-1.5 shadow-xs group",
                      searchQuery && matchCount > 0 
                        ? "border-amber-500/40 bg-gray-900/90 shadow-[0_0_12px_rgba(251,191,36,0.06)]" 
                        : "border-gray-800/80 hover:border-gray-700"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getLevelBadge(log.level)}
                        <span className="font-bold text-gray-200">
                          {renderHighlightedText(log.action, searchQuery)}
                        </span>
                        {searchQuery && matchCount > 0 && (
                          <span className="text-[9px] font-mono text-amber-300 bg-amber-950/70 border border-amber-800/80 px-1.5 py-0.2 rounded">
                            {matchCount} {matchCount === 1 ? 'match' : 'matches'}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 text-[10px] text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-gray-600" />
                          <span>{logDateStr} {logTime}</span>
                        </div>

                        {/* Copy Single Log JSON */}
                        <button
                          onClick={() => handleCopyLog(log)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-800 text-gray-500 hover:text-gray-300 rounded transition-all"
                          title="Copy log entry JSON"
                        >
                          {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>

                    <p className="text-gray-300 text-[11px] leading-relaxed font-sans pl-0.5">
                      {renderHighlightedText(log.details, searchQuery)}
                    </p>

                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <div className="pt-1">
                        <button
                          onClick={() => toggleLogExpand(log.id)}
                          className={cn(
                            "flex items-center space-x-1.5 text-[10px] transition-colors rounded px-1.5 py-0.5 border",
                            hasMetaMatch && searchQuery
                              ? "text-amber-300 bg-amber-950/40 border-amber-800/60 font-semibold"
                              : "text-purple-400 hover:text-purple-300 border-transparent hover:bg-purple-950/30"
                          )}
                        >
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          <span>
                            {isExpanded 
                              ? 'Hide Payload' 
                              : `View Payload (${Object.keys(log.metadata).length} keys)`}
                          </span>
                          {hasMetaMatch && searchQuery && (
                            <span className="text-[9px] text-amber-400 bg-amber-900/60 px-1 rounded-full font-mono">
                              match in payload
                            </span>
                          )}
                        </button>

                        {isExpanded && (
                          <motion.pre 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-1.5 p-2 bg-black/80 rounded border border-gray-800 text-[10px] text-emerald-400 overflow-x-auto font-mono whitespace-pre-wrap break-all"
                          >
                            {renderHighlightedJson(log.metadata, searchQuery)}
                          </motion.pre>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={logsEndRef} />
            </>
          )}

          {/* Floating Jump to Newest button when Auto-scroll is disabled */}
          {!autoScroll && filteredLogs.length > 3 && (
            <div className="sticky bottom-2 flex justify-center pointer-events-none z-20">
              <button
                onClick={() => {
                  setAutoScroll(true);
                  scrollToNewestLogs(true);
                  addToast({
                    title: 'Auto-scroll Enabled',
                    message: 'Jumped to latest execution logs',
                    type: 'info'
                  });
                }}
                className="pointer-events-auto px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-[11px] font-semibold shadow-xl shadow-black/80 border border-emerald-400/50 flex items-center gap-1.5 transition-all hover:scale-105"
                title="Enable auto-scroll and jump to newest logs"
              >
                <ArrowDown className="w-3.5 h-3.5" />
                <span>Jump to latest logs</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer Status Bar */}
        <div className="px-4 py-2 bg-gray-900 border-t border-gray-800 text-[11px] text-gray-400 flex justify-between items-center shrink-0">
          <div className="flex items-center space-x-2 font-mono">
            <span>Plurality Agent Log Stream</span>
            <span className="text-gray-600">•</span>
            <span className={cn(
              "text-[10px] font-mono flex items-center gap-1",
              autoScroll ? "text-emerald-400" : "text-gray-500"
            )}>
              Auto-scroll: <strong className="font-bold">{autoScroll ? 'ON' : 'OFF'}</strong>
            </span>
          </div>
          <span className="flex items-center text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
            Live Monitored
          </span>
        </div>
      </motion.div>
      )}
    </AnimatePresence>
  );
}
