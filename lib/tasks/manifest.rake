# frozen_string_literal: true

# manifest:verify — CI gate proving code and docs never drift.
#
# Deliberately has NO :environment dependency so the lint job can run it
# without a Postgres connection. Files are required explicitly.

namespace :manifest do
  desc "Verify no drift between meta.ts exports and data/manifest/*.yml"
  task :verify do
    require "json"
    require "shellwords"
    require "yaml"
    require "pathname"

    app_root = Pathname.new(__FILE__).dirname.parent.parent.expand_path

    require app_root.join("app/models/manifest_verifier").to_s

    # ── Step 1: Shape validation (Manifest model) ──────────────────────────
    # Guard: app/models/manifest.rb may not exist yet (parallel agent).
    manifest_rb = app_root.join("app/models/manifest.rb")
    if manifest_rb.exist?
      require manifest_rb.to_s
      begin
        Manifest.validate!
      rescue => e
        $stderr.puts "manifest:verify — shape errors:"
        $stderr.puts e.message
        exit 1
      end
    end

    # ── Step 2: Export meta ────────────────────────────────────────────────
    tsx_bin     = app_root.join("node_modules/.bin/tsx").to_s
    export_script = app_root.join("scripts/export-meta.mjs").to_s

    stdout = `#{Shellwords.shellescape(tsx_bin)} #{Shellwords.shellescape(export_script)} 2>&1`
    unless $?.success?
      $stderr.puts "manifest:verify — meta export failed (exit #{$?.exitstatus}):"
      $stderr.puts stdout
      exit 1
    end

    begin
      metas = JSON.parse(stdout)
    rescue JSON::ParserError => e
      $stderr.puts "manifest:verify — meta export produced invalid JSON: #{e.message}"
      exit 1
    end

    # ── Step 3: Drift check ────────────────────────────────────────────────
    verifier = ManifestVerifier.new(
      manifest_dir:   app_root.join("data/manifest"),
      components_dir: app_root.join("app/frontend/ds/components"),
      metas:          metas
    )

    errors = verifier.errors

    if errors.any?
      errors.each { |msg| $stderr.puts msg }
      exit 1
    else
      puts "manifest: #{metas.size} components verified, no drift"
    end
  end
end
