import React, { useState, useMemo } from 'react';
import { useSimulation } from '../hooks/useSimulation';
import { 
  X, Trash2, Search, Terminal, Cpu, CheckCircle2, 
  AlertTriangle, Info, AlertCircle, ChevronDown, ChevronUp, Clock,
  Filter, Users, Shield, Zap, Database, Network,
  Calendar, Flame, Activity, RotateCcw, BarChart2, Grid, Sparkles
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { AgentLogEntry, ActiveAgent } from '../types';

export function AgentLogDrawer() {
  const { 
    selectedAgent, 
    activeAgents, 
    agentLogs, 
    selectAgentForLogs, 
    clearLogsForAgent 
  } = useSimulation();

  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<'all' | 'info' | 'success' | 'warn' | 'error'>('all');
  const [agentStatusFilter, setAgentStatusFilter] = useState<'all' | 'active' | 'idle' | 'waiting' | 'error'>('all');
  const [agentSearch, setAgentSearch] = useState('');
  const [expandedLogIds, setExpandedLogIds] = useState<Record<string, boolean>>({});

  // Heatmap state
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [heatmapViewMode, setHeatmapViewMode] = useState<'grid' | 'density'>('grid');
  const [hoveredDayKey, setHoveredDayKey] = useState<string | null>(null);
  const [hoveredSlotIndex, setHoveredSlotIndex] = useState<number | null>(null);

  if (!selectedAgent) return null;

  // Filter logs for this agent
  const agentSpecificLogs = agentLogs.filter(log => log.agentId === selectedAgent.id);

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
      const logDate = new Date(log.timestamp);
      const year = logDate.getFullYear();
      const month = String(logDate.getMonth() + 1).padStart(2, '0');
      const day = String(logDate.getDate()).padStart(2, '0');
      const key = `${year}-${month}-${day}`;

      if (dataByKey[key]) {
        dataByKey[key].total += 1;

        const hour = logDate.getHours();
        dataByKey[key].hours[hour] += 1;

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
  
  const filteredLogs = agentSpecificLogs.filter(log => {
    const matchesFilter = levelFilter === 'all' || log.level === levelFilter;
    const matchesSearch = 
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesDate = true;
    if (selectedDateKey) {
      const logDate = new Date(log.timestamp);
      const year = logDate.getFullYear();
      const month = String(logDate.getMonth() + 1).padStart(2, '0');
      const day = String(logDate.getDate()).padStart(2, '0');
      const key = `${year}-${month}-${day}`;
      matchesDate = key === selectedDateKey;
    }

    return matchesFilter && matchesSearch && matchesDate;
  });

  // Filtered agent directory for quick switching (sorted by role)
  const filteredListedAgents = [...activeAgents]
    .sort((a, b) => a.role.localeCompare(b.role, undefined, { sensitivity: 'base' }))
    .filter(ag => {
      const isWorking = ag.status === 'working' || ag.status === 'active';
      const isWaiting = ag.status === 'waiting';
      const isError = ag.status === 'error';
      const isIdle = ag.status === 'idle';

      let matchesStatus = true;
      if (agentStatusFilter === 'active') matchesStatus = isWorking;
      else if (agentStatusFilter === 'idle') matchesStatus = isIdle;
      else if (agentStatusFilter === 'waiting') matchesStatus = isWaiting;
      else if (agentStatusFilter === 'error') matchesStatus = isError;

      const matchesQuery = 
        ag.name.toLowerCase().includes(agentSearch.toLowerCase()) ||
        ag.role.toLowerCase().includes(agentSearch.toLowerCase());

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

  const getAgentStatusTag = (status: ActiveAgent['status'], compact = false) => {
    switch (status) {
      case 'working':
      case 'active':
        return (
          <span className={cn(
            "inline-flex items-center gap-1 font-mono uppercase font-bold rounded border shadow-sm transition-all animate-pulse",
            "bg-emerald-950 text-emerald-300 border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]",
            compact ? "text-[9px] px-1.5 py-0.2" : "text-[10px] px-2 py-0.5"
          )}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <span>ACTIVE</span>
          </span>
        );
      case 'waiting':
        return (
          <span className={cn(
            "inline-flex items-center gap-1 font-mono uppercase font-bold rounded border shadow-sm transition-all",
            "bg-amber-950/90 text-amber-300 border-amber-500/80",
            compact ? "text-[9px] px-1.5 py-0.2" : "text-[10px] px-2 py-0.5"
          )}>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 animate-pulse" />
            <span>WAITING</span>
          </span>
        );
      case 'error':
        return (
          <span className={cn(
            "inline-flex items-center gap-1 font-mono uppercase font-bold rounded border shadow-sm transition-all",
            "bg-red-950/90 text-red-300 border-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.25)]",
            compact ? "text-[9px] px-1.5 py-0.2" : "text-[10px] px-2 py-0.5"
          )}>
            <AlertCircle className="w-2.5 h-2.5 text-red-400 shrink-0" />
            <span>ERROR</span>
          </span>
        );
      case 'idle':
      default:
        return (
          <span className={cn(
            "inline-flex items-center gap-1 font-mono uppercase font-medium rounded border transition-all",
            "bg-gray-900/90 text-gray-400 border-gray-700/60",
            compact ? "text-[9px] px-1.5 py-0.2" : "text-[10px] px-2 py-0.5"
          )}>
            <span className="w-1.5 h-1.5 rounded-full bg-gray-500 shrink-0" />
            <span>IDLE</span>
          </span>
        );
    }
  };

  const getLevelBadge = (level: AgentLogEntry['level']) => {
    switch (level) {
      case 'success':
        return <span className="bg-green-950/80 text-green-400 border border-green-800/60 px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-semibold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> SUCCESS</span>;
      case 'warn':
        return <span className="bg-yellow-950/80 text-yellow-400 border border-yellow-800/60 px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-semibold flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> WARN</span>;
      case 'error':
        return <span className="bg-red-950/80 text-red-400 border border-red-800/60 px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-semibold flex items-center gap-1"><AlertCircle className="w-3 h-3" /> ERROR</span>;
      case 'info':
      default:
        return <span className="bg-blue-950/80 text-blue-400 border border-blue-800/60 px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-semibold flex items-center gap-1"><Info className="w-3 h-3" /> INFO</span>;
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
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
                        ? "border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.3)]"
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
                    {selectedAgent.name}
                    {(selectedAgent.status === 'working' || selectedAgent.status === 'active') && (
                      <Zap className="w-4 h-4 text-emerald-400 animate-bounce" />
                    )}
                  </h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-gray-800 text-gray-300 rounded border border-gray-700">
                    {selectedAgent.role}
                  </span>
                </div>

                <div className="flex items-center space-x-2 mt-1 flex-wrap gap-y-1">
                  {/* Visually Distinct Status Tag */}
                  {getAgentStatusTag(selectedAgent.status)}

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

            <button 
              onClick={() => selectAgentForLogs(null)}
              className="p-1.5 hover:bg-gray-800 rounded-md text-gray-400 hover:text-gray-200 transition-colors"
              title="Close Drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Agent Switcher Grid / Directory */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono">
              <span className="flex items-center gap-1 text-gray-300 font-semibold">
                <Users className="w-3.5 h-3.5 text-purple-400" />
                Agent Roster ({activeAgents.length})
              </span>
              
              {/* Agent Status Quick Filter Pills */}
              <div className="flex items-center space-x-1 text-[9px]">
                {(['all', 'active', 'idle', 'waiting', 'error'] as const).map(st => (
                  <button
                    key={st}
                    onClick={() => setAgentStatusFilter(st)}
                    className={cn(
                      "px-1.5 py-0.2 rounded uppercase font-bold transition-all",
                      agentStatusFilter === st
                        ? "bg-purple-900 text-purple-200 border border-purple-700"
                        : "text-gray-500 hover:text-gray-300 hover:bg-gray-800"
                    )}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable Agent List */}
            <div className="max-h-32 overflow-y-auto pr-1 space-y-1 scrollbar-thin scrollbar-thumb-gray-800">
              {filteredListedAgents.map(ag => {
                const isSelected = selectedAgent.id === ag.id;
                const isExecuting = ag.status === 'working' || ag.status === 'active';
                const agentLogsCount = agentLogs.filter(l => l.agentId === ag.id).length;

                return (
                  <button
                    key={ag.id}
                    onClick={() => {
                      selectAgentForLogs(ag.id);
                      setSelectedDateKey(null);
                    }}
                    className={cn(
                      "w-full p-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-between border text-left relative overflow-hidden",
                      isExecuting
                        ? isSelected
                          ? "bg-purple-950/80 border-emerald-400 text-purple-100 shadow-[0_0_12px_rgba(16,185,129,0.35)] animate-pulse"
                          : "bg-emerald-950/40 border-emerald-500/80 text-emerald-100 hover:bg-emerald-900/50 shadow-[0_0_10px_rgba(16,185,129,0.25)] animate-pulse"
                        : isSelected 
                          ? "bg-purple-950/70 border-purple-500/80 text-purple-100 shadow-md" 
                          : "bg-gray-950/80 border-gray-800/80 text-gray-300 hover:bg-gray-900 hover:border-gray-700"
                    )}
                  >
                    <div className="flex items-center space-x-2 min-w-0 z-10">
                      <div className="relative shrink-0">
                        {isExecuting && (
                          <span className="absolute -inset-0.5 rounded-full bg-emerald-400 animate-ping opacity-75" />
                        )}
                        {ag.avatarUrl ? (
                          <img 
                            src={ag.avatarUrl} 
                            alt={ag.name} 
                            referrerPolicy="no-referrer"
                            className={cn(
                              "w-5 h-5 rounded-full object-cover shrink-0 relative z-10",
                              isExecuting ? "border-2 border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]" : "border border-gray-700"
                            )} 
                          />
                        ) : (
                          <Cpu className="w-4 h-4 text-gray-400 shrink-0 relative z-10" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <span className={cn("font-bold truncate", isExecuting ? "text-emerald-200" : "text-gray-100")}>{ag.name}</span>
                          <span className="text-[10px] font-mono text-gray-400 truncate">({ag.role})</span>
                          {isExecuting && (
                            <Zap className="w-3 h-3 text-emerald-400 animate-bounce shrink-0" />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0 z-10">
                      {getAgentStatusTag(ag.status, true)}
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-gray-900 text-gray-400 border border-gray-800">
                        {agentLogsCount}
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

        {/* Toolbar & Filter for Logs */}
        <div className="p-3 border-b border-gray-800/80 bg-gray-900/40 flex flex-col space-y-2 text-xs shrink-0">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2.5" />
              <input 
                type="text" 
                placeholder={`Search logs for ${selectedAgent.name}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded pl-8 pr-3 py-1.5 text-gray-200 text-xs focus:outline-none focus:border-purple-500/50"
              />
            </div>

            <button
              onClick={() => clearLogsForAgent(selectedAgent.id)}
              className="p-1.5 border border-gray-800 bg-gray-900 hover:bg-red-950/40 hover:border-red-800/50 text-gray-400 hover:text-red-400 rounded transition-colors"
              title="Clear Agent Execution Logs"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Level Filter Chips */}
          <div className="flex items-center space-x-1 text-[11px]">
            <span className="text-gray-500 mr-1 flex items-center gap-1 font-mono text-[10px]">
              <Filter className="w-3 h-3 text-purple-400" />
              Level:
            </span>
            {(['all', 'info', 'success', 'warn', 'error'] as const).map(lvl => (
              <button
                key={lvl}
                onClick={() => setLevelFilter(lvl)}
                className={cn(
                  "px-2 py-0.5 rounded capitalize font-mono text-[10px] transition-colors",
                  levelFilter === lvl
                    ? "bg-purple-900/80 text-purple-200 font-bold border border-purple-700/80"
                    : "text-gray-500 hover:text-gray-300 hover:bg-gray-900"
                )}
              >
                {lvl}
              </button>
            ))}
            <span className="ml-auto text-gray-500 font-mono text-[10px]">
              {filteredLogs.length} {filteredLogs.length === 1 ? 'entry' : 'entries'}
            </span>
          </div>
        </div>

        {/* Execution Logs List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 font-mono text-xs">
          {filteredLogs.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-gray-600 text-center p-4">
              <Terminal className="w-8 h-8 mb-2 opacity-30 text-purple-400" />
              <p className="text-xs text-gray-400 font-medium">No execution logs found for {selectedAgent.name}.</p>
              {(searchQuery || selectedDateKey) && (
                <div className="mt-2 flex flex-col items-center gap-1">
                  <p className="text-[10px] text-gray-500">Try clearing search, level, or date filters.</p>
                  {selectedDateKey && (
                    <button
                      onClick={() => setSelectedDateKey(null)}
                      className="text-[10px] text-purple-400 hover:text-purple-300 underline font-semibold flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" /> Clear Date Filter
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            filteredLogs.map(log => {
              const isExpanded = !!expandedLogIds[log.id];
              const logDateObj = new Date(log.timestamp);
              const logTime = logDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
              const logDateStr = logDateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });

              return (
                <div 
                  key={log.id}
                  className="bg-gray-900/80 border border-gray-800/80 rounded-md p-2.5 hover:border-gray-700 transition-colors space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getLevelBadge(log.level)}
                      <span className="font-bold text-gray-200">{log.action}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-[10px] text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{logDateStr} {logTime}</span>
                    </div>
                  </div>

                  <p className="text-gray-300 text-[11px] leading-relaxed font-sans pl-0.5">
                    {log.details}
                  </p>

                  {log.metadata && (
                    <div className="pt-1">
                      <button
                        onClick={() => toggleLogExpand(log.id)}
                        className="flex items-center space-x-1 text-[10px] text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        <span>{isExpanded ? 'Hide Payload' : 'View Payload Details'}</span>
                      </button>

                      {isExpanded && (
                        <motion.pre 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-1.5 p-2 bg-black/60 rounded border border-gray-800 text-[10px] text-emerald-400 overflow-x-auto"
                        >
                          {JSON.stringify(log.metadata, null, 2)}
                        </motion.pre>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Status Bar */}
        <div className="px-4 py-2 bg-gray-900 border-t border-gray-800 text-[11px] text-gray-500 flex justify-between items-center shrink-0">
          <span className="font-mono">Plurality Agent Log Stream</span>
          <span className="flex items-center text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
            Live Monitored
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}


