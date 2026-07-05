Rails.application.routes.draw do
  # Redirect to localhost from 127.0.0.1 to use same IP address with Vite server
  constraints(host: "127.0.0.1") do
    get "(*path)", to: redirect { |params, req|
      base = "#{req.protocol}localhost:#{req.port}/#{params[:path]}"
      req.query_string.present? ? "#{base}?#{req.query_string}" : base
    }
  end
  root "pages#home"
  get "system",                     to: "system#index"
  get "system/tokens",              to: "system#tokens"
  get "system/motion",              to: "system#motion"
  get "system/skins",               to: "system#skins"
  get "system/components/:slug",    to: "system#component",
      as: :system_component,
      constraints: { slug: /[a-z0-9-]+/ }

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Render dynamic PWA files from app/views/pwa/* (remember to link manifest in application.html.erb)
  # get "manifest" => "rails/pwa#manifest", as: :pwa_manifest
  # get "service-worker" => "rails/pwa#service_worker", as: :pwa_service_worker

  # Defines the root path route ("/")
  # root "posts#index"
end
