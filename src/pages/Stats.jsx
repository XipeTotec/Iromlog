import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Cell
} from 'recharts';
import { Trash2, Key, RefreshCw, Sun, Moon } from 'lucide-react';
import { useTheme } from '../hooks/useTheme.js';
import { clearGifCache } from '../data/exerciseApi.js';
import { clearExerciseImageCache, getDbStatus, downloadExerciseDb } from '../data/exerciseImages.js';
import {
  getSessions,
  getExercises,
  getPRs,
  getBodyStats,
  saveBodyStats,
  getStreakCount,
  getTotalVolume,
  getFavoriteExercise,
  getMuscleFrequency,
} from '../data/storage.js';
import { MUSCLE_COLORS } from '../data/exercises.js';

const CHART_THEME = {
  stroke: '#e8ff47',
  grid: '#2a2a2a',
  text: '#666666',
};

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatChartDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function Stats() {
  const [sessions, setSessions] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [prs, setPrs] = useState({});
  const [bodyStats, setBodyStats] = useState([]);
  const [streak, setStreak] = useState(0);
  const [totalVolume, setTotalVolume] = useState(0);
  const [favoriteEx, setFavoriteEx] = useState(null);
  const [muscleFreq, setMuscleFreq] = useState({});

  // Body stats form
  const [bsDate, setBsDate] = useState(new Date().toISOString().split('T')[0]);
  const [bsWeight, setBsWeight] = useState('');
  const [bsFat, setBsFat] = useState('');
  const [dbStatus, setDbStatus] = useState(getDbStatus);
  const [dbLoading, setDbLoading] = useState(false);
  const { theme, toggle: toggleTheme } = useTheme();

  const [githubPat, setGithubPat] = useState(() => localStorage.getItem('il_github_pat') || '');
  const [backupStatus, setBackupStatus] = useState('');
  const [backupLoading, setBackupLoading] = useState(false);

  async function handleBackup() {
    const pat = localStorage.getItem('il_github_pat');
    if (!pat) { alert('Enter a GitHub PAT first'); return; }

    const data = {};
    ['il_exercises','il_templates','il_sessions','il_prs','il_body_stats','il_settings','il_cardio'].forEach(k => {
      const v = localStorage.getItem(k);
      if (v) data[k] = JSON.parse(v);
    });
    if (pat) data['il_github_pat'] = pat;

    const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));
    const REPO = 'xipetotec/iromlog';
    const PATH = 'backup/data.json';

    let sha;
    try {
      const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${PATH}`, {
        headers: { Authorization: `Bearer ${pat}`, Accept: 'application/vnd.github.v3+json' }
      });
      if (res.ok) { const j = await res.json(); sha = j.sha; }
    } catch {}

    const body = { message: `Backup ${new Date().toISOString()}`, content };
    if (sha) body.sha = sha;

    const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${PATH}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${pat}`, Accept: 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) { setBackupStatus('✓ Backed up'); }
    else { setBackupStatus('✗ Failed'); }
  }

  async function handleRestore() {
    const pat = localStorage.getItem('il_github_pat');
    if (!pat) { alert('Enter a GitHub PAT first'); return; }
    if (!confirm('This will overwrite all local data. Continue?')) return;

    const REPO = 'xipetotec/iromlog';
    const PATH = 'backup/data.json';

    const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${PATH}`, {
      headers: { Authorization: `Bearer ${pat}`, Accept: 'application/vnd.github.v3+json' }
    });
    if (!res.ok) { alert('No backup found'); return; }
    const j = await res.json();
    const data = JSON.parse(decodeURIComponent(escape(atob(j.content.replace(/\n/g,'')))));
    Object.entries(data).forEach(([k, v]) => {
      if (k === 'il_github_pat') localStorage.setItem(k, v);
      else localStorage.setItem(k, JSON.stringify(v));
    });
    alert('Restored! Reloading…');
    window.location.reload();
  }

  useEffect(() => {
    setSessions(getSessions());
    setExercises(getExercises());
    setPrs(getPRs());
    setBodyStats(getBodyStats());
    setStreak(getStreakCount());
    setTotalVolume(getTotalVolume());
    setFavoriteEx(getFavoriteExercise());
    setMuscleFreq(getMuscleFrequency());
  }, []);

  const exMap = {};
  exercises.forEach(e => { exMap[e.id] = e; });

  const favoriteExName = favoriteEx ? exMap[favoriteEx.exerciseId]?.name || favoriteEx.exerciseId : '—';

  // PR data for table
  const prList = Object.entries(prs)
    .map(([id, pr]) => ({ exerciseId: id, ...pr }))
    .sort((a, b) => b.maxWeight - a.maxWeight);

  // Muscle frequency chart data
  const muscleFreqData = Object.entries(muscleFreq)
    .map(([group, count]) => ({ group, count }))
    .sort((a, b) => b.count - a.count);

  // Body stats chart
  const bodyStatsChartData = bodyStats.map(bs => ({
    date: formatChartDate(bs.date),
    weight: bs.weight,
  }));

  function handleAddBodyStat() {
    if (!bsDate || !bsWeight) return;
    const newStat = {
      id: `bs-${Date.now()}`,
      date: bsDate,
      weight: parseFloat(bsWeight),
      bodyFat: bsFat ? parseFloat(bsFat) : null,
    };
    const existing = getBodyStats();
    const updated = [...existing, newStat].sort((a, b) => new Date(a.date) - new Date(b.date));
    saveBodyStats(updated);
    setBodyStats(updated);
    setBsWeight('');
    setBsFat('');
  }

  function handleDeleteBodyStat(id) {
    const existing = getBodyStats();
    const updated = existing.filter(bs => bs.id !== id);
    saveBodyStats(updated);
    setBodyStats(updated);
  }

  const totalVolumeDisplay = totalVolume >= 1000
    ? `${(totalVolume / 1000).toFixed(1)}t`
    : `${Math.round(totalVolume)}kg`;

  return (
    <div className="min-h-screen bg-bg pb-24 px-4 pt-6 max-w-lg mx-auto">
      <h1 className="font-heading text-4xl text-fg mb-6 tracking-wide">STATS</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="bg-surface border border-border rounded-lg p-4">
          <div className="text-xs font-body text-muted uppercase tracking-wider mb-1">Streak</div>
          <div className="font-heading text-4xl text-accent">{streak}</div>
          <div className="text-xs font-mono text-muted">days 🔥</div>
        </div>
        <div className="bg-surface border border-border rounded-lg p-4">
          <div className="text-xs font-body text-muted uppercase tracking-wider mb-1">Sessions</div>
          <div className="font-heading text-4xl text-accent">{sessions.length}</div>
          <div className="text-xs font-mono text-muted">total</div>
        </div>
        <div className="bg-surface border border-border rounded-lg p-4">
          <div className="text-xs font-body text-muted uppercase tracking-wider mb-1">Volume</div>
          <div className="font-heading text-4xl text-accent">{totalVolumeDisplay}</div>
          <div className="text-xs font-mono text-muted">lifted</div>
        </div>
        <div className="bg-surface border border-border rounded-lg p-4">
          <div className="text-xs font-body text-muted uppercase tracking-wider mb-1">Favourite</div>
          <div className="font-heading text-xl text-accent leading-tight mt-1 line-clamp-2">
            {favoriteExName}
          </div>
          {favoriteEx && (
            <div className="text-xs font-mono text-muted">{favoriteEx.count}×</div>
          )}
        </div>
      </div>

      {/* Muscle Frequency */}
      <div className="mb-8">
        <h2 className="font-heading text-2xl text-fg mb-3 tracking-wide">MUSCLE FREQUENCY</h2>
        {muscleFreqData.length > 0 ? (
          <div className="bg-surface border border-border rounded-lg p-4">
            <ResponsiveContainer width="100%" height={muscleFreqData.length * 44 + 20}>
              <BarChart
                data={muscleFreqData}
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
                  width={70}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f1f1f', border: '1px solid #2a2a2a', borderRadius: '4px' }}
                  labelStyle={{ color: '#f0f0f0', fontSize: 11 }}
                  itemStyle={{ color: '#e8ff47', fontSize: 11 }}
                  formatter={v => [`${v} workouts`, 'Count']}
                />
                <Bar dataKey="count" radius={[0, 2, 2, 0]}>
                  {muscleFreqData.map((entry, index) => (
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
            <div className="text-muted font-body text-sm">Complete workouts to see muscle frequency</div>
          </div>
        )}
      </div>

      {/* Personal Records */}
      <div className="mb-8">
        <h2 className="font-heading text-2xl text-fg mb-3 tracking-wide">PERSONAL RECORDS</h2>
        {prList.length > 0 ? (
          <div className="space-y-2">
            {prList.map(pr => {
              const ex = exMap[pr.exerciseId];
              return (
                <div
                  key={pr.exerciseId}
                  className="bg-surface border border-border rounded-lg px-4 py-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-body font-semibold text-fg text-sm">
                        {ex?.name || pr.exerciseId}
                      </div>
                      {pr.date && (
                        <div className="text-xs font-mono text-muted mt-0.5">
                          {formatDate(pr.date)}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-accent font-medium">
                        {pr.maxWeight}kg
                      </div>
                      <div className="text-xs font-mono text-muted">
                        × {pr.maxReps} reps
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-border flex gap-4">
                    <div>
                      <div className="text-xs text-muted font-body">Max Weight</div>
                      <div className="font-mono text-sm text-fg">{pr.maxWeight}kg</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted font-body">Max Reps</div>
                      <div className="font-mono text-sm text-fg">{pr.maxReps}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted font-body">Max Volume</div>
                      <div className="font-mono text-sm text-fg">{Math.round(pr.maxVolume)}kg</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-lg p-8 text-center">
            <div className="text-muted font-body text-sm">No personal records yet</div>
          </div>
        )}
      </div>

      {/* Body Stats */}
      <div className="mb-8">
        <h2 className="font-heading text-2xl text-fg mb-3 tracking-wide">BODY STATS</h2>

        {/* Add form */}
        <div className="bg-surface border border-border rounded-lg p-4 mb-4">
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div>
              <label className="text-xs font-body text-muted uppercase mb-1 block">Date</label>
              <input
                type="date"
                value={bsDate}
                onChange={e => setBsDate(e.target.value)}
                className="w-full bg-surface2 border border-border rounded px-2 py-2 text-fg font-mono text-xs focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="text-xs font-body text-muted uppercase mb-1 block">Weight (kg)</label>
              <input
                type="number"
                value={bsWeight}
                onChange={e => setBsWeight(e.target.value)}
                placeholder="75.0"
                className="w-full bg-surface2 border border-border rounded px-2 py-2 text-fg font-mono text-xs focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="text-xs font-body text-muted uppercase mb-1 block">Body Fat %</label>
              <input
                type="number"
                value={bsFat}
                onChange={e => setBsFat(e.target.value)}
                placeholder="Optional"
                className="w-full bg-surface2 border border-border rounded px-2 py-2 text-fg font-mono text-xs focus:outline-none focus:border-accent"
              />
            </div>
          </div>
          <button
            onClick={handleAddBodyStat}
            disabled={!bsDate || !bsWeight}
            className="w-full bg-accent text-bg font-heading text-lg py-2 rounded tracking-wider hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            ADD
          </button>
        </div>

        {/* Chart */}
        {bodyStatsChartData.length > 0 && (
          <div className="bg-surface border border-border rounded-lg p-4 mb-4">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={bodyStatsChartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
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
                  itemStyle={{ color: '#4ecdc4', fontSize: 11 }}
                  formatter={v => [`${v}kg`, 'Weight']}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#4ecdc4"
                  strokeWidth={2}
                  dot={{ fill: '#4ecdc4', r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Body stats list */}
        {bodyStats.length > 0 ? (
          <div className="space-y-2">
            {[...bodyStats].reverse().slice(0, 10).map(bs => (
              <div
                key={bs.id}
                className="bg-surface border border-border rounded px-4 py-2.5 flex items-center justify-between"
              >
                <div>
                  <div className="font-mono text-xs text-muted">{formatDate(bs.date)}</div>
                  <div className="font-mono text-sm text-fg mt-0.5">
                    {bs.weight}kg
                    {bs.bodyFat !== null && bs.bodyFat !== undefined && (
                      <span className="text-muted ml-2">{bs.bodyFat}% BF</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteBodyStat(bs.id)}
                  className="text-muted hover:text-accent2 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-lg p-6 text-center">
            <div className="text-muted font-body text-sm">No body stats recorded yet</div>
          </div>
        )}

      {/* Settings */}
      <div className="px-4 pb-8">
        <h2 className="font-heading text-2xl text-fg tracking-wider mb-3 flex items-center gap-2">
          <Key size={18} className="text-muted" /> SETTINGS
        </h2>
        <div className="bg-surface border border-border rounded-lg p-4 space-y-4">
          <div>
            <label className="text-xs font-body text-muted uppercase tracking-wider block mb-2">
              Exercise Image Database
            </label>
            {dbStatus.loaded ? (
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-accent">✓ {dbStatus.count} exercises loaded</span>
                <button
                  onClick={() => { clearExerciseImageCache(); setDbStatus({ loaded: false, count: 0 }); }}
                  className="text-xs font-body text-muted hover:text-accent2 transition-colors"
                >
                  Clear
                </button>
              </div>
            ) : (
              <button
                disabled={dbLoading}
                onClick={async () => {
                  setDbLoading(true);
                  try {
                    const count = await downloadExerciseDb();
                    setDbStatus({ loaded: true, count });
                  } finally {
                    setDbLoading(false);
                  }
                }}
                className="w-full flex items-center justify-center gap-2 border border-border rounded py-2 font-heading text-base tracking-wider text-muted hover:text-fg hover:border-white transition-colors disabled:opacity-40"
              >
                {dbLoading ? 'Downloading…' : 'DOWNLOAD (~2MB)'}
              </button>
            )}
          </div>

          <div className="border-t border-border pt-3">
            <label className="text-xs font-body text-muted uppercase tracking-wider block mb-2">
              GIF Cache
            </label>
            <button
              onClick={() => { clearGifCache(); clearExerciseImageCache(); alert('Image cache cleared.'); }}
              className="w-full mb-3 border border-border rounded py-2 font-heading text-base tracking-wider text-muted hover:text-fg hover:border-white transition-colors"
            >
              CLEAR GIF CACHE
            </button>
          </div>

          <div className="pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <label className="text-xs font-body text-muted uppercase tracking-wider">Theme</label>
              <button
                onClick={toggleTheme}
                className="flex items-center gap-2 px-3 py-1.5 rounded border border-border text-sm font-body text-muted hover:text-fg hover:border-fg transition-colors"
              >
                {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                {theme === 'dark' ? 'Light mode' : 'Dark mode'}
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-border">
            <label className="text-xs font-body text-muted uppercase tracking-wider block mb-2">
              Force Update
            </label>
            <button
              onClick={async () => {
                if ('caches' in window) {
                  const keys = await caches.keys();
                  await Promise.all(keys.map(k => caches.delete(k)));
                }
                if ('serviceWorker' in navigator) {
                  const regs = await navigator.serviceWorker.getRegistrations();
                  await Promise.all(regs.map(r => r.unregister()));
                }
                window.location.reload();
              }}
              className="w-full flex items-center justify-center gap-2 border border-border rounded py-2 font-heading text-base tracking-wider text-muted hover:text-fg hover:border-white transition-colors"
            >
              <RefreshCw size={15} /> HARD RELOAD
            </button>
          </div>

          <div className="pt-2 border-t border-border">
            <label className="text-xs font-body text-muted uppercase tracking-wider block mb-2">Data Backup</label>
            <input
              type="password"
              value={githubPat}
              onChange={e => { setGithubPat(e.target.value); localStorage.setItem('il_github_pat', e.target.value); }}
              placeholder="GitHub Personal Access Token"
              className="w-full bg-surface2 border border-border rounded px-3 py-2 text-sm font-mono text-fg mb-2 focus:outline-none focus:border-accent placeholder-muted/40"
            />
            <div className="flex gap-2">
              <button
                onClick={async () => { setBackupLoading(true); setBackupStatus(''); await handleBackup(); setBackupLoading(false); }}
                disabled={backupLoading || !githubPat}
                className="flex-1 border border-border rounded py-2 font-heading text-sm tracking-wider text-muted hover:text-fg hover:border-white transition-colors disabled:opacity-40"
              >
                {backupLoading ? 'SAVING…' : 'BACKUP NOW'}
              </button>
              <button
                onClick={handleRestore}
                disabled={backupLoading || !githubPat}
                className="flex-1 border border-border rounded py-2 font-heading text-sm tracking-wider text-muted hover:text-fg hover:border-white transition-colors disabled:opacity-40"
              >
                RESTORE
              </button>
            </div>
            {backupStatus && <div className="text-xs font-mono text-accent mt-1">{backupStatus}</div>}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
