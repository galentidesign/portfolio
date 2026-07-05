# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Errors", type: :request do
  # Parse the Inertia page data JSON from an HTML response.
  # inertia_rails 3.x embeds the JSON as the text content of a
  # <script data-page="app" type="application/json"> element.
  def inertia_page_data
    match = response.body.match(/<script[^>]+data-page="app"[^>]*>(.*?)<\/script>/m)
    raise "No Inertia page data script found in response" unless match

    JSON.parse(match[1])
  end

  # ---------------------------------------------------------------------------
  # Catch-all 404 routes
  # ---------------------------------------------------------------------------
  describe "GET /this-route-does-not-exist" do
    it "returns 404" do
      get "/this-route-does-not-exist"

      expect(response).to have_http_status(:not_found)
    end

    it "renders the errors/not-found Inertia component" do
      get "/this-route-does-not-exist"

      expect(response.body).to include("data-page")
      expect(response.body).to include("errors/not-found")
    end
  end

  describe "GET /work/nope (nested unmatched path)" do
    it "returns 404 via the catch-all" do
      get "/work/nope"

      expect(response).to have_http_status(:not_found)
    end

    it "renders the errors/not-found Inertia component" do
      get "/work/nope"

      expect(response.body).to include("errors/not-found")
    end
  end

  # ---------------------------------------------------------------------------
  # SystemController rescue for unknown slugs
  # ---------------------------------------------------------------------------
  describe "GET /system/components/not-a-component" do
    it "returns 404" do
      get "/system/components/not-a-component"

      expect(response).to have_http_status(:not_found)
    end

    it "renders the errors/not-found Inertia component" do
      get "/system/components/not-a-component"

      expect(response.body).to include("errors/not-found")
    end
  end

  # ---------------------------------------------------------------------------
  # Health check is not swallowed by catch-all
  # ---------------------------------------------------------------------------
  describe "GET /up" do
    it "returns 200 (health check not caught by catch-all)" do
      get "/up"

      expect(response).to have_http_status(:ok)
    end
  end
end
