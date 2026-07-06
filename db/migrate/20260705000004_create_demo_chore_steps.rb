# frozen_string_literal: true

class CreateDemoChoreSteps < ActiveRecord::Migration[8.1]
  def change
    create_table :demo_chore_steps do |t|
      t.references :demo_chore, null: false, foreign_key: true

      t.string  :title,    null: false
      t.integer :position, null: false

      t.timestamps
    end

    add_index :demo_chore_steps, [ :demo_chore_id, :position ], unique: true
  end
end
