import { useEffect, useRef, useState } from 'react'
import { useMotionPref } from '@/ds/motion/useMotionPref'
import styles from './prologue.module.css'

// Verbatim era labels — character-for-character per story/assembly/README.md
// §"Prologue beat". The fourth station (2012–2017) deliberately runs past the
// band's 2013 end; its dot is placed at 2012 and the band carries a dashed
// overrun thread past the right edge.
const STATIONS = [
  { n: 1, year: '2004–2007', desc: 'Audio & Video Production' },
  { n: 2, year: '2007–2010', desc: 'Freelance Branding, Marketing & Web Design' },
  { n: 3, year: '2010–2012', desc: 'iOS App UX/UI Design' },
  {
    n: 4,
    year: '2012–2017',
    desc: 'Teaching Graphic Design, Audio & Film Production (University-level)',
  },
] as const

/**
 * Prologue beat (story/assembly/README.md §"Prologue beat").
 *
 * Normal-flow section between the assembly opening and chapter gateway.
 * Presents J's 2004–2013 background as a horizontal year band (stacks
 * vertically at <720 px) with four stations that reveal in sequence on scroll.
 *
 * Motion gate:
 *   - Reduced: `data-revealed` is set on the first render so all stations are
 *     immediately visible. No IntersectionObserver is created.
 *   - Normal: a single IntersectionObserver fires `data-revealed` once the
 *     section enters the viewport. CSS transitions handle the per-station
 *     stagger (opacity + translate via --motion-* tokens). The global
 *     reduced-motion override zeroes those tokens — making the reduced path
 *     instant with zero extra code.
 */
export function PrologueBeat() {
  const { reduced } = useMotionPref()
  const sectionRef = useRef<HTMLElement | null>(null)
  // Tracks whether the IntersectionObserver has fired. The section renders as
  // revealed when EITHER the motion pref is reduced OR the observer fired.
  // This avoids any direct setState call in the effect body (rule:
  // react-hooks/set-state-in-effect).
  const [observerRevealed, setObserverRevealed] = useState(false)
  const revealed = reduced || observerRevealed

  useEffect(() => {
    // When reduced, `revealed` derives to true via `reduced || observerRevealed`
    // from the very first render — no observer needed.
    if (reduced) return

    const section = sectionRef.current
    if (section === null) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setObserverRevealed(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 },
    )
    observer.observe(section)

    return () => {
      observer.disconnect()
    }
  }, [reduced])

  return (
    <section
      ref={sectionRef}
      aria-labelledby="prologue-heading"
      data-testid="prologue-beat"
      className={styles.prologue}
      {...(revealed ? { 'data-revealed': '' } : {})}
    >
      <h2 id="prologue-heading" className={styles.heading}>
        Prologue · 2004–2013
      </h2>

      {/* Year band — base rail + four stations.
          The band::after pseudo-element carries the station-4 overrun thread
          (dashed --color-accent-muted) past the 2013 right edge. */}
      <div className={styles.band}>
        <div className={styles.rail} aria-hidden="true" />

        <ol className={styles.stations} aria-label="Career era timeline">
          {STATIONS.map(({ n, year, desc }) => (
            <li key={n} data-station={String(n)} className={styles.station}>
              <div className={styles.dot} aria-hidden="true" />
              <p className={styles.label}>
                <span className={styles.year}>{year}</span>
                {' · '}
                <span className={styles.desc}>{desc}</span>
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
