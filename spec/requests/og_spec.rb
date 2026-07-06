# frozen_string_literal: true

require "rails_helper"

RSpec.describe "OG cards", type: :request do
  # ── OG card routes ─────────────────────────────────────────────────────────

  describe "GET /og/:key — valid key" do
    it "returns 200 for a known key" do
      get "/og/home"
      expect(response).to have_http_status(:ok)
    end

    it "sets X-Robots-Tag: noindex" do
      get "/og/home"
      expect(response.headers["X-Robots-Tag"]).to eq("noindex")
    end

    it "renders the og/card Inertia component" do
      get "/og/home"
      expect(response.body).to include("og/card")
    end

    it "returns 200 and noindex for every allowed key" do
      OgHelper::CARD_MAP.each_key do |key|
        get "/og/#{key}"
        expect(response).to have_http_status(:ok), "expected 200 for key=#{key}"
        expect(response.headers["X-Robots-Tag"]).to eq("noindex"), "missing noindex for key=#{key}"
      end
    end
  end

  describe "GET /og/:key — unknown key" do
    it "returns 404 for a bogus key" do
      get "/og/no-such-key"
      expect(response).to have_http_status(:not_found)
    end

    it "returns 404 for a key that is close but not in the allowlist" do
      get "/og/home-extra"
      expect(response).to have_http_status(:not_found)
    end
  end

  # ── Server-side og:* emission on page routes ───────────────────────────────
  # These specs verify that Rails emits og:*/twitter:* tags in the HTML it
  # serves — crawlers do not execute JavaScript, so emission must be here.

  describe "GET /resume" do
    before { get "/resume" }

    it "includes an og:image meta tag" do
      expect(response.body).to include("og:image")
    end

    it "og:image content ends with /og/resume.png" do
      expect(response.body).to include("/og/resume.png")
    end

    it "og:title is present" do
      expect(response.body).to include("og:title")
    end
  end

  describe "GET /work/shadcn-to-polaris/demo" do
    before { get "/work/shadcn-to-polaris/demo" }

    it "includes an og:image meta tag" do
      expect(response.body).to include("og:image")
    end

    it "og:image content ends with /og/study-b.png (shared study-b key)" do
      expect(response.body).to include("/og/study-b.png")
    end
  end

  describe "GET /work" do
    it "emits og:image for the work key" do
      get "/work"
      expect(response.body).to include("/og/work.png")
    end
  end

  describe "GET a 404 path" do
    it "does not emit an og:image tag" do
      get "/this-page-does-not-exist-og-test"
      expect(response).to have_http_status(:not_found)
      expect(response.body).not_to include("og:image")
    end
  end
end
