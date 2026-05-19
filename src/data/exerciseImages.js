const BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises';
const DB_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const DB_CACHE_KEY = 'il_exercise_db_v1';
const IMG_CACHE_KEY = 'il_exercise_img_v1';

async function loadDb() {
  const cached = localStorage.getItem(DB_CACHE_KEY);
  if (cached) return JSON.parse(cached);

  const res = await fetch(DB_URL);
  const data = await res.json();
  // Store name + both frames (most exercises have exactly 2)
  const slim = data
    .filter(ex => ex.images?.length)
    .map(ex => ({ name: ex.name.toLowerCase(), img: ex.images[0], img2: ex.images[1] || null }));
  localStorage.setItem(DB_CACHE_KEY, JSON.stringify(slim));
  return slim;
}

function bestMatch(db, searchName) {
  const terms = searchName.toLowerCase().replace(/[-_]/g, ' ').split(/\s+/).filter(Boolean);

  let best = null;
  let bestScore = 0;

  for (const ex of db) {
    const name = ex.name.replace(/[-_]/g, ' ');
    const hits = terms.filter(t => name.includes(t)).length;
    if (hits > bestScore) { bestScore = hits; best = ex; }
  }

  return bestScore > 0 ? best : null;
}

export async function fetchExerciseImage(exerciseId, apiName) {
  const imgCache = JSON.parse(localStorage.getItem(IMG_CACHE_KEY) || '{}');
  if (imgCache[exerciseId] !== undefined) return imgCache[exerciseId];

  try {
    const db = await loadDb();
    const match = bestMatch(db, apiName || exerciseId.replace(/-/g, ' '));
    const result = match
      ? { url: `${BASE}/${match.img}`, url2: match.img2 ? `${BASE}/${match.img2}` : null }
      : null;
    imgCache[exerciseId] = result;
    localStorage.setItem(IMG_CACHE_KEY, JSON.stringify(imgCache));
    return result;
  } catch {
    return null;
  }
}

export function clearExerciseImageCache() {
  localStorage.removeItem(DB_CACHE_KEY);
  localStorage.removeItem(IMG_CACHE_KEY);
}
