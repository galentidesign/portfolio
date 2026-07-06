# frozen_string_literal: true

class Demo::ChoreAssignment < ApplicationRecord
  belongs_to :chore,
             class_name:  "Demo::Chore",
             foreign_key: :demo_chore_id

  belongs_to :child,
             class_name:  "Demo::Child",
             foreign_key: :demo_child_id
end
