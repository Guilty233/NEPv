import React, { useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';

function toDeg(rad) {
  return (rad * 180) / Math.PI;
}

function normalize([x, y]) {
  const l = Math.hypot(x, y) || 1;
  return [x / l, y / l];
}

function principalEigenvectorFor(a, d) {
  const disc = Math.sqrt((a - d) * (a - d) + 4.0);
  const lambda = (a + d + disc) / 2.0;
  const tx = 1.0;
  const ty = lambda - a;
  const mag = Math.hypot(tx, ty) || 1;
  return [tx / mag, ty / mag];
}

export default function EnergyValley({ alpha, currentVector }) {
  const data = useMemo(() => {
    const pts = [];
    for (let deg = 0; deg < 360; deg += 1) {
      const theta = (deg * Math.PI) / 180.0;
      const v = [Math.cos(theta), Math.sin(theta)];
      const [nx, ny] = normalize(v);
      const a = 1.0 + alpha * nx * nx;
      const d = 1.0 + alpha * ny * ny;
      // energy (Rayleigh-like): v^T A(v) v
      const energy = a * nx * nx + 2.0 * 1.0 * nx * ny + d * ny * ny;
      // principal eigenvector of A(v)
      const u = principalEigenvectorFor(a, d);
      // residual: distance between v and principal eigenvector
      const res = Math.hypot(nx - u[0], ny - u[1]);
      pts.push({ angle: deg, energy, residual: res });
    }
    return pts;
  }, [alpha]);

  const currentAngle = (() => {
    if (!currentVector) return 0;
    const [x, y] = currentVector;
    let deg = toDeg(Math.atan2(y, x));
    if (deg < 0) deg += 360;
    return Math.round(deg);
  })();

  return (
    <div className="card chart-card">
      <h2>Energy Valley (angle → energy / residual)</h2>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 8, right: 40, left: 6, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="angle" type="number" domain={[0, 360]} />
          <YAxis yAxisId="left" label={{ value: 'Energy', angle: -90, position: 'insideLeft' }} />
          <YAxis yAxisId="right" orientation="right" label={{ value: 'Residual', angle: 90, position: 'insideRight' }} />
          <Tooltip />
          <Line type="monotone" yAxisId="left" dataKey="energy" stroke="#0e7490" dot={false} strokeWidth={2} name="Energy" />
          <Line type="monotone" yAxisId="right" dataKey="residual" stroke="#f97316" dot={false} strokeWidth={2} name="Residual" />
          <ReferenceLine x={currentAngle} yAxisId="left" stroke="#ef4444" strokeWidth={2.5} label={{ value: 'Current', position: 'top', fill: '#ef4444', fontSize: 12 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
