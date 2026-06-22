import React, { useMemo } from 'react';

const PARTICLE_COUNT = 22;

export default function ParticleBackground({ intense = false }) {
  const particles = useMemo(() => {
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 18 + 12,
      delay: Math.random() * 10,
      color: Math.random() > 0.5 ? '#F5B82E' : '#FFFFFF',
    }));
  }, []);

  return (
    <div className="particle-bg" aria-hidden="true">
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            background: p.color,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            opacity: intense ? 0.35 : 0.12,
          }}
        />
      ))}
    </div>
  );
}
