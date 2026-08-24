import React from 'react';

/**
 * SVG dot-grid for Station B — Array Grid.
 */
export default function ArrayDiagram({ rows, cols }) {
  const DOT_R = 9;
  const SPACING = 26;
  const PAD = 16;
  const width  = cols * SPACING + PAD * 2;
  const height = rows * SPACING + PAD * 2;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', maxWidth: Math.min(width * 1.5, 480), margin: '0 auto', display: 'block' }}
      role="img"
      aria-label={`Array of ${rows} rows and ${cols} columns`}
    >
      {Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => (
          <circle
            key={`${r}-${c}`}
            cx={PAD + c * SPACING + SPACING / 2}
            cy={PAD + r * SPACING + SPACING / 2}
            r={DOT_R}
            fill="#7B5CC9"
            stroke="#FFFFFF"
            strokeWidth={1.5}
            style={{ transition: 'cx 0.3s ease, cy 0.3s ease' }}
          />
        ))
      )}
    </svg>
  );
}
