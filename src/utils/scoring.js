/**
 * XP calculation per correct answer.
 * attemptNumber: 1 = first try, 2 = second try, etc.
 * hintsUsed: bool (any hint was used this question)
 * streak: current consecutive correct count
 */
export function calcXP(attemptNumber, hintsUsed, streak) {
  let base;
  if (attemptNumber === 1 && !hintsUsed) {
    base = 10;
  } else if (hintsUsed) {
    base = 5;
  } else {
    base = 7;
  }
  const streakBonus = streak >= 5 ? 5 : 0;
  return base + streakBonus;
}

/**
 * Stars earned for a world (0–3) based on correct count out of 10.
 */
export function calcStars(correct, total = 10) {
  if (correct >= 9) return 3;
  if (correct >= 7) return 2;
  if (correct >= 5) return 1;
  return 0;
}

/**
 * Whether the player has earned enough to unlock the next world.
 */
export function canUnlockWorld(worldScore) {
  return worldScore !== null;
}

/**
 * Streak multiplier based on current streak count.
 */
export function calcStreakMultiplier(streak) {
  if (streak >= 10) return 3;
  if (streak >= 5) return 2;
  return 1;
}

/**
 * Generate star display string.
 */
export function starsDisplay(count) {
  return '⭐'.repeat(count) + '☆'.repeat(Math.max(0, 3 - count));
}
