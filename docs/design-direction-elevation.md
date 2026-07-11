# Design Direction — The Living Specimen (elevation round)

**Status: accepted 2026-07-11.** This document is the execution contract for
the elevation round — the second taste layer over the accepted
[Bone & Air](design-direction.md) direction. Bone & Air is the base being
elevated, not replaced: its ground, token vocabulary, and home-as-story
architecture all survive. Build proceeds in staged landings, each signed off
live before the next begins.

The verdict that prompted the round, verbatim (recorded in
[the Bone & Air stage-4 receipt](receipts/2026-07-11-bone-air-stage4.md)):

> "It's definitely better and a bit more refined, but the overall interface
> still looks very AI-designed, which doesn't stand up for a professional
> product designer portfolio. I think this is acceptable as an initial
> refinement pass, but it still needs a ton of elevated elegance and unique
> creativity."

This round's target: **kill the AI-designed read.** Elicitation established
the offense is the gestalt — template-tell component styling (same card
everywhere, uniform detailing, spec-sheet composition, polished defaults) —
with component styling as the spearhead and the era artifact islands as
exhibit A.

## Reference set

- **cinetica.studio** — the anchor. Pulls: full-bleed drama, type fights the
  frame, mixed type voices. Explicitly _not_ pulled: the chrome/ornament
  layer (ticks, timestamps, registration marks — rejected).
- **exoape.com** — elevated elegance, cinematic full-bleed, type cut by the
  frame.
- **lusion.co** — playful energy, realtime interactivity, media-forward work
  grid, craft confidence.

Direction was accepted after a four-round comp exploration on real content
(liftoff, era act, work index, system, résumé; three serif candidates).
Comp artifacts are local working files, not committed.

## The contract

1. **Split by zone.** Bone editorial ground for the skim surfaces (`/work`
   shell, `/system`, résumé, colophon). The home story goes **full-bleed
   cinematic dark** for its era acts — islands dissolve, the kiln becomes
   the whole frame. Bone & Air's "the page contains dark" rule is amended
   for the home story only.
2. **Three voices.** Hanken Grotesk at viewport scale is the display voice
   (weight ~680, tight tracking, cut/bled by the frame). **Playfair
   Display** (OFL, self-hosted) is the statements/intertitle voice.
   JetBrains Mono stays utility. Heavy condensed faces are dead — "too
   thick… a little too casual/playful."
3. **Type fights the frame.** Viewport-scale settings get cut mid-word by
   the frame edge (compositional, not animated); ghost numerals sit behind
   act titles; headlines bleed both edges.
4. **Kill the card.** No boxes. Hairlines, type hierarchy, and whitespace do
   all separation. Every surface composed bespoke to its content — the DS
   supplies tokens and type, not layouts.
5. **The front door (liftoff) — dense tiles + both switchers.**
   Gravity-bound token tiles (the `/system` playground engine, promoted)
   fall and rest _on_ the viewport-scale name — the name is the physics
   ground. Four physical skin chips fall with them **and** a quiet static
   mono switcher row sits in the UI; knocking a chip or clicking the row
   re-tokens the entire page through the existing retheme engine (⌘K
   palette action = same lever; a separate ⌘K stunt re-drops the current
   skin's tiles).
6. **`/work` — living media bands.** Full-height bands, one per study,
   titles crossing the band seam; each band is that study's real world
   running live (kiln feed ticks in 01, demo cycles in 02); serif
   descriptors; mono meta. The ledger/index take is dead.
7. **Era acts.** Act title crosses the ghost numeral, ember bleed louder,
   serif intertitle, receipts feed directly on the night ground. Era-skin
   authenticity doctrine unchanged.
8. **`/system` + résumé under the language.** Exhibits fully intact — type +
   air + de-boxing only; the token playground runs on the open ground, no
   container; résumé = name cut by frame, serif role line, hairline history
   rows.
9. **Flagships promoted, never touched.** Assembly overture zero-diff as
   beat 01 (`+=520%` pin sacred). ogl hero field runs under the liftoff.
   Retheme + zone engines now perform at the front door. Kiln content
   full-frame. Token playground engine reaches the hero.
10. **Anti-patterns** (each explicitly rejected this round): heavy condensed
    display faces · drama inside rounded containers · ledger-style work
    index · film-chrome ornament layer · uniform card/radius/shadow
    detailing · predictable even section rhythm.

## Motion behavior & budgets

Liftoff: ogl field + physics tiles (idle-mounted after LCP, first-gesture
aware); glyph-play on the name. Era acts: scroll-scrubbed arrival, crossings
via existing engines, particles scoped to act ranges, lazy below LCP.
`/work`: bands live on hover/in-view, transform-only parallax.

Reduced motion: every frame IS the static base; physics renders as the
settled pile; skin switch is instant.

Budgets unchanged: Lighthouse ≥95 all routes, zero axe violations, 60fps
captures, semantic tokens only, additive skins, no Tailwind, no new
dependencies beyond the Playfair woff2s (matter-js already ships).

## Staged landings

1. **Stage 1 — contract + foundations** (this document): Playfair Display
   self-hosted (OFL, latin subsets, fontsource pattern); serif family/role
   tokens with cross-skin parity; display-voice value retunes; WCAG numeric
   audit pre-commit. Zero component edits.
2. **Stage 2 — the liftoff**: physics-tile hero (name as ground, dense pile,
   skin chips + static row, both wired to the retheme engine), serif
   statement, mono micro-nav. LCP guardrails (static base first paint,
   physics on idle). Frame captures + axe on the transient states.
3. **Stage 3 — era acts full-bleed**: home story recomposition — islands
   dissolve, act titles + ghost numerals + intertitles, receipts on open
   ground, crossings re-staged on the bigger canvas. Assembly beat
   untouched.
4. **Stage 4 — `/work` living bands** + gallery band under the language;
   media/live-world wiring per study; seam-crossing titles.
5. **Stage 5 — ripple + de-carding**: `/system`, résumé, colophon, 404, and
   the 16-component pass — de-box/de-template every DS surface that isn't
   an exhibit contract; bespoke composition per doc page kept honest.
6. **Stage 6 — verify + close**: full battery + production Lighthouse +
   60fps sweep, squint test against this round's reference set, Figma
   library re-sync, receipt. Then the 90-second cold-reviewer test.

## Stage 1 record — the serif voice + display retune

_Filled at the Stage 1 landing._
