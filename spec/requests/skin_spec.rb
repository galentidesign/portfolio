# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Skin resolution", type: :request do
  describe "GET /" do
    it "sets data-skin to the default skin server-side" do
      get root_path

      expect(response).to have_http_status(:ok)
      expect(response.body).to include('data-skin="galenti"')
    end
  end

  describe "GET /?skin=debug" do
    it "sets data-skin to the requested skin server-side" do
      get root_path, params: { skin: "debug" }

      expect(response).to have_http_status(:ok)
      expect(response.body).to include('data-skin="debug"')
    end
  end

  describe "GET /?skin=nonexistent" do
    it "falls back to the default skin" do
      get root_path, params: { skin: "nonexistent" }

      expect(response).to have_http_status(:ok)
      expect(response.body).to include('data-skin="galenti"')
    end
  end

  describe "pre-paint script" do
    it "is present and references the skin storage key" do
      get root_path

      expect(response.body).to include("portfolio:skin")
    end

    it "is present and references the motion storage key" do
      get root_path

      expect(response.body).to include("portfolio:motion")
    end
  end

  describe "charset meta tag" do
    it "is included in the response" do
      get root_path

      expect(response.body).to include("<meta charset")
    end
  end
end
