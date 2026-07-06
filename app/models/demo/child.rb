# frozen_string_literal: true

class Demo::Child < ApplicationRecord
  belongs_to :household,
             class_name:  "Demo::Household",
             foreign_key: :demo_household_id

  has_many :chore_assignments,
           class_name:  "Demo::ChoreAssignment",
           foreign_key: :demo_child_id,
           dependent:   :destroy

  has_many :chores,
           through:    :chore_assignments,
           class_name: "Demo::Chore",
           source:     :chore

  validates :name, presence: true
  validates :hue,  presence: true
end
