# frozen_string_literal: true

module ApplicationHelper
  # Returns the resolved skin hash for the current request.
  # A valid ?skin= param wins; otherwise falls back to the default skin.
  def current_skin
    SkinRegistry.resolve(params[:skin])
  end

  # Returns vite-resolved paths for fonts the active skin wants preloaded.
  #
  # Fonts enter the manifest via generated CSS url() refs; before the first
  # build in an env there's nothing to preload — preloading is an
  # optimization, never a hard dependency.
  def font_preload_paths
    current_skin.fetch("preloadFonts", []).filter_map do |path|
      vite_asset_path("assets/#{path}")
    rescue ViteRuby::MissingEntrypointError
      nil
    end
  end
end
