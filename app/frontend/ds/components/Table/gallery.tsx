import { useState } from 'react'
import { Table } from './Table'
import type { TableColumn, TableSort } from './Table'

export const galleryMeta = { slug: 'table', title: 'Table' }

// ---------------------------------------------------------------------------
// Dataset — fictional DS component audit rows
// ---------------------------------------------------------------------------

interface AuditRow {
  component: string
  status: 'stable' | 'draft' | 'deprecated'
  tokens: number
  updated: string
}

const AUDIT_DATA: readonly AuditRow[] = [
  { component: 'Button', status: 'stable', tokens: 8, updated: '2025-06-01' },
  { component: 'FormField', status: 'stable', tokens: 14, updated: '2025-05-22' },
  { component: 'Badge', status: 'draft', tokens: 4, updated: '2025-06-10' },
  { component: 'Dialog', status: 'draft', tokens: 6, updated: '2025-06-08' },
  { component: 'Tooltip', status: 'deprecated', tokens: 3, updated: '2024-12-01' },
  { component: 'Table', status: 'stable', tokens: 11, updated: '2025-07-04' },
] as const

const COLUMNS: readonly TableColumn<AuditRow>[] = [
  { key: 'component', header: 'Component', sortable: true },
  { key: 'status', header: 'Status', sortable: true },
  // end-aligned numeric column
  { key: 'tokens', header: 'Tokens', align: 'end', sortable: true },
  { key: 'updated', header: 'Updated', sortable: true },
] as const

function sortRows(rows: readonly AuditRow[], sort: TableSort | undefined): readonly AuditRow[] {
  if (!sort) return rows
  return [...rows].sort((a, b) => {
    const aVal = String(a[sort.key as keyof AuditRow] ?? '')
    const bVal = String(b[sort.key as keyof AuditRow] ?? '')
    const cmp = aVal.localeCompare(bVal, undefined, { numeric: true })
    return sort.dir === 'asc' ? cmp : -cmp
  })
}

function GallerySection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <span
        style={{
          fontFamily: 'var(--type-small-family)',
          fontSize: 'var(--type-small-size)',
          fontWeight: 'var(--type-small-weight)',
          color: 'var(--color-ink-muted)',
          letterSpacing: 'var(--type-small-tracking)',
        }}
      >
        {label}
      </span>
      {children}
    </section>
  )
}

export default function TableGallery() {
  const [sort, setSort] = useState<TableSort | undefined>(undefined)
  const sortedRows = sortRows(AUDIT_DATA, sort)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-7)',
        padding: 'var(--space-5)',
      }}
    >
      <GallerySection label="Sortable — click any column header">
        <Table
          caption="DS component audit"
          columns={COLUMNS}
          rows={sortedRows}
          rowKey={(row) => row.component}
          sort={sort}
          onSortChange={setSort}
        />
      </GallerySection>

      <GallerySection label="Caption visible">
        <Table
          caption="DS component audit (caption visible)"
          captionHidden={false}
          columns={COLUMNS}
          rows={sortedRows}
          rowKey={(row) => row.component}
          sort={sort}
          onSortChange={setSort}
        />
      </GallerySection>

      <GallerySection label="Empty state">
        <Table
          caption="DS component audit — no results"
          columns={COLUMNS}
          rows={[]}
          rowKey={(row) => row.component}
          empty="No components match the current filter."
        />
      </GallerySection>
    </div>
  )
}
