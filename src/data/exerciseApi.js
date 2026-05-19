const KEY_STORAGE = 'il_rapidapi_key';
const GIF_CACHE = 'il_gif_cache';

export function getApiKey() {
  return localStorage.getItem(KEY_STORAGE) || '';
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
  if (!apiKey) return null;

  const cacheKey = exerciseName.toLowerCase().trim();
  const cache = readCache();
  if (cache[cacheKey] !== undefined) return cache[cacheKey]; // null cached = not found

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
    if (!res.ok) return null;
    const data = await res.json();
    const gifUrl = (Array.isArray(data) && data[0]?.gifUrl) || null;
    cache[cacheKey] = gifUrl;
    writeCache(cache);
    return gifUrl;
  } catch {
    return null;
  }
}
