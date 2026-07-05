# frozen_string_literal: true

require "rails_helper"

RSpec.describe "System", type: :request do
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
  end
end
