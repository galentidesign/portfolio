/**
 * Figma (file FDrHYp9F366R2GZ0Ra9koO, "Table" page) — component "Table". Header
 * row in the small role with a line-strong rule; body rows at --density-row.
 * - caption → "Caption" text + "Show caption" bool
 * - sort arrow is static in Figma (code rotates it per aria-sort)
 * @see https://www.figma.com/design/FDrHYp9F366R2GZ0Ra9koO/portfolio?node-id=32-2
 * Tokens come from the "Tokens" variable collection — skins galenti | rails-era
 * | react-era | agentic (+ night/day zones); flip mode at the frame level.
 */
import type { ReactNode } from 'react'
import styles from './styles.module.css'

export interface TableColumn<T> {
  key: string
  header: string
  align?: 'start' | 'end'
  sortable?: boolean
  render?: (row: T) => ReactNode
}

export interface TableSort {
  key: string
  dir: 'asc' | 'desc'
}

export interface TableProps<T> {
  caption: string
  /** Visually hides the caption via clip pattern (default true). */
  captionHidden?: boolean
  columns: readonly TableColumn<T>[]
  rows: readonly T[]
  rowKey: (row: T) => string
  /** Controlled sort only — the component never reorders rows. */
  sort?: TableSort
  onSortChange?: (sort: TableSort) => void
  /** Rendered in a full-span cell when rows is empty. */
  empty?: ReactNode
}

export function Table<T>({
  caption,
  captionHidden = true,
  columns,
  rows,
  rowKey,
  sort,
  onSortChange,
  empty,
}: TableProps<T>) {
  function handleSort(key: string) {
    if (!onSortChange) return
    if (sort?.key === key) {
      onSortChange({ key, dir: sort.dir === 'asc' ? 'desc' : 'asc' })
    } else {
      onSortChange({ key, dir: 'asc' })
    }
  }

  return (
    // tabIndex + role="region" + aria-label lets keyboard users scroll the
    // overflow container without needing a pointer device (WCAG 2.1 SC 2.1.1).
    <div className={styles.container} role="region" aria-label={caption} tabIndex={0}>
      <table className={styles.table}>
        <caption className={captionHidden ? styles['caption-hidden'] : styles.caption}>
          {caption}
        </caption>
        <thead>
          <tr>
            {columns.map((col) => {
              const isSortable = col.sortable === true
              const isSorted = isSortable && sort?.key === col.key
              const ariaSort: 'ascending' | 'descending' | undefined = isSorted
                ? sort!.dir === 'asc'
                  ? 'ascending'
                  : 'descending'
                : undefined

              return (
                <th
                  key={col.key}
                  scope="col"
                  className={styles.th}
                  data-align={col.align ?? 'start'}
                  data-sortable={isSortable || undefined}
                  aria-sort={ariaSort}
                >
                  {isSortable ? (
                    <button
                      type="button"
                      className={styles['sort-button']}
                      data-align={col.align ?? 'start'}
                      onClick={() => handleSort(col.key)}
                    >
                      {col.header}
                      <span
                        aria-hidden="true"
                        className={styles['sort-arrow']}
                        data-dir={isSorted ? sort!.dir : undefined}
                      >
                        ↑
                      </span>
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className={styles['empty-cell']}>
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={rowKey(row)} className={styles.tr}>
                {columns.map((col) => {
                  // Double-cast: col.key is always a field of T by column definition;
                  // the cast is only used for the fallback String() renderer.
                  const rawValue = (row as unknown as Record<string, unknown>)[col.key]
                  return (
                    <td key={col.key} className={styles.td} data-align={col.align ?? 'start'}>
                      {col.render ? col.render(row) : String(rawValue ?? '')}
                    </td>
                  )
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
