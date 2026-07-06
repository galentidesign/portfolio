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

  # Module-preload paths for the current Inertia page's chunk and its static
  # import chain. Inertia resolves pages via a dynamic glob, so without this
  # the page chunk downloads only after the entry executes — a full extra
  # network hop before first render. Like font preloads, this is an
  # optimization, never a hard dependency: with the dev server running or no
  # build manifest present it contributes nothing.
  def inertia_page_preload_paths(component)
    return [] if component.blank? || ViteRuby.instance.dev_server_running?

    manifest = vite_build_manifest
    return [] if manifest.nil?

    collect_chunk_paths(manifest, "pages/#{component}.tsx")
  end

  private

  def vite_build_manifest
    path = ViteRuby.instance.config.build_output_dir.join(".vite/manifest.json")
    return nil unless path.exist?

    mtime = path.mtime
    cached = Thread.current[:vite_build_manifest]
    return cached[:manifest] if cached && cached[:path] == path && cached[:mtime] == mtime

    manifest = JSON.parse(path.read)
    Thread.current[:vite_build_manifest] = { path: path, mtime: mtime, manifest: manifest }
    manifest
  end

  def collect_chunk_paths(manifest, key, seen = Set.new)
    return [] if seen.include?(key)

    seen << key
    entry = manifest[key]
    return [] if entry.nil?

    prefix = ViteRuby.instance.config.public_output_dir
    paths = [ "/#{prefix}/#{entry['file']}" ]
    Array(entry["imports"]).each do |import_key|
      paths.concat(collect_chunk_paths(manifest, import_key, seen))
    end
    paths.uniq
  end
end
