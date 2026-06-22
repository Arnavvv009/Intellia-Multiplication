import React from 'react';
import { stopNarration } from '../../utils/audio.js';

export default function AudioToggleFAB({ audioEnabled, onToggle }) {

  function handleClick() {
    // Immediately stop whatever is playing — before React processes the state update
    // This prevents the ~16ms gap between click and state update causing a blip
    if (audioEnabled) stopNarration();
    onToggle();
  }

  return (
    <button
      className="audio-fab"
      onClick={handleClick}
      aria-label={audioEnabled ? 'Mute narration' : 'Unmute narration'}
      aria-pressed={audioEnabled}
      title={audioEnabled ? 'Click to mute narration' : 'Click to enable narration'}
    >
      {audioEnabled ? '🔊' : '🔇'}
    </button>
  );
}
