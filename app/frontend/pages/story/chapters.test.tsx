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

// Mock telemetry so sendBeacon (absent in jsdom) is never invoked and
// IntersectionObserver guard keeps story_complete from firing in unit tests.
vi.mock('@/telemetry/track', () => ({
  track: vi.fn(),
  initTelemetry: vi.fn(),
  markSkimVia: vi.fn(),
  _resetForTest: vi.fn(),
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
  // The chapter now hosts THE MOTION GATE (night boundaries, receipts feed,
  // orchestration map), so renders need the provider; reduced motion keeps
  // jsdom on the static path — no dynamic GSAP imports.
  function renderPage() {
    return render(
      <MotionPrefProvider>
        <Agentic />
      </MotionPrefProvider>,
    )
  }

  beforeEach(() => {
    document.documentElement.dataset.motion = 'reduced'
  })

  afterEach(() => {
    delete document.documentElement.dataset.motion
  })

  it('renders the chapter h1', () => {
    renderPage()
    expect(screen.getByRole('heading', { level: 1, name: 'The agentic era' })).toBeInTheDocument()
  })

  it('has a handoff link to /work — the end of the story arc', () => {
    renderPage()
    const link = screen.getByRole('link', { name: /see the work/i })
    expect(link).toHaveAttribute('href', '/work')
  })

  it('labels the agent receipts section with aria-labelledby pointing to an h2', () => {
    renderPage()
    const heading = screen.getByRole('heading', { level: 2, name: 'Agent receipts' })
    expect(heading).toBeInTheDocument()
    expect(heading).toHaveAttribute('id', 'agentic-receipts')
    const section = heading.closest('section')
    expect(section).toHaveAttribute('aria-labelledby', 'agentic-receipts')
  })

  it('wraps the chapter body in the night zone with boundaries on both sides', () => {
    renderPage()
    const zone = screen.getByTestId('night-zone')
    expect(zone).toHaveAttribute('data-zone', 'night')
    // Receipts and playbook live INSIDE the zone; the outro stays outside.
    expect(zone.contains(screen.getByRole('heading', { level: 2, name: 'Agent receipts' }))).toBe(
      true,
    )
    expect(
      zone.contains(screen.getByRole('heading', { level: 2, name: 'The agentic playbook' })),
    ).toBe(true)
    expect(zone.contains(screen.getByTestId('story-outro'))).toBe(false)
    expect(screen.getByTestId('night-boundary-enter')).toBeInTheDocument()
    expect(screen.getByTestId('night-boundary-exit')).toBeInTheDocument()
  })

  it('renders the story outro with data-testid="story-outro"', () => {
    renderPage()
    expect(screen.getByTestId('story-outro')).toBeInTheDocument()
  })

  it('story outro contains a mailto link for the contact email', () => {
    renderPage()
    const outro = screen.getByTestId('story-outro')
    const mailtoLink = outro.querySelector('a[href^="mailto:"]')
    expect(mailtoLink).not.toBeNull()
    expect(mailtoLink).toHaveAttribute('href', expect.stringContaining('galentidesign@gmail.com'))
  })

  it('story outro contains a LinkedIn link opening in a new tab', () => {
    renderPage()
    const outro = screen.getByTestId('story-outro')
    const linkedInLink = outro.querySelector('a[href*="linkedin.com"]')
    expect(linkedInLink).not.toBeNull()
    expect(linkedInLink).toHaveAttribute('target', '_blank')
    expect(linkedInLink).toHaveAttribute('rel', expect.stringContaining('noopener'))
  })
})
