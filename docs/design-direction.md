# Design Direction — Bone & Air / Home-as-Story

> **Elevated by [The Living Specimen](design-direction-elevation.md)**
> (direction accepted 2026-07-11). This document is preserved as the Bone &
> Air record; the elevation contract governs current build work.

**Status: accepted 2026-07-10.** This document is the execution contract for the
site's taste pass — the deferred visual refinement layer over the v1/kilnlight
foundation. The direction was accepted after a reference-anchored exploration
round (storyboard + skin studies on real pages); build proceeds in staged
landings, each signed off live on staging before the next begins.

The acceptance test for every surface, verbatim:

> "moderately refined, playful yet balanced, unique in a familiar way."

The organizing concept, verbatim:

> "the story of the portfolio should build in sections on page scroll."

Governing principle (unchanged from v1): the surface signals visual UI
designers instantly; the architectural exhibits — token engine, additive
skins, DS docs, colophon numbers — stay fully intact. Both audiences, one
artifact. Composition reference: antigravity.google's launch-page moves
(macro-whitespace, dark islands on a light ground, kinetic type), translated
into this site's own token vocabulary.

## The contract

1. **Ground — bone.** Warm-tinted near-white, whiter and quieter than the v1
   cream. Terracotta demoted to micro-accent + island glow.
2. **Type — Hanken stays; the setting changes.** Not the letterforms — the
   scale and the air. Huge display settings, short lines, tight leading,
   enormous breathing room. No new display face.
3. **Composition.** Macro-whitespace; staggered editorial columns (headline
   left, body offset right-lower); sections compose themselves on scroll.
4. **Dark islands on light.** Drama contained in rounded dark cards and bands
   floating on the bone page — kiln/ember interiors, one starfield-style band.
   The page contains dark, never drowns in it. Era-skin story crossings keep
   their own doctrine.
5. **Motion motifs.** (a) Restrained particle atmosphere — light drift on
   bone, embers inside islands; (b) kinetic type — key statements write
   themselves with a typewriter caret, kin to the terminal/receipts motifs.
6. **Signature.** One viewport-wide GALENTI wordmark moment, one-two glyphs
   misbehaving via Hanken's variable axes. Boldness spent exactly there.
7. **Flagships are seeds, not casualties.** The assembly opening choreography
   is untouched — it IS the direction's motion language. The ogl hero field,
   retheme and zone engines are promoted, not replaced.

## Home-as-Story: the nine-beat storyboard

`/` becomes one continuous scroll-built story; chapter routes survive as
deep-dives.

| beat                       | content                                                                                        | key mechanics                        |
| -------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------ |
| 00 Liftoff                 | thesis writes itself, huge type, particle drift, hatch visible frame one                       | kinetic type, scale & air            |
| 01 Assembly                | existing five-beat GSAP overture, choreography untouched, re-set with air on bone              | flagship as-is                       |
| 02 Prologue 2004–2013      | four stations compose in, staggered columns                                                    | scroll-build                         |
| 03 Era I · Rails '14       | inline retheme to rails-era on scroll; 2014 browser-chrome artifact island; → /story/rails-era | EraRetheme promoted to home          |
| 04 Era II · React '18      | inline retheme; "webpack: compiling…" micro-crossing; artifact island; → deep-dive             | retheme + island                     |
| 05 Era III · Agentic       | retheme to agentic: kiln island — starfield band, ember drift, receipts tick                   | dark island, particles, kinetic type |
| 06 Resolution — now        | sweep home to bone; viewport-wide Galenti wordmark, glyph play                                 | wordmark signature                   |
| 07 The work                | 2 case studies + gallery band — the skim destination (one hatch jump from beat 00)             | 90s target                           |
| 08 System · résumé · close | DS entry, résumé, contact                                                                      | quiet                                |

## Guardrails (hard constraints)

- **90-second gate**: hatch + scroll rail keep thesis → proof in seconds; the
  story never blocks the skim.
- **Reduced motion**: the full story as static sections — fallback-as-base,
  no beat exempt.
- **Era authenticity**: era beats wear the existing era skins; zero new-skin
  work.
- **Quality bar**: Lighthouse ≥95 all routes mobile+desktop, 60fps, zero axe
  violations, token lint, suite green.
- **Architecture**: semantic-tokens-only, additive-skin rule, no Tailwind, no
  new dependencies without cause.
- **Top engineering risk**: three inline rethemes on the LCP route — mitigate
  with static-base + motion-on-idle, below-fold beats lazy-mounted; prove
  with frame captures before landing.

## Staged landings

1. **Stage 1 — contract + tokens** (this document): bone ground ramp,
   terracotta demotion, type scale & air, night zone re-tuned to island duty;
   react-era Roboto self-hosting fix. Token JSON only — zero component edits.
2. **Stage 2 — home-as-story**: the nine-beat scroll build.
3. **Stage 3 — ripple + craft**: scale & air + islands across the remaining
   routes; 16-component detail pass; era-skin pastiche sharpening.
4. **Stage 4 — verify + close**: full battery, 60fps captures per beat,
   squint test against the reference set, Figma library re-sync, 90-second
   test.

## Stage 1 record — the bone tokens

Value-level re-craft of `galenti.tokens.json`; semantic key set unchanged
(skin parity untouched, zero component edits).

**Ground ramp** — `cream-*` renamed `bone-*`, whiter and quieter:

| token                     | was (cream) | now (bone) |
| ------------------------- | ----------- | ---------- |
| surface                   | `#faf6ee`   | `#fcf9f3`  |
| surface-raised            | `#fffdf8`   | `#fefcf7`  |
| surface-sunken            | `#f2ecdf`   | `#f4efe4`  |
| surface-overlay           | `#fffefb`   | `#fffefc`  |
| line (sand-200)           | `#e5ddcb`   | `#e7e0d1`  |
| accent-muted (sienna-100) | `#f6e7dc`   | `#f5eae0`  |

**Terracotta demotion**: `accent` stays `#a64621` (the identity survives at
micro-accent scale); the light-page `glow-accent` shadow quiets from 22%/12%
to 14%/8% alpha — the loud glow now lives only inside night islands, where it
widens to 40px/96px ember bleed.

**Type — scale & air** (galenti only; era skins keep their period settings):

| role                          | was                                         | now                                          |
| ----------------------------- | ------------------------------------------- | -------------------------------------------- |
| hero-size                     | `clamp(3.25rem, 1.8rem + 8.5vw, 9.5rem)`    | `clamp(3.75rem, 1.5rem + 11vw, 13rem)`       |
| hero-weight / line / tracking | 740 / 0.98 / −0.028em                       | 720 / 0.94 / −0.034em                        |
| numeral-size                  | `clamp(4.5rem, 3rem + 9vw, 12rem)`          | `clamp(5rem, 3.25rem + 10vw, 13.5rem)`       |
| display-size                  | `clamp(2.75rem, 2.1rem + 3.2vw, 4.5rem)`    | `clamp(3rem, 2.1rem + 4.4vw, 5.75rem)`       |
| display-line / tracking       | 1.04 / −0.022em                             | 1.02 / −0.026em                              |
| heading-size                  | `clamp(1.75rem, 1.5rem + 1.25vw, 2.375rem)` | `clamp(1.875rem, 1.55rem + 1.6vw, 2.625rem)` |
| body-line                     | 1.6                                         | 1.65                                         |

**Night zone → island duty**: `night-950` deepens to `#0d0a08` (starfield
band ground); ember `glow-accent` widens as above; the ramp otherwise holds —
islands reuse the kiln vocabulary as-is.

**WCAG audit (pre-commit, numeric)**: 38/38 pairs pass — every text pair
≥4.5:1, UI/large-only pairs ≥3:1, both the bone page and the night islands.
The whiter ground raised every light-zone ratio (body ink 15.8:1, secondary
ink 7.0:1, terracotta-as-text 5.7:1, island silhouette on bone 17.6:1).
