import React, { useState, useEffect, useRef } from 'react';
import ControlPanel from './components/ControlPanel';
import VectorCanvas from './components/VectorCanvas';
import ConvergenceChart from './components/ConvergenceChart';
import MatrixDisplay from './components/MatrixDisplay';
import { stepIteration } from './services/api';

export default function App() {
  const initialAngleDefault = Math.floor(Math.random() * 361);
  const initialUnitVector = angleToUnitVector(initialAngleDefault);

  const [activeMethod, setActiveMethod] = useState('scf');
  const [alphaParam, setAlphaParam] = useState(2.5);
  const [relaxation, setRelaxation] = useState(0.35);
  const [isPlaying, setIsPlaying] = useState(false);
  const [initialAngle, setInitialAngle] = useState(initialAngleDefault);
  
  // Core State
  const [currentVector, setCurrentVector] = useState(initialUnitVector);
  const [targetVector, setTargetVector] = useState(initialUnitVector); 
  const [matrix, setMatrix] = useState(null);
  
  // Histories for the Canvas and Chart
  const [vectorHistory, setVectorHistory] = useState([initialUnitVector]);
  const [errorHistory, setErrorHistory] = useState([]);
  const [angleHistory, setAngleHistory] = useState([]);

  // Helper function to calculate angle in degrees for the chart
  const angleBetween = (vec1, vec2) => {
    const dotProduct = vec1[0] * vec2[0] + vec1[1] * vec2[1];
    const clamped = Math.max(-1, Math.min(1, dotProduct));
    return Math.acos(clamped) * (180 / Math.PI);
  };

  const handleStepForward = async () => {
    try {
      // 1. Fetch exact physics from Ruby
      const apiData = await stepIteration({ 
        currentVector, 
        method: activeMethod, 
        alpha: alphaParam,
        relaxation,
      });

      // Robustly read backend fields (support snake_case and camelCase)
      const next = apiData.next_vector ?? apiData.nextVector;
      const target = apiData.target_vector ?? apiData.targetVector;
      const residual = apiData.residual_error ?? apiData.residualError ?? 0;
      const matrixSnapshot = apiData.matrix ?? apiData.matrix_snapshot ?? apiData.matrixSnapshot ?? null;

      // 2. Calculate the exact angle between current and the true target (if present)
      const angle = target ? angleBetween(currentVector, target) : 0;

      // 3. Update all state synchronously using the API's exact truth
      setCurrentVector(next ?? currentVector);
      setTargetVector(target ?? targetVector);
      setMatrix(matrixSnapshot);

      setVectorHistory((prev) => [...prev, next ?? currentVector]);
      setErrorHistory((prev) => [...prev, residual]);
      setAngleHistory((prev) => [...prev, angle]);

    } catch (error) {
      console.error("Failed to fetch step:", error);
    }
  };

  // Keep refs to latest parameters for use in Play loop
  const paramsRef = useRef({ currentVector, activeMethod, alphaParam, relaxation, targetVector });
  useEffect(() => {
    paramsRef.current = { currentVector, activeMethod, alphaParam, relaxation, targetVector };
  }, [currentVector, activeMethod, alphaParam, relaxation, targetVector]);

  // Play loop that uses latest params via ref but only runs when isPlaying changes
  useEffect(() => {
    if (!isPlaying) return;

    let cancelled = false;

    const playLoop = async () => {
      while (!cancelled) {
        try {
          const params = paramsRef.current;
          const apiData = await stepIteration({ 
            currentVector: params.currentVector, 
            method: params.activeMethod, 
            alpha: params.alphaParam,
            relaxation: params.relaxation,
          });

          if (cancelled) break;

          const next = apiData.next_vector ?? apiData.nextVector;
          const target = apiData.target_vector ?? apiData.targetVector;
          const residual = apiData.residual_error ?? apiData.residualError ?? 0;
          const matrixSnapshot = apiData.matrix ?? apiData.matrix_snapshot ?? apiData.matrixSnapshot ?? null;

          const angle = target ? angleBetween(params.currentVector, target) : 0;

          setCurrentVector(next ?? params.currentVector);
          setTargetVector(target ?? params.targetVector);
          setMatrix(matrixSnapshot);
          setVectorHistory((prev) => [...prev, next ?? params.currentVector]);
          setErrorHistory((prev) => [...prev, residual]);
          setAngleHistory((prev) => [...prev, angle]);

          await new Promise((r) => setTimeout(r, 300));
        } catch (error) {
          console.error("Play loop error:", error);
          break;
        }
      }
    };

    playLoop();
    return () => { cancelled = true; };
  }, [isPlaying]);

  const handlePlayPause = () => setIsPlaying((p) => !p);

  const applyInitialAngle = (angle) => {
    const vector = angleToUnitVector(angle);
    setIsPlaying(false);
    setCurrentVector(vector);
    setTargetVector(vector);
    setMatrix(null);
    setVectorHistory([vector]);
    setErrorHistory([]);
    setAngleHistory([]);
  };

  const handleInitialAngleChange = (angle) => {
    setInitialAngle(angle);
    applyInitialAngle(angle);
  };

  // Export CSV of residual and angle history
  const exportCSV = () => {
    const header = 'iteration,residual,angle_deg\n';
    const rows = errorHistory.map((r, i) => `${i+1},${r},${(angleHistory[i] ?? 0).toFixed(6)}`);
    const csv = header + rows.join('\n');
    console.log('Export CSV:\n' + csv);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nepv_convergence.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    applyInitialAngle(initialAngle);
  };

  return (
    <div className="app-container">
      {/* Example Layout mapping */}
      <div className="left-panel">
        <ControlPanel 
          activeMethod={activeMethod}
          alphaParam={alphaParam}
          initialAngle={initialAngle}
          relaxation={relaxation}
          isPlaying={isPlaying}
          onMethodChange={setActiveMethod}
          onAlphaChange={setAlphaParam}
          onInitialAngleChange={handleInitialAngleChange}
          onRelaxationChange={setRelaxation}
          onPlayPause={handlePlayPause}
          onExportCSV={exportCSV}
          onStepForward={handleStepForward}
          onReset={handleReset}
        />
        <ConvergenceChart 
          errorHistory={errorHistory} 
          angleHistory={angleHistory} 
        />
        <MatrixDisplay matrix={matrix} />
      </div>
      <div className="right-panel">
        <VectorCanvas 
          currentVector={currentVector} 
          targetVector={targetVector} 
          vectorHistory={vectorHistory} 
        />
      </div>
    </div>
  );
}

function angleToUnitVector(angleDegrees) {
  const radians = (angleDegrees * Math.PI) / 180;
  return [Math.cos(radians), Math.sin(radians)];
}