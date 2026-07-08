# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Gallery", type: :request do
  # Runs against the real data/projects/ tree on purpose: /gallery is a pure
  # function of the checked-in YAML. Validation has fixture coverage in
  # spec/models/project_gallery_spec.rb.
  before { ProjectGallery.reload! }
  after  { ProjectGallery.reload! }

  def inertia_page_data
    match = response.body.match(/<script[^>]+data-page="app"[^>]*>(.*?)<\/script>/m)
    raise "No Inertia page data script found in response" unless match

    JSON.parse(match[1])
  end

  # ---------------------------------------------------------------------------
  # GET /gallery (index)
  # ---------------------------------------------------------------------------
  describe "GET /gallery" do
    before { get "/gallery" }

    it "returns 200" do
      expect(response).to have_http_status(:ok)
    end

    it "renders the gallery/index Inertia component" do
      expect(response.body).to include("data-page")
      expect(response.body).to include("gallery/index")
    end

    it "includes a projects prop as a nonempty array of card hashes" do
      projects = inertia_page_data["props"]["projects"]
      expect(projects).to be_an(Array)
      expect(projects).not_to be_empty
      projects.each do |card|
        expect(card.keys).to match_array(
          %w[slug title role client year featured disciplines summary cover]
        )
      end
    end
  end

  # ---------------------------------------------------------------------------
  # GET /gallery/:slug (detail)
  # ---------------------------------------------------------------------------
  describe "GET /gallery/qwinix-streaming" do
    before { get "/gallery/qwinix-streaming" }

    it "returns 200" do
      expect(response).to have_http_status(:ok)
    end

    it "renders the gallery/show Inertia component" do
      expect(response.body).to include("gallery/show")
    end

    it "includes the full project entry" do
      project = inertia_page_data["props"]["project"]
      expect(project["slug"]).to eq("qwinix-streaming")
      expect(project.keys).to include("overview", "highlights", "shots", "links")
    end

    it "resolves shot assets with an available flag" do
      shots = inertia_page_data["props"]["project"]["shots"]
      expect(shots).to be_an(Array)
      expect(shots.first.keys).to include("src", "available", "alt")
    end

    it "includes prev/next siblings" do
      siblings = inertia_page_data["props"]["siblings"]
      expect(siblings.keys).to match_array(%w[prev next])
    end
  end

  describe "GET /gallery/:slug with unknown slug" do
    it "returns 404" do
      get "/gallery/no-such-project"
      expect(response).to have_http_status(:not_found)
    end
  end
end
