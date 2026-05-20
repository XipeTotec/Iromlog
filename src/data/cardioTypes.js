export const CARDIO_TYPES = {
  run:  { label: 'Run',  color: '#f59e0b' },
  swim: { label: 'Swim', color: '#3b82f6' },
  bike: { label: 'Bike', color: '#10b981' },
  row:  { label: 'Row',  color: '#8b5cf6' },
};

export const SWIM_STROKES = ['Freestyle', 'Breaststroke', 'Backstroke', 'Butterfly', 'IM', 'Mixed'];

export function calcPace(durationSec, distanceKm) {
  if (!distanceKm || !durationSec) return null;
  const secPerKm = durationSec / distanceKm;
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}:${String(s).padStart(2, '0')}/km`;
}

export function calcSpeed(durationSec, distanceKm) {
  if (!distanceKm || !durationSec) return null;
  return (distanceKm / (durationSec / 3600)).toFixed(1) + ' km/h';
}

export function calcSplit(durationSec, distanceM) {
  if (!distanceM || !durationSec) return null;
  const secPer500 = (durationSec / distanceM) * 500;
  const m = Math.floor(secPer500 / 60);
  const s = Math.round(secPer500 % 60);
  return `${m}:${String(s).padStart(2, '0')}/500m`;
}
