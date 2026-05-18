import React, { useEffect } from 'react';

export default function Toast({ show, exerciseName, fields = [], onDismiss }) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onDismiss && onDismiss();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [show, onDismiss]);

  const typeLabel = fields.includes('weight') ? 'Weight' : fields.includes('volume') ? 'Volume' : 'Reps';

  return (
    <div
      className={`fixed top-4 right-4 z-50 transition-transform duration-300 ${
        show ? 'translate-x-0' : 'translate-x-[120%]'
      }`}
    >
      <div className="bg-accent text-bg px-4 py-3 rounded-lg shadow-lg min-w-48">
        <div className="font-heading text-xl leading-none">NEW PR 🏆</div>
        <div className="font-body text-sm font-semibold mt-1">{exerciseName}</div>
        <div className="font-mono text-xs mt-0.5 opacity-80">{typeLabel}</div>
      </div>
    </div>
  );
}
