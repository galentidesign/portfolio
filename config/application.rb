require_relative "boot"

require "rails"
# Pick the frameworks you want:
require "active_model/railtie"
require "active_job/railtie"
require "active_record/railtie"
# require "active_storage/engine"
require "action_controller/railtie"
# require "action_mailer/railtie"
# require "action_mailbox/engine"
# require "action_text/engine"
require "action_view/railtie"
# require "action_cable/engine"
# require "rails/test_unit/railtie"

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module Portfolio
  class Application < Rails::Application
    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults 8.1

    # Please, add to the `ignore` list any other `lib` subdirectories that do
    # not contain `.rb` files, or that should not be reloaded or eager loaded.
    # Common ones are `templates`, `generators`, or `middleware`, for example.
    config.autoload_lib(ignore: %w[assets tasks])

    # Configuration for the application, engines, and railties goes here.
    #
    # These settings can be overridden in specific environments using the files
    # in config/environments, which are processed later.
    #
    # config.time_zone = "Central Time (US & Canada)"
    # config.eager_load_paths << Rails.root.join("extras")

    # Don't generate system test files.
    config.generators.system_tests = nil

    # Compress text responses (HTML/JS/CSS/JSON). Must sit ABOVE the static
    # file server or built assets short-circuit around it uncompressed.
    # Staging's proxy also compresses at the edge; this keeps local
    # measurement representative and covers any client the edge misses.
    config.middleware.insert_before ActionDispatch::Static, Rack::Deflater

    # COOKIELESS BY CONTRACT (telemetry README §7, /colophon privacy claim):
    # this app must never Set-Cookie. With forgery protection enabled,
    # inertia_rails writes an XSRF-TOKEN cookie on every response and the
    # token write drags a session cookie with it — so CSRF stays off in every
    # environment. That is sound ONLY because no endpoint authenticates with
    # cookies: /t validates + rate-limits without sessions, the demo API is
    # read-only, /ops uses HTTP basic auth. Any future cookie-authenticated
    # POST must re-enable forgery protection and renegotiate the contract.
    # Pinned by spec/requests/cookieless_spec.rb.
    config.action_controller.allow_forgery_protection = false
  end
end
