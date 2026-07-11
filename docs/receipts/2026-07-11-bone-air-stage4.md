# 2026-07-11 — Bone & Air Stage 4: verify + close

Stage 4 of the accepted direction (`docs/design-direction.md`): the
verification and close-out stage — production re-measurement, wire checks,
the squint test against the composition reference, and the 90-second-test
protocol prep. Near-zero build surface by design; one data commit plus this
receipt on `bone-air-stage4`.

## What landed

1. **`760f445` craft refresh** — the Stage-3 carried-in debt. The colophon's
   numbers were kilnlight-era (2026-07-08 capture, 962/214/201 test counts);
   they now carry the Stage-3 site as production actually serves it.

## Production Lighthouse — 2026-07-11, https://jgalenti.com

Run from the local machine against production (canonical host, no overrides),
warmup run absorbing Chrome cold-start, floors 95 / mobile-perf 90. Every
cell scored all four categories.

| route                     | mobile (perf/a11y/BP/SEO) | desktop         |
| ------------------------- | ------------------------- | --------------- |
| /                         | 100/100/100/100           | 100/100/100/100 |
| /work                     | 99/100/100/100            | 100/100/100/100 |
| /work/agentic-design-ops  | 100/100/100/100           | 100/100/100/100 |
| /work/shadcn-to-polaris   | 100/100/100/100           | 100/100/100/100 |
| /system                   | 99/100/100/100            | 100/100/100/100 |
| /system/components/button | 100/100/100/100           | 100/100/100/100 |
| /resume                   | 99/100/100/100            | 100/100/100/100 |

Artifact: `tmp/lighthouse/2026-07-11T17-22-04-917Z.json` (stale pre-capture
files archived to `tmp/lighthouse-archive/` first — craft:capture composes
from the newest file). Environment note: the machine-wide NO_FCP condition
from the Stage-3 close-out had cleared by this session; the probe and the
full sweep both ran clean with CHROME_PATH at Playwright's chromium.

## 60fps frame capture — fresh run

`scripts/perf-capture.mjs` against a manually booted :3001 test server,
4× CPU throttle: **7/7 PASS, zero missed-frame bursts** (worst single frame
83.9 ms on the home story journey, longest burst 2 — under the >3 rule).
`data/perf/fps.json` refreshed from this run; craft.json composes it.

## Production-wire checks (M10 lesson)

Desktop-profile Playwright browse of production — every route, slow-scrolled,
plus palette open, skin switch round-trip, demo state switches, and a full
`/story/agentic` read:

- **Beacons: 62 fired, 62 returned 204.** Eight event kinds observed on the
  wire: page_view ×21, scroll_depth ×31, skim_entry ×2, palette_open ×2,
  palette_action ×2, skin_switch ×1, demo_state ×2, story_complete ×1.
- **Cookieless: zero Set-Cookie headers** on any response in the entire
  browse (every route, every asset, every beacon).
- **og:image: 10/10 routes OK** — absolute jgalenti.com URLs, content-hash
  `?v=` versioning present, every PNG serving 200.

## Squint test — J's verdict (2026-07-11)

Live production screenshots (1440×900, viewport-stepped through the full
home story + /work, Study A, /system) presented in curated pairs beside the
antigravity.google reference set (`ag-s00..s11`): liftoff hero, dark islands,
glow-band interiors, kinetic-type caret, editorial stagger, particle moment.

J's verdict, verbatim:

> "It's definitely better and a bit more refined, but the overall interface
> still looks very AI-designed, which doesn't stand up for a professional
> product designer portfolio. I think this is acceptable as an initial
> refinement pass, but it still needs a ton of elevated elegance and unique
> creativity."

Disposition (J-approved): **Stage 4 closes as an initial refinement pass
accepted** — the Bone & Air contract is executed and the taste pass's staged
build is complete; an **elevation round is queued as a new art-direction
thread** (reference-first elicitation targeting the "AI-designed" read; no
build until a direction is accepted). No fix-list commits on this branch.

## 90-second test (§12.1) — protocol prep

The last open §12 launch-gate box. J books the reviewer; the protocol below
is ready to run as-is.

**Protocol.** Cold reviewer at/above principal level (design or DT). No
briefing beyond "you have 90 seconds." Screen-share or in-person observation.
Timer starts at first paint of `/`. **Pass:** inside 90 seconds the reviewer
can state (a) what J does — the thesis in their own words — and (b) the
strongest proof they saw, having reached it via the skim path unaided
(hatch → /work, or scroll). One dry run allowed after fixes; the passing run
is the recorded one.

**Receipts template** — append the completed block to
`docs/receipts/2026-07-06-m10.md` when the test runs:

```
## 90-second test (§12.1) — <date>

- Reviewer role: <principal-level role, no name required>
- Run: <first | second (one dry run after fixes)>
- Thesis in reviewer's own words: "<verbatim>"
- Strongest proof cited: <what they pointed to>
- Path taken: <hatch / scroll / palette — unaided?>
- Verdict: <PASS | FAIL + fix list>
```

## Verification

Battery at the gate: 1057 unit / 244 rspec / 224 e2e; prettier, eslint,
stylelint, tsc, rubocop, leakcheck, manifest:verify, perf:budget all green
via direct binaries. `story/assembly/**` untouched (zero-diff holds by
construction — data-only commits).
