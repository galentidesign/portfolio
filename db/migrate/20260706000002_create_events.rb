# frozen_string_literal: true

# §7 telemetry: append-only event stream. Correlation within one pageload
# happens via an in-memory UUID inside `payload` — no cookies, no client ids.
class CreateEvents < ActiveRecord::Migration[8.1]
  def change
    create_table :events do |t|
      t.references :visit, null: false, foreign_key: true
      t.string :kind, null: false
      t.jsonb :payload, null: false, default: {}
      t.datetime :created_at, null: false
    end

    add_index :events, [ :kind, :created_at ]
  end
end
