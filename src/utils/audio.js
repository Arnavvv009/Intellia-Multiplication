/**
 * Audio Engine — Multiplication Facts 4, 5 & 10
 * ─────────────────────────────────────────────
 * Three-tier priority chain:
 *   1. Local pre-generated .mp3 (public/assets/audio/)  ← ALWAYS FIRST
 *   2. ElevenLabs API  (Voice: Alice  Xb7hH8MSUJpSbSDYk0k2)
 *   3. Browser Web Speech API  (final fallback)
 *
 * STOP GUARANTEES:
 *   - stopNarration()  → immediately kills active <Audio> element + Web Speech
 *   - setAudioEnabled(false) → calls stopNarration() then blocks all future play
 *   - Every useEffect cleanup in every route calls stopNarration() so page
 *     transitions always kill whatever is playing before the new page narrates
 */

import { audioMap } from './audioMap.js';

// ── ElevenLabs config ─────────────────────────────────────────────────────────
const VOICE_ID = 'Xb7hH8MSUJpSbSDYk0k2'; // Alice — the requested voice
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

// ── Module-level state ────────────────────────────────────────────────────────
let _audioEnabled   = true;
let _lowEndMode     = false;
let _currentQueue   = null;        // Symbol — invalidated on every stopNarration()
let _activeAudio    = null;        // The single <Audio> element currently playing
let _audioElement   = null;        // Cached single Audio element to avoid leak/bloat
let _sharedAudioContext = null;    // Cached AudioContext pool
const _dynamicCache = new Map();  // ElevenLabs blob URL cache

// ── Segment constructors ──────────────────────────────────────────────────────
export const say      = (text) => ({ text, style: 'statement' });
export const ask      = (text) => ({ text, style: 'question' });
export const cheer    = (text) => ({ text, style: 'celebration' });
export const emphasize= (text) => ({ text, style: 'emphasis' });
export const think    = (text) => ({ text, style: 'thinking' });
export const instruct = (text) => ({ text, style: 'instruction' });
export const encourage= (text) => ({ text, style: 'encouragement' });

// ── Stop — guaranteed immediate halt ─────────────────────────────────────────
export function stopNarration() {
  // 1. Invalidate queue so the async narrate() loop exits at next check
  _currentQueue = null;

  // 2. Immediately pause & discard the active <Audio> element
  if (_activeAudio) {
    try {
      _activeAudio.pause();
      _activeAudio.removeAttribute('src');
      _activeAudio.load();
    } catch { /* ignore */ }
    _activeAudio = null;
  }

  // 3. Halt browser-level speech synthesis
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel();
    } catch { /* ignore */ }
  }
  window._activeUtterance = null;
}

// ── setAudioEnabled — called by the toggle button ────────────────────────────
export function setAudioEnabled(val) {
  _audioEnabled = val;
  // When toggling OFF: kill everything immediately
  if (!val) stopNarration();
}

// ── setLowEndMode — disables network-heavy requests ─────────────────────────
export function setLowEndMode(val) {
  _lowEndMode = val;
}

// ── PRIORITY 1: local audioMap lookup ────────────────────────────────────────
function getLocalUrl(text) {
  return audioMap[text] || null;
}

// ── PRIORITY 2: ElevenLabs API ───────────────────────────────────────────────
async function fetchElevenLabs(text, style) {
  // Return cached blob URL if we already fetched this text
  if (_dynamicCache.has(text)) return _dynamicCache.get(text);

  const settings = VOICE_SETTINGS[style] || VOICE_SETTINGS.statement;
  const apiKey = import.meta.env?.VITE_ELEVENLABS_API_KEY || '';

  // A. Try server-side proxy (hides API key, avoids CORS)
  try {
    const ctrl  = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    const res   = await fetch('/api/elevenlabs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, style, voice_settings: settings }),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (res.ok) {
      const url = URL.createObjectURL(await res.blob());
      _dynamicCache.set(text, url);
      return url;
    }
  } catch { /* proxy not available */ }

  // B. Try direct ElevenLabs call (needs VITE_ELEVENLABS_API_KEY in .env)
  if (apiKey) {
    try {
      const ctrl  = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 10000);
      const res   = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
        {
          method: 'POST',
          headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, model_id: MODEL, voice_settings: settings }),
          signal: ctrl.signal,
        }
      );
      clearTimeout(timer);
      if (res.ok) {
        const url = URL.createObjectURL(await res.blob());
        _dynamicCache.set(text, url);
        return url;
      }
    } catch { /* ElevenLabs unreachable */ }
  }

  return null; // signal: use Web Speech
}

// ── Master URL resolution ────────────────────────────────────────────────────
export async function getAudioUrl(text, style = 'statement') {
  const local = getLocalUrl(text);
  if (local) return local;
  if (_lowEndMode) return null; // Skip ElevenLabs network fetches on low-spec systems
  return fetchElevenLabs(text, style);  // may return null → Web Speech
}

// non-blocking preload
export function preloadAudio(text, style = 'statement') {
  if (_lowEndMode) return; // Avoid preloading network calls on low-spec systems
  getAudioUrl(text, style).catch(() => {});
}

// ── Playback helpers ──────────────────────────────────────────────────────────
function getAudioElement() {
  if (!_audioElement && typeof window !== 'undefined') {
    _audioElement = new Audio();
  }
  return _audioElement;
}

function playAudioFile(url, queueId) {
  return new Promise((resolve) => {
    if (_currentQueue !== queueId) { resolve(); return; }
    const audio = getAudioElement();
    if (!audio) { resolve(); return; }

    try {
      audio.pause();
    } catch { /* ignore */ }

    _activeAudio = audio;
    audio.src = url;

    const finish = () => {
      if (_activeAudio === audio) {
        _activeAudio = null;
        try {
          audio.removeAttribute('src');
          audio.load();
        } catch { /* ignore */ }
      }
      audio.onended = null;
      audio.onerror = null;
      resolve();
    };

    audio.onended  = finish;
    audio.onerror  = finish;
    audio.play().catch(finish);
  });
}

// ── Web Speech API Fallback ──────────────────────────────────────────────────
function playWebSpeech(text, queueId) {
  return new Promise((resolve) => {
    if (_currentQueue !== queueId) { resolve(); return; }
    if (typeof window === 'undefined' || !window.speechSynthesis) { resolve(); return; }

    const utterance = new SpeechSynthesisUtterance(text);

    // Find standard English speech voice, female if possible
    try {
      const voices = window.speechSynthesis.getVoices();
      const englishVoice = voices.find(v => v.lang.startsWith('en-') && v.name.toLowerCase().includes('female'))
                         || voices.find(v => v.lang.startsWith('en-'))
                         || voices[0];
      if (englishVoice) {
        utterance.voice = englishVoice;
      }
    } catch { /* ignore voice search failures */ }

    // Retain global reference to avoid garbage collection interruption
    window._activeUtterance = utterance;

    const finish = () => {
      window._activeUtterance = null;
      resolve();
    };

    utterance.onend = finish;
    utterance.onerror = finish;

    // Safety timeout (Web Speech synthesis can occasionally hang in some browsers)
    const safetyTimer = setTimeout(() => {
      if (window._activeUtterance === utterance) {
        try {
          window.speechSynthesis.cancel();
        } catch { /* ignore */ }
        finish();
      }
    }, 12000);

    const originalOnEnd = utterance.onend;
    utterance.onend = () => {
      clearTimeout(safetyTimer);
      originalOnEnd();
    };
    const originalOnError = utterance.onerror;
    utterance.onerror = () => {
      clearTimeout(safetyTimer);
      originalOnError();
    };

    window.speechSynthesis.speak(utterance);
  });
}

// ── Main narrate() ────────────────────────────────────────────────────────────
/**
 * narrate(segments, interrupt?)
 * Plays segments sequentially using local MP3 → ElevenLabs → Web Speech API.
 */
export async function narrate(segments, interrupt = true) {
  if (!_audioEnabled) return;
  if (interrupt) stopNarration();

  const queueId  = Symbol();
  _currentQueue  = queueId;

  const segs = Array.isArray(segments) ? segments : [segments];

  for (let i = 0; i < segs.length; i++) {
    if (_currentQueue !== queueId) return;

    const { text, style } = segs[i];
    const url = await getAudioUrl(text, style);

    if (_currentQueue !== queueId) return;

    if (url) {
      await playAudioFile(url, queueId);
    } else {
      // Bypassed/failed ElevenLabs → speak using local SpeechSynthesis API
      await playWebSpeech(text, queueId);
    }

    if (segs[i + 1]) preloadAudio(segs[i + 1].text, segs[i + 1].style);
  }
}

// ── Sound Context Pool ───────────────────────────────────────────────────────
function getAudioContext() {
  if (!_sharedAudioContext && typeof window !== 'undefined') {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      _sharedAudioContext = new AudioContextClass();
    }
  }
  if (_sharedAudioContext && _sharedAudioContext.state === 'suspended') {
    _sharedAudioContext.resume().catch(() => {});
  }
  return _sharedAudioContext;
}

// ── Sound effects (Web Audio API — not affected by audio toggle) ──────────────
function playTone(freqs, durs) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    freqs.forEach((freq, i) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = freq;
      const t0 = durs.slice(0, i).reduce((a, b) => a + b, 0) / 1000;
      const t1 = t0 + durs[i] / 1000;
      gain.gain.setValueAtTime(0.28, ctx.currentTime + t0);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t1 + 0.3);
      osc.start(ctx.currentTime + t0);
      osc.stop(ctx.currentTime  + t1 + 0.45);
    });
  } catch { /* enhancement only */ }
}

export const SOUND = {
  correct: () => playTone([880, 1100],             [120, 140]),
  wrong:   () => playTone([220],                   [280]),
  badge:   () => playTone([523, 659, 784, 1047],   [90, 90, 90, 180]),
  streak:  () => playTone([440, 880],              [90, 180]),
  levelUp: () => playTone([523, 659, 784, 1047, 1319], [70, 70, 70, 70, 260]),
  hint:    () => playTone([660, 550],              [80, 120]),
};
