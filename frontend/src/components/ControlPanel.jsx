import React from 'react';

export default function ControlPanel({
  activeMethod,
  alphaParam,
  initialAngle,
  isPlaying,
  relaxation,
  onAlphaChange,
  onInitialAngleChange,
  onMethodChange,
  onPlayPause,
  onExportCSV,
  onRelaxationChange,
  onReset,
  onStepForward,
}) {
  return (
    <div className="card control-panel">
      <div className="button-row">
        <button type="button" onClick={onPlayPause}>
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button type="button" onClick={onStepForward}>
          Step Forward
        </button>
        <button type="button" onClick={onExportCSV}>
          Export CSV
        </button>
        <button type="button" onClick={onReset}>
          Reset
        </button>
      </div>

      <label>
        Method
        <select value={activeMethod} onChange={(event) => onMethodChange(event.target.value)}>
          <option value="scf">SCF</option>
          <option value="newton">Newton</option>
        </select>
      </label>

      <label>
        Alpha
        <input
          type="number"
          step="0.1"
          value={alphaParam}
          onChange={(event) => onAlphaChange(Number(event.target.value))}
        />
      </label>

      <label>
        Relaxation
        <input
          type="number"
          step="0.05"
          min="0"
          max="1"
          value={relaxation}
          onChange={(event) => onRelaxationChange(Number(event.target.value))}
        />
      </label>

      <label>
        Initial Guess (Angle): {Math.round(initialAngle)}°
        <input
          type="range"
          min="0"
          max="360"
          step="1"
          value={initialAngle}
          onChange={(event) => onInitialAngleChange(Number(event.target.value))}
        />
      </label>
    </div>
  );
}
