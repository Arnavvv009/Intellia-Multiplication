import React from 'react';

/**
 * SVG visual for Station A — Equal Groups.
 * Renders `groups` baskets each containing `perGroup` circles.
 */
export default function EqualGroupsDiagram({ groups, perGroup }) {
  const BASKET_W = 60;
  const BASKET_H = 90;
  const GAP = 14;
  const totalW = Math.max(groups * (BASKET_W + GAP) - GAP, 60);
  const totalH = BASKET_H + 40;

  return (
    <svg
      viewBox={`0 0 ${totalW} ${totalH}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', maxWidth: totalW * 2, margin: '0 auto', display: 'block' }}
      role="img"
      aria-label={`${groups} groups of ${perGroup} items`}
    >
      {Array.from({ length: groups }, (_, g) => {
        const bx = g * (BASKET_W + GAP);
        const cols = Math.min(perGroup, 3);
        const rows = Math.ceil(perGroup / cols);
        const dotR = 7;
        const dotSpacingX = (BASKET_W - 12) / (cols + 1);
        const dotSpacingY = (BASKET_H - 24) / (rows + 1);

        return (
          <g key={g}>
            {/* Basket rect */}
            <rect
              x={bx}
              y={8}
              width={BASKET_W}
              height={BASKET_H}
              rx={10}
              fill="#3A2B5C"
              stroke="#F5B82E"
              strokeWidth={2}
            />
            {/* Dots */}
            {Array.from({ length: perGroup }, (_, i) => {
              const col = i % cols;
              const row = Math.floor(i / cols);
              const cx = bx + 6 + dotSpacingX * (col + 1);
              const cy = 8 + dotSpacingY * (row + 1) + 8;
              return (
                <circle
                  key={i}
                  cx={cx}
                  cy={cy}
                  r={dotR}
                  fill="#F5B82E"
                  stroke="#FFFFFF"
                  strokeWidth={1}
                />
              );
            })}
          </g>
        );
      })}
      {/* Label */}
      <text
        x={totalW / 2}
        y={totalH - 4}
        textAnchor="middle"
        fill="#A89FC9"
        fontSize={14}
        fontFamily="Nunito, sans-serif"
        fontWeight={700}
      >
        {groups} groups × {perGroup} = {groups * perGroup}
      </text>
    </svg>
  );
}
