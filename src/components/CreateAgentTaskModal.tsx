import React, { useState } from 'react';
import { useSimulation } from '../hooks/useSimulation';
import { 
  X, Plus, Sparkles, Layers, Split, Code2, 
  Clock, ShieldAlert, Cpu, Check, FileText 
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { AgentTaskItem } from '../types';

interface CreateAgentTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateAgentTaskModal({ isOpen, onClose }: CreateAgentTaskModalProps) {
  const { addTaskToQueue, agentTaskQueue } = useSimulation();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedAgent, setAssignedAgent] = useState<'architect' | 'builder'>('architect');
  const [priority, setPriority] = useState<AgentTaskItem['priority']>('high');
  const [model, setModel] = useState('claude-3-7-sonnet');
  const [estimatedDurationMs, setEstimatedDurationMs] = useState(2000);
  const [selectedDependencies, setSelectedDependencies] = useState<string[]>([]);
  const [outputFile, setOutputFile] = useState('');
  const [outputsList, setOutputsList] = useState<string[]>([]);
  const [substepsList, setSubstepsList] = useState<string[]>([
    'Analyze operator constraints and spec invariants',
    'Execute synthesis and code compilation pipeline',
    'Verify AST signature and emit compliance report'
  ]);
  const [newSubstepText, setNewSubstepText] = useState('');

  if (!isOpen) return null;

  const handleAddOutput = () => {
    if (outputFile.trim()) {
      setOutputsList([...outputsList, outputFile.trim()]);
      setOutputFile('');
    }
  };

  const handleRemoveOutput = (idx: number) => {
    setOutputsList(outputsList.filter((_, i) => i !== idx));
  };

  const handleAddSubstep = () => {
    if (newSubstepText.trim()) {
      setSubstepsList([...substepsList, newSubstepText.trim()]);
      setNewSubstepText('');
    }
  };

  const handleRemoveSubstep = (idx: number) => {
    setSubstepsList(substepsList.filter((_, i) => i !== idx));
  };

  const toggleDependency = (id: string) => {
    if (selectedDependencies.includes(id)) {
      setSelectedDependencies(selectedDependencies.filter(d => d !== id));
    } else {
      setSelectedDependencies([...selectedDependencies, id]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const isArch = assignedAgent === 'architect';

    addTaskToQueue({
      title: title.trim(),
      description: description.trim() || 'Custom decomposed task unit for multi-agent pipeline.',
      assignedAgent,
      agentId: isArch ? 'a5' : 'a3',
      agentName: isArch ? 'Architect' : 'Coder / Builder',
      agentRole: isArch ? 'System Architect' : 'Lead Builder',
      model,
      priority,
      status: 'pending',
      progress: 0,
      estimatedDurationMs,
      dependencies: selectedDependencies,
      outputs: outputsList.length > 0 ? outputsList : (isArch ? ['docs/architecture-spec.json'] : ['src/components/GeneratedModule.tsx']),
      substeps: substepsList.map((s, idx) => ({
        id: `sub-custom-${Date.now()}-${idx}`,
        name: s,
        status: 'pending'
      }))
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-gray-200"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 bg-gray-950/60 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-blue-400">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-100">Enqueue New Agent Sub-Task</h2>
              <p className="text-[11px] text-gray-400">Assign discrete execution units to Architect or Builder</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Agent Selection Card */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">Assignee Agent Role</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setAssignedAgent('architect');
                  setModel('claude-3-7-sonnet');
                }}
                className={cn(
                  "p-3 rounded-xl border text-left transition-all flex items-start space-x-3",
                  assignedAgent === 'architect'
                    ? "bg-indigo-950/80 border-indigo-500 text-white shadow-sm ring-1 ring-indigo-500/50"
                    : "bg-gray-950/60 border-gray-800 text-gray-400 hover:border-gray-700"
                )}
              >
                <div className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                  assignedAgent === 'architect' ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-400"
                )}>
                  <Split className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold">System Architect</div>
                  <div className="text-[10px] text-gray-400">Decomposition, schema formulation & safety AST</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAssignedAgent('builder');
                  setModel('qwen2.5-coder:latest');
                }}
                className={cn(
                  "p-3 rounded-xl border text-left transition-all flex items-start space-x-3",
                  assignedAgent === 'builder'
                    ? "bg-teal-950/80 border-teal-500 text-white shadow-sm ring-1 ring-teal-500/50"
                    : "bg-gray-950/60 border-gray-800 text-gray-400 hover:border-gray-700"
                )}
              >
                <div className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                  assignedAgent === 'builder' ? "bg-teal-600 text-white" : "bg-gray-800 text-gray-400"
                )}>
                  <Code2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold">Lead Builder</div>
                  <div className="text-[10px] text-gray-400">Code synthesis, RxJS pipes & tests</div>
                </div>
              </button>
            </div>
          </div>

          {/* Task Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-300">Task Title <span className="text-rose-400">*</span></label>
            <input 
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Synthesize Zero-Trust Auth Session Storage Coordinator"
              className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3.5 py-2 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-300">Scope Description</label>
            <textarea 
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail operational constraints, AST expectations, and verification invariants..."
              className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3.5 py-2 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
            />
          </div>

          {/* Grid: Priority, Model, Duration */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-300">Priority Level</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-300">Target Model</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500 font-mono"
              >
                <option value="claude-3-7-sonnet">claude-3-7-sonnet</option>
                <option value="qwen2.5-coder:latest">qwen2.5-coder</option>
                <option value="gemini-2.5-pro">gemini-2.5-pro</option>
                <option value="deepseek-r1">deepseek-r1</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-300">Est. Time (ms)</label>
              <input 
                type="number"
                step={200}
                min={400}
                max={15000}
                value={estimatedDurationMs}
                onChange={(e) => setEstimatedDurationMs(Number(e.target.value))}
                className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          {/* Sub-Steps List */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">Sub-Steps Checklist</label>
            <div className="space-y-1.5">
              {substepsList.map((step, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-gray-950 rounded-lg border border-gray-800 text-xs">
                  <div className="flex items-center space-x-2 truncate">
                    <span className="font-mono text-gray-500 font-bold text-[10px]">{idx + 1}.</span>
                    <span className="truncate text-gray-300">{step}</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => handleRemoveSubstep(idx)}
                    className="text-gray-500 hover:text-rose-400 p-1 rounded"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <input 
                type="text"
                value={newSubstepText}
                onChange={(e) => setNewSubstepText(e.target.value)}
                placeholder="Add sub-step execution milestone..."
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubstep(); } }}
                className="flex-1 bg-gray-950 border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500"
              />
              <button 
                type="button"
                onClick={handleAddSubstep}
                className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs font-semibold text-gray-200 border border-gray-700"
              >
                + Add Step
              </button>
            </div>
          </div>

          {/* Upstream Prerequisites Selection */}
          {agentTaskQueue.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                Prerequisite Upstream Dependencies (Optional)
              </label>
              <div className="max-h-32 overflow-y-auto space-y-1 p-2 bg-gray-950 border border-gray-800 rounded-xl">
                {agentTaskQueue.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleDependency(t.id)}
                    className={cn(
                      "w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors",
                      selectedDependencies.includes(t.id)
                        ? "bg-blue-950 border border-blue-600 text-blue-200 font-semibold"
                        : "hover:bg-gray-900 text-gray-400"
                    )}
                  >
                    <span className="truncate">{t.id}: {t.title}</span>
                    {selectedDependencies.includes(t.id) && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Output Artifacts */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">Output File Paths</label>
            <div className="flex items-center space-x-2">
              <input 
                type="text"
                value={outputFile}
                onChange={(e) => setOutputFile(e.target.value)}
                placeholder="e.g., src/services/AuthService.ts"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddOutput(); } }}
                className="flex-1 bg-gray-950 border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-gray-200 font-mono focus:outline-none focus:border-blue-500"
              />
              <button 
                type="button"
                onClick={handleAddOutput}
                className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs font-semibold text-gray-200 border border-gray-700"
              >
                + Add Output
              </button>
            </div>

            {outputsList.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {outputsList.map((out, idx) => (
                  <span key={idx} className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-gray-800 text-[11px] font-mono text-gray-300 border border-gray-700">
                    <FileText className="w-3 h-3 text-blue-400" />
                    <span>{out}</span>
                    <button type="button" onClick={() => handleRemoveOutput(idx)} className="text-gray-500 hover:text-rose-400">
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-gray-800 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white border border-blue-400 shadow-md transition-all flex items-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Enqueue Sub-Task</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
