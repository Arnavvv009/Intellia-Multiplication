/**
 * ElevenLabs Audio Pre-Generation Script (PRIORITY 2 fallback)
 * ─────────────────────────────────────────────────────────────
 * IMPORTANT: Run scripts/generate_audio_local.py FIRST (Priority 1 — free,
 * no API key). This script is only needed if you want ElevenLabs-quality
 * voices for phrases not covered by the local generation.
 *
 * Usage:
 *   node scripts/generate_audio.js
 *
 * Requires:
 *   VITE_ELEVENLABS_API_KEY=your_key  in .env
 *
 * Voice: Alice (Xb7hH8MSUJpSbSDYk0k2), Model: eleven_multilingual_v2
 * Rate-limited at 500ms between API calls.
 * Skips files that already exist on disk (re-run safe).
 */

import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// ── Load .env ────────────────────────────────────────────────────────────────
const envPath = path.join(ROOT, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
    const eqIdx = line.indexOf('=');
    if (eqIdx > 0) {
      const k = line.slice(0, eqIdx).trim();
      const v = line.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      if (k && v) process.env[k] = v;
    }
  });
}

const API_KEY  = process.env.VITE_ELEVENLABS_API_KEY;
const VOICE_ID = 'Xb7hH8MSUJpSbSDYk0k2';
const MODEL    = 'eleven_multilingual_v2';

const VOICE_SETTINGS = {
  celebration:  { stability: 0.12, similarity_boost: 0.45, style: 0.75, use_speaker_boost: true },
  encouragement:{ stability: 0.16, similarity_boost: 0.50, style: 0.65, use_speaker_boost: true },
  question:     { stability: 0.20, similarity_boost: 0.55, style: 0.55, use_speaker_boost: true },
  emphasis:     { stability: 0.16, similarity_boost: 0.50, style: 0.60, use_speaker_boost: true },
  thinking:     { stability: 0.24, similarity_boost: 0.60, style: 0.35, use_speaker_boost: true },
  statement:    { stability: 0.20, similarity_boost: 0.55, style: 0.50, use_speaker_boost: true },
  instruction:  { stability: 0.20, similarity_boost: 0.55, style: 0.50, use_speaker_boost: true },
};

// ── Phrase inventory (must stay in sync with generate_audio_local.py) ────────
const PHRASES = [
  // Wonder
  { text: "A baker puts 5 buns in every box. She packs 4 boxes. How many buns did she pack — without counting one by one?", style: 'question' },
  { text: "What if there's a faster way than counting one bun at a time?", style: 'question' },
  // Story slides
  { text: "Aisha is setting up 5 tables for her birthday party. Each table seats 4 friends. She wants to know how many friends she can invite without counting one by one.", style: 'statement' },
  { text: "We can see 5 separate tables. Each one has exactly 4 chairs — that's 5 equal groups of 4.", style: 'statement' },
  { text: "If we count in jumps of 4 — once for every table — we go 4, 8, 12, 16, 20. That's much faster than counting every chair!", style: 'emphasis' },
  { text: "5 tables, 4 chairs each, makes 20 chairs altogether. Aisha can invite 20 friends to her party!", style: 'celebration' },
  // Simulate
  { text: "Use the sliders to set the number of groups and items. Watch the total update live!", style: 'instruction' },
  { text: "Drag the sliders to change the rows and columns of the dot array.", style: 'instruction' },
  { text: "Choose a step size and tap Jump to skip-count along the number line.", style: 'instruction' },
  { text: "Tap the cells in the table to reveal the multiplication facts and spot the patterns!", style: 'instruction' },
  // Reflect
  { text: "Tell me one multiplication trick you learned today!", style: 'question' },
  // Praise
  { text: "Amazing! That's the magic of multiplying!", style: 'celebration' },
  { text: "Well done! You've got this!", style: 'celebration' },
  { text: "Brilliant! Skip-counting works every time!", style: 'celebration' },
  { text: "You got it! Keep going!", style: 'celebration' },
  { text: "Fantastic! That's one more fact in your brain!", style: 'celebration' },
  // Encouragement
  { text: "Let's try again — think about the equal groups!", style: 'thinking' },
  { text: "Not quite — use skip-counting to check!", style: 'thinking' },
  { text: "So close! Try counting in jumps.", style: 'thinking' },
  { text: "Almost there — you can do it!", style: 'encouragement' },
];

const RATE_LIMIT_MS = 500;
const OUTPUT_DIR    = path.join(ROOT, 'public', 'assets', 'audio');
const MAP_PATH      = path.join(ROOT, 'src', 'utils', 'audioMap.js');

function slugify(text) {
  return 'audio_' + text.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 60);
}

async function generateOne(phrase) {
  if (!API_KEY) throw new Error('VITE_ELEVENLABS_API_KEY not set in .env');
  const settings = VOICE_SETTINGS[phrase.style] || VOICE_SETTINGS.statement;

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
    method: 'POST',
    headers: { 'xi-api-key': API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: phrase.text, model_id: MODEL, voice_settings: settings }),
  });

  if (!response.ok) {
    throw new Error(`ElevenLabs ${response.status}: ${await response.text()}`);
  }

  const buffer   = await response.arrayBuffer();
  const filename = `${slugify(phrase.text)}.mp3`;
  fs.writeFileSync(path.join(OUTPUT_DIR, filename), Buffer.from(buffer));
  return { text: phrase.text, url: `/assets/audio/${filename}` };
}

async function run() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Merge with any existing audioMap so we don't lose local-generated entries
  let existingMap = {};
  if (fs.existsSync(MAP_PATH)) {
    const content = fs.readFileSync(MAP_PATH, 'utf8');
    const match   = content.match(/export const audioMap = (\{[\s\S]*?\});/);
    if (match) try { existingMap = eval('(' + match[1] + ')'); } catch {}
  }

  const audioMap = { ...existingMap };
  let generated = 0, skipped = 0;

  console.log(`\n🎙  ElevenLabs generation (${PHRASES.length} phrases)\n`);

  for (const phrase of PHRASES) {
    const fpath = path.join(OUTPUT_DIR, `${slugify(phrase.text)}.mp3`);
    if (fs.existsSync(fpath) && fs.statSync(fpath).size > 1000) {
      audioMap[phrase.text] = `/assets/audio/${slugify(phrase.text)}.mp3`;
      skipped++; continue;
    }
    try {
      const r = await generateOne(phrase);
      audioMap[r.text] = r.url;
      generated++;
      console.log(`  ✓ [${generated}] ${phrase.text.slice(0, 65)}…`);
      await new Promise(r => setTimeout(r, RATE_LIMIT_MS));
    } catch (e) {
      console.error(`  ✗ ${phrase.text.slice(0, 50)} — ${e.message}`);
    }
  }

  const mapContent =
    '// AUTO-GENERATED — do not edit manually\n' +
    '// Priority 1: local .mp3  |  Priority 2: ElevenLabs  |  Priority 3: Web Speech\n' +
    `export const audioMap = ${JSON.stringify(audioMap, null, 2)};\n`;
  fs.writeFileSync(MAP_PATH, mapContent);

  console.log(`\n✅  Done! Generated: ${generated}, Skipped: ${skipped}\n`);
}

run().catch(console.error);
