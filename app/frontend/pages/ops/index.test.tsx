import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import OpsIndex from './index'
import type { OpsProps } from './index'

// Head requires the Inertia runtime — rendered title covered by e2e.
vi.mock('@inertiajs/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@inertiajs/react')>()),
  Head: () => null,
}))

vi.mock('@/ds/components/Card/Card', () => ({
  Card: ({
    title,
    children,
  }: {
    title?: string
    children: ReactNode
    footer?: ReactNode
    href?: string
  }) => (
    <div data-testid="card">
      {title !== undefined && <span data-testid="card-title">{title}</span>}
      <div data-testid="card-body">{children}</div>
    </div>
  ),
}))

vi.mock('@/ds/components/Table/Table', () => ({
  Table: ({
    caption,
    rows,
    empty,
    rowKey,
  }: {
    caption: string
    rows: unknown[]
    empty?: ReactNode
    rowKey: (row: unknown) => string
    columns: unknown[]
  }) => (
    <div data-testid={`table:${caption}`} aria-label={caption}>
      {rows.length === 0
        ? empty
        : rows.map((row) => (
            <div key={rowKey(row)} data-testid="table-row">
              {JSON.stringify(row)}
            </div>
          ))}
    </div>
  ),
}))

// ── Fixtures ──────────────────────────────────────────────────────────────────

const FIXTURE_PROPS: OpsProps = {
  daily: [
    { day: '2026-07-01', count: 5 },
    { day: '2026-07-02', count: 8 },
  ],
  topReferrers: [
    { referrer: 'https://linkedin.com', count: 12 },
    { referrer: 'https://github.com', count: 7 },
  ],
  topPaths: [
    { path: '/', count: 30 },
    { path: '/work', count: 15 },
  ],
  storyVsSkim: { storyCompletes: 4, skimEntries: 11 },
  demo: { plays: 9, visits: 6 },
  resumeDownloads: 3,
  totals: { visits30d: 42 },
}

const EMPTY_PROPS: OpsProps = {
  daily: [],
  topReferrers: [],
  topPaths: [],
  storyVsSkim: { storyCompletes: 0, skimEntries: 0 },
  demo: { plays: 0, visits: 0 },
  resumeDownloads: 0,
  totals: { visits30d: 0 },
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('OpsIndex', () => {
  describe('page structure', () => {
    it('renders a single h1 with text "Ops"', () => {
      render(<OpsIndex {...FIXTURE_PROPS} />)
      const h1s = screen.getAllByRole('heading', { level: 1 })
      expect(h1s).toHaveLength(1)
      expect(h1s[0]).toHaveTextContent('Ops')
    })

    it('has a <main> element with id="main"', () => {
      const { container } = render(<OpsIndex {...FIXTURE_PROPS} />)
      expect(container.querySelector('main#main')).toBeInTheDocument()
    })

    it('renders three h2 section headings', () => {
      render(<OpsIndex {...FIXTURE_PROPS} />)
      const h2s = screen.getAllByRole('heading', { level: 2 })
      expect(h2s).toHaveLength(3)
    })
  })

  describe('stat cards', () => {
    it('renders visits30d value', () => {
      render(<OpsIndex {...FIXTURE_PROPS} />)
      expect(screen.getByText('42')).toBeInTheDocument()
    })

    it('renders demo plays value', () => {
      render(<OpsIndex {...FIXTURE_PROPS} />)
      expect(screen.getByText('9')).toBeInTheDocument()
    })

    it('renders resumeDownloads value', () => {
      render(<OpsIndex {...FIXTURE_PROPS} />)
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('renders story vs skim as "N story / M skim"', () => {
      render(<OpsIndex {...FIXTURE_PROPS} />)
      expect(screen.getByText('4 story / 11 skim')).toBeInTheDocument()
    })

    it('renders four stat cards', () => {
      render(<OpsIndex {...FIXTURE_PROPS} />)
      expect(screen.getAllByTestId('card')).toHaveLength(4)
    })
  })

  describe('tables with data', () => {
    it('renders daily visits rows', () => {
      render(<OpsIndex {...FIXTURE_PROPS} />)
      const table = screen.getByLabelText('Daily visits over the last 30 days')
      expect(table).toBeInTheDocument()
      const rows = table.querySelectorAll('[data-testid="table-row"]')
      expect(rows).toHaveLength(2)
    })

    it('renders top referrer rows', () => {
      render(<OpsIndex {...FIXTURE_PROPS} />)
      const table = screen.getByLabelText('Top 10 referrers')
      const rows = table.querySelectorAll('[data-testid="table-row"]')
      expect(rows).toHaveLength(2)
    })

    it('renders top path rows', () => {
      render(<OpsIndex {...FIXTURE_PROPS} />)
      const table = screen.getByLabelText('Top 10 page paths')
      const rows = table.querySelectorAll('[data-testid="table-row"]')
      expect(rows).toHaveLength(2)
    })
  })

  describe('empty state', () => {
    it('renders "No data yet." for daily when empty', () => {
      render(<OpsIndex {...EMPTY_PROPS} />)
      const empties = screen.getAllByText('No data yet.')
      // Three tables, all empty
      expect(empties).toHaveLength(3)
    })

    it('does not render table rows when all tables are empty', () => {
      const { container } = render(<OpsIndex {...EMPTY_PROPS} />)
      expect(container.querySelectorAll('[data-testid="table-row"]')).toHaveLength(0)
    })

    it('renders 0 for all stat values when empty', () => {
      render(<OpsIndex {...EMPTY_PROPS} />)
      // visits30d=0, demo.plays=0, resumeDownloads=0 — three "0" nodes
      const zeros = screen.getAllByText('0')
      expect(zeros.length).toBeGreaterThanOrEqual(3)
    })
  })
})
