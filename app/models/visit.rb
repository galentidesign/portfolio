# frozen_string_literal: true

# An anonymous daily visit grouping (§7). `day_key` is a salted daily hash of
# IP+UA computed in TelemetryController — the raw IP never reaches the model
# layer, so it can never be persisted by accident.
class Visit < ApplicationRecord
  UA_CLASSES = %w[desktop mobile bot unknown].freeze

  has_many :events, dependent: :delete_all

  validates :day_key, presence: true, uniqueness: true
  validates :entry_path, presence: true
  validates :ua_class, inclusion: { in: UA_CLASSES }
end
