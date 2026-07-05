import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { MotionPrefProvider } from '@/ds/motion/useMotionPref'
import { SkinProvider } from '@/shell/skin/SkinProvider'
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
  function renderPage() {
    return render(
      <MotionPrefProvider>
        <SkinProvider>
          <RailsEra />
        </SkinProvider>
      </MotionPrefProvider>,
    )
  }

  beforeEach(() => {
    // Force reduced motion so EraRetheme takes the instant (synchronous) swap
    // path in jsdom — no GSAP, no async dynamic import.
    document.documentElement.dataset.motion = 'reduced'
  })

  afterEach(() => {
    delete document.documentElement.dataset.motion
    delete document.documentElement.dataset.skin
    localStorage.clear()
  })

  it('renders the chapter h1', () => {
    renderPage()
    expect(screen.getByRole('heading', { level: 1, name: 'The Rails era' })).toBeInTheDocument()
  })

  it('has a handoff link to the React era chapter', () => {
    renderPage()
    const link = screen.getByRole('link', { name: /next: the react era/i })
    expect(link).toHaveAttribute('href', '/story/react-era')
  })

  it('labels the first section with aria-labelledby pointing to an h2', () => {
    renderPage()
    const heading = screen.getByRole('heading', { level: 2, name: 'Era artifacts' })
    expect(heading).toBeInTheDocument()
    expect(heading).toHaveAttribute('id', 'rails-era-artifacts')
    const section = heading.closest('section')
    expect(section).toHaveAttribute('aria-labelledby', 'rails-era-artifacts')
  })

  it('mounts the era-retheme boundary with the rails-era skin marked', () => {
    renderPage()
    expect(screen.getByTestId('era-retheme')).toHaveAttribute('data-era-skin', 'rails-era')
  })

  it('flips the site skin to rails-era under reduced motion', () => {
    renderPage()
    expect(document.documentElement.dataset.skin).toBe('rails-era')
  })

  it('renders the artifact exhibit as inert', () => {
    const { container } = renderPage()
    const exhibit = container.querySelector('[data-testid="artifact-exhibit"]')
    expect(exhibit).not.toBeNull()
    expect(exhibit).toHaveAttribute('inert')
  })

  it('renders the project-tracker table with fictional rows', () => {
    const { container } = renderPage()
    const caption = container.querySelector('caption')
    expect(caption).toHaveTextContent('Project tracker')
    expect(container.textContent).toContain('Trackside')
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
