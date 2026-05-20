import { EXERCISES } from './exercises.js';
import { DEFAULT_TEMPLATES } from './templates.js';

const KEYS = {
  exercises: 'il_exercises',
  templates: 'il_templates',
  sessions: 'il_sessions',
  prs: 'il_prs',
  bodyStats: 'il_body_stats',
  settings: 'il_settings',
  cardio: 'il_cardio',
};

function readJSON(key, fallback) {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

export function getExercises() {
  const stored = readJSON(KEYS.exercises, null);
  if (!stored || stored.length === 0) {
    writeJSON(KEYS.exercises, EXERCISES);
    return EXERCISES;
  }
  return stored;
}

export function saveExercises(exercises) {
  writeJSON(KEYS.exercises, exercises);
}

export function getTemplates() {
  const stored = readJSON(KEYS.templates, null);
  if (!stored || stored.length === 0) {
    writeJSON(KEYS.templates, DEFAULT_TEMPLATES);
    return DEFAULT_TEMPLATES;
  }
  return stored;
}

export function saveTemplates(templates) {
  writeJSON(KEYS.templates, templates);
}

export function getSessions() {
  const sessions = readJSON(KEYS.sessions, []);
  return [...sessions].sort((a, b) => new Date(b.date) - new Date(a.date));
}

export function saveSessions(sessions) {
  writeJSON(KEYS.sessions, sessions);
}

export function getPRs() {
  return readJSON(KEYS.prs, {});
}

export function savePRs(prs) {
  writeJSON(KEYS.prs, prs);
}

export function getSettings() {
  return readJSON(KEYS.settings, { restDuration: 90 });
}

export function saveSettings(settings) {
  writeJSON(KEYS.settings, settings);
}

export function getBodyStats() {
  const stats = readJSON(KEYS.bodyStats, []);
  return [...stats].sort((a, b) => new Date(a.date) - new Date(b.date));
}

export function saveBodyStats(stats) {
  writeJSON(KEYS.bodyStats, stats);
}

export function checkAndUpdatePR(exerciseId, weight, reps) {
  const prs = getPRs();
  const current = prs[exerciseId] || { maxWeight: 0, maxReps: 0, maxVolume: 0, date: null };
  const volume = weight * reps;
  const newFields = [];

  let updated = { ...current };

  if (weight > current.maxWeight) {
    updated.maxWeight = weight;
    newFields.push('weight');
  }
  if (reps > current.maxReps) {
    updated.maxReps = reps;
    newFields.push('reps');
  }
  if (volume > current.maxVolume) {
    updated.maxVolume = volume;
    newFields.push('volume');
  }

  const isNewPR = newFields.length > 0;
  if (isNewPR) {
    updated.date = new Date().toISOString();
    prs[exerciseId] = updated;
    savePRs(prs);
  }

  return { isNewPR, fields: newFields };
}

export function getStreakCount() {
  const sessions = getSessions();
  if (sessions.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const sessionDates = sessions.map(s => {
    const d = new Date(s.date);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  });

  const uniqueDates = [...new Set(sessionDates)].sort((a, b) => b - a);

  // Check if the most recent session is today or yesterday
  if (uniqueDates[0] !== today.getTime() && uniqueDates[0] !== yesterday.getTime()) {
    return 0;
  }

  let streak = 0;
  let currentDate = uniqueDates[0] === today.getTime() ? today.getTime() : yesterday.getTime();

  for (const date of uniqueDates) {
    if (date === currentDate) {
      streak++;
      currentDate -= 86400000; // subtract one day in ms
    } else {
      break;
    }
  }

  return streak;
}

export function getTotalVolume() {
  const sessions = getSessions();
  return sessions.reduce((total, session) => {
    const sessionVolume = (session.exercises || []).reduce((exTotal, ex) => {
      const exVolume = (ex.sets || []).reduce((setTotal, set) => {
        if (set.done) {
          return setTotal + (parseFloat(set.weight) || 0) * (parseInt(set.reps) || 0);
        }
        return setTotal;
      }, 0);
      return exTotal + exVolume;
    }, 0);
    return total + sessionVolume;
  }, 0);
}

export function getFavoriteExercise() {
  const sessions = getSessions();
  const counts = {};
  sessions.forEach(session => {
    (session.exercises || []).forEach(ex => {
      counts[ex.exerciseId] = (counts[ex.exerciseId] || 0) + 1;
    });
  });

  let maxCount = 0;
  let favoriteId = null;
  for (const [id, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      favoriteId = id;
    }
  }

  return favoriteId ? { exerciseId: favoriteId, count: maxCount } : null;
}

export function getTopMuscleGroup() {
  const freq = getMuscleFrequency();
  let maxCount = 0;
  let topGroup = null;

  for (const [group, count] of Object.entries(freq)) {
    if (count > maxCount) {
      maxCount = count;
      topGroup = group;
    }
  }

  return topGroup ? { muscleGroup: topGroup, count: maxCount } : null;
}

export function getMuscleFrequency() {
  const sessions = getSessions();
  const exercises = getExercises();
  const exerciseMap = {};
  exercises.forEach(ex => { exerciseMap[ex.id] = ex; });

  const freq = {};
  sessions.forEach(session => {
    (session.exercises || []).forEach(ex => {
      const exerciseData = exerciseMap[ex.exerciseId];
      if (exerciseData) {
        const group = exerciseData.muscleGroup;
        freq[group] = (freq[group] || 0) + 1;
      }
    });
  });

  return freq;
}

export function getLastSessionForTemplate(templateId) {
  const sessions = getSessions();
  return sessions.find(s => s.templateId === templateId) || null;
}

export function getCardioSessions() {
  return readJSON(KEYS.cardio, []);
}

export function saveCardioSession(session) {
  const all = getCardioSessions();
  writeJSON(KEYS.cardio, [session, ...all]);
}

export function deleteCardioSession(id) {
  writeJSON(KEYS.cardio, getCardioSessions().filter(s => s.id !== id));
}
