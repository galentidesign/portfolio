/**
 * Beat 0 — tokens (0.00–0.15). "Material on the table": the raw palette
 * springs up from below the fold, type specimens drop in, the ruler ticks
 * grow, and the easing curve floats down — every group at its own rate, with
 * a slow whole-cluster drift underneath (differing rates read as depth under
 * scrub), then the field dissolves into the atom's convergence.
 */
import type { BeatContext, Timeline } from '../timeline'

export function setInitial(ctx: BeatContext): void {
  const { set } = ctx

  const step = ctx.step('tokens')
  if (step) set(step, { opacity: 0 })

  const chips = ctx.parts('tokens', '[data-chip]')
  if (chips.length)
    set(chips, {
      opacity: 0,
      y: (i: number) => 96 + (i % 3) * 26,
      scale: 0.7,
      rotation: (i: number) => (i % 2 === 0 ? -9 : 8),
      transformOrigin: '50% 100%',
    })

  const specimens = ctx.part('tokens', 'specimens')
  if (specimens) set(specimens, { opacity: 0, y: -44, scale: 0.94 })

  const ruler = ctx.part('tokens', 'ruler')
  if (ruler) set(ruler, { opacity: 0, y: 52 })

  const ticks = ctx.parts('tokens', '[data-tick]')
  if (ticks.length) set(ticks, { scaleY: 0, transformOrigin: '50% 100%' })

  const ease = ctx.part('tokens', 'ease')
  if (ease) set(ease, { opacity: 0, y: -52, rotation: -6 })
}

export function addToTimeline(tl: Timeline, ctx: BeatContext): void {
  const { ease } = ctx
  const { start, end } = ctx.span('tokens')

  const step = ctx.step('tokens')
  const cluster = ctx.part('tokens', 'chips')
  const chips = ctx.parts('tokens', '[data-chip]')
  const specimens = ctx.part('tokens', 'specimens')
  const ruler = ctx.part('tokens', 'ruler')
  const ticks = ctx.parts('tokens', '[data-tick]')
  const easePath = ctx.part('tokens', 'ease')

  // The field fades up; each material group arrives at its own rate. Entrances
  // are offset so few tweens start on the same frame — the first scroll frames
  // also carry GSAP's mount work, and stacking starts there bursts past the
  // §9.3 budget.
  if (step) tl.to(step, { opacity: 1, duration: 4, ease: ease.enter }, start)
  if (ruler) tl.to(ruler, { opacity: 1, y: 0, duration: 8, ease: ease.enter }, start + 1)
  if (ticks.length)
    tl.to(ticks, { scaleY: 1, duration: 4, stagger: 0.7, ease: ease.spring }, start + 3)
  if (specimens)
    tl.to(specimens, { opacity: 1, y: 0, scale: 1, duration: 8, ease: ease.spring }, start + 2.5)
  if (easePath)
    tl.to(easePath, { opacity: 1, y: 0, rotation: 0, duration: 7, ease: ease.enter }, start + 4)
  if (chips.length)
    tl.to(
      chips,
      {
        opacity: 1,
        y: 0,
        scale: 1,
        rotation: 0,
        duration: 7,
        stagger: { each: 1.1, from: 'edges' },
        ease: ease.spring,
      },
      start + 2,
    )

  // The whole chip cluster drifts up at a slower rate than its arrivals —
  // container vs. children keeps the properties conflict-free, and the two
  // rates read as parallax depth. Ends before the atom borrows the cluster.
  if (cluster) tl.to(cluster, { y: -14, duration: 10, ease: 'none' }, start)

  // Fade the field out and lift it away, landing two units before the beat
  // boundary — the next entrance only gains opacity after this is gone, so
  // captions never double-expose mid-crossfade.
  if (step) tl.to(step, { opacity: 0, y: -56, duration: 4, ease: ease.exit }, end - 6)
}
