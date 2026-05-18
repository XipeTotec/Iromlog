import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { Search } from 'lucide-react';
import { getSessions, getExercises } from '../data/storage.js';
import { MUSCLE_COLORS } from '../data/exercises.js';

const RANGES = [
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '6M', days: 180 },
  { label: 'All', days: Infinity },
];

function formatChartDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

const CHART_THEME = {
  stroke: '#e8ff47',
  grid: '#2a2a2a',
  text: '#666666',
};

export default function Progress() {
  const [sessions, setSessions] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [selectedExId, setSelectedExId] = useState('');
  const [range, setRange] = useState('3M');
  const [exSearch, setExSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    setSessions(getSessions());
    const exs = getExercises();
    setExercises(exs);
    if (exs.length > 0) setSelectedExId(exs[0].id);
  }, []);

  const exMap = useMemo(() => {
    const m = {};
    exercises.forEach(e => { m[e.id] = e; });
    return m;
  }, [exercises]);

  const filteredExercises = exercises.filter(e =>
    e.name.toLowerCase().includes(exSearch.toLowerCase())
  );

  const selectedExercise = exMap[selectedExId];

  const rangeDays = RANGES.find(r => r.label === range)?.days || Infinity;

  const cutoff = useMemo(() => {
    if (rangeDays === Infinity) return new Date(0);
    const d = new Date();
    d.setDate(d.getDate() - rangeDays);
    return d;
  }, [rangeDays]);

  // Filter sessions by date range
  const filteredSessions = useMemo(
    () => sessions.filter(s => new Date(s.date) >= cutoff),
    [sessions, cutoff]
  );

  // Build weight progress data for selected exercise
  const weightData = useMemo(() => {
    if (!selectedExId) return [];
    const points = [];
    filteredSessions
      .slice()
      .reverse()
      .forEach(session => {
        const ex = session.exercises.find(e => e.exerciseId === selectedExId);
        if (!ex) return;
        const workingSets = ex.sets.filter(s => s.done && !s.isWarmup);
        if (workingSets.length === 0) return;
        const maxWeight = Math.max(...workingSets.map(s => s.weight || 0));
        if (maxWeight > 0) {
          points.push({
            date: formatChartDate(session.date),
            weight: maxWeight,
          });
        }
      });
    return points;
  }, [filteredSessions, selectedExId]);

  // Build volume data for selected exercise
  const volumeData = useMemo(() => {
    if (!selectedExId) return [];
    const points = [];
    filteredSessions
      .slice()
      .reverse()
      .forEach(session => {
        const ex = session.exercises.find(e => e.exerciseId === selectedExId);
        if (!ex) return;
        const vol = ex.sets
          .filter(s => s.done && !s.isWarmup)
          .reduce((acc, s) => acc + (s.weight || 0) * (s.reps || 0), 0);
        if (vol > 0) {
          points.push({
            date: formatChartDate(session.date),
            volume: vol,
          });
        }
      });
    return points;
  }, [filteredSessions, selectedExId]);

  // Weekly volume by muscle group
  const muscleVolumeData = useMemo(() => {
    const grouped = {};
    filteredSessions.forEach(session => {
      session.exercises.forEach(ex => {
        const exData = exMap[ex.exerciseId];
        if (!exData) return;
        const group = exData.muscleGroup;
        const vol = ex.sets
          .filter(s => s.done && !s.isWarmup)
          .reduce((acc, s) => acc + (s.weight || 0) * (s.reps || 0), 0);
        grouped[group] = (grouped[group] || 0) + vol;
      });
    });

    return Object.entries(grouped)
      .map(([group, volume]) => ({ group, volume: Math.round(volume) }))
      .sort((a, b) => b.volume - a.volume);
  }, [filteredSessions, exMap]);

  return (
    <div className="min-h-screen bg-bg pb-24 px-4 pt-6 max-w-lg mx-auto">
      <h1 className="font-heading text-4xl text-white mb-6 tracking-wide">PROGRESS</h1>

      {/* Range selector */}
      <div className="flex gap-2 mb-6">
        {RANGES.map(r => (
          <button
            key={r.label}
            onClick={() => setRange(r.label)}
            className={`flex-1 py-2 text-sm font-mono border rounded transition-colors ${
              range === r.label
                ? 'bg-accent text-bg border-accent'
                : 'bg-transparent text-muted border-border hover:border-muted'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Exercise selector */}
      <div className="mb-6 relative">
        <label className="text-xs font-body text-muted uppercase tracking-wider mb-2 block">
          Exercise
        </label>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted z-10" />
          <input
            type="text"
            value={exSearch || selectedExercise?.name || ''}
            onChange={e => {
              setExSearch(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Search exercise..."
            className="w-full bg-surface2 border border-border rounded pl-8 pr-3 py-2 text-white font-body text-sm placeholder-muted focus:outline-none focus:border-accent"
          />
        </div>
        {showDropdown && filteredExercises.length > 0 && (
          <div className="absolute z-20 w-full bg-surface border border-border rounded mt-1 max-h-48 overflow-y-auto shadow-lg">
            {filteredExercises.map(ex => (
              <button
                key={ex.id}
                onClick={() => {
                  setSelectedExId(ex.id);
                  setExSearch('');
                  setShowDropdown(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm font-body hover:bg-surface2 transition-colors ${
                  ex.id === selectedExId ? 'text-accent' : 'text-white'
                }`}
              >
                {ex.name}
                <span className="text-muted text-xs ml-2">{ex.muscleGroup}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Weight progress chart */}
      <div className="mb-8">
        <h2 className="font-heading text-xl text-white mb-3 tracking-wide">
          MAX WEIGHT — {selectedExercise?.name || '—'}
        </h2>
        {weightData.length > 0 ? (
          <div className="bg-surface border border-border rounded-lg p-4">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={weightData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <CartesianGrid stroke={CHART_THEME.grid} strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: CHART_THEME.text, fontSize: 10 }}
                  tickLine={false}
                  axisLine={{ stroke: CHART_THEME.grid }}
                />
                <YAxis
                  tick={{ fill: CHART_THEME.text, fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f1f1f', border: '1px solid #2a2a2a', borderRadius: '4px' }}
                  labelStyle={{ color: '#f0f0f0', fontSize: 11 }}
                  itemStyle={{ color: '#e8ff47', fontSize: 11 }}
                  formatter={v => [`${v}kg`, 'Weight']}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke={CHART_THEME.stroke}
                  strokeWidth={2}
                  dot={{ fill: CHART_THEME.stroke, r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-lg p-8 text-center">
            <div className="text-muted font-body text-sm">No data for this exercise in range</div>
          </div>
        )}
      </div>

      {/* Volume chart */}
      <div className="mb-8">
        <h2 className="font-heading text-xl text-white mb-3 tracking-wide">
          SESSION VOLUME — {selectedExercise?.name || '—'}
        </h2>
        {volumeData.length > 0 ? (
          <div className="bg-surface border border-border rounded-lg p-4">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={volumeData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <CartesianGrid stroke={CHART_THEME.grid} strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: CHART_THEME.text, fontSize: 10 }}
                  tickLine={false}
                  axisLine={{ stroke: CHART_THEME.grid }}
                />
                <YAxis
                  tick={{ fill: CHART_THEME.text, fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f1f1f', border: '1px solid #2a2a2a', borderRadius: '4px' }}
                  labelStyle={{ color: '#f0f0f0', fontSize: 11 }}
                  itemStyle={{ color: '#e8ff47', fontSize: 11 }}
                  formatter={v => [`${v}kg`, 'Volume']}
                />
                <Line
                  type="monotone"
                  dataKey="volume"
                  stroke={CHART_THEME.stroke}
                  strokeWidth={2}
                  dot={{ fill: CHART_THEME.stroke, r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-lg p-8 text-center">
            <div className="text-muted font-body text-sm">No data for this exercise in range</div>
          </div>
        )}
      </div>

      {/* Muscle group volume */}
      <div className="mb-8">
        <h2 className="font-heading text-xl text-white mb-3 tracking-wide">
          VOLUME BY MUSCLE GROUP
        </h2>
        {muscleVolumeData.length > 0 ? (
          <div className="bg-surface border border-border rounded-lg p-4">
            <ResponsiveContainer width="100%" height={muscleVolumeData.length * 40 + 20}>
              <BarChart
                data={muscleVolumeData}
                layout="vertical"
                margin={{ top: 0, right: 10, bottom: 0, left: 10 }}
              >
                <CartesianGrid stroke={CHART_THEME.grid} strokeDasharray="3 3" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fill: CHART_THEME.text, fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  dataKey="group"
                  type="category"
                  tick={{ fill: CHART_THEME.text, fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  width={65}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f1f1f', border: '1px solid #2a2a2a', borderRadius: '4px' }}
                  labelStyle={{ color: '#f0f0f0', fontSize: 11 }}
                  itemStyle={{ color: '#e8ff47', fontSize: 11 }}
                  formatter={v => [`${v}kg`, 'Volume']}
                />
                <Bar dataKey="volume" radius={[0, 2, 2, 0]}>
                  {muscleVolumeData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={MUSCLE_COLORS[entry.group] || '#666666'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-lg p-8 text-center">
            <div className="text-muted font-body text-sm">No data in selected range</div>
          </div>
        )}
      </div>
    </div>
  );
}
