import React from 'react';

/**
 * SVG number line for Station C.
 * stepSize: 4, 5, or 10
 * position: current position (0 to max)
 */
export default function NumberLineSVG({ max = 50, position = 0, stepSize = 5 }) {
  const W = 560;
  const H = 80;
  const PAD = 30;
  const lineY = 50;
  const usableW = W - PAD * 2;

  const steps = max / stepSize;
  const ticks = Array.from({ length: steps + 1 }, (_, i) => i * stepSize);

  const xOf = (val) => PAD + (val / max) * usableW;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', display: 'block' }}
      role="img"
      aria-label={`Number line counting by ${stepSize}s, current position ${position}`}
    >
      {/* Track */}
      <line x1={PAD} y1={lineY} x2={W - PAD} y2={lineY} stroke="#7B5CC9" strokeWidth={3} strokeLinecap="round" />

      {/* Highlighted portion */}
      {position > 0 && (
        <line
          x1={PAD}
          y1={lineY}
          x2={xOf(position)}
          y2={lineY}
          stroke="#F5B82E"
          strokeWidth={4}
          strokeLinecap="round"
          style={{ transition: 'x2 0.4s ease' }}
        />
      )}

      {/* Ticks & labels */}
      {ticks.map((val) => (
        <g key={val}>
          <line
            x1={xOf(val)} y1={lineY - 8}
            x2={xOf(val)} y2={lineY + 8}
            stroke={val <= position ? '#F5B82E' : '#FFFFFF'}
            strokeWidth={val === 0 || val === max ? 2.5 : 1.5}
          />
          <text
            x={xOf(val)}
            y={lineY + 24}
            textAnchor="middle"
            fill={val <= position ? '#F5B82E' : '#A89FC9'}
            fontSize={11}
            fontFamily="Nunito, sans-serif"
            fontWeight={val === position ? 800 : 600}
          >
            {val}
          </text>
        </g>
      ))}

      {/* Current position token */}
      {position >= 0 && (
        <circle
          cx={xOf(position)}
          cy={lineY}
          r={12}
          fill="#F5B82E"
          stroke="#FFFFFF"
          strokeWidth={2.5}
          style={{ transition: 'cx 0.5s cubic-bezier(.34,1.56,.64,1)' }}
        />
      )}
    </svg>
  );
}
