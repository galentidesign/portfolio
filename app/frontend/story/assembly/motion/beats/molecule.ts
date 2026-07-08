/**
 * Beat 2 — molecule (0.40–0.53). The input and button slide in from opposite
 * sides and spring into the Form Field's rhythm, the field gives one
 * focus-ring pulse, then the molecule crossfades out.
 */
import type { BeatContext, Timeline } from '../timeline'

export function setInitial(ctx: BeatContext): void {
  const { set } = ctx

  // Conveyor: in from below, out upward — no caption double-exposure.
  const step = ctx.step('molecule')
  if (step) set(step, { opacity: 0, y: 56 })

  const field = ctx.part('molecule', 'field')
  if (field) set(field, { opacity: 0, x: -64, scale: 0.97, transformOrigin: '50% 50%' })

  const button = ctx.part('molecule', 'button')
  if (button) set(button, { opacity: 0, x: 64, scale: 0.97, transformOrigin: '50% 50%' })
}

export function addToTimeline(tl: Timeline, ctx: BeatContext): void {
  const { ease, lead } = ctx
  const { start } = ctx.span('molecule')
  // Half the lead — the previous exit owns the first half (see atom.ts).
  const entrance = Math.max(0, start - lead / 2)

  const step = ctx.step('molecule')
  const field = ctx.part('molecule', 'field')
  const button = ctx.part('molecule', 'button')

  if (step) tl.to(step, { opacity: 1, y: 0, duration: 8, ease: ease.enter }, entrance)
  // Input then button spring into the row — the slight offset is the rhythm.
  if (field)
    tl.to(field, { opacity: 1, x: 0, scale: 1, duration: 7, ease: ease.spring }, start)
  if (button)
    tl.to(button, { opacity: 1, x: 0, scale: 1, duration: 7, ease: ease.spring }, start + 1.5)
  // One focus-ring pulse. The real ring is an outline (a paint property the
  // perf budget forbids animating), so it reads as a single opacity flash.
  if (field)
    tl.to(
      field,
      { opacity: 0.5, duration: 1.8, yoyo: true, repeat: 1, ease: ease.move },
      start + 8.5,
    )

  if (step)
    tl.to(step, { opacity: 0, y: -56, duration: 2, ease: ease.exit }, ctx.exitAt('molecule'))
}
