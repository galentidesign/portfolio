# EraRetheme — the story-driven re-theme boundary (spec §6.2)

The money shot: a chapter route that applies an era skin to the whole site
while the visitor is inside it, as a designed moment — the same components
visibly re-tokening. Every era chapter mounts it:

| Chapter | skin | treatment | caption |
| --- | --- | --- | --- |
| `/story/rails-era` | `rails-era` | `crt` | `"loading 2014…"` |
| `/story/react-era` | `react-era` | `webpack` | `"webpack: compiling… ⚡ built in 2.4s"` |
| `/story/agentic` | `agentic` | `terminal` | 3 streaming boot lines |

One shared motion chunk drives all three crossings; the `treatment` prop only
switches static CSS dressing on the band (scanlines / skeleton-shimmer
stripes / kiln glow + ember hairlines — never an animation).

## The one mechanism

Flipping `data-skin` on `<html>` swaps every custom property in a single
paint — that flip (via `SkinProvider.setSkin`) IS the re-theme. Everything
else here choreographs _around_ that instant so it reads as intent, not a
glitch.

## Entry / exit semantics (the persistence contract)

These rules are encoded in `EraRetheme.test.tsx` — change them only with a
spec change:

1. **Entry (mount):** capture `savedSkin` (current `data-skin` attr) and
   `storedAtMount` (`localStorage[SKIN_STORAGE_KEY]`). Then apply the era
   skin via `setSkin(skin, { persist: false })` — instantly under reduced
   motion, at the sweep-cross beat otherwise.
2. **Already era-skinned at entry** (deep link `?skin=rails-era`, or an
   explicit prior choice): no choreography, no announcement, no swap. Exit
   still restores (a visual no-op).
3. **Exit (unmount):** read the LIVE attr (never stale context).
   - If the current skin ≠ the story's skin, the visitor explicitly switched
     away mid-chapter — their choice wins, restore nothing.
   - Otherwise restore `savedSkin` — unless localStorage changed during the
     chapter (the visitor explicitly persisted a choice mid-chapter, which can
     only still be the era skin itself if the guard above passed), in which
     case the stored skin wins.
4. **This component never writes localStorage.** All `setSkin` calls pass
   `persist: false`. A story re-theme must never clobber the visitor's
   explicit skin choice (locked behavior; e2e-asserted).

## Motion (THE MOTION GATE)

Same shape as the assembly opening: the GSAP layer arrives by dynamic import
only when motion is allowed — reduced-motion visitors never download it
(network-proof e2e). A live flip to reduced motion destroys the timeline; if
the swap hadn't fired yet, it fires instantly. If the motion chunk fails to
load, the swap fires instantly — the moment is never lost to a chunk error.

### `mountRethemeMotion(container, { onSwap })` (motion.ts — R4 era-crossing)

```ts
export interface RethemeMotionHandle {
  destroy(): void // kill timeline + clearProps on band, caption, stagger targets
}
export interface RethemeMotionOptions {
  onSwap: () => void // call EXACTLY once, at the band-centre cross beat
}
```

The era-crossing (token-true timing; galenti tokens at trigger ⇒ ~1.1s travel):

- `[data-retheme-band]` (rendered by the base, `opacity: 0` at rest): a
  full-viewport horizontal band (~32vh tall, 100vw) fades in ~100ms and
  travels viewport top → bottom over `--motion-duration-2xl` on the
  `token-drama` ease. Its interior carries `data-skin="<era>"` +
  `data-zone="night"` on one element, binding it to the era skin's night
  zone — in rails-era that is the green-phosphor CRT palette, so the
  crossing frame is already rendered in the destination era while the page
  ahead of it still wears the old skin. Scanlines, vignette, glow, and the
  caption's ±1px chromatic offset are all STATIC CSS (WCAG 2.3.1 — nothing
  flickers; the band makes exactly one smooth pass).
- A mono HUD caption (`[data-retheme-caption-char]` spans) types out during
  travel — per-char opacity reveal, layout pre-measured (zero reflow), no
  cursor blink. Multi-line captions (`caption: string[]`) render one line per
  `<p>` and stream in DOM order; the per-char cadence compresses for long
  captions so the type-out always completes before the band's exit fade.
- When the band's centre crosses the viewport centre (eased progress 0.5,
  solved by inverting the travel ease): `.call(onSwap)` — the whole page
  re-tokens on that frame, hidden under the band.
- STAGGER_LEAD (~50ms) after the swap beat: token eases are re-registered
  (the settle rides the incoming era's curves) and the settle cascade runs
  over `[data-retheme-stagger]` elements inside the container — `y: 8 → 0`,
  `opacity: 0.85 → 1`, `--motion-duration-lg` each, ~40ms stagger. Order is
  grouped by token family via the attribute value:
  `data-retheme-stagger="chrome"` → `"type"` → `"surface"` → bare attribute
  last (the DOM-final bare target doubles as the choreography-complete
  marker the e2e suite waits on). Zero targets is valid (timeline still
  runs).
- Band fades out ~120ms over its final descent below the fold.
- Band frame is transform/opacity ONLY (interior painted once, composited
  along). One layout read at mount (band height). No ScrollTrigger — this is
  mount-triggered, not scroll-scrubbed. gsap core only (+ the shared
  `ds/motion/gsapPlugins` token helpers).
- The band sits at `--z-raised` — above page content, BELOW the fixed chrome
  (nav, escape-hatch pill, scroll rail at `--z-nav`).
- `destroy()` must be safe mid-flight and must leave the DOM base-styled
  (`clearProps`); it must NOT call `onSwap`.

`motion.ts` implements this timeline. The base component was built against a
stub with the same interface — it remains fully functional if the motion
layer is ever absent (chunk error → instant swap).

## Integration (chapter pages)

```tsx
const ERA_FONTS = ['Source Sans 3', 'Source Code Pro'] as const // module-level

<EraRetheme skin="rails-era" treatment="crt" warmFonts={ERA_FONTS} caption="loading 2014…">
  …chapter content; elements opt into the settle with
  data-retheme-stagger="chrome|type|surface" (bare = last, completion marker)…
</EraRetheme>
```

- `treatment` defaults to `'crt'`; `'webpack'` and `'terminal'` restyle the
  band statically (see the table above). The band interior always binds to
  the TARGET era skin's `night` zone — material dark for react-era, deep
  kiln for agentic.
- `caption` accepts a string (one line) or a string array (stacked streaming
  lines, left-aligned under the terminal treatment).
- Skins with no font files (react-era's system Roboto stack) simply omit
  `warmFonts`.

- `warmFonts` fires `document.fonts.load()` on mount (both modes) so era
  type is resident before the swap — the moment must not FOUT.
- After the swap a polite `role="status"` region announces the theme change
  (default: the skin's registry label) — narrative parity for SR users.
- The boundary must not sit inside a transformed ancestor (the sweep is
  `position: fixed`).
