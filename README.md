# NEPv Interactive Visualizer: Chasing the Moving Target

This repository contains a full-stack, interactive exploration of **Nonlinear Eigenvalue Problems with eigenvector dependency (NEPv)**. 

*(Optional: Insert a quick demo GIF or video link here showing the vector converging)*

## 1. Project Overview & Theory

In a standard linear eigenvalue problem, we solve a fixed matrix equation to find the natural resonant states of a static system:
$$A v = \lambda v$$

In an **NEPv**, the matrix (or operator) depends on the eigenvector itself. The geometry of the space actively warps based on the vector's position:
$$H(v) v = \lambda v$$

**The Intuition:** This creates a massive feedback loop. The direction of $v$ changes the matrix $H$, and the new matrix $H$ dictates a brand new target direction. Solving an NEPv means finding a **Self-Consistent State**—a specific vector that generates a matrix whose principal eigenvector perfectly overlaps with the original vector itself. 
* *Real-world application:* This math is the backbone of Quantum Chemistry (e.g., Density Functional Theory), where the electric field of an atom depends on where the electrons are, but the electrons move based on the electric field.

## 2. Visual Design Choices & Interactive Controls

The visualizer is designed to move beyond a generic scatter of random numbers and instead focus on three core geometric phenomena:

1. **The "Moving Target" Chase (Dependence of Operator on Vector):** The right panel shows the current iterate (solid blue/green arrow) and a local target direction (dashed orange/light-green arrow). When stepping through the standard Self-Consistent Field (SCF) iteration, the user visually sees the target jump away. This visceral "chase" proves the core concept of NEPv.

2. **Symmetry Breaking (Degeneracy):**
   Because the underlying $2 \times 2$ toy matrix uses the squares of the vector components, the system is symmetric across all four quadrants. Starting the vector in different quadrants leads to distinct, degenerate solutions, mimicking physical symmetry breaking.

3. **The Pitchfork Bifurcation:**
   By adjusting the non-linearity parameter (`alpha`), the user can discover a bifurcation phase-transition. At low non-linearity, only a single stable 45° solution exists. When `alpha` crosses a critical threshold, the space fractures into two distinct stable solutions.

4. **Convergence Dual-Signal Chart:**
   Residual alone can be misleading in simple toy systems, so the chart tracks both residual error and angular distance to the local target direction, clearly showing when algorithms either converge or fall into infinite oscillation.

### Interactive Control: Initial Guess Slider

**Why user control matters:** One of the biggest pitfalls of NEPv (and non-linear math in general) is that the final answer you get—or whether you get an answer at all—depends heavily on where you start. This creates **Basins of Attraction**.

- **The Safe Zone:** If you start your vector within ~20 degrees of the true answer, the SCF method easily slides down into the solution.
- **The Danger Zone:** If you start 90 degrees away, the initial matrix might become so warped that the algorithm diverges and explodes.

Instead of pure randomness, the app provides a **0°–360° angle slider**. This lets you:
- Explore how far away you can start before the algorithm breaks (engaging educational discovery).
- Test multiple quadrants systematically to observe symmetry breaking.
- Reproduce exact initial conditions for reproducible teaching moments.

The slider guarantees a **unit-normalized vector** $[\cos\theta, \sin\theta]$ at all times, preventing numerical explosion from user-picked coordinates like $[5, 5]$.

### Visual Convergence Indicator: Green Vector

When the angular gap between current and target vectors drops to **≤ 0.5°**, both vectors (and the trail) automatically turn **green**. This provides instant visual feedback that the algorithm has converged, replacing the need to squint at decimal digits.

## 3. Tech Stack Architecture

The application follows a decoupled architecture, separating the "Physics Engine" from the "Display Terminal":

### Backend (Ruby API)
* **Framework:** Sinatra (lightweight, fast HTTP endpoints).
* **Core Logic:** Plain Old Ruby Objects (POROs) handling the mathematical state, implementing both first-order **SCF iterations** and second-order **Inexact Matrix-Newton** step solvers.
* **Middleware:** `rack-cors` to allow cross-origin requests from the React dev server.

### Frontend (JavaScript / React)
* **Bundler:** Vite (React + JavaScript).
* **Visualization:** HTML5 `<svg>` for the 2D vector space rendering.
* **Charting:** `recharts` for rendering the algorithmic convergence rate.
* **Styling:** Tailwind CSS for rapid, clean control panel UI.

---

## 4. Local Setup (Run it yourself)

### Prerequisites

Install the following before running the project locally:
* Ruby 3.3.8 or later
* Bundler
* Node.js 18 or later
* npm
* rbenv (if you want to switch Ruby versions easily)

If you use `rbenv`, switch to the Ruby version that already has Bundler available:
```bash
rbenv shell 3.3.8
```

### Clone the repository

```bash
git clone https://github.com/Guilty233/NEPv.git
cd NEPv
```

### Install dependencies

Install the Ruby backend gems:

```bash
cd backend
rbenv shell 3.3.8
bundle install
```

Install the frontend dependencies in a second terminal or after returning to the repository root:

```bash
cd frontend
npm install
```

### Run the backend

From the `backend` directory:

```bash
bundle exec ruby app.rb -p 4567
```

The API will be available at `http://localhost:4567`.

### Run the frontend

From the `frontend` directory:

```bash
npm run dev
```

Vite will print the local development URL, usually `http://localhost:5173`.

### Recommended workflow

Keep the backend and frontend running in separate terminals:

1. Start the Ruby API in `backend/`.
2. Start the React app in `frontend/`.
3. Open the frontend URL in your browser.

The frontend talks to the backend through `POST /api/v1/step`.

## 4. Algorithm Details

### SCF (Self-Consistent Field) Iteration
The SCF method iteratively computes:
1. **Current matrix:** $A(v) = \begin{bmatrix} 1 + \alpha x^2 & 1 \\ 1 & 1 + \alpha y^2 \end{bmatrix}$ from current vector $v = [x, y]$.
2. **Principal eigenvector:** Solve $A(v) w = \lambda w$; extract principal eigenvector as **target**.
3. **Relaxation step:** Compute $v_{\text{next}} = (1 - \text{relaxation}) \cdot v + \text{relaxation} \cdot \text{target}$.
4. **Loop:** Set $v := v_{\text{next}}$ and repeat.

When current and target nearly overlap (distance $< 10^{-8}$), a small perturbation is applied to demonstrate that convergence is genuine, not an artifact of initialization.

### Newton Method (Inexact Jacobian)
The Newton solver computes:
1. **Jacobian:** Finite-difference approximation of $\frac{\partial F}{\partial v}$ where $F(v) = A(v)v - \lambda(v) v$.
2. **Newton step:** Solve $J \Delta v = -F$ using Cramer's rule (2×2 direct solve).
3. **Target:** Normalize $v + \Delta v$ as the Newton-corrected target direction.
4. **Relaxation:** Same interpolation as SCF for user control over convergence speed.

Newton typically converges faster (fewer iterations) but is more sensitive to initial conditions.

## 5. Limitations

1. Solver scope.
Current SCF/Newton are educational stubs and not production-grade NEPv solvers for large systems.

2. Small 2D setting.
The visual model is intentionally 2D for intuition; it does not capture many high-dimensional effects seen in practical NEPv applications.

3. Simplified target direction.
The displayed target is a teaching reference direction computed from the current iterate, not a rigorous proof of global convergence.

## 5. Backend API Details (Ruby / Sinatra)

The backend exposes a single stateless endpoint that takes a vector state, applies one mathematical iteration based on the chosen algorithm, and returns the new state.

### Endpoint Contract

**Route:** `POST /api/v1/step`  
**Headers:** `Content-Type: application/json`

**Request Body:**
```json
{
  "current_vector": [0.894, 0.447],
  "method": "scf",
  "alpha": 2.5,
  "relaxation": 0.35
}
```

**Response Body:**
```json
{
  "current_vector": [0.894, 0.447],
  "next_vector": [0.895, 0.446],
  "target_vector": [0.894, 0.448],
  "residual_error": 0.00123,
  "matrix": [
    [3.000, 1.0],
    [1.0, 1.499]
  ],
  "method": "scf",
  "alpha": 2.5,
  "relaxation": 0.35
}
```

**Field Descriptions:**
- `next_vector`: The updated vector after relaxation (becomes the new `current_vector` in the next iteration).
- `target_vector`: The principal eigenvector or Newton-corrected target (purely for visualization).
- `residual_error`: Distance between `current_vector` and `target_vector`.
- `matrix`: Snapshot of $A(v)$ evaluated at the input `current_vector`.

### Python/Ruby Implementation Notes

Both solvers strictly follow the algorithm outlined in the reference paper:
- **SCF:** Principal eigenvalue computation via closed-form 2×2 solution, with relaxation interpolation.
- **Newton:** Finite-difference Jacobian with direct 2×2 linear solve, matching the paper's inexact Newton approach.


## 6. Production vs. Educational: Why Angle Sliders Beat Pure Randomness

In real computational chemistry (e.g., Density Functional Theory for electron orbital calculations):

> **Production Practice:** We rarely use pure random vectors because the failure rate is too high. We use a "smart guess" based on simpler physics—for example, using standard atomic orbitals as the initial guess for molecular orbitals. If we must use random noise, we generate a random vector and **strictly normalize it** before starting the SCF loop.

For your **interview project**, the angle slider provides:
- **Reproducibility:** You can set 45° and discuss exactly why that convergence speed differs from 30°.
- **Educational Discovery:** Show an interviewer how you discovered the Basins of Attraction by sweeping the angle from 0° to 360°.
- **Numerical Stability:** Unit normalization $[\cos\theta, \sin\theta]$ prevents wildly scaled matrices that would explode the solver.

---

## 7. References

The SCF and Newton methods implemented in this project are based on:

- **Linear Algebra and Its Applications** (2024). https://www.sciencedirect.com/science/article/pii/S0024379524004166
