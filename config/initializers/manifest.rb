# frozen_string_literal: true

# Validate the DS component manifest at boot in production.
#
# Why only production?
#   - Development: Manifest re-reads every request, so invalid YAML surfaces the
#     first time a /system page loads — no restart needed, and the per-request
#     InvalidError is visible in the Rails error overlay.
#   - Test: specs exercise validation directly via Manifest.validate! and the
#     model spec's invalid-fixture cases.
#   - Production: fail fast at startup rather than at the first request so a
#     bad deploy is caught before any user sees a 500.
Rails.application.config.after_initialize do
  Manifest.validate! if Rails.env.production?
end
