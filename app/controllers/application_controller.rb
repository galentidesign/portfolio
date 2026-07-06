class ApplicationController < ActionController::Base
  # Only allow modern browsers supporting webp images, web push, badges, import maps, CSS nesting, and CSS :has.
  allow_browser versions: :modern

  # Until the M10 DNS cutover only jgalenti.com may be indexed — staging and
  # any other host get a noindex header so the pre-launch URL never enters a
  # crawler's index (launch-gate item, guarded from the moment a sitemap
  # exists).
  CANONICAL_HOST = "jgalenti.com"

  after_action :noindex_off_canonical_host

  private

  def noindex_off_canonical_host
    host = request.host
    return if host == CANONICAL_HOST || host.end_with?(".#{CANONICAL_HOST}")

    response.headers["X-Robots-Tag"] = "noindex"
  end
end
