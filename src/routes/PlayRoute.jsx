import React, { useEffect, useRef, useState } from 'react';
import { useNavigate }        from 'react-router-dom';
import PhaseTracker           from '../components/chrome/PhaseTracker.jsx';
import HomePill               from '../components/chrome/HomePill.jsx';
import SettingsFAB            from '../components/chrome/SettingsFAB.jsx';
import ParticleBackground     from '../components/shared/ParticleBackground.jsx';
import { WORLDS }             from '../data/worldMap.js';
import { calcStars, starsDisplay } from '../utils/scoring.js';
import { narrate, stopNarration, SOUND } from '../utils/audio.js';
import { questionNarration } from '../utils/narration.js';
import { getBadge }           from '../utils/badgeEngine.js';

/* ─────────────────────────────────────────────
   WORLD SELECT
───────────────────────────────────────────── */
function WorldSelect({ state, dispatch }) {
  const hasAnyScore = state.worldScores.some(s => s !== null);

  function handleReset() {
    if (window.confirm('Reset all worlds? This will clear all scores, stars, XP, and badges.')) {
      dispatch({ type: 'RESET_WORLDS' });
    }
  }

  return (
    /* Uses vp-body--top so it's a column layout from the top */
    <>
      <div className="world-select-header">
        <h1>🎮 Choose Your World!</h1>
        <p>Beat each world to unlock the next. Earn stars and XP!</p>
      </div>

      {/* world-list has flex:1 + overflow-y:auto — only element that scrolls */}
      <div className="world-list" role="list">
        {WORLDS.map((world, i) => {
          const isUnlocked  = state.worldUnlocked[i];
          const score       = state.worldScores[i];
          const isCompleted = score !== null;
          const ws = !isUnlocked ? 'locked' : isCompleted ? 'completed' : 'unlocked';

          return (
            <div key={world.id} className={`world-card world-card--${ws}`} role="listitem">
              <div className={`world-card__icon world-card__icon--${isUnlocked ? world.color : 'locked'}`}>
                {isUnlocked ? world.emoji : '🔒'}
              </div>
              <div className="world-card__info">
                <div className={`world-card__name${!isUnlocked ? ' world-card__name--muted' : ''}`}>{world.name}</div>
                <div className="world-card__desc">{world.descriptor}</div>
              </div>
              {ws === 'unlocked' && (
                <button className="world-card__play-btn"
                  onClick={() => dispatch({ type: 'SELECT_WORLD', payload: i })}
                  aria-label={`Play ${world.name}`}>
                  ▶ PLAY
                </button>
              )}
              {ws === 'completed' && (
                <div className="world-card__stars">
                  <div className="star-rating">{starsDisplay(calcStars(score))}</div>
                  <button className="world-card__replay-btn"
                    onClick={() => dispatch({ type: 'SELECT_WORLD', payload: i })}>
                    REPLAY
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Reset All Worlds button */}
      {hasAnyScore && (
        <div style={{ width: 'min(640px, 94vw)', display: 'flex', justifyContent: 'center', flexShrink: 0, paddingBottom: 4 }}>
          <button
            className="btn-secondary"
            onClick={handleReset}
            style={{
              color: 'var(--accent-alert-coral)',
              borderColor: 'rgba(224,85,107,0.3)',
              fontSize: 12,
              gap: 5,
            }}
          >
            🔄 Reset All Worlds
          </button>
        </div>
      )}
    </>
  );
}

/* ─────────────────────────────────────────────
   QUIZ SCREEN
───────────────────────────────────────────── */
function QuizScreen({ state, dispatch }) {
  const worldIdx  = state.currentWorldIndex;
  const qIdx      = state.currentQuestionInWorld;
  const questions = state.questionWorlds[worldIdx] || [];
  const question  = questions[qIdx];

  // Track correct count for this world attempt using state
  const correctCountRef = useRef(0);

  // Reset correct count when starting a new world
  useEffect(() => {
    correctCountRef.current = 0;
  }, [worldIdx]);

  // Feedback toast: { text, type: 'correct' | 'wrong' | 'hint' }
  const [feedbackToast, setFeedbackToast] = useState(null);
  const feedbackTimerRef = useRef(null);

  function showFeedback(text, type) {
    clearTimeout(feedbackTimerRef.current);
    setFeedbackToast({ text, type });
    feedbackTimerRef.current = setTimeout(() => setFeedbackToast(null), 2500);
  }

  useEffect(() => {
    return () => clearTimeout(feedbackTimerRef.current);
  }, []);

  // Narrate question when it changes
  useEffect(() => {
    if (!question) return;
    stopNarration();
    if (state.audioEnabled) {
      const t = setTimeout(() => narrate(questionNarration(question)), 120);
      return () => { clearTimeout(t); stopNarration(); };
    }
    return () => stopNarration();
  }, [question?.id, state.audioEnabled]);

  // Stop on unmount
  useEffect(() => () => stopNarration(), []);

  if (!question) return (
    <div className="question-card" style={{ textAlign: 'center', padding: 32 }}>
      <p style={{ color: 'var(--text-muted-lavender)' }}>Loading questions…</p>
    </div>
  );

  const world = WORLDS[worldIdx];
  const qPct  = Math.round((qIdx / 10) * 100);
  const isAnswered = state.answerRevealed || state.selectedAnswerIndex !== null;

  // Pick a random praise/encouragement line (stable per question)
  const PRAISE_LINES = [
    "Amazing! That's the magic of multiplying!",
    "Well done! You've got this!",
    "Brilliant! Skip-counting works every time!",
    "You got it! Keep going!",
    "Fantastic! That's one more fact in your brain!",
  ];
  const ENCOURAGE_LINES = [
    "Let's try again — think about the equal groups!",
    "Not quite — use skip-counting to check!",
    "So close! Try counting in jumps.",
    "Almost there — you can do it!",
  ];

  function handleAnswer(optIdx) {
    if (isAnswered) return;
    dispatch({ type: 'SELECT_ANSWER', payload: optIdx });

    const isCorrect = optIdx === question.correctIndex;
    if (isCorrect) {
      SOUND.correct();
      correctCountRef.current += 1;
      dispatch({ type: 'ANSWER_CORRECT' });

      const praiseLine = PRAISE_LINES[Math.floor(Math.random() * PRAISE_LINES.length)];
      showFeedback(praiseLine, 'correct');

      setTimeout(() => {
        if (state.audioEnabled) { stopNarration(); narrate([{ text: praiseLine, style: 'celebration' }]); }
      }, 200);

    } else {
      SOUND.wrong();
      dispatch({ type: 'ANSWER_INCORRECT' });

      const encourageLine = ENCOURAGE_LINES[Math.floor(Math.random() * ENCOURAGE_LINES.length)];
      showFeedback(encourageLine, 'wrong');

      setTimeout(() => {
        if (state.audioEnabled) { stopNarration(); narrate([{ text: encourageLine, style: 'thinking' }]); }
      }, 200);

      // After 2 fails: reveal answer
      if (state.attemptCount + 1 >= 2) {
        setTimeout(() => { dispatch({ type: 'REVEAL_ANSWER' }); }, 700);
      }
    }
  }

  function handleHint() {
    if (state.currentHintLevel >= 2) return;
    const nextLevel = state.currentHintLevel + 1;
    dispatch({ type: 'USE_HINT' });
    SOUND.hint();

    const hintText = nextLevel === 1 ? question.hint1 : question.hint2;
    showFeedback(`💡 ${hintText}`, 'hint');

    if (state.audioEnabled) {
      stopNarration();
      // Use pre-generated hint audio from audioMap
      narrate([{ text: hintText, style: 'thinking' }]);
    }
  }

  function handleNext() {
    stopNarration();
    if (qIdx >= 9) {
      dispatch({ type: 'COMPLETE_WORLD', payload: { worldIndex: worldIdx, correctCount: correctCountRef.current } });
    } else {
      dispatch({ type: 'NEXT_QUESTION' });
    }
  }

  function handlePrev() {
    stopNarration();
    dispatch({ type: 'PREV_QUESTION' });
  }

  return (
    <>
      {/* Feedback toast — shown on screen for correct/wrong/hint */}
      {feedbackToast && (
        <div
          key={feedbackToast.text}
          style={{
            position: 'fixed',
            top: 74,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 250,
            padding: '10px 24px',
            borderRadius: 'var(--radius-pill)',
            fontWeight: 800,
            fontSize: 14,
            fontFamily: 'Nunito, sans-serif',
            animation: 'slideInUp 0.3s ease',
            boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
            maxWidth: '90vw',
            textAlign: 'center',
            background: feedbackToast.type === 'correct'
              ? 'var(--accent-success-green)'
              : feedbackToast.type === 'wrong'
                ? 'var(--accent-alert-coral)'
                : 'var(--accent-purple-badge)',
            color: '#fff',
          }}
          role="alert"
          aria-live="assertive"
        >
          {feedbackToast.type === 'correct' && '✅ '}
          {feedbackToast.type === 'wrong'   && '❌ '}
          {feedbackToast.text}
        </div>
      )}

      {/* World pill */}
      <div className="world-name-pill">
        <div className="world-name-dot" style={{ background: world.colorHex }} />
        <span>{world.emoji} {world.name}</span>
      </div>

      {/* Stats HUD */}
      <div className="stats-hud" role="status"
        aria-label={`Stars ${state.totalStars}, Lives ${state.lives}, Streak ${state.streak}`}>
        <div className="stats-hud__zone"><span>⭐</span><span>{state.totalStars}</span></div>
        <div className="stats-hud__zone stats-hud__zone--center">
          {[0,1,2].map(i => (
            <span key={i} className={`heart-icon${i < state.lives ? ' heart-icon--full' : ' heart-icon--empty'}`}>
              {i < state.lives ? '❤️' : '🖤'}
            </span>
          ))}
        </div>
        <div className="stats-hud__zone"><span>🔥</span><span>{state.streakMultiplier}x</span></div>
      </div>

      {/* Question progress */}
      <div className="question-progress-row">
        <span>Question {qIdx + 1}/10</span>
        <span>{qPct}%</span>
      </div>
      <div className="question-progress-bar">
        <div className="question-progress-fill" style={{ width: `${qPct}%` }} />
      </div>

      {/* Question card */}
      <div className="question-card">
        <p className="question-text">{question.questionText}</p>

        <div className="answer-grid" role="group" aria-label="Answer options">
          {question.options.map((opt, i) => {
            let cls = '';
            if (isAnswered) {
              if (i === question.correctIndex) cls = 'answer-btn--correct';
              else if (i === state.selectedAnswerIndex && i !== question.correctIndex) cls = 'answer-btn--incorrect';
            }
            return (
              <button key={i}
                className={`answer-btn ${cls}`}
                onClick={() => handleAnswer(i)}
                disabled={isAnswered}
                aria-label={`Answer: ${opt}`}>
                {String(opt)}
              </button>
            );
          })}
        </div>

        {/* Hint buttons — always visible until 2 hints used or answered */}
        {!state.answerRevealed && (
          <div className="hint-area">
            <button className="hint-btn" onClick={handleHint}
              disabled={state.currentHintLevel >= 2 || isAnswered}
              aria-label={`Get hint ${state.currentHintLevel + 1}`}>
              💡 {state.currentHintLevel === 0 ? 'Hint 1' : state.currentHintLevel === 1 ? 'Hint 2' : 'No more hints'}
            </button>
            {state.currentHintLevel >= 1 && (
              <div className="hint-text" role="note">
                💡 {state.currentHintLevel === 1 ? question.hint1 : question.hint2}
              </div>
            )}
          </div>
        )}

        {/* Explanation shown after reveal */}
        {state.answerRevealed && (
          <div className="hint-text" style={{ borderLeftColor: 'var(--accent-gold)', marginTop: 10 }}>
            ✨ {question.explanation}
          </div>
        )}
      </div>

      {/* XP + navigation row */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        width: 'min(640px, 94vw)', gap: 10,
      }}>
        {/* Previous question */}
        <button
          className="btn-secondary"
          onClick={handlePrev}
          disabled={qIdx === 0}
          aria-label="Previous question"
          style={{ fontSize: 13, padding: '8px 16px' }}
        >
          ← Prev
        </button>

        {/* XP counter */}
        <div className="xp-bar" style={{ flex: 1, textAlign: 'center' }}>
          ⚡ {state.xp} XP &nbsp;|&nbsp; 🔥 {state.streak}
        </div>

        {/* Next question — always available so user can skip/continue */}
        <button
          className="btn-secondary"
          onClick={handleNext}
          aria-label={qIdx >= 9 ? 'Finish world' : 'Next question'}
          style={{
            fontSize: 13, padding: '8px 16px',
            background: isAnswered ? 'var(--accent-success-green)' : undefined,
            color: isAnswered ? '#fff' : undefined,
            borderColor: isAnswered ? 'transparent' : undefined,
          }}
        >
          {qIdx >= 9 ? 'Finish ✓' : 'Next →'}
        </button>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────
   WORLD COMPLETE MODAL
───────────────────────────────────────────── */
function WorldCompleteModal({ state, dispatch, navigate }) {
  const worldIdx    = state.currentWorldIndex;
  const world       = WORLDS[worldIdx];
  const score       = state.worldScores[worldIdx] ?? 0;
  const stars       = calcStars(score);
  const canContinue = worldIdx < 9 && state.worldUnlocked[worldIdx + 1];

  useEffect(() => { SOUND.levelUp(); }, []);

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="World complete">
      <div className="modal-card">
        <div style={{ fontSize: 40, marginBottom: 6 }}>{world.emoji}</div>
        <h2>{world.name} — Complete!</h2>

        <div className="modal-stars">{starsDisplay(stars)}</div>

        <div className="modal-stats">
          <div className="modal-stat">
            <div className="modal-stat__val">{score}/10</div>
            <div className="modal-stat__label">Correct</div>
          </div>
          <div className="modal-stat">
            <div className="modal-stat__val">{state.xp}</div>
            <div className="modal-stat__label">XP</div>
          </div>
          <div className="modal-stat">
            <div className="modal-stat__val">{state.streak}</div>
            <div className="modal-stat__label">Streak</div>
          </div>
        </div>

        {state.badges.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted-lavender)', fontWeight: 700, marginBottom: 6 }}>
              BADGES UNLOCKED
            </p>
            <div className="badges-grid">
              {state.badges.slice(-3).map(id => {
                const b = getBadge(id);
                return b ? <span key={id} className="badge-chip">{b.label}</span> : null;
              })}
            </div>
          </div>
        )}

        <div className="modal-actions">
          <button className="btn-secondary"
            onClick={() => dispatch({ type: 'RETRY_WORLD' })}>
            ↩ Retry
          </button>
          {canContinue ? (
            <button className="btn-primary" style={{ marginTop: 0 }}
              onClick={() => dispatch({ type: 'SELECT_WORLD', payload: worldIdx + 1 })}>
              Next World →
            </button>
          ) : (
            <button className="btn-primary" style={{ marginTop: 0 }}
              onClick={() => dispatch({ type: 'BACK_TO_WORLD_SELECT' })}>
              🌍 All Worlds
            </button>
          )}
        </div>

        <button
          onClick={() => navigate('/reflect')}
          style={{
            marginTop: 10, background: 'none', border: 'none',
            color: 'var(--text-muted-lavender)', cursor: 'pointer',
            fontSize: 12, fontWeight: 700, fontFamily: 'Nunito,sans-serif',
          }}>
          📋 Finish &amp; Reflect →
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN PLAY ROUTE
───────────────────────────────────────────── */
export default function PlayRoute({ state, dispatch }) {
  const navigate = useNavigate();
  const sub      = state.playSubPhase;          // 'select' | 'quiz' | 'worldComplete'
  const qPct     = sub === 'quiz'
    ? Math.round((state.currentQuestionInWorld / 10) * 100)
    : 0;

  return (
    <div className="vp-shell">
      <ParticleBackground lowEndMode={state.lowEndMode} />

      {/* Chrome */}
      <div className="vp-chrome">
        <HomePill dispatch={dispatch} />
        <PhaseTracker currentPhase="play" phaseComplete={state.phaseComplete} />
      </div>

      {/* Sub-progress bar (quiz only) */}
      {sub === 'quiz' && (
        <div className="vp-subbar">
          <div className="vp-subbar-fill" style={{ width: `${qPct}%` }} />
        </div>
      )}

      {/* Body */}
      <div className={`vp-body${sub === 'select' ? ' vp-body--top' : ''}`}
        style={{ gap: 8, width: '100%', alignItems: 'center' }}>
        {sub === 'select'       && <WorldSelect state={state} dispatch={dispatch} />}
        {sub === 'quiz'         && <QuizScreen  state={state} dispatch={dispatch} />}
        {sub === 'worldComplete'&& <WorldCompleteModal state={state} dispatch={dispatch} navigate={navigate} />}
      </div>

      <SettingsFAB
        audioEnabled={state.audioEnabled}
        lowEndMode={state.lowEndMode}
        dispatch={dispatch}
      />
    </div>
  );
}
