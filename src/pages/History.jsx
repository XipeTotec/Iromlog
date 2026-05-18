import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { getSessions, saveSessions } from '../data/storage.js';
import { getExercises } from '../data/storage.js';
import { MUSCLE_COLORS } from '../data/exercises.js';
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

export default function History() {
  const [sessions, setSessions] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [exercises, setExercises] = useState([]);

  useEffect(() => {
    setSessions(getSessions());
    setExercises(getExercises());
  }, []);

  const exMap = {};
  exercises.forEach(e => { exMap[e.id] = e; });

  function toggleExpand(id) {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  }

  function handleDelete(sessionId) {
    if (!confirm('Delete this session? This cannot be undone.')) return;
    const all = getSessions();
    const updated = all.filter(s => s.id !== sessionId);
    saveSessions(updated);
    setSessions(updated);
  }

  return (
    <div className="min-h-screen bg-bg pb-24 px-4 pt-6 max-w-lg mx-auto">
      <h1 className="font-heading text-4xl text-white mb-6 tracking-wide">HISTORY</h1>

      {sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="font-heading text-6xl text-border mb-4">0</div>
          <div className="font-body text-muted">No sessions yet.</div>
          <div className="font-body text-muted text-sm mt-1">Complete a workout to see it here.</div>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map(session => {
            const typeColor = TYPE_COLORS[session.type] || '#e8ff47';
            const isOpen = expanded[session.id];

            return (
              <div
                key={session.id}
                className="bg-surface border border-border rounded-lg overflow-hidden"
              >
                {/* Row header */}
                <button
                  onClick={() => toggleExpand(session.id)}
                  className="w-full px-4 py-3 flex items-center gap-3 text-left"
                >
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: typeColor }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-heading text-lg text-white">
                        {session.templateName}
                      </span>
                      <span
                        className="text-xs font-body uppercase px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: typeColor + '22',
                          color: typeColor,
                        }}
                      >
                        {session.type}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-muted mt-0.5">
                      {formatDate(session.date)}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs font-mono text-muted">{formatTime(session.durationSeconds)}</div>
                    <div className="text-xs font-mono text-muted">{session.totalSets} sets</div>
                    <div className="text-xs font-mono text-accent">
                      {session.totalVolume >= 1000
                        ? `${(session.totalVolume / 1000).toFixed(1)}t`
                        : `${Math.round(session.totalVolume)}kg`}
                    </div>
                  </div>
                  <div className="ml-1 text-muted flex-shrink-0">
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </button>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="border-t border-border px-4 py-3 space-y-4">
                    {session.exercises.map((ex, i) => {
                      const exData = exMap[ex.exerciseId];
                      const muscleColor = MUSCLE_COLORS[exData?.muscleGroup] || '#666';
                      const doneSets = ex.sets.filter(s => s.done && !s.isWarmup);
                      if (doneSets.length === 0) return null;

                      return (
                        <div key={i}>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span
                              className="text-xs px-1.5 py-0.5 rounded font-body"
                              style={{
                                backgroundColor: muscleColor + '22',
                                color: muscleColor,
                              }}
                            >
                              {exData?.muscleGroup || '—'}
                            </span>
                            <span className="font-body font-semibold text-sm text-white">
                              {exData?.name || ex.exerciseId}
                            </span>
                          </div>
                          <div className="space-y-0.5 pl-2">
                            {doneSets.map((set, j) => (
                              <div key={j} className="flex items-center gap-2 text-xs font-mono text-muted">
                                <span className="w-3">{j + 1}</span>
                                <span className="text-white">{set.weight}kg × {set.reps}</span>
                                {set.isPR && (
                                  <span className="text-accent text-xs font-body">PR</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    <button
                      onClick={() => handleDelete(session.id)}
                      className="flex items-center gap-2 text-accent2 text-sm font-body hover:opacity-80 transition-opacity mt-2"
                    >
                      <Trash2 size={14} />
                      Delete Session
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
