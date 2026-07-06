import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Receipts } from './Receipts'
import { receipts } from './data'

const BLOB_PREFIX = 'https://github.com/galentidesign/portfolio/blob/main/docs/receipts/'

describe('Receipts (Ch3 §6.7)', () => {
  it('renders one timeline entry per receipt file', () => {
    render(<Receipts />)
    const timeline = screen.getByRole('list', { name: /build sessions/i })
    expect(within(timeline).getAllByRole('listitem').length).toBeGreaterThanOrEqual(receipts.length)
  })

  it('derives the totals strip from the data — never hardcoded', () => {
    render(<Receipts />)
    const totals = screen.getByRole('list', { name: /build totals/i })
    const commits = receipts.reduce((sum, r) => sum + r.commits, 0)
    const agents = receipts.reduce((sum, r) => sum + r.agents.reduce((n, g) => n + g.count, 0), 0)
    expect(within(totals).getByText(String(receipts.length))).toBeInTheDocument()
    expect(within(totals).getByText(String(commits))).toBeInTheDocument()
    expect(within(totals).getByText(String(agents))).toBeInTheDocument()
  })

  it('links every session title to its receipt file on GitHub', () => {
    render(<Receipts />)
    for (const receipt of receipts) {
      const link = screen.getByRole('link', { name: `${receipt.title} →` })
      expect(link).toHaveAttribute('href', expect.stringContaining(BLOB_PREFIX))
      expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
    }
  })

  it('renders the agent crew label with tiers and roles', () => {
    render(<Receipts />)
    const first = receipts[0]
    const label = `${first.agents[0].count} ${first.agents[0].tier} ${first.agents[0].role}`
    expect(screen.getAllByText(new RegExp(label)).length).toBeGreaterThan(0)
  })

  it('renders every moment from every session', () => {
    render(<Receipts />)
    for (const receipt of receipts) {
      for (const moment of receipt.moments) {
        expect(screen.getByText(moment)).toBeInTheDocument()
      }
    }
  })

  it('renders one blockquote per excerpted receipt, attributed to its source path', () => {
    render(<Receipts />)
    const excerpted = receipts.filter((r) => r.excerpt !== undefined)
    for (const receipt of excerpted) {
      expect(screen.getByText(`— ${receipt.sourcePath}`)).toBeInTheDocument()
    }
  })

  it('links to the receipts directory in the repo', () => {
    render(<Receipts />)
    const link = screen.getByRole('link', { name: /all receipts in the repo/i })
    expect(link).toHaveAttribute(
      'href',
      'https://github.com/galentidesign/portfolio/tree/main/docs/receipts',
    )
  })
})
