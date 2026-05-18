import React from 'react';
import { X } from 'lucide-react';
import { formatTime } from '../hooks/useTimer.js';

const SIZE = 72;
const STROKE = 5;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function RestTimer({ timeLeft, duration, isRunning, onSkip }) {
  if (!isRunning) return null;

  const progress = duration > 0 ? timeLeft / duration : 0;
  const dashOffset = CIRCUMFERENCE * (1 - progress);
  const isUrgent = timeLeft <= 10;

  return (
    <div className="fixed bottom-20 right-4 z-40 flex flex-col items-center gap-1">
      <div className="relative">
        <svg width={SIZE} height={SIZE} className="rotate-[-90deg]">
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="#2a2a2a"
            strokeWidth={STROKE}
          />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={isUrgent ? '#ff4747' : '#e8ff47'}
            strokeWidth={STROKE}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={`font-mono text-sm font-medium ${isUrgent ? 'text-accent2' : 'text-accent'}`}
          >
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>
      <button
        onClick={onSkip}
        className="flex items-center justify-center w-7 h-7 rounded bg-surface2 border border-border text-muted hover:text-white transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
}
