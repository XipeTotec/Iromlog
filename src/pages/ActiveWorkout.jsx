import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, Check, Plus, ChevronDown, PlayCircle } from 'lucide-react';
import { fetchExerciseImage } from '../data/exerciseImages.js';
import ExerciseDemo from '../components/ExerciseDemo.jsx';
import { useStopwatch, useRestTimer, formatTime } from '../hooks/useTimer.js';
import {
  checkAndUpdatePR,
  saveSessions,
  getSessions,
  getSettings,
  saveSettings,
} from '../data/storage.js';
import { MUSCLE_COLORS } from '../data/exercises.js';
import RestTimer from '../components/RestTimer.jsx';
import Toast from '../components/Toast.jsx';

function buildInitialSets(defaultSets, defaultReps, prevSets) {
  const prevWorkingSet = prevSets ? prevSets.filter(s => !s.isWarmup)[0] : null;
  return [{
    id: `set-0-${Date.now()}`,
    setNumber: 1,
    weight: prevWorkingSet ? String(prevWorkingSet.weight) : '',
    reps: prevWorkingSet ? String(prevWorkingSet.reps) : String(defaultReps),
    done: false,
    isWarmup: false,
    isPR: false,
  }];
}

export default function ActiveWorkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state || {};
  const { template, exercises: initExercises = [], previousSets = {} } = state;

  const [exercises, setExercises] = useState(() => {
    return (initExercises || []).map(ex => ({
      exerciseId: ex.exerciseId,
      exercise: ex.exercise,
      sets: buildInitialSets(ex.defaultSets, ex.defaultReps, ex.prevSets || []),
      prevSets: ex.prevSets || [],
    }));
  });

  const [showCancel, setShowCancel] = useState(false);
  const [prToast, setPrToast] = useState({ show: false, exerciseName: '', fields: [] });
  const [gifExpanded, setGifExpanded] = useState({});
  const [gifUrls, setGifUrls] = useState({});
  const [restDuration, setRestDuration] = useState(() => {
    const settings = getSettings();
    return settings.restDuration || 90;
  });

  const stopwatch = useStopwatch();
  const restTimer = useRestTimer(useCallback(() => {
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  }, []));

  useEffect(() => {
    stopwatch.start();
    return () => stopwatch.stop();
  }, []);

  function handleSetChange(exIdx, setIdx, field, value) {
    setExercises(prev => {
      const updated = prev.map((ex, i) => {
        if (i !== exIdx) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s, j) => j === setIdx ? { ...s, [field]: value } : s),
        };
      });
      return updated;
    });
  }

  function handleSetDone(exIdx, setIdx) {
    const ex = exercises[exIdx];
    const set = ex.sets[setIdx];
    const weight = parseFloat(set.weight) || 0;
    const reps = parseInt(set.reps) || 0;

    const newDone = !set.done;

    setExercises(prev =>
      prev.map((e, i) => {
        if (i !== exIdx) return e;
        return {
          ...e,
          sets: e.sets.map((s, j) => {
            if (j !== setIdx) return s;
            return { ...s, done: newDone, isPR: false };
          }),
        };
      })
    );

    if (newDone && !set.isWarmup && weight > 0 && reps > 0) {
      const { isNewPR, fields } = checkAndUpdatePR(ex.exerciseId, weight, reps);
      if (isNewPR) {
        setExercises(prev =>
          prev.map((e, i) => {
            if (i !== exIdx) return e;
            return {
              ...e,
              sets: e.sets.map((s, j) => j === setIdx ? { ...s, isPR: true } : s),
            };
          })
        );
        setPrToast({ show: true, exerciseName: ex.exercise?.name || ex.exerciseId, fields });
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      }
      restTimer.start(restDuration);
    }
  }

  function handleAddSet(exIdx) {
    setExercises(prev =>
      prev.map((ex, i) => {
        if (i !== exIdx) return ex;
        const workingSets = ex.sets.filter(s => !s.isWarmup);
        const lastWorking = workingSets[workingSets.length - 1];
        const newSet = {
          id: `set-${Date.now()}`,
          setNumber: workingSets.length + 1,
          weight: lastWorking ? lastWorking.weight : '',
          reps: lastWorking ? lastWorking.reps : '',
          done: false,
          isWarmup: false,
          isPR: false,
        };
        return { ...ex, sets: [...ex.sets, newSet] };
      })
    );
  }

  function handleAddWarmup(exIdx) {
    setExercises(prev =>
      prev.map((ex, i) => {
        if (i !== exIdx) return ex;
        const newSet = {
          id: `warmup-${Date.now()}`,
          setNumber: 0,
          weight: '',
          reps: '10',
          done: false,
          isWarmup: true,
          isPR: false,
        };
        return { ...ex, sets: [newSet, ...ex.sets] };
      })
    );
  }

  function handleFinish() {
    const totalDuration = stopwatch.seconds;
    const sessionExercises = exercises.map(ex => ({
      exerciseId: ex.exerciseId,
      sets: ex.sets.map(s => ({
        weight: parseFloat(s.weight) || 0,
        reps: parseInt(s.reps) || 0,
        done: s.done,
        isWarmup: s.isWarmup,
        isPR: s.isPR,
      })),
    }));

    const totalSets = sessionExercises.reduce(
      (acc, ex) => acc + ex.sets.filter(s => s.done && !s.isWarmup).length,
      0
    );
    const totalVolume = sessionExercises.reduce(
      (acc, ex) =>
        acc +
        ex.sets
          .filter(s => s.done && !s.isWarmup)
          .reduce((a, s) => a + s.weight * s.reps, 0),
      0
    );

    const prs = sessionExercises.reduce((acc, ex) => {
      const prSets = ex.sets.filter(s => s.isPR);
      if (prSets.length > 0) {
        acc.push({
          exerciseId: ex.exerciseId,
          sets: prSets,
        });
      }
      return acc;
    }, []);

    const session = {
      id: `session-${Date.now()}`,
      templateId: template?.id || 'custom',
      templateName: template?.name || 'Custom Workout',
      type: template?.type || 'full',
      date: new Date().toISOString(),
      durationSeconds: totalDuration,
      totalSets,
      totalVolume,
      exercises: sessionExercises,
      prs,
    };

    const existing = getSessions();
    saveSessions([session, ...existing]);
    navigate('/workout/summary', { state: { session } });
  }

  const totalSets = exercises.reduce((acc, ex) => acc + ex.sets.filter(s => !s.isWarmup).length, 0);
  const doneSets = exercises.reduce(
    (acc, ex) => acc + ex.sets.filter(s => s.done && !s.isWarmup).length,
    0
  );

  async function toggleGif(exIdx, exercise) {
    const isOpen = gifExpanded[exIdx];
    setGifExpanded(prev => ({ ...prev, [exIdx]: !isOpen }));
    if (!isOpen && !(exIdx in gifUrls)) {
      setGifUrls(prev => ({ ...prev, [exIdx]: 'loading' }));
      const result = await fetchExerciseImage(exercise.id, exercise.apiName || exercise.name);
      setGifUrls(prev => ({ ...prev, [exIdx]: result || 'not-found' }));
    }
  }

  function handleRestDurationChange(val) {
    const dur = parseInt(val);
    setRestDuration(dur);
    saveSettings({ restDuration: dur });
  }

  return (
    <div className="min-h-screen bg-bg pb-32">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-surface border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowCancel(true)}
            className="text-muted hover:text-white transition-colors p-1"
          >
            <X size={22} />
          </button>
          <div className="text-center">
            <div className="font-heading text-xl text-white tracking-wider">
              {template?.name || 'WORKOUT'}
            </div>
          </div>
          <div className="font-mono text-accent text-lg">
            {formatTime(stopwatch.seconds)}
          </div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="text-sm font-body text-muted">
            <span className="text-white font-medium">{doneSets}</span> / {totalSets} sets
          </div>
          <select
            value={restDuration}
            onChange={e => handleRestDurationChange(e.target.value)}
            className="bg-surface2 border border-border rounded px-2 py-1 text-xs font-mono text-muted focus:outline-none focus:border-accent"
          >
            <option value={60}>Rest 1:00</option>
            <option value={90}>Rest 1:30</option>
            <option value={120}>Rest 2:00</option>
            <option value={180}>Rest 3:00</option>
          </select>
        </div>
      </div>

      {/* Exercises */}
      <div className="px-4 pt-4 space-y-6 max-w-lg mx-auto">
        {exercises.map((ex, exIdx) => {
          const muscleColor = MUSCLE_COLORS[ex.exercise?.muscleGroup] || '#666';
          const workingSets = ex.sets.filter(s => !s.isWarmup);
          const warmupSets = ex.sets.filter(s => s.isWarmup);

          return (
            <div key={exIdx} className="bg-surface border border-border rounded-lg overflow-hidden">
              <div className="px-4 py-3 flex items-center gap-3 border-b border-border">
                <span
                  className="text-xs font-body uppercase tracking-wider px-2 py-0.5 rounded shrink-0"
                  style={{
                    backgroundColor: muscleColor + '22',
                    color: muscleColor,
                    border: `1px solid ${muscleColor}44`,
                  }}
                >
                  {ex.exercise?.muscleGroup || '—'}
                </span>
                <span className="font-heading text-xl text-white flex-1">
                  {ex.exercise?.name || ex.exerciseId}
                </span>
                <button
                  onClick={() => toggleGif(exIdx, ex.exercise || { id: ex.exerciseId, name: ex.exerciseId })}
                  className="shrink-0 text-muted hover:text-accent transition-colors"
                  title="Show demo"
                >
                  <PlayCircle size={20} />
                </button>
              </div>
              {gifExpanded[exIdx] && (
                <div className="border-b border-border bg-surface2 flex items-center justify-center min-h-[120px] p-2">
                  {gifUrls[exIdx] === 'loading' || !gifUrls[exIdx] ? (
                    <span className="text-xs text-muted font-body">Loading…</span>
                  ) : gifUrls[exIdx] === 'not-found' ? (
                    <span className="text-xs text-muted font-body">No image found</span>
                  ) : (
                    <ExerciseDemo
                      url={gifUrls[exIdx].url}
                      url2={gifUrls[exIdx].url2}
                      alt={ex.exercise?.name}
                    />
                  )}
                </div>
              )}

              <div className="px-4 py-2 space-y-1">
                {/* Header row */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 text-xs text-muted font-mono text-center">#</div>
                  <div className="flex-1 text-xs text-muted font-body text-center">KG</div>
                  <div className="flex-1 text-xs text-muted font-body text-center">REPS</div>
                  <div className="w-10" />
                </div>

                {warmupSets.map((set, setIdx) => {
                  const actualIdx = ex.sets.indexOf(set);
                  const prevWarmup = ex.prevSets?.filter(s => s.isWarmup)[setIdx];
                  return (
                    <div key={set.id} className="flex items-center gap-2">
                      <div className="w-8 flex items-center justify-center">
                        <span className="text-xs font-mono text-muted bg-surface2 rounded px-1.5 py-0.5">W</span>
                      </div>
                      {prevWarmup && (
                        <div className="absolute text-xs text-muted font-mono opacity-40 pointer-events-none ml-10">
                          {prevWarmup.weight}×{prevWarmup.reps}
                        </div>
                      )}
                      <input
                        type="number"
                        value={set.weight}
                        onChange={e => handleSetChange(exIdx, actualIdx, 'weight', e.target.value)}
                        placeholder={prevWarmup ? String(prevWarmup.weight) : '—'}
                        className="flex-1 bg-surface2 border border-border rounded px-2 py-2 text-center font-mono text-sm text-muted focus:outline-none focus:border-accent placeholder-muted/50"
                      />
                      <input
                        type="number"
                        value={set.reps}
                        onChange={e => handleSetChange(exIdx, actualIdx, 'reps', e.target.value)}
                        placeholder={prevWarmup ? String(prevWarmup.reps) : '—'}
                        className="flex-1 bg-surface2 border border-border rounded px-2 py-2 text-center font-mono text-sm text-muted focus:outline-none focus:border-accent placeholder-muted/50"
                      />
                      <button
                        onClick={() => handleSetDone(exIdx, actualIdx)}
                        className={`w-10 h-9 rounded flex items-center justify-center border transition-colors ${
                          set.done
                            ? 'bg-surface2 border-border text-muted'
                            : 'bg-transparent border-border text-muted hover:border-accent hover:text-accent'
                        }`}
                      >
                        <Check size={16} />
                      </button>
                    </div>
                  );
                })}

                {workingSets.map((set, wIdx) => {
                  const actualIdx = ex.sets.indexOf(set);
                  const prevWorkingSet = ex.prevSets?.filter(s => !s.isWarmup)[wIdx];
                  return (
                    <div key={set.id} className="space-y-0.5">
                      {prevWorkingSet && (
                        <div className="flex items-center gap-2 px-1">
                          <div className="w-8" />
                          <div className="flex-1 text-center">
                            <span className="text-xs font-mono text-muted/50">
                              {prevWorkingSet.weight}kg × {prevWorkingSet.reps}
                            </span>
                          </div>
                          <div className="flex-1" />
                          <div className="w-10" />
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <div className="w-8 flex items-center justify-center">
                          <span className={`text-xs font-mono ${set.done ? 'text-accent' : 'text-muted'}`}>
                            {set.setNumber}
                          </span>
                        </div>
                        <input
                          type="number"
                          value={set.weight}
                          onChange={e => handleSetChange(exIdx, actualIdx, 'weight', e.target.value)}
                          placeholder={prevWorkingSet ? String(prevWorkingSet.weight) : '0'}
                          className={`flex-1 border rounded px-2 py-2 text-center font-mono text-sm focus:outline-none focus:border-accent ${
                            set.done
                              ? 'bg-accent/10 border-accent/30 text-accent'
                              : 'bg-surface2 border-border text-white'
                          }`}
                        />
                        <input
                          type="number"
                          value={set.reps}
                          onChange={e => handleSetChange(exIdx, actualIdx, 'reps', e.target.value)}
                          placeholder={prevWorkingSet ? String(prevWorkingSet.reps) : '0'}
                          className={`flex-1 border rounded px-2 py-2 text-center font-mono text-sm focus:outline-none focus:border-accent ${
                            set.done
                              ? 'bg-accent/10 border-accent/30 text-accent'
                              : 'bg-surface2 border-border text-white'
                          }`}
                        />
                        <div className="w-10 relative">
                          <button
                            onClick={() => handleSetDone(exIdx, actualIdx)}
                            className={`w-10 h-9 rounded flex items-center justify-center border transition-colors ${
                              set.done
                                ? 'bg-accent border-accent text-bg'
                                : 'bg-transparent border-border text-muted hover:border-accent hover:text-accent'
                            }`}
                          >
                            <Check size={16} />
                          </button>
                          {set.isPR && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                              <span className="text-black text-xs leading-none font-bold">P</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="px-4 pb-3 flex gap-2">
                <button
                  onClick={() => handleAddSet(exIdx)}
                  className="flex-1 flex items-center justify-center gap-1 py-2 text-xs font-body text-muted border border-border rounded hover:border-accent hover:text-accent transition-colors"
                >
                  <Plus size={13} />
                  COPY LAST SET
                </button>
                <button
                  onClick={() => handleAddWarmup(exIdx)}
                  className="flex-1 flex items-center justify-center gap-1 py-2 text-xs font-body text-muted border border-border rounded hover:border-muted transition-colors"
                >
                  <Plus size={13} />
                  WARMUP
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Finish button */}
      <div
        className="fixed bottom-0 left-0 right-0 z-20 px-4 py-3 bg-bg border-t border-border"
        style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}
      >
        <button
          onClick={handleFinish}
          className="w-full max-w-lg mx-auto block bg-accent text-bg font-heading text-2xl py-4 rounded tracking-wider hover:opacity-90 transition-opacity"
        >
          FINISH WORKOUT
        </button>
      </div>

      {/* Rest timer */}
      <RestTimer
        timeLeft={restTimer.timeLeft}
        duration={restDuration}
        isRunning={restTimer.isRunning}
        isActive={restTimer.isActive}
        onPause={restTimer.pause}
        onResume={restTimer.resume}
        onReset={restTimer.reset}
        onSkip={restTimer.skip}
      />

      {/* PR Toast */}
      <Toast
        show={prToast.show}
        exerciseName={prToast.exerciseName}
        fields={prToast.fields}
        onDismiss={() => setPrToast(prev => ({ ...prev, show: false }))}
      />

      {/* Cancel dialog */}
      {showCancel && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end">
          <div className="w-full bg-surface border-t border-border rounded-t-2xl p-6">
            <h3 className="font-heading text-2xl text-white mb-2">CANCEL WORKOUT?</h3>
            <p className="text-muted font-body text-sm mb-6">Your progress will be lost.</p>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/')}
                className="w-full bg-accent2 text-white font-heading text-xl py-3 rounded tracking-wider"
              >
                DISCARD WORKOUT
              </button>
              <button
                onClick={() => setShowCancel(false)}
                className="w-full bg-surface2 text-white font-heading text-xl py-3 rounded tracking-wider border border-border"
              >
                KEEP GOING
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
