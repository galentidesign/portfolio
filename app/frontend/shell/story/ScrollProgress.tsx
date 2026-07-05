import { useEffect, useState } from 'react'
import styles from './scrollProgress.module.css'

/**
 * Reading-progress rail for story chapter pages (not home).
 *
 * Fixed top, full-width, 3px track; accent fill driven by scroll fraction via
 * transform: scaleX. rAF-throttled scroll + resize listeners.
 *
 * Position updates are state, not motion — they happen under reduced motion
 * too. No CSS transition is added here, so the fill snaps directly to each
 * new scaleX value (simplest reduced-motion-compliant implementation).
 *
 * Hidden entirely when the document does not overflow (no scrollable range).
 */
export function ScrollProgress() {
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)

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
      setProgress(el.scrollTop / scrollable)
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
  }, [])

  if (!visible) return null

  return (
    <div aria-hidden="true" data-testid="scroll-progress" className={styles.track}>
      <div className={styles.fill} style={{ transform: `scaleX(${progress})` }} />
    </div>
  )
}
