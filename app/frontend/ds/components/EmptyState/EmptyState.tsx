import { type ElementType, type ReactNode } from 'react'
import styles from './styles.module.css'

// Figma: https://www.figma.com/design/FDrHYp9F366R2GZ0Ra9koO/portfolio?node-id=95-3
// Component "EmptyState" — icon→"Icon" INSTANCE_SWAP (Icon set), action→
// "Action" INSTANCE_SWAP (Button set); title/description text. titleAs is
// code-only. Bound to the "Tokens" collection.

export interface EmptyStateProps {
  title: string
  /**
   * Element rendered for the title. Default 'p' — the consumer owns heading
   * structure. Pass a heading tag (e.g. 'h1') when the empty state IS the
   * page content, like a 404, so the page keeps a real heading.
   */
  titleAs?: ElementType
  description?: string
  icon?: ReactNode
  action?: ReactNode
}

export function EmptyState({
  title,
  titleAs: TitleTag = 'p',
  description,
  icon,
  action,
}: EmptyStateProps) {
  return (
    <div className={styles['empty-state']}>
      {icon !== undefined && (
        <div className={styles['icon-wrapper']} aria-hidden="true">
          {icon}
        </div>
      )}
      <TitleTag className={styles.title}>{title}</TitleTag>
      {description !== undefined && <p className={styles.description}>{description}</p>}
      {action !== undefined && <div className={styles['action-wrapper']}>{action}</div>}
    </div>
  )
}
