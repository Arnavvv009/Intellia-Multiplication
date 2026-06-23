import React from 'react';
import { useNavigate } from 'react-router-dom';
import ParticleBackground from '../components/shared/ParticleBackground.jsx';
import Mascot from '../components/shared/Mascot.jsx';

const JOURNEY_CHIPS = [
  { icon: '🧮', label: 'Wonder' },
  { icon: '📖', label: 'Story' },
  { icon: '✏️', label: 'Simulate' },
  { icon: '🎮', label: 'Play' },
  { icon: '📋', label: 'Reflect' },
];

export default function LandingRoute({ state, dispatch }) {
  const navigate = useNavigate();

  function handleBegin() {
    dispatch({ type: 'SET_PHASE', payload: 'wonder' });
    navigate('/wonder');
  }

  return (
    /* Full-viewport, no scroll */
    <div className="landing-screen">
      <ParticleBackground lowEndMode={state.lowEndMode} />

      <div className="landing-card">
        {/* Badge */}
        <div className="curriculum-badge">✨ MOE Curriculum · Grade 2</div>

        {/* Title */}
        <div className="lesson-title" role="heading" aria-level={1}>
          <span className="lesson-title__white">Multiplication Facts of</span>
          <span className="lesson-title__gold">4, 5 &amp; 10</span>
        </div>

        {/* Mascot */}
        <Mascot mood="happy" text="Ready to multiply like magic? Let's go! ✨" center />

        {/* Description */}
        <p className="landing-description">
          Join Max the Owl and discover how skip-counting unlocks the secrets
          of 4, 5, and 10 — through stories, simulations, and exciting games!
        </p>

        {/* Journey map */}
        <div className="journey-map-panel">
          <p className="journey-map-panel__label">📍 Your Learning Journey</p>
          <div className="journey-chips" role="list">
            {JOURNEY_CHIPS.map((chip, i) => (
              <React.Fragment key={chip.label}>
                <span className="journey-chip" role="listitem">
                  <span aria-hidden="true">{chip.icon}</span> {chip.label}
                </span>
                {i < JOURNEY_CHIPS.length - 1 && (
                  <span className="journey-arrow" aria-hidden="true">→</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* CTA */}
        <button className="btn-primary" onClick={handleBegin} aria-label="Begin your learning journey"
          style={{ alignSelf: 'center' }}>
          🚀 Begin Your Journey!
        </button>

        {/* Feature cards */}
        <div className="feature-card-row" role="list">
          {[
            { icon: '🔢', label: 'Skip-Counting Magic' },
            { icon: '🧮', label: '4 Simulations' },
            { icon: '🎮', label: '10 Fact Worlds' },
          ].map((fc) => (
            <div className="feature-card" key={fc.label} role="listitem">
              <div className="feature-card__icon" aria-hidden="true">{fc.icon}</div>
              <div className="feature-card__label">{fc.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
