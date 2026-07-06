# frozen_string_literal: true

# Study B demo seeds — deterministic, idempotent, fictional.
#
# Fixed explicit ids keep JSON payloads byte-stable across reseeds.
# pk sequences are reset after explicit-id inserts so subsequent auto-id
# records do not conflict.
#
# Seed texture:
#   2 households · 5 children · 9 chores
#   Coverage: one-time / daily / weekly / monthly; ≥2 multi-step with ordered
#   steps; ≥2 sharable with multiple assignees; ≥3 requiring verification;
#   ≥1 with description; ≥1 unassigned.

ActiveRecord::Base.transaction do
  # -------------------------------------------------------------------------
  # Households
  # -------------------------------------------------------------------------
  Demo::Household.upsert_all(
    [
      { id: 1, name: "Alder Row",  hue: 200 },
      { id: 2, name: "Cedar Lane", hue: 145 }
    ],
    unique_by: :id
  )

  # -------------------------------------------------------------------------
  # Children
  # -------------------------------------------------------------------------
  Demo::Child.upsert_all(
    [
      { id: 1, demo_household_id: 1, name: "Wren", hue:  45 },
      { id: 2, demo_household_id: 1, name: "Finn", hue: 160 },
      { id: 3, demo_household_id: 2, name: "Sage", hue: 300 },
      { id: 4, demo_household_id: 2, name: "Remy", hue:  30 },
      { id: 5, demo_household_id: 2, name: "Bex",  hue:  80 }
    ],
    unique_by: :id
  )

  # -------------------------------------------------------------------------
  # Chores
  # -------------------------------------------------------------------------
  Demo::Chore.upsert_all(
    [
      # 1 — one-time, has description, requires verification
      {
        id: 1, demo_household_id: 1,
        title: "Tidy the living room",
        description: "Put cushions back, straighten the rug, and collect any cups.",
        points: 15, recurrence_type: nil, day_of_week: nil, day_of_month: nil,
        scheduled_time: "09:00",
        requires_verification: true, is_sharable: false, is_multi_step: false
      },
      # 2 — daily, requires verification
      {
        id: 2, demo_household_id: 1,
        title: "Feed the cat",
        description: nil,
        points: 5, recurrence_type: "daily", day_of_week: nil, day_of_month: nil,
        scheduled_time: "07:30",
        requires_verification: true, is_sharable: false, is_multi_step: false
      },
      # 3 — weekly (Saturday), multi-step, sharable
      {
        id: 3, demo_household_id: 2,
        title: "Water the balcony plants",
        description: nil,
        points: 10, recurrence_type: "weekly", day_of_week: 6, day_of_month: nil,
        scheduled_time: "16:30",
        requires_verification: false, is_sharable: true, is_multi_step: true
      },
      # 4 — daily, multi-step, sharable
      {
        id: 4, demo_household_id: 1,
        title: "Wash the dishes",
        description: nil,
        points: 20, recurrence_type: "daily", day_of_week: nil, day_of_month: nil,
        scheduled_time: "19:00",
        requires_verification: false, is_sharable: true, is_multi_step: true
      },
      # 5 — weekly (Monday), sharable, requires verification
      {
        id: 5, demo_household_id: 2,
        title: "Take out the recycling",
        description: nil,
        points: 10, recurrence_type: "weekly", day_of_week: 0, day_of_month: nil,
        scheduled_time: "08:00",
        requires_verification: true, is_sharable: true, is_multi_step: false
      },
      # 6 — monthly (1st), requires verification
      {
        id: 6, demo_household_id: 1,
        title: "Clean the bathroom",
        description: nil,
        points: 30, recurrence_type: "monthly", day_of_week: nil, day_of_month: 1,
        scheduled_time: "10:00",
        requires_verification: true, is_sharable: false, is_multi_step: false
      },
      # 7 — weekly (Friday)
      {
        id: 7, demo_household_id: 2,
        title: "Vacuum the hallway",
        description: nil,
        points: 15, recurrence_type: "weekly", day_of_week: 5, day_of_month: nil,
        scheduled_time: "14:00",
        requires_verification: false, is_sharable: false, is_multi_step: false
      },
      # 8 — daily
      {
        id: 8, demo_household_id: 1,
        title: "Set the dinner table",
        description: nil,
        points: 5, recurrence_type: "daily", day_of_week: nil, day_of_month: nil,
        scheduled_time: "17:30",
        requires_verification: false, is_sharable: false, is_multi_step: false
      },
      # 9 — one-time, unassigned, no scheduled_time
      {
        id: 9, demo_household_id: 2,
        title: "Sort the post",
        description: nil,
        points: 5, recurrence_type: nil, day_of_week: nil, day_of_month: nil,
        scheduled_time: nil,
        requires_verification: false, is_sharable: false, is_multi_step: false
      }
    ],
    unique_by: :id
  )

  # -------------------------------------------------------------------------
  # Chore steps (ordered by position within each chore)
  # -------------------------------------------------------------------------
  Demo::ChoreStep.upsert_all(
    [
      # Chore 3: Water the balcony plants (2 steps)
      { id: 1, demo_chore_id: 3, title: "Fill the watering can",     position: 1 },
      { id: 2, demo_chore_id: 3, title: "Water each pot evenly",     position: 2 },
      # Chore 4: Wash the dishes (3 steps)
      { id: 3, demo_chore_id: 4, title: "Rinse plates under the tap", position: 1 },
      { id: 4, demo_chore_id: 4, title: "Scrub and stack",            position: 2 },
      { id: 5, demo_chore_id: 4, title: "Dry and put away",           position: 3 }
    ],
    unique_by: :id
  )

  # -------------------------------------------------------------------------
  # Chore assignments
  # Unique index on [demo_chore_id, demo_child_id] ensures idempotency.
  # -------------------------------------------------------------------------
  Demo::ChoreAssignment.insert_all(
    [
      { demo_chore_id: 1, demo_child_id: 1 }, # Tidy the living room → Wren
      { demo_chore_id: 2, demo_child_id: 2 }, # Feed the cat         → Finn
      { demo_chore_id: 3, demo_child_id: 3 }, # Water the plants     → Sage
      { demo_chore_id: 3, demo_child_id: 4 }, # Water the plants     → Remy
      { demo_chore_id: 4, demo_child_id: 1 }, # Wash the dishes      → Wren
      { demo_chore_id: 4, demo_child_id: 2 }, # Wash the dishes      → Finn
      { demo_chore_id: 5, demo_child_id: 3 }, # Take out recycling   → Sage
      { demo_chore_id: 5, demo_child_id: 5 }, # Take out recycling   → Bex
      { demo_chore_id: 6, demo_child_id: 1 }, # Clean the bathroom   → Wren
      { demo_chore_id: 7, demo_child_id: 4 }, # Vacuum the hallway   → Remy
      { demo_chore_id: 8, demo_child_id: 2 }  # Set the dinner table → Finn
      # Chore 9 (Sort the post) intentionally unassigned
    ],
    unique_by: [ :demo_chore_id, :demo_child_id ]
  )

  # -------------------------------------------------------------------------
  # Reset pk sequences so auto-assigned ids do not clash with explicit ones.
  # -------------------------------------------------------------------------
  %w[
    demo_households
    demo_children
    demo_chores
    demo_chore_steps
    demo_chore_assignments
  ].each do |table|
    ActiveRecord::Base.connection.reset_pk_sequence!(table)
  end
end
