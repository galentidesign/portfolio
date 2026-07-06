# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Ops dashboard", type: :request do
  # Parse the Inertia page data JSON from an HTML response.
  def inertia_page_data
    match = response.body.match(/<script[^>]+data-page="app"[^>]*>(.*?)<\/script>/m)
    raise "No Inertia page data script found in response" unless match

    JSON.parse(match[1])
  end

  # Build a valid HTTP Basic Authorization header value.
  def basic_auth_header(username, password)
    credentials = Base64.strict_encode64("#{username}:#{password}")
    "Basic #{credentials}"
  end

  # ── Fixture helpers ─────────────────────────────────────────────────────────

  def create_desktop_visit!(day_key: "desktop-1", referrer: "https://linkedin.com",
                             created_at: 2.days.ago)
    Visit.create!(
      day_key: day_key,
      ua_class: "desktop",
      entry_path: "/",
      first_referrer: referrer,
      created_at: created_at
    )
  end

  def create_mobile_visit!(day_key: "mobile-1", created_at: 3.days.ago)
    Visit.create!(
      day_key: day_key,
      ua_class: "mobile",
      entry_path: "/work",
      created_at: created_at
    )
  end

  def create_bot_visit!(day_key: "bot-1")
    Visit.create!(
      day_key: day_key,
      ua_class: "bot",
      entry_path: "/",
      created_at: 1.day.ago
    )
  end

  def create_event!(visit:, kind:, payload: {})
    Event.create!(visit: visit, kind: kind, payload: payload)
  end

  # ── (a) No env creds set → 401 for every request ────────────────────────────

  describe "GET /ops with no OPS_USERNAME/OPS_PASSWORD env vars" do
    around do |example|
      saved_user = ENV.delete("OPS_USERNAME")
      saved_pass = ENV.delete("OPS_PASSWORD")
      example.run
    ensure
      ENV["OPS_USERNAME"] = saved_user if saved_user
      ENV["OPS_PASSWORD"] = saved_pass if saved_pass
    end

    it "returns 401 with no Authorization header" do
      get "/ops"
      expect(response).to have_http_status(:unauthorized)
    end

    it "returns 401 even with an Authorization header" do
      get "/ops", headers: { "Authorization" => basic_auth_header("ops", "secret") }
      expect(response).to have_http_status(:unauthorized)
    end

    it "returns 401 even with empty-string credentials" do
      get "/ops", headers: { "Authorization" => basic_auth_header("", "") }
      expect(response).to have_http_status(:unauthorized)
    end
  end

  # ── (b) Env set + no / wrong header → 401 with WWW-Authenticate ─────────────

  describe "GET /ops with env set but bad credentials" do
    around do |example|
      ENV["OPS_USERNAME"] = "ops_user"
      ENV["OPS_PASSWORD"] = "ops_pass"
      example.run
    ensure
      ENV.delete("OPS_USERNAME")
      ENV.delete("OPS_PASSWORD")
    end

    it "returns 401 when no Authorization header is sent" do
      get "/ops"
      expect(response).to have_http_status(:unauthorized)
    end

    it "includes WWW-Authenticate header when no Authorization header is sent" do
      get "/ops"
      expect(response.headers["WWW-Authenticate"]).to match(/Basic realm="ops"/i)
    end

    it "returns 401 with wrong username" do
      get "/ops", headers: { "Authorization" => basic_auth_header("wrong", "ops_pass") }
      expect(response).to have_http_status(:unauthorized)
    end

    it "returns 401 with wrong password" do
      get "/ops", headers: { "Authorization" => basic_auth_header("ops_user", "wrong") }
      expect(response).to have_http_status(:unauthorized)
    end

    it "returns 401 with both wrong" do
      get "/ops", headers: { "Authorization" => basic_auth_header("bad", "bad") }
      expect(response).to have_http_status(:unauthorized)
    end
  end

  # ── (c) Correct credentials → 200 with ops/index component ─────────────────

  describe "GET /ops with correct credentials" do
    around do |example|
      ENV["OPS_USERNAME"] = "ops_user"
      ENV["OPS_PASSWORD"] = "ops_pass"
      example.run
    ensure
      ENV.delete("OPS_USERNAME")
      ENV.delete("OPS_PASSWORD")
    end

    before do
      get "/ops", headers: { "Authorization" => basic_auth_header("ops_user", "ops_pass") }
    end

    it "returns 200" do
      expect(response).to have_http_status(:ok)
    end

    it "renders the ops/index Inertia component" do
      expect(response.body).to include("data-page")
      expect(response.body).to include("ops/index")
    end

    it "sets X-Robots-Tag to noindex" do
      expect(response.headers["X-Robots-Tag"]).to include("noindex")
    end

    it "includes the expected top-level prop keys" do
      props = inertia_page_data["props"]
      expect(props.keys).to include(
        "daily", "topReferrers", "topPaths",
        "storyVsSkim", "demo", "resumeDownloads", "totals"
      )
    end
  end

  # ── (d) Correct aggregate values with fixture data ───────────────────────────

  describe "GET /ops aggregate correctness" do
    around do |example|
      ENV["OPS_USERNAME"] = "ops_user"
      ENV["OPS_PASSWORD"] = "ops_pass"
      example.run
    ensure
      ENV.delete("OPS_USERNAME")
      ENV.delete("OPS_PASSWORD")
    end

    let!(:desktop_visit) do
      create_desktop_visit!(
        day_key: "agg-desktop-1",
        referrer: "https://linkedin.com",
        created_at: 2.days.ago
      )
    end

    let!(:mobile_visit) do
      create_mobile_visit!(day_key: "agg-mobile-1", created_at: 5.days.ago)
    end

    let!(:bot_visit) { create_bot_visit!(day_key: "agg-bot-1") }

    before do
      # Desktop visit events
      create_event!(visit: desktop_visit, kind: "page_view",        payload: { "path" => "/" })
      create_event!(visit: desktop_visit, kind: "story_complete",   payload: { "chapter" => "agentic" })
      create_event!(visit: desktop_visit, kind: "demo_state",       payload: { "state" => "success" })
      create_event!(visit: desktop_visit, kind: "resume_download",  payload: {})

      # Mobile visit events
      create_event!(visit: mobile_visit, kind: "page_view",  payload: { "path" => "/work" })
      create_event!(visit: mobile_visit, kind: "skim_entry", payload: { "via" => "direct" })
      create_event!(visit: mobile_visit, kind: "demo_state", payload: { "state" => "loading" })

      # Bot visit events — must not appear in any aggregate
      create_event!(visit: bot_visit, kind: "page_view",       payload: { "path" => "/" })
      create_event!(visit: bot_visit, kind: "resume_download", payload: {})
      create_event!(visit: bot_visit, kind: "story_complete",  payload: { "chapter" => "agentic" })

      get "/ops", headers: { "Authorization" => basic_auth_header("ops_user", "ops_pass") }
    end

    let(:props) { inertia_page_data["props"] }

    it "totals.visits30d counts only non-bot visits within 30 days" do
      expect(props["totals"]["visits30d"]).to eq(2)
    end

    it "resumeDownloads counts only non-bot resume_download events" do
      expect(props["resumeDownloads"]).to eq(1)
    end

    it "demo.plays counts only non-bot demo_state events" do
      expect(props["demo"]["plays"]).to eq(2)
    end

    it "demo.visits counts distinct non-bot visits with a demo_state event" do
      expect(props["demo"]["visits"]).to eq(2)
    end

    it "storyVsSkim.storyCompletes counts distinct non-bot visits with story_complete" do
      expect(props["storyVsSkim"]["storyCompletes"]).to eq(1)
    end

    it "storyVsSkim.skimEntries counts distinct non-bot visits with skim_entry" do
      expect(props["storyVsSkim"]["skimEntries"]).to eq(1)
    end

    it "topPaths includes the non-bot page_view paths" do
      paths = props["topPaths"].map { |r| r["path"] }
      expect(paths).to include("/")
      expect(paths).to include("/work")
    end

    it "topPaths does not double-count bot page_view paths above non-bot" do
      # "/" appears once from desktop (non-bot) and once from bot; bot is excluded.
      # The count for "/" must therefore be 1.
      slash_entry = props["topPaths"].find { |r| r["path"] == "/" }
      expect(slash_entry).not_to be_nil
      expect(slash_entry["count"]).to eq(1)
    end

    it "topReferrers excludes bot visits" do
      referrers = props["topReferrers"].map { |r| r["referrer"] }
      expect(referrers).to include("https://linkedin.com")
    end

    it "daily array entries have day and count keys" do
      expect(props["daily"]).to be_an(Array)
      props["daily"].each do |entry|
        expect(entry.keys).to include("day", "count")
      end
    end
  end

  # ── (e) X-Robots-Tag noindex always present ──────────────────────────────────

  describe "X-Robots-Tag noindex" do
    around do |example|
      ENV["OPS_USERNAME"] = "ops_user"
      ENV["OPS_PASSWORD"] = "ops_pass"
      example.run
    ensure
      ENV.delete("OPS_USERNAME")
      ENV.delete("OPS_PASSWORD")
    end

    it "is present on a successful 200 response" do
      get "/ops", headers: { "Authorization" => basic_auth_header("ops_user", "ops_pass") }
      expect(response.headers["X-Robots-Tag"]).to include("noindex")
    end

    it "is present on a 401 response (wrong password)" do
      get "/ops", headers: { "Authorization" => basic_auth_header("ops_user", "wrong") }
      expect(response.headers["X-Robots-Tag"]).to include("noindex")
    end
  end
end
