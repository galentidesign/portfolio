import { useEffect, useRef } from 'react'
import { useMotionPref } from '@/ds/motion/useMotionPref'
import type { NightMotionHandle } from './motion'
import styles from './night.module.css'

export interface NightBoundaryProps {
  /** 'enter' descends into the dark zone below; 'exit' is the dawn rise into the light zone below. */
  direction: 'enter' | 'exit'
  /**
   * The zone the crossing resolves INTO (the content directly below the
   * band). Defaults by direction: 'enter' → 'night', 'exit' → 'day'.
   */
  zone?: 'night' | 'day'
}

/**
 * Shared zone crossing — a full-width dusk/dawn band whose surface luminance
 * ramps from the ambient surface above it to the zone surface below it. The
 * band root captures the AMBIENT --color-surface into a custom property
 * before the bridge child re-tokens; the bridge binds to the target zone
 * (data-zone) and paints a long sigmoid ramp of color-mix() steps between
 * the two surfaces — one continuous material for ANY zone pair under ANY
 * skin, never a seam. The horizon line takes its palette from the zone's
 * own tokens (ember for night, sienna for day).
 *
 * Purely decorative (aria-hidden, no focusables): it changes nothing about
 * heading hierarchy or keyboard order. Generic by design — reusable by any
 * section that crosses into a night or day zone; no chapter copy lives here.
 *
 * Motion (dynamic import, THE MOTION GATE): the horizon line draws itself
 * once when the band genuinely scrolls into view; a band already within or
 * above the viewport at mount keeps this base render — the fully drawn
 * final state. Reduced motion never downloads the chunk — the bridge
 * renders fully ramped and the line pre-drawn.
 */
export function NightBoundary({ direction, zone }: NightBoundaryProps) {
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
      <div className={styles.bridge} data-zone={zone ?? (direction === 'enter' ? 'night' : 'day')}>
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
