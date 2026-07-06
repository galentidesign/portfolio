# frozen_string_literal: true

# Private telemetry dashboard (§7). HTTP Basic Auth gates every request.
# Credentials are set by hand on the hosting dashboard — they never exist in
# this repo. When either ENV["OPS_USERNAME"] or ENV["OPS_PASSWORD"] is blank,
# every request returns 401: the comparison simply never succeeds.
class OpsController < InertiaController
  # Always noindex: private page even on the production domain (the global
  # noindex_off_canonical_host only fires off the canonical host). Set before
  # auth so the header is present even on 401 responses — after_actions are
  # cancelled when a before_action halts the chain via render.
  before_action :set_noindex
  before_action :authenticate_ops

  def index
    non_bot = Visit.where.not(ua_class: "bot")
    cutoff   = 30.days.ago

    render inertia: "ops/index", props: {
      daily:           daily_visits(non_bot, cutoff),
      topReferrers:    top_referrers(non_bot),
      topPaths:        top_paths(non_bot),
      storyVsSkim:     story_vs_skim(non_bot),
      demo:            demo_stats(non_bot),
      resumeDownloads: resume_downloads(non_bot),
      totals:          { visits30d: non_bot.where(created_at: cutoff..).count }
    }
  end

  private

  def authenticate_ops
    authenticate_or_request_with_http_basic("ops") do |username, password|
      expected_user = ENV["OPS_USERNAME"]
      expected_pass = ENV["OPS_PASSWORD"]

      # DENY-BY-DEFAULT: when either env var is blank the comparison never
      # succeeds. Guard against nil before calling secure_compare, which calls
      # .bytesize and would raise ArgumentError on a nil argument.
      if expected_user.blank? || expected_pass.blank?
        false
      else
        ActiveSupport::SecurityUtils.secure_compare(username, expected_user) &
          ActiveSupport::SecurityUtils.secure_compare(password, expected_pass)
      end
    end
  end

  def set_noindex
    response.headers["X-Robots-Tag"] = "noindex"
  end

  # Returns [{day: "YYYY-MM-DD", count: N}, ...] ascending, last 30 days.
  # Gaps are allowed — no gem required.
  def daily_visits(non_bot, cutoff)
    non_bot
      .where(created_at: cutoff..)
      .group("DATE(created_at)")
      .order("DATE(created_at) ASC")
      .count
      .map { |day, count| { day: day.to_s, count: count } }
  end

  # Returns [{referrer: "...", count: N}, ...] top 10 desc, non-null referrers.
  def top_referrers(non_bot)
    non_bot
      .where.not(first_referrer: nil)
      .group(:first_referrer)
      .order("count_all DESC")
      .limit(10)
      .count
      .map { |referrer, count| { referrer: referrer, count: count } }
  end

  # Returns [{path: "...", count: N}, ...] top 10 desc from page_view payload.
  def top_paths(non_bot)
    Event
      .joins(:visit)
      .merge(non_bot)
      .where(kind: "page_view")
      .group("payload->>'path'")
      .order("count_all DESC")
      .limit(10)
      .count
      .map { |path, count| { path: path, count: count } }
  end

  def story_vs_skim(non_bot)
    base = Event.joins(:visit).merge(non_bot)
    {
      storyCompletes: base.where(kind: "story_complete").distinct.count(:visit_id),
      skimEntries:    base.where(kind: "skim_entry").distinct.count(:visit_id)
    }
  end

  def demo_stats(non_bot)
    demo = Event.joins(:visit).merge(non_bot).where(kind: "demo_state")
    {
      plays:  demo.count,
      visits: demo.distinct.count(:visit_id)
    }
  end

  def resume_downloads(non_bot)
    Event.joins(:visit).merge(non_bot).where(kind: "resume_download").count
  end
end
