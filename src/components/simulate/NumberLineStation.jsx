import React, { useState } from 'react';
import NumberLineSVG from '../shared/NumberLineSVG.jsx';

const STEPS = [4, 5, 10];

export default function NumberLineStation({ onComplete }) {
  const [step,  setStep]  = useState(5);
  const [jumps, setJumps] = useState(0);

  const max      = step * 10;
  const position = jumps * step;
  const sequence = Array.from({ length: jumps }, (_, i) => (i + 1) * step).join(', ');

  function handleJump() { if (jumps < 10) setJumps(j => j + 1); }
  function handleReset(){ setJumps(0); }
  function changeStep(s){ setStep(s); setJumps(0); }

  return (
    <div className="station-card">
      <div className="station-card-scroll">
        <p className="station-title">🦘 Number Line Jumps</p>
        <p className="station-instruction">Pick a step size, then tap Jump! to skip-count along the line.</p>

        {/* Step selector */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 12 }}>
          {STEPS.map((s) => (
            <button key={s} className="btn-secondary"
              onClick={() => changeStep(s)}
              aria-pressed={step === s}
              style={{
                background: step === s ? 'var(--accent-gold)' : undefined,
                color: step === s ? '#1A1000' : undefined,
                borderColor: step === s ? 'transparent' : undefined,
                fontWeight: 800, fontSize: 15,
              }}>
              ×{s}
            </button>
          ))}
        </div>

        <div className="feedback-panel">
          <NumberLineSVG max={max} position={position} stepSize={step} />
          <p className="feedback-equation">
            Jump {jumps} → <strong style={{ color: 'var(--accent-gold)' }}>{position}</strong>
          </p>
          {jumps > 0 && (
            <p style={{ fontSize: 12, color: 'var(--text-muted-lavender)', marginTop: 4 }}>
              {sequence}
            </p>
          )}
        </div>

        {jumps === 10
          ? <div className="status-banner status-banner--success">🎉 Full ×{step} table! {step} × 10 = {step * 10}</div>
          : <div className="status-banner status-banner--info">🦘 Jump {jumps + 1} will land on {(jumps + 1) * step}.</div>
        }
      </div>

      <div className="station-actions">
        <button className="btn-secondary"
          onClick={handleJump}
          disabled={jumps >= 10}
          style={{ background: 'var(--accent-gold)', color: '#1A1000', borderColor: 'transparent', fontWeight: 800 }}>
          🦘 Jump! +{step}
        </button>
        <button className="btn-secondary" onClick={handleReset}>↩ Reset</button>
        <button className="btn-secondary"
          onClick={onComplete}
          style={{ background: 'var(--accent-success-green)', color: '#fff', borderColor: 'transparent' }}>
          ✓ Got it!
        </button>
      </div>
    </div>
  );
}
