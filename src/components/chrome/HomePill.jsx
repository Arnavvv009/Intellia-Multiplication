import React from 'react';
import { useNavigate } from 'react-router-dom';
import { stopNarration } from '../../utils/audio.js';

export default function HomePill({ dispatch }) {
  const navigate = useNavigate();

  function handleHome() {
    stopNarration();                    // stop any playing audio before leaving
    dispatch({ type: 'NAVIGATE_HOME' });
    navigate('/');
  }

  return (
    <button className="home-pill" onClick={handleHome} aria-label="Return to home screen">
      <span aria-hidden="true">🏠</span>
      <span>Home</span>
    </button>
  );
}
