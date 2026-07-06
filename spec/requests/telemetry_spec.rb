# frozen_string_literal: true

require "rails_helper"

RSpec.describe "POST /t (telemetry sink)", type: :request do
  include ActiveSupport::Testing::TimeHelpers

  let(:json_headers) { { "Content-Type" => "application/json" } }

  # Minimal valid payload the beacon always sends (pageload_id + path merged).
  let(:base_payload)  { { "path" => "/", "pageload_id" => "test-uuid-1234" } }
  let(:valid_body)    { { kind: "page_view", payload: base_payload }.to_json }

  def post_t(kind:, payload: base_payload, headers: json_headers)
    post "/t", params: { kind:, payload: }.to_json, headers:
  end

  # ---------------------------------------------------------------------------
  # 1. Happy path — valid page_view
  # ---------------------------------------------------------------------------
  describe "valid page_view" do
    it "responds 204" do
      post_t(kind: "page_view")
      expect(response).to have_http_status(:no_content)
    end

    it "creates exactly one Visit and one Event" do
      expect {
        post_t(kind: "page_view")
      }.to change(Visit, :count).by(1).and change(Event, :count).by(1)
    end

    it "stores the full payload on the event (pageload_id + path merged)" do
      post_t(kind: "page_view", payload: base_payload.merge("referrer" => "https://github.com/"))
      event = Event.last
      expect(event.payload["path"]).to eq("/")
      expect(event.payload["pageload_id"]).to eq("test-uuid-1234")
      expect(event.payload["referrer"]).to eq("https://github.com/")
    end

    it "stores the entry_path on the visit" do
      post_t(kind: "page_view", payload: base_payload.merge("path" => "/work"))
      expect(Visit.last.entry_path).to eq("/work")
    end

    it "stores a 32-char hex day_key on the visit" do
      post_t(kind: "page_view")
      expect(Visit.last.day_key).to match(/\A[0-9a-f]{32}\z/)
    end

    it "response body is empty (no JSON body on 204)" do
      post_t(kind: "page_view")
      expect(response.body).to be_empty
    end
  end

  # ---------------------------------------------------------------------------
  # 2. Idempotency — same day_key on second POST
  # ---------------------------------------------------------------------------
  describe "same-day idempotency" do
    it "does not create a second Visit on a repeat POST" do
      post_t(kind: "page_view", payload: base_payload.merge("path" => "/"))
      expect {
        post_t(kind: "palette_open", payload: { "path" => "/work", "pageload_id" => "other-uuid" })
      }.not_to change(Visit, :count)
    end

    it "appends a second Event to the existing Visit" do
      post_t(kind: "page_view")
      expect {
        post_t(kind: "palette_open")
      }.to change(Event, :count).by(1)
      expect(Event.last.visit_id).to eq(Visit.last.id)
    end

    it "does not overwrite entry_path on a subsequent POST" do
      post_t(kind: "page_view", payload: base_payload.merge("path" => "/original"))
      post_t(kind: "page_view", payload: base_payload.merge("path" => "/later"))
      expect(Visit.last.entry_path).to eq("/original")
    end

    it "does not overwrite first_referrer on a subsequent POST" do
      post_t(kind: "page_view",
             payload: base_payload.merge("referrer" => "https://github.com/"))
      post_t(kind: "page_view",
             payload: base_payload.merge("referrer" => "https://other.com/"))
      expect(Visit.last.first_referrer).to eq("github.com/")
    end
  end

  # ---------------------------------------------------------------------------
  # 3. Unknown kind → 422
  # ---------------------------------------------------------------------------
  describe "unknown kind" do
    it "returns 422" do
      post_t(kind: "totally_unknown")
      expect(response).to have_http_status(:unprocessable_entity)
    end

    it "writes nothing to the DB" do
      expect {
        post_t(kind: "hack_attempt")
      }.not_to change(Visit, :count)
      expect(Event.count).to eq(0)
    end
  end

  # ---------------------------------------------------------------------------
  # 4. Malformed JSON body → 422
  # ---------------------------------------------------------------------------
  describe "malformed JSON body" do
    it "returns 422" do
      post "/t", params: '{"unclosed":', headers: json_headers
      expect(response).to have_http_status(:unprocessable_entity)
    end

    it "writes nothing to the DB" do
      expect {
        post "/t", params: "{broken json!!!", headers: json_headers
      }.not_to change(Visit, :count)
    end
  end

  # ---------------------------------------------------------------------------
  # 5. Oversized payload → 422
  # ---------------------------------------------------------------------------
  describe "oversized payload (> 4 KB)" do
    it "returns 422" do
      huge = base_payload.merge("junk" => "x" * 5_000)
      post_t(kind: "page_view", payload: huge)
      expect(response).to have_http_status(:unprocessable_entity)
    end

    it "writes nothing to the DB" do
      huge = base_payload.merge("junk" => "x" * 5_000)
      expect {
        post_t(kind: "page_view", payload: huge)
      }.not_to change(Visit, :count)
    end
  end

  # ---------------------------------------------------------------------------
  # 6. Day rotation — different date → new Visit
  # ---------------------------------------------------------------------------
  describe "day rotation" do
    it "creates a second Visit when the date advances" do
      post_t(kind: "page_view")
      expect(Visit.count).to eq(1)

      travel_to Time.current + 1.day do
        post_t(kind: "page_view")
      end

      expect(Visit.count).to eq(2)
    end

    it "new day produces a different day_key" do
      post_t(kind: "page_view")
      first_key = Visit.last.day_key

      travel_to Time.current + 1.day do
        post_t(kind: "page_view")
      end

      expect(Visit.order(:created_at).last.day_key).not_to eq(first_key)
    end
  end

  # ---------------------------------------------------------------------------
  # 7. UA classification
  # ---------------------------------------------------------------------------
  describe "ua_class assignment" do
    it "classifies a Googlebot UA as 'bot'" do
      post_t(kind: "page_view",
             headers: json_headers.merge(
               "User-Agent" => "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
             ))
      expect(Visit.last.ua_class).to eq("bot")
    end

    it "classifies an iPhone UA as 'mobile'" do
      post_t(kind: "page_view",
             headers: json_headers.merge(
               "User-Agent" => "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15"
             ))
      expect(Visit.last.ua_class).to eq("mobile")
    end

    it "classifies a desktop Chrome UA as 'desktop'" do
      post_t(kind: "page_view",
             headers: json_headers.merge(
               "User-Agent" => "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
             ))
      expect(Visit.last.ua_class).to eq("desktop")
    end

    it "classifies HeadlessChrome UA as 'bot'" do
      post_t(kind: "page_view",
             headers: json_headers.merge(
               "User-Agent" => "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/120.0.0.0 Safari/537.36"
             ))
      expect(Visit.last.ua_class).to eq("bot")
    end
  end

  # ---------------------------------------------------------------------------
  # 8. Privacy guarantees
  # ---------------------------------------------------------------------------
  describe "privacy guarantees" do
    let(:test_ua) { "PrivacyAuditAgent/9.9" }

    before do
      post_t(kind: "page_view",
             headers: json_headers.merge("User-Agent" => test_ua))
    end

    it "response carries no Set-Cookie header" do
      expect(response.headers["Set-Cookie"]).to be_nil
    end

    it "visit row does not contain the raw request IP" do
      visit = Visit.last
      # In the test environment, remote_ip is "127.0.0.1".
      raw_ip = "127.0.0.1"
      [ visit.day_key, visit.entry_path, visit.first_referrer,
        visit.utm_source, visit.utm_medium, visit.utm_campaign ].compact.each do |val|
        expect(val).not_to include(raw_ip)
      end
    end

    it "visit row does not contain the raw user agent string" do
      visit = Visit.last
      [ visit.day_key, visit.entry_path, visit.first_referrer,
        visit.utm_source, visit.utm_medium, visit.utm_campaign ].compact.each do |val|
        expect(val).not_to include(test_ua)
      end
      # ua_class stores only the coarse class, not the raw string
      expect(visit.ua_class).to eq("desktop")
    end
  end

  # ---------------------------------------------------------------------------
  # 9. Referrer handling
  # ---------------------------------------------------------------------------
  describe "referrer handling" do
    it "stores an external referrer as host+path" do
      post_t(kind: "page_view",
             payload: base_payload.merge("referrer" => "https://github.com/jsci/portfolio"))
      expect(Visit.last.first_referrer).to eq("github.com/jsci/portfolio")
    end

    it "strips query string from the stored referrer" do
      post_t(kind: "page_view",
             payload: base_payload.merge("referrer" => "https://duckduckgo.com/?q=portfolio"))
      expect(Visit.last.first_referrer).to eq("duckduckgo.com/")
    end

    it "does not store a same-host referrer" do
      # request.host in Rails integration tests defaults to "www.example.com"
      same_host_referrer = "http://www.example.com/previous-page"
      post_t(kind: "page_view",
             payload: base_payload.merge("referrer" => same_host_referrer))
      expect(Visit.last.first_referrer).to be_nil
    end

    it "does not store a garbage referrer but still returns 204" do
      post_t(kind: "page_view",
             payload: base_payload.merge("referrer" => "not a url at all"))
      expect(response).to have_http_status(:no_content)
      expect(Visit.last.first_referrer).to be_nil
    end

    it "does not store referrer when absent from payload" do
      post_t(kind: "page_view", payload: base_payload)
      expect(Visit.last.first_referrer).to be_nil
    end
  end

  # ---------------------------------------------------------------------------
  # 10. UTM params land on Visit create only
  # ---------------------------------------------------------------------------
  describe "UTM params" do
    let(:utm_payload) do
      base_payload.merge(
        "utm_source"   => "github",
        "utm_medium"   => "social",
        "utm_campaign" => "launch"
      )
    end

    it "stores utm_source / utm_medium / utm_campaign on first visit create" do
      post_t(kind: "page_view", payload: utm_payload)
      visit = Visit.last
      expect(visit.utm_source).to eq("github")
      expect(visit.utm_medium).to eq("social")
      expect(visit.utm_campaign).to eq("launch")
    end

    it "does not update UTM params on a subsequent POST" do
      post_t(kind: "page_view", payload: utm_payload)

      different_utms = base_payload.merge(
        "utm_source"   => "twitter",
        "utm_medium"   => "paid",
        "utm_campaign" => "retarget"
      )
      post_t(kind: "page_view", payload: different_utms)

      expect(Visit.count).to eq(1)
      expect(Visit.last.utm_source).to eq("github")
    end

    it "stores nil UTM fields when absent from payload" do
      post_t(kind: "page_view", payload: base_payload)
      visit = Visit.last
      expect(visit.utm_source).to be_nil
      expect(visit.utm_medium).to be_nil
      expect(visit.utm_campaign).to be_nil
    end
  end
end
