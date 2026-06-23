import React, { useState, useEffect } from 'react';
import { useNavigate }     from 'react-router-dom';
import PhaseTracker        from '../components/chrome/PhaseTracker.jsx';
import HomePill            from '../components/chrome/HomePill.jsx';
import SettingsFAB         from '../components/chrome/SettingsFAB.jsx';
import ParticleBackground  from '../components/shared/ParticleBackground.jsx';
import Mascot              from '../components/shared/Mascot.jsx';
import { starsDisplay, calcStars } from '../utils/scoring.js';
import { getBadge }        from '../utils/badgeEngine.js';
import { narrate, stopNarration, SOUND } from '../utils/audio.js';
import { reflectNarration } from '../utils/narration.js';
import { WORLDS }          from '../data/worldMap.js';



/* ─────────────────────────────────────────────
   LIVE ACTIVITY SUMMARY (always visible, auto-updates)
───────────────────────────────────────────── */
function ActivitySummary({ state }) {
  const attempted   = state.worldScores.filter(s => s !== null);
  const totalRight  = attempted.reduce((a, b) => a + b, 0);
  const accuracy    = attempted.length > 0
    ? Math.round((totalRight / (attempted.length * 10)) * 100) : 0;

  const phasesComplete = Object.values(state.phaseComplete).filter(Boolean).length;

  return (
    <div style={{
      background: 'var(--surface-card-nested)', borderRadius: 'var(--radius-card-sm)',
      padding: '14px 18px', width: '100%',
    }}>
      <p style={{ fontSize: 11, color: 'var(--accent-gold)', fontWeight: 800,
        textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
        📊 Your Progress
      </p>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 10 }}>
        <div className="completion-stat">
          <div className="completion-stat__val">{state.xp}</div>
          <div className="completion-stat__label">XP</div>
        </div>
        <div className="completion-stat">
          <div className="completion-stat__val">{state.totalStars}</div>
          <div className="completion-stat__label">Stars</div>
        </div>
        <div className="completion-stat">
          <div className="completion-stat__val">{accuracy}%</div>
          <div className="completion-stat__label">Accuracy</div>
        </div>
        <div className="completion-stat">
          <div className="completion-stat__val">{phasesComplete}/5</div>
          <div className="completion-stat__label">Phases</div>
        </div>
      </div>

      {/* Badges */}
      {state.badges.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <p style={{ fontSize: 10, color: 'var(--text-muted-lavender)', fontWeight: 700, marginBottom: 4 }}>
            BADGES
          </p>
          <div className="badges-grid" style={{ justifyContent: 'flex-start' }}>
            {state.badges.map(id => {
              const b = getBadge(id);
              return b ? <span key={id} className="badge-chip" style={{ fontSize: 11 }}>{b.label}</span> : null;
            })}
          </div>
        </div>
      )}

      {/* World scores */}
      {attempted.length > 0 && (
        <>
          <p style={{ fontSize: 10, color: 'var(--text-muted-lavender)', fontWeight: 700, marginBottom: 4 }}>
            WORLD SCORES
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 4 }}>
            {state.worldScores.map((score, i) => {
              if (score === null) return null;
              const { name, emoji } = WORLDS[i];
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
                  <span>{emoji}</span>
                  <span style={{ flex: 1, color: 'var(--text-primary)', fontWeight: 700,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {name}
                  </span>
                  <span style={{ color: 'var(--accent-gold)', fontWeight: 800 }}>{score}/10</span>
                  <span style={{ fontSize: 10 }}>{starsDisplay(calcStars(score))}</span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {attempted.length === 0 && (
        <p style={{ fontSize: 12, color: 'var(--text-locked-gray)', fontStyle: 'italic' }}>
          No worlds completed yet — play some worlds to see your scores here!
        </p>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   REFLECT ROUTE
───────────────────────────────────────────── */
export default function ReflectRoute({ state, dispatch }) {
  const navigate    = useNavigate();
  const [text, setText]       = useState('');
  const [submitted, setSubmit] = useState(false);

  useEffect(() => {
    stopNarration();
    if (state.audioEnabled) {
      const t = setTimeout(() => narrate(reflectNarration()), 120);
      return () => { clearTimeout(t); stopNarration(); };
    }
    return () => stopNarration();
  }, [state.audioEnabled]);

  // Stop on unmount
  useEffect(() => () => stopNarration(), []);

  function handleSubmit() {
    if (!text.trim()) return;
    dispatch({ type: 'COMPLETE_REFLECT' });
    SOUND.badge();
    setSubmit(true);
  }

  return (
    <div className="vp-shell">
      <ParticleBackground intense={submitted} lowEndMode={state.lowEndMode} />

      {/* Chrome */}
      <div className="vp-chrome">
        <HomePill dispatch={dispatch} />
        <PhaseTracker currentPhase="reflect" phaseComplete={state.phaseComplete} />
      </div>

      {/* Body */}
      <div className="vp-body vp-body--top" style={{ gap: 8, paddingTop: 12 }}>

        <Mascot mood={submitted ? 'celebrating' : 'thinking'}
          text={submitted
            ? "Incredible work — you've mastered multiplication facts! 🎉"
            : "Great work today! Let's think about what you learned... 🤔"}
          center />

        {/* Reflect card — always shows live stats + reflection input */}
        <div className="reflect-card">
          <div className="reflect-card-scroll">
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent-gold)',
              fontFamily: 'Fredoka One,sans-serif', marginBottom: 8, flexShrink: 0 }}>
              📋 Reflect &amp; Remember
            </h2>

            {/* Live activity summary — always visible and auto-updated */}
            <ActivitySummary state={state} />

            <div style={{ height: 12 }} />

            {!submitted && (
              <>
                <p style={{ color: 'var(--text-muted-lavender)', fontSize: 13,
                  marginBottom: 8, flexShrink: 0 }}>
                  Tell me one multiplication trick you learned today!
                </p>

                <textarea
                  className="reflect-textarea"
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder="E.g. Multiplying by 10 just adds a zero…"
                  aria-label="Write your reflection"
                  maxLength={400}
                  style={{ flexShrink: 0 }}
                />

                <p style={{ fontSize: 11, color: 'var(--text-locked-gray)',
                  textAlign: 'right', marginBottom: 8, flexShrink: 0 }}>
                  {text.length}/400
                </p>

                {/* Quick prompts */}
                <p style={{ fontSize: 12, color: 'var(--text-muted-lavender)',
                  fontWeight: 700, marginBottom: 6 }}>
                  Quick prompts:
                </p>
                {[
                  'Multiplying by 10 means…',
                  'Skip-counting by 5s always ends in…',
                  'The commutative property means…',
                  'My favourite fact I learned today is…',
                ].map(p => (
                  <button key={p} className="prompt-btn" onClick={() => setText(p)}>
                    {p}
                  </button>
                ))}

                {/* Submit */}
                <button
                  className="btn-primary"
                  onClick={handleSubmit}
                  disabled={!text.trim()}
                  style={{
                    width: '100%', justifyContent: 'center',
                    marginTop: 10, flexShrink: 0,
                    opacity: text.trim() ? 1 : 0.5,
                  }}>
                  ✨ Submit &amp; Complete!
                </button>
              </>
            )}

            {submitted && (
              <div className="completion-actions" style={{ marginTop: 10 }}>
                <button className="btn-secondary"
                  onClick={() => { dispatch({ type: 'RESET_SESSION' }); navigate('/'); }}>
                  🔄 Replay
                </button>
                <button className="btn-primary" style={{ marginTop: 0 }} onClick={() => navigate('/')}>
                  🏠 Home
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <SettingsFAB
        audioEnabled={state.audioEnabled}
        lowEndMode={state.lowEndMode}
        dispatch={dispatch}
      />
    </div>
  );
}
