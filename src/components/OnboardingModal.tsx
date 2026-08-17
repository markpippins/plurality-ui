import React, { useState, useEffect } from 'react';
import { useSimulation } from '../hooks/useSimulation';
import { 
  Sparkles, ArrowRight, ArrowLeft, X, CheckCircle2, 
  Target, Workflow, Cpu, Sliders, Layers, Users, Command, Terminal, 
  HelpCircle, Shield, FileText, Activity, Play, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export interface TourStep {
  id: string;
  title: string;
  badge: string;
  badgeColor: string;
  icon: React.ReactNode;
  subtitle: string;
  description: string;
  keyPoints: string[];
  targetSelector?: string;
  highlightPosition?: 'left' | 'top' | 'center' | 'right' | 'bottom';
  actionButton?: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
  };
}

export function OnboardingModal() {
  const { 
    isOnboardingOpen, 
    closeOnboardingModal, 
    openRoundtableModal, 
    openDependencyGraphModal, 
    openAgentConfigModal,
    addToast,
    BackendService
  } = useSimulation();

  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Keyboard navigation listener (Left/Right arrows, Escape)
  useEffect(() => {
    if (!isOnboardingOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeOnboardingModal();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setCurrentStepIndex(prev => Math.min(prev + 1, tourSteps.length - 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentStepIndex(prev => Math.max(prev - 1, 0));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOnboardingOpen, closeOnboardingModal]);

  const tourSteps: TourStep[] = [
    {
      id: 'step-welcome',
      title: 'Welcome to Plurality Agentic IDE',
      badge: 'MULTI-AGENT CONSENSUS',
      badgeColor: 'bg-blue-950/90 text-blue-300 border-blue-700/80',
      icon: <Sparkles className="w-6 h-6 text-blue-400" />,
      subtitle: 'Autonomous Agent Specialization & Planning Platform',
      description: 'Plurality orchestrates a squad of specialized AI agents working together to transform user intents into verified execution artifacts.',
      keyPoints: [
        'Specialized agent roles: Planner, System Architect, Builder, Critic & Validator',
        'Formal intermediate plan representation (PlanIR, SpecIR, ExecutionIR)',
        'Automated critique risk scoring and human-in-the-loop consensus voting'
      ],
      highlightPosition: 'center'
    },
    {
      id: 'step-work-requests',
      title: 'Task Ingestion & Work Requests Pipeline',
      badge: 'LEFT SIDEBAR',
      badgeColor: 'bg-emerald-950/90 text-emerald-300 border-emerald-700/80',
      icon: <Target className="w-6 h-6 text-emerald-400" />,
      subtitle: 'Manage user requests, status filters, and priority queues',
      description: 'Located in the left sidebar, the Work Request list manages incoming user tasks. You can switch active task contexts, filter by lifecycle state, or spawn new tasks into the pipeline.',
      keyPoints: [
        'Click any Work Request card to switch the active IDE execution context',
        'Filter tasks by lifecycle stage: NEW, PLAN, CRITIQUE, SPEC, EXECUTE, VALIDATE',
        'Click "+ New Work Request" to spawn user requests for agent processing'
      ],
      highlightPosition: 'left',
      actionButton: {
        label: 'Spawn Sample Task',
        icon: <Target className="w-3.5 h-3.5" />,
        onClick: () => {
          BackendService.createWorkRequest('Refactor Authentication Engine');
          addToast({
            title: '✨ Work Request Spawned',
            message: 'Created "Refactor Authentication Engine" task.',
            type: 'success'
          });
        }
      }
    },
    {
      id: 'step-timeline',
      title: 'Deterministic Workflow State Machine',
      badge: 'TOP TIMELINE',
      badgeColor: 'bg-amber-950/90 text-amber-300 border-amber-700/80',
      icon: <Activity className="w-6 h-6 text-amber-400" />,
      subtitle: 'Real-time state lifecycle indicator bar',
      description: 'Directly below the top navigation bar, the State Timeline tracks the active task across 6 deterministic stages:',
      keyPoints: [
        '1. NEW ➔ Ingestion & initial intent parsing',
        '2. PLAN ➔ Planner agent decomposes intent into PlanIR steps',
        '3. CRITIQUE ➔ Critic agent evaluates security & architectural risk',
        '4. SPEC ➔ System Architect generates formal technical specs',
        '5. EXECUTE ➔ Coder agent executes code changes & diffs',
        '6. VALIDATE ➔ Validator agent executes automated tests'
      ],
      highlightPosition: 'top'
    },
    {
      id: 'step-planning-critique',
      title: 'Architectural Plan, Critique & Governance',
      badge: 'CENTER-LEFT IDE',
      badgeColor: 'bg-purple-950/90 text-purple-300 border-purple-700/80',
      icon: <Layers className="w-6 h-6 text-purple-400" />,
      subtitle: 'Inspect PlanIR, risk ratings & trigger agent votes',
      description: 'The Plan View presents the step-by-step breakdown generated by the Planner agent, accompanied by the Critic agent\'s risk assessment.',
      keyPoints: [
        'Review individual step risk levels: Low, Medium, or High Risk',
        'Inspect architectural critiques and suggested risk mitigations',
        'Click "Approve PlanIR" or "Roundtable Vote" to convene agent consensus'
      ],
      highlightPosition: 'center',
      actionButton: {
        label: 'Convene Roundtable Vote',
        icon: <Users className="w-3.5 h-3.5" />,
        onClick: () => {
          openRoundtableModal();
          addToast({
            title: '🏛️ Roundtable Voting Convened',
            message: 'Opened multi-agent consensus voting session.',
            type: 'info'
          });
        }
      }
    },
    {
      id: 'step-execution-terminal',
      title: 'Execution Step Diffs & Build Terminal',
      badge: 'CENTER-RIGHT & BOTTOM',
      badgeColor: 'bg-teal-950/90 text-teal-300 border-teal-700/80',
      icon: <Terminal className="w-6 h-6 text-teal-400" />,
      subtitle: 'Live execution outputs, code diffs & compiler terminal',
      description: 'Watch agents write code in real time. The Execution View shows file modifications and code diffs, while the bottom Terminal Panel streams build logs and test suite results.',
      keyPoints: [
        'View step-by-step ExecutionIR results and modified file paths',
        'Inspect live compiler terminal streams and system command outputs',
        'Browse generated project structure in the right File Tree Sidebar'
      ],
      highlightPosition: 'right'
    },
    {
      id: 'step-tools-hotkeys',
      title: 'Governance, D3 Task Graph & Command Palette',
      badge: 'OPERATOR TOOLS',
      badgeColor: 'bg-indigo-950/90 text-indigo-300 border-indigo-700/80',
      icon: <Command className="w-6 h-6 text-indigo-400" />,
      subtitle: 'Power hotkeys and deep inspection tools',
      description: 'Supercharge your operator workflow using built-in system tools and global hotkeys:',
      keyPoints: [
        '⌘K or / ➔ Open Global Command Palette to search actions, tasks, and logs',
        'D3 Task Graph ➔ Interactive topological graph analyzing task waiting bottlenecks',
        'Agent Config Matrix ➔ Customize system prompts, model specs, and temperatures',
        'Theme Surface Toggle ➔ Switch between Steel Slate, Obsidian Dark, and Light themes'
      ],
      highlightPosition: 'top',
      actionButton: {
        label: 'Open D3 Dependency Graph',
        icon: <Workflow className="w-3.5 h-3.5" />,
        onClick: () => {
          openDependencyGraphModal();
          addToast({
            title: '📊 D3 Task Graph Opened',
            message: 'Displaying interactive task dependency topology.',
            type: 'info'
          });
        }
      }
    }
  ];

  if (!isOnboardingOpen) return null;

  const currentStep = tourSteps[currentStepIndex];
  const isLastStep = currentStepIndex === tourSteps.length - 1;
  const progressPercent = Math.round(((currentStepIndex + 1) / tourSteps.length) * 100);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-md font-sans">
        {/* Backdrop dismiss */}
        <div 
          className="absolute inset-0" 
          onClick={closeOnboardingModal}
        />

        {/* Modal Window Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl bg-gray-900 border border-gray-700/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10 text-gray-100"
        >
          {/* Top Header Bar */}
          <div className="px-6 py-4 bg-gray-950/90 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-blue-950/90 border border-blue-800/80 text-blue-400">
                {currentStep.icon}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                    Interactive Tour
                  </span>
                  <span className="text-gray-600">•</span>
                  <span className={cn("px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border", currentStep.badgeColor)}>
                    {currentStep.badge}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-gray-100">{currentStep.title}</h2>
              </div>
            </div>

            <button
              onClick={closeOnboardingModal}
              className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-colors"
              title="Close Tutorial (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Step Progress Bar Indicator */}
          <div className="w-full bg-gray-950 h-1.5 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.3 }}
              className="h-full bg-gradient-to-r from-blue-500 via-teal-400 to-emerald-400 shadow-sm"
            />
          </div>

          {/* Main Content Body */}
          <div className="p-6 space-y-5">
            <div>
              <p className="text-sm font-semibold text-gray-200 mb-1">
                {currentStep.subtitle}
              </p>
              <p className="text-xs text-gray-400 leading-relaxed">
                {currentStep.description}
              </p>
            </div>

            {/* Key Points Bullet List */}
            <div className="bg-gray-950/70 border border-gray-800/90 rounded-xl p-4 space-y-2.5 shadow-inner">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                Key Workflow Concepts
              </span>
              {currentStep.keyPoints.map((point, idx) => (
                <div key={idx} className="flex items-start space-x-2 text-xs text-gray-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{point}</span>
                </div>
              ))}
            </div>

            {/* Interactive Action Button (If available for this step) */}
            {currentStep.actionButton && (
              <div className="pt-1 flex items-center justify-between bg-blue-950/30 border border-blue-800/40 rounded-xl p-3">
                <span className="text-xs text-blue-200 font-medium">
                  Try out this workflow action right now:
                </span>
                <button
                  onClick={() => {
                    currentStep.actionButton?.onClick();
                  }}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow transition-all hover:scale-105 active:scale-95"
                >
                  {currentStep.actionButton.icon}
                  <span>{currentStep.actionButton.label}</span>
                </button>
              </div>
            )}
          </div>

          {/* Step Navigation Dots & Controls Footer */}
          <div className="px-6 py-4 bg-gray-950 border-t border-gray-800 flex items-center justify-between text-xs">
            {/* Step Counter & Dot Nav */}
            <div className="flex items-center space-x-3">
              <span className="text-gray-400 font-mono text-[11px]">
                Step <strong className="text-gray-200">{currentStepIndex + 1}</strong> of {tourSteps.length}
              </span>

              <div className="flex items-center space-x-1.5">
                {tourSteps.map((s, idx) => (
                  <button
                    key={s.id}
                    onClick={() => setCurrentStepIndex(idx)}
                    className={cn(
                      "h-2 rounded-full transition-all",
                      idx === currentStepIndex
                        ? "w-6 bg-blue-500"
                        : "w-2 bg-gray-700 hover:bg-gray-500"
                    )}
                    title={`Jump to step ${idx + 1}: ${s.title}`}
                  />
                ))}
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentStepIndex(prev => Math.max(prev - 1, 0))}
                disabled={currentStepIndex === 0}
                className={cn(
                  "px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all flex items-center space-x-1",
                  currentStepIndex === 0
                    ? "opacity-40 cursor-not-allowed border-gray-800 text-gray-600"
                    : "border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
                )}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              {isLastStep ? (
                <button
                  onClick={closeOnboardingModal}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Get Started</span>
                </button>
              ) : (
                <button
                  onClick={() => setCurrentStepIndex(prev => Math.min(prev + 1, tourSteps.length - 1))}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-1.5"
                >
                  <span>Next Step</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
