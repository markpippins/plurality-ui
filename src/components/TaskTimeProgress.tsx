import React, { useState, useEffect } from 'react';
import { Clock, Timer, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown, Hourglass, Zap } from 'lucide-react';
import { cn } from '../lib/utils';
import { AgentTaskItem } from '../types';

interface TaskTimeProgressProps {
  task: AgentTaskItem;
  mode?: 'card' | 'table' | 'detailed';
  showLabel?: boolean;
  className?: string;
}

export function formatTimeMs(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }
  const seconds = (ms / 1000).toFixed(1);
  return `${seconds}s`;
}

export function TaskTimeProgress({
  task,
  mode = 'card',
  showLabel = true,
  className
}: TaskTimeProgressProps) {
  const [currentNow, setCurrentNow] = useState<number>(Date.now());

  // Live timer for active tasks
  useEffect(() => {
    if (task.status !== 'active') return;

    const interval = setInterval(() => {
      setCurrentNow(Date.now());
    }, 100);

    return () => clearInterval(interval);
  }, [task.status, task.startedAt]);

  const estimatedMs = task.estimatedDurationMs || 2500;

  // Calculate elapsed time
  let elapsedMs = 0;
  if (task.status === 'completed') {
    elapsedMs = task.actualDurationMs || estimatedMs;
  } else if (task.status === 'active' && task.startedAt) {
    elapsedMs = Math.max(0, currentNow - new Date(task.startedAt).getTime());
  } else if (task.status === 'paused' && task.startedAt) {
    elapsedMs = Math.max(0, (task.actualDurationMs || ((task.progress || 10) / 100) * estimatedMs));
  } else if (task.actualDurationMs) {
    elapsedMs = task.actualDurationMs;
  }

  // Elapsed ratio (0 to 1+)
  const ratio = estimatedMs > 0 ? elapsedMs / estimatedMs : 0;
  const elapsedPercent = Math.min(100, Math.round(ratio * 100));
  const isOvertime = task.status === 'active' && ratio > 1.0;
  const overtimeMs = isOvertime ? elapsedMs - estimatedMs : 0;
  const remainingMs = !isOvertime && task.status === 'active' ? Math.max(0, estimatedMs - elapsedMs) : 0;

  // Completed efficiency
  const isFasterThanEst = task.status === 'completed' && elapsedMs < estimatedMs;
  const isSlowerThanEst = task.status === 'completed' && elapsedMs > estimatedMs;
  const deltaMs = Math.abs(elapsedMs - estimatedMs);

  // Table Compact View
  if (mode === 'table') {
    if (task.status === 'active') {
      return (
        <div className={cn("space-y-1 select-none", className)}>
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className={cn(
              "font-bold flex items-center gap-1",
              isOvertime ? "text-amber-400" : "text-cyan-300"
            )}>
              <Timer className="w-2.5 h-2.5 animate-spin" />
              <span>{formatTimeMs(elapsedMs)}</span>
            </span>
            <span className="text-gray-500">/ {formatTimeMs(estimatedMs)}</span>
          </div>

          <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden relative">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-150",
                isOvertime 
                  ? "bg-gradient-to-r from-amber-500 to-rose-500 animate-pulse" 
                  : "bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500"
              )}
              style={{ width: `${Math.min(100, elapsedPercent)}%` }}
            />
          </div>

          <div className="text-[9px] font-mono text-right truncate">
            {isOvertime ? (
              <span className="text-amber-400 font-semibold">+{formatTimeMs(overtimeMs)} over</span>
            ) : (
              <span className="text-gray-400">~{formatTimeMs(remainingMs)} left</span>
            )}
          </div>
        </div>
      );
    }

    if (task.status === 'completed') {
      return (
        <div className={cn("space-y-0.5 select-none", className)}>
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-2.5 h-2.5" />
              <span>{formatTimeMs(elapsedMs)}</span>
            </span>
            <span className="text-gray-500 text-[9px]">est {formatTimeMs(estimatedMs)}</span>
          </div>
          <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full w-full opacity-80" />
          </div>
        </div>
      );
    }

    // Pending / Paused
    return (
      <div className={cn("text-[10px] font-mono text-gray-500 flex items-center gap-1", className)}>
        <Clock className="w-2.5 h-2.5 text-gray-600" />
        <span>~{formatTimeMs(estimatedMs)} est</span>
      </div>
    );
  }

  // Detailed Modal View
  if (mode === 'detailed') {
    return (
      <div className={cn("bg-gray-950/70 border border-gray-800/90 rounded-xl p-3.5 space-y-2.5 select-none", className)}>
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase font-bold tracking-wider text-gray-400 flex items-center gap-1.5">
            <Timer className={cn("w-3.5 h-3.5", task.status === 'active' ? "text-cyan-400 animate-spin" : "text-blue-400")} />
            <span>Execution Duration Telemetry</span>
          </span>

          <div className="flex items-center space-x-2">
            {task.status === 'active' && (
              <span className={cn(
                "text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border flex items-center gap-1",
                isOvertime 
                  ? "bg-amber-950/80 text-amber-300 border-amber-800 animate-pulse" 
                  : "bg-cyan-950/80 text-cyan-300 border-cyan-800"
              )}>
                <span className={cn("w-1.5 h-1.5 rounded-full", isOvertime ? "bg-amber-400 animate-ping" : "bg-cyan-400 animate-ping")} />
                <span>{isOvertime ? `+${formatTimeMs(overtimeMs)} Over Estimated` : `${elapsedPercent}% Time Elapsed`}</span>
              </span>
            )}

            {task.status === 'completed' && (
              <span className={cn(
                "text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1",
                isFasterThanEst ? "bg-emerald-950 text-emerald-300 border-emerald-800" : "bg-gray-900 text-gray-400 border-gray-800"
              )}>
                {isFasterThanEst ? (
                  <>
                    <TrendingDown className="w-3 h-3 text-emerald-400" />
                    <span>{formatTimeMs(deltaMs)} faster than est.</span>
                  </>
                ) : isSlowerThanEst ? (
                  <>
                    <TrendingUp className="w-3 h-3 text-amber-400" />
                    <span>+{formatTimeMs(deltaMs)} above est.</span>
                  </>
                ) : (
                  <span>Matched estimate</span>
                )}
              </span>
            )}
          </div>
        </div>

        {/* Progress bar track */}
        <div className="space-y-1.5">
          <div className="h-2 w-full bg-gray-900 border border-gray-800 rounded-full overflow-hidden p-0.5 relative">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-150",
                task.status === 'completed' ? "bg-gradient-to-r from-emerald-500 to-teal-400" :
                task.status === 'active' && isOvertime ? "bg-gradient-to-r from-amber-500 via-rose-500 to-red-500 animate-pulse" :
                task.status === 'active' ? "bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500" :
                task.status === 'paused' ? "bg-amber-500" :
                "bg-gray-700"
              )}
              style={{ width: `${task.status === 'completed' ? 100 : Math.min(100, elapsedPercent)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs font-mono">
            <div className="flex items-center space-x-1.5 text-gray-300">
              <span className="text-gray-500 text-[11px]">Elapsed:</span>
              <span className={cn(
                "font-bold",
                task.status === 'active' ? (isOvertime ? "text-amber-300" : "text-cyan-300") :
                task.status === 'completed' ? "text-emerald-300" : "text-gray-300"
              )}>
                {formatTimeMs(elapsedMs)}
              </span>
            </div>

            <div className="flex items-center space-x-1.5 text-gray-400">
              <span className="text-gray-500 text-[11px]">Estimated Target:</span>
              <span className="font-semibold text-gray-200">{formatTimeMs(estimatedMs)}</span>
              {task.status === 'active' && !isOvertime && (
                <span className="text-[10px] text-cyan-400 bg-cyan-950/60 px-1.5 py-0.2 rounded border border-cyan-900">
                  ~{formatTimeMs(remainingMs)} left
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Card View (Used directly inside TaskCard in Kanban & lists)
  return (
    <div className={cn("space-y-1.5 select-none", className)}>
      {/* Elapsed vs Estimated Header Line */}
      {showLabel && (
        <div className="flex items-center justify-between text-[10px] font-mono">
          <div className="flex items-center space-x-1">
            <Timer className={cn(
              "w-3 h-3",
              task.status === 'active' ? (isOvertime ? "text-amber-400 animate-spin" : "text-cyan-400 animate-spin") :
              task.status === 'completed' ? "text-emerald-400" : "text-gray-500"
            )} />
            <span className="text-gray-400">Time:</span>
            <span className={cn(
              "font-bold",
              task.status === 'active' ? (isOvertime ? "text-amber-300 font-extrabold" : "text-cyan-300 font-extrabold") :
              task.status === 'completed' ? "text-emerald-300" : "text-gray-300"
            )}>
              {formatTimeMs(elapsedMs)}
            </span>
            <span className="text-gray-500">/ {formatTimeMs(estimatedMs)}</span>
          </div>

          <div>
            {task.status === 'active' && (
              isOvertime ? (
                <span className="text-[9px] font-bold text-amber-400 bg-amber-950/80 px-1.5 py-0.2 rounded border border-amber-800/80 animate-pulse">
                  +{formatTimeMs(overtimeMs)} over
                </span>
              ) : (
                <span className="text-[9px] font-semibold text-cyan-400 bg-cyan-950/60 px-1.5 py-0.2 rounded border border-cyan-900/80">
                  {elapsedPercent}% elapsed
                </span>
              )
            )}

            {task.status === 'completed' && (
              <span className={cn(
                "text-[9px] font-semibold px-1.5 py-0.2 rounded",
                isFasterThanEst ? "text-emerald-400 bg-emerald-950/80" : "text-gray-400 bg-gray-900"
              )}>
                {isFasterThanEst ? `✓ -${formatTimeMs(deltaMs)}` : '✓ on target'}
              </span>
            )}

            {task.status === 'pending' && (
              <span className="text-[9px] text-gray-500">est. SLA</span>
            )}
          </div>
        </div>
      )}

      {/* Subtle Progress Bar Visual Indicator */}
      <div className="h-1.5 w-full bg-gray-900/90 border border-gray-800/80 rounded-full overflow-hidden p-0 relative shadow-inner">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-150 relative",
            task.status === 'completed' ? "bg-gradient-to-r from-emerald-500 to-teal-400 opacity-90" :
            task.status === 'active' && isOvertime ? "bg-gradient-to-r from-amber-500 via-rose-500 to-red-500 shadow-sm shadow-amber-500/50 animate-pulse" :
            task.status === 'active' ? "bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 shadow-sm shadow-cyan-500/40" :
            task.status === 'paused' ? "bg-amber-500/80" :
            "bg-gray-700/50"
          )}
          style={{ width: `${task.status === 'completed' ? 100 : Math.min(100, elapsedPercent)}%` }}
        >
          {/* Active shimmer line */}
          {task.status === 'active' && (
            <div className="absolute inset-0 bg-white/20 animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          )}
        </div>
      </div>
    </div>
  );
}
