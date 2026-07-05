/**
 * Beat 3 — organisms (0.52–0.70). A Nav bar facsimile drops in and settles
 * above three Table rows that build in staggered, then the organism
 * crossfades out.
 */
import type { BeatContext, Timeline } from '../timeline'

const ROW_SELECTOR = '[data-assembly-part="table"] tbody tr'

export function setInitial(ctx: BeatContext): void {
  const { set } = ctx

  const step = ctx.step('organisms')
  if (step) set(step, { opacity: 0 })

  const bar = ctx.part('organisms', 'bar')
  if (bar) set(bar, { opacity: 0, y: -42 })

  const rows = ctx.parts('organisms', ROW_SELECTOR)
  if (rows.length) set(rows, { opacity: 0, y: 26 })
}

export function addToTimeline(tl: Timeline, ctx: BeatContext): void {
  const { ease, lead } = ctx
  const { start, end } = ctx.span('organisms')
  const entrance = Math.max(0, start - lead)

  const step = ctx.step('organisms')
  const bar = ctx.part('organisms', 'bar')
  const rows = ctx.parts('organisms', ROW_SELECTOR)

  if (step) tl.to(step, { opacity: 1, duration: 6, ease: ease.enter }, entrance)
  // The bar drops into place with a soft settle...
  if (bar) tl.to(bar, { opacity: 1, y: 0, duration: 7, ease: ease.settle }, start)
  // ...then the rows build in, one after another.
  if (rows.length)
    tl.to(rows, { opacity: 1, y: 0, duration: 6, stagger: 2.2, ease: ease.enter }, start + 3)

  if (step) tl.to(step, { opacity: 0, duration: 5, ease: ease.exit }, end - 5)
}
