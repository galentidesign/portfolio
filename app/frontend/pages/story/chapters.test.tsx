import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import RailsEra from './rails-era'
import ReactEra from './react-era'
import Agentic from './agentic'

// Head and Link require the Inertia runtime; navigation and titles are covered
// by e2e. ScrollProgress renders null in jsdom (no layout → no overflow).
vi.mock('@inertiajs/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@inertiajs/react')>()),
  Head: () => null,
  Link: ({
    href,
    children,
    className,
  }: {
    href: string
    children: ReactNode
    className?: string
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}))

// ---------------------------------------------------------------------------
// Chapter 1 — The Rails era
// ---------------------------------------------------------------------------

describe('RailsEra page', () => {
  it('renders the chapter h1', () => {
    render(<RailsEra />)
    expect(screen.getByRole('heading', { level: 1, name: 'The Rails era' })).toBeInTheDocument()
  })

  it('has a handoff link to the React era chapter', () => {
    render(<RailsEra />)
    const link = screen.getByRole('link', { name: /next: the react era/i })
    expect(link).toHaveAttribute('href', '/story/react-era')
  })

  it('labels the first section with aria-labelledby pointing to an h2', () => {
    render(<RailsEra />)
    const heading = screen.getByRole('heading', { level: 2, name: 'Era artifacts' })
    expect(heading).toBeInTheDocument()
    expect(heading).toHaveAttribute('id', 'rails-era-artifacts')
    const section = heading.closest('section')
    expect(section).toHaveAttribute('aria-labelledby', 'rails-era-artifacts')
  })

  it('shows the re-theme annotation', () => {
    render(<RailsEra />)
    expect(screen.getByText(/this chapter will re-theme the whole site/i)).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Chapter 2 — The React era
// ---------------------------------------------------------------------------

describe('ReactEra page', () => {
  it('renders the chapter h1', () => {
    render(<ReactEra />)
    expect(screen.getByRole('heading', { level: 1, name: 'The React era' })).toBeInTheDocument()
  })

  it('has a handoff link to the agentic era chapter', () => {
    render(<ReactEra />)
    const link = screen.getByRole('link', { name: /next: the agentic era/i })
    expect(link).toHaveAttribute('href', '/story/agentic')
  })

  it('labels the token engine section with aria-labelledby pointing to an h2', () => {
    render(<ReactEra />)
    const heading = screen.getByRole('heading', { level: 2, name: 'The token engine' })
    expect(heading).toBeInTheDocument()
    expect(heading).toHaveAttribute('id', 'react-era-engine')
    const section = heading.closest('section')
    expect(section).toHaveAttribute('aria-labelledby', 'react-era-engine')
  })
})

// ---------------------------------------------------------------------------
// Chapter 3 — The agentic era
// ---------------------------------------------------------------------------

describe('Agentic page', () => {
  it('renders the chapter h1', () => {
    render(<Agentic />)
    expect(screen.getByRole('heading', { level: 1, name: 'The agentic era' })).toBeInTheDocument()
  })

  it('has a handoff link to /work — the end of the story arc', () => {
    render(<Agentic />)
    const link = screen.getByRole('link', { name: /see the work/i })
    expect(link).toHaveAttribute('href', '/work')
  })

  it('labels the agent receipts section with aria-labelledby pointing to an h2', () => {
    render(<Agentic />)
    const heading = screen.getByRole('heading', { level: 2, name: 'Agent receipts' })
    expect(heading).toBeInTheDocument()
    expect(heading).toHaveAttribute('id', 'agentic-receipts')
    const section = heading.closest('section')
    expect(section).toHaveAttribute('aria-labelledby', 'agentic-receipts')
  })
})
