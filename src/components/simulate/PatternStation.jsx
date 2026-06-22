import React, { useState } from 'react';

const TABLES = [4, 5, 10];
const MULTS  = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const COLORS = { 4: '#7B5CC9', 5: '#3DBA6E', 10: '#F5B82E' };
const LABELS = { 4: '×4 Table', 5: '×5 Table', 10: '×10 Table' };
const PATTERNS = {
  4:  'Last digits of ×4: 4, 8, 2, 6, 0 — all even!',
  5:  'Last digits of ×5: always 0 or 5 — super easy to spot!',
  10: 'Last digits of ×10: always 0 — just add a zero!',
};

export default function PatternStation({ onComplete }) {
  const [active,   setActive]   = useState(4);
  const [revealed, setRevealed] = useState({});

  function toggle(t, m) {
    const k = `${t}_${m}`;
    setRevealed(prev => ({ ...prev, [k]: !prev[k] }));
  }
  function revealAll() {
    const all = {};
    TABLES.forEach(t => MULTS.forEach(m => { all[`${t}_${m}`] = true; }));
    setRevealed(all);
  }

  const color = COLORS[active];
  const anyRevealed = Object.keys(revealed).some(k => k.startsWith(`${active}_`) && revealed[k]);

  return (
    <div className="station-card">
      <div className="station-card-scroll">
        <p className="station-title">🔍 Pattern Detective</p>
        <p className="station-instruction">Tap cells to reveal facts. Spot the last-digit pattern!</p>

        {/* Table selector */}
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 10 }}>
          {TABLES.map(t => (
            <button key={t} className="btn-secondary"
              onClick={() => setActive(t)}
              aria-pressed={active === t}
              style={{
                background: active === t ? COLORS[t] : undefined,
                color: active === t ? '#fff' : undefined,
                borderColor: active === t ? 'transparent' : undefined,
                fontWeight: 800, fontSize: 13,
              }}>
              {LABELS[t]}
            </button>
          ))}
        </div>

        {/* 5×2 grid of fact cells */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
          {MULTS.map(m => {
            const product = active * m;
            const key     = `${active}_${m}`;
            const show    = revealed[key];
            return (
              <button key={m}
                onClick={() => toggle(active, m)}
                aria-label={show ? `${active}×${m}=${product}` : `Reveal ${active}×${m}`}
                style={{
                  background: show ? color : 'var(--surface-card-nested)',
                  border: `2px solid ${show ? color : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 10, padding: '10px 4px', cursor: 'pointer',
                  transition: 'all 0.15s ease', fontFamily: 'Nunito,sans-serif',
                }}>
                {show ? (
                  <div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.75)', fontWeight: 700 }}>{active}×{m}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', fontFamily: 'Fredoka One,sans-serif' }}>{product}</div>
                  </div>
                ) : (
                  <div style={{ fontSize: 16, color: 'var(--text-muted-lavender)' }}>?</div>
                )}
              </button>
            );
          })}
        </div>

        {anyRevealed && (
          <div className="status-banner status-banner--success" style={{ marginTop: 10 }}>
            🔍 {PATTERNS[active]}
          </div>
        )}
      </div>

      <div className="station-actions">
        <button className="btn-secondary" onClick={revealAll}>👁 Reveal All</button>
        <button className="btn-secondary" onClick={() => setRevealed({})}>↩ Hide All</button>
        {/* "Got it!" on Station D goes directly to Play */}
        <button className="btn-secondary"
          onClick={onComplete}
          style={{ background: 'var(--accent-gold)', color: '#1A1000', borderColor: 'transparent', fontWeight: 800 }}>
          🎮 Go to Play!
        </button>
      </div>
    </div>
  );
}
