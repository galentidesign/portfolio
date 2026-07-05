/**
 * Beat 0 — tokens (0.00–0.15). "Material on the table": the raw palette, type
 * specimens, spacing ruler, and easing curve settle in at differing parallax
 * rates while the field fades up, then dissolve into the atom's convergence.
 */
import type { BeatContext, Timeline } from '../timeline'

export function setInitial(ctx: BeatContext): void {
  const { set } = ctx

  const step = ctx.step('tokens')
  if (step) set(step, { opacity: 0 })

  const chips = ctx.parts('tokens', '[data-chip]')
  if (chips.length) set(chips, { opacity: 0, y: 36 })

  const specimens = ctx.part('tokens', 'specimens')
  if (specimens) set(specimens, { opacity: 0, y: -28 })

  const ruler = ctx.part('tokens', 'ruler')
  if (ruler) set(ruler, { opacity: 0, y: 44 })

  const ease = ctx.part('tokens', 'ease')
  if (ease) set(ease, { opacity: 0, y: -40 })
}

export function addToTimeline(tl: Timeline, ctx: BeatContext): void {
  const { ease } = ctx
  const { start, end } = ctx.span('tokens')

  const step = ctx.step('tokens')
  const chips = ctx.parts('tokens', '[data-chip]')
  const specimens = ctx.part('tokens', 'specimens')
  const ruler = ctx.part('tokens', 'ruler')
  const easePath = ctx.part('tokens', 'ease')

  // The field fades up; each material group arrives at its own rate (differing
  // durations + offsets read as parallax under scrub). Entrances are offset so
  // few tweens start on the same frame — the first scroll frames also carry
  // GSAP's mount work, and stacking starts there burst past the §9.3 budget.
  if (step) tl.to(step, { opacity: 1, duration: 5, ease: ease.enter }, start)
  if (ruler) tl.to(ruler, { opacity: 1, y: 0, duration: 10, ease: ease.enter }, start + 1)
  if (specimens) tl.to(specimens, { opacity: 1, y: 0, duration: 9, ease: ease.enter }, start + 2.5)
  if (easePath) tl.to(easePath, { opacity: 1, y: 0, duration: 8, ease: ease.enter }, start + 4)
  if (chips.length)
    tl.to(chips, { opacity: 1, y: 0, duration: 8, stagger: 1.1, ease: ease.enter }, start + 2)

  // Fade the field out — the atom beat converges the chip cluster through it.
  if (step) tl.to(step, { opacity: 0, duration: 4, ease: ease.exit }, end - 4)
}
