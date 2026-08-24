import React from 'react';

const MOOD_EMOJI = {
  idle:       '🦉',
  curious:    '🤔',
  happy:      '😄',
  thinking:   '🧐',
  celebrating:'🎉',
};

/**
 * Max the Counting Owl — circular gold avatar with emoji mood.
 * Props: mood, text (speech bubble content), small (boolean), center (boolean)
 */
export default function Mascot({ mood = 'idle', text = '', small = false, center = false }) {
  return (
    <div className={`mascot-row${center ? ' mascot-row--center' : ''}`}>
      <div className={`mascot-avatar${small ? ' mascot-avatar--small' : ''}`} role="img" aria-label={`Max the Owl — ${mood}`}>
        {MOOD_EMOJI[mood] || '🦉'}
      </div>
      {text && (
        <div className="speech-bubble" role="note">
          {text}
        </div>
      )}
    </div>
  );
}
