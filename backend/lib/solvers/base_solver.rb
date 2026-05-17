module Solvers
  class BaseSolver
    attr_reader :system, :vector, :alpha, :relaxation

    def initialize(system:, vector:, alpha:, relaxation: nil)
      @system = system
      @vector = Array(vector)
      @alpha = alpha.to_f
      @relaxation = relaxation.nil? ? nil : relaxation.to_f
    end

    def step
      raise NotImplementedError, "#{self.class} must implement #step"
    end

    protected

    def response(next_vector:, residual_error:, target_vector: nil)
      {
        next_vector: next_vector,
        residual_error: residual_error,
        target_vector: target_vector,
        matrix: system.construct_matrix(vector)
      }
    end
  end
end
