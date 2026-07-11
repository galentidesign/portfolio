import { useFx } from '@/ds/motion/useFx'
import { receipts } from '@/story/receipts/data'
import styles from './islands.module.css'

// The tick derives from the real receipt data — the same source the agentic
// chapter's full feed renders. Three most recent sessions + the totals line.
const latest = receipts.slice(-3)
const TICK_LINES = latest.map((r) => `▸ ${r.id} — ${r.title} · ${r.commits} commits`)
const totals = {
  sessions: receipts.length,
  commits: receipts.reduce((sum, r) => sum + r.commits, 0),
  agents: receipts.reduce((sum, r) => sum + r.agents.reduce((n, g) => n + g.count, 0), 0),
}
const TOTALS_LINE = `${totals.sessions} sessions · ${totals.commits} commits · ${totals.agents} agents — receipts on the chapter`

/**
 * The kiln island's interior (beat 05): a live-terminal vignette — session
 * header, three receipt lines ticking in (typewriter), ember drift rising
 * through the starfield. Static base renders every line in full; motion
 * mode re-types them (kin to the chapter's terminal-boot crossing).
 */
export function KilnInterior() {
  const linesRef = useFx<HTMLDivElement>((fx, el) => {
    const lines = Array.from(el.querySelectorAll<HTMLElement>('[data-kiln-line]'))
    const handles = lines.map((line, i) =>
      fx.mountTypewriter(line, { delay: 0.4 + i * 1.1, maxDuration: 1.4 }),
    )
    return { destroy: () => handles.forEach((h) => h.destroy()) }
  })
  const emberRef = useFx<HTMLDivElement>((fx, el) => fx.mountDrift(el, { preset: 'ember' }))

  return (
    <div ref={emberRef} data-testid="kiln-interior">
      <p className={styles['kiln-header']}>$ session live — the kiln</p>
      <div ref={linesRef} className={styles['kiln-lines']}>
        {TICK_LINES.map((line) => (
          <p key={line} className={styles['kiln-line']} data-kiln-line>
            {line}
          </p>
        ))}
      </div>
      <p className={styles['kiln-totals']}>{TOTALS_LINE}</p>
    </div>
  )
}

export default KilnInterior
