import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Search, ChevronDown, ChevronUp } from 'lucide-react';
import {
  getTemplates,
  saveTemplates,
  getLastSessionForTemplate,
  getExercises,
  saveExercises,
  getCardioSessions,
} from '../data/storage.js';
import { CARDIO_TYPES } from '../data/cardioTypes.js';
import { formatTime } from '../hooks/useTimer.js';

const TYPE_COLORS = {
  push: '#ff6b35',
  pull: '#4ecdc4',
  legs: '#a855f7',
  upper: '#3b82f6',
  lower: '#f59e0b',
  full: '#e8ff47',
};

function formatDate(dateStr) {
  if (!dateStr) return 'Never';
  const d = new Date(dateStr);
  const now = new Date();
  const days = Math.floor((now - d) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function cardioSummary(s) {
  if (!s) return null;
  const parts = [];
  if (s.stroke) parts.push(s.stroke);
  if (s.distanceKm) parts.push(`${s.distanceKm} km`);
  if (s.distanceM) parts.push(`${s.distanceM} m`);
  if (s.rounds) parts.push(`${s.rounds} rounds`);
  if (s.durationSeconds) parts.push(formatTime(s.durationSeconds));
  return parts.join(' · ');
}

export default function Home() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('push');
  const [selectedExIds, setSelectedExIds] = useState([]);
  const [exSearch, setExSearch] = useState('');
  const [lastDates, setLastDates] = useState({});
  const [expanded, setExpanded] = useState({});
  const [lastCardio, setLastCardio] = useState({});

  useEffect(() => {
    const tmpls = getTemplates();
    const exs = getExercises();
    setTemplates(tmpls);
    setExercises(exs);

    const dates = {};
    tmpls.forEach(t => {
      const last = getLastSessionForTemplate(t.id);
      dates[t.id] = last ? last.date : null;
    });
    setLastDates(dates);

    const cardioSessions = getCardioSessions();
    const byType = {};
    Object.keys(CARDIO_TYPES).forEach(type => {
      byType[type] = cardioSessions.find(s => s.type === type) || null;
    });
    setLastCardio(byType);
  }, []);

  function toggle(id) {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  }

  function handleStart(template) {
    const lastSession = getLastSessionForTemplate(template.id);
    const previousSets = {};
    if (lastSession) {
      lastSession.exercises.forEach(ex => { previousSets[ex.exerciseId] = ex.sets; });
    }

    const exMap = {};
    exercises.forEach(e => { exMap[e.id] = e; });

    const initialExercises = template.exercises.map(te => {
      const prevSets = previousSets[te.exerciseId] || [];
      const lastSet = prevSets.find(s => s.done && !s.isWarmup);
      return {
        exerciseId: te.exerciseId,
        exercise: exMap[te.exerciseId],
        defaultSets: te.defaultSets,
        defaultReps: te.defaultReps,
        prevWeight: lastSet ? lastSet.weight : '',
        prevReps: lastSet ? lastSet.reps : '',
        prevSets,
      };
    });

    navigate('/workout/active', { state: { template, exercises: initialExercises, previousSets } });
  }

  function handleCreateTemplate() {
    if (!newName.trim() || selectedExIds.length === 0) return;
    const newTemplate = {
      id: `custom-${Date.now()}`,
      name: newName.trim(),
      type: newType,
      exercises: selectedExIds.map(id => ({ exerciseId: id, defaultSets: 3, defaultReps: 10 })),
    };
    const updated = [...templates, newTemplate];
    saveTemplates(updated);
    setTemplates(updated);
    setLastDates(prev => ({ ...prev, [newTemplate.id]: null }));
    setShowModal(false);
    setNewName('');
    setNewType('push');
    setSelectedExIds([]);
    setExSearch('');
  }

  const filteredExercises = exercises.filter(e =>
    e.name.toLowerCase().includes(exSearch.toLowerCase())
  );

  const exMap = {};
  exercises.forEach(e => { exMap[e.id] = e; });

  return (
    <div className="min-h-screen bg-bg pb-28 pt-6">
      <div className="px-4">
        <h1 className="font-heading text-5xl text-accent mb-4 tracking-wide">IRON LOG</h1>

        {/* Lifting templates */}
        <div className="space-y-2 mb-6">
          {templates.map(template => {
            const color = TYPE_COLORS[template.type] || '#e8ff47';
            const isOpen = expanded[template.id];

            return (
              <div
                key={template.id}
                className="bg-surface border border-border rounded-lg overflow-hidden"
                style={{ borderLeft: `3px solid ${color}` }}
              >
                {/* Collapsed row */}
                <button
                  onClick={() => toggle(template.id)}
                  className="w-full px-4 py-3 flex items-center gap-3 text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-heading text-xl text-fg leading-none">{template.name}</div>
                    <div className="text-xs font-body text-muted mt-0.5 uppercase tracking-wider">{template.type}</div>
                  </div>
                  <div className="text-xs font-mono text-muted shrink-0">{formatDate(lastDates[template.id])}</div>
                  <div className="text-muted shrink-0">
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </button>

                {/* Expanded */}
                {isOpen && (
                  <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
                    <div className="space-y-0.5">
                      {template.exercises.map(te => (
                        <div key={te.exerciseId} className="text-sm text-muted font-body">
                          {exMap[te.exerciseId]?.name || te.exerciseId}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => handleStart(template)}
                      className="w-full font-heading text-xl py-2.5 rounded tracking-wider hover:opacity-90 transition-opacity text-bg"
                      style={{ backgroundColor: color }}
                    >
                      START
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Cardio section */}
        <h2 className="font-heading text-2xl text-fg tracking-wider mb-2">CARDIO</h2>
        <div className="space-y-2">
          {Object.entries(CARDIO_TYPES).map(([key, { label, color }]) => {
            const last = lastCardio[key];
            const isOpen = expanded[`cardio-${key}`];

            return (
              <div
                key={key}
                className="bg-surface border border-border rounded-lg overflow-hidden"
                style={{ borderLeft: `3px solid ${color}` }}
              >
                <button
                  onClick={() => toggle(`cardio-${key}`)}
                  className="w-full px-4 py-3 flex items-center gap-3 text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-heading text-xl text-fg leading-none">{label}</div>
                    {last && (
                      <div className="text-xs font-mono text-muted mt-0.5 truncate">{cardioSummary(last)}</div>
                    )}
                  </div>
                  <div className="text-xs font-mono text-muted shrink-0">{formatDate(last?.date)}</div>
                  <div className="text-muted shrink-0">
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 border-t border-border pt-3">
                    <button
                      onClick={() => navigate('/cardio/active', { state: { type: key } })}
                      className="w-full font-heading text-xl py-2.5 rounded tracking-wider hover:opacity-90 transition-opacity text-bg"
                      style={{ backgroundColor: color }}
                    >
                      START
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* New template button */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-20 right-4 z-30 bg-accent text-bg px-4 py-3 rounded-lg font-heading text-lg tracking-wider flex items-center gap-2 hover:opacity-90 transition-opacity shadow-lg"
      >
        <Plus size={18} /> NEW TEMPLATE
      </button>

      {/* New Template Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end">
          <div className="w-full bg-surface border-t border-border rounded-t-2xl p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-3xl text-fg">NEW TEMPLATE</h2>
              <button
                onClick={() => { setShowModal(false); setNewName(''); setSelectedExIds([]); setExSearch(''); }}
                className="text-muted hover:text-fg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted font-body uppercase tracking-wider mb-2 block">Template Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Push Day"
                  className="w-full bg-surface2 border border-border rounded px-3 py-3 text-base text-fg font-body placeholder-muted focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="text-xs text-muted font-body uppercase tracking-wider mb-2 block">Type</label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(TYPE_COLORS).map(([type, color]) => (
                    <button
                      key={type}
                      onClick={() => setNewType(type)}
                      className={`px-3 py-1.5 rounded text-xs font-body uppercase tracking-wider border transition-colors ${
                        newType === type ? 'border-accent text-accent' : 'border-border text-muted hover:border-muted'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-muted font-body uppercase tracking-wider mb-2 block">
                  Exercises ({selectedExIds.length} selected)
                </label>
                <div className="relative mb-2">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="text"
                    value={exSearch}
                    onChange={e => setExSearch(e.target.value)}
                    placeholder="Search exercises..."
                    className="w-full bg-surface2 border border-border rounded pl-8 pr-3 py-3 text-base text-fg font-body placeholder-muted focus:outline-none focus:border-accent"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {filteredExercises.map(ex => {
                    const isSelected = selectedExIds.includes(ex.id);
                    return (
                      <button
                        key={ex.id}
                        onClick={() => setSelectedExIds(prev => isSelected ? prev.filter(id => id !== ex.id) : [...prev, ex.id])}
                        className={`w-full text-left px-3 py-3 rounded text-base font-body border transition-colors ${
                          isSelected ? 'bg-accent/10 border-accent text-accent' : 'bg-surface2 border-transparent text-muted hover:text-fg hover:border-border'
                        }`}
                      >
                        {ex.name}
                        <span className="ml-2 text-xs opacity-60">{ex.muscleGroup}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={handleCreateTemplate}
                disabled={!newName.trim() || selectedExIds.length === 0}
                className="w-full bg-accent text-bg font-heading text-xl py-3 rounded tracking-wider hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              >
                CREATE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
