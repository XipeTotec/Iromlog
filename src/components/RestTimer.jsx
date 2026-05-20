import React from 'react';
import { X, Pause, Play, RotateCcw } from 'lucide-react';
import { formatTime } from '../hooks/useTimer.js';

const SIZE = 100;
const STROKE = 6;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function RestTimer({ timeLeft, duration, isRunning, isActive, onPause, onResume, onReset, onSkip }) {
  if (!isActive) return null;

  const progress = duration > 0 ? timeLeft / duration : 0;
  const dashOffset = CIRCUMFERENCE * (1 - progress);
  const isUrgent = timeLeft <= 10 && timeLeft > 0;
  const color = isUrgent ? '#ff4747' : '#e8ff47';

  return (
    <div
      className="fixed bottom-20 left-1/2 z-40 -translate-x-1/2 flex flex-col items-center gap-3
                 bg-surface border border-border rounded-2xl px-5 pt-4 pb-3 shadow-2xl"
      style={{ minWidth: 160 }}
    >
      <span className="font-heading text-xs tracking-widest text-muted">REST</span>

      <div className="relative">
        <svg width={SIZE} height={SIZE} className="rotate-[-90deg]">
          <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke="#2a2a2a" strokeWidth={STROKE} />
          <circle
            cx={SIZE / 2} cy={SIZE / 2} r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth={STROKE}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-mono text-xl font-medium" style={{ color }}>
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onReset}
          className="w-9 h-9 rounded-lg bg-surface2 border border-border flex items-center justify-center text-muted hover:text-fg transition-colors"
          title="Restart"
        >
          <RotateCcw size={15} />
        </button>

        <button
          onClick={isRunning ? onPause : onResume}
          className="w-11 h-11 rounded-lg flex items-center justify-center border transition-colors"
          style={{ backgroundColor: color + '22', borderColor: color, color }}
          title={isRunning ? 'Pause' : 'Resume'}
        >
          {isRunning ? <Pause size={18} /> : <Play size={18} />}
        </button>

        <button
          onClick={onSkip}
          className="w-9 h-9 rounded-lg bg-surface2 border border-border flex items-center justify-center text-muted hover:text-accent2 transition-colors"
          title="Skip"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
