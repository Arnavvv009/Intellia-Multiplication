import React from 'react';

/**
 * Thin gold progress bar — rendered as a flex-shrink:0 strip
 * directly inside .vp-shell (between chrome and body).
 * Routes that need it render the .vp-subbar div directly.
 * This component kept for optional standalone use.
 */
export default function SubProgressBar({ percent }) {
  return (
    <div
      className="vp-subbar"
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Phase progress"
    >
      <div className="vp-subbar-fill" style={{ width: `${percent}%` }} />
    </div>
  );
}
