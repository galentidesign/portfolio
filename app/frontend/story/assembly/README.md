# Assembly opening — storyboard + timeline contract (M5)

The opening states the site's thesis without words: raw design tokens
assemble into atoms, molecules, and organisms, until the page's own shell
snaps together — then hands off to the prologue and the chapter gateway.
v1 renders in DOM/SVG behind a section API; a v1.5 WebGL version is a
drop-in swap for the motion layer only.

## Architecture: fallback-as-base

`<AssemblyOpening />` renders the **static stepped diagram as its base**: an
ordered list of beats, each a `figure` (inert exhibit) + `figcaption` (the
narrative). This base IS the reduced-motion experience — content parity is
structural, not maintained by hand.

When motion is allowed (`useMotionPref`), the component dynamically imports
the motion layer (`motion/` — GSAP 3.15.0 + @gsap/react 2.1.2, exact pins),
sets `data-motion="on"` on the section, and the timeline takes over. Reduced
motion (or the manual toggle) never downloads GSAP. A mid-session toggle to
reduced motion kills the ScrollTrigger and reverts to the base (gsap
context revert).

Non-negotiables:

- **The h1 (`J Galenti`) + subline are visible from frame one in both
  modes.** Beats assemble _around_ the name; nothing ever hides it.
- **Beat exhibits are `inert`** — real DS components rendered as visual
  exhibits, out of tab order and the AT tree. The figcaptions carry the
  narrative; the only operable controls inside the opening are the skip
  control (first focusable, visible from frame one) and nothing else.
- **Perf rules:** animate `transform` and `opacity` only. No layout or
  paint properties, no animated shadows/filters. Exhibits animate via
  wrapper containers, never their internal nodes. Budget: 60fps at 4× CPU
  throttle (§9.3: no burst of >3 consecutive frames over 16.7ms). A beat
  that can't hold the budget gets cut — the budget stays.

## Section API (the v1.5 swap surface)

```ts
export interface AssemblyOpeningProps {
  /** Fired once when the sequence completes or is skipped. */
  onComplete?: () => void
}
```

- The component owns one `<section aria-label="Assembly opening">` with
  `data-testid="assembly-opening"`.
- Beats carry `data-beat="<id>"`; under motion the active beat carries
  `data-beat-active`. Tests and the perf capture key on these.
- The skip control (`data-testid="skip-intro"`) jumps to `#gateway`
  (the chapter gateway section on home): motion mode = kill trigger +
  instant scroll (a skip is never animated); static mode = anchor jump.
  No storage — the opening is always offered fresh.

## The beats

Scroll ranges are fractions of the pinned distance (`+=520%`, ~5.2 viewport
heights). The master timeline uses GSAP labels named exactly as the ids.
Ranges are non-contiguous: each 0.08 gap is a hold plateau — the beat sits
fully assembled with nothing animating (~4–5% of true stillness), then the
exit/entrance crossfade closes the gap. A beat keeps `data-beat-active`
through its own trailing hold; the handoff lands where the next range begins.

| #   | id          | range     | exhibit                                                                                                                                                                                          | figcaption (verbatim)                                                                |
| --- | ----------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| 0   | `tokens`    | 0.00–0.12 | Field of raw material: 5 color chips (surface, ink, accent, positive, line), type specimens (display "Aa", mono "16px"), a spacing ruler of `--space` ticks, the enter-ease drawn as an SVG path | "Raw tokens — the palette, type, spacing, and easing every component compiles from." |
| 1   | `atom`      | 0.20–0.32 | The chips converge into a real `<Button>` ("Assemble"): color chip → fill, specimen → label, ticks bracket the padding                                                                           | "Atom — a Button compiles from four tokens."                                         |
| 2   | `molecule`  | 0.40–0.53 | Label + input + the button slide into a real `<FormField>` row; the focus ring pulses once (opacity)                                                                                             | "Molecule — label, input, and button become a Form Field."                           |
| 3   | `organisms` | 0.61–0.74 | A Nav bar facsimile assembles above three `<Table>` rows building staggered                                                                                                                      | "Organisms — the same tokens, composed into Nav and Table."                          |
| 4   | `shell`     | 0.82–1.00 | A facsimile of the site's own bar slides into the real bar's position and crossfades out; the hero (h1 + subline, always visible) settles                                                        | "The shell itself — the same system, snapped together. You're inside it now."        |

Motion choreography notes:

- Beat 0: elements drift at differing parallax rates as scroll begins;
  labels fade in. Establishes "material on the table."
- Beat 1: convergence is transform-only flight; the Button "sets" with a
  small scale settle (`--motion-ease-enter` feel; the actual eases live in
  the timeline, tokens inform the curve).
- Beat 3/4 facsimiles are `aria-hidden` + `inert` (pure picture) — the page
  must never grow a second nav landmark.
- Beat 4 ends by releasing the pin; normal flow resumes into the prologue
  band, then the gateway. That release IS the gateway handoff.
- `scrub: true` — the sequence is scroll-driven; the visitor owns the
  playhead. No autoplay.

## Prologue beat (sibling, not pinned)

`<PrologueBeat />` (`story/prologue/`) is a normal-flow section between the
opening and the gateway — outside the pin, so it stands alone under reduced
motion and keeps the pin math simple.

- Heading: mono annotation `Prologue · 2004–2013`.
- A horizontal year band, 2004 → 2013, with four stations (J's labels,
  verbatim — the last one deliberately runs past the band's end into the
  Rails era; render it as a thread that continues, not an error):
  1. `2004–2007 · Audio & Video Production`
  2. `2007–2010 · Freelance Branding, Marketing & Web Design`
  3. `2010–2012 · iOS App UX/UI Design`
  4. `2012–2017 · Teaching Graphic Design, Audio & Film Production (University-level)`
- Motion: stations reveal in sequence on scroll (opacity/transform through
  motion tokens — CSS-only is fine here, no GSAP needed); static/reduced:
  all visible.
- `data-testid="prologue-beat"`; stations `data-station="<n>"`.
- Semantic tokens only; the band uses `--color-line` with `--color-accent`
  stations; labels `--type-small` + mono family for the year ranges.

## File ownership (M5 build)

| Area                      | Files                                                                                                                         | Owner              |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| Base + skip + home wiring | `story/assembly/AssemblyOpening.tsx`, `assembly.module.css`, `AssemblyOpening.test.tsx`, `beats.ts`, `pages/home/*`           | orchestrator       |
| Motion layer              | `story/assembly/motion/*` (timeline + per-beat modules + tests); replaces the pre-landed stub wholesale; touches nothing else | motion agent [F]   |
| Prologue                  | `story/prologue/*`                                                                                                            | prologue agent [M] |
| e2e + perf                | `tests/e2e/story.spec.ts`, `scripts/perf-capture.mjs`, smoke updates if needed                                                | e2e agent [M]      |

The motion layer's entry contract (stub pre-landed by the orchestrator,
replaced wholesale — the M4 `actions.ts` pattern):

```ts
// story/assembly/motion/index.ts
export interface AssemblyMotionHandle {
  /** Jump to the end of the sequence instantly (skip). */
  skipToEnd: () => void
  /** Tear down triggers and revert all inline styles (reduced-motion flip). */
  destroy: () => void
}
export function mountAssemblyMotion(section: HTMLElement): AssemblyMotionHandle
```

`AssemblyOpening` calls `mountAssemblyMotion` after dynamic import when
motion is allowed; it never imports GSAP statically. The motion module owns
GSAP registration, the ScrollTrigger pin, the master timeline with
per-beat labels, and `data-beat-active` bookkeeping.
