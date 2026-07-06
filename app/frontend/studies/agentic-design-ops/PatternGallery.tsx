import { Badge } from '@/ds/components/Badge/Badge'
import { Button } from '@/ds/components/Button/Button'
import { FormField } from '@/ds/components/FormField/FormField'
import { Table, type TableColumn } from '@/ds/components/Table/Table'
import { Toast } from '@/ds/components/Toast/Toast'
import styles from './PatternGallery.module.css'

// ── Tabular specimen data ──────────────────────────────────────────────────────
// Structural only — invented labels, no real production values.

interface SpecimenRow {
  id: string
  label: string
  status: string
}

const SPECIMEN_COLUMNS: readonly TableColumn<SpecimenRow>[] = [
  { key: 'label', header: 'Item' },
  { key: 'status', header: 'Status' },
]

const SPECIMEN_ROWS: readonly SpecimenRow[] = [
  { id: '1', label: 'Alpha task', status: 'Active' },
  { id: '2', label: 'Beta task', status: 'Pending' },
]

/**
 * Grid of five inert DS component compositions used as pattern specimens.
 * Each exhibit is wrapped in a <div inert> so it stays out of tab order and
 * the AT tree — the <figcaption> carries the short generic pattern label.
 * Narrative captions belong to the content workstream; do not draft them here.
 */
export function PatternGallery() {
  return (
    <div className={styles.gallery} data-testid="pattern-gallery">
      {/* 1. Inline validation pattern */}
      <figure className={styles.figure}>
        <div inert className={styles.exhibit} data-exhibit="validation">
          <FormField
            label="Email address"
            placeholder="you@example.com"
            error="Please enter a valid email address"
          />
        </div>
        <figcaption className={styles.caption}>Inline validation pattern</figcaption>
      </figure>

      {/* 2. Submission pattern */}
      <figure className={styles.figure}>
        <div inert className={styles.exhibit} data-exhibit="submission">
          <div className={styles['form-group']}>
            <FormField label="Name" placeholder="Full name" />
            <Button variant="primary">Submit</Button>
          </div>
        </div>
        <figcaption className={styles.caption}>Submission pattern</figcaption>
      </figure>

      {/* 3. Status badge pattern */}
      <figure className={styles.figure}>
        <div inert className={styles.exhibit} data-exhibit="badges">
          <div className={styles['badge-row']}>
            <Badge tone="positive">Active</Badge>
            <Badge tone="caution">Pending</Badge>
            <Badge tone="critical">Blocked</Badge>
            <Badge tone="neutral">Draft</Badge>
          </div>
        </div>
        <figcaption className={styles.caption}>Status badge pattern</figcaption>
      </figure>

      {/* 4. Tabular data pattern */}
      <figure className={styles.figure}>
        <div inert className={styles.exhibit} data-exhibit="table">
          <Table
            caption="Item list specimen"
            columns={SPECIMEN_COLUMNS}
            rows={SPECIMEN_ROWS}
            rowKey={(row) => row.id}
          />
        </div>
        <figcaption className={styles.caption}>Tabular data pattern</figcaption>
      </figure>

      {/* 5. Feedback toast pattern */}
      <figure className={styles.figure}>
        <div inert className={styles.exhibit} data-exhibit="toast">
          <Toast tone="positive" inline>
            Change applied successfully
          </Toast>
        </div>
        <figcaption className={styles.caption}>Feedback toast pattern</figcaption>
      </figure>
    </div>
  )
}
