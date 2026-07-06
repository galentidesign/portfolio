# frozen_string_literal: true

class Demo::ChoresController < ApplicationController
  # Bounded server-thread hold for the loading state: capped at 1 200 ms in
  # production so a stuck client cannot hold a puma thread indefinitely;
  # reduced to 25 ms in test so the suite remains fast.
  LOADING_HOLD_MS = Rails.env.test? ? 25 : 1200

  VALID_STATES    = %w[success loading empty error].freeze
  DEFAULT_LATENCY = 450
  LATENCY_RANGE   = 0..2000

  before_action :set_latency

  # GET /demo/api/chores
  def index
    state = resolve_state(params[:state])

    if state == "loading"
      sleep(LOADING_HOLD_MS / 1000.0)
      render json: { state: "loading", chores: [] }
      return
    end

    sleep(@latency / 1000.0)

    case state
    when "error"
      render json: error_body("demo_simulated_failure", "Simulated upstream failure."),
             status: :internal_server_error
    when "empty"
      render json: { state: "empty", chores: [], households: all_households_json }
    else
      render json: { state: "success", chores: all_chores_json, households: all_households_json }
    end
  end

  # GET /demo/api/chores/:id
  def show
    sleep(@latency / 1000.0)

    chore = Demo::Chore
              .includes(:household, :steps, :children)
              .find_by(id: params[:id])

    if chore.nil?
      render json: error_body("not_found", "Chore not found."), status: :not_found
      return
    end

    render json: { chore: chore_json(chore) }
  end

  # Exposed as a class method so specs can unit-test clamp behaviour without
  # timing actual sleeps.
  def self.clamp_latency(ms_param)
    return DEFAULT_LATENCY if ms_param.blank?

    ms_param.to_i.clamp(LATENCY_RANGE)
  end

  private

  def set_latency
    @latency = self.class.clamp_latency(params[:latency])
  end

  def resolve_state(raw)
    VALID_STATES.include?(raw) ? raw : "success"
  end

  # ---------------------------------------------------------------------------
  # Serialisers — explicit key ordering and sort clauses for byte-stable output
  # ---------------------------------------------------------------------------

  def all_chores_json
    Demo::Chore
      .includes(:household, :steps, :children)
      .order(:id)
      .map { |c| chore_json(c) }
  end

  def all_households_json
    Demo::Household
      .includes(:children)
      .order(:id)
      .map { |h| household_json(h) }
  end

  def chore_json(chore)
    {
      id:                    chore.id,
      title:                 chore.title,
      description:           chore.description,
      points:                chore.points,
      recurrence:            chore.recurrence,
      scheduled_time:        chore.scheduled_time,
      requires_verification: chore.requires_verification,
      is_sharable:           chore.is_sharable,
      is_multi_step:         chore.is_multi_step,
      steps:                 chore.steps.map { |s| step_json(s) },
      assignees:             chore.children.sort_by(&:id).map { |c| child_json(c) },
      household:             { id: chore.household.id, name: chore.household.name }
    }
  end

  def step_json(step)
    { id: step.id, title: step.title, position: step.position }
  end

  def child_json(child)
    { id: child.id, name: child.name, hue: child.hue }
  end

  def household_json(household)
    {
      id:       household.id,
      name:     household.name,
      hue:      household.hue,
      children: household.children.sort_by(&:id).map { |c| child_json(c) }
    }
  end

  def error_body(code, message)
    { state: "error", error: { code: code, message: message } }
  end
end
