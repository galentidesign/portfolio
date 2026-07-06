# frozen_string_literal: true

# POST /t — First-party telemetry sink (§7).
#
# Inherits ActionController::Base directly rather than ApplicationController
# because:
#   1. ApplicationController's allow_browser gate would 406 non-standard UAs
#      (curl, CI, Googlebot). This endpoint must accept POSTs from any UA;
#      bots are handled server-side via ua_class classing, not by blocking.
#   2. ApplicationController's noindex after_action is irrelevant on a JSON
#      POST endpoint.
#
# CSRF: skip_forgery_protection because navigator.sendBeacon cannot carry a
# CSRF token. This is safe by design (§7): same-origin JSON POST,
# kind-allowlisted, writes only anonymous rows with no PII.
#
# Session / cookies: request.session_options[:skip] = true prevents Rails from
# issuing a Set-Cookie header on any response from this endpoint. The §7
# contract forbids cookies entirely.
class TelemetryController < ActionController::Base
  skip_forgery_protection

  # Disable param wrapping so JSON keys arrive flat: params[:kind] and
  # params[:payload] without being nested under a "telemetry" envelope.
  wrap_parameters false

  # Malformed JSON bodies raise ActionDispatch::Http::Parameters::ParseError
  # when params is first accessed inside the action. Rescue here to return
  # 422 instead of the default 400/500.
  rescue_from ActionDispatch::Http::Parameters::ParseError do
    head :unprocessable_entity
  end

  # Coarse UA classification per §7. Bot matches HeadlessChrome/Lighthouse/
  # crawlers/CI user agents; they are recorded but excluded from /ops counts.
  # Blank UA (e.g. synthetic tests) is also classed bot.
  BOT_RE    = /bot|crawl|spider|slurp|headless|lighthouse|preview|fetch|monitor/i.freeze
  MOBILE_RE = /mobi|android|iphone|ipad|ipod/i.freeze

  before_action :suppress_session

  def create
    kind        = params[:kind]
    payload_raw = params[:payload]

    return head :unprocessable_entity unless Event::KINDS.include?(kind)

    # Payload must be a JSON object (ActionController::Parameters) or absent.
    # A non-object value (String, Integer, Array) is rejected.
    case payload_raw
    when ActionController::Parameters
      payload_h = payload_raw.to_unsafe_h
    when nil
      payload_h = {}
    else
      return head :unprocessable_entity
    end

    # Cap payload size at 4 KB to limit abuse.
    return head :unprocessable_entity if payload_h.to_json.bytesize > 4096

    # Derive day_key. Raw IP and UA are hashed and immediately discarded —
    # they never reach a model attribute, log line, or DB column (§7).
    day_key = Digest::SHA256.hexdigest(
      [ Rails.application.secret_key_base, Date.current.iso8601,
        request.remote_ip, request.user_agent ].join(":")
    ).first(32)

    visit = resolve_visit(day_key, payload_h)
    visit.events.create!(kind:, payload: payload_h)

    head :no_content
  end

  private

  # Prevent Rails from issuing a session / Set-Cookie header for any response
  # from this endpoint. Fire-and-forget beacons must never set a cookie.
  def suppress_session
    request.session_options[:skip] = true
  end

  # Race-safe visit resolution. Hot path: find existing visit for today's
  # day_key (most requests hit this). Cold path: create the first visit of
  # the day and rescue any uniqueness collision (DB-level RecordNotUnique
  # covers concurrent production races; model-level RecordInvalid on
  # :day_key covers the same scenario in test where the Rails uniqueness
  # validation fires before the INSERT). Other validation errors propagate.
  def resolve_visit(day_key, payload)
    Visit.find_by(day_key:) || create_visit(day_key, payload)
  end

  def create_visit(day_key, payload)
    Visit.create!(
      day_key:,
      entry_path:     sanitize_path(payload["path"]),
      first_referrer: parse_referrer(payload["referrer"]),
      utm_source:     payload["utm_source"].to_s.first(100).presence,
      utm_medium:     payload["utm_medium"].to_s.first(100).presence,
      utm_campaign:   payload["utm_campaign"].to_s.first(100).presence,
      ua_class:       classify_ua
    )
  rescue ActiveRecord::RecordNotUnique
    Visit.find_by!(day_key:)
  rescue ActiveRecord::RecordInvalid => e
    raise unless e.record.errors.key?(:day_key)
    Visit.find_by!(day_key:)
  end

  # Sanitize the path value from payload. Must start with "/"; fallback "/".
  # Truncated to column width.
  def sanitize_path(raw)
    p = raw.to_s.first(255)
    p.start_with?("/") ? p : "/"
  end

  # Parse a referrer URL and store only host + path (no query, no fragment,
  # no PII). Returns nil when:
  #   - referrer is blank
  #   - the URI is unparseable
  #   - the referrer host matches request.host (in-app navigation)
  def parse_referrer(raw)
    return nil if raw.blank?

    uri = URI.parse(raw.to_s)
    return nil if uri.host.nil?
    return nil if uri.host == request.host

    "#{uri.host}#{uri.path}".first(255)
  rescue URI::InvalidURIError
    nil
  end

  # Map the request UA to a coarse class string. Returns one of the four
  # values in Visit::UA_CLASSES. Blank UA is treated as bot (covers synthetic
  # probes that omit the header).
  def classify_ua
    ua = request.user_agent
    return "bot"    if ua.blank? || BOT_RE.match?(ua)
    return "mobile" if MOBILE_RE.match?(ua)
    "desktop"
  end
end
