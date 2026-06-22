import React, { useState } from 'react';
import EqualGroupsDiagram from '../shared/EqualGroupsDiagram.jsx';

function SliderRow({ label, min, max, value, onChange }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <label className="slider-label">{label}: <strong style={{ color: 'var(--accent-gold)' }}>{value}</strong></label>
      <input type="range" className="styled-slider" min={min} max={max} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ '--slider-fill-pct': `${pct}%` }}
        aria-label={label} />
    </div>
  );
}

export default function EqualGroupsStation({ onComplete }) {
  const [groups,   setGroups]   = useState(4);
  const [perGroup, setPerGroup] = useState(5);
  const product = groups * perGroup;

  return (
    <div className="station-card">
      <div className="station-card-scroll">
        <p className="station-title">🧺 Equal Groups</p>
        <p className="station-instruction">Set the groups and items per group — watch the total update!</p>

        <div className="operand-row">
          <div className="operand operand--gold">
            <span className="operand__label">GROUPS</span>
            <span className="operand__value">{groups}</span>
          </div>
          <span className="operand-operator">×</span>
          <div className="operand operand--purple">
            <span className="operand__label">PER GROUP</span>
            <span className="operand__value">{perGroup}</span>
          </div>
          <span className="operand-operator">=</span>
          <div className="operand">
            <span className="operand__label">TOTAL</span>
            <span className="operand__value" style={{ color: 'var(--accent-success-green)' }}>{product}</span>
          </div>
        </div>

        <SliderRow label="Groups"        min={1} max={10} value={groups}   onChange={setGroups} />
        <SliderRow label="Items / Group" min={1} max={10} value={perGroup} onChange={setPerGroup} />

        <div className="feedback-panel">
          <EqualGroupsDiagram groups={groups} perGroup={perGroup} />
          <p className="feedback-equation">
            {groups} groups of {perGroup} = <strong>{product}</strong>
          </p>
        </div>

        <div className="status-banner status-banner--success">
          ✨ Multiplication is a shortcut for counting equal groups!
        </div>
      </div>

      <div className="station-actions">
        <button className="btn-secondary" onClick={() => {
          setGroups(Math.floor(Math.random() * 9) + 1);
          setPerGroup(Math.floor(Math.random() * 9) + 1);
        }}>🎲 New Groups</button>
        <button className="btn-secondary"
          onClick={onComplete}
          style={{ background: 'var(--accent-success-green)', color: '#fff', borderColor: 'transparent' }}>
          ✓ Got it!
        </button>
      </div>
    </div>
  );
}
