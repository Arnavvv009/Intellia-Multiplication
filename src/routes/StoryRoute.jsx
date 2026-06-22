import React, { useEffect } from 'react';
import { useNavigate }       from 'react-router-dom';
import PhaseTracker          from '../components/chrome/PhaseTracker.jsx';
import HomePill              from '../components/chrome/HomePill.jsx';
import AudioToggleFAB        from '../components/chrome/AudioToggleFAB.jsx';
import Mascot                from '../components/shared/Mascot.jsx';
import HintPill              from '../components/shared/HintPill.jsx';
import StoryIllustration     from '../components/story/StoryIllustration.jsx';
import ParticleBackground    from '../components/shared/ParticleBackground.jsx';
import { STORY_SLIDES }      from '../data/storyContent.js';
import { narrate, stopNarration } from '../utils/audio.js';
import { getStoryNarration }      from '../utils/narration.js';

export default function StoryRoute({ state, dispatch }) {
  const navigate = useNavigate();
  const idx   = state.storySlideIndex;
  const slide = STORY_SLIDES[idx];
  const total = STORY_SLIDES.length;
  const pct   = Math.round(((idx + 1) / total) * 100);

  // ── Narration: fires on slide change OR audio toggle ──────────────────────
  // Cleanup runs BEFORE the next effect fires — so slide 1 audio stops before
  // slide 2 audio starts. This is the key fix for the overlap bug.
  useEffect(() => {
    stopNarration();                          // always stop the previous slide first
    if (state.audioEnabled) {
      const t = setTimeout(() => narrate(getStoryNarration(idx)), 120);
      return () => { clearTimeout(t); stopNarration(); };
    }
    return () => stopNarration();
  }, [idx, state.audioEnabled]);             // ← idx in deps = re-runs on every slide change

  // ── Stop on unmount (leaving Story phase entirely) ────────────────────────
  useEffect(() => () => stopNarration(), []);

  function handleNext() {
    stopNarration();                          // stop current slide audio immediately
    if (idx < total - 1) {
      dispatch({ type: 'NEXT_SLIDE' });
    } else {
      dispatch({ type: 'SET_PHASE', payload: 'simulate' });
      dispatch({ type: 'COMPLETE_PHASE_STORY' });
      navigate('/simulate');
    }
  }

  function handlePrev() {
    stopNarration();                          // stop current slide audio immediately
    dispatch({ type: 'PREV_SLIDE' });
  }

  return (
    <div className="vp-shell">
      <ParticleBackground />

      <div className="vp-chrome">
        <HomePill dispatch={dispatch} />
        <PhaseTracker currentPhase="story" phaseComplete={state.phaseComplete} />
      </div>

      <div className="vp-subbar">
        <div className="vp-subbar-fill" style={{ width: `${pct}%` }} />
      </div>

      <div className="vp-body vp-body--top" style={{ gap: 6, paddingTop: 10 }}>

        {/* Slide progress row */}
        <div className="slide-progress-row">
          <span>Slide {idx + 1} of {total}</span>
          <div className="slide-progress-dots" role="tablist">
            {STORY_SLIDES.map((_, i) => (
              <div key={i}
                className={`slide-dot${i === idx ? ' slide-dot--active' : ''}`}
                role="tab" aria-selected={i === idx} />
            ))}
          </div>
          <span>{pct}%</span>
        </div>

        {/* Story card */}
        <div className="story-card" key={slide.id}>
          <div className="story-illustration-wrap">
            <StoryIllustration scene={slide.illustrationScene} title={slide.title} />
          </div>
          <div className="story-card-inner">
            <h2 className="story-title">{slide.title}</h2>
            <p className="story-body">{slide.body}</p>
            <HintPill text={slide.equation} />
            <Mascot mood={slide.mascotMood} text={slide.mascotNudge} small />
          </div>
          <div className="story-nav">
            {idx > 0 && (
              <button className="btn-secondary" onClick={handlePrev}
                style={{ marginRight: 'auto' }}>
                ← Back
              </button>
            )}
            <button className="btn-secondary" onClick={handleNext}>
              {idx === total - 1 ? 'Continue →' : 'Next →'}
            </button>
          </div>
        </div>

      </div>

      <AudioToggleFAB
        audioEnabled={state.audioEnabled}
        onToggle={() => dispatch({ type: 'TOGGLE_AUDIO' })}
      />
    </div>
  );
}
