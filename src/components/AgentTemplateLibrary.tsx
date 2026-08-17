import React, { useState, useMemo } from 'react';
import { AgentConfigTemplate, AgentArchetypeCategory, ActiveAgent } from '../types';
import { AgentTemplateService, BUILTIN_ARCHETYPE_TEMPLATES } from '../services/AgentTemplateService';
import { 
  X, Search, Filter, Bookmark, Sparkles, Check, 
  Copy, Download, Upload, Trash2, Edit3, Plus, 
  Flame, Terminal, Zap, Shield, Cpu, Layers, HardDrive, Share2, Compass, Eye,
  RotateCcw
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { SaveTemplateDialog } from './SaveTemplateDialog';

interface AgentTemplateLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTemplate: (template: AgentConfigTemplate, targetMode: 'current' | 'new') => void;
  currentAgentName: string;
  currentAgentRole: string;
  currentAgentData: Partial<ActiveAgent>;
  onToast: (toast: { title: string; message: string; type: 'info' | 'success' | 'warn' | 'error' }) => void;
}

const CATEGORIES: Array<{ id: AgentArchetypeCategory | 'all' | 'custom_only'; label: string; icon: any; color: string }> = [
  { id: 'all', label: 'All Templates', icon: Layers, color: 'text-purple-400' },
  { id: 'planning', label: 'Planning & Decomposition', icon: Compass, color: 'text-cyan-400' },
  { id: 'architecture', label: 'System Architecture', icon: Layers, color: 'text-indigo-400' },
  { id: 'security', label: 'Security & Integrity', icon: Shield, color: 'text-rose-400' },
  { id: 'engineering', label: 'Code Engineering', icon: Terminal, color: 'text-purple-400' },
  { id: 'quality', label: 'Quality & Testing', icon: Zap, color: 'text-emerald-400' },
  { id: 'data', label: 'Data & DBA', icon: HardDrive, color: 'text-amber-400' },
  { id: 'topology', label: 'Network Topology', icon: Cpu, color: 'text-teal-400' },
  { id: 'reasoning', label: 'Epistemic Reasoning', icon: Sparkles, color: 'text-blue-400' },
  { id: 'custom_only', label: 'My Custom Saved', icon: Bookmark, color: 'text-yellow-400' }
];

export function AgentTemplateLibrary({
  isOpen,
  onClose,
  onApplyTemplate,
  currentAgentName,
  currentAgentRole,
  currentAgentData,
  onToast
}: AgentTemplateLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<AgentArchetypeCategory | 'all' | 'custom_only'>('all');
  const [allTemplates, setAllTemplates] = useState<AgentConfigTemplate[]>(() => AgentTemplateService.getAllTemplates());
  
  // Modals inside template library
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<AgentConfigTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<AgentConfigTemplate | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');

  const refreshTemplates = () => {
    setAllTemplates(AgentTemplateService.getAllTemplates());
  };

  const filteredTemplates = useMemo(() => {
    return allTemplates.filter(tmpl => {
      // Category filter
      if (selectedCategory === 'custom_only') {
        if (tmpl.isBuiltIn) return false;
      } else if (selectedCategory !== 'all') {
        if (tmpl.archetype !== selectedCategory) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = tmpl.name.toLowerCase().includes(q);
        const matchesRole = tmpl.role.toLowerCase().includes(q);
        const matchesDesc = (tmpl.description || '').toLowerCase().includes(q);
        const matchesTags = (tmpl.tags || []).some(t => t.toLowerCase().includes(q));
        const matchesPrompt = tmpl.systemPrompt.toLowerCase().includes(q);
        return matchesName || matchesRole || matchesDesc || matchesTags || matchesPrompt;
      }

      return true;
    });
  }, [allTemplates, selectedCategory, searchQuery]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allTemplates.length, custom_only: 0 };
    for (const cat of CATEGORIES) {
      if (cat.id !== 'all' && cat.id !== 'custom_only') {
        counts[cat.id] = 0;
      }
    }
    for (const t of allTemplates) {
      if (!t.isBuiltIn) {
        counts['custom_only'] = (counts['custom_only'] || 0) + 1;
      }
      if (t.archetype) {
        counts[t.archetype] = (counts[t.archetype] || 0) + 1;
      }
    }
    return counts;
  }, [allTemplates]);

  if (!isOpen) return null;

  const handleApply = (template: AgentConfigTemplate, mode: 'current' | 'new') => {
    onApplyTemplate(template, mode);
    onToast({
      title: `⚡ Template Applied: ${template.name}`,
      message: mode === 'current' 
        ? `Loaded configuration template into ${currentAgentName} (${template.role}).`
        : `Instantiated new agent builder pre-filled with ${template.name}.`,
      type: 'success'
    });
  };

  const handleDuplicate = (template: AgentConfigTemplate) => {
    const cloned = AgentTemplateService.duplicateTemplate(template.id);
    if (cloned) {
      refreshTemplates();
      onToast({
        title: '📋 Template Cloned',
        message: `Created custom duplicate: "${cloned.name}".`,
        type: 'success'
      });
    }
  };

  const handleDelete = (templateId: string, templateName: string) => {
    if (confirm(`Are you sure you want to permanently delete custom template "${templateName}"?`)) {
      AgentTemplateService.deleteCustomTemplate(templateId);
      refreshTemplates();
      onToast({
        title: '🗑️ Template Deleted',
        message: `Removed "${templateName}" from custom templates.`,
        type: 'info'
      });
    }
  };

  const handleCopyPrompt = (template: AgentConfigTemplate) => {
    navigator.clipboard.writeText(template.systemPrompt);
    onToast({
      title: '📋 Copied System Prompt',
      message: `System prompt for "${template.name}" copied to clipboard.`,
      type: 'info'
    });
  };

  const handleExportJSON = () => {
    const jsonStr = AgentTemplateService.exportTemplatesAsJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plurality-agent-templates-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    onToast({
      title: '💾 Templates Exported',
      message: 'Downloaded all configuration templates as JSON file.',
      type: 'success'
    });
  };

  const handleImportSubmit = () => {
    if (!importJsonText.trim()) {
      onToast({
        title: '⚠️ Empty JSON',
        message: 'Please paste JSON template data to import.',
        type: 'warn'
      });
      return;
    }

    const res = AgentTemplateService.importTemplatesFromJSON(importJsonText);
    if (res.success) {
      refreshTemplates();
      setIsImportModalOpen(false);
      setImportJsonText('');
      onToast({
        title: '✨ Templates Imported',
        message: res.message,
        type: 'success'
      });
    } else {
      onToast({
        title: '❌ Import Failed',
        message: res.message,
        type: 'error'
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setImportJsonText(content);
      }
    };
    reader.readAsText(file);
  };

  const getArchetypeBadgeColor = (archetype: AgentArchetypeCategory) => {
    switch (archetype) {
      case 'planning': return 'bg-cyan-950/80 text-cyan-300 border-cyan-800';
      case 'architecture': return 'bg-indigo-950/80 text-indigo-300 border-indigo-800';
      case 'security': return 'bg-rose-950/80 text-rose-300 border-rose-800';
      case 'engineering': return 'bg-purple-950/80 text-purple-300 border-purple-800';
      case 'quality': return 'bg-emerald-950/80 text-emerald-300 border-emerald-800';
      case 'data': return 'bg-amber-950/80 text-amber-300 border-amber-800';
      case 'topology': return 'bg-teal-950/80 text-teal-300 border-teal-800';
      case 'reasoning': return 'bg-blue-950/80 text-blue-300 border-blue-800';
      default: return 'bg-gray-950/80 text-gray-300 border-gray-800';
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/85 backdrop-blur-md">
        <motion.div 
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.2 }}
          className="bg-gray-900 border border-gray-700/90 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden text-gray-100"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-800 bg-gray-900/95 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-400">
                <Bookmark className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-base font-bold text-gray-100 tracking-wide">
                    Agent Archetype & Configuration Template Library
                  </h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800">
                    {allTemplates.length} Templates
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  Save, customize, and load battle-tested agent archetype matrices and hyper-parameters.
                </p>
              </div>
            </div>

            {/* Top action buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setEditingTemplate(null);
                  setIsSaveModalOpen(true);
                }}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-sm"
                title="Save current agent parameters as a reusable template"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save Current as Template</span>
              </button>

              <button
                onClick={handleExportJSON}
                className="px-2.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors"
                title="Export all templates as JSON"
              >
                <Download className="w-3.5 h-3.5 text-gray-400" />
                <span>Export</span>
              </button>

              <button
                onClick={() => setIsImportModalOpen(true)}
                className="px-2.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors"
                title="Import templates from JSON"
              >
                <Upload className="w-3.5 h-3.5 text-gray-400" />
                <span>Import</span>
              </button>

              <button 
                onClick={onClose}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors ml-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Subheader: Target Agent & Search */}
          <div className="px-6 py-3 bg-gray-950/90 border-b border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
            {/* Active Target Info */}
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-gray-400">Current Target Agent:</span>
              <span className="px-2 py-0.5 rounded bg-purple-950/80 text-purple-200 font-semibold border border-purple-800">
                {currentAgentName}
              </span>
              <span className="text-gray-500 font-mono">({currentAgentRole})</span>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search templates, roles, tags, prompts..."
                className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-8 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-purple-500 placeholder-gray-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-xs"
                >
                  &times;
                </button>
              )}
            </div>
          </div>

          {/* Main Body: Categories Sidebar + Grid View */}
          <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            {/* Categories Sidebar */}
            <div className="w-full md:w-56 bg-gray-950/60 border-r border-gray-800 p-3 space-y-1 overflow-y-auto shrink-0">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider px-2 py-1 block">
                Archetype Categories
              </span>

              {CATEGORIES.map(cat => {
                const IconComponent = cat.icon;
                const count = categoryCounts[cat.id] || 0;
                const isSelected = selectedCategory === cat.id;

                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all text-left",
                      isSelected
                        ? "bg-purple-950/80 text-purple-200 border border-purple-800/80 shadow-sm"
                        : "text-gray-400 hover:text-gray-200 hover:bg-gray-900/60 border border-transparent"
                    )}
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <IconComponent className={cn("w-3.5 h-3.5 shrink-0", cat.color)} />
                      <span className="truncate">{cat.label}</span>
                    </div>
                    <span className={cn(
                      "text-[10px] font-mono px-1.5 py-0.2 rounded-full",
                      isSelected ? "bg-purple-900 text-purple-200" : "bg-gray-800 text-gray-400"
                    )}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Template Cards Grid */}
            <div className="flex-1 p-6 overflow-y-auto bg-gray-900/40">
              {filteredTemplates.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-gray-500 space-y-3">
                  <Bookmark className="w-10 h-10 text-gray-600" />
                  <p className="text-sm font-semibold text-gray-400">No configuration templates found</p>
                  <p className="text-xs max-w-sm">
                    {searchQuery 
                      ? `No templates matched "${searchQuery}". Try a different keyword or reset filters.`
                      : 'No templates in this category yet. Click "Save Current as Template" to create one!'}
                  </p>
                  {searchQuery && (
                    <button
                      onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                      className="text-xs text-purple-400 hover:text-purple-300 underline"
                    >
                      Clear search and show all templates
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {filteredTemplates.map(tmpl => {
                    const isBuiltIn = tmpl.isBuiltIn;
                    const badgeColor = getArchetypeBadgeColor(tmpl.archetype);

                    return (
                      <div
                        key={tmpl.id}
                        className="bg-gray-950/80 border border-gray-800 hover:border-gray-700/80 rounded-xl p-4 flex flex-col justify-between space-y-3.5 transition-all shadow-md group"
                      >
                        {/* Top: Badges & Title */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-1.5">
                              <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border", badgeColor)}>
                                {tmpl.archetype}
                              </span>
                              <span className={cn(
                                "text-[10px] font-semibold px-2 py-0.5 rounded border",
                                tmpl.flavor === 'harness'
                                  ? "bg-amber-950/80 text-amber-300 border-amber-800"
                                  : "bg-blue-950/80 text-blue-300 border-blue-800"
                              )}>
                                {tmpl.flavor === 'harness' ? 'Harness (Anchored)' : 'Leased (Ephemeral)'}
                              </span>
                              {isBuiltIn ? (
                                <span className="text-[10px] font-mono text-gray-500 bg-gray-900 px-1.5 py-0.5 rounded border border-gray-800">
                                  Curated Archetype
                                </span>
                              ) : (
                                <span className="text-[10px] font-mono text-yellow-400 bg-yellow-950/60 px-1.5 py-0.5 rounded border border-yellow-800">
                                  Custom Saved
                                </span>
                              )}
                            </div>

                            {/* Options for Custom template */}
                            {!isBuiltIn && (
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={() => {
                                    setEditingTemplate(tmpl);
                                    setIsSaveModalOpen(true);
                                  }}
                                  className="p-1 text-gray-400 hover:text-purple-300 hover:bg-gray-900 rounded transition-colors"
                                  title="Edit Template"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(tmpl.id, tmpl.name)}
                                  className="p-1 text-gray-400 hover:text-red-400 hover:bg-gray-900 rounded transition-colors"
                                  title="Delete Template"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>

                          <h3 className="text-sm font-bold text-gray-100 group-hover:text-purple-300 transition-colors">
                            {tmpl.name}
                          </h3>
                          <span className="text-xs text-purple-400 font-mono font-medium block mt-0.5">
                            {tmpl.role}
                          </span>

                          <p className="text-xs text-gray-400 mt-2 line-clamp-2 leading-relaxed">
                            {tmpl.description || 'Pre-configured agent parameter matrix and role prompts.'}
                          </p>
                        </div>

                        {/* Specs & Hyperparameters Bar */}
                        <div className="bg-gray-900/90 rounded-lg p-2.5 border border-gray-800/80 grid grid-cols-3 gap-2 text-xs">
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-gray-500 block">Temperature</span>
                            <div className="flex items-center space-x-1 font-mono font-bold text-amber-400">
                              <Flame className="w-3 h-3 text-amber-500" />
                              <span>{tmpl.temperature.toFixed(2)}</span>
                            </div>
                          </div>

                          <div className="space-y-0.5">
                            <span className="text-[10px] text-gray-500 block">Top-P</span>
                            <div className="flex items-center space-x-1 font-mono font-bold text-purple-300">
                              <Zap className="w-3 h-3 text-purple-400" />
                              <span>{tmpl.topP.toFixed(2)}</span>
                            </div>
                          </div>

                          <div className="space-y-0.5">
                            <span className="text-[10px] text-gray-500 block">Max Tokens</span>
                            <div className="flex items-center space-x-1 font-mono font-bold text-cyan-300">
                              <Cpu className="w-3 h-3 text-cyan-400" />
                              <span>{tmpl.maxTokens}</span>
                            </div>
                          </div>
                        </div>

                        {/* Tags */}
                        {tmpl.tags && tmpl.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {tmpl.tags.map(t => (
                              <span key={t} className="text-[10px] font-mono text-gray-400 bg-gray-900 px-1.5 py-0.2 rounded border border-gray-800">
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="pt-2 border-t border-gray-800/80 flex items-center justify-between gap-2">
                          <div className="flex items-center space-x-1.5">
                            <button
                              onClick={() => setPreviewTemplate(tmpl)}
                              className="px-2 py-1 bg-gray-900 hover:bg-gray-800 text-gray-300 border border-gray-800 rounded text-xs font-medium transition-colors flex items-center space-x-1"
                              title="Inspect system prompt instructions"
                            >
                              <Eye className="w-3 h-3 text-gray-400" />
                              <span>Inspect</span>
                            </button>

                            <button
                              onClick={() => handleCopyPrompt(tmpl)}
                              className="px-2 py-1 bg-gray-900 hover:bg-gray-800 text-gray-300 border border-gray-800 rounded text-xs font-medium transition-colors flex items-center space-x-1"
                              title="Copy system prompt"
                            >
                              <Copy className="w-3 h-3 text-gray-400" />
                              <span>Copy</span>
                            </button>

                            <button
                              onClick={() => handleDuplicate(tmpl)}
                              className="px-2 py-1 bg-gray-900 hover:bg-gray-800 text-gray-300 border border-gray-800 rounded text-xs font-medium transition-colors flex items-center space-x-1"
                              title="Duplicate as new custom template"
                            >
                              <Share2 className="w-3 h-3 text-gray-400" />
                              <span>Clone</span>
                            </button>
                          </div>

                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                handleApply(tmpl, 'new');
                                onClose();
                              }}
                              className="px-2.5 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 border border-emerald-700/80 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1"
                              title="Create a new agent using this template"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Load into +New</span>
                            </button>

                            <button
                              onClick={() => {
                                handleApply(tmpl, 'current');
                                onClose();
                              }}
                              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1 shadow-sm"
                              title={`Apply all configuration parameters to ${currentAgentName}`}
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Apply to {currentAgentName}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-gray-800 bg-gray-950/90 flex items-center justify-between text-xs text-gray-400 shrink-0">
            <div className="flex items-center space-x-3">
              <span className="flex items-center space-x-1 text-gray-400">
                <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                <span>Custom templates saved in browser LocalStorage</span>
              </span>
            </div>

            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold rounded-lg transition-colors"
            >
              Close Library
            </button>
          </div>
        </motion.div>
      </div>

      {/* Save / Edit Template Modal */}
      {isSaveModalOpen && (
        <SaveTemplateDialog
          isOpen={isSaveModalOpen}
          onClose={() => {
            setIsSaveModalOpen(false);
            setEditingTemplate(null);
          }}
          initialData={currentAgentData}
          existingTemplateToEdit={editingTemplate}
          onSaved={(savedTmpl) => {
            refreshTemplates();
            onToast({
              title: '💾 Template Saved',
              message: `Configuration template "${savedTmpl.name}" saved successfully.`,
              type: 'success'
            });
          }}
        />
      )}

      {/* Inspect System Prompt Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] text-gray-100">
            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-gray-950/90">
              <div>
                <h3 className="text-sm font-bold text-gray-100">{previewTemplate.name}</h3>
                <span className="text-xs text-purple-400 font-mono">{previewTemplate.role}</span>
              </div>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="p-1 rounded text-gray-400 hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div>
                <span className="font-semibold text-gray-400 block mb-1">Description</span>
                <p className="text-gray-200 bg-gray-950 p-2.5 rounded border border-gray-800">
                  {previewTemplate.description}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-gray-400">System Instructions Prompt</span>
                  <button
                    onClick={() => handleCopyPrompt(previewTemplate)}
                    className="text-purple-400 hover:text-purple-300 flex items-center space-x-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </button>
                </div>
                <pre className="p-3.5 bg-gray-950 border border-gray-800 rounded-lg font-mono text-gray-200 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
                  {previewTemplate.systemPrompt}
                </pre>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-gray-800 bg-gray-950/90 flex justify-end space-x-2 text-xs">
              <button
                onClick={() => setPreviewTemplate(null)}
                className="px-4 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg font-medium"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleApply(previewTemplate, 'current');
                  setPreviewTemplate(null);
                  onClose();
                }}
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold"
              >
                Apply to {currentAgentName}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import JSON Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[85vh] text-gray-100">
            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-gray-950/90">
              <div className="flex items-center space-x-2">
                <Upload className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-gray-100">Import Configuration Templates</h3>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-1 rounded text-gray-400 hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-gray-300 block mb-1.5">
                  Upload .json File
                </label>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2 text-gray-400 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-purple-950 file:text-purple-300 hover:file:bg-purple-900"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-300 block mb-1.5">
                  Or Paste JSON Array
                </label>
                <textarea
                  rows={8}
                  value={importJsonText}
                  onChange={e => setImportJsonText(e.target.value)}
                  placeholder='[ { "name": "Strict Auditor", "archetype": "security", "role": "Reviewer", "systemPrompt": "...", "temperature": 0.2, ... } ]'
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 font-mono text-gray-200 focus:outline-none focus:border-purple-500 resize-none text-[11px]"
                />
              </div>
            </div>

            <div className="px-6 py-3 border-t border-gray-800 bg-gray-950/90 flex justify-end space-x-2 text-xs">
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleImportSubmit}
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold flex items-center space-x-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import Templates</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
