import { type ReactNode } from 'react'
import styles from './styles.module.css'

// Figma: https://www.figma.com/design/FDrHYp9F366R2GZ0Ra9koO/portfolio?node-id=87-20
// Component set "Badge" — tone→Tone, size→Size; children→"Label" text prop.
// Paints bind to the "Tokens" variable collection (skins galenti, rails-era,
// react-era, agentic).

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
