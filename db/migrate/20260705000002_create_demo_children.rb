# frozen_string_literal: true

class CreateDemoChildren < ActiveRecord::Migration[8.1]
  def change
    create_table :demo_children do |t|
      t.references :demo_household, null: false, foreign_key: true
      t.string  :name, null: false
      t.integer :hue,  null: false

      t.timestamps
    end
  end
end
