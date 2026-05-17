const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:4567/api/v1';

export async function stepIteration({ currentVector, method, alpha, relaxation }) {
  const response = await fetch(`${API_BASE_URL}/step`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      current_vector: currentVector,
      method,
      alpha,
      relaxation,
    }),
  });

  if (!response.ok) {
    throw new Error(`Step request failed with status ${response.status}`);
  }

  return response.json();
}
