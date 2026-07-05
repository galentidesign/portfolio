/**
 * Beat 2 — molecule (0.35–0.52). The input and button slide in from opposite
 * sides into the Form Field's rhythm, the field gives one focus-ring pulse,
 * then the molecule crossfades out.
 */
import type { BeatContext, Timeline } from '../timeline'

export function setInitial(ctx: BeatContext): void {
  const { set } = ctx

  const step = ctx.step('molecule')
  if (step) set(step, { opacity: 0 })

  const field = ctx.part('molecule', 'field')
  if (field) set(field, { opacity: 0, x: -48 })

  const button = ctx.part('molecule', 'button')
  if (button) set(button, { opacity: 0, x: 48 })
}

export function addToTimeline(tl: Timeline, ctx: BeatContext): void {
  const { ease, lead } = ctx
  const { start, end } = ctx.span('molecule')
  const entrance = Math.max(0, start - lead)

  const step = ctx.step('molecule')
  const field = ctx.part('molecule', 'field')
  const button = ctx.part('molecule', 'button')

  if (step) tl.to(step, { opacity: 1, duration: 6, ease: ease.enter }, entrance)
  // Input then button slide into the row — the slight offset is the rhythm.
  if (field) tl.to(field, { opacity: 1, x: 0, duration: 7, ease: ease.move }, start)
  if (button) tl.to(button, { opacity: 1, x: 0, duration: 7, ease: ease.move }, start + 1.5)
  // One focus-ring pulse. The real ring is an outline (a paint property the
  // perf budget forbids animating), so it reads as a single opacity flash.
  if (field)
    tl.to(
      field,
      { opacity: 0.5, duration: 1.8, yoyo: true, repeat: 1, ease: ease.move },
      start + 8.5,
    )

  if (step) tl.to(step, { opacity: 0, duration: 4, ease: ease.exit }, end - 4)
}
