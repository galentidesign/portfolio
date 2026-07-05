# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Pages", type: :request do
  describe "GET /" do
    it "renders the home Inertia page" do
      get root_path

      expect(response).to have_http_status(:ok)
      expect(response.body).to include("data-page")
      expect(response.body).to include("home/index")
    end

    it "does not expose the old greeting prop" do
      get root_path

      expect(response.body).not_to include("Hello, world")
    end
  end

  describe "GET /up" do
    it "reports healthy" do
      get rails_health_check_path
      expect(response).to have_http_status(:ok)
    end
  end
end
