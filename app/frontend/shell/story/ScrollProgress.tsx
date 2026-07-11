import { useEffect, useRef, useState } from 'react'
import styles from './scrollProgress.module.css'

/**
 * Reading-progress rail for story pages — the nine-beat home and the
 * chapter deep-dives.
 *
 * Fixed top, full-width, 3px track; accent fill driven by scroll fraction via
 * transform: scaleX. rAF-throttled scroll + resize listeners.
 *
 * The per-frame fill update writes style.transform on the DOM node directly —
 * a React render per scroll frame is real main-thread work that bursts past
 * the §9.3 budget at 4× CPU throttle. React state is only used for the
 * visibility flip (does the document scroll at all), which changes rarely.
 *
 * Position updates are state, not motion — they happen under reduced motion
 * too. No CSS transition is added here, so the fill snaps directly to each
 * new scaleX value (simplest reduced-motion-compliant implementation).
 *
 * Hidden entirely when the document does not overflow (no scrollable range).
 */
export function ScrollProgress() {
  const [visible, setVisible] = useState(false)
  const fillRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let rafId: number | null = null

    function measure() {
      rafId = null
      const el = document.documentElement
      const scrollable = el.scrollHeight - el.clientHeight
      if (scrollable <= 0) {
        setVisible(false)
        return
      }
      setVisible(true)
      if (fillRef.current !== null) {
        fillRef.current.style.transform = `scaleX(${el.scrollTop / scrollable})`
      }
    }

    function schedule() {
      if (rafId === null) {
        rafId = requestAnimationFrame(measure)
      }
    }

    measure()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule, { passive: true })

    return () => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      if (rafId !== null) cancelAnimationFrame(rafId)
    }
  }, [visible])
  // `visible` in deps: the fill node only exists once visible flips true, and
  // the effect must re-run then so the first measure() can reach fillRef.

  if (!visible) return null

  return (
    <div aria-hidden="true" data-testid="scroll-progress" className={styles.track}>
      <div ref={fillRef} className={styles.fill} style={{ transform: 'scaleX(0)' }} />
    </div>
  )
}
