import { Table, type TableColumn } from '@/ds/components/Table/Table'
import type { ManifestProp } from './manifest'
import styles from './docs.module.css'

interface PropRow {
  name: string
  type: string
  default: string | undefined
  description: string
}

const COLUMNS: readonly TableColumn<PropRow>[] = [
  {
    key: 'name',
    header: 'Name',
    render: (row) => <code className={styles.mono}>{row.name}</code>,
  },
  {
    key: 'type',
    header: 'Type',
    render: (row) => <code className={styles.mono}>{row.type}</code>,
  },
  {
    key: 'default',
    header: 'Default',
    render: (row) =>
      row.default !== undefined ? (
        <code className={styles.mono}>{row.default}</code>
      ) : (
        <span className={styles['em-dash']} aria-label="required">
          —
        </span>
      ),
  },
  {
    key: 'description',
    header: 'Description',
  },
]

export interface PropsTableProps {
  props: ManifestProp[]
}

export function PropsTable({ props }: PropsTableProps) {
  const rows: PropRow[] = props.map((p) => ({
    name: p.name,
    type: p.type,
    default: p.default,
    description: p.description,
  }))

  return (
    <Table<PropRow>
      caption="Component props"
      columns={COLUMNS}
      rows={rows}
      rowKey={(r) => r.name}
    />
  )
}
