require_relative "base_solver"

module Solvers
  class Newton < BaseSolver
    def step
      v_k = normalize(vector)

      # 1. Evaluate the function F(v) = A(v)v - lambda*v
      # This corresponds to Line 1 in the paper: B = -F(X)
      f_v, lambda_k = evaluate_f(v_k)

      # 2. Calculate the Jacobian J(v) using Finite Differences
      # This represents the Fréchet derivative L_F from the paper
      j_matrix = approximate_jacobian(v_k)

      # 3. Solve for the Newton update direction: J * delta_v = -F(v)
      # This replaces the entire Krylov loop (Lines 3-8) because our system is exactly 2x2.
      delta_v = solve_2x2_system(j_matrix, f_v.map { |val| -val })

      # 4. Construct the approximate solution (Line 9 in the paper)
      # We add the Newton step to our current vector and normalize
      target_vector = normalize([v_k[0] + delta_v[0], v_k[1] + delta_v[1]])

      if vector_distance(v_k, target_vector) < 1e-8
        eps = 1e-3
        perturbed = normalize([v_k[0] - eps * v_k[1], v_k[1] + eps * v_k[0]])
        f_v_perturbed, = evaluate_f(perturbed)
        j_matrix_perturbed = approximate_jacobian(perturbed)
        delta_v = solve_2x2_system(j_matrix_perturbed, f_v_perturbed.map { |val| -val })
        target_vector = normalize([perturbed[0] + delta_v[0], perturbed[1] + delta_v[1]])
      end

      # 5. Relax the update toward the Newton target so the UI shows gradual motion
      use_relax = relaxation || 0.35
      v_k1 = relaxed_update(v_k, target_vector, relaxation: use_relax)

      # 6. Calculate residual as distance from current to target
      residual = vector_distance(v_k, target_vector)

      response(
        next_vector: v_k1,
        residual_error: residual,
        target_vector: target_vector
      )
    end

    private

    # Calculates F(v) = A(v)v - lambda*v
    def evaluate_f(v)
      x, y = v
      
      # Build A(v) components
      a = 1.0 + (alpha * x**2)
      b = 1.0
      c = 1.0
      d = 1.0 + (alpha * y**2)

      # Calculate A(v) * v
      av_x = (a * x) + (b * y)
      av_y = (c * x) + (d * y)

      # Calculate Rayleigh quotient for lambda: v^T * A(v) * v
      lambda_val = (x * av_x) + (y * av_y)

      # F(v) calculation
      f_x = av_x - (lambda_val * x)
      f_y = av_y - (lambda_val * y)

      [[f_x, f_y], lambda_val]
    end

    # Approximates the L_F (Jacobian) using finite differences
    def approximate_jacobian(v, h = 1e-6)
      f_v, _ = evaluate_f(v)

      # Perturb x component
      f_v_dx, _ = evaluate_f([v[0] + h, v[1]])
      j11 = (f_v_dx[0] - f_v[0]) / h
      j21 = (f_v_dx[1] - f_v[1]) / h

      # Perturb y component
      f_v_dy, _ = evaluate_f([v[0], v[1] + h])
      j12 = (f_v_dy[0] - f_v[0]) / h
      j22 = (f_v_dy[1] - f_v[1]) / h

      [[j11, j12], [j21, j22]]
    end

    # Solves the linear system J * delta = -F using Cramer's rule
    def solve_2x2_system(j, neg_f)
      j11, j12 = j[0]
      j21, j22 = j[1]
      f1, f2 = neg_f

      det_j = (j11 * j22) - (j12 * j21)

      # Fallback if the Jacobian is perfectly singular (flat gradient)
      return [0.0, 0.0] if det_j.abs < 1e-12 

      delta_x = ((f1 * j22) - (j12 * f2)) / det_j
      delta_y = ((j11 * f2) - (f1 * j21)) / det_j

      [delta_x, delta_y]
    end

    def vector_distance(a, b)
      Math.sqrt((a[0] - b[0])**2 + (a[1] - b[1])**2)
    end

    def relaxed_update(current, candidate, relaxation:)
      mixed = current.each_with_index.map do |value, idx|
        (1.0 - relaxation) * value.to_f + relaxation * candidate[idx].to_f
      end
      normalize(mixed)
    end

    def normalize(vec)
      length = Math.sqrt(vec[0]**2 + vec[1]**2)
      return [1.0, 0.0] if length.zero?
      [vec[0] / length, vec[1] / length]
    end
  end
end