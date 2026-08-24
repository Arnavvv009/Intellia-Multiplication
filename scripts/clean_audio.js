/**
 * Audio Cleanup Utility — scripts/clean_audio.js
 * ─────────────────────────────────────────────────
 * Deletes any .mp3 files in public/assets/audio/ that are no longer
 * referenced in src/utils/audioMap.js (orphaned audio).
 *
 * Usage:
 *   node scripts/clean_audio.js
 *
 * Run this after deleting or modifying narration text to keep the
 * audio folder tidy and reduce bundle/deploy size.
 */

import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.join(__dirname, '..');
const AUDIO_DIR = path.join(ROOT, 'public', 'assets', 'audio');
const MAP_PATH  = path.join(ROOT, 'src', 'utils', 'audioMap.js');

async function run() {
  // ── Read the audioMap to get all valid file paths ──────────────────────────
  if (!fs.existsSync(MAP_PATH)) {
    console.error(`✗  audioMap.js not found at ${MAP_PATH}`);
    console.error('   Run generate_audio_local.py first.');
    process.exit(1);
  }

  // Dynamically import the ES module audioMap
  const mapModule = await import(`file://${MAP_PATH}`);
  const audioMap  = mapModule.audioMap || {};

  // Build a set of valid filenames (basename only)
  const validFiles = new Set(
    Object.values(audioMap).map((url) => path.basename(url))
  );

  console.log(`\n🔍  Audio cleanup`);
  console.log(`    Valid entries in audioMap : ${validFiles.size}`);

  if (!fs.existsSync(AUDIO_DIR)) {
    console.log('    Audio directory is empty — nothing to clean.\n');
    return;
  }

  const allFiles = fs.readdirSync(AUDIO_DIR).filter(f => f.endsWith('.mp3'));
  console.log(`    Files in audio dir        : ${allFiles.length}`);

  let deleted = 0;
  let kept    = 0;

  for (const file of allFiles) {
    if (validFiles.has(file)) {
      kept++;
    } else {
      const fullPath = path.join(AUDIO_DIR, file);
      fs.unlinkSync(fullPath);
      console.log(`    🗑  Deleted orphan: ${file}`);
      deleted++;
    }
  }

  console.log(`\n✅  Cleanup complete`);
  console.log(`    Kept    : ${kept}`);
  console.log(`    Deleted : ${deleted}\n`);
}

run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
