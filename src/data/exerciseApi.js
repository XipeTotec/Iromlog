const GIF_CACHE_KEY = 'il_gif_v4';

function readCache() {
  try { return JSON.parse(localStorage.getItem(GIF_CACHE_KEY) || '{}'); } catch { return {}; }
}

export function clearGifCache() {
  localStorage.removeItem(GIF_CACHE_KEY);
}

export async function fetchExerciseGif(apiName) {
  const cacheKey = apiName.toLowerCase().trim();
  const cache = readCache();
  if (cache[cacheKey] !== undefined) return cache[cacheKey];

  try {
    // Try exercisedb.io directly — no RapidAPI subscription needed
    const res = await fetch(
      `https://exercisedb.io/api/v2/exercises/name/${encodeURIComponent(cacheKey)}?limit=1&offset=0`
    );

    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { return `error: ${text.slice(0, 120)}`; }

    if (!res.ok) {
      const msg = data?.message || data?.error || JSON.stringify(data).slice(0, 120);
      return `error: HTTP ${res.status} — ${msg}`;
    }

    const list = Array.isArray(data) ? data : (data?.exercises ?? []);
    if (!list.length) return `error: no results for "${cacheKey}"`;

    const gifUrl = list[0]?.gifUrl || null;
    if (!gifUrl) return `error: no gifUrl — keys: ${Object.keys(list[0] || {}).join(', ')}`;

    cache[cacheKey] = gifUrl;
    localStorage.setItem(GIF_CACHE_KEY, JSON.stringify(cache));
    return gifUrl;
  } catch (err) {
    return `error: ${err.message}`;
  }
}
