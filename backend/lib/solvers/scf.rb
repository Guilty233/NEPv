require_relative "base_solver"

module Solvers
  class Scf < BaseSolver
    def step
      v_j = normalize(vector)
      x, y = v_j

      # Step 1: Matrix A(v) constructed from normalized vector
      a = 1.0 + (alpha * x**2)
      d = 1.0 + (alpha * y**2)

      # Step 2: Calculate principal eigenvalue using closed-form solution
      discriminant = Math.sqrt((a - d)**2 + 4.0)
      lambda_j = ((a + d) + discriminant) / 2.0

      # Step 3: Calculate eigenvector
      raw_tx = 1.0
      raw_ty = lambda_j - a
      target_mag = Math.sqrt(raw_tx**2 + raw_ty**2)
      return fallback_response if target_mag.zero?

      target_vector = normalize([raw_tx, raw_ty])

      # If target is effectively identical to current (numerical equality),
      # apply a tiny rotation/perturbation to the input and recompute the
      # principal eigenvector so the visualization shows motion.
      if vector_distance(v_j, target_vector) < 1e-8
        eps = 1e-3
        pert = normalize([v_j[0] - eps * v_j[1], v_j[1] + eps * v_j[0]])
        a_p = 1.0 + (alpha * pert[0]**2)
        d_p = 1.0 + (alpha * pert[1]**2)
        disc_p = Math.sqrt((a_p - d_p)**2 + 4.0)
        lambda_p = ((a_p + d_p) + disc_p) / 2.0
        raw_tx_p = 1.0
        raw_ty_p = lambda_p - a_p
        mag_p = Math.sqrt(raw_tx_p**2 + raw_ty_p**2)
        unless mag_p.zero?
          target_vector = normalize([raw_tx_p, raw_ty_p])
        end
      end

      # Step 4: Relaxed update toward the target (use damping so iterations move gradually)
      use_relax = relaxation || 0.35
      v_j1 = relaxed_update(v_j, target_vector, relaxation: use_relax)

      # Step 5: Calculate residual as distance from current to target
      residual = vector_distance(v_j, target_vector)

      response(
        next_vector: v_j1,
        residual_error: residual,
        target_vector: target_vector
      )
    end

    private

    def relaxed_update(current, candidate, relaxation:)
      mixed = current.each_with_index.map do |value, idx|
        (1.0 - relaxation) * value.to_f + relaxation * candidate[idx].to_f
      end
      normalize(mixed)
    end

    def vector_distance(a, b)
      Math.sqrt(
        a.each_with_index.sum do |value, index|
          (value.to_f - b[index].to_f)**2
        end
      )
    end

    def normalize(vec)
      values = Array(vec).map(&:to_f)
      length = Math.sqrt(values[0]**2 + values[1]**2)
      return [1.0, 0.0] if length.zero?
      values.map { |val| val / length }
    end

    def fallback_response
      response(
        next_vector: [1.0, 0.0],
        residual_error: 0.0,
        target_vector: [1.0, 0.0]
      )
    end
  end
end
