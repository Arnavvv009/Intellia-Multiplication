import React from 'react';
import { useNavigate } from 'react-router-dom';

const PHASES = [
  { key: 'wonder',   num: '01', icon: '🧮', label: 'Wonder',   route: '/wonder'   },
  { key: 'story',    num: '02', icon: '📖', label: 'Story',    route: '/story'    },
  { key: 'simulate', num: '03', icon: '✏️', label: 'Simulate', route: '/simulate' },
  { key: 'play',     num: '04', icon: '🎮', label: 'Play',     route: '/play'     },
  { key: 'reflect',  num: '05', icon: '📋', label: 'Reflect',  route: '/reflect'  },
];

export default function PhaseTracker({ currentPhase, phaseComplete }) {
  const navigate = useNavigate();

  function handleClick(phase) {
    if (phaseComplete?.[phase.key] || phase.key === currentPhase) {
      navigate(phase.route);
    }
  }

  return (
    <nav className="phase-tracker" role="navigation" aria-label="Lesson phases">
      {PHASES.map((p) => {
        const isActive   = currentPhase === p.key;
        const isComplete = phaseComplete?.[p.key];
        const cls = isActive
          ? 'phase-segment phase-segment--active'
          : isComplete
            ? 'phase-segment phase-segment--complete'
            : 'phase-segment';

        return (
          <button
            key={p.key}
            className={cls}
            onClick={() => handleClick(p)}
            aria-current={isActive ? 'step' : undefined}
            aria-label={`${p.num} ${p.label}${isComplete ? ' — done' : isActive ? ' — current' : ''}`}
          >
            <span className="phase-segment__num" aria-hidden="true">{p.num}</span>
            <span className="phase-segment__icon" aria-hidden="true">{p.icon}</span>
            <span className="phase-segment__label">{p.label}</span>
            {isComplete && !isActive && (
              <span className="phase-segment__check" aria-hidden="true">✓</span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
