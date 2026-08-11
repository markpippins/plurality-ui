import React, { useEffect } from 'react';
import { useSimulation } from '../hooks/useSimulation';
import { ToastNotification } from '../types';
import { 
  X, CheckCircle2, AlertTriangle, AlertCircle, Info, Cpu, Zap, ExternalLink, Trash2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

function ToastItem({ toast }: { toast: ToastNotification; key?: React.Key }) {
  const { removeToast, activeAgents } = useSimulation();

  const agent = toast.agentId ? activeAgents.find(a => a.id === toast.agentId) : null;

  useEffect(() => {
    const duration = toast.duration ?? 4500;
    const timer = setTimeout(() => {
      removeToast(toast.id);
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, removeToast]);

  const getIconAndStyle = () => {
    switch (toast.type) {
      case 'success':
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-green-400" />,
          accentBg: 'bg-green-500',
          border: 'border-green-800/60 hover:border-green-700/80',
          gradient: 'from-green-950/40 via-gray-950 to-gray-950',
          titleColor: 'text-green-300'
        };
      case 'warn':
        return {
          icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
          accentBg: 'bg-amber-500',
          border: 'border-amber-800/60 hover:border-amber-700/80',
          gradient: 'from-amber-950/40 via-gray-950 to-gray-950',
          titleColor: 'text-amber-300'
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-4 h-4 text-red-400" />,
          accentBg: 'bg-red-500',
          border: 'border-red-800/60 hover:border-red-700/80',
          gradient: 'from-red-950/40 via-gray-950 to-gray-950',
          titleColor: 'text-red-300'
        };
      case 'agent_state':
        return {
          icon: <Cpu className="w-4 h-4 text-purple-400" />,
          accentBg: 'bg-purple-500',
          border: 'border-purple-800/60 hover:border-purple-700/80',
          gradient: 'from-purple-950/40 via-gray-950 to-gray-950',
          titleColor: 'text-purple-300'
        };
      case 'info':
      default:
        return {
          icon: <Zap className="w-4 h-4 text-blue-400" />,
          accentBg: 'bg-blue-500',
          border: 'border-blue-800/60 hover:border-blue-700/80',
          gradient: 'from-blue-950/40 via-gray-950 to-gray-950',
          titleColor: 'text-blue-300'
        };
    }
  };

  const style = getIconAndStyle();
  const formattedTime = new Date(toast.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.9 }}
      transition={{ type: 'spring', damping: 25, stiffness: 220 }}
      className={cn(
        "pointer-events-auto relative overflow-hidden rounded-lg bg-gradient-to-r border shadow-2xl backdrop-blur-md p-3.5 transition-all",
        style.border,
        style.gradient
      )}
    >
      {/* Left Vertical Bar */}
      <div className={cn("absolute left-0 top-0 bottom-0 w-1", style.accentBg)} />

      <div className="flex items-start justify-between space-x-3 pl-1.5">
        <div className="flex items-start space-x-2.5 flex-1 min-w-0">
          {agent?.avatarUrl ? (
            <div className="relative shrink-0 mt-0.5">
              <img 
                src={agent.avatarUrl} 
                alt={agent.name} 
                referrerPolicy="no-referrer"
                className="w-7 h-7 rounded-full object-cover border border-gray-700 shadow-sm"
              />
              <div className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-gray-950 border border-gray-800">
                {style.icon}
              </div>
            </div>
          ) : (
            <div className="p-1 rounded bg-gray-900/80 border border-gray-800 shrink-0 mt-0.5">
              {style.icon}
            </div>
          )}

          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center space-x-2 flex-wrap">
              <h4 className={cn("text-xs font-bold truncate", style.titleColor)}>
                {toast.title}
              </h4>

              {toast.agentName && (
                <span className="inline-flex items-center space-x-1 text-[10px] font-mono px-1.5 py-0.2 rounded bg-gray-900 text-gray-300 border border-gray-800">
                  <span>{toast.agentName}</span>
                  {toast.agentRole && <span className="text-gray-500">• {toast.agentRole}</span>}
                </span>
              )}
            </div>

            <p className="text-xs text-gray-300 leading-snug font-sans">
              {toast.message}
            </p>

            {toast.actionLabel && toast.onAction && (
              <button
                onClick={() => {
                  toast.onAction?.();
                  removeToast(toast.id);
                }}
                className="mt-2 inline-flex items-center space-x-1 text-[11px] font-medium text-blue-400 hover:text-blue-300 bg-blue-950/60 hover:bg-blue-900/80 border border-blue-800/60 px-2 py-0.5 rounded transition-all"
              >
                <span>{toast.actionLabel}</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-1 shrink-0">
          <span className="text-[10px] text-gray-500 font-mono">
            {formattedTime}
          </span>
          <button
            onClick={() => removeToast(toast.id)}
            className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-gray-200 transition-colors"
            title="Dismiss Toast"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Progress Bar for Auto-dismiss */}
      <motion.div
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: (toast.duration ?? 4500) / 1000, ease: 'linear' }}
        className={cn("absolute bottom-0 left-0 right-0 h-0.5 origin-left opacity-70", style.accentBg)}
      />
    </motion.div>
  );
}

export function ToastContainer() {
  const { toasts, clearAllToasts } = useSimulation();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col space-y-2.5 max-w-sm w-full pointer-events-none px-2">
      {toasts.length > 2 && (
        <div className="flex justify-end pointer-events-auto">
          <button
            onClick={clearAllToasts}
            className="flex items-center space-x-1 text-[10px] font-mono text-gray-400 hover:text-gray-200 bg-gray-900/90 hover:bg-gray-800 border border-gray-800 px-2 py-1 rounded shadow-md transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear All Toasts ({toasts.length})</span>
          </button>
        </div>
      )}

      <AnimatePresence mode="popLayout">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </div>
  );
}
