import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import Colophon from './index'

// Head and Link require the Inertia runtime; rendered title/navigation covered by e2e.
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

const SAMPLE_CRAFT = {
  lighthouse: {
    base: 'https://portfolio-xtsv.onrender.com',
    capturedAt: '2026-07-06T02:45:59.020Z',
    min: 95,
    summary: {
      mobile: { performance: 98, accessibility: 100, bestPractices: 100, seo: 100 },
      desktop: { performance: 100, accessibility: 100, bestPractices: 100, seo: 100 },
      routes: 7,
    },
  },
  tests: { rspec: 42, vitest: 78, e2e: 55 },
  axe: { violations: 0, scope: 'route × skin × motion matrix', enforcement: 'CI' },
  ci: 'https://github.com/galentidesign/portfolio/actions',
  generatedAt: '2026-07-06T03:00:00.000Z',
}

describe('Colophon', () => {
  it('renders the colophon heading', () => {
    render(<Colophon craft={null} />)
    expect(screen.getByRole('heading', { name: 'Colophon', level: 1 })).toBeInTheDocument()
  })

  it('renders the pending message when craft is null', () => {
    render(<Colophon craft={null} />)
    expect(screen.getByText(/Craft numbers are captured by rake craft:capture/)).toBeInTheDocument()
  })

  it('renders the privacy claim', () => {
    render(<Colophon craft={null} />)
    expect(screen.getByText(/first-party, cookieless/)).toBeInTheDocument()
  })

  it('renders test counts when craft data is provided', () => {
    render(<Colophon craft={SAMPLE_CRAFT} />)
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('78')).toBeInTheDocument()
    expect(screen.getByText('55')).toBeInTheDocument()
  })

  it('renders the axe zero-violations claim when craft data is provided', () => {
    render(<Colophon craft={SAMPLE_CRAFT} />)
    expect(screen.getByText(/Zero axe violations/)).toBeInTheDocument()
  })

  it('renders a back link to /work', () => {
    render(<Colophon craft={null} />)
    const link = screen.getByRole('link', { name: /Back to the work/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/work')
  })
})
