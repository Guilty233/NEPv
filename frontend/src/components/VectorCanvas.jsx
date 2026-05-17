import React from 'react';

const ORIGIN = 200;
const SCALE = 130;

export default function VectorCanvas({ currentVector, targetVector, vectorHistory }) {
  const current = currentVector ?? [0, 0];
  const target = targetVector ?? [Math.SQRT1_2, Math.SQRT1_2];
  const trail = (vectorHistory ?? []).map(toCanvasPoint);
  const currentPoint = toCanvasPoint(current);
  const targetPoint = toCanvasPoint(target);
  
  // This local angle math is perfectly fine because it only uses the true target provided by Ruby
  const angle = angleBetween(current, target);
  const isConverged = angle <= 0.5;
  const currentColor = isConverged ? '#16a34a' : '#0e7490';
  const targetColor = isConverged ? '#22c55e' : '#f97316';

  return (
    <div className="card canvas-card">
      <h2>NEPv Direction Plane</h2>
      <svg viewBox="0 0 400 400" className="vector-canvas" role="img" aria-label="2D vector canvas">
        <defs>
          <marker id="arrowhead-current" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L7,3 z" className="current-arrow" fill={currentColor} />
          </marker>
          <marker id="arrowhead-target" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L7,3 z" className="target-arrow" fill={targetColor} />
          </marker>
        </defs>

        {/* Grid Lines */}
        {[80, 140, 260, 320].map((grid) => (
          <g key={grid}>
            <line x1="20" y1={grid} x2="380" y2={grid} stroke="#e5e7eb" strokeWidth="1" />
            <line x1={grid} y1="20" x2={grid} y2="380" stroke="#e5e7eb" strokeWidth="1" />
          </g>
        ))}
        <line x1="20" y1={ORIGIN} x2="380" y2={ORIGIN} stroke="#9ca3af" strokeWidth="2" />
        <line x1={ORIGIN} y1="20" x2={ORIGIN} y2="380" stroke="#9ca3af" strokeWidth="2" />

        {/* Draw Trail */}
        {trail.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="3"
            fill={currentColor}
            className="trail-point"
            opacity={0.35 + (index / Math.max(1, trail.length)) * 0.6}
          />
        ))}

        {/* Draw Vectors */}
        <line
          x1={ORIGIN}
          y1={ORIGIN}
          x2={targetPoint.x}
          y2={targetPoint.y}
          stroke={targetColor}
          strokeWidth="2"
          strokeDasharray="4 4"
          markerEnd="url(#arrowhead-target)"
        />
        <line
          x1={ORIGIN}
          y1={ORIGIN}
          x2={currentPoint.x}
          y2={currentPoint.y}
          stroke={currentColor}
          strokeWidth="3"
          markerEnd="url(#arrowhead-current)"
        />
      </svg>

      <div className="legend-row" style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'center' }}>
        <span style={{ color: targetColor, fontWeight: 'bold' }}>--- Local target direction</span>
        <span style={{ color: currentColor, fontWeight: 'bold' }}>— Current iterate</span>
      </div>

      <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#4b5563' }}>
        <p>Current vector: [{current.map((value) => value.toFixed(3)).join(', ')}]</p>
        <p>Local target vector: [{target.map((value) => value.toFixed(3)).join(', ')}]</p>
        <p>Angular gap: {angle.toFixed(2)} degrees</p>
        <p>Iterations shown: {Math.max(0, (vectorHistory ?? []).length - 1)}</p>
      </div>
    </div>
  );
}

function toCanvasPoint(vector) {
  return {
    x: ORIGIN + vector[0] * SCALE,
    y: ORIGIN - vector[1] * SCALE, // Invert Y axis for SVG
  };
}

function angleBetween(vec1, vec2) {
  const dotProduct = vec1[0] * vec2[0] + vec1[1] * vec2[1];
  const clamped = Math.max(-1, Math.min(1, dotProduct));
  return Math.acos(clamped) * (180 / Math.PI);
}