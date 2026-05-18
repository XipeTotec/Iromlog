import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Search } from 'lucide-react';
import {
  getTemplates,
  saveTemplates,
  getSessions,
  getLastSessionForTemplate,
  getExercises,
  saveExercises,
} from '../data/storage.js';

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
  const diff = now - d;
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
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
  }, []);

  function handleStart(template) {
    const lastSession = getLastSessionForTemplate(template.id);
    const previousSets = {};
    if (lastSession) {
      lastSession.exercises.forEach(ex => {
        previousSets[ex.exerciseId] = ex.sets;
      });
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
        prevSets: prevSets,
      };
    });

    navigate('/workout/active', {
      state: { template, exercises: initialExercises, previousSets },
    });
  }

  function handleCreateTemplate() {
    if (!newName.trim() || selectedExIds.length === 0) return;
    const newTemplate = {
      id: `custom-${Date.now()}`,
      name: newName.trim(),
      type: newType,
      exercises: selectedExIds.map(id => ({
        exerciseId: id,
        defaultSets: 3,
        defaultReps: 10,
      })),
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
    <div className="min-h-screen bg-bg pb-24 px-4 pt-6">
      <div className="max-w-lg mx-auto">
        <h1 className="font-heading text-5xl text-accent mb-6 tracking-wide">IRON LOG</h1>

        <div className="grid grid-cols-2 gap-3">
          {templates.map(template => {
            const color = TYPE_COLORS[template.type] || '#e8ff47';
            const exList = template.exercises.slice(0, 4);
            const remaining = template.exercises.length - 4;

            return (
              <div
                key={template.id}
                className="bg-surface border border-border rounded-lg p-4 flex flex-col gap-3"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-xs font-body text-muted uppercase tracking-wider">
                    {template.type}
                  </span>
                </div>

                <div className="font-heading text-2xl leading-none text-white">
                  {template.name}
                </div>

                <div className="flex-1">
                  {exList.map(te => (
                    <div key={te.exerciseId} className="text-xs text-muted font-body leading-5">
                      {exMap[te.exerciseId]?.name || te.exerciseId}
                    </div>
                  ))}
                  {remaining > 0 && (
                    <div className="text-xs text-muted font-body leading-5">
                      ...and {remaining} more
                    </div>
                  )}
                </div>

                <div className="text-xs font-mono text-muted">
                  {formatDate(lastDates[template.id])}
                </div>

                <button
                  onClick={() => handleStart(template)}
                  className="w-full bg-accent text-bg font-heading text-lg py-2 rounded tracking-wider hover:opacity-90 transition-opacity"
                >
                  START
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating new template button */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-20 right-4 z-30 bg-accent text-bg px-4 py-3 rounded-lg font-heading text-lg tracking-wider flex items-center gap-2 hover:opacity-90 transition-opacity shadow-lg"
      >
        <Plus size={18} />
        NEW TEMPLATE
      </button>

      {/* New Template Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end">
          <div className="w-full bg-surface border-t border-border rounded-t-2xl p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-3xl text-white">NEW TEMPLATE</h2>
              <button
                onClick={() => { setShowModal(false); setNewName(''); setSelectedExIds([]); setExSearch(''); }}
                className="text-muted hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted font-body uppercase tracking-wider mb-2 block">
                  Template Name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Push Day"
                  className="w-full bg-surface2 border border-border rounded px-3 py-2 text-white font-body placeholder-muted focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="text-xs text-muted font-body uppercase tracking-wider mb-2 block">
                  Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(TYPE_COLORS).map(([type, color]) => (
                    <button
                      key={type}
                      onClick={() => setNewType(type)}
                      className={`px-3 py-1.5 rounded text-xs font-body uppercase tracking-wider border transition-colors ${
                        newType === type
                          ? 'border-accent text-accent'
                          : 'border-border text-muted hover:border-muted'
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
                    className="w-full bg-surface2 border border-border rounded pl-8 pr-3 py-2 text-white font-body text-sm placeholder-muted focus:outline-none focus:border-accent"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {filteredExercises.map(ex => {
                    const isSelected = selectedExIds.includes(ex.id);
                    return (
                      <button
                        key={ex.id}
                        onClick={() => {
                          setSelectedExIds(prev =>
                            isSelected ? prev.filter(id => id !== ex.id) : [...prev, ex.id]
                          );
                        }}
                        className={`w-full text-left px-3 py-2 rounded text-sm font-body border transition-colors ${
                          isSelected
                            ? 'bg-accent/10 border-accent text-accent'
                            : 'bg-surface2 border-transparent text-muted hover:text-white hover:border-border'
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
