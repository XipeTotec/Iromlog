import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, Pause, Play } from 'lucide-react';
import { useStopwatch, formatTime } from '../hooks/useTimer.js';
import { saveCardioSession } from '../data/storage.js';
import {
  CARDIO_TYPES, SWIM_STROKES,
  calcPace, calcSpeed, calcSplit,
} from '../data/cardioTypes.js';

const TYPES = Object.keys(CARDIO_TYPES);

export default function ActiveCardio() {
  const navigate = useNavigate();
  const location = useLocation();
  const stopwatch = useStopwatch();
  const [type, setType] = useState(location.state?.type || 'run');
  const [started, setStarted] = useState(false);
  const [distanceKm, setDistanceKm] = useState('');
  const [distanceM, setDistanceM] = useState('');
  const [stroke, setStroke] = useState('Freestyle');
  const [rounds, setRounds] = useState('');
  const [notes, setNotes] = useState('');
  const [showCancel, setShowCancel] = useState(false);

  function handleStart() {
    setStarted(true);
    stopwatch.start();
  }

  function handleTogglePause() {
    if (stopwatch.isRunning) stopwatch.stop();
    else stopwatch.start();
  }

  function handleSave() {
    const session = {
      id: `cardio-${Date.now()}`,
      kind: 'cardio',
      type,
      date: new Date().toISOString(),
      durationSeconds: stopwatch.seconds,
      notes: notes.trim() || null,
    };

    if (type === 'run' || type === 'bike' || type === 'walk') {
      session.distanceKm = parseFloat(distanceKm) || null;
    }
    if (type === 'swim' || type === 'row') {
      session.distanceM = parseFloat(distanceM) || null;
    }
    if (type === 'swim') {
      session.stroke = stroke;
    }
    if (type === 'hiit') {
      session.rounds = parseInt(rounds) || null;
    }

    saveCardioSession(session);
    navigate('/history');
  }

  const color = CARDIO_TYPES[type].color;
  const dkm = parseFloat(distanceKm);
  const dm = parseFloat(distanceM);

  let derivedStat = null;
  if (type === 'run' && dkm) derivedStat = calcPace(stopwatch.seconds, dkm);
  if (type === 'bike' && dkm) derivedStat = calcSpeed(stopwatch.seconds, dkm);
  if (type === 'row' && dm) derivedStat = calcSplit(stopwatch.seconds, dm);

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-surface border-b border-border px-4 py-3 flex items-center justify-between">
        <button onClick={() => setShowCancel(true)} className="text-muted hover:text-white transition-colors">
          <X size={22} />
        </button>
        <span className="font-heading text-xl text-white tracking-wider">CARDIO</span>
        <div className="w-6" />
      </div>

      {/* Type tabs */}
      <div className="flex overflow-x-auto gap-2 px-4 py-3 border-b border-border no-scrollbar">
        {TYPES.map(t => (
          <button
            key={t}
            onClick={() => { if (!started) setType(t); }}
            className="shrink-0 px-3 py-1.5 rounded-full font-heading text-sm tracking-wider transition-colors"
            style={
              type === t
                ? { backgroundColor: CARDIO_TYPES[t].color, color: '#0a0a0a' }
                : { backgroundColor: '#1f1f1f', color: '#666' }
            }
          >
            {CARDIO_TYPES[t].label}
          </button>
        ))}
      </div>

      {/* Timer */}
      <div className="flex flex-col items-center justify-center py-10 gap-4">
        <div className="font-mono text-6xl font-medium" style={{ color }}>
          {formatTime(stopwatch.seconds)}
        </div>
        {!started ? (
          <button
            onClick={handleStart}
            className="mt-2 px-10 py-3 rounded-xl font-heading text-xl tracking-wider text-bg"
            style={{ backgroundColor: color }}
          >
            START
          </button>
        ) : (
          <button
            onClick={handleTogglePause}
            className="w-14 h-14 rounded-full flex items-center justify-center border-2 transition-colors"
            style={{ borderColor: color, color }}
          >
            {stopwatch.isRunning ? <Pause size={22} /> : <Play size={22} />}
          </button>
        )}
      </div>

      {/* Sport-specific fields */}
      <div className="px-4 space-y-4 flex-1">

        {/* Run / Bike / Walk — distance km */}
        {(type === 'run' || type === 'bike' || type === 'walk') && (
          <div className="bg-surface border border-border rounded-lg p-4">
            <label className="text-xs font-body text-muted uppercase tracking-wider block mb-2">Distance (km)</label>
            <input
              type="number"
              value={distanceKm}
              onChange={e => setDistanceKm(e.target.value)}
              placeholder="0.00"
              step="0.01"
              className="w-full bg-surface2 border border-border rounded px-3 py-3 font-mono text-2xl text-white text-center focus:outline-none focus:border-accent"
            />
            {derivedStat && (
              <div className="text-center mt-2 font-mono text-sm" style={{ color }}>
                {derivedStat}
              </div>
            )}
          </div>
        )}

        {/* Swim — stroke + distance m */}
        {type === 'swim' && (
          <>
            <div className="bg-surface border border-border rounded-lg p-4">
              <label className="text-xs font-body text-muted uppercase tracking-wider block mb-3">Stroke</label>
              <div className="flex flex-wrap gap-2">
                {SWIM_STROKES.map(s => (
                  <button
                    key={s}
                    onClick={() => setStroke(s)}
                    className="px-3 py-1.5 rounded-full text-sm font-body transition-colors"
                    style={
                      stroke === s
                        ? { backgroundColor: color, color: '#0a0a0a' }
                        : { backgroundColor: '#1f1f1f', color: '#666', border: '1px solid #2a2a2a' }
                    }
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-surface border border-border rounded-lg p-4">
              <label className="text-xs font-body text-muted uppercase tracking-wider block mb-2">Distance (m)</label>
              <input
                type="number"
                value={distanceM}
                onChange={e => setDistanceM(e.target.value)}
                placeholder="0"
                className="w-full bg-surface2 border border-border rounded px-3 py-3 font-mono text-2xl text-white text-center focus:outline-none focus:border-accent"
              />
            </div>
          </>
        )}

        {/* Row — distance m + split */}
        {type === 'row' && (
          <div className="bg-surface border border-border rounded-lg p-4">
            <label className="text-xs font-body text-muted uppercase tracking-wider block mb-2">Distance (m)</label>
            <input
              type="number"
              value={distanceM}
              onChange={e => setDistanceM(e.target.value)}
              placeholder="0"
              className="w-full bg-surface2 border border-border rounded px-3 py-3 font-mono text-2xl text-white text-center focus:outline-none focus:border-accent"
            />
            {derivedStat && (
              <div className="text-center mt-2 font-mono text-sm" style={{ color }}>
                {derivedStat}
              </div>
            )}
          </div>
        )}

        {/* HIIT — rounds */}
        {type === 'hiit' && (
          <div className="bg-surface border border-border rounded-lg p-4">
            <label className="text-xs font-body text-muted uppercase tracking-wider block mb-2">Rounds</label>
            <input
              type="number"
              value={rounds}
              onChange={e => setRounds(e.target.value)}
              placeholder="0"
              className="w-full bg-surface2 border border-border rounded px-3 py-3 font-mono text-2xl text-white text-center focus:outline-none focus:border-accent"
            />
          </div>
        )}

        {/* Notes */}
        <div className="bg-surface border border-border rounded-lg p-4">
          <label className="text-xs font-body text-muted uppercase tracking-wider block mb-2">Notes</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="How did it feel?"
            rows={2}
            className="w-full bg-surface2 border border-border rounded px-3 py-2 font-body text-sm text-white resize-none focus:outline-none focus:border-accent placeholder-muted/40"
          />
        </div>
      </div>

      {/* Save button */}
      <div className="px-4 py-4" style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}>
        <button
          onClick={handleSave}
          disabled={!started}
          className="w-full bg-accent text-bg font-heading text-2xl py-4 rounded tracking-wider disabled:opacity-30 hover:opacity-90 transition-opacity"
        >
          SAVE
        </button>
      </div>

      {/* Cancel dialog */}
      {showCancel && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end">
          <div className="w-full bg-surface border-t border-border rounded-t-2xl p-6">
            <h3 className="font-heading text-2xl text-white mb-2">DISCARD SESSION?</h3>
            <p className="text-muted font-body text-sm mb-6">This session won't be saved.</p>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/')}
                className="w-full bg-accent2 text-white font-heading text-xl py-3 rounded tracking-wider"
              >
                DISCARD
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
