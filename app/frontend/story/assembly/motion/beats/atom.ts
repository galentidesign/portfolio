/**
 * Beat 1 — atom (0.15–0.35). Transform-only convergence: the token cluster
 * from beat 0 collapses inward with a slight twist as a real Button blooms
 * from small and "sets" with a springy scale settle, then the atom
 * crossfades out.
 */
import type { BeatContext, Timeline } from '../timeline'

export function setInitial(ctx: BeatContext): void {
  const { set } = ctx

  // Steps enter from below and exit upward (the conveyor) so two captions
  // never share pixels mid-crossfade.
  const step = ctx.step('atom')
  if (step) set(step, { opacity: 0, y: 56 })

  const button = ctx.part('atom', 'button')
  if (button) set(button, { opacity: 0, scale: 0.45, y: 14, transformOrigin: '50% 50%' })
}

export function addToTimeline(tl: Timeline, ctx: BeatContext): void {
  const { ease, lead } = ctx
  const { start, end } = ctx.span('atom')
  // Borrow only half the lead: the previous exit owns the first half, so the
  // hand-off never stacks two captions on the same frame.
  const entrance = Math.max(0, start - lead / 2)

  const step = ctx.step('atom')
  const button = ctx.part('atom', 'button')
  // The chip cluster from the previous beat is the converging material.
  const chips = ctx.part('tokens', 'chips')

  if (step) tl.to(step, { opacity: 1, y: 0, duration: 8, ease: ease.enter }, entrance)
  // Convergence flight: the cluster collapses toward centre with a slight
  // twist (it fades via the tokens exit), reading as tokens folding into the
  // component.
  if (chips)
    tl.to(chips, { scale: 0.3, y: 36, rotation: 5, duration: 8, ease: ease.drama }, entrance)
  // The Button sets — a springy bloom to rest, straight out of the collapse.
  if (button)
    tl.to(button, { opacity: 1, scale: 1, y: 0, duration: 10, ease: ease.spring }, start + 2)

  if (step) tl.to(step, { opacity: 0, y: -56, duration: 4, ease: ease.exit }, end - 6)
}
