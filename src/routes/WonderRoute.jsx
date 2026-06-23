import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PhaseTracker      from '../components/chrome/PhaseTracker.jsx';
import HomePill          from '../components/chrome/HomePill.jsx';
import SettingsFAB       from '../components/chrome/SettingsFAB.jsx';
import Mascot            from '../components/shared/Mascot.jsx';
import HintPill          from '../components/shared/HintPill.jsx';
import ParticleBackground from '../components/shared/ParticleBackground.jsx';
import { narrate, stopNarration } from '../utils/audio.js';
import { wonderNarration }        from '../utils/narration.js';

export default function WonderRoute({ state, dispatch }) {
  const navigate = useNavigate();

  // ── Narration: start when enabled, stop on unmount or toggle ──────────────
  useEffect(() => {
    // Always stop first — covers rapid toggles or re-renders
    stopNarration();
    if (state.audioEnabled) {
      // Small delay so the stop clears before we start
      const t = setTimeout(() => narrate(wonderNarration()), 120);
      return () => { clearTimeout(t); stopNarration(); };
    }
    return () => stopNarration();
  }, [state.audioEnabled]);

  // ── Also stop narration when leaving this page ─────────────────────────────
  useEffect(() => {
    return () => stopNarration();
  }, []);

  function handleInvestigate() {
    stopNarration();                      // stop before navigating
    dispatch({ type: 'COMPLETE_WONDER' });
    navigate('/story');
  }

  return (
    <div className="vp-shell">
      <ParticleBackground lowEndMode={state.lowEndMode} />
      <div className="vp-chrome">
        <HomePill dispatch={dispatch} />
        <PhaseTracker currentPhase="wonder" phaseComplete={state.phaseComplete} />
      </div>

      <div className="vp-body" style={{ gap: 10 }}>
        <Mascot mood="curious" text="Hmm... I wonder... 🤔" />

        <div className="wonder-icon-badge" role="img" aria-label="Multiplication symbol">×</div>

        <div className="wonder-card">
          <h1 className="wonder-headline">
            A baker puts 5 buns in every box. She packs 4 boxes.
            How many buns did she pack — without counting one by one?
          </h1>
          <p className="wonder-subquestion">
            What if there's a faster way than counting one bun at a time?
          </p>
          <HintPill text="We could skip-count by 5s!" />
        </div>

        <button className="btn-primary" onClick={handleInvestigate} aria-label="Let's investigate">
          🔍 Let's Investigate!
        </button>
      </div>

      <SettingsFAB
        audioEnabled={state.audioEnabled}
        lowEndMode={state.lowEndMode}
        dispatch={dispatch}
      />
    </div>
  );
}
