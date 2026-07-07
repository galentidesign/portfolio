import { useEffect, useRef } from 'react'
import { useMotionPref } from '@/ds/motion/useMotionPref'
import type { NightMotionHandle } from './motion'
import styles from './night.module.css'

export interface NightBoundaryProps {
  /** 'enter' descends into the night zone below; 'exit' resolves back to the outer surface. */
  direction: 'enter' | 'exit'
}

/**
 * Shared light↔dark crossing — a full-width horizon band whose surface
 * luminance ramps between the outer zone and the night zone. The band root
 * paints the OUTER surface; the bridge child binds to the skin's `night`
 * zone (data-zone) and ramps to the night surface with a same-hue alpha
 * gradient, so the crossing is token-true under every skin.
 *
 * Purely decorative (aria-hidden, no focusables): it changes nothing about
 * heading hierarchy or keyboard order. Generic by design — reusable by any
 * section that crosses into a night zone; no chapter copy lives here.
 *
 * Motion (dynamic import, THE MOTION GATE): the ember horizon line draws
 * itself once on scroll-enter (DrawSVG). Reduced motion never downloads the
 * chunk — the bridge renders fully ramped and the line pre-drawn.
 */
export function NightBoundary({ direction }: NightBoundaryProps) {
  const { reduced } = useMotionPref()
  const rootRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const root = rootRef.current
    if (reduced || root === null) return

    let cancelled = false
    let handle: NightMotionHandle | null = null
    void import('./motion')
      .then(({ mountBoundaryMotion }) => {
        if (cancelled || rootRef.current === null) return
        handle = mountBoundaryMotion(rootRef.current)
      })
      .catch(() => {
        // Decorative enhancement only — a chunk error leaves the base render.
      })

    return () => {
      cancelled = true
      handle?.destroy()
      handle = null
    }
  }, [reduced])

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      data-testid={`night-boundary-${direction}`}
      data-direction={direction}
      className={styles.boundary}
    >
      <div className={styles.bridge} data-zone="night">
        <svg
          className={styles.horizon}
          viewBox="0 0 1200 48"
          preserveAspectRatio="none"
          role="presentation"
          focusable="false"
        >
          <path className={styles['horizon-line']} data-night-horizon d="M0 40 Q600 8 1200 40" />
        </svg>
      </div>
    </div>
  )
}
