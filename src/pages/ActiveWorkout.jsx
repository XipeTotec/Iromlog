import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, Check, Plus, PlayCircle, TrendingUp, Search, Trash2, RotateCcw, GripVertical, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchExerciseImage } from '../data/exerciseImages.js';
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
import { searchExercises } from '../utils/exerciseSearch.js';
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
  const first = (prevSets || []).find(s => !s.isWarmup && s.done);
  return [{
    id: `set-0-${Date.now()}`,
    setNumber: 1,
    weight: first && first.weight > 0 ? String(first.weight) : '',
    reps: first && first.reps > 0 ? String(first.reps) : String(defaultReps || 10),
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
      notes: '',
    }));
  });

  const [showCancel, setShowCancel] = useState(false);
  const [collapsedEx, setCollapsedEx] = useState({});
  const [reorderIdx, setReorderIdx] = useState(null);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [exSearch, setExSearch] = useState('');
  const [exGroupFilter, setExGroupFilter] = useState(null);
  const [allExercises] = useState(() => getExercises());
  const [prToast, setPrToast] = useState({ show: false, exerciseName: '', fields: [] });
  const [gifExpanded, setGifExpanded] = useState({});
  const [gifUrls, setGifUrls] = useState({});
  const [restDuration, setRestDuration] = useState(() => {
    const settings = getSettings();
    return settings.restDuration || 90;
  });

  const holdRef = useRef(null);

  function startFieldHold(exIdx, actualIdx, field, delta) {
    function step() {
      setExercises(prev => prev.map((ex, i) => {
        if (i !== exIdx) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s, j) => {
            if (j !== actualIdx) return s;
            const cur = parseFloat(s[field]) || 0;
            const next = field === 'weight'
              ? Math.round((cur + delta) * 4) / 4
              : Math.round(cur + delta);
            return { ...s, [field]: String(Math.max(0, next)) };
          }),
        };
      }));
    }
    step();
    holdRef.current = setTimeout(() => { holdRef.current = setInterval(step, 120); }, 400);
  }

  function stopHold() {
    clearTimeout(holdRef.current);
    clearInterval(holdRef.current);
    holdRef.current = null;
  }

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
        setTimeout(() => {
          setExercises(prev => prev.map((e, i) => {
            if (i !== exIdx) return e;
            return { ...e, sets: e.sets.map((s, j) => j === setIdx ? { ...s, isPR: false } : s) };
          }));
        }, 3000);
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
      notes: ex.notes || '',
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
      const apiName = exercise.apiName || exercise.name;
      const result = await fetchExerciseImage(exercise.id, apiName);
      setGifUrls(prev => ({ ...prev, [exIdx]: result || 'not-found' }));
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
    setReorderIdx(null);
  }

  function handleExerciseNoteChange(exIdx, value) {
    setExercises(prev => prev.map((ex, i) => i !== exIdx ? ex : { ...ex, notes: value }));
  }

  function handleToggleSuperset(exIdx) {
    setExercises(prev => {
      const next = prev.map(ex => ({ ...ex }));
      const ex = next[exIdx];
      if (ex.supersetGroup) {
        // Remove supersetGroup from current exercise
        const groupId = ex.supersetGroup;
        delete next[exIdx].supersetGroup;
        // Check remaining members of the group
        const remaining = next.filter(e => e.supersetGroup === groupId);
        if (remaining.length === 1) {
          // Only one left – remove from that one too
          remaining.forEach(e => delete e.supersetGroup);
        }
      } else {
        // Pair current and next exercise
        if (!next[exIdx + 1]) return prev;
        const groupId = `ss-${Date.now()}`;
        next[exIdx].supersetGroup = groupId;
        next[exIdx + 1].supersetGroup = groupId;
      }
      return next;
    });
  }

  function moveExercise(exIdx, dir) {
    const target = exIdx + dir;
    setExercises(prev => {
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[exIdx], next[target]] = [next[target], next[exIdx]];
      return next;
    });
    setReorderIdx(prev => (target < 0 || target >= exercises.length) ? prev : target);
  }

  function handleDeleteSet(exIdx, setIdx) {
    setExercises(prev => prev.map((ex, i) => {
      if (i !== exIdx) return ex;
      const next = ex.sets.filter((_, j) => j !== setIdx);
      let wNum = 0;
      return {
        ...ex,
        sets: next.map(s => s.isWarmup ? s : { ...s, setNumber: ++wNum }),
      };
    }));
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
        notes: '',
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
          const isCollapsed = !!collapsedEx[exIdx];

          // Superset grouping
          const prevEx = exercises[exIdx - 1];
          const isInSuperset = !!ex.supersetGroup;
          const isContinuingSuperset = isInSuperset && prevEx && prevEx.supersetGroup === ex.supersetGroup;
          const borderColor = isInSuperset ? '#e8ff47' : muscleColor;

          return (
            <React.Fragment key={exIdx}>
            {isContinuingSuperset && (
              <div className="flex items-center gap-2 px-3 -my-2">
                <div className="w-px h-4 bg-accent/40 ml-3"></div>
                <span className="text-xs font-heading text-accent/60 tracking-widest">SUPERSET</span>
              </div>
            )}
            <div
              className="bg-surface border border-border rounded-lg overflow-hidden"
              style={{ borderLeft: `3px solid ${borderColor}` }}
            >
              {/* Exercise header */}
              <div className={`px-3 py-2.5 flex items-center gap-2 ${!isCollapsed ? 'border-b border-border' : ''}`}>
                {reorderIdx === exIdx ? (
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      onClick={() => moveExercise(exIdx, -1)}
                      disabled={exIdx === 0}
                      className="w-7 h-7 flex items-center justify-center rounded text-muted hover:text-accent disabled:opacity-20 transition-colors"
                    ><ChevronUp size={16} /></button>
                    <button
                      onClick={() => moveExercise(exIdx, 1)}
                      disabled={exIdx === exercises.length - 1}
                      className="w-7 h-7 flex items-center justify-center rounded text-muted hover:text-accent disabled:opacity-20 transition-colors"
                    ><ChevronDown size={16} /></button>
                    <button
                      onClick={() => handleToggleSuperset(exIdx)}
                      disabled={!exercises[exIdx + 1] && !ex.supersetGroup}
                      className="px-2 h-7 flex items-center rounded text-xs font-heading tracking-wider transition-colors disabled:opacity-20 text-muted hover:text-accent"
                    >
                      {ex.supersetGroup ? 'UNLINK' : 'PAIR ↓'}
                    </button>
                    <button
                      onClick={() => setReorderIdx(null)}
                      className="w-7 h-7 flex items-center justify-center rounded text-muted hover:text-fg transition-colors"
                    ><ChevronLeft size={15} /></button>
                  </div>
                ) : (
                  <button
                    onClick={() => setReorderIdx(exIdx)}
                    className="shrink-0 p-1 -ml-1 text-muted/40 hover:text-muted transition-colors"
                  ><GripVertical size={16} /></button>
                )}
                <button
                  onClick={() => setCollapsedEx(prev => ({ ...prev, [exIdx]: !prev[exIdx] }))}
                  className="font-heading text-lg text-fg flex-1 leading-tight text-left flex items-center gap-1 min-w-0"
                >
                  <span className="truncate">{ex.exercise?.name || ex.exerciseId}</span>
                  {isCollapsed
                    ? <ChevronRight size={14} className="shrink-0 text-muted" />
                    : <ChevronDown size={14} className="shrink-0 text-muted" />
                  }
                </button>
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

              {/* Collapsible body */}
              {!isCollapsed && gifExpanded[exIdx] && (
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
              {!isCollapsed && po && (
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

              {/* Sets, notes, add-set buttons — hidden when collapsed */}
              {!isCollapsed && <>
              <div className="px-3 py-2 space-y-2">
                {/* Column headers */}
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6" />
                  <div className="w-28 text-xs text-muted font-body text-center">KG</div>
                  <div className="w-24 text-xs text-muted font-body text-center">REPS</div>
                  <div className="flex-1" />
                  <div className="w-11" />
                </div>

                {warmupSets.map((set) => {
                  const actualIdx = ex.sets.indexOf(set);
                  const prevWarmup = ex.prevSets?.filter(s => s.isWarmup)[warmupSets.indexOf(set)];
                  return (
                    <div key={set.id} className="flex items-center gap-2">
                      <button onClick={() => handleDeleteSet(exIdx, actualIdx)}
                        className="shrink-0 w-6 h-11 flex items-center justify-center text-muted hover:text-red-400 transition-colors">
                        <X size={13} />
                      </button>
                      <div className="flex items-center gap-0.5 w-28 shrink-0">
                        <button onPointerDown={() => startFieldHold(exIdx, actualIdx, 'weight', -2.5)} onPointerUp={stopHold} onPointerLeave={stopHold}
                          className="shrink-0 w-7 h-11 flex items-center justify-center bg-surface2 border border-border rounded text-muted text-lg select-none touch-none">−</button>
                        <input type="number" value={set.weight} onChange={e => handleSetChange(exIdx, actualIdx, 'weight', e.target.value)}
                          placeholder={prevWarmup ? String(prevWarmup.weight) : '—'}
                          className="min-w-0 flex-1 bg-surface2 border border-border rounded py-3 text-center font-mono text-base text-muted focus:outline-none focus:border-accent placeholder-muted/40" />
                        <button onPointerDown={() => startFieldHold(exIdx, actualIdx, 'weight', 2.5)} onPointerUp={stopHold} onPointerLeave={stopHold}
                          className="shrink-0 w-7 h-11 flex items-center justify-center bg-surface2 border border-border rounded text-muted text-lg select-none touch-none">+</button>
                      </div>
                      <div className="flex items-center gap-0.5 w-24 shrink-0">
                        <button onPointerDown={() => startFieldHold(exIdx, actualIdx, 'reps', -1)} onPointerUp={stopHold} onPointerLeave={stopHold}
                          className="shrink-0 w-6 h-11 flex items-center justify-center bg-surface2 border border-border rounded text-muted text-lg select-none touch-none">−</button>
                        <input type="number" value={set.reps} onChange={e => handleSetChange(exIdx, actualIdx, 'reps', e.target.value)}
                          placeholder={prevWarmup ? String(prevWarmup.reps) : '—'}
                          className="min-w-0 flex-1 bg-surface2 border border-border rounded py-3 text-center font-mono text-base text-muted focus:outline-none focus:border-accent placeholder-muted/40" />
                        <button onPointerDown={() => startFieldHold(exIdx, actualIdx, 'reps', 1)} onPointerUp={stopHold} onPointerLeave={stopHold}
                          className="shrink-0 w-6 h-11 flex items-center justify-center bg-surface2 border border-border rounded text-muted text-lg select-none touch-none">+</button>
                      </div>
                      <button onClick={() => handleSetDone(exIdx, actualIdx)}
                        className={`w-11 h-11 rounded flex items-center justify-center border transition-colors ${
                          set.done ? 'bg-surface2 border-border text-muted' : 'border-border text-muted hover:border-accent hover:text-accent'
                        }`}>
                        <Check size={16} />
                      </button>
                    </div>
                  );
                })}

                {workingSets.map((set, wIdx) => {
                  const actualIdx = ex.sets.indexOf(set);
                  const prev = ex.prevSets?.filter(s => !s.isWarmup)[wIdx];
                  const doneCls = set.done ? 'bg-accent/10 border-accent/30 text-accent' : 'bg-surface2 border-border text-muted';
                  const doneInput = set.done ? 'bg-accent/10 border-accent/30 text-accent' : 'bg-surface2 border-border text-fg';
                  return (
                    <div key={set.id} className="flex items-center gap-2">
                      <button onClick={() => handleDeleteSet(exIdx, actualIdx)}
                        className="shrink-0 w-6 h-11 flex items-center justify-center text-muted hover:text-red-400 transition-colors">
                        <X size={13} />
                      </button>
                      <div className="flex items-center gap-0.5 w-28 shrink-0">
                        <button onPointerDown={() => startFieldHold(exIdx, actualIdx, 'weight', -2.5)} onPointerUp={stopHold} onPointerLeave={stopHold}
                          className={`shrink-0 w-7 h-11 flex items-center justify-center border rounded text-lg select-none touch-none transition-colors ${doneCls}`}>−</button>
                        <input type="number" value={set.weight} onChange={e => handleSetChange(exIdx, actualIdx, 'weight', e.target.value)}
                          placeholder={prev ? String(prev.weight) : '0'}
                          className={`min-w-0 flex-1 border rounded py-3 text-center font-mono text-base focus:outline-none focus:border-accent ${doneInput}`} />
                        <button onPointerDown={() => startFieldHold(exIdx, actualIdx, 'weight', 2.5)} onPointerUp={stopHold} onPointerLeave={stopHold}
                          className={`shrink-0 w-7 h-11 flex items-center justify-center border rounded text-lg select-none touch-none transition-colors ${doneCls}`}>+</button>
                      </div>
                      <div className="flex items-center gap-0.5 w-24 shrink-0">
                        <button onPointerDown={() => startFieldHold(exIdx, actualIdx, 'reps', -1)} onPointerUp={stopHold} onPointerLeave={stopHold}
                          className={`shrink-0 w-6 h-11 flex items-center justify-center border rounded text-lg select-none touch-none transition-colors ${doneCls}`}>−</button>
                        <input type="number" value={set.reps} onChange={e => handleSetChange(exIdx, actualIdx, 'reps', e.target.value)}
                          placeholder={prev ? String(prev.reps) : '0'}
                          className={`min-w-0 flex-1 border rounded py-3 text-center font-mono text-base focus:outline-none focus:border-accent ${doneInput}`} />
                        <button onPointerDown={() => startFieldHold(exIdx, actualIdx, 'reps', 1)} onPointerUp={stopHold} onPointerLeave={stopHold}
                          className={`shrink-0 w-6 h-11 flex items-center justify-center border rounded text-lg select-none touch-none transition-colors ${doneCls}`}>+</button>
                      </div>
                      <div className="relative w-11">
                        <button onClick={() => handleSetDone(exIdx, actualIdx)}
                          className={`w-11 h-11 rounded flex items-center justify-center border transition-colors ${
                            set.done ? 'bg-accent border-accent text-bg' : 'border-border text-muted hover:border-accent hover:text-accent'
                          }`}>
                          <Check size={16} />
                        </button>
                        {set.isPR && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center animate-fadeOut">
                            <span className="text-black text-xs leading-none font-bold">P</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Notes */}
              <textarea
                rows={2}
                value={ex.notes || ''}
                onChange={e => handleExerciseNoteChange(exIdx, e.target.value)}
                placeholder="Notes…"
                className="text-sm font-body text-fg bg-transparent border-0 border-t border-border w-full px-3 py-2 resize-none focus:outline-none placeholder-muted/40 focus:border-accent"
              />

              {/* Add set buttons */}
              <div className="px-3 pb-3 flex gap-2">
                <button
                  onClick={() => handleAddSet(exIdx)}
                  className="flex-1 flex items-center justify-center py-3 text-muted border border-border rounded hover:border-accent hover:text-accent transition-colors"
                >
                  <RotateCcw size={15} />
                </button>
                <button
                  onClick={() => handleAddWarmup(exIdx)}
                  className="flex-1 flex items-center justify-center gap-1 py-3 text-xs font-body text-muted border border-border rounded hover:border-muted transition-colors"
                >
                  <Plus size={12} /> WARMUP
                </button>
              </div>
              </>}
            </div>
            </React.Fragment>
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
          <div className="w-full bg-surface border-t border-border rounded-t-2xl flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between px-4 pt-4 pb-3 shrink-0">
              <h3 className="font-heading text-2xl text-fg">ADD EXERCISE</h3>
              <button onClick={() => { setShowAddExercise(false); setExSearch(''); setExGroupFilter(null); }} className="text-muted hover:text-fg transition-colors">
                <X size={22} />
              </button>
            </div>
            <div className="px-4 pb-2 shrink-0">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  autoFocus
                  type="text"
                  value={exSearch}
                  onChange={e => setExSearch(e.target.value)}
                  placeholder="Search exercises or muscle group…"
                  className="w-full bg-surface2 border border-border rounded pl-8 pr-3 py-3 text-base text-fg font-body placeholder-muted focus:outline-none focus:border-accent"
                />
              </div>
            </div>
            <div className="flex gap-2 px-4 pb-3 overflow-x-auto no-scrollbar shrink-0">
              {Object.entries(MUSCLE_COLORS).map(([group, color]) => (
                <button
                  key={group}
                  onClick={() => setExGroupFilter(prev => prev === group ? null : group)}
                  className="shrink-0 px-3 py-1 rounded-full font-heading text-xs tracking-wider transition-colors"
                  style={exGroupFilter === group
                    ? { backgroundColor: color, color: '#0a0a0a' }
                    : { backgroundColor: '#1f1f1f', color: '#666', border: '1px solid #2a2a2a' }}
                >
                  {group}
                </button>
              ))}
            </div>
            <div className="overflow-y-auto px-4 pb-6 space-y-1">
              {searchExercises(allExercises, exSearch)
                .filter(e => !exGroupFilter || e.muscleGroup === exGroupFilter)
                .map(ex => {
                  const alreadyAdded = exercises.some(e => e.exerciseId === ex.id);
                  const color = MUSCLE_COLORS[ex.muscleGroup] || '#666';
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
                      <span className="ml-2 text-xs font-heading tracking-wider" style={{ color }}>{ex.muscleGroup}</span>
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
