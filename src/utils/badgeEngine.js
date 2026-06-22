export const BADGES = [
  {
    id: 'wonder_seeker',
    label: '🏅 Wonder Seeker',
    description: 'Completed Wonder and Story phases',
    condition: (s) => s.phaseComplete.wonder && s.phaseComplete.story,
  },
  {
    id: 'group_master',
    label: '🥈 Group Master',
    description: 'Completed all 4 Simulate stations',
    condition: (s) => s.simStationsComplete.every(Boolean),
  },
  {
    id: 'fact_fluency_star',
    label: '🥇 Fact Fluency Star',
    description: 'Scored ≥80% overall across all Play questions',
    condition: (s) => {
      const attempted = s.worldScores.filter((ws) => ws !== null);
      if (attempted.length === 0) return false;
      const total = attempted.reduce((sum, ws) => sum + ws, 0);
      return total / (attempted.length * 10) >= 0.8;
    },
  },
  {
    id: 'perfect_multiplier',
    label: '💎 Perfect Multiplier',
    description: 'Scored 10/10 in any single world',
    condition: (s) => s.worldScores.some((ws) => ws === 10),
  },
  {
    id: 'streak_legend',
    label: '🔥 Streak Legend',
    description: 'Achieved a 10+ answer streak',
    condition: (s) => s.maxStreak >= 10,
  },
  {
    id: 'full_journey',
    label: '🌟 Full Journey',
    description: 'Completed all 5 phases',
    condition: (s) => Object.values(s.phaseComplete).every(Boolean),
  },
  {
    id: 'tens_champion',
    label: '🔟 Tens Champion',
    description: '100% on World 6 — Flower Vases (×10 focus)',
    condition: (s) => s.worldScores[5] === 10,
  },
  {
    id: 'high_five_hero',
    label: '✋ High-Five Hero',
    description: '100% on World 2 — Pencil Packs (×5 focus)',
    condition: (s) => s.worldScores[1] === 10,
  },
];

/**
 * Returns array of badge IDs that are newly unlocked given current state.
 * Excludes badges already in state.badges.
 */
export function checkBadges(state) {
  return BADGES.filter(
    (b) => !state.badges.includes(b.id) && b.condition(state)
  ).map((b) => b.id);
}

/**
 * Get badge object by ID.
 */
export function getBadge(id) {
  return BADGES.find((b) => b.id === id);
}
