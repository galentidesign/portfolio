import type { CSSProperties } from 'react'
import styles from './styles.module.css'

// Figma: https://www.figma.com/design/FDrHYp9F366R2GZ0Ra9koO/portfolio?node-id=90-9
// Component set "Skeleton" — shape→Shape (text/block/circle). Static resting
// fill (color/surface-sunken); the shimmer animation has no Figma home. Bound
// to the "Tokens" collection (galenti, rails-era, react-era, agentic).

export interface SkeletonProps {
  /** Placeholder shape. */
  shape?: 'text' | 'block' | 'circle'
  /** Number of bars to render (text shape only); the last bar is 60% width. */
  lines?: number
  /**
   * CSS length for block/circle (circle uses it for both dimensions).
   * Defaults: block '100%', circle '3rem'.
   */
  width?: string
  /** CSS length for block height only. Default '6rem'. */
  height?: string
}

/**
 * Purely decorative loading placeholder — the root is ALWAYS
 * `aria-hidden="true"`. The consumer owns loading semantics: pair a
 * visually-hidden "Loading…" message and `aria-busy` with the region being
 * populated; Skeleton itself announces nothing to assistive tech.
 */
export function Skeleton({ shape = 'text', lines = 3, width, height }: SkeletonProps) {
  if (shape === 'text') {
    return (
      <div className={styles.skeleton} data-shape="text" aria-hidden="true">
        {Array.from({ length: lines }, (_, index) => (
          <div
            key={index}
            className={styles.bar}
            style={index === lines - 1 ? { width: '60%' } : undefined}
          />
        ))}
      </div>
    )
  }

  // block/circle render as a single div — dimensions applied via inline style
  const style: CSSProperties =
    shape === 'circle'
      ? { width: width ?? '3rem', height: width ?? '3rem' }
      : { width: width ?? '100%', height: height ?? '6rem' }

  return <div className={styles.skeleton} data-shape={shape} aria-hidden="true" style={style} />
}
