# frozen_string_literal: true

class CreateDemoChoreAssignments < ActiveRecord::Migration[8.1]
  def change
    create_table :demo_chore_assignments do |t|
      t.references :demo_chore, null: false, foreign_key: true
      t.references :demo_child, null: false, foreign_key: true

      t.timestamps
    end

    add_index :demo_chore_assignments, [ :demo_chore_id, :demo_child_id ], unique: true
  end
end
