import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Trash2, Pencil, X } from 'lucide-react';
import {
  getSessions, saveSessions, getCardioSessions, deleteCardioSession,
  updateWorkoutSession, updateCardioSession,
} from '../data/storage.js';
import { getExercises } from '../data/storage.js';
import { MUSCLE_COLORS } from '../data/exercises.js';
import { CARDIO_TYPES, SWIM_STROKES } from '../data/cardioTypes.js';
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
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function toDatetimeLocal(isoStr) {
  const d = new Date(isoStr);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function recalcWorkoutTotals(session) {
  const totalSets = (session.exercises || []).reduce(
    (acc, ex) => acc + ex.sets.filter(s => s.done && !s.isWarmup).length, 0
  );
  const totalVolume = (session.exercises || []).reduce(
    (acc, ex) => acc + ex.sets.filter(s => s.done && !s.isWarmup).reduce((a, s) => a + s.weight * s.reps, 0), 0
  );
  return { ...session, totalSets, totalVolume };
}

export default function History() {
  const [sessions, setSessions] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [exercises, setExercises] = useState([]);
  const [editingSession, setEditingSession] = useState(null);

  useEffect(() => {
    const weights = getSessions();
    const cardio = getCardioSessions();
    const merged = [...weights, ...cardio].sort((a, b) => new Date(b.date) - new Date(a.date));
    setSessions(merged);
    setExercises(getExercises());
  }, []);

  const exMap = {};
  exercises.forEach(e => { exMap[e.id] = e; });

  function toggleExpand(id) {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  }

  function handleDelete(session) {
    if (!confirm('Delete this session? This cannot be undone.')) return;
    if (session.kind === 'cardio') {
      deleteCardioSession(session.id);
    } else {
      const updated = getSessions().filter(s => s.id !== session.id);
      saveSessions(updated);
    }
    setSessions(prev => prev.filter(s => s.id !== session.id));
  }

  function handleEdit(session) {
    setEditingSession(JSON.parse(JSON.stringify(session)));
  }

  function handleSetEdit(exIdx, setIdx, field, rawValue) {
    const value = field === 'weight' ? (parseFloat(rawValue) || 0) : (parseInt(rawValue) || 0);
    setEditingSession(prev => {
      const exercises = prev.exercises.map((ex, ei) => {
        if (ei !== exIdx) return ex;
        return { ...ex, sets: ex.sets.map((s, si) => si === setIdx ? { ...s, [field]: value } : s) };
      });
      return { ...prev, exercises };
    });
  }

  function handleSaveEdit() {
    let saved = editingSession;
    if (!saved.kind) {
      saved = recalcWorkoutTotals(saved);
      updateWorkoutSession(saved.id, saved);
    } else {
      updateCardioSession(saved.id, saved);
    }
    setSessions(prev => prev.map(s => s.id === saved.id ? saved : s));
    setEditingSession(null);
  }

  return (
    <div className="min-h-screen bg-bg pb-24 px-4 pt-6 max-w-lg mx-auto">
      <h1 className="font-heading text-4xl text-fg mb-6 tracking-wide">HISTORY</h1>

      {sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="font-heading text-6xl text-border mb-4">0</div>
          <div className="font-body text-muted">No sessions yet.</div>
          <div className="font-body text-muted text-sm mt-1">Complete a workout to see it here.</div>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map(session => {
            const isCardio = session.kind === 'cardio';
            const typeColor = isCardio
              ? (CARDIO_TYPES[session.type]?.color || '#6b7280')
              : (TYPE_COLORS[session.type] || '#e8ff47');
            const isOpen = expanded[session.id];

            return (
              <div key={session.id} className="bg-surface border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleExpand(session.id)}
                  className="w-full px-4 py-3 flex items-center gap-3 text-left"
                >
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: typeColor }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-heading text-lg text-fg">
                        {isCardio ? CARDIO_TYPES[session.type]?.label : session.templateName}
                      </span>
                      <span
                        className="text-xs font-body uppercase px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: typeColor + '22', color: typeColor }}
                      >
                        {isCardio ? 'cardio' : session.type}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-muted mt-0.5">{formatDate(session.date)}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs font-mono text-muted">{formatTime(session.durationSeconds)}</div>
                    {isCardio ? (
                      <div className="text-xs font-mono" style={{ color: typeColor }}>
                        {session.distanceKm ? `${session.distanceKm} km` : ''}
                        {session.distanceM ? `${session.distanceM} m` : ''}
                        {session.rounds ? `${session.rounds} rounds` : ''}
                      </div>
                    ) : (
                      <>
                        <div className="text-xs font-mono text-muted">{session.totalSets} sets</div>
                        <div className="text-xs font-mono text-accent">
                          {session.totalVolume >= 1000
                            ? `${(session.totalVolume / 1000).toFixed(1)}t`
                            : `${Math.round(session.totalVolume)}kg`}
                        </div>
                      </>
                    )}
                  </div>
                  <div className="ml-1 text-muted flex-shrink-0">
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-border px-4 py-3 space-y-3">
                    {isCardio ? (
                      <div className="space-y-1 font-mono text-sm">
                        {session.stroke && <div className="text-muted">Stroke: <span className="text-fg">{session.stroke}</span></div>}
                        {session.distanceKm && <div className="text-muted">Distance: <span className="text-fg">{session.distanceKm} km</span></div>}
                        {session.distanceM && <div className="text-muted">Distance: <span className="text-fg">{session.distanceM} m</span></div>}
                        {session.rounds && <div className="text-muted">Rounds: <span className="text-fg">{session.rounds}</span></div>}
                        {session.notes && <div className="text-muted">Notes: <span className="text-fg">{session.notes}</span></div>}
                      </div>
                    ) : (
                      session.exercises.map((ex, i) => {
                        const exData = exMap[ex.exerciseId];
                        const muscleColor = MUSCLE_COLORS[exData?.muscleGroup] || '#666';
                        const doneSets = ex.sets.filter(s => s.done && !s.isWarmup);
                        if (!doneSets.length) return null;
                        return (
                          <div key={i}>
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-xs px-1.5 py-0.5 rounded font-body" style={{ backgroundColor: muscleColor + '22', color: muscleColor }}>
                                {exData?.muscleGroup || '—'}
                              </span>
                              <span className="font-body font-semibold text-sm text-fg">{exData?.name || ex.exerciseId}</span>
                            </div>
                            <div className="space-y-0.5 pl-2">
                              {doneSets.map((set, j) => (
                                <div key={j} className="flex items-center gap-2 text-xs font-mono text-muted">
                                  <span className="w-3">{j + 1}</span>
                                  <span className="text-fg">{set.weight}kg × {set.reps}</span>
                                  {set.isPR && <span className="text-accent">PR</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div className="flex items-center gap-4 pt-1">
                      <button
                        onClick={() => handleEdit(session)}
                        className="flex items-center gap-1.5 text-muted text-sm font-body hover:text-accent transition-colors"
                      >
                        <Pencil size={13} /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(session)}
                        className="flex items-center gap-1.5 text-accent2 text-sm font-body hover:opacity-80 transition-opacity"
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Edit modal */}
      {editingSession && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end">
          <div className="w-full bg-surface border-t border-border rounded-t-2xl flex flex-col max-h-[90vh]">
            {/* Modal header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-3 shrink-0 border-b border-border">
              <h3 className="font-heading text-2xl text-fg">EDIT SESSION</h3>
              <button onClick={() => setEditingSession(null)} className="text-muted hover:text-fg transition-colors">
                <X size={22} />
              </button>
            </div>

            <div className="overflow-y-auto px-4 py-4 space-y-4 flex-1">

              {/* Date & Time */}
              <div>
                <label className="block text-xs font-body text-muted mb-1.5 uppercase tracking-wider">Date &amp; Time</label>
                <input
                  type="datetime-local"
                  value={toDatetimeLocal(editingSession.date)}
                  onChange={e => setEditingSession(prev => ({ ...prev, date: new Date(e.target.value).toISOString() }))}
                  className="w-full bg-surface2 border border-border rounded px-3 py-2 text-fg font-mono text-sm focus:outline-none focus:border-accent"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-xs font-body text-muted mb-1.5 uppercase tracking-wider">Duration (minutes)</label>
                <input
                  type="number"
                  min="0"
                  value={Math.round((editingSession.durationSeconds || 0) / 60)}
                  onChange={e => setEditingSession(prev => ({ ...prev, durationSeconds: (parseInt(e.target.value) || 0) * 60 }))}
                  className="w-full bg-surface2 border border-border rounded px-3 py-2 text-fg font-mono text-sm focus:outline-none focus:border-accent"
                />
              </div>

              {/* Workout-specific fields */}
              {!editingSession.kind && (
                <>
                  <div>
                    <label className="block text-xs font-body text-muted mb-1.5 uppercase tracking-wider">Workout Name</label>
                    <input
                      type="text"
                      value={editingSession.templateName || ''}
                      onChange={e => setEditingSession(prev => ({ ...prev, templateName: e.target.value }))}
                      className="w-full bg-surface2 border border-border rounded px-3 py-2 text-fg font-body text-sm focus:outline-none focus:border-accent"
                    />
                  </div>

                  {(editingSession.exercises || []).map((ex, exIdx) => {
                    const exData = exMap[ex.exerciseId];
                    const muscleColor = MUSCLE_COLORS[exData?.muscleGroup] || '#666';
                    return (
                      <div key={exIdx} className="border border-border rounded-lg overflow-hidden">
                        <div
                          className="px-3 py-2 border-b border-border flex items-center gap-2"
                          style={{ borderLeft: `3px solid ${muscleColor}` }}
                        >
                          <span className="font-heading text-base text-fg">{exData?.name || ex.exerciseId}</span>
                        </div>
                        <div className="px-3 py-2 space-y-1.5">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="w-6 text-xs font-mono text-muted text-center">#</span>
                            <span className="flex-1 text-xs font-body text-muted text-center">KG</span>
                            <span className="w-4 text-xs text-muted text-center">×</span>
                            <span className="flex-1 text-xs font-body text-muted text-center">REPS</span>
                          </div>
                          {ex.sets.map((set, setIdx) => (
                            <div key={setIdx} className="flex items-center gap-2">
                              <span className={`w-6 text-xs font-mono text-center ${set.isWarmup ? 'text-muted' : set.done ? 'text-accent' : 'text-muted'}`}>
                                {set.isWarmup ? 'W' : setIdx + 1}
                              </span>
                              <input
                                type="number"
                                value={set.weight}
                                onChange={e => handleSetEdit(exIdx, setIdx, 'weight', e.target.value)}
                                placeholder="0"
                                className="flex-1 bg-surface2 border border-border rounded px-2 py-1.5 text-center font-mono text-sm text-fg focus:outline-none focus:border-accent"
                              />
                              <span className="w-4 text-xs text-muted text-center">×</span>
                              <input
                                type="number"
                                value={set.reps}
                                onChange={e => handleSetEdit(exIdx, setIdx, 'reps', e.target.value)}
                                placeholder="0"
                                className="flex-1 bg-surface2 border border-border rounded px-2 py-1.5 text-center font-mono text-sm text-fg focus:outline-none focus:border-accent"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {/* Cardio-specific fields */}
              {editingSession.kind === 'cardio' && (
                <>
                  {(editingSession.type === 'run' || editingSession.type === 'bike') && (
                    <div>
                      <label className="block text-xs font-body text-muted mb-1.5 uppercase tracking-wider">Distance (km)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={editingSession.distanceKm || ''}
                        onChange={e => setEditingSession(prev => ({ ...prev, distanceKm: parseFloat(e.target.value) || 0 }))}
                        className="w-full bg-surface2 border border-border rounded px-3 py-2 text-fg font-mono text-sm focus:outline-none focus:border-accent"
                      />
                    </div>
                  )}

                  {editingSession.type === 'swim' && (
                    <>
                      <div>
                        <label className="block text-xs font-body text-muted mb-1.5 uppercase tracking-wider">Distance (metres)</label>
                        <input
                          type="number"
                          min="0"
                          value={editingSession.distanceM || ''}
                          onChange={e => setEditingSession(prev => ({ ...prev, distanceM: parseInt(e.target.value) || 0 }))}
                          className="w-full bg-surface2 border border-border rounded px-3 py-2 text-fg font-mono text-sm focus:outline-none focus:border-accent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-body text-muted mb-2 uppercase tracking-wider">Stroke</label>
                        <div className="flex flex-wrap gap-2">
                          {SWIM_STROKES.map(stroke => (
                            <button
                              key={stroke}
                              onClick={() => setEditingSession(prev => ({ ...prev, stroke }))}
                              className={`px-3 py-1.5 rounded text-sm font-body border transition-colors ${
                                editingSession.stroke === stroke
                                  ? 'bg-accent text-bg border-accent'
                                  : 'bg-surface2 border-border text-fg hover:border-accent'
                              }`}
                            >
                              {stroke}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {editingSession.type === 'row' && (
                    <div>
                      <label className="block text-xs font-body text-muted mb-1.5 uppercase tracking-wider">Distance (metres)</label>
                      <input
                        type="number"
                        min="0"
                        value={editingSession.distanceM || ''}
                        onChange={e => setEditingSession(prev => ({ ...prev, distanceM: parseInt(e.target.value) || 0 }))}
                        className="w-full bg-surface2 border border-border rounded px-3 py-2 text-fg font-mono text-sm focus:outline-none focus:border-accent"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-body text-muted mb-1.5 uppercase tracking-wider">Notes</label>
                    <textarea
                      rows={2}
                      value={editingSession.notes || ''}
                      onChange={e => setEditingSession(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full bg-surface2 border border-border rounded px-3 py-2 text-fg font-body text-sm focus:outline-none focus:border-accent resize-none"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Save button */}
            <div className="px-4 pt-3 pb-6 shrink-0 border-t border-border">
              <button
                onClick={handleSaveEdit}
                className="w-full bg-accent text-bg font-heading text-2xl py-3 rounded tracking-wider hover:opacity-90 transition-opacity"
              >
                SAVE CHANGES
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
