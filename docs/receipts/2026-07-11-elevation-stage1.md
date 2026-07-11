# 2026-07-11 — The Living Specimen, Stage 1 (contract + foundations)

The elevation direction — **The Living Specimen** — was accepted this day
after a four-round comp exploration against the reference set (cinetica ·
exoape · lusion). This session landed Stage 1 of the six staged landings:
the elevation contract as a repo doc, Playfair Display self-hosted, the
serif voice as parity tokens across all five skins, and the galenti
display-voice retune. Zero component edits by design — the whole change
rides the token engine, and nothing consumes the new voice yet.

## What landed

- `docs/design-direction-elevation.md` — the execution contract: the squint
  verdict that prompted the round, reference set, the 10-point contract,
  motion budgets, staged landings, and the Stage 1 value record. Bone & Air
  doc preserved as the base record with an additive pointer.
- Playfair Display self-hosted: `playfair-display-latin-wght.woff2` +
  `playfair-display-latin-wght-italic.woff2` (fontsource 5.2.8, 400–900
  variable) + OFL from the Google Fonts upstream, provenance rows in the
  fonts README. `meta.fonts` wired on galenti + agentic, **preload: false
  on both faces** — Playfair is the statements voice, not the LCP voice
  (the M10 lesson), and an unconsumed `@font-face` fetches nothing, so
  Stage 1 is network-neutral. The galenti single-preload e2e pin holds
  untouched.
- Serif voice tokens, full cross-skin parity: new `raw.font.serif` per skin
  (Playfair on galenti/agentic; Georgia stacks on rails-era/react-era — no
  new period fonts; the mono stack on debug, torture doctrine) + two new
  semantic type roles sized from the accepted serif comp:
  - `statement` — `clamp(2rem, 1.4rem + 2.1vw, 3.25rem)` (52px @1440),
    weight 400, line 1.2
  - `intertitle` — `clamp(1.5rem, 1.2rem + 0.75vw, 1.9375rem)` (31px
    @1440), weight 400, line 1.35
  - font-style is not tokenized; italic is applied at consuming sites in
    Stages 2/3.
- Galenti display-voice retune (value-only; sizes untouched — recomposition
  is Stages 2–4; era skins keep their period settings):

  | role    | was            | now            |
  | ------- | -------------- | -------------- |
  | hero    | 720 / −0.034em | 680 / −0.045em |
  | numeral | 760 / −0.03em  | 750 / −0.045em |
  | display | 640 / −0.026em | 700 / −0.04em  |

## Verification

- WCAG (numeric, pre-commit): **no color deltas anywhere in Stage 1** —
  weight/tracking moves don't affect contrast, and the three retuned roles
  render far above the 24px large-text threshold in every clamp range. The
  Bone & Air 38/38 record stands unchanged.
- Battery: tokens:build (parity ×5 skins) · typecheck ·
  prettier/eslint/stylelint/token-lint via direct binaries · rubocop ·
  leakcheck · manifest:verify (16, no drift) · bundle budgets · **1057
  unit / 244 rspec / 224 e2e** all green.
- One test pin moved with the contract: `tokens.test.tsx` type-specimen
  count 8 → 10 (`/system/tokens` derives the new roles automatically).
- Scope proof: `git diff main --stat` touches only the five token JSONs,
  font assets, two docs, and the one test pin — zero `story/**`, zero
  component sources.
- **Latent e2e flake diagnosed** (pre-existing, not introduced here): "axe:
  shell toast open state" failed twice under full-suite load, passed 5/5
  isolated and on the final full run. Mechanism: axe sampled the toast
  mid-enter-fade — fg `#4b7934` is exactly `positive` `#46752f` at ~97%
  opacity over `positive-surface` `#ecf2e2`, ratio 4.49 vs the 4.5
  threshold. The pair passes at rest with almost no margin, so any
  transient frame fails it. The test settles `[data-reveal]` but not the
  toast's own transition. Candidate fixes for a later stage: settle-wait
  on the toast transition in the test, or a darker `moss-600`.

## Session shape

Orchestrator inline throughout (docs, fonts, tokens, retune, battery); two
read-only recon subagents mapped the font/token/test surface up front.
Commits pre-authorized at the stage gate; branch stays local — merge waits
for the live walk + sign-off.
