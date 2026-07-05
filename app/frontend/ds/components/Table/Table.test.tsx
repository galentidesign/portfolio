import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Table } from './Table'
import type { TableColumn } from './Table'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

interface Row {
  id: string
  name: string
  count: number
}

const COLUMNS: readonly TableColumn<Row>[] = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'count', header: 'Count', align: 'end', sortable: true },
  { key: 'id', header: 'ID' },
] as const

const ROWS: readonly Row[] = [
  { id: 'a', name: 'Alpha', count: 3 },
  { id: 'b', name: 'Beta', count: 1 },
] as const

function rowKey(row: Row) {
  return row.id
}

// ---------------------------------------------------------------------------
// Caption
// ---------------------------------------------------------------------------

describe('Table caption', () => {
  it('renders the caption text', () => {
    render(<Table caption="Test table" columns={COLUMNS} rows={ROWS} rowKey={rowKey} />)
    expect(screen.getByText('Test table')).toBeInTheDocument()
  })

  it('visually hides the caption by default (applies caption-hidden class)', () => {
    render(<Table caption="Test table" columns={COLUMNS} rows={ROWS} rowKey={rowKey} />)
    const caption = screen.getByText('Test table')
    expect(caption.className).toMatch(/caption-hidden/)
  })

  it('shows caption visibly when captionHidden is false', () => {
    render(
      <Table
        caption="Test table"
        columns={COLUMNS}
        rows={ROWS}
        rowKey={rowKey}
        captionHidden={false}
      />,
    )
    const caption = screen.getByText('Test table')
    expect(caption.className).not.toMatch(/caption-hidden/)
  })
})

// ---------------------------------------------------------------------------
// Column headers
// ---------------------------------------------------------------------------

describe('Table column headers', () => {
  it('renders th elements with scope="col"', () => {
    render(<Table caption="Test table" columns={COLUMNS} rows={ROWS} rowKey={rowKey} />)
    const headers = screen.getAllByRole('columnheader')
    expect(headers).toHaveLength(3)
    for (const th of headers) {
      expect(th).toHaveAttribute('scope', 'col')
    }
  })

  it('non-sortable column header has no button', () => {
    render(<Table caption="Test table" columns={COLUMNS} rows={ROWS} rowKey={rowKey} />)
    const idHeader = screen.getByRole('columnheader', { name: /^id$/i })
    expect(within(idHeader).queryByRole('button')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// aria-sort
// ---------------------------------------------------------------------------

describe('Table aria-sort', () => {
  it('reflects ascending sort on the active column', () => {
    render(
      <Table
        caption="Test table"
        columns={COLUMNS}
        rows={ROWS}
        rowKey={rowKey}
        sort={{ key: 'name', dir: 'asc' }}
      />,
    )
    const nameHeader = screen.getByRole('columnheader', { name: /name/i })
    expect(nameHeader).toHaveAttribute('aria-sort', 'ascending')
  })

  it('reflects descending sort on the active column', () => {
    render(
      <Table
        caption="Test table"
        columns={COLUMNS}
        rows={ROWS}
        rowKey={rowKey}
        sort={{ key: 'count', dir: 'desc' }}
      />,
    )
    const countHeader = screen.getByRole('columnheader', { name: /count/i })
    expect(countHeader).toHaveAttribute('aria-sort', 'descending')
  })

  it('does not set aria-sort on the inactive column', () => {
    render(
      <Table
        caption="Test table"
        columns={COLUMNS}
        rows={ROWS}
        rowKey={rowKey}
        sort={{ key: 'name', dir: 'asc' }}
      />,
    )
    const countHeader = screen.getByRole('columnheader', { name: /count/i })
    expect(countHeader).not.toHaveAttribute('aria-sort')
  })
})

// ---------------------------------------------------------------------------
// onSortChange
// ---------------------------------------------------------------------------

describe('Table onSortChange', () => {
  it('calls onSortChange with { key, dir: "asc" } when clicking an unsorted column', async () => {
    const user = userEvent.setup()
    const onSortChange = vi.fn()
    render(
      <Table
        caption="Test table"
        columns={COLUMNS}
        rows={ROWS}
        rowKey={rowKey}
        onSortChange={onSortChange}
      />,
    )
    const nameHeader = screen.getByRole('columnheader', { name: /name/i })
    await user.click(within(nameHeader).getByRole('button'))
    expect(onSortChange).toHaveBeenCalledWith({ key: 'name', dir: 'asc' })
  })

  it('calls onSortChange with dir toggled to "desc" when clicking the active asc column', async () => {
    const user = userEvent.setup()
    const onSortChange = vi.fn()
    render(
      <Table
        caption="Test table"
        columns={COLUMNS}
        rows={ROWS}
        rowKey={rowKey}
        sort={{ key: 'name', dir: 'asc' }}
        onSortChange={onSortChange}
      />,
    )
    const nameHeader = screen.getByRole('columnheader', { name: /name/i })
    await user.click(within(nameHeader).getByRole('button'))
    expect(onSortChange).toHaveBeenCalledWith({ key: 'name', dir: 'desc' })
  })

  it('calls onSortChange with dir toggled to "asc" when clicking the active desc column', async () => {
    const user = userEvent.setup()
    const onSortChange = vi.fn()
    render(
      <Table
        caption="Test table"
        columns={COLUMNS}
        rows={ROWS}
        rowKey={rowKey}
        sort={{ key: 'name', dir: 'desc' }}
        onSortChange={onSortChange}
      />,
    )
    const nameHeader = screen.getByRole('columnheader', { name: /name/i })
    await user.click(within(nameHeader).getByRole('button'))
    expect(onSortChange).toHaveBeenCalledWith({ key: 'name', dir: 'asc' })
  })
})

// ---------------------------------------------------------------------------
// Keyboard
// ---------------------------------------------------------------------------

describe('Table keyboard', () => {
  it('fires onSortChange via keyboard Enter on header button', async () => {
    const user = userEvent.setup()
    const onSortChange = vi.fn()
    render(
      <Table
        caption="Test table"
        columns={COLUMNS}
        rows={ROWS}
        rowKey={rowKey}
        onSortChange={onSortChange}
      />,
    )
    const nameHeader = screen.getByRole('columnheader', { name: /name/i })
    const btn = within(nameHeader).getByRole('button')
    btn.focus()
    await user.keyboard('{Enter}')
    expect(onSortChange).toHaveBeenCalledWith({ key: 'name', dir: 'asc' })
  })
})

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

describe('Table empty state', () => {
  it('renders the empty node in a td spanning all columns', () => {
    render(
      <Table
        caption="Test table"
        columns={COLUMNS}
        rows={[]}
        rowKey={rowKey}
        empty="Nothing here"
      />,
    )
    expect(screen.getByText('Nothing here')).toBeInTheDocument()
    const cell = screen.getByText('Nothing here').closest('td')
    expect(cell).toHaveAttribute('colspan', String(COLUMNS.length))
  })
})

// ---------------------------------------------------------------------------
// render() override
// ---------------------------------------------------------------------------

describe('Table render override', () => {
  it('uses render() when provided instead of field lookup', () => {
    const columns: readonly TableColumn<Row>[] = [
      { key: 'name', header: 'Name', render: (row) => <strong>CUSTOM:{row.name}</strong> },
    ] as const
    render(<Table caption="Test table" columns={columns} rows={ROWS} rowKey={rowKey} />)
    expect(screen.getByText('CUSTOM:Alpha')).toBeInTheDocument()
    // Raw field value should not appear on its own
    expect(screen.queryByText('Alpha')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// rowKey / row count
// ---------------------------------------------------------------------------

describe('Table rowKey', () => {
  it('renders the correct number of body rows (rowKey provides stable keys)', () => {
    render(<Table caption="Test table" columns={COLUMNS} rows={ROWS} rowKey={rowKey} />)
    // 1 header row + 2 body rows = 3 total
    expect(screen.getAllByRole('row')).toHaveLength(3)
  })
})
