import type { ReactNode } from 'react'

import styles from './prose-slot.module.css'

interface ProseSlotProps {
  /** Stable slug the content workstream fills against, e.g. "study-b/governance". */
  id: string
  /** Optional shape hint shown inside the slot (expected length, angle, source). */
  children?: ReactNode
}

/**
 * Labeled placeholder for study narrative. Build sessions never draft study
 * prose (see studies/README.md); pages render these slots and the content
 * workstream replaces them. Deliberately visible on staging so unfilled
 * slots are impossible to miss.
 */
export function ProseSlot({ id, children }: ProseSlotProps) {
  return (
    <div className={styles.slot} data-prose-slot={id}>
      <p className={styles.label}>Content slot: {id}</p>
      {children === undefined ? null : <div className={styles.hint}>{children}</div>}
    </div>
  )
}
