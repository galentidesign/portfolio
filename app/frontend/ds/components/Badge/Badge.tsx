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
