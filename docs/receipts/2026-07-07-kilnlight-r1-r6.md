# Kilnlight R1–R6 — the visual redesign (2026-07-07)

Twelfth build session; first of the Kilnlight arc. The launch-gate build
(M0–M10) proved the architecture; J's verdict on the visuals was blunt:
uninspiring, outdated, boring. This session executed six of the seven
Kilnlight redesign milestones against reference DNA from antigravity.google
(light canvas, WebGL lava-lamp field, physics delight), apple.com (scale and
restraint), and developer.apple.com (dark sections as glow accents). The
locked direction: light cinematic with dark narrative moments — the cream
identity stays and gets powered up; dark is a story beat, not a theme.

## Session shape

- One frontier orchestrator + five sequential frontier build agents (R2–R6,
  one per milestone) + one mid-tier docs agent (R1 system pages) + one
  read-only mapping agent + one planning agent up front. Heaviest fleet of
  any session — every milestone is a build milestone with a full-suite
  verification loop.
- Each build agent received pinned contracts (which e2e specs must pass
  byte-unmodified, which interfaces are frozen, per-feature bundle budgets)
  and returned screenshots the orchestrator reviewed before committing.
- The planning question that shaped everything: where the references
  actually sit on the light/dark axis. An early secondhand-sourced "your
  references are dark" generalization was corrected by J (Antigravity is
  fully light) — recorded as a feedback rule in the command center repo.

## What shipped

- **R1 — zones + vocabulary.** The token engine learned `zones`: scoped
  re-assignments of the same semantic custom properties under
  `[data-skin] [data-zone='night']`, parity-validated across skins like
  everything else. Galenti's night is warm near-black + ember; rails-era's
  is green-phosphor CRT; debug's is garish on purpose. New semantic
  vocabulary: hero/numeral type scales, glow shadows, duration-2xl,
  drama/spring eases, glow-ink. Plus the motion rig (capability gates,
  token eases) and a CI bundle-budget gate that resolves motion chunks by
  manifest source key and proves they are never statically reachable.
- **R2 — Assembly 2.0.** An ogl fragment-shader field (fbm, drifting blobs,
  pointer attractor, per-beat hue) behind the hero at the new 9.5rem scale;
  SplitText char rise with variable-weight settle; dimensional beats;
  Physics2D chip rain. CSS gradient base render = no-WebGL = the fallback.
  59.8/60kB budget. story.spec byte-identical.
- **R3 — fx layer + editorial /work.** Magnetic CTAs, proximity glow,
  scroll reveals, velocity marquee behind one 1.8kB lazy barrel; /work
  rebuilt as asymmetric tiles with the agentic study leading dark in the
  night zone; oversized gateway numerals on home.
- **R4 — Retheme 2.0.** The 3px sweep became a 32vh CRT interstitial riding
  rails-era's night zone — static scanlines, vignette, "loading 2014…"
  HUD caption — with the swap-once semantics scheduled by inverting the
  travel ease. All fourteen retheme contracts held, spec byte-identical.
- **R5 — the kiln.** /story/agentic descends through a reusable
  NightBoundary (ember horizon draws itself) into the night zone: receipts
  as a terminal feed with ScrambleText title decodes, a compact
  orchestration map that draws in and goes still, and the landed playbook
  prose untouched. Resolves back to cream before the outro.
- **R6 — token gravity.** /system opens with the system's own tokens as
  physical objects — matter-js pen, deterministic pour, pointer drag/toss,
  sleeping engine. The labeled static grid is the base render and the
  entire keyboard/reduced-motion story. 27.4/40kB.

## The numbers

- Suites at session end: **951 unit / 181 e2e / 214 rspec**, axe zero
  across route × skin × motion (night zones included), leakcheck clean,
  manifest 16 verified no drift.
- Budgets: assembly 59.8/60 · retheme 28.5/35 · night 42.9/45 · fx 1.8/12 ·
  playground 27.4/40 kB gz; reduced-motion path still downloads zero motion
  bytes on every route.
- Local Lighthouse (test server, gzip HTTP/1.1, warmed): desktop
  **100×4 on all seven routes**; mobile 100 a11y/bp/seo everywhere, perf
  91–97 against the 90 local floor. The official ≥95 staging capture
  re-runs post-merge.
- §9.3 60fps protocol at 4× throttle: **PASS on all five targets** —
  the rebuilt assembly ran 610 frames with zero bursts over the rule.

## Notable catches

- The production CSS minifier rewrites `1100ms` as `1.1s`; `tokenDuration`
  assumed milliseconds and came back 1000× short on built assets only.
  Caught in R4's verification, fixed with unit coverage — it would have
  silently flattened every token-timed tween in production.
- Rollup names a `motion/index.ts` chunk `index-*`, so filename-based
  network guards can be dodged; the budget gate binds to manifest source
  keys instead, and R6's e2e guard asserts by request-set difference.
- gsap core billed to a lazy feature's closure is ~27kB — R5 swapped
  ScrollTrigger for the repo's IntersectionObserver idiom and R6 dropped
  Draggable for pointer events + a soft matter constraint, both to hold
  budget without losing feel.

## Round 2 — J's live review (same day)

J reviewed on a local dev server and art-directed three rounds of changes,
built by three more agents:

- **Hero pacing** — pin stretched to +=520% with a trailing hold after
  every beat; the Physics2D chip rain and the decorative in-assembly skip
  facsimile removed. The story spec's fraction table followed the retime
  and gained hold probes — the one sanctioned edit to a pinned spec.
- **Every era wears its own skin** — J's call: rails-only felt lackluster.
  New `react-era` skin (bold flat 2018 material, Roboto stack, AA-corrected
  blue) and new `agentic` skin (the kiln as identity). The retheme
  generalized to per-era treatments: CRT / "webpack: compiling…" skeleton
  shimmer / terminal boot lines. Every skin gained a `day` zone; agentic's
  day is galenti's cream. Fourteen new e2e contracts pin the new crossings.
- **The kiln trusts its skin** — the chapter dropped its night-zone wrapper
  and harsh mid-page boundary (J: "too much contrast, not a refined
  design decision"). The resolve moved to the outro: a rebuilt dawn
  crossing ramping ~56vh through six oklab color-mix stops with ember
  warmth in the mid-tones, into a day-zone plate where the brand returns.
  Boundary triggers now render the finished state when landed past —
  never a pop.

Session end state: **962 unit / 201 e2e / 214 rspec**, budgets green
(night 42.9/45, retheme 28.5/35 with three treatments, assembly 59.76/60
sans Physics2D), leakcheck clean. Twelve commits on `kilnlight`.

## Still open

- Push `kilnlight` → CI → merge decision (merge auto-deploys jgalenti.com).
- Staging/production Lighthouse capture + `rake craft:capture` refresh
  (post-merge, production only) + README/screenshot refresh.
- The 90-second cold-reviewer test on the redesigned site — J books it.
