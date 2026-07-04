# frozen_string_literal: true

# The asset pipeline is intentionally absent (Vite owns assets), but platform
# tooling (e.g. Render's Rails auto-detection) still invokes assets:clean
# after the build. Provide it as a no-op.
namespace :assets do
  unless Rake::Task.task_defined?("assets:clean")
    desc "No-op: Vite manages assets, nothing to clean"
    task :clean
  end
end
