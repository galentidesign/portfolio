/**
 * Beat 4 — shell (0.82–1.00). The payoff: the hero settles into its resting
 * place (never dimming), and the facsimile bar slides up into the real bar's
 * position and crossfades out. What's left is the real shell — you're inside
 * it now.
 */
import type { BeatContext, Timeline } from '../timeline'

export function setInitial(ctx: BeatContext): void {
  const { set } = ctx

  // The hero is visible from frame one and only ever eases home — opacity 1.
  const hero = ctx.hero()
  if (hero) set(hero, { opacity: 1, y: 22, scale: 1.035, transformOrigin: '50% 50%' })

  // Conveyor entrance to match the other beats; the shell never exits.
  const step = ctx.step('shell')
  if (step) set(step, { opacity: 0, y: 56 })

  const frame = ctx.part('shell', 'frame')
  if (frame) set(frame, { opacity: 0, y: 38 })
}

export function addToTimeline(tl: Timeline, ctx: BeatContext): void {
  const { ease, lead } = ctx
  const { start } = ctx.span('shell')
  // Half the lead — the previous exit owns the first half (see atom.ts).
  const entrance = Math.max(0, start - lead / 2)

  const hero = ctx.hero()
  const step = ctx.step('shell')
  const frame = ctx.part('shell', 'frame')

  if (step) tl.to(step, { opacity: 1, y: 0, duration: 8, ease: ease.enter }, entrance)
  // The hero settles home — translate/scale only, never a fade. Ends before
  // the frame's exit begins in earnest: overlapping both with the facsimile
  // crossfade stacked paint past the §9.3 budget.
  if (hero) tl.to(hero, { y: 0, scale: 1, duration: 10, ease: ease.land }, start)
  // The facsimile bar arrives with weight...
  if (frame) tl.to(frame, { opacity: 1, y: 0, duration: 6, ease: ease.drama }, start)
  // ...then slides to the real bar's position and crossfades out, settling a
  // few units before the pin releases. The hero remains: the shell.
  if (frame) tl.to(frame, { opacity: 0, y: -64, duration: 7, ease: ease.exit }, start + 9)
}
