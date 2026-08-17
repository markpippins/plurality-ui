import React, { useState, useEffect } from 'react';
import { AgentConfigTemplate, AgentArchetypeCategory, ActiveAgent } from '../types';
import { AgentTemplateService } from '../services/AgentTemplateService';
import { X, Save, Bookmark, Sliders, Tag, Terminal, Flame, Shield, Cpu, HardDrive, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface SaveTemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: Partial<ActiveAgent> & { name?: string; role?: string };
  existingTemplateToEdit?: AgentConfigTemplate | null;
  onSaved: (template: AgentConfigTemplate) => void;
}

const CATEGORY_OPTIONS: Array<{ id: AgentArchetypeCategory; label: string; iconColor: string }> = [
  { id: 'planning', label: 'Planning & Decomposition', iconColor: 'text-cyan-400' },
  { id: 'architecture', label: 'System Architecture', iconColor: 'text-indigo-400' },
  { id: 'security', label: 'Security & Integrity', iconColor: 'text-rose-400' },
  { id: 'engineering', label: 'Code Engineering', iconColor: 'text-purple-400' },
  { id: 'quality', label: 'Quality & Verification', iconColor: 'text-emerald-400' },
  { id: 'data', label: 'Data & Database', iconColor: 'text-amber-400' },
  { id: 'topology', label: 'Network Topology', iconColor: 'text-teal-400' },
  { id: 'reasoning', label: 'Epistemic Reasoning', iconColor: 'text-blue-400' },
  { id: 'custom', label: 'Custom Archetype', iconColor: 'text-gray-400' }
];

export function SaveTemplateDialog({
  isOpen,
  onClose,
  initialData,
  existingTemplateToEdit,
  onSaved
}: SaveTemplateDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [archetype, setArchetype] = useState<AgentArchetypeCategory>('custom');
  const [role, setRole] = useState('');
  const [flavor, setFlavor] = useState<'leased' | 'harness'>('leased');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [topP, setTopP] = useState(0.9);
  const [maxTokens, setMaxTokens] = useState(4096);
  const [avatarPrompt, setAvatarPrompt] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (existingTemplateToEdit) {
      setName(existingTemplateToEdit.name);
      setDescription(existingTemplateToEdit.description || '');
      setArchetype(existingTemplateToEdit.archetype);
      setRole(existingTemplateToEdit.role);
      setFlavor(existingTemplateToEdit.flavor);
      setSystemPrompt(existingTemplateToEdit.systemPrompt);
      setTemperature(existingTemplateToEdit.temperature);
      setTopP(existingTemplateToEdit.topP);
      setMaxTokens(existingTemplateToEdit.maxTokens);
      setAvatarPrompt(existingTemplateToEdit.avatarPrompt || '');
      setTags(existingTemplateToEdit.tags || []);
    } else if (initialData) {
      setName(initialData.name ? `${initialData.name} Archetype Template` : 'Custom Agent Archetype');
      setDescription(`Configuration template based on ${initialData.name || 'Agent'} with role ${initialData.role || 'Specialist'}.`);
      setRole(initialData.role || 'Specialist');
      setFlavor(initialData.flavor || 'leased');
      setSystemPrompt(initialData.systemPrompt || '');
      setTemperature(initialData.temperature ?? 0.7);
      setTopP(initialData.topP ?? 0.9);
      setMaxTokens(initialData.maxTokens ?? 4096);
      setAvatarPrompt(initialData.avatarPrompt || '');
      setTags([initialData.role ? initialData.role.toLowerCase().replace(/\s+/g, '-') : 'custom']);

      // Heuristic archetype determination based on role
      const lowerRole = (initialData.role || '').toLowerCase();
      if (lowerRole.includes('plan') || lowerRole.includes('sequenc')) setArchetype('planning');
      else if (lowerRole.includes('arch') || lowerRole.includes('system')) setArchetype('architecture');
      else if (lowerRole.includes('sec') || lowerRole.includes('audit') || lowerRole.includes('review') || lowerRole.includes('critic')) setArchetype('security');
      else if (lowerRole.includes('code') || lowerRole.includes('build') || lowerRole.includes('dev')) setArchetype('engineering');
      else if (lowerRole.includes('qa') || lowerRole.includes('test') || lowerRole.includes('valid')) setArchetype('quality');
      else if (lowerRole.includes('db') || lowerRole.includes('data') || lowerRole.includes('sql')) setArchetype('data');
      else if (lowerRole.includes('topo') || lowerRole.includes('graph') || lowerRole.includes('network')) setArchetype('topology');
      else if (lowerRole.includes('reason') || lowerRole.includes('epistem')) setArchetype('reasoning');
      else setArchetype('custom');
    }
  }, [existingTemplateToEdit, initialData, isOpen]);

  if (!isOpen) return null;

  const handleAddTag = () => {
    const trimmed = tagInput.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSave = () => {
    if (!name.trim()) {
      setErrorMsg('Please specify a valid template name.');
      return;
    }
    if (!systemPrompt.trim()) {
      setErrorMsg('System prompt instructions cannot be empty.');
      return;
    }

    setErrorMsg(null);

    let saved: AgentConfigTemplate | null = null;
    if (existingTemplateToEdit && !existingTemplateToEdit.isBuiltIn) {
      saved = AgentTemplateService.updateCustomTemplate(existingTemplateToEdit.id, {
        name: name.trim(),
        description: description.trim(),
        archetype,
        role: role.trim() || 'Specialist',
        flavor,
        systemPrompt: systemPrompt.trim(),
        temperature,
        topP,
        maxTokens,
        avatarPrompt: avatarPrompt.trim() || undefined,
        tags
      });
    } else {
      saved = AgentTemplateService.saveCustomTemplate({
        name: name.trim(),
        description: description.trim(),
        archetype,
        role: role.trim() || 'Specialist',
        flavor,
        systemPrompt: systemPrompt.trim(),
        temperature,
        topP,
        maxTokens,
        avatarPrompt: avatarPrompt.trim() || undefined,
        tags
      });
    }

    if (saved) {
      onSaved(saved);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-gray-900 border border-gray-700/80 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] text-gray-100"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-800 bg-gray-950/80 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-purple-600/20 border border-purple-500/40 text-purple-400">
                <Bookmark className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-100">
                  {existingTemplateToEdit ? 'Edit Archetype Template' : 'Save Agent Configuration as Template'}
                </h3>
                <p className="text-xs text-gray-400">
                  Store hyper-parameters and system instructions for reusable agent instantiations.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
            {errorMsg && (
              <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-lg text-red-300 flex items-center space-x-2">
                <span>⚠️ {errorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-gray-300 block mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Strict OWASP Security Auditor v2"
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-300 block mb-1">
                  Role Title
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  placeholder="e.g. Application Security Reviewer"
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-gray-300 block mb-1">
                  Archetype Category
                </label>
                <select
                  value={archetype}
                  onChange={e => setArchetype(e.target.value as AgentArchetypeCategory)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:border-purple-500"
                >
                  {CATEGORY_OPTIONS.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-gray-300 block mb-1">
                  Role Flavor (Lifecycle)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFlavor('leased')}
                    className={cn(
                      "px-2.5 py-1.5 rounded-lg border font-semibold flex items-center justify-center space-x-1.5 transition-all",
                      flavor === 'leased'
                        ? "bg-blue-950/80 text-blue-200 border-blue-500"
                        : "bg-gray-950 text-gray-400 border-gray-800"
                    )}
                  >
                    <span>Leased (Ephemeral)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFlavor('harness')}
                    className={cn(
                      "px-2.5 py-1.5 rounded-lg border font-semibold flex items-center justify-center space-x-1.5 transition-all",
                      flavor === 'harness'
                        ? "bg-amber-950/80 text-amber-200 border-amber-500"
                        : "bg-gray-950 text-gray-400 border-gray-800"
                    )}
                  >
                    <span>Harness (Anchored)</span>
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="font-semibold text-gray-300 block mb-1">
                Template Description
              </label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Brief summary of what this agent archetype is optimized for..."
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="font-semibold text-gray-300 block mb-1">
                System Instructions / Prompt *
              </label>
              <textarea
                rows={5}
                value={systemPrompt}
                onChange={e => setSystemPrompt(e.target.value)}
                placeholder="Core role specifications, behavioral constraints, and instructions..."
                className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 font-mono text-gray-200 focus:outline-none focus:border-purple-500 resize-none leading-relaxed"
              />
            </div>

            {/* Hyperparameters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gray-950/60 p-3 rounded-lg border border-gray-800">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-gray-400 font-semibold">Temperature</label>
                  <span className="font-mono text-amber-400">{temperature.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={temperature}
                  onChange={e => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-gray-400 font-semibold">Top-P</label>
                  <span className="font-mono text-purple-400">{topP.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={topP}
                  onChange={e => setTopP(parseFloat(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-gray-400 font-semibold">Max Tokens</label>
                  <span className="font-mono text-cyan-400">{maxTokens}</span>
                </div>
                <input
                  type="number"
                  step="1024"
                  min="1024"
                  max="16384"
                  value={maxTokens}
                  onChange={e => setMaxTokens(parseInt(e.target.value) || 4096)}
                  className="w-full bg-gray-900 border border-gray-800 rounded px-2 py-1 text-xs text-gray-200 focus:outline-none font-mono"
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="font-semibold text-gray-300 block mb-1">
                Archetype Tags
              </label>
              <div className="flex items-center space-x-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Type tag and press Add (e.g. owasp, testing, react)"
                  className="flex-1 bg-gray-950 border border-gray-800 rounded-lg px-3 py-1.5 text-gray-200 focus:outline-none focus:border-purple-500"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg font-medium transition-colors"
                >
                  Add Tag
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {tags.map(t => (
                  <span
                    key={t}
                    className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-800/80 text-[11px]"
                  >
                    <span>#{t}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="hover:text-purple-100 text-purple-400"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-800 bg-gray-950/80 flex items-center justify-between">
            <span className="text-[11px] text-gray-500 flex items-center space-x-1">
              <HardDrive className="w-3 h-3 text-emerald-400" />
              <span>Persisted to LocalStorage</span>
            </span>

            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold flex items-center space-x-1.5 transition-colors shadow-md"
              >
                <Save className="w-4 h-4" />
                <span>{existingTemplateToEdit ? 'Save Changes' : 'Save Template'}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
