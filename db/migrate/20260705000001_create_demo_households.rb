# frozen_string_literal: true

class CreateDemoHouseholds < ActiveRecord::Migration[8.1]
  def change
    create_table :demo_households do |t|
      t.string  :name, null: false
      t.integer :hue,  null: false

      t.timestamps
    end
  end
end
