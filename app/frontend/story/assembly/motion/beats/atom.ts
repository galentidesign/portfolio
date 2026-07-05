/**
 * Beat 1 — atom (0.15–0.35). Transform-only convergence: the token cluster
 * from beat 0 collapses inward as a real Button blooms from small and "sets"
 * with a low-overshoot scale settle, then the atom crossfades out.
 */
import type { BeatContext, Timeline } from '../timeline'

export function setInitial(ctx: BeatContext): void {
  const { set } = ctx

  const step = ctx.step('atom')
  if (step) set(step, { opacity: 0 })

  const button = ctx.part('atom', 'button')
  if (button) set(button, { opacity: 0, scale: 0.5, transformOrigin: '50% 50%' })
}

export function addToTimeline(tl: Timeline, ctx: BeatContext): void {
  const { ease, lead } = ctx
  const { start, end } = ctx.span('atom')
  const entrance = Math.max(0, start - lead)

  const step = ctx.step('atom')
  const button = ctx.part('atom', 'button')
  // The chip cluster from the previous beat is the converging material.
  const chips = ctx.part('tokens', 'chips')

  if (step) tl.to(step, { opacity: 1, duration: 6, ease: ease.enter }, entrance)
  // Convergence flight: the cluster collapses toward centre (it fades via the
  // tokens exit), reading as tokens folding into the component.
  if (chips) tl.to(chips, { scale: 0.35, y: 24, duration: 8, ease: ease.move }, entrance)
  // The Button sets — scale to rest with a soft back-out.
  if (button) tl.to(button, { opacity: 1, scale: 1, duration: 10, ease: ease.settle }, start + 2)

  if (step) tl.to(step, { opacity: 0, duration: 6, ease: ease.exit }, end - 6)
}
