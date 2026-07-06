# frozen_string_literal: true

# One telemetry event (§7). Kinds are a fixed allowlist — unknown kinds are
# rejected at the controller so the stream stays queryable.
class Event < ApplicationRecord
  KINDS = %w[
    page_view
    scroll_depth
    mode_switch
    skin_switch
    palette_open
    palette_action
    demo_state
    resume_download
    story_complete
    skim_entry
  ].freeze

  belongs_to :visit

  validates :kind, inclusion: { in: KINDS }
end
