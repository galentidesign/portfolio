# frozen_string_literal: true

class CreateDemoChores < ActiveRecord::Migration[8.1]
  def change
    create_table :demo_chores do |t|
      t.references :demo_household, null: false, foreign_key: true

      t.string  :title,       null: false
      t.text    :description

      t.integer :points, null: false, default: 0

      # Flat recurrence columns — nil recurrence_type means one-time.
      # day_of_week (0–6) is set only when recurrence_type is "weekly".
      # day_of_month (1–28) is set only when recurrence_type is "monthly".
      t.string  :recurrence_type
      t.integer :day_of_week
      t.integer :day_of_month

      # Optional wall-clock start time stored as "HH:MM".
      t.string  :scheduled_time

      t.boolean :requires_verification, null: false, default: false
      t.boolean :is_sharable,           null: false, default: false
      t.boolean :is_multi_step,         null: false, default: false

      t.timestamps
    end
  end
end
