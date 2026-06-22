/**
 * Narration Scripts — Multiplication Facts 4, 5 & 10
 * ────────────────────────────────────────────────────
 * RULE: All text strings here must exactly match the text used in:
 *   1. The on-screen UI copy (1:1 parity required)
 *   2. The PHRASES array in scripts/generate_audio_local.py
 *      (so local .mp3 files are found via audioMap lookup)
 *
 * Only paragraph/body text and questions are narrated.
 * Titles, headings, labels → NEVER narrated.
 */

import { say, ask, cheer, emphasize, instruct, think, encourage } from './audio.js';

// ── Phase: Wonder ─────────────────────────────────────────────────────────────
export function wonderNarration() {
  return [
    ask("A baker puts 5 buns in every box. She packs 4 boxes. How many buns did she pack — without counting one by one?"),
    ask("What if there's a faster way than counting one bun at a time?"),
  ];
}

// ── Phase: Story (4 slides — body paragraphs only) ───────────────────────────
const STORY_NARRATIONS = [
  say("Aisha is setting up 5 tables for her birthday party. Each table seats 4 friends. She wants to know how many friends she can invite without counting one by one."),
  say("We can see 5 separate tables. Each one has exactly 4 chairs — that's 5 equal groups of 4."),
  emphasize("If we count in jumps of 4 — once for every table — we go 4, 8, 12, 16, 20. That's much faster than counting every chair!"),
  cheer("5 tables, 4 chairs each, makes 20 chairs altogether. Aisha can invite 20 friends to her party!"),
];

export function getStoryNarration(slideIndex) {
  return [STORY_NARRATIONS[slideIndex]];
}

// ── Phase: Simulate (station instruction lines) ───────────────────────────────
const STATION_INTROS = [
  instruct("Use the sliders to set the number of groups and items. Watch the total update live!"),
  instruct("Drag the sliders to change the rows and columns of the dot array."),
  instruct("Choose a step size and tap Jump to skip-count along the number line."),
  instruct("Tap the cells in the table to reveal the multiplication facts and spot the patterns!"),
];

export function simulateStationIntro(stationIndex) {
  return [STATION_INTROS[stationIndex]];
}

// ── Phase: Play — question / hint / explanation ───────────────────────────────

/**
 * Narrate the question text exactly as shown on screen.
 * The question.questionText must match an entry in audioMap for instant playback.
 */
export function questionNarration(question) {
  return [ask(question.questionText)];
}

export function hintNarration(question, hintLevel) {
  return [think(hintLevel === 1 ? question.hint1 : question.hint2)];
}

export function explanationNarration(question) {
  return [say(question.explanation)];
}

// ── Phase: Reflect ─────────────────────────────────────────────────────────────
export function reflectNarration() {
  return [ask("Tell me one multiplication trick you learned today!")];
}

// ── Praise pool (randomised — all pre-generated) ─────────────────────────────
export const PRAISE_LINES = [
  "Amazing! That's the magic of multiplying!",
  "Well done! You've got this!",
  "Brilliant! Skip-counting works every time!",
  "You got it! Keep going!",
  "Fantastic! That's one more fact in your brain!",
];

export function randomPraise() {
  const line = PRAISE_LINES[Math.floor(Math.random() * PRAISE_LINES.length)];
  return [cheer(line)];
}

// ── Encouragement pool (randomised — all pre-generated) ─────────────────────
export const ENCOURAGEMENT_LINES = [
  "Let's try again — think about the equal groups!",
  "Not quite — use skip-counting to check!",
  "So close! Try counting in jumps.",
  "Almost there — you can do it!",
];

export function randomEncouragement() {
  const line = ENCOURAGEMENT_LINES[Math.floor(Math.random() * ENCOURAGEMENT_LINES.length)];
  return [think(line)];
}
