/**
 * Beat 4 — shell (0.70–1.00). The payoff: the hero settles into its resting
 * place (never dimming), the facsimile bar slides up into the real bar's
 * position and crossfades out, and the hatch pill pops in before dissolving
 * with the frame. What's left is the real shell — you're inside it now.
 */
import type { BeatContext, Timeline } from '../timeline'

/** The hatch pill and inner bar are the frame's span/div children. */
const HATCH = ':scope > span'

export function setInitial(ctx: BeatContext): void {
  const { set } = ctx

  // The hero is visible from frame one and only ever eases home — opacity 1.
  const hero = ctx.hero()
  if (hero) set(hero, { opacity: 1, y: 22, scale: 1.035, transformOrigin: '50% 50%' })

  const step = ctx.step('shell')
  if (step) set(step, { opacity: 0 })

  const frame = ctx.part('shell', 'frame')
  if (frame) set(frame, { opacity: 0, y: 38 })

  const hatch = frame ? ctx.child(frame, HATCH) : null
  if (hatch) set(hatch, { opacity: 0, scale: 0.82, transformOrigin: '50% 50%' })
}

export function addToTimeline(tl: Timeline, ctx: BeatContext): void {
  const { ease, lead } = ctx
  const { start } = ctx.span('shell')
  const entrance = Math.max(0, start - lead)

  const hero = ctx.hero()
  const step = ctx.step('shell')
  const frame = ctx.part('shell', 'frame')
  const hatch = frame ? ctx.child(frame, HATCH) : null

  if (step) tl.to(step, { opacity: 1, duration: 6, ease: ease.enter }, entrance)
  // The hero settles home — translate/scale only, never a fade. Ends before
  // the frame's exit begins in earnest: overlapping both with the facsimile
  // crossfade stacked paint past the §9.3 budget.
  if (hero) tl.to(hero, { y: 0, scale: 1, duration: 14, ease: ease.land }, start)
  // The facsimile bar arrives...
  if (frame) tl.to(frame, { opacity: 1, y: 0, duration: 7, ease: ease.enter }, start)
  // ...the hatch pill pops in...
  if (hatch) tl.to(hatch, { opacity: 1, scale: 1, duration: 5, ease: ease.pop }, start + 6)
  // ...then the whole frame slides to the real bar's position and crossfades
  // out (the hatch, its child, dissolves with it). The hero remains: the shell.
  if (frame) tl.to(frame, { opacity: 0, y: -64, duration: 10, ease: ease.exit }, start + 12)
}
