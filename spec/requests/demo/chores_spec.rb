# frozen_string_literal: true

require "rails_helper"

# ---------------------------------------------------------------------------
# Unit tests for the latency clamp helper — no HTTP round-trip needed.
# ---------------------------------------------------------------------------
RSpec.describe Demo::ChoresController do
  describe ".clamp_latency" do
    subject(:clamp) { described_class.method(:clamp_latency) }

    it "returns the default (450) when param is nil" do
      expect(clamp.call(nil)).to eq(450)
    end

    it "returns the default (450) when param is blank" do
      expect(clamp.call("")).to eq(450)
    end

    it "clamps negative values to 0" do
      expect(clamp.call("-1")).to eq(0)
      expect(clamp.call("-9999")).to eq(0)
    end

    it "clamps values above 2000 to 2000" do
      expect(clamp.call("2001")).to eq(2000)
      expect(clamp.call("99999")).to eq(2000)
    end

    it "passes valid boundary values through unchanged" do
      expect(clamp.call("0")).to eq(0)
      expect(clamp.call("1000")).to eq(1000)
      expect(clamp.call("2000")).to eq(2000)
    end
  end
end

# ---------------------------------------------------------------------------
# Request specs
# ---------------------------------------------------------------------------
RSpec.describe "Demo::Chores API", type: :request do
  # Seed deterministic fixture data before each example.  Transactional
  # fixtures roll everything back so each example starts clean.
  before { Rails.application.load_seed }

  # latency=0 is passed everywhere to keep the suite fast; clamping is
  # covered by the unit tests above rather than by timing actual sleeps.

  # -------------------------------------------------------------------------
  # GET /demo/api/chores  (index)
  # -------------------------------------------------------------------------
  describe "GET /demo/api/chores" do
    # -- success (default) ---------------------------------------------------
    describe "state=success (default)" do
      subject(:body) do
        get "/demo/api/chores", params: { latency: 0 }
        JSON.parse(response.body)
      end

      it "returns 200" do
        get "/demo/api/chores", params: { state: "success", latency: 0 }
        expect(response).to have_http_status(:ok)
      end

      it "top-level keys are state, chores, households" do
        expect(body.keys).to match_array(%w[state chores households])
      end

      it "state is 'success'" do
        expect(body["state"]).to eq("success")
      end

      it "chores array has 9 items" do
        expect(body["chores"]).to be_an(Array).and(have_attributes(length: 9))
      end

      it "households array has 2 items" do
        expect(body["households"]).to be_an(Array).and(have_attributes(length: 2))
      end

      it "each chore has the full contract shape" do
        chore = body["chores"].first
        expect(chore.keys).to match_array(%w[
          id title description points recurrence scheduled_time
          requires_verification is_sharable is_multi_step steps assignees household
        ])
      end

      it "chore household embed has only id and name" do
        hh = body["chores"].first["household"]
        expect(hh.keys).to match_array(%w[id name])
      end

      it "each top-level household has id, name, hue, children" do
        expect(body["households"].first.keys).to match_array(%w[id name hue children])
      end

      it "each household child has id, name, hue" do
        child = body["households"].first["children"].first
        expect(child.keys).to match_array(%w[id name hue])
      end

      it "chores are ordered by id ascending" do
        ids = body["chores"].map { |c| c["id"] }
        expect(ids).to eq(ids.sort)
      end

      it "steps within a chore are ordered by position ascending" do
        chore_with_steps = body["chores"].find { |c| c["steps"].any? }
        positions = chore_with_steps["steps"].map { |s| s["position"] }
        expect(positions).to eq(positions.sort)
      end

      it "recurrence is null for one-time chores" do
        one_time = body["chores"].find { |c| c["recurrence"].nil? }
        expect(one_time).not_to be_nil
      end

      it "weekly recurrence includes day_of_week and no day_of_month" do
        weekly = body["chores"].find { |c| c.dig("recurrence", "type") == "weekly" }
        expect(weekly["recurrence"]).to include("day_of_week")
        expect(weekly["recurrence"]).not_to have_key("day_of_month")
      end

      it "monthly recurrence includes day_of_month and no day_of_week" do
        monthly = body["chores"].find { |c| c.dig("recurrence", "type") == "monthly" }
        expect(monthly["recurrence"]).to include("day_of_month")
        expect(monthly["recurrence"]).not_to have_key("day_of_week")
      end

      it "at least one chore is unassigned (empty assignees)" do
        unassigned = body["chores"].find { |c| c["assignees"].empty? }
        expect(unassigned).not_to be_nil
      end

      it "at least one chore has a non-nil description" do
        with_desc = body["chores"].find { |c| !c["description"].nil? }
        expect(with_desc).not_to be_nil
      end
    end

    # -- empty ---------------------------------------------------------------
    describe "state=empty" do
      before { get "/demo/api/chores", params: { state: "empty", latency: 0 } }

      it "returns 200" do
        expect(response).to have_http_status(:ok)
      end

      it "returns state=empty with empty chores and populated households" do
        body = JSON.parse(response.body)
        expect(body["state"]).to eq("empty")
        expect(body["chores"]).to eq([])
        expect(body["households"]).to be_an(Array).and(be_present)
      end
    end

    # -- loading -------------------------------------------------------------
    describe "state=loading" do
      before { get "/demo/api/chores", params: { state: "loading", latency: 0 } }

      it "returns 200" do
        expect(response).to have_http_status(:ok)
      end

      it "returns state=loading with empty chores and no households key" do
        body = JSON.parse(response.body)
        expect(body["state"]).to eq("loading")
        expect(body["chores"]).to eq([])
        expect(body).not_to have_key("households")
      end
    end

    # -- error ---------------------------------------------------------------
    describe "state=error" do
      before { get "/demo/api/chores", params: { state: "error", latency: 0 } }

      it "returns 500" do
        expect(response).to have_http_status(:internal_server_error)
      end

      it "returns the simulated failure error body" do
        body = JSON.parse(response.body)
        expect(body["state"]).to eq("error")
        expect(body["error"]["code"]).to eq("demo_simulated_failure")
        expect(body["error"]["message"]).to be_a(String).and(be_present)
      end
    end

    # -- unknown state falls back to success ---------------------------------
    describe "unrecognised state" do
      it "treats the unknown value as success" do
        get "/demo/api/chores", params: { state: "banana", latency: 0 }
        body = JSON.parse(response.body)
        expect(response).to have_http_status(:ok)
        expect(body["state"]).to eq("success")
      end
    end

    # -- payload determinism -------------------------------------------------
    describe "payload determinism" do
      it "returns identical JSON bodies on consecutive requests" do
        get "/demo/api/chores", params: { state: "success", latency: 0 }
        body1 = response.body
        get "/demo/api/chores", params: { state: "success", latency: 0 }
        body2 = response.body
        expect(body1).to eq(body2)
      end
    end
  end

  # -------------------------------------------------------------------------
  # GET /demo/api/chores/:id  (show)
  # -------------------------------------------------------------------------
  describe "GET /demo/api/chores/:id" do
    # -- known id ------------------------------------------------------------
    describe "with a known id (chore 3 — multi-step, multi-assignee)" do
      before { get "/demo/api/chores/3", params: { latency: 0 } }

      it "returns 200" do
        expect(response).to have_http_status(:ok)
      end

      it "wraps the chore under a 'chore' key" do
        body = JSON.parse(response.body)
        expect(body.keys).to eq([ "chore" ])
      end

      it "returns the full contract shape" do
        chore = JSON.parse(response.body)["chore"]
        expect(chore.keys).to match_array(%w[
          id title description points recurrence scheduled_time
          requires_verification is_sharable is_multi_step steps assignees household
        ])
      end

      it "returns the correct chore id" do
        chore = JSON.parse(response.body)["chore"]
        expect(chore["id"]).to eq(3)
      end

      it "includes steps with id, title, position" do
        steps = JSON.parse(response.body)["chore"]["steps"]
        expect(steps).not_to be_empty
        expect(steps.first.keys).to match_array(%w[id title position])
      end

      it "includes assignees with id, name, hue" do
        assignees = JSON.parse(response.body)["chore"]["assignees"]
        expect(assignees).not_to be_empty
        expect(assignees.first.keys).to match_array(%w[id name hue])
      end
    end

    # -- unknown id ----------------------------------------------------------
    describe "with an unknown id" do
      before { get "/demo/api/chores/9999", params: { latency: 0 } }

      it "returns 404" do
        expect(response).to have_http_status(:not_found)
      end

      it "returns an error body with state=error" do
        body = JSON.parse(response.body)
        expect(body["state"]).to eq("error")
        expect(body["error"]["code"]).to be_a(String).and(be_present)
        expect(body["error"]["message"]).to be_a(String).and(be_present)
      end
    end
  end

  # -------------------------------------------------------------------------
  # Seeds idempotency
  # -------------------------------------------------------------------------
  describe "seeds idempotency" do
    it "yields identical record counts when load_seed is called twice" do
      # before block already ran once; call again within the same test tx.
      Rails.application.load_seed

      expect(Demo::Household.count).to eq(2)
      expect(Demo::Child.count).to eq(5)
      expect(Demo::Chore.count).to eq(9)
      expect(Demo::ChoreStep.count).to eq(5)
      expect(Demo::ChoreAssignment.count).to eq(11)
    end
  end
end
