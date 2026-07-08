# frozen_string_literal: true

# Serves GET /sitemap.xml. The canonical host is jgalenti.com — the sitemap
# describes the launch domain regardless of which host serves this request.
# Staging gets a noindex header (ApplicationController#noindex_off_canonical_host)
# so the pre-launch URL never enters a crawler's index.
class SitemapController < ApplicationController
  SITEMAP_HOST = "https://jgalenti.com"

  def show
    @urls = build_urls(Manifest.slugs, ProjectGallery.slugs)
    respond_to do |format|
      format.xml { render layout: false }
    end
  end

  private

  def build_urls(component_slugs, project_slugs) # rubocop:disable Metrics/MethodLength
    static = [
      "/",
      "/story/rails-era",
      "/story/react-era",
      "/story/agentic",
      "/work",
      "/work/agentic-design-ops",
      "/work/shadcn-to-polaris",
      "/work/shadcn-to-polaris/demo",
      "/gallery",
      "/system",
      "/system/tokens",
      "/system/motion",
      "/system/skins",
      "/resume",
      "/colophon"
    ]
    component_paths = component_slugs.map { |slug| "/system/components/#{slug}" }
    project_paths   = project_slugs.map { |slug| "/gallery/#{slug}" }
    (static + component_paths + project_paths).map { |path| "#{SITEMAP_HOST}#{path}" }
  end
end
