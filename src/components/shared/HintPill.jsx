import React from 'react';

export default function HintPill({ text }) {
  return (
    <div className="hint-pill" role="note" aria-label="Key equation or hint">
      ✨ {text} ✨
    </div>
  );
}
