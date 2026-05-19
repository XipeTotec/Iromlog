const KEY_STORAGE = 'il_rapidapi_key';
const GIF_CACHE = 'il_gif_cache';
const DEFAULT_KEY = '8d2c948e08msh7b98a319dd98830p15254cjsn98b658f1cb5d';

export function getApiKey() {
  return localStorage.getItem(KEY_STORAGE) || DEFAULT_KEY;
}

export function saveApiKey(key) {
  localStorage.setItem(KEY_STORAGE, key.trim());
}

function readCache() {
  try { return JSON.parse(localStorage.getItem(GIF_CACHE) || '{}'); } catch { return {}; }
}

function writeCache(cache) {
  localStorage.setItem(GIF_CACHE, JSON.stringify(cache));
}

export function clearGifCache() {
  localStorage.removeItem(GIF_CACHE);
}

export async function fetchExerciseGif(exerciseName) {
  const apiKey = getApiKey();
  const cacheKey = exerciseName.toLowerCase().trim();
  const cache = readCache();
  if (cache[cacheKey] !== undefined) return cache[cacheKey];

  try {
    const res = await fetch(
      `https://exercisedb.p.rapidapi.com/exercises/name/${encodeURIComponent(cacheKey)}?limit=1&offset=0`,
      {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com',
        },
      }
    );

    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { return `error: ${text.slice(0, 80)}`; }

    if (!res.ok) {
      const msg = data?.message || data?.error || `HTTP ${res.status}`;
      return `error: ${msg}`;
    }

    // Handle both array and { exercises: [] } shapes
    const list = Array.isArray(data) ? data : (data?.exercises ?? []);
    const gifUrl = list[0]?.gifUrl || null;
    cache[cacheKey] = gifUrl;
    writeCache(cache);
    return gifUrl;
  } catch (err) {
    return `error: ${err.message}`;
  }
}
