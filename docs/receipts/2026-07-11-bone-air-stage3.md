# 2026-07-11 — Bone & Air Stage 3: ripple + craft

Stage 3 of the accepted direction (`docs/design-direction.md`): the
scale-and-air plus islands language rippled across every route beyond `/`, a
two-pass detail-craft sweep over the sixteen DS components, and era-pastiche
sharpening on the story artifacts and crossing bands. Ten commits on
`bone-air-stage3` (`8fac5a7..94686a5`), each landed battery-green.

## What landed

1. **`8fac5a7` /work thesis composition** — the Stage-1-deferred debt. The h1
   becomes a 5fr/7fr grid at `--bp-lg`: hero lead spans full width, the rest
   drops to the offset right column at heading scale, 34ch, `text-wrap:
pretty`. Markup untouched (accessible name intact). Thesis block now
   bottoms ~710px of a 900px viewport with the marquee cresting in
   (was ~500px past one viewport).
2. **`ffafdee` meta descriptions ×6** — the three story chapters + the three
   system sub-pages. `/story/rails-era` SEO 91 → 100.
3. **`14d3097` /resume + /colophon** — h1 → display, measure 34 → 44rem,
   section rhythm up one rung; the colophon craft numbers take display-size
   mono. Also repairs a shipped broken-var artifact: both pages referenced
   `--color-border`/`--radius-card`, which exist in no skin — those borders
   rendered currentColor at radius 0. Now `--color-line`/`--radius-surface`.
4. **`e86a1e9` /system doc-detail pages** — component-doc h1 → display,
   section heads → heading; the last pre-bone /system surface.
5. **`032a9a7` + `dfe740d` studies** — split by risk class. 5a: CSS-only
   scale (display h1s, heading sections, taller rhythm); 5b: Study A's
   orchestration diagram in a `data-zone="night"` kiln island + the /work
   reveal idiom on both studies via `useFx`, `data-reveal` strictly below
   the LCP element. Study unit tests pin the motion gate to reduced (the
   home/work pattern).
6. **`b4e4310` /gallery coverage** — the one route with zero tests joins the
   shell axe matrix (index + fixture detail route × galenti/debug) and gains
   an index unit suite. No visual changes; deliberately kept out of the
   Lighthouse gate while assets are placeholder.
7. **`64e18fe` craft pass A — interactive states** — every interactive
   surface answers hover (Nav links/palette options, Prose links, Toast
   dismiss, SkinSwitcher items, Table rows); press feedback per the
   Button/CodeBlock precedent; `:not(:disabled)` guards; CodeBlock disabled
   state; Card's lift mirrored to `:focus-visible` + shadow raise;
   FormField's critical border survives focus. Menu untouched — its
   hover/roving conflation is a documented in-file decision. Manifest
   `tokens:` lists + contrast prose updated in step (Leg 3: no drift).
8. **`2ebf274` craft pass B — rhythm + optical** — CodeBlock's focusable
   `pre` traded `outline: none` for the focus recipe (the one real keyboard
   indicator gap found); Table cells gain block padding for wrapped rows;
   Badge sm optical inset; EmptyState double-gap collapse; Prose h3
   completes its spec. Dialog's 2/4/5 stack ladder inspected and kept —
   hierarchy, not drift.
9. **`94686a5` era pastiche** — rails chrome dots become traffic lights
   (semantic status trio, aria-hidden decorative; no token JSON change, so
   no numeric WCAG audit triggered) + the 2014 glossy-toolbar sheen; the
   react sheet grows its Storybook-4 story-tree rail; terminal band captions
   open with an ember prompt glyph and close on a STATIC cursor block (the
   band's WCAG 2.3.1 static-only rule binds; pseudo content AT-silenced via
   `/ ''`). `story/assembly/**` zero-diff.

## Verification

- Battery per commit: **1057 vitest / 244 rspec / 224 e2e** (from
  1052/244/220 at stage start: +5 gallery unit, +4 gallery axe), all lints
  (direct binaries), typecheck, leakcheck, `manifest:verify` (16, no drift),
  `perf:budget` green (fx chunk 3.7/12kB).
- Frame capture: **PASS ×7** after 5b and again after the pastiche commit.
- Lighthouse (local, canonical host, gzip/HTTP-1.1 — floors 95 / mobile-perf
  90), captured per step:

  | route                             | mobile                         | desktop     |
  | --------------------------------- | ------------------------------ | ----------- |
  | /work (post-recompose)            | 93 / 100 / 100 / 100           | 100 ×4      |
  | /story/rails-era (unscored route) | perf 87 · SEO **100** (was 91) | 96 / 100 ×3 |
  | /resume                           | 97 / 100 ×3                    | 100 ×4      |
  | /colophon (unscored route)        | 97 / 100 ×3                    | 100 ×4      |
  | /system/components/button         | 92 / 100 ×3                    | 100 ×4      |
  | studies pre-fx                    | 96 & 95                        | 100 ×4      |
  | studies post-fx (5b)              | 92 & 91                        | 99 & 100    |

- **Environment note:** a consolidated all-routes sweep at close-out failed
  with machine-level NO_FCP (zero network requests on every route while the
  same Chromium loaded the site fine under Playwright — the headless-Chrome
  environment class the runner's own docs flag). The per-route captures
  above were all taken in verified-working windows during the session; the
  CI perf job re-measures everything at merge, which is the binding gate.
- **craft.json deliberately NOT refreshed:** `rake craft:capture` composes
  from the newest `tmp/lighthouse/*.json`, which today is a localhost
  capture — running it would replace the colophon's production capture
  (jgalenti.com, 99–100 ×4) with weaker local numbers. Refresh belongs to
  the post-merge production capture, where the new test counts
  (1057/244/224) land together with production Lighthouse.

## Deviations from plan

- `content-visibility` was not added to study sections — both studies held
  ≥95/90 without it; adding idle machinery a measurement didn't ask for
  violates the simplicity rule.
- /gallery received no visual changes — the pillar build already carries the
  direction; the gap was coverage, and that's what landed.
- Bootstrap-3 "well" insets were dropped from the rails artifact — the
  traffic lights + toolbar sheen carry the 2014 read without restyling live
  DS components from page CSS.

Branch is **unpushed** by instruction; landing (local ff-merge only) awaits
the live walk.
