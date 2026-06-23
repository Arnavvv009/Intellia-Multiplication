import React, { useEffect } from 'react';
import { useNavigate }     from 'react-router-dom';
import PhaseTracker        from '../components/chrome/PhaseTracker.jsx';
import HomePill            from '../components/chrome/HomePill.jsx';
import SettingsFAB         from '../components/chrome/SettingsFAB.jsx';
import ParticleBackground  from '../components/shared/ParticleBackground.jsx';
import EqualGroupsStation  from '../components/simulate/EqualGroupsStation.jsx';
import ArrayGridStation    from '../components/simulate/ArrayGridStation.jsx';
import NumberLineStation   from '../components/simulate/NumberLineStation.jsx';
import PatternStation      from '../components/simulate/PatternStation.jsx';
import { STATIONS }        from '../data/simulateContent.js';
import { narrate, stopNarration } from '../utils/audio.js';
import { simulateStationIntro }   from '../utils/narration.js';

const STATION_COMPONENTS = [
  EqualGroupsStation,
  ArrayGridStation,
  NumberLineStation,
  PatternStation,
];

export default function SimulateRoute({ state, dispatch }) {
  const navigate  = useNavigate();
  const activeIdx = state.currentSimStation;
  const StationComp = STATION_COMPONENTS[activeIdx];
  const allDone   = state.simStationsComplete.every(Boolean);

  // ── Narration per station ─────────────────────────────────────────────────
  useEffect(() => {
    stopNarration();
    if (state.audioEnabled) {
      const t = setTimeout(() => narrate(simulateStationIntro(activeIdx)), 120);
      return () => { clearTimeout(t); stopNarration(); };
    }
    return () => stopNarration();
  }, [activeIdx, state.audioEnabled]);

  // ── Stop on unmount ───────────────────────────────────────────────────────
  useEffect(() => () => stopNarration(), []);

  function selectStation(i) {
    stopNarration();
    dispatch({ type: 'SET_SIM_STATION', payload: i });
  }

  function handleContinueToPlay() {
    stopNarration();
    dispatch({ type: 'COMPLETE_SIMULATE' });
    navigate('/play');
  }

  function handleStationComplete() {
    dispatch({ type: 'COMPLETE_SIM_STATION', payload: activeIdx });
    stopNarration();
    // Move to the next station if there is one, otherwise transition to play
    if (activeIdx < 3) {
      dispatch({ type: 'SET_SIM_STATION', payload: activeIdx + 1 });
    } else {
      handleContinueToPlay();
    }
  }

  return (
    <div className="vp-shell">
      <ParticleBackground lowEndMode={state.lowEndMode} />

      <div className="vp-chrome">
        <HomePill dispatch={dispatch} />
        <PhaseTracker currentPhase="simulate" phaseComplete={state.phaseComplete} />
      </div>

      <div className="vp-body vp-body--top" style={{ gap: 8 }}>

        <div className="simulate-header">
          <div className="simulate-header__title">✏️ Simulate</div>
          <div className="simulate-header__subtitle">Explore and discover — no wrong answers!</div>
        </div>

        <div className="station-tab-bar" role="tablist" aria-label="Simulation stations">
          {STATIONS.map((s) => (
            <button
              key={s.id}
              className={`station-tab${activeIdx === s.id ? ' station-tab--active' : ''}`}
              onClick={() => selectStation(s.id)}
              role="tab"
              aria-selected={activeIdx === s.id}
              aria-label={`Station ${s.letter}: ${s.label}`}
            >
              <span className={`station-tab__badge station-tab__badge--${s.badgeColor}`}>
                {state.simStationsComplete[s.id] ? '✓' : s.letter}
              </span>
              <span aria-hidden="true">{s.icon}</span>
              <span className="station-tab__label">{s.label}</span>
            </button>
          ))}
        </div>

        <div style={{ width: 'min(680px, 94vw)', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
          role="tabpanel">
          <StationComp onComplete={handleStationComplete} />
        </div>

        <div className="station-nav">
          <button className="btn-secondary"
            onClick={() => selectStation(Math.max(0, activeIdx - 1))}
            disabled={activeIdx === 0}>
            ← Previous
          </button>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, flex: 1,
            justifyContent: 'center', padding: '0 8px', minWidth: 0,
          }}>
            <span style={{ fontSize: 18 }}>🦉</span>
            <span style={{
              fontSize: 11, color: 'var(--text-muted-lavender)', fontWeight: 700,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              maxWidth: 240,
            }}>
              {STATIONS[activeIdx].tip}
            </span>
          </div>

          {(allDone || activeIdx === 3) ? (
            <button className="btn-primary" onClick={handleContinueToPlay}
              style={{ marginTop: 0 }}>
              🎮 Let's Play!
            </button>
          ) : (
            <button className="btn-secondary"
              onClick={() => selectStation(Math.min(3, activeIdx + 1))}
              disabled={activeIdx === 3}>
              Next →
            </button>
          )}
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
