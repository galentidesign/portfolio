# frozen_string_literal: true

# rake og:generate — screenshot all 10 OG card keys into public/og/*.png.
#
# Prerequisites:
#   CHROME_PATH — path to a Chromium/Chrome executable (Playwright Chromium is
#   fine; the binary is not bundled in the repo). Example discovery:
#     ls ~/Library/Caches/ms-playwright/chromium-*/chrome-mac-arm64/*.app/Contents/MacOS/*
#   Export the path in your shell before running; never write it into a repo file.
#
# Usage:
#   CHROME_PATH=/path/to/chrome mise exec ruby@3.4.10 -- bin/rails og:generate
#   RAILS_ENV=test CHROME_PATH=... mise exec ruby@3.4.10 -- bin/rails og:generate
#
# The task boots its own Rails server on port 3971, screenshots each card, then
# tears the server down — idempotent, safe to re-run.

namespace :og do
  desc "Screenshot all OG card keys into public/og/*.png (1200×630, idempotent)"
  task generate: :environment do
    require "ferrum"
    require "net/http"
    require "uri"
    require "fileutils"

    port       = 3971
    health_url = URI("http://localhost:#{port}/up")
    app_root   = Rails.root

    # ── Boot server ──────────────────────────────────────────────────────────
    server_pid = spawn(
      { "RAILS_ENV" => ENV.fetch("RAILS_ENV", "development") },
      "bin/rails", "server", "-p", port.to_s,
      chdir: app_root.to_s,
      out:   File::NULL,
      err:   File::NULL
    )

    begin
      # Poll /up until 200 or 90-second timeout.
      deadline = Time.now + 90
      loop do
        abort "og:generate — server did not start on port #{port} within 90s" if Time.now > deadline

        begin
          res = Net::HTTP.get_response(health_url)
          break if res.code == "200"
        rescue Errno::ECONNREFUSED, Errno::EADDRNOTAVAIL, Errno::ETIMEDOUT, SocketError
          # server not up yet — keep polling
        end
        sleep 0.5
      end

      puts "og:generate — server ready on port #{port}"

      # ── Boot browser ─────────────────────────────────────────────────────
      browser_opts = {
        headless: true,
        window_size: [ 1200, 630 ],
        timeout: 60,
        browser_options: { "disable-quic" => nil }
      }
      chrome_path = ENV["CHROME_PATH"].presence
      browser_opts[:browser_path] = chrome_path if chrome_path

      browser = Ferrum::Browser.new(**browser_opts)

      # Resize the viewport to exactly 1200×630 — window_size sets the OS
      # window, but browser chrome can reduce the actual viewport height.
      browser.resize(width: 1200, height: 630)

      begin
        FileUtils.mkdir_p(app_root.join("public/og"))

        success_count = 0

        OgHelper::CARD_MAP.each do |key, meta|
          skin     = meta[:skin]
          url      = "http://localhost:#{port}/og/#{key}?skin=#{skin}"
          out_path = app_root.join("public/og/#{key}.png").to_s

          begin
            browser.goto(url)
          rescue Ferrum::PendingConnectionsError
            # Non-critical sub-resources (e.g. external font links) may remain
            # pending after navigation. The card itself is ready once
            # data-og-ready is set — we wait for that below regardless.
          end

          # Wait for data-og-ready="true" — fonts must settle before screenshot.
          card_deadline = Time.now + 15
          loop do
            if Time.now > card_deadline
              abort "og:generate — data-og-ready never appeared for key=#{key} (15s timeout)"
            end
            break if browser.at_css("[data-og-ready='true']")

            sleep 0.2
          end

          browser.screenshot(path: out_path)
          success_count += 1
          puts "  ok  #{key} → public/og/#{key}.png"
        end

        puts ""
        puts "og:generate — #{success_count}/#{OgHelper::CARD_MAP.size} PNGs written to public/og/"
      ensure
        browser.quit
      end
    ensure
      # Kill the server we spawned, by port (not by name).
      system("lsof -ti:#{port} | xargs kill -9 2>/dev/null; true")
      Process.wait(server_pid) rescue nil
    end
  end
end
