# EraRetheme — the story-driven re-theme boundary (spec §6.2)

The money shot: a chapter route that applies an era skin to the whole site
while the visitor is inside it, as a designed moment — the same components
visibly re-tokening. Ch1 (`/story/rails-era`) wraps its content in
`<EraRetheme skin="rails-era">`. Ch2/Ch3 render own-brand and never mount
this component.

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

### `mountRethemeMotion(container, { onSwap })` (motion.ts — wave 1A)

```ts
export interface RethemeMotionHandle {
  destroy(): void // kill timeline + clearProps on sweep and stagger targets
}
export interface RethemeMotionOptions {
  onSwap: () => void // call EXACTLY once, at the sweep-cross beat
}
```

Pinned choreography (~700ms total, era-snappy):

- `[data-retheme-sweep]` (rendered by the base, `opacity: 0` at rest): fade
  in ~80ms, translate from viewport top to bottom over ~420ms, GSAP ease
  `power1.inOut` (the jQuery-era quad). It is styled with
  `var(--color-accent)` so the sweep itself re-tokens mid-travel
  (sienna → Bootstrap blue) — a designed artifact, keep it.
- At ~1/3 travel: `.call(onSwap)` — the whole page re-tokens on that frame.
- From the swap beat: settle stagger over `[data-retheme-stagger]` elements
  inside the container — `y: 8 → 0`, `opacity: 0.85 → 1`, ~240ms each,
  ~40ms stagger, `power1.out`. Zero targets is valid (timeline still runs).
- Sweep fades out ~120ms at the end of travel.
- Transform/opacity ONLY. No layout reads. ≤ ~10 concurrent tweens. No
  ScrollTrigger — this is mount-triggered, not scroll-scrubbed. gsap core
  only.
- `destroy()` must be safe mid-flight and must leave the DOM base-styled
  (`clearProps`); it must NOT call `onSwap`.

`motion.ts` implements this timeline (wave 1A). The base component was built
against a stub with the same interface — it remains fully functional if the
motion layer is ever absent (chunk error → instant swap).

## Integration (chapter pages)

```tsx
const ERA_FONTS = ['Source Sans 3', 'Source Code Pro'] as const // module-level

<EraRetheme skin="rails-era" warmFonts={ERA_FONTS}>
  …chapter content; sections opt into the settle with data-retheme-stagger…
</EraRetheme>
```

- `warmFonts` fires `document.fonts.load()` on mount (both modes) so era
  type is resident before the swap — the moment must not FOUT.
- After the swap a polite `role="status"` region announces the theme change
  (default: the skin's registry label) — narrative parity for SR users.
- The boundary must not sit inside a transformed ancestor (the sweep is
  `position: fixed`).
