import React, { useReducer, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { generateSessionQuestions } from './utils/shuffle.js';
import { calcXP, calcStars, canUnlockWorld, calcStreakMultiplier } from './utils/scoring.js';
import { checkBadges } from './utils/badgeEngine.js';
import { setAudioEnabled } from './utils/audio.js';
import QUESTIONS from './data/questionBank.js';

// ─── Routes (lazy-loaded for perf) ───────────────────────────────────────────
import LandingRoute  from './routes/LandingRoute.jsx';
import WonderRoute   from './routes/WonderRoute.jsx';
import StoryRoute    from './routes/StoryRoute.jsx';
import SimulateRoute from './routes/SimulateRoute.jsx';
import PlayRoute     from './routes/PlayRoute.jsx';
import ReflectRoute  from './routes/ReflectRoute.jsx';

// ─── Initial State ────────────────────────────────────────────────────────────
const initialState = {
  phase: 'landing',

  // Story
  storySlideIndex: 0,

  // Simulate
  currentSimStation: 0,
  simStationsComplete: [false, false, false, false],

  // Play
  questionWorlds: [],       // 10 arrays of 10 questions
  currentWorldIndex: 0,
  currentQuestionInWorld: 0,
  worldScores: Array(10).fill(null),
  worldUnlocked: [true, ...Array(9).fill(false)],
  playSubPhase: 'select',   // 'select' | 'quiz' | 'worldComplete'

  // Per-question state
  lives: 3,
  attemptCount: 0,
  hintsUsed: 0,
  currentHintLevel: 0,
  selectedAnswerIndex: null,
  answerRevealed: false,

  // Gamification
  xp: 0,
  totalStars: 0,
  streak: 0,
  maxStreak: 0,
  streakMultiplier: 1,
  badges: [],

  // Phase completion
  phaseComplete: {
    wonder: false, story: false, simulate: false,
    play: false, reflect: false,
  },

  // Session
  sessionId: null,
  audioEnabled: true,
};

// ─── Reducer ─────────────────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {
    case 'INIT_SESSION': {
      const worlds = generateSessionQuestions(QUESTIONS);
      return {
        ...state,
        questionWorlds: worlds,
        sessionId: crypto.randomUUID(),
      };
    }

    case 'SET_PHASE':
      return { ...state, phase: action.payload };

    case 'NAVIGATE_HOME':
      return { ...state, phase: 'landing' };

    // Story
    case 'NEXT_SLIDE': {
      const next = state.storySlideIndex + 1;
      if (next >= 4) {
        return {
          ...state,
          storySlideIndex: 0,
          phaseComplete: { ...state.phaseComplete, story: true },
        };
      }
      return { ...state, storySlideIndex: next };
    }
    case 'PREV_SLIDE':
      return { ...state, storySlideIndex: Math.max(0, state.storySlideIndex - 1) };

    case 'COMPLETE_PHASE_STORY':
      return {
        ...state,
        storySlideIndex: 0,
        phaseComplete: { ...state.phaseComplete, story: true },
      };

    // Simulate
    case 'SET_SIM_STATION':
      return { ...state, currentSimStation: action.payload };

    case 'COMPLETE_SIM_STATION': {
      const updated = [...state.simStationsComplete];
      updated[action.payload] = true;
      return { ...state, simStationsComplete: updated };
    }

    case 'COMPLETE_SIMULATE': {
      const newBadges = checkBadges({ ...state, simStationsComplete: [true,true,true,true], phaseComplete: { ...state.phaseComplete, simulate: true } });
      return {
        ...state,
        phase: 'play',
        playSubPhase: 'select',
        phaseComplete: { ...state.phaseComplete, simulate: true },
        simStationsComplete: [true, true, true, true],
        badges: [...state.badges, ...newBadges.filter((b) => !state.badges.includes(b))],
      };
    }

    // Play — world select
    case 'SELECT_WORLD':
      return {
        ...state,
        playSubPhase: 'quiz',
        currentWorldIndex: action.payload,
        currentQuestionInWorld: 0,
        lives: 3,
        attemptCount: 0,
        hintsUsed: 0,
        currentHintLevel: 0,
        selectedAnswerIndex: null,
        answerRevealed: false,
        streak: state.streak, // preserve cross-world streak
      };

    // Play — answering
    case 'SELECT_ANSWER':
      return { ...state, selectedAnswerIndex: action.payload };

    case 'ANSWER_CORRECT': {
      const newStreak = state.streak + 1;
      const mult = calcStreakMultiplier(newStreak);
      const xpGain = calcXP(state.attemptCount + 1, state.hintsUsed > 0, newStreak);
      const newBadges = checkBadges({ ...state, streak: newStreak, maxStreak: Math.max(state.maxStreak, newStreak) });
      return {
        ...state,
        streak: newStreak,
        maxStreak: Math.max(state.maxStreak, newStreak),
        streakMultiplier: mult,
        xp: state.xp + xpGain,
        answerRevealed: true,
        badges: [...state.badges, ...newBadges.filter((b) => !state.badges.includes(b))],
      };
    }

    case 'ANSWER_INCORRECT': {
      const newLives = Math.max(0, state.lives - 1);
      return {
        ...state,
        streak: 0,
        streakMultiplier: 1,
        lives: newLives,
        attemptCount: state.attemptCount + 1,
        answerRevealed: state.attemptCount + 1 >= 2,
      };
    }

    case 'USE_HINT':
      return {
        ...state,
        hintsUsed: state.hintsUsed + 1,
        currentHintLevel: Math.min(2, state.currentHintLevel + 1),
      };

    case 'REVEAL_ANSWER':
      return { ...state, answerRevealed: true };

    case 'NEXT_QUESTION': {
      const nextQ = state.currentQuestionInWorld + 1;
      if (nextQ >= 10) {
        return { ...state, playSubPhase: 'worldComplete' };
      }
      return {
        ...state,
        currentQuestionInWorld: nextQ,
        lives: 3,
        attemptCount: 0,
        hintsUsed: 0,
        currentHintLevel: 0,
        selectedAnswerIndex: null,
        answerRevealed: false,
      };
    }

    case 'PREV_QUESTION': {
      const prevQ = Math.max(0, state.currentQuestionInWorld - 1);
      return {
        ...state,
        currentQuestionInWorld: prevQ,
        lives: 3,
        attemptCount: 0,
        hintsUsed: 0,
        currentHintLevel: 0,
        selectedAnswerIndex: null,
        answerRevealed: false,
      };
    }

    case 'COMPLETE_WORLD': {
      const { worldIndex, correctCount } = action.payload;
      const newScores = [...state.worldScores];
      newScores[worldIndex] = correctCount;
      const stars = calcStars(correctCount);
      const newUnlocked = [...state.worldUnlocked];
      if (canUnlockWorld(correctCount) && worldIndex + 1 < 10) {
        newUnlocked[worldIndex + 1] = true;
      }
      const allWorldsDone = newScores.every((s) => s !== null);
      const newBadges = checkBadges({ ...state, worldScores: newScores });
      return {
        ...state,
        worldScores: newScores,
        worldUnlocked: newUnlocked,
        totalStars: state.totalStars + stars,
        playSubPhase: 'worldComplete',
        phaseComplete: {
          ...state.phaseComplete,
          play: allWorldsDone || state.phaseComplete.play,
        },
        badges: [...state.badges, ...newBadges.filter((b) => !state.badges.includes(b))],
      };
    }

    case 'RETRY_WORLD':
      return {
        ...state,
        playSubPhase: 'quiz',
        currentQuestionInWorld: 0,
        lives: 3,
        attemptCount: 0,
        hintsUsed: 0,
        currentHintLevel: 0,
        selectedAnswerIndex: null,
        answerRevealed: false,
      };

    case 'RESET_WORLDS':
      return {
        ...state,
        worldScores: Array(10).fill(null),
        worldUnlocked: [true, ...Array(9).fill(false)],
        currentWorldIndex: 0,
        currentQuestionInWorld: 0,
        playSubPhase: 'select',
        totalStars: 0,
        xp: 0,
        streak: 0,
        maxStreak: 0,
        streakMultiplier: 1,
        badges: [],
        lives: 3,
        attemptCount: 0,
        hintsUsed: 0,
        currentHintLevel: 0,
        selectedAnswerIndex: null,
        answerRevealed: false,
      };

    case 'BACK_TO_WORLD_SELECT':
      return {
        ...state,
        playSubPhase: 'select',
        selectedAnswerIndex: null,
        answerRevealed: false,
      };

    case 'COMPLETE_REFLECT': {
      const newBadges = checkBadges({ ...state, phaseComplete: { ...state.phaseComplete, reflect: true } });
      return {
        ...state,
        phaseComplete: { ...state.phaseComplete, reflect: true },
        badges: [...state.badges, ...newBadges.filter((b) => !state.badges.includes(b))],
      };
    }

    case 'COMPLETE_WONDER':
      return {
        ...state,
        phase: 'story',
        phaseComplete: { ...state.phaseComplete, wonder: true },
      };

    case 'TOGGLE_AUDIO': {
      const next = !state.audioEnabled;
      setAudioEnabled(next);
      return { ...state, audioEnabled: next };
    }

    case 'RESTORE_SESSION':
      return { ...state, ...action.payload };

    case 'RESET_SESSION':
      return { ...initialState, sessionId: crypto.randomUUID() };

    default:
      return state;
  }
}

// ─── Session persistence ──────────────────────────────────────────────────────
const SESSION_KEY = 'intellia_mult_4_5_10_v1';

function saveSession(state) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      phase: state.phase,
      storySlideIndex: state.storySlideIndex,
      currentWorldIndex: state.currentWorldIndex,
      worldScores: state.worldScores,
      worldUnlocked: state.worldUnlocked,
      xp: state.xp,
      totalStars: state.totalStars,
      badges: state.badges,
      maxStreak: state.maxStreak,
      phaseComplete: state.phaseComplete,
      simStationsComplete: state.simStationsComplete,
      audioEnabled: state.audioEnabled,
      timestamp: Date.now(),
    }));
  } catch { /* localStorage not available */ }
}

function loadSession() {
  try {
    const saved = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    if (saved && Date.now() - saved.timestamp < 86_400_000) return saved;
  } catch { /* ignore */ }
  return null;
}

// ─── Root App (provides context via prop-drilling through routes) ─────────────
export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Init session on mount
  useEffect(() => {
    dispatch({ type: 'INIT_SESSION' });
    const saved = loadSession();
    if (saved) dispatch({ type: 'RESTORE_SESSION', payload: saved });
  }, []);

  // Persist on state changes
  useEffect(() => {
    if (state.sessionId) saveSession(state);
  }, [state]);

  const ctx = { state, dispatch };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"         element={<LandingRoute  {...ctx} />} />
        <Route path="/wonder"   element={<WonderRoute   {...ctx} />} />
        <Route path="/story"    element={<StoryRoute    {...ctx} />} />
        <Route path="/simulate" element={<SimulateRoute {...ctx} />} />
        <Route path="/play"     element={<PlayRoute     {...ctx} />} />
        <Route path="/reflect"  element={<ReflectRoute  {...ctx} />} />
        <Route path="*"         element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
