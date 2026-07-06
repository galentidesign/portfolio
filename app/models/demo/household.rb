# frozen_string_literal: true

class Demo::Household < ApplicationRecord
  has_many :children,
           class_name:  "Demo::Child",
           foreign_key: :demo_household_id,
           dependent:   :destroy

  has_many :chores,
           class_name:  "Demo::Chore",
           foreign_key: :demo_household_id,
           dependent:   :destroy

  validates :name, presence: true
  validates :hue,  presence: true
end
