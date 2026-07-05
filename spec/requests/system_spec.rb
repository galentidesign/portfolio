# frozen_string_literal: true

require "rails_helper"

RSpec.describe "System", type: :request do
  # These specs run against the real data/manifest/ tree on purpose: /system is
  # a pure function of the manifest, so serving the checked-in YAML end-to-end
  # is exactly the claim under test.  Validation logic has its own fixture-based
  # coverage in spec/models/manifest_spec.rb.
  before { Manifest.reload! }
  after { Manifest.reload! }

  # Parse the Inertia page data JSON from an HTML response.
  # inertia_rails 3.x embeds the JSON as the text content of a
  # <script data-page="app" type="application/json"> element.
  def inertia_page_data
    match = response.body.match(/<script[^>]+data-page="app"[^>]*>(.*?)<\/script>/m)
    raise "No Inertia page data script found in response" unless match

    JSON.parse(match[1])
  end

  # ---------------------------------------------------------------------------
  # GET /system (index)
  # ---------------------------------------------------------------------------
  describe "GET /system" do
    before { get "/system" }

    it "returns 200" do
      expect(response).to have_http_status(:ok)
    end

    it "renders the system/index Inertia component" do
      expect(response.body).to include("data-page")
      expect(response.body).to include("system/index")
    end

    it "includes a components prop as an array" do
      data = inertia_page_data
      expect(data["props"]["components"]).to be_an(Array)
    end

    it "shares a nav prop shaped as [{slug, name, tier}]" do
      nav = inertia_page_data["props"]["nav"]
      expect(nav).to be_an(Array)
      expect(nav).not_to be_empty
      nav.each do |item|
        expect(item.keys).to match_array(%w[slug name tier])
      end
    end
  end

  # ---------------------------------------------------------------------------
  # GET /system/tokens
  # ---------------------------------------------------------------------------
  describe "GET /system/tokens" do
    it "returns 200 and renders the system/tokens Inertia page" do
      get "/system/tokens"

      expect(response).to have_http_status(:ok)
      expect(response.body).to include("data-page")
      expect(response.body).to include("system/tokens")
    end

    it "sets data-skin to the default skin" do
      get "/system/tokens"

      expect(response.body).to include('data-skin="galenti"')
    end

    it "honours ?skin=debug and sets data-skin accordingly" do
      get "/system/tokens", params: { skin: "debug" }

      expect(response).to have_http_status(:ok)
      expect(response.body).to include('data-skin="debug"')
    end

    it "shares a nav prop" do
      get "/system/tokens"

      nav = inertia_page_data["props"]["nav"]
      expect(nav).to be_an(Array)
    end
  end

  # ---------------------------------------------------------------------------
  # GET /system/motion
  # ---------------------------------------------------------------------------
  describe "GET /system/motion" do
    it "returns 200 and renders the system/motion Inertia page" do
      get "/system/motion"

      expect(response).to have_http_status(:ok)
      expect(response.body).to include("data-page")
      expect(response.body).to include("system/motion")
    end

    it "shares a nav prop" do
      get "/system/motion"

      nav = inertia_page_data["props"]["nav"]
      expect(nav).to be_an(Array)
    end
  end

  # ---------------------------------------------------------------------------
  # GET /system/skins
  # ---------------------------------------------------------------------------
  describe "GET /system/skins" do
    it "returns 200 and renders the system/skins Inertia page" do
      get "/system/skins"

      expect(response).to have_http_status(:ok)
      expect(response.body).to include("data-page")
      expect(response.body).to include("system/skins")
    end

    it "shares a nav prop" do
      get "/system/skins"

      nav = inertia_page_data["props"]["nav"]
      expect(nav).to be_an(Array)
    end
  end

  # ---------------------------------------------------------------------------
  # GET /system/components/:slug
  # ---------------------------------------------------------------------------
  describe "GET /system/components/button" do
    before { get "/system/components/button" }

    it "returns 200" do
      expect(response).to have_http_status(:ok)
    end

    it "renders the system/components/show Inertia component" do
      expect(response.body).to include("data-page")
      expect(response.body).to include("system/components/show")
    end

    it "includes an entry prop containing the button manifest data" do
      entry = inertia_page_data["props"]["entry"]
      expect(entry["slug"]).to eq("button")
      expect(entry["name"]).to eq("Button")
      expect(entry["tier"]).to eq("hero")
    end

    it "entry has the full manifest schema keys" do
      entry = inertia_page_data["props"]["entry"]
      expect(entry.keys).to include("props", "tokens", "a11y", "usage", "example", "links")
    end

    it "shares a nav prop shaped as [{slug, name, tier}]" do
      nav = inertia_page_data["props"]["nav"]
      expect(nav).to be_an(Array)
      expect(nav).not_to be_empty
      nav.each do |item|
        expect(item.keys).to match_array(%w[slug name tier])
      end
    end
  end

  describe "GET /system/components/:slug with unknown slug" do
    it "returns 404" do
      get "/system/components/no-such-component"

      expect(response).to have_http_status(:not_found)
    end
  end

  # ---------------------------------------------------------------------------
  # Removed routes
  # ---------------------------------------------------------------------------
  describe "GET /system/gallery (removed route)" do
    it "is no longer routed (404 or routing error)" do
      # Rails may convert a RoutingError to a 404 inside middleware in test mode.
      get "/system/gallery"
      expect(response).to have_http_status(:not_found)
    rescue ActionController::RoutingError
      # Routing error propagating up is also acceptable — route was removed.
    end
  end
end
