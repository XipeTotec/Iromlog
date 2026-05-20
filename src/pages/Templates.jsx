import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, GripVertical, X, Check } from 'lucide-react';
import { getTemplates, saveTemplates, getExercises } from '../data/storage.js';
import { MUSCLE_COLORS } from '../data/exercises.js';

const TYPE_OPTIONS = ['push', 'pull', 'legs', 'upper', 'lower', 'full'];
const TYPE_COLORS = {
  push: '#ff6b35', pull: '#4ecdc4', legs: '#a855f7',
  upper: '#3b82f6', lower: '#f59e0b', full: '#e8ff47',
};

function newTemplate() {
  return {
    id: `template-${Date.now()}`,
    name: '',
    type: 'push',
    exercises: [],
  };
}

export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const searchRef = useRef(null);

  useEffect(() => {
    setTemplates(getTemplates());
    setExercises(getExercises());
  }, []);

  function startEdit(template) {
    setEditingId(template.id);
    setDraft(JSON.parse(JSON.stringify(template)));
    setExerciseSearch('');
    setShowExercisePicker(false);
  }

  function startNew() {
    const t = newTemplate();
    setEditingId(t.id);
    setDraft(t);
    setExerciseSearch('');
    setShowExercisePicker(false);
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(null);
    setShowExercisePicker(false);
  }

  function saveDraft() {
    if (!draft.name.trim()) return;
    const exists = templates.find(t => t.id === draft.id);
    let updated;
    if (exists) {
      updated = templates.map(t => t.id === draft.id ? draft : t);
    } else {
      updated = [...templates, draft];
    }
    saveTemplates(updated);
    setTemplates(updated);
    setEditingId(null);
    setDraft(null);
  }

  function deleteTemplate(id) {
    const updated = templates.filter(t => t.id !== id);
    saveTemplates(updated);
    setTemplates(updated);
    setDeleteConfirm(null);
    if (editingId === id) cancelEdit();
  }

  function addExercise(ex) {
    setDraft(prev => ({
      ...prev,
      exercises: [...prev.exercises, { exerciseId: ex.id, defaultSets: 3, defaultReps: 10 }],
    }));
    setExerciseSearch('');
    setShowExercisePicker(false);
  }

  function removeExercise(idx) {
    setDraft(prev => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== idx),
    }));
  }

  function updateExerciseField(idx, field, value) {
    setDraft(prev => ({
      ...prev,
      exercises: prev.exercises.map((e, i) =>
        i === idx ? { ...e, [field]: parseInt(value) || 1 } : e
      ),
    }));
  }

  function moveExercise(idx, dir) {
    const next = idx + dir;
    if (next < 0 || next >= draft.exercises.length) return;
    const arr = [...draft.exercises];
    [arr[idx], arr[next]] = [arr[next], arr[idx]];
    setDraft(prev => ({ ...prev, exercises: arr }));
  }

  const exerciseMap = Object.fromEntries(exercises.map(e => [e.id, e]));

  const alreadyAdded = new Set(draft?.exercises.map(e => e.exerciseId) || []);
  const filteredExercises = exercises.filter(
    e =>
      !alreadyAdded.has(e.id) &&
      e.name.toLowerCase().includes(exerciseSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-bg pb-24">
      <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-heading text-3xl text-fg tracking-wider">TEMPLATES</h1>
          <button
            onClick={startNew}
            className="flex items-center gap-1 bg-accent text-bg font-heading text-base px-3 py-2 rounded tracking-wider hover:opacity-90 transition-opacity"
          >
            <Plus size={16} />
            NEW
          </button>
        </div>

        <div className="space-y-3">
          {templates.map(template => {
            const isEditing = editingId === template.id;
            const color = TYPE_COLORS[template.type] || '#e8ff47';

            return (
              <div key={template.id} className="bg-surface border border-border rounded-lg overflow-hidden">
                {/* Template header */}
                <button
                  onClick={() => isEditing ? cancelEdit() : startEdit(template)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="text-xs font-body uppercase tracking-wider px-2 py-0.5 rounded shrink-0"
                      style={{ backgroundColor: color + '22', color, border: `1px solid ${color}44` }}
                    >
                      {template.type}
                    </span>
                    <span className="font-heading text-xl text-fg truncate">{template.name}</span>
                  </div>
                  {isEditing ? <ChevronUp size={18} className="text-muted shrink-0" /> : <ChevronDown size={18} className="text-muted shrink-0" />}
                </button>

                {/* Edit form */}
                {isEditing && draft && (
                  <div className="border-t border-border px-4 py-4 space-y-4">
                    {/* Name */}
                    <div>
                      <label className="text-xs font-body text-muted uppercase tracking-wider block mb-1">Name</label>
                      <input
                        type="text"
                        value={draft.name}
                        onChange={e => setDraft(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Template name"
                        className="w-full bg-surface2 border border-border rounded px-3 py-2 font-body text-fg focus:outline-none focus:border-accent"
                      />
                    </div>

                    {/* Type */}
                    <div>
                      <label className="text-xs font-body text-muted uppercase tracking-wider block mb-1">Type</label>
                      <div className="flex flex-wrap gap-2">
                        {TYPE_OPTIONS.map(t => {
                          const c = TYPE_COLORS[t];
                          const active = draft.type === t;
                          return (
                            <button
                              key={t}
                              onClick={() => setDraft(prev => ({ ...prev, type: t }))}
                              className="text-xs font-body uppercase tracking-wider px-3 py-1.5 rounded border transition-colors"
                              style={
                                active
                                  ? { backgroundColor: c + '33', color: c, borderColor: c }
                                  : { backgroundColor: 'transparent', color: '#666', borderColor: '#2a2a2a' }
                              }
                            >
                              {t}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Exercises */}
                    <div>
                      <label className="text-xs font-body text-muted uppercase tracking-wider block mb-2">Exercises</label>
                      <div className="space-y-2">
                        {draft.exercises.map((ex, idx) => {
                          const exData = exerciseMap[ex.exerciseId];
                          const mc = MUSCLE_COLORS[exData?.muscleGroup] || '#666';
                          return (
                            <div key={idx} className="flex items-center gap-2 bg-surface2 rounded px-2 py-2">
                              <div className="flex flex-col gap-0.5 shrink-0">
                                <button onClick={() => moveExercise(idx, -1)} className="text-muted hover:text-fg disabled:opacity-20" disabled={idx === 0}>
                                  <ChevronUp size={13} />
                                </button>
                                <button onClick={() => moveExercise(idx, 1)} className="text-muted hover:text-fg disabled:opacity-20" disabled={idx === draft.exercises.length - 1}>
                                  <ChevronDown size={13} />
                                </button>
                              </div>
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: mc }}
                              />
                              <span className="flex-1 font-body text-sm text-fg truncate">
                                {exData?.name || ex.exerciseId}
                              </span>
                              <div className="flex items-center gap-1 shrink-0">
                                <input
                                  type="number"
                                  value={ex.defaultSets}
                                  onChange={e => updateExerciseField(idx, 'defaultSets', e.target.value)}
                                  className="w-10 bg-surface border border-border rounded px-1 py-1 text-center font-mono text-xs text-fg focus:outline-none focus:border-accent"
                                />
                                <span className="text-muted text-xs font-mono">×</span>
                                <input
                                  type="number"
                                  value={ex.defaultReps}
                                  onChange={e => updateExerciseField(idx, 'defaultReps', e.target.value)}
                                  className="w-10 bg-surface border border-border rounded px-1 py-1 text-center font-mono text-xs text-fg focus:outline-none focus:border-accent"
                                />
                              </div>
                              <button onClick={() => removeExercise(idx)} className="text-muted hover:text-accent2 transition-colors shrink-0">
                                <X size={15} />
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      {/* Exercise picker */}
                      <div className="mt-2">
                        {showExercisePicker ? (
                          <div className="border border-border rounded bg-surface2">
                            <input
                              ref={searchRef}
                              type="text"
                              value={exerciseSearch}
                              onChange={e => setExerciseSearch(e.target.value)}
                              placeholder="Search exercises..."
                              className="w-full bg-transparent px-3 py-2 font-body text-sm text-fg focus:outline-none border-b border-border"
                              autoFocus
                            />
                            <div className="max-h-48 overflow-y-auto">
                              {filteredExercises.length === 0 ? (
                                <div className="px-3 py-3 text-xs text-muted font-body">No exercises found</div>
                              ) : (
                                filteredExercises.map(ex => {
                                  const mc = MUSCLE_COLORS[ex.muscleGroup] || '#666';
                                  return (
                                    <button
                                      key={ex.id}
                                      onClick={() => addExercise(ex)}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-surface transition-colors"
                                    >
                                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: mc }} />
                                      <span className="font-body text-sm text-fg">{ex.name}</span>
                                      <span className="text-xs text-muted ml-auto">{ex.muscleGroup}</span>
                                    </button>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowExercisePicker(true)}
                            className="w-full flex items-center justify-center gap-1 py-2 text-xs font-body text-muted border border-dashed border-border rounded hover:border-accent hover:text-accent transition-colors mt-1"
                          >
                            <Plus size={13} />
                            ADD EXERCISE
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={saveDraft}
                        disabled={!draft.name.trim() || draft.exercises.length === 0}
                        className="flex-1 bg-accent text-bg font-heading text-lg py-2.5 rounded tracking-wider hover:opacity-90 transition-opacity disabled:opacity-30"
                      >
                        SAVE
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-4 bg-surface2 text-muted font-heading text-lg py-2.5 rounded border border-border hover:text-fg transition-colors"
                      >
                        CANCEL
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(template.id)}
                        className="px-3 bg-surface2 text-accent2 font-heading text-lg py-2.5 rounded border border-border hover:border-accent2 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Collapsed: exercise preview */}
                {!isEditing && (
                  <div className="px-4 pb-3">
                    <p className="text-xs font-body text-muted">
                      {template.exercises
                        .slice(0, 4)
                        .map(e => exerciseMap[e.exerciseId]?.name || e.exerciseId)
                        .join(', ')}
                      {template.exercises.length > 4 && ` +${template.exercises.length - 4} more`}
                    </p>
                  </div>
                )}
              </div>
            );
          })}

          {templates.length === 0 && (
            <div className="text-center py-16 text-muted font-body">
              No templates yet. Tap NEW to create one.
            </div>
          )}
        </div>
      </div>

      {/* New template edit panel (floats below the list) */}
      {editingId && !templates.find(t => t.id === editingId) && draft && (
        <div className="px-4 max-w-lg mx-auto mt-3">
          <div className="bg-surface border border-accent/40 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <span className="font-heading text-xl text-fg">NEW TEMPLATE</span>
              <button onClick={cancelEdit}><X size={18} className="text-muted" /></button>
            </div>
            <div className="px-4 py-4 space-y-4">
              <div>
                <label className="text-xs font-body text-muted uppercase tracking-wider block mb-1">Name</label>
                <input
                  type="text"
                  value={draft.name}
                  onChange={e => setDraft(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Template name"
                  className="w-full bg-surface2 border border-border rounded px-3 py-2 font-body text-fg focus:outline-none focus:border-accent"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-body text-muted uppercase tracking-wider block mb-1">Type</label>
                <div className="flex flex-wrap gap-2">
                  {TYPE_OPTIONS.map(t => {
                    const c = TYPE_COLORS[t];
                    const active = draft.type === t;
                    return (
                      <button
                        key={t}
                        onClick={() => setDraft(prev => ({ ...prev, type: t }))}
                        className="text-xs font-body uppercase tracking-wider px-3 py-1.5 rounded border transition-colors"
                        style={
                          active
                            ? { backgroundColor: c + '33', color: c, borderColor: c }
                            : { backgroundColor: 'transparent', color: '#666', borderColor: '#2a2a2a' }
                        }
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="text-xs font-body text-muted uppercase tracking-wider block mb-2">Exercises</label>
                <div className="space-y-2">
                  {draft.exercises.map((ex, idx) => {
                    const exData = exerciseMap[ex.exerciseId];
                    const mc = MUSCLE_COLORS[exData?.muscleGroup] || '#666';
                    return (
                      <div key={idx} className="flex items-center gap-2 bg-surface2 rounded px-2 py-2">
                        <div className="flex flex-col gap-0.5 shrink-0">
                          <button onClick={() => moveExercise(idx, -1)} className="text-muted hover:text-fg" disabled={idx === 0}><ChevronUp size={13} /></button>
                          <button onClick={() => moveExercise(idx, 1)} className="text-muted hover:text-fg" disabled={idx === draft.exercises.length - 1}><ChevronDown size={13} /></button>
                        </div>
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: mc }} />
                        <span className="flex-1 font-body text-sm text-fg truncate">{exData?.name || ex.exerciseId}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          <input type="number" value={ex.defaultSets} onChange={e => updateExerciseField(idx, 'defaultSets', e.target.value)}
                            className="w-10 bg-surface border border-border rounded px-1 py-1 text-center font-mono text-xs text-fg focus:outline-none focus:border-accent" />
                          <span className="text-muted text-xs font-mono">×</span>
                          <input type="number" value={ex.defaultReps} onChange={e => updateExerciseField(idx, 'defaultReps', e.target.value)}
                            className="w-10 bg-surface border border-border rounded px-1 py-1 text-center font-mono text-xs text-fg focus:outline-none focus:border-accent" />
                        </div>
                        <button onClick={() => removeExercise(idx)} className="text-muted hover:text-accent2 transition-colors shrink-0"><X size={15} /></button>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-2">
                  {showExercisePicker ? (
                    <div className="border border-border rounded bg-surface2">
                      <input
                        ref={searchRef}
                        type="text"
                        value={exerciseSearch}
                        onChange={e => setExerciseSearch(e.target.value)}
                        placeholder="Search exercises..."
                        className="w-full bg-transparent px-3 py-2 font-body text-sm text-fg focus:outline-none border-b border-border"
                        autoFocus
                      />
                      <div className="max-h-48 overflow-y-auto">
                        {filteredExercises.length === 0 ? (
                          <div className="px-3 py-3 text-xs text-muted font-body">No exercises found</div>
                        ) : (
                          filteredExercises.map(ex => {
                            const mc = MUSCLE_COLORS[ex.muscleGroup] || '#666';
                            return (
                              <button key={ex.id} onClick={() => addExercise(ex)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-surface transition-colors">
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: mc }} />
                                <span className="font-body text-sm text-fg">{ex.name}</span>
                                <span className="text-xs text-muted ml-auto">{ex.muscleGroup}</span>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowExercisePicker(true)}
                      className="w-full flex items-center justify-center gap-1 py-2 text-xs font-body text-muted border border-dashed border-border rounded hover:border-accent hover:text-accent transition-colors mt-1"
                    >
                      <Plus size={13} />
                      ADD EXERCISE
                    </button>
                  )}
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={saveDraft}
                  disabled={!draft.name.trim() || draft.exercises.length === 0}
                  className="flex-1 bg-accent text-bg font-heading text-lg py-2.5 rounded tracking-wider hover:opacity-90 transition-opacity disabled:opacity-30"
                >
                  SAVE
                </button>
                <button onClick={cancelEdit}
                  className="px-4 bg-surface2 text-muted font-heading text-lg py-2.5 rounded border border-border hover:text-fg transition-colors">
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm sheet */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end">
          <div className="w-full bg-surface border-t border-border rounded-t-2xl p-6">
            <h3 className="font-heading text-2xl text-fg mb-2">DELETE TEMPLATE?</h3>
            <p className="text-muted font-body text-sm mb-6">
              "{templates.find(t => t.id === deleteConfirm)?.name}" will be permanently removed.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => deleteTemplate(deleteConfirm)}
                className="w-full bg-accent2 text-fg font-heading text-xl py-3 rounded tracking-wider"
              >
                DELETE
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="w-full bg-surface2 text-fg font-heading text-xl py-3 rounded tracking-wider border border-border"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
