import React from 'react';

export default function MatrixDisplay({ matrix }) {
  return (
    <div className="card">
      <h2>A(v)</h2>
      <pre className="matrix-display">
        {matrix ? JSON.stringify(matrix, null, 2) : 'Matrix placeholder will appear here.'}
      </pre>
    </div>
  );
}
