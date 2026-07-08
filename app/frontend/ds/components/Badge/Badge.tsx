/**
 * Figma (file FDrHYp9F366R2GZ0Ra9koO, "Badge" page) — component set "Badge",
 * Tone × Size.
 * - tone (neutral | accent | positive | caution | critical) → "Tone"
 * - size (sm | md) → "Size"; children → "Label" text
 * @see https://www.figma.com/design/FDrHYp9F366R2GZ0Ra9koO/portfolio?node-id=87-20
 * Tokens come from the "Tokens" variable collection — skins galenti | rails-era
 * | react-era | agentic (+ night/day zones); flip mode at the frame level.
 */
import { type ReactNode } from 'react'
import styles from './styles.module.css'

export interface BadgeProps {
  tone?: 'neutral' | 'accent' | 'positive' | 'caution' | 'critical'
  size?: 'sm' | 'md'
  children: ReactNode
}

export function Badge({ tone = 'neutral', size = 'md', children }: BadgeProps) {
  return (
    <span className={styles.badge} data-tone={tone} data-size={size}>
      {children}
    </span>
  )
}
