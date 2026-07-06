Rails.application.routes.draw do
  # Redirect to localhost from 127.0.0.1 to use same IP address with Vite server
  constraints(host: "127.0.0.1") do
    get "(*path)", to: redirect { |params, req|
      base = "#{req.protocol}localhost:#{req.port}/#{params[:path]}"
      req.query_string.present? ? "#{base}?#{req.query_string}" : base
    }
  end
  root "pages#home"
  get "story/:chapter", to: "story#show",
      as: :story_chapter,
      constraints: { chapter: /rails-era|react-era|agentic/ }

  get "work",                       to: "work#index"
  get "work/agentic-design-ops",    to: "work#agentic_design_ops"
  get "work/shadcn-to-polaris",     to: "work#shadcn_to_polaris"
  get "work/shadcn-to-polaris/demo", to: "work#shadcn_to_polaris_demo"
  get "resume",                     to: "pages#resume"
  get "colophon",                   to: "pages#colophon"

  get "system",                     to: "system#index"
  get "system/tokens",              to: "system#tokens"
  get "system/motion",              to: "system#motion"
  get "system/skins",               to: "system#skins"
  get "system/components/:slug",    to: "system#component",
      as: :system_component,
      constraints: { slug: /[a-z0-9-]+/ }

  # Study B live demo API: read-only, deterministic fixtures with simulated
  # latency and forceable states (success / loading / empty / error). No
  # write endpoints by design — demo form submits are client-simulated.
  namespace :demo do
    get "api/chores",     to: "chores#index"
    get "api/chores/:id", to: "chores#show", as: :api_chore, constraints: { id: /\d+/ }
  end

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # On-brand 404: every unmatched path renders the Inertia not-found page with
  # a 404 status. Rails-internal paths stay excluded so engine routes and
  # framework internals keep their own error handling.
  match "*path", to: "pages#not_found", via: :all,
        defaults: { format: :html },
        constraints: ->(req) { !req.path.start_with?("/rails/") }
end
