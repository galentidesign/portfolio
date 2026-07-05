import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import Home from './index'

// Head and Link require the Inertia runtime; rendered title/navigation covered
// by e2e. Card renders gateway links as native <a> elements — no mock needed.
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
// Heading
// ---------------------------------------------------------------------------

describe('Home heading', () => {
  it('renders the J Galenti h1', () => {
    render(<Home />)
    expect(screen.getByRole('heading', { level: 1, name: 'J Galenti' })).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Chapter gateway links
// ---------------------------------------------------------------------------

describe('Home chapter gateway', () => {
  it('links to the Rails era chapter', () => {
    render(<Home />)
    const link = screen.getByRole('link', { name: /the rails era/i })
    expect(link).toHaveAttribute('href', '/story/rails-era')
  })

  it('links to the React era chapter', () => {
    render(<Home />)
    const link = screen.getByRole('link', { name: /the react era/i })
    expect(link).toHaveAttribute('href', '/story/react-era')
  })

  it('links to the agentic era chapter', () => {
    render(<Home />)
    const link = screen.getByRole('link', { name: /the agentic era/i })
    expect(link).toHaveAttribute('href', '/story/agentic')
  })

  it('renders exactly three chapter gateway cards', () => {
    render(<Home />)
    // All three cards are <a> elements (Card with href); filter to gateway hrefs.
    const links = ['/story/rails-era', '/story/react-era', '/story/agentic'].map((href) =>
      screen.getByRole('link', { name: new RegExp(href.split('/').pop()!.replace('-', ' '), 'i') }),
    )
    expect(links).toHaveLength(3)
  })
})

// ---------------------------------------------------------------------------
// Slot annotations (build-in-public markers)
// ---------------------------------------------------------------------------

describe('Home slot annotations', () => {
  it('shows the assembly opening annotation', () => {
    render(<Home />)
    expect(screen.getByText(/assembly opening — lands with M5/i)).toBeInTheDocument()
  })

  it('shows the prologue slot annotation', () => {
    render(<Home />)
    expect(screen.getByText(/prologue · 2004–2013 — lands with M5/i)).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Accessibility landmarks
// ---------------------------------------------------------------------------

describe('Home accessibility', () => {
  it('wraps content in a <main id="main"> landmark', () => {
    const { container } = render(<Home />)
    const main = container.querySelector('main#main')
    expect(main).toBeInTheDocument()
  })

  it('labels the gateway section with an accessible heading', () => {
    render(<Home />)
    const heading = screen.getByRole('heading', { name: /chapters/i })
    expect(heading).toHaveAttribute('id', 'chapter-gateway-heading')
    const section = heading.closest('section')
    expect(section).toHaveAttribute('aria-labelledby', 'chapter-gateway-heading')
  })
})
