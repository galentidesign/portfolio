import { type ReactNode } from 'react'
import styles from './styles.module.css'

export interface EmptyStateProps {
  title: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className={styles['empty-state']}>
      {icon !== undefined && (
        <div className={styles['icon-wrapper']} aria-hidden="true">
          {icon}
        </div>
      )}
      <p className={styles.title}>{title}</p>
      {description !== undefined && <p className={styles.description}>{description}</p>}
      {action !== undefined && <div className={styles['action-wrapper']}>{action}</div>}
    </div>
  )
}
