# frozen_string_literal: true

# OG card render targets (§8).
# Each key maps to a 1200×630 React card template screenshotted by
# `rake og:generate`. This controller is a generation-only surface:
# every response carries X-Robots-Tag: noindex regardless of host.
class OgController < InertiaController
  ALLOWED_KEYS = OgHelper::CARD_MAP.keys.freeze
  private_constant :ALLOWED_KEYS

  def show
    key = params[:key]
    unless ALLOWED_KEYS.include?(key)
      head :not_found
      return
    end

    # Force noindex on this generation surface even on the canonical host
    # (ApplicationController's after_action only covers off-canonical hosts).
    response.headers["X-Robots-Tag"] = "noindex"

    meta = OgHelper::CARD_MAP[key]
    render inertia: "og/card", props: {
      ogKey: key,
      title: meta[:title],
      subtitle: meta[:subtitle],
      skin: meta[:skin]
    }
  end
end
