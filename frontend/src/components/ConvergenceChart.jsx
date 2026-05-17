import React from 'react';
import {
  LineChart,
  Line,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export default function ConvergenceChart({ errorHistory, angleHistory }) {
  // Directly map the data without doing any local math!
  const chartData = errorHistory.map((residualError, index) => ({
    iterationCount: index + 1,
    residualError: residualError,
    // Safely pull the angle from the history array, defaulting to 0
    angleError: angleHistory && angleHistory[index] != null ? angleHistory[index] : 0, 
  }));

  return (
    <div className="card chart-card">
      <h2>Convergence Story</h2>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={chartData} margin={{ top: 8, right: 20, left: 6, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="iterationCount" />
          <YAxis yAxisId="left" label={{ value: 'Residual', angle: -90, position: 'insideLeft' }} />
          <YAxis yAxisId="right" orientation="right" label={{ value: 'Angle (deg)', angle: 90, position: 'insideRight' }} />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            yAxisId="left"
            dataKey="residualError"
            name="Residual"
            stroke="#0e7490"
            strokeWidth={2.5}
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            yAxisId="right"
            dataKey="angleError"
            name="Angle to local target"
            stroke="#f97316"
            strokeWidth={2.5}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}