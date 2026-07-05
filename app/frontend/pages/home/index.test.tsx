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

// The assembly opening needs the motion-pref context; pin the gate to
// reduced so the page renders its static base with no dynamic import.
vi.mock('@/ds/motion/useMotionPref', () => ({
  useMotionPref: () => ({ reduced: true, manualReduced: false, setManualReduced: vi.fn() }),
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
// Assembly opening integration
// ---------------------------------------------------------------------------

describe('Home assembly opening', () => {
  it('mounts the assembly opening section', () => {
    render(<Home />)
    expect(screen.getByTestId('assembly-opening')).toBeInTheDocument()
    expect(screen.getByTestId('skip-intro')).toBeInTheDocument()
  })

  it('gives the skip control its gateway landing target', () => {
    const { container } = render(<Home />)
    const gateway = container.querySelector('section#gateway')
    expect(gateway).toBeInTheDocument()
    expect(gateway).toHaveAttribute('tabindex', '-1')
  })

  it('mounts the prologue beat between opening and gateway', () => {
    render(<Home />)
    expect(screen.getByTestId('prologue-beat')).toBeInTheDocument()
    expect(screen.getByText(/Prologue · 2004–2013/)).toBeInTheDocument()
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
