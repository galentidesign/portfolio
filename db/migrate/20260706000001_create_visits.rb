# frozen_string_literal: true

# §7 telemetry: one row per (salted daily hash of IP+UA). The raw IP and UA
# are hashed at the edge and never stored — a visit is an anonymous daily
# grouping key, not an identity.
class CreateVisits < ActiveRecord::Migration[8.1]
  def change
    create_table :visits do |t|
      t.string :day_key, null: false
      t.string :first_referrer
      t.string :utm_source
      t.string :utm_medium
      t.string :utm_campaign
      t.string :entry_path, null: false
      t.string :ua_class, null: false, default: "unknown"
      t.datetime :created_at, null: false
    end

    add_index :visits, :day_key, unique: true
    add_index :visits, :created_at
  end
end
