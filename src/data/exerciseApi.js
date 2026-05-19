const KEY_STORAGE = 'il_rapidapi_key';
const GIF_CACHE = 'il_gif_cache';
const CACHE_VERSION = 'v3';
const DEFAULT_KEY = '8d2c948e08msh7b98a319dd98830p15254cjsn98b658f1cb5d';

export function getApiKey() {
  return localStorage.getItem(KEY_STORAGE) || DEFAULT_KEY;
}

export function saveApiKey(key) {
  localStorage.setItem(KEY_STORAGE, key.trim());
}

function readCache() {
  try {
    const raw = JSON.parse(localStorage.getItem(GIF_CACHE) || '{}');
    if (raw.__version !== CACHE_VERSION) return { __version: CACHE_VERSION };
    return raw;
  } catch { return { __version: CACHE_VERSION }; }
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
    try { data = JSON.parse(text); } catch { return `error: parse failed — ${text.slice(0, 120)}`; }

    if (!res.ok) {
      const msg = data?.message || data?.error || JSON.stringify(data).slice(0, 120);
      return `error: HTTP ${res.status} — ${msg}`;
    }

    const list = Array.isArray(data) ? data : (data?.exercises ?? []);

    if (list.length === 0) {
      return `error: empty result for "${cacheKey}"`;
    }

    const gifUrl = list[0]?.gifUrl || null;
    if (!gifUrl) {
      return `error: no gifUrl in result — keys: ${Object.keys(list[0] || {}).join(', ')}`;
    }

    cache[cacheKey] = gifUrl;
    writeCache(cache);
    return gifUrl;
  } catch (err) {
    return `error: ${err.message}`;
  }
}
