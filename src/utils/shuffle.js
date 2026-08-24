/**
 * Fisher-Yates shuffle — creates a new array, does not mutate original.
 */
export function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Generate a session question set: one question of each type per world.
 * Groups the 100 questions into 10 worlds of 10.
 * Each world gets a shuffled mix so no world is all-one-type.
 */
export function generateSessionQuestions(bank) {
  // Group by type
  const byType = {};
  bank.forEach((q) => {
    if (!byType[q.type]) byType[q.type] = [];
    byType[q.type].push(q);
  });

  // Shuffle within each type bucket, then interleave
  const typeKeys = Object.keys(byType);
  const interleaved = [];

  // Take one from each type in rotation to maximise variety per world
  const maxPerType = 10;
  for (let i = 0; i < maxPerType; i++) {
    typeKeys.forEach((t) => {
      const shuffled = shuffleArray(byType[t]);
      if (shuffled[i]) interleaved.push(shuffled[i]);
    });
  }

  // De-dup by id in case any type has fewer than 10 entries
  const seen = new Set();
  const deduped = interleaved.filter((q) => {
    if (seen.has(q.id)) return false;
    seen.add(q.id);
    return true;
  });

  // Ensure exactly 100 questions by appending shuffled remainder if needed
  const all = shuffleArray(bank);
  for (const q of all) {
    if (deduped.length >= 100) break;
    if (!seen.has(q.id)) {
      deduped.push(q);
      seen.add(q.id);
    }
  }

  // Slice to exactly 100 and partition into 10 worlds of 10
  const final = deduped.slice(0, 100);
  const worlds = [];
  for (let w = 0; w < 10; w++) {
    worlds.push(final.slice(w * 10, w * 10 + 10));
  }
  return worlds;
}
