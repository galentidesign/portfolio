# Telemetry contract (§7) — binding

First-party, cookieless, no PII, no fingerprinting. The `/colophon` privacy
note — "first-party, cookieless, no PII" — is a public claim; every change to
this layer must keep it true. This document is the interface contract between
the Rails sink (`POST /t`), the client beacon module, and the `/ops`
dashboard. Change it only by changing all three together.

## Tables (migrated; schema fixed)

- `visits` — `day_key` (unique, salted daily hash — see below),
  `first_referrer`, `utm_source`, `utm_medium`, `utm_campaign`, `entry_path`,
  `ua_class` (`desktop|mobile|bot|unknown`), `created_at`. One row per
  day-key; **no raw IP, no raw UA, ever**.
- `events` — `visit_id`, `kind` (allowlist, `Event::KINDS`), `payload` jsonb,
  `created_at`. Append-only.

## day_key derivation (server, TelemetryController)

```
day_key = Digest::SHA256.hexdigest(
  [Rails.application.secret_key_base, Date.current.iso8601,
   request.remote_ip, request.user_agent].join(":")
).first(32)
```

Salt = `secret_key_base` (no new secret to manage); daily rotation comes from
the date component. The hash is computed and the raw IP/UA discarded in the
same request — they never reach a model, log line, or column.

## POST /t protocol

- Body (JSON): `{ "kind": string, "payload": object }`. The beacon always
  merges `pageload_id` (in-memory UUID v4, new per full page load) and `path`
  into `payload` before sending.
- CSRF: `skip_forgery_protection` on this controller only —
  `navigator.sendBeacon` cannot carry a CSRF token. Same-origin JSON POST,
  kind-allowlisted, writes anonymous rows: the CSRF surface is nil by design.
- Visit resolution: compute `day_key` → `Visit.create_or_find_by(day_key:)`.
  On **create** (first event of the day for that browser), fill from payload:
  `entry_path` (payload.path), `first_referrer` (payload.referrer, only when
  present and its host differs from the request host), `utm_*`
  (payload.utm_source/medium/campaign), `ua_class` (server-side coarse UA
  regex; automated headless UAs — HeadlessChrome, Lighthouse, crawler
  strings — class as `bot`, keeping generation/audit/crawler traffic out
  of /ops counts. Playwright's device profiles carry a real Chrome UA and
  class as desktop; they only ever hit local/CI databases). On find, those
  fields are left untouched.
- Responses: `204` after a successful insert (a 204 on the wire IS the
  "events land" proof), `422` for unknown kind / malformed body. Never a
  redirect, never a cookie, never a Set-Cookie header.
- No rate limiting at v1; bots are classed and excluded from /ops instead.

## Event kinds + payload shapes (client fills; server allowlists kind only)

| kind              | payload (beyond pageload_id/path)                          | fires                                                                            |
| ----------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `page_view`       | `referrer?`, `utm_source?`, `utm_medium?`, `utm_campaign?` | initial load + every Inertia `navigate`                                          |
| `scroll_depth`    | `quartile: 25\|50\|75\|100`                                | once per quartile per path per pageload                                          |
| `mode_switch`     | `to: "story"\|"skim"`, `via: "palette"\|"hatch"`           | palette mode actions; escape-hatch click                                         |
| `skin_switch`     | `to: <skin name>`                                          | palette skin actions                                                             |
| `palette_open`    | —                                                          | palette dialog opens (button, ⌘K)                                                |
| `palette_action`  | `id: <action id>`                                          | any palette action performed                                                     |
| `demo_state`      | `state: "success"\|"loading"\|"empty"\|"error"`            | demo state switcher change                                                       |
| `resume_download` | —                                                          | résumé PDF download click                                                        |
| `story_complete`  | `chapter: "agentic"`                                       | Ch3 outro (chapter footer) enters viewport, once per pageload                    |
| `skim_entry`      | `via: "direct"\|"hatch"\|"palette"`                        | first arrival on `/work` per pageload (nav-link arrivals read as `direct` at v1) |

UTM params ride only on `page_view` (read from `location.search`); the server
consumes them only at visit creation.

## Beacon module API (`app/frontend/telemetry/track.ts`)

```ts
track(kind: EventKind, payload?: Record<string, unknown>): void
```

- Fire-and-forget `navigator.sendBeacon("/t", Blob<application/json>)`;
  silently no-ops when `sendBeacon` is unavailable (SSR-safety in tests).
  Failures are never surfaced to the UI and never retried.
- Holds module-level state per pageload: the UUID, per-path quartile sets,
  the skim-entry and story-complete once-flags. **No cookies, no
  localStorage, no client IDs that outlive the pageload.**
- Company signal is referrer-only (`document.referrer` on page_view) — no IP
  enrichment anywhere, ever (§7).

## /ops queries (exclude `ua_class = "bot"` everywhere)

- Daily visits: `visits.group_by_day(created_at)` last 30 days (plain
  `GROUP BY DATE(created_at)` — no gem).
- Top referrers: `visits.group(:first_referrer)` non-null, top 10.
- Top paths: `events.page_view.group(payload->>'path')`, top 10.
- Story vs skim: distinct visits with a `story_complete` (and separately any
  `/story/*` or `/` page_view) vs distinct visits with a `skim_entry`.
- Demo plays: count of `demo_state` events (+ distinct visits).
- Résumé downloads: count of `resume_download` events.

## Test hooks

- e2e: assert the `POST /t` request fires (`page.waitForRequest`) and/or rows
  via the test DB; a 204 response is the landing proof.
- The beacon module must be unit-testable with a stubbed
  `navigator.sendBeacon` (jsdom lacks it).
