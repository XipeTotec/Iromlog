import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, Check, Plus, PlayCircle, TrendingUp, Search, Trash2 } from 'lucide-react';
import { fetchExerciseImage } from '../data/exerciseImages.js';
import { fetchExerciseGif } from '../data/exerciseApi.js';
import ExerciseDemo from '../components/ExerciseDemo.jsx';
import { useStopwatch, useRestTimer, formatTime } from '../hooks/useTimer.js';
import {
  checkAndUpdatePR,
  saveSessions,
  getSessions,
  getSettings,
  saveSettings,
  getExercises,
} from '../data/storage.js';
import { MUSCLE_COLORS } from '../data/exercises.js';
import RestTimer from '../components/RestTimer.jsx';
import Toast from '../components/Toast.jsx';

function getPoSuggestion(prevSets) {
  const done = (prevSets || []).filter(s => !s.isWarmup && s.done && s.weight > 0 && s.reps > 0);
  if (!done.length) return null;
  const maxWeight = Math.max(...done.map(s => s.weight));
  const topSets = done.filter(s => s.weight === maxWeight);
  const avgReps = Math.round(topSets.reduce((sum, s) => sum + s.reps, 0) / topSets.length);
  return {
    sets: done.length,
    weight: maxWeight,
    reps: avgReps,
    suggested: Math.round((maxWeight + 2.5) * 4) / 4, // nearest 0.25
  };
}

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
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [exSearch, setExSearch] = useState('');
  const [allExercises] = useState(() => getExercises());
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
      // Try animated GIF from exercisedb.io first, fall back to 2-frame animation
      const apiName = exercise.apiName || exercise.name;
      const gif = await fetchExerciseGif(apiName);
      if (gif && !gif.startsWith('error:')) {
        setGifUrls(prev => ({ ...prev, [exIdx]: { gif } }));
      } else {
        const result = await fetchExerciseImage(exercise.id, apiName);
        setGifUrls(prev => ({ ...prev, [exIdx]: result || 'not-found' }));
      }
    }
  }

  function applyPoWeight(exIdx, weight) {
    setExercises(prev => prev.map((ex, i) => {
      if (i !== exIdx) return ex;
      return {
        ...ex,
        sets: ex.sets.map(s => s.isWarmup ? s : { ...s, weight: String(weight) }),
      };
    }));
  }

  function handleDeleteExercise(exIdx) {
    setExercises(prev => prev.filter((_, i) => i !== exIdx));
  }

  function handleAddExercise(exercise) {
    setExercises(prev => [
      ...prev,
      {
        exerciseId: exercise.id,
        exercise,
        sets: [{
          id: `set-0-${Date.now()}`,
          setNumber: 1,
          weight: '',
          reps: '',
          done: false,
          isWarmup: false,
          isPR: false,
        }],
        prevSets: [],
      },
    ]);
    setShowAddExercise(false);
    setExSearch('');
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
            className="text-muted hover:text-fg transition-colors p-1"
          >
            <X size={22} />
          </button>
          <div className="text-center">
            <div className="font-heading text-xl text-fg tracking-wider">
              {template?.name || 'WORKOUT'}
            </div>
          </div>
          <div className="font-mono text-accent text-lg">
            {formatTime(stopwatch.seconds)}
          </div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="text-sm font-body text-muted">
            <span className="text-fg font-medium">{doneSets}</span> / {totalSets} sets
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
      <div className="px-3 pt-4 space-y-4">
        {exercises.map((ex, exIdx) => {
          const muscleColor = MUSCLE_COLORS[ex.exercise?.muscleGroup] || '#666';
          const workingSets = ex.sets.filter(s => !s.isWarmup);
          const warmupSets = ex.sets.filter(s => s.isWarmup);

          const po = getPoSuggestion(ex.prevSets);

          return (
            <div
              key={exIdx}
              className="bg-surface border border-border rounded-lg overflow-hidden"
              style={{ borderLeft: `3px solid ${muscleColor}` }}
            >
              {/* Exercise header */}
              <div className="px-3 py-2.5 flex items-center gap-2 border-b border-border">
                <span className="font-heading text-lg text-fg flex-1 leading-tight">
                  {ex.exercise?.name || ex.exerciseId}
                </span>
                <button
                  onClick={() => toggleGif(exIdx, ex.exercise || { id: ex.exerciseId, name: ex.exerciseId })}
                  className="shrink-0 p-2 -mr-1 text-muted hover:text-accent transition-colors"
                  title="Show demo"
                >
                  <PlayCircle size={18} />
                </button>
                <button
                  onClick={() => handleDeleteExercise(exIdx)}
                  className="shrink-0 p-2 -mr-2 text-muted hover:text-accent2 transition-colors"
                  title="Remove exercise"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Demo image */}
              {gifExpanded[exIdx] && (
                <div className="border-b border-border bg-surface2 flex items-center justify-center min-h-[120px] p-2">
                  {gifUrls[exIdx] === 'loading' || !gifUrls[exIdx] ? (
                    <span className="text-xs text-muted font-body">Loading…</span>
                  ) : gifUrls[exIdx] === 'not-found' ? (
                    <span className="text-xs text-muted font-body">No image found</span>
                  ) : gifUrls[exIdx]?.gif ? (
                    <img src={gifUrls[exIdx].gif} alt={ex.exercise?.name} className="max-h-52 w-auto object-contain rounded" />
                  ) : (
                    <ExerciseDemo url={gifUrls[exIdx].url} url2={gifUrls[exIdx].url2} alt={ex.exercise?.name} />
                  )}
                </div>
              )}

              {/* PO suggestion */}
              {po && (
                <div className="px-3 py-2 border-b border-border flex items-center gap-2 bg-surface2">
                  <TrendingUp size={13} className="text-accent shrink-0" />
                  <span className="text-xs font-mono text-muted flex-1">
                    Last: {po.sets}×{po.weight}kg×{po.reps}
                  </span>
                  <button
                    onClick={() => applyPoWeight(exIdx, po.suggested)}
                    className="text-xs font-mono text-accent border border-accent/40 rounded px-2 py-0.5 hover:bg-accent/10 transition-colors shrink-0"
                  >
                    +2.5 → {po.suggested}kg
                  </button>
                </div>
              )}

              {/* Sets */}
              <div className="px-3 py-2 space-y-2">
                {/* Column headers */}
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 text-xs text-muted font-mono text-center">#</div>
                  <div className="flex-1 text-xs text-muted font-body text-center">KG</div>
                  <div className="flex-1 text-xs text-muted font-body text-center">REPS</div>
                  <div className="w-11" />
                </div>

                {warmupSets.map((set) => {
                  const actualIdx = ex.sets.indexOf(set);
                  const prevWarmup = ex.prevSets?.filter(s => s.isWarmup)[warmupSets.indexOf(set)];
                  return (
                    <div key={set.id} className="flex items-center gap-2">
                      <div className="w-7 flex items-center justify-center">
                        <span className="text-xs font-mono text-muted bg-surface2 rounded px-1">W</span>
                      </div>
                      <input
                        type="number"
                        value={set.weight}
                        onChange={e => handleSetChange(exIdx, actualIdx, 'weight', e.target.value)}
                        placeholder={prevWarmup ? String(prevWarmup.weight) : '—'}
                        className="flex-1 bg-surface2 border border-border rounded px-2 py-3 text-center font-mono text-base text-muted focus:outline-none focus:border-accent placeholder-muted/40"
                      />
                      <input
                        type="number"
                        value={set.reps}
                        onChange={e => handleSetChange(exIdx, actualIdx, 'reps', e.target.value)}
                        placeholder={prevWarmup ? String(prevWarmup.reps) : '—'}
                        className="flex-1 bg-surface2 border border-border rounded px-2 py-3 text-center font-mono text-base text-muted focus:outline-none focus:border-accent placeholder-muted/40"
                      />
                      <button
                        onClick={() => handleSetDone(exIdx, actualIdx)}
                        className={`w-11 h-11 rounded flex items-center justify-center border transition-colors ${
                          set.done ? 'bg-surface2 border-border text-muted' : 'border-border text-muted hover:border-accent hover:text-accent'
                        }`}
                      >
                        <Check size={16} />
                      </button>
                    </div>
                  );
                })}

                {workingSets.map((set, wIdx) => {
                  const actualIdx = ex.sets.indexOf(set);
                  const prev = ex.prevSets?.filter(s => !s.isWarmup)[wIdx];
                  return (
                    <div key={set.id} className="flex items-center gap-2">
                      <div className="w-7 flex items-center justify-center">
                        <span className={`text-xs font-mono ${set.done ? 'text-accent' : 'text-muted'}`}>
                          {set.setNumber}
                        </span>
                      </div>
                      <input
                        type="number"
                        value={set.weight}
                        onChange={e => handleSetChange(exIdx, actualIdx, 'weight', e.target.value)}
                        placeholder={prev ? String(prev.weight) : '0'}
                        className={`flex-1 border rounded px-2 py-3 text-center font-mono text-base focus:outline-none focus:border-accent ${
                          set.done ? 'bg-accent/10 border-accent/30 text-accent' : 'bg-surface2 border-border text-fg'
                        }`}
                      />
                      <input
                        type="number"
                        value={set.reps}
                        onChange={e => handleSetChange(exIdx, actualIdx, 'reps', e.target.value)}
                        placeholder={prev ? String(prev.reps) : '0'}
                        className={`flex-1 border rounded px-2 py-3 text-center font-mono text-base focus:outline-none focus:border-accent ${
                          set.done ? 'bg-accent/10 border-accent/30 text-accent' : 'bg-surface2 border-border text-fg'
                        }`}
                      />
                      <div className="relative w-11">
                        <button
                          onClick={() => handleSetDone(exIdx, actualIdx)}
                          className={`w-11 h-11 rounded flex items-center justify-center border transition-colors ${
                            set.done ? 'bg-accent border-accent text-bg' : 'border-border text-muted hover:border-accent hover:text-accent'
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
                  );
                })}
              </div>

              {/* Add set buttons */}
              <div className="px-3 pb-3 flex gap-2">
                <button
                  onClick={() => handleAddSet(exIdx)}
                  className="flex-1 flex items-center justify-center gap-1 py-3 text-xs font-body text-muted border border-border rounded hover:border-accent hover:text-accent transition-colors"
                >
                  <Plus size={12} /> COPY LAST SET
                </button>
                <button
                  onClick={() => handleAddWarmup(exIdx)}
                  className="flex-1 flex items-center justify-center gap-1 py-3 text-xs font-body text-muted border border-border rounded hover:border-muted transition-colors"
                >
                  <Plus size={12} /> WARMUP
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add exercise button */}
      <div className="px-3 pt-2 pb-4">
        <button
          onClick={() => setShowAddExercise(true)}
          className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-border rounded-lg text-sm font-body text-muted hover:text-accent hover:border-accent transition-colors"
        >
          <Plus size={15} /> ADD EXERCISE
        </button>
      </div>

      {/* Finish button */}
      <div
        className="fixed bottom-0 left-0 right-0 z-20 px-4 py-3 bg-bg border-t border-border"
        style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}
      >
        <button
          onClick={handleFinish}
          className="w-full bg-accent text-bg font-heading text-2xl py-4 rounded tracking-wider hover:opacity-90 transition-opacity"
        >
          FINISH WORKOUT
        </button>
      </div>

      {/* Add exercise picker */}
      {showAddExercise && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end">
          <div className="w-full bg-surface border-t border-border rounded-t-2xl flex flex-col max-h-[75vh]">
            <div className="flex items-center justify-between px-4 pt-4 pb-3 shrink-0">
              <h3 className="font-heading text-2xl text-fg">ADD EXERCISE</h3>
              <button onClick={() => { setShowAddExercise(false); setExSearch(''); }} className="text-muted hover:text-fg transition-colors">
                <X size={22} />
              </button>
            </div>
            <div className="px-4 pb-3 shrink-0">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  autoFocus
                  type="text"
                  value={exSearch}
                  onChange={e => setExSearch(e.target.value)}
                  placeholder="Search exercises…"
                  className="w-full bg-surface2 border border-border rounded pl-8 pr-3 py-3 text-base text-fg font-body placeholder-muted focus:outline-none focus:border-accent"
                />
              </div>
            </div>
            <div className="overflow-y-auto px-4 pb-6 space-y-1">
              {allExercises
                .filter(e => e.name.toLowerCase().includes(exSearch.toLowerCase()))
                .map(ex => {
                  const alreadyAdded = exercises.some(e => e.exerciseId === ex.id);
                  return (
                    <button
                      key={ex.id}
                      onClick={() => !alreadyAdded && handleAddExercise(ex)}
                      className={`w-full text-left px-3 py-3.5 rounded font-body text-base border transition-colors ${
                        alreadyAdded
                          ? 'border-transparent text-muted opacity-40 cursor-default'
                          : 'bg-surface2 border-transparent text-fg hover:border-accent hover:text-accent'
                      }`}
                    >
                      {ex.name}
                      <span className="ml-2 text-xs opacity-50">{ex.muscleGroup}</span>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}

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
            <h3 className="font-heading text-2xl text-fg mb-2">CANCEL WORKOUT?</h3>
            <p className="text-muted font-body text-sm mb-6">Your progress will be lost.</p>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/')}
                className="w-full bg-accent2 text-fg font-heading text-xl py-3 rounded tracking-wider"
              >
                DISCARD WORKOUT
              </button>
              <button
                onClick={() => setShowCancel(false)}
                className="w-full bg-surface2 text-fg font-heading text-xl py-3 rounded tracking-wider border border-border"
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
