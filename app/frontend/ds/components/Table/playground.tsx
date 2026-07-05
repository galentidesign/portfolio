import { useState } from 'react'
import type { PlaygroundHostProps, PlaygroundValues } from '../playground'
import { Table } from './Table'
import type { TableColumn, TableSort } from './Table'

export const playgroundMeta = { slug: 'table' }

// ── Self-contained demo data ────────────────────────────────────────────────
// DS inventory rows — structural facts that can't silently drift, unlike
// literal token values, which vary per skin.

interface InventoryRow {
  name: string
  tier: string
  kind: string
}

const COLUMNS: readonly TableColumn<InventoryRow>[] = [
  { key: 'name', header: 'Component', sortable: true },
  { key: 'tier', header: 'Tier', sortable: true },
  { key: 'kind', header: 'Kind' },
]

const ROWS: readonly InventoryRow[] = [
  { name: 'Button', tier: 'hero', kind: 'Action' },
  { name: 'Dialog', tier: 'hero', kind: 'Overlay' },
  { name: 'Badge', tier: 'gallery', kind: 'Status' },
  { name: 'Tabs', tier: 'gallery', kind: 'Navigation' },
]

// ── Host ─────────────────────────────────────────────────────────────────────

export default function TablePlayground({ values }: PlaygroundHostProps) {
  // The host self-manages sort state — TableSort is not a scalar and cannot
  // be generated as a playground control.
  const [sort, setSort] = useState<TableSort | undefined>(undefined)

  // Scalar props that arrive from playground controls:
  const caption =
    typeof values.caption === 'string' && values.caption ? values.caption : 'Design token reference'

  // captionHidden is a boolean control (manifest default: true); fall back to
  // true when the value is absent for any reason.
  const captionHidden = typeof values.captionHidden === 'boolean' ? values.captionHidden : true

  return (
    <Table
      caption={caption}
      captionHidden={captionHidden}
      columns={COLUMNS}
      rows={ROWS}
      rowKey={(row) => row.name}
      sort={sort}
      onSortChange={setSort}
    />
  )
}

export function snippet(attrs: string, values: PlaygroundValues): string {
  // Reflect the host's caption fallback when the control is empty.
  const captionAttr = values.caption ? '' : ' caption="Design token reference"'
  return `// demo data\n<Table${captionAttr}${attrs} columns={columns} rows={rows} />`
}
