import React, { useState } from 'react';
import ArrayDiagram from '../shared/ArrayDiagram.jsx';

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

export default function ArrayGridStation({ onComplete }) {
  const [rows, setRows] = useState(4);
  const [cols, setCols] = useState(5);
  const product = rows * cols;

  function handleRotate() {
    const r = rows; setRows(cols); setCols(r);
  }

  return (
    <div className="station-card">
      <div className="station-card-scroll">
        <p className="station-title">🔲 Array Grid</p>
        <p className="station-instruction">Drag the sliders — watch the dot array update live!</p>

        <div className="operand-row">
          <div className="operand operand--gold">
            <span className="operand__label">ROWS</span>
            <span className="operand__value">{rows}</span>
          </div>
          <span className="operand-operator">×</span>
          <div className="operand operand--purple">
            <span className="operand__label">COLS</span>
            <span className="operand__value">{cols}</span>
          </div>
          <span className="operand-operator">=</span>
          <div className="operand">
            <span className="operand__label">PRODUCT</span>
            <span className="operand__value" style={{ color: 'var(--accent-success-green)' }}>{product}</span>
          </div>
        </div>

        <SliderRow label="Rows"    min={1} max={10} value={rows} onChange={setRows} />
        <SliderRow label="Columns" min={1} max={10} value={cols} onChange={setCols} />

        <div className="feedback-panel">
          <ArrayDiagram rows={rows} cols={cols} />
          <p className="feedback-equation">
            {rows} rows × {cols} cols = <strong>{product}</strong>
          </p>
        </div>

        <div className="status-banner status-banner--success">
          ✨ Try rotating to see {cols} × {rows} = {product}! Same answer — that's commutativity!
        </div>
      </div>

      <div className="station-actions">
        <button className="btn-secondary" onClick={handleRotate}>🔄 Rotate</button>
        <button className="btn-secondary" onClick={() => {
          setRows(Math.floor(Math.random() * 9) + 1);
          setCols(Math.floor(Math.random() * 9) + 1);
        }}>🎲 New Array</button>
        <button className="btn-secondary"
          onClick={onComplete}
          style={{ background: 'var(--accent-success-green)', color: '#fff', borderColor: 'transparent' }}>
          ✓ Got it!
        </button>
      </div>
    </div>
  );
}
