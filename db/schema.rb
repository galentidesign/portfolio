# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_07_05_000005) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "demo_children", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "demo_household_id", null: false
    t.integer "hue", null: false
    t.string "name", null: false
    t.datetime "updated_at", null: false
    t.index ["demo_household_id"], name: "index_demo_children_on_demo_household_id"
  end

  create_table "demo_chore_assignments", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "demo_child_id", null: false
    t.bigint "demo_chore_id", null: false
    t.datetime "updated_at", null: false
    t.index ["demo_child_id"], name: "index_demo_chore_assignments_on_demo_child_id"
    t.index ["demo_chore_id", "demo_child_id"], name: "idx_on_demo_chore_id_demo_child_id_30c992cd87", unique: true
    t.index ["demo_chore_id"], name: "index_demo_chore_assignments_on_demo_chore_id"
  end

  create_table "demo_chore_steps", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "demo_chore_id", null: false
    t.integer "position", null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index ["demo_chore_id", "position"], name: "index_demo_chore_steps_on_demo_chore_id_and_position", unique: true
    t.index ["demo_chore_id"], name: "index_demo_chore_steps_on_demo_chore_id"
  end

  create_table "demo_chores", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.integer "day_of_month"
    t.integer "day_of_week"
    t.bigint "demo_household_id", null: false
    t.text "description"
    t.boolean "is_multi_step", default: false, null: false
    t.boolean "is_sharable", default: false, null: false
    t.integer "points", default: 0, null: false
    t.string "recurrence_type"
    t.boolean "requires_verification", default: false, null: false
    t.string "scheduled_time"
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index ["demo_household_id"], name: "index_demo_chores_on_demo_household_id"
  end

  create_table "demo_households", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.integer "hue", null: false
    t.string "name", null: false
    t.datetime "updated_at", null: false
  end

  add_foreign_key "demo_children", "demo_households"
  add_foreign_key "demo_chore_assignments", "demo_children"
  add_foreign_key "demo_chore_assignments", "demo_chores"
  add_foreign_key "demo_chore_steps", "demo_chores"
  add_foreign_key "demo_chores", "demo_households"
end
