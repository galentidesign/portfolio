# frozen_string_literal: true

# craft:capture — composes data/craft.json from live artefacts.
#
# Deliberately has NO :environment dependency so the lint job can run it
# without a Postgres connection. Files are required explicitly.
#
# Sources:
#   lighthouse  tmp/lighthouse/*.json (newest by filename sort)
#   tests       dry-run / list counts from rspec, vitest, playwright
#   axe         static truthful claim (CI-enforced zero violations)
#   fps         data/perf/fps.json passthrough (optional)
#   ci          GitHub Actions URL (static)

namespace :craft do
  desc "Capture lighthouse, test counts, axe, and perf data → data/craft.json"
  task :capture do
    require "json"
    require "pathname"

    app_root = Pathname.new(__FILE__).dirname.parent.parent.expand_path
    result = {}

    # ── Lighthouse ──────────────────────────────────────────────────────────
    lh_dir   = app_root.join("tmp/lighthouse")
    lh_files = Dir.glob(lh_dir.join("*.json")).sort
    if lh_files.any?
      lh_file  = lh_files.last
      lh_data  = JSON.parse(File.read(lh_file))
      filename = File.basename(lh_file, ".json")

      # Filename format: YYYY-MM-DDTHH-MM-SS-mmmZ → ISO 8601
      m = filename.match(/\A(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})-(\d{3})Z\z/)
      captured_at = m ? "#{m[1]}T#{m[2]}:#{m[3]}:#{m[4]}.#{m[5]}Z" : filename

      routes         = Array(lh_data["results"])
      mobile_routes  = routes.select { |r| r["preset"] == "mobile" }
      desktop_routes = routes.select { |r| r["preset"] == "desktop" }
      unique_routes  = routes.map { |r| r["route"] }.uniq.size

      mobile_summary = {
        "performance"   => min_scores(mobile_routes, "performance"),
        "accessibility" => min_scores(mobile_routes, "accessibility"),
        "bestPractices" => min_scores(mobile_routes, "best-practices"),
        "seo"           => min_scores(mobile_routes, "seo")
      }.compact

      desktop_summary = {
        "performance"   => min_scores(desktop_routes, "performance"),
        "accessibility" => min_scores(desktop_routes, "accessibility"),
        "bestPractices" => min_scores(desktop_routes, "best-practices"),
        "seo"           => min_scores(desktop_routes, "seo")
      }.compact

      result["lighthouse"] = {
        "base"       => lh_data["base"],
        "capturedAt" => captured_at,
        "min"        => lh_data["min"],
        "results"    => lh_data["results"],
        "summary"    => {
          "mobile"  => mobile_summary,
          "desktop" => desktop_summary,
          "routes"  => unique_routes
        }
      }
    else
      warn "craft:capture — no lighthouse artifact in tmp/lighthouse/; skipping"
    end

    # ── Test counts ─────────────────────────────────────────────────────────
    tests = {}

    # RSpec dry-run
    rspec_out = `mise exec ruby@3.4.10 -- bin/rspec --dry-run 2>&1`
    if $?.success?
      m = rspec_out.match(/(\d+) example/)
      tests["rspec"] = m[1].to_i if m
    else
      warn "craft:capture — rspec --dry-run failed; omitting rspec count"
    end

    # Vitest list
    vitest_out = `npx vitest list 2>/dev/null`
    if $?.success?
      lines = vitest_out.lines.map(&:strip).reject(&:empty?)
      tests["vitest"] = lines.size if lines.any?
    else
      warn "craft:capture — vitest list failed; omitting vitest count"
    end

    # Playwright list
    pw_out = `npx playwright test --list --reporter=list 2>/dev/null`
    if $?.success?
      # Prefer "Total: N tests" summary line; fall back to counting listing lines.
      if (m = pw_out.match(/Total:\s+(\d+)\s+test/))
        tests["e2e"] = m[1].to_i
      else
        listing_lines = pw_out.lines.map(&:strip).reject { |l| l.empty? || l.start_with?("Listing") }
        tests["e2e"] = listing_lines.size if listing_lines.any?
      end
    else
      warn "craft:capture — playwright --list failed; omitting e2e count"
    end

    result["tests"] = tests unless tests.empty?

    # ── Axe (static, CI-enforced) ────────────────────────────────────────────
    result["axe"] = {
      "violations" => 0,
      "scope"      => "route × skin × motion matrix",
      "enforcement" => "CI"
    }

    # ── FPS passthrough ──────────────────────────────────────────────────────
    fps_path = app_root.join("data/perf/fps.json")
    result["fps"] = JSON.parse(fps_path.read) if fps_path.exist?

    # ── Metadata ─────────────────────────────────────────────────────────────
    result["ci"]          = "https://github.com/galentidesign/portfolio/actions"
    result["generatedAt"] = Time.now.utc.strftime("%Y-%m-%dT%H:%M:%S.000Z")

    # ── Write ────────────────────────────────────────────────────────────────
    output = app_root.join("data/craft.json")
    File.write(output, "#{JSON.pretty_generate(result)}\n")
    puts "craft:capture — written #{output}"
    puts JSON.pretty_generate(result.transform_values { |v| v.is_a?(Array) ? "[#{v.size} items]" : v })
  end
end

# Helper: minimum score across a set of route results for a given category key.
def min_scores(routes, category)
  vals = routes.map { |r| r.dig("scores", category) }.compact
  vals.empty? ? nil : vals.min
end
