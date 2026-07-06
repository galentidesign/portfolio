# The cookieless contract (telemetry README §7, /colophon privacy claim):
# no response from this app may carry Set-Cookie — not the telemetry sink,
# not Inertia HTML pages, not error paths.
#
# Regression context (caught on the wire at M10 launch): with Rails' default
# forgery protection enabled, inertia_rails sets an XSRF-TOKEN cookie on
# every response (`cookies['XSRF-TOKEN'] = form_authenticity_token if
# protect_against_forgery?`) and generating the token writes the session,
# which adds `_portfolio_session` — while the test environment disabled
# forgery protection, so request specs asserted a cookieless world that
# production didn't serve. Forgery protection is now off in ALL environments
# (config/application.rb) — safe only while no endpoint authenticates with
# cookies. This spec pins both the config and the wire behavior.
require "rails_helper"

RSpec.describe "Cookieless contract", type: :request do
  it "keeps forgery protection off app-wide, so no environment grows CSRF cookies" do
    expect(ActionController::Base.allow_forgery_protection).to be(false)
    expect(Rails.application.config.action_controller.allow_forgery_protection).to be(false)
  end

  {
    "story landing" => "/",
    "skim hub" => "/work",
    "study page" => "/work/shadcn-to-polaris",
    "DS docs" => "/system",
    "colophon (carries the privacy claim)" => "/colophon",
    "demo API" => "/demo/api/chores",
    "unknown route (404 page)" => "/definitely-not-a-route"
  }.each do |label, path|
    it "sets no cookie on #{label}" do
      get path
      expect(response.headers["Set-Cookie"]).to be_nil
    end
  end

  it "sets no cookie on the telemetry sink's 204" do
    post "/t",
      params: { kind: "page_view", path: "/" }.to_json,
      headers: { "CONTENT_TYPE" => "application/json" }
    expect(response).to have_http_status(:no_content)
    expect(response.headers["Set-Cookie"]).to be_nil
  end

  it "sets no cookie on /ops' 401 deny path" do
    get "/ops"
    expect(response).to have_http_status(:unauthorized)
    expect(response.headers["Set-Cookie"]).to be_nil
  end
end
