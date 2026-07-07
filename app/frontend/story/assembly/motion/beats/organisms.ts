/**
 * Beat 3 — organisms (0.52–0.70). A Nav bar facsimile drops in with real
 * weight and settles above three Table rows that spring in staggered, the
 * table block trailing the bar at its own parallax rate, then the organism
 * crossfades out.
 */
import type { BeatContext, Timeline } from '../timeline'

const ROW_SELECTOR = '[data-assembly-part="table"] tbody tr'

export function setInitial(ctx: BeatContext): void {
  const { set } = ctx

  // Conveyor: in from below, out upward — no caption double-exposure.
  const step = ctx.step('organisms')
  if (step) set(step, { opacity: 0, y: 56 })

  const bar = ctx.part('organisms', 'bar')
  if (bar) set(bar, { opacity: 0, y: -54, scale: 0.98, transformOrigin: '50% 0%' })

  const table = ctx.part('organisms', 'table')
  if (table) set(table, { y: 34 })

  const rows = ctx.parts('organisms', ROW_SELECTOR)
  if (rows.length) set(rows, { opacity: 0, y: 26 })
}

export function addToTimeline(tl: Timeline, ctx: BeatContext): void {
  const { ease, lead } = ctx
  const { start, end } = ctx.span('organisms')
  // Half the lead — the previous exit owns the first half (see atom.ts).
  const entrance = Math.max(0, start - lead / 2)

  const step = ctx.step('organisms')
  const bar = ctx.part('organisms', 'bar')
  const table = ctx.part('organisms', 'table')
  const rows = ctx.parts('organisms', ROW_SELECTOR)

  if (step) tl.to(step, { opacity: 1, y: 0, duration: 8, ease: ease.enter }, entrance)
  // The bar drops into place with dramatic weight...
  if (bar) tl.to(bar, { opacity: 1, y: 0, scale: 1, duration: 7, ease: ease.drama }, start)
  // ...the table block rises at its own, slower rate (parallax against the
  // bar and the rows it carries)...
  if (table) tl.to(table, { y: 0, duration: 12, ease: ease.move }, start + 1)
  // ...while its rows spring in, one after another.
  if (rows.length)
    tl.to(rows, { opacity: 1, y: 0, duration: 6, stagger: 2.2, ease: ease.spring }, start + 3)

  if (step) tl.to(step, { opacity: 0, y: -56, duration: 4, ease: ease.exit }, end - 6)
}
