require "json"
require "sinatra/base"
require "rack/cors"

require_relative "lib/nepv_system"
require_relative "lib/solvers/scf"
require_relative "lib/solvers/newton"

class App < Sinatra::Base
  configure do
    enable :logging
    set :show_exceptions, false

    use Rack::Cors do
      allow do
        origins "*"
        resource "*",
                 headers: :any,
                 methods: %i[get post options]
      end
    end
  end

  before do
    content_type :json
  end

  get "/health" do
    { ok: true }.to_json
  end

  post "/api/v1/step" do
    payload = parse_json_request
    current_vector = payload["current_vector"] || [0.707, 0.707]
    method_name = (payload["method"] || "scf").to_s
    alpha = (payload["alpha"] || 1.0).to_f
    relaxation = payload["relaxation"]
    relaxation = relaxation.nil? ? nil : relaxation.to_f

    system = NEPvSystem.new(alpha: alpha)
    solver = solver_for(method_name, system: system, vector: current_vector, alpha: alpha, relaxation: relaxation)
    result = solver.step

    {
      current_vector: current_vector,
      next_vector: result[:next_vector],
      residual_error: result[:residual_error],
      target_vector: result[:target_vector],
      relaxation: relaxation,
      method: method_name,
      alpha: alpha,
      matrix: system.a_vector(current_vector)
    }.to_json
  end

  helpers do
    def parse_json_request
      body = request.body.read
      body.empty? ? {} : JSON.parse(body)
    rescue JSON::ParserError
      {}
    end

    def solver_for(method_name, system:, vector:, alpha:, relaxation: nil)
      case method_name
      when "newton"
        Solvers::Newton.new(system: system, vector: vector, alpha: alpha, relaxation: relaxation)
      else
        Solvers::Scf.new(system: system, vector: vector, alpha: alpha, relaxation: relaxation)
      end
    end
  end
end

App.run! if __FILE__ == $PROGRAM_NAME
