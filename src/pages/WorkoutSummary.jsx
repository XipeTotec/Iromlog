import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { formatTime } from '../hooks/useTimer.js';
import { getExercises } from '../data/storage.js';
import { MUSCLE_COLORS } from '../data/exercises.js';

const TYPE_COLORS = {
  push: '#ff6b35',
  pull: '#4ecdc4',
  legs: '#a855f7',
  upper: '#3b82f6',
  lower: '#f59e0b',
  full: '#e8ff47',
};

export default function WorkoutSummary() {
  const navigate = useNavigate();
  const location = useLocation();
  const session = location.state?.session;

  if (!session) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="text-muted font-body mb-4">No session data found.</div>
          <button
            onClick={() => navigate('/')}
            className="bg-accent text-bg font-heading text-xl px-6 py-3 rounded tracking-wider"
          >
            GO HOME
          </button>
        </div>
      </div>
    );
  }

  const exercises = getExercises();
  const exMap = {};
  exercises.forEach(e => { exMap[e.id] = e; });

  const sessionDate = new Date(session.date);
  const typeColor = TYPE_COLORS[session.type] || '#e8ff47';
  const hasPRs = session.prs && session.prs.length > 0;

  return (
    <div className="min-h-screen bg-bg pb-8 px-4 pt-6 max-w-lg mx-auto">
      {/* Title */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: typeColor }} />
          <span className="text-xs font-body text-muted uppercase tracking-wider">
            {session.type}
          </span>
        </div>
        <h1 className="font-heading text-4xl text-white tracking-wide">
          {session.templateName}
        </h1>
        <div className="text-sm font-mono text-muted mt-1">
          {sessionDate.toLocaleDateString('en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-surface border border-border rounded-lg p-4 text-center">
          <div className="font-heading text-3xl text-accent">
            {formatTime(session.durationSeconds)}
          </div>
          <div className="text-xs font-body text-muted mt-1 uppercase tracking-wider">Duration</div>
        </div>
        <div className="bg-surface border border-border rounded-lg p-4 text-center">
          <div className="font-heading text-3xl text-accent">{session.totalSets}</div>
          <div className="text-xs font-body text-muted mt-1 uppercase tracking-wider">Sets</div>
        </div>
        <div className="bg-surface border border-border rounded-lg p-4 text-center">
          <div className="font-heading text-3xl text-accent">
            {session.totalVolume >= 1000
              ? `${(session.totalVolume / 1000).toFixed(1)}t`
              : `${Math.round(session.totalVolume)}kg`}
          </div>
          <div className="text-xs font-body text-muted mt-1 uppercase tracking-wider">Volume</div>
        </div>
      </div>

      {/* PRs */}
      {hasPRs && (
        <div className="mb-6">
          <h2 className="font-heading text-2xl text-accent mb-3 tracking-wide">NEW RECORDS 🏆</h2>
          <div className="space-y-2">
            {session.prs.map((pr, i) => {
              const ex = exMap[pr.exerciseId];
              const muscleColor = MUSCLE_COLORS[ex?.muscleGroup] || '#666';
              return (
                <div
                  key={i}
                  className="bg-accent/10 border border-accent/30 rounded-lg px-4 py-3 flex items-center gap-3"
                >
                  <div className="w-8 h-8 bg-accent rounded flex items-center justify-center flex-shrink-0">
                    <span className="text-bg font-heading text-sm">PR</span>
                  </div>
                  <div>
                    <div className="font-body font-semibold text-white text-sm">
                      {ex?.name || pr.exerciseId}
                    </div>
                    <div className="font-mono text-xs text-muted">
                      {pr.sets.map(s => `${s.weight}kg × ${s.reps}`).join(', ')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Exercise breakdown */}
      <div className="mb-8">
        <h2 className="font-heading text-2xl text-white mb-3 tracking-wide">EXERCISES</h2>
        <div className="space-y-3">
          {session.exercises.map((ex, i) => {
            const exerciseData = exMap[ex.exerciseId];
            const muscleColor = MUSCLE_COLORS[exerciseData?.muscleGroup] || '#666';
            const doneSets = ex.sets.filter(s => s.done && !s.isWarmup);
            if (doneSets.length === 0) return null;

            return (
              <div key={i} className="bg-surface border border-border rounded-lg overflow-hidden">
                <div className="px-4 py-2 flex items-center gap-2 border-b border-border">
                  <span
                    className="text-xs px-2 py-0.5 rounded font-body uppercase"
                    style={{
                      backgroundColor: muscleColor + '22',
                      color: muscleColor,
                      border: `1px solid ${muscleColor}44`,
                    }}
                  >
                    {exerciseData?.muscleGroup || '—'}
                  </span>
                  <span className="font-heading text-lg text-white">
                    {exerciseData?.name || ex.exerciseId}
                  </span>
                </div>
                <div className="px-4 py-2 space-y-1">
                  {doneSets.map((set, j) => (
                    <div key={j} className="flex items-center gap-3 text-sm">
                      <span className="font-mono text-muted w-4">{j + 1}</span>
                      <span className="font-mono text-white">
                        {set.weight}kg × {set.reps}
                      </span>
                      {set.isPR && (
                        <span className="text-xs bg-accent text-bg px-1.5 py-0.5 rounded font-body font-semibold">
                          PR
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <button
        onClick={() => navigate('/')}
        className="w-full bg-accent text-bg font-heading text-2xl py-4 rounded tracking-wider hover:opacity-90 transition-opacity"
      >
        DONE
      </button>
    </div>
  );
}
