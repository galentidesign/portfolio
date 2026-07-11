# 2026-07-10 — Bone & Air, Stage 2 (home-as-story)

The nine-beat home landed: `/` is now one continuous scroll-built story per
the design-direction storyboard — liftoff thesis on bone, the untouched
assembly overture, the prologue, three era beats crossed by inline scroll
rethemes, the wordmark resolution, the work, and the quiet close. Chapter
routes survive as deep-dives; the escape hatch jumps in-page to beat 07.

## What landed (six commits)

- **ScrollRetheme ladder** (`story/retheme/`): EraRetheme's §6.2 persistence
  contract promoted to scroll boundaries — zero-height markers between
  beats, one rAF-throttled listener picking the active segment, the
  era-crossing band on downward crossings (`playRethemeCrossing`, same
  motion chunk; the pinned `mountRethemeMotion` untouched), instant swaps
  upward and under reduced motion. Never persists; switch-away wins;
  mid-story re-picks are adopted as the story's ground. Band markup
  extracted to `RethemeBand` (shared; the 14 EraRetheme contracts hold
  unchanged). The ladder re-processes on document resize, so post-load
  geometry growth can never strand a jumped-to position on a stale skin.
- **Three fx devices**: `mountDrift` — the kilnlight chip rain matured into
  ambient atmosphere (recovered from `9b6b791^`; deterministic motes,
  compositor-only CSS keyframes — no ticker); `mountTypewriter` — kinetic
  type with an out-of-flow caret and char/word granularity, accessible copy
  resident throughout; `mountGlyphPlay` — two deterministic wordmark glyphs
  breathing the variable weight axis, width-locked. All ride the existing
  fx chunk (3.3/12kB gz).
- **Six beats** (`story/beats/`): era beats on a shared staggered-columns
  scaffold with artifact islands — the 2014 browser-chrome exhibit
  extracted to `story/artifacts/` (chapter + home render one artifact), a
  new 2018 component-sheet pastiche, and the kiln island (`data-zone`
  night, static CSS starfield, ember drift, receipts tick derived from the
  real receipt data). Wordmark beat (viewport GALENTI + glyph play), work
  beat (skim destination, gallery band placeholder-aware from controller
  props), quiet close. Heavy interiors are code-split and idle-mounted
  (`IslandMount`); their styles live in `islands.module.css` — sharing the
  beats stylesheet cost the home chunk its manifest facade (and the
  route's modulepreloads) via a rollup graph merge.
- **Home recomposition**: the nine-beat flow with four boundaries
  (crt "loading 2014…" → webpack → terminal KILN_BOOT → a quiet
  "— present day" sweep). ScrollProgress extends to home. On `/` the
  escape hatch jumps to `#the-work` (no route change; `markSkimVia`
  intact — `skim_entry` rides the next `/work` arrival). The skip
  control's `#gateway` target wraps the prologue.
- **The landing-gate perf pass**: typewriter caret out of flow (was CLS
  0.54 — every advance reflowed the line); drift rewritten
  compositor-only (a ticker version billed ~1s of style/layout to the
  route); era fonts (~122kB) + band dressing moved from load to the
  coordinator's scroll-approach signal; the liftoff atmosphere plays
  after load+idle AND the visitor's first gesture — LCP stops observing
  at first input, so the largest paint is never re-timed by its own
  replay. Input-less sessions keep the finished, still statement.

## Verification

- Battery: tokens:build · prettier/eslint/stylelint/token-lint/typecheck ·
  rubocop · manifest:verify · leakcheck · bundle budgets (motion isolation
  held; retheme 28.5/35, fx 3.3/12) · **1017 unit / 244 rspec / 216 e2e**.
- New e2e: `story-scroll-retheme.spec.ts` — 12 contracts including the
  reduced ladder walk, bidirectional scrub, `?skin=` grounding, the band
  crossing with its settle-complete marker, a zero-motion-bytes full-scroll
  network proof, the hatch jump, deep-dive no-op entry, and settled
  per-beat axe scans (a self-retheming route has no steady state — its axe
  coverage lives in the suite that knows its lifecycle).
- §9.3 frame capture: **PASS ×7** (median-of-3, 4× throttle) including two
  new targets — the full home journey (three crossings + sweep; worst
  frame ~51ms on a swap's full-page recalc, zero bursts) and the kiln
  island hold (worst 17.7ms).
- Lighthouse (local, gzip/HTTP-1.1): `/` desktop **99** · mobile **88** ·
  a11y/BP/SEO 100 · CLS 0 · TBT ~0. Real-browser LCP: one clean entry
  (the thesis, 324ms). The mobile gap to the CI floor (90) is the
  simulator billing the assembly motion chunk on local serving — staging
  brotli/HTTP-2 has historically lifted this class of score +5–7 (M8);
  watch the perf job at the next PR.
- Eyeball walk at 1440px, motion + reduced, all nine beats (screenshots in
  `tmp/story-*.png` during the session).

## Known / noted

- The thesis write-in and bone drift start on the visitor's first gesture
  (scroll/pointer), not on load — a deliberate LCP guardrail.
- Pre-existing, surfaced by widening the measured routes: chapter pages
  ship no meta description (SEO 91 there). Stage-3 candidate.
- `/work`'s thesis composition at the new hero scale remains Stage-3 scope
  (unchanged from Stage 1's note).

## Session shape

Orchestrator inline throughout; two read-only recon subagents up front
(architecture map, git archaeology + tooling surface). The Lighthouse hunt
was a five-hypothesis bisect — caret CLS, manifest facade, ticker drift,
font timing, LCP replay — each landing as its own structural fix. Six
scoped commits, each J-gated.
