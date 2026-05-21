export function searchExercises(exercises, query) {
  if (!query.trim()) return exercises;
  const q = query.toLowerCase().trim();
  const words = q.split(/\s+/);

  const scored = exercises.map(ex => {
    const name = ex.name.toLowerCase();
    const group = (ex.muscleGroup || '').toLowerCase();
    const equip = (ex.equipment || '').toLowerCase();

    // Exact name substring
    if (name.includes(q)) return { ex, score: 100 };

    // Muscle group or equipment exact match
    if (group === q || equip === q) return { ex, score: 95 };
    if (group.includes(q) || equip.includes(q)) return { ex, score: 90 };

    // All typed words appear in name (any order)
    if (words.every(w => name.includes(w))) return { ex, score: 80 };

    // Initials match: "bp" → "Bench Press", "rdl" → "Romanian Deadlift"
    const initials = ex.name.split(/[\s-]+/).map(w => w[0]?.toLowerCase()).join('');
    if (initials === q || initials.startsWith(q)) return { ex, score: 75 };

    // All words appear across name + group
    if (words.every(w => name.includes(w) || group.includes(w))) return { ex, score: 70 };

    // Some words match
    const hits = words.filter(w => name.includes(w) || group.includes(w)).length;
    if (hits > 0) return { ex, score: 40 + hits * 10 };

    return { ex, score: 0 };
  });

  return scored
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ ex }) => ex);
}
