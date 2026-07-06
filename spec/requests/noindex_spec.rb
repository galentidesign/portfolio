# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Off-canonical noindex guard", type: :request do
  it "sets X-Robots-Tag: noindex when the host is not the canonical domain" do
    get "/work"

    expect(response).to have_http_status(:ok)
    # Spec requests use www.example.com, which is not jgalenti.com.
    expect(response.headers["X-Robots-Tag"]).to eq("noindex")
  end

  it "serves indexable pages when CANONICAL_HOST matches the request host" do
    # CANONICAL_HOST is read at boot; override the frozen constant the same
    # way the env override would have set it (rack-test hosts are
    # www.example.com).
    stub_const("ApplicationController::CANONICAL_HOST", "www.example.com")

    get "/work"

    expect(response).to have_http_status(:ok)
    expect(response.headers["X-Robots-Tag"]).to be_nil
  end

  it "keeps subdomains of the canonical host indexable" do
    stub_const("ApplicationController::CANONICAL_HOST", "example.com")

    get "/work"

    expect(response.headers["X-Robots-Tag"]).to be_nil
  end
end
