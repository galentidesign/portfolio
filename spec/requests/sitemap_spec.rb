# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Sitemap", type: :request do
  before { Manifest.reload! }
  after  { Manifest.reload! }

  describe "GET /sitemap.xml" do
    before { get "/sitemap.xml" }

    it "returns 200" do
      expect(response).to have_http_status(:ok)
    end

    it "responds with XML content type" do
      expect(response.content_type).to include("application/xml")
    end

    it "includes the work URL with the canonical host" do
      expect(response.body).to include("https://jgalenti.com/work")
    end

    it "includes a system component URL for the button slug" do
      expect(response.body).to include("https://jgalenti.com/system/components/button")
    end

    it "includes the resume URL with the canonical host" do
      expect(response.body).to include("https://jgalenti.com/resume")
    end

    it "excludes /ops" do
      expect(response.body).not_to include("/ops")
    end

    it "excludes /og/" do
      expect(response.body).not_to include("/og/")
    end
  end
end
