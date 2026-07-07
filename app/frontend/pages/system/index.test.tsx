import type { ReactNode } from 'react'
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { SystemNavEntry } from '@/system/DocShell'
import type { ComponentEntry } from './index'
import SystemIndex from './index'

// Head + Link require the Inertia runtime; navigation covered by e2e.
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

// DocShell renders sidebar + main; mock it so tests focus on page content.
vi.mock('@/system/DocShell', () => ({
  DocShell: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}))

// TokenPlayground requires MotionPrefProvider (and owns its own tests) — mock
// it to a labeled section so the page test can assert placement only.
vi.mock('@/system/playground-physics/TokenPlayground', () => ({
  TokenPlayground: () => (
    <section aria-label="Token playground mock" data-testid="token-playground" />
  ),
}))

// DS components under test — use real Badge; mock Card to a simple anchor so
// href + children are testable without the full CSS module graph.
vi.mock('@/ds/components/Card/Card', () => ({
  Card: ({ href, children }: { href?: string; children: ReactNode }) => (
    <a href={href} data-testid="component-card">
      {children}
    </a>
  ),
}))

// ── Fixtures ──────────────────────────────────────────────────────────────

const nav: SystemNavEntry[] = [
  { slug: 'button', name: 'Button', tier: 'hero' },
  { slug: 'badge', name: 'Badge / Tag', tier: 'gallery' },
]

const components: ComponentEntry[] = [
  {
    slug: 'button',
    name: 'Button',
    tier: 'hero',
    status: 'stable',
    description: 'Primary action.',
  },
  { slug: 'dialog', name: 'Dialog', tier: 'hero', status: 'draft', description: 'Modal dialog.' },
  { slug: 'badge', name: 'Badge / Tag', tier: 'gallery', status: 'stable', description: 'Labels.' },
  { slug: 'card', name: 'Card', tier: 'gallery', status: 'stable', description: 'Container.' },
]

function renderPage(overrideComponents = components) {
  return render(<SystemIndex nav={nav} components={overrideComponents} />)
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe('SystemIndex', () => {
  it('renders the "Design system" h1', () => {
    renderPage()
    expect(screen.getByRole('heading', { level: 1, name: /design system/i })).toBeInTheDocument()
  })

  it('renders the token playground section', () => {
    renderPage()
    expect(screen.getByTestId('token-playground')).toBeInTheDocument()
  })

  it('renders tile links for Tokens, Motion, and Skins', () => {
    renderPage()
    const tilesNav = screen.getByRole('navigation', { name: 'System sections' })
    expect(within(tilesNav).getByRole('link', { name: 'Tokens' })).toHaveAttribute(
      'href',
      '/system/tokens',
    )
    expect(within(tilesNav).getByRole('link', { name: 'Motion' })).toHaveAttribute(
      'href',
      '/system/motion',
    )
    expect(within(tilesNav).getByRole('link', { name: 'Skins' })).toHaveAttribute(
      'href',
      '/system/skins',
    )
  })

  it('renders a Hero section with the correct component count', () => {
    renderPage()
    const heroList = screen.getByRole('list', { name: 'Hero components' })
    const items = within(heroList).getAllByRole('listitem')
    expect(items).toHaveLength(2) // button + dialog
  })

  it('renders a Gallery section with the correct component count', () => {
    renderPage()
    const galleryList = screen.getByRole('list', { name: 'Gallery components' })
    const items = within(galleryList).getAllByRole('listitem')
    expect(items).toHaveLength(2) // badge + card
  })

  it('each component card links to /system/components/:slug', () => {
    renderPage()
    const cards = screen.getAllByTestId('component-card')
    const hrefs = cards.map((c) => c.getAttribute('href'))
    expect(hrefs).toContain('/system/components/button')
    expect(hrefs).toContain('/system/components/dialog')
    expect(hrefs).toContain('/system/components/badge')
    expect(hrefs).toContain('/system/components/card')
  })

  it('shows a "draft" badge for non-stable components and not for stable ones', () => {
    renderPage()
    // Dialog is draft — should show a badge with "draft"
    expect(screen.getByText('draft')).toBeInTheDocument()
    // Button is stable — no extra badge beyond the tier badge
    const cards = screen.getAllByTestId('component-card')
    const buttonCard = cards.find((c) => c.textContent?.includes('Button'))
    expect(within(buttonCard!).queryByText('draft')).not.toBeInTheDocument()
  })

  it('renders GitHub and Figma external links with rel="noreferrer"', () => {
    renderPage()
    const github = screen.getByRole('link', { name: 'GitHub repo' })
    const figma = screen.getByRole('link', { name: 'Figma library' })
    expect(github).toHaveAttribute('rel', 'noreferrer')
    expect(figma).toHaveAttribute('rel', 'noreferrer')
  })

  it('does not render Hero or Gallery sections when components list is empty', () => {
    renderPage([])
    expect(screen.queryByRole('list', { name: 'Hero components' })).not.toBeInTheDocument()
    expect(screen.queryByRole('list', { name: 'Gallery components' })).not.toBeInTheDocument()
  })
})
