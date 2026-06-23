import React, { useState, useEffect, useRef } from 'react';
import { stopNarration } from '../../utils/audio.js';

export default function SettingsFAB({ audioEnabled, lowEndMode, dispatch }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close popup when clicking outside the component
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  function handleAudioToggle() {
    if (audioEnabled) stopNarration();
    dispatch({ type: 'TOGGLE_AUDIO' });
  }

  function handlePerformanceToggle() {
    dispatch({ type: 'TOGGLE_LOW_END_MODE' });
  }

  return (
    <div className="settings-fab-container" ref={containerRef}>
      {isOpen && (
        <div className="settings-popup" role="dialog" aria-label="Quick Settings">
          <div className="settings-title">⚙️ Settings</div>
          
          {/* Audio Row */}
          <div className="settings-row">
            <div className="settings-label-wrap">
              <span className="settings-label">Narration voice</span>
              <span className="settings-desc">TTS helper audio</span>
            </div>
            <button
              className={`settings-toggle-btn${audioEnabled ? ' settings-toggle-btn--active' : ''}`}
              onClick={handleAudioToggle}
              aria-label={audioEnabled ? 'Mute narration' : 'Unmute narration'}
            >
              {audioEnabled ? '🔊 ON' : '🔇 OFF'}
            </button>
          </div>

          {/* Low End Row */}
          <div className="settings-row">
            <div className="settings-label-wrap">
              <span className="settings-label">Battery Saver</span>
              <span className="settings-desc">Optimizes CPU & GPU load</span>
            </div>
            <button
              className={`settings-toggle-btn${lowEndMode ? ' settings-toggle-btn--active' : ''}`}
              onClick={handlePerformanceToggle}
              aria-label={lowEndMode ? 'Disable Battery Saver' : 'Enable Battery Saver'}
            >
              {lowEndMode ? '🔋 ON' : '⚡ OFF'}
            </button>
          </div>
        </div>
      )}

      <button
        className="settings-fab"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Settings"
        aria-haspopup="true"
        aria-expanded={isOpen}
        title="Open Quick Settings"
      >
        ⚙️
      </button>
    </div>
  );
}
