class NEPvSystem
  attr_reader :alpha

  def initialize(alpha:)
    @alpha = alpha.to_f
  end

  def a_vector(vector)
    nx, ny = normalize(Array(vector))

    [
      [1.0 + alpha * nx**2, 1.0],
      [1.0, 1.0 + alpha * ny**2]
    ]
  end

  private

  def normalize(vec)
    length = Math.sqrt(vec[0]**2 + vec[1]**2)
    return [1.0, 0.0] if length.zero?
    [vec[0] / length, vec[1] / length]
  end

  alias construct_matrix a_vector
end
