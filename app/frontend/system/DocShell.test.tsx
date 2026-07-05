import type { ReactNode } from 'react'
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DocShell, type SystemNavEntry } from './DocShell'

// Link/usePage need the Inertia runtime; SkinSwitcher has its own suite.
vi.mock('@inertiajs/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@inertiajs/react')>()),
  usePage: () => ({ url: '/system/components/button' }),
  Link: ({
    href,
    children,
    className,
    'aria-current': ariaCurrent,
  }: {
    href: string
    children: ReactNode
    className?: string
    'aria-current'?: 'page'
  }) => (
    <a href={href} className={className} aria-current={ariaCurrent}>
      {children}
    </a>
  ),
}))

vi.mock('@/ds/components/SkinSwitcher/SkinSwitcher', () => ({
  SkinSwitcher: () => <div data-testid="skin-switcher" />,
}))

const nav: SystemNavEntry[] = [
  { slug: 'button', name: 'Button', tier: 'hero' },
  { slug: 'dialog', name: 'Dialog', tier: 'hero' },
  { slug: 'badge', name: 'Badge / Tag', tier: 'gallery' },
]

describe('DocShell', () => {
  it('renders system pages and manifest-driven component groups', () => {
    render(
      <DocShell nav={nav}>
        <h1>Page body</h1>
      </DocShell>,
    )

    const heroList = screen.getByRole('list', { name: 'Hero' })
    expect(within(heroList).getByRole('link', { name: 'Button' })).toHaveAttribute(
      'href',
      '/system/components/button',
    )
    const galleryList = screen.getByRole('list', { name: 'Gallery' })
    expect(within(galleryList).getByRole('link', { name: 'Badge / Tag' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Tokens' })).toHaveAttribute('href', '/system/tokens')
  })

  it('marks the current page with aria-current and renders children in main', () => {
    render(
      <DocShell nav={nav}>
        <h1>Page body</h1>
      </DocShell>,
    )

    expect(screen.getByRole('link', { name: 'Button' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Tokens' })).not.toHaveAttribute('aria-current')
    expect(
      within(screen.getByRole('main')).getByRole('heading', { name: 'Page body' }),
    ).toBeInTheDocument()
  })

  it('renders the skin switcher (skip link is now provided by the site-shell Nav)', () => {
    render(
      <DocShell nav={nav}>
        <p>body</p>
      </DocShell>,
    )

    expect(screen.queryByRole('link', { name: 'Skip to content' })).not.toBeInTheDocument()
    expect(screen.getByTestId('skin-switcher')).toBeInTheDocument()
  })
})
