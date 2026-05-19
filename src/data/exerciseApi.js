const GIF_CACHE_KEY = 'il_gif_v5';
const RAPIDAPI_KEY = '8d2c948e08msh7b98a319dd98830p15254cjsn98b658f1cb5d';

function readCache() {
  try { return JSON.parse(localStorage.getItem(GIF_CACHE_KEY) || '{}'); } catch { return {}; }
}

export function clearGifCache() {
  localStorage.removeItem(GIF_CACHE_KEY);
}

async function tryRapidApi(name) {
  const res = await fetch(
    `https://exercisedb.p.rapidapi.com/exercises/name/${encodeURIComponent(name)}?limit=1&offset=0`,
    {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com',
      },
    }
  );
  if (!res.ok) return null;
  const data = await res.json();
  const list = Array.isArray(data) ? data : (data?.exercises ?? []);
  return list[0]?.gifUrl || null;
}

async function tryDirectApi(name) {
  const res = await fetch(
    `https://exercisedb.io/api/v2/exercises/name/${encodeURIComponent(name)}?limit=1&offset=0`
  );
  if (!res.ok) return null;
  const data = await res.json();
  const list = Array.isArray(data) ? data : (data?.exercises ?? []);
  return list[0]?.gifUrl || null;
}

export async function fetchExerciseGif(apiName) {
  const cacheKey = apiName.toLowerCase().trim();
  const cache = readCache();
  if (cache[cacheKey] !== undefined) return cache[cacheKey];

  try {
    const gifUrl = (await tryRapidApi(cacheKey)) || (await tryDirectApi(cacheKey));
    cache[cacheKey] = gifUrl;
    localStorage.setItem(GIF_CACHE_KEY, JSON.stringify(cache));
    return gifUrl;
  } catch (err) {
    return null;
  }
}
