# frozen_string_literal: true

class Demo::Chore < ApplicationRecord
  VALID_RECURRENCE_TYPES = %w[daily weekly monthly].freeze

  belongs_to :household,
             class_name:  "Demo::Household",
             foreign_key: :demo_household_id

  has_many :steps,
           -> { order(:position) },
           class_name:  "Demo::ChoreStep",
           foreign_key: :demo_chore_id,
           dependent:   :destroy

  has_many :chore_assignments,
           class_name:  "Demo::ChoreAssignment",
           foreign_key: :demo_chore_id,
           dependent:   :destroy

  has_many :children,
           through:    :chore_assignments,
           class_name: "Demo::Child",
           source:     :child

  validates :title, presence: true
  validates :points, numericality: { greater_than_or_equal_to: 0, only_integer: true }
  validates :recurrence_type,
            inclusion: { in: VALID_RECURRENCE_TYPES },
            allow_nil: true

  # Returns the recurrence hash for JSON serialisation, or nil for one-time
  # chores.  Shape matches the API contract: daily has only "type", weekly
  # adds "day_of_week" (0–6), monthly adds "day_of_month" (1–28).
  def recurrence
    return nil if recurrence_type.nil?

    result = { "type" => recurrence_type }
    result["day_of_week"]  = day_of_week  if recurrence_type == "weekly"
    result["day_of_month"] = day_of_month if recurrence_type == "monthly"
    result
  end
end
