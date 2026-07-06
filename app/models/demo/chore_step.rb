# frozen_string_literal: true

class Demo::ChoreStep < ApplicationRecord
  belongs_to :chore,
             class_name:  "Demo::Chore",
             foreign_key: :demo_chore_id

  validates :title,    presence: true
  validates :position, presence: true,
                       numericality: { only_integer: true, greater_than: 0 }
end
