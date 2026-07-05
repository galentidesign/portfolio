import type { ReactNode } from 'react'
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { skins, defaultSkin } from '@/ds/tokens/generated/skins'
import type { SystemNavEntry } from '@/system/DocShell'
import SkinsPage from './skins'

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

// DocShell renders sidebar + main; mock to render children in main.
vi.mock('@/system/DocShell', () => ({
  DocShell: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}))

const nav: SystemNavEntry[] = [{ slug: 'button', name: 'Button', tier: 'hero' }]

function renderPage() {
  return render(<SkinsPage nav={nav} />)
}

describe('SkinsPage', () => {
  it('renders the "Skins" h1', () => {
    renderPage()
    expect(screen.getByRole('heading', { level: 1, name: 'Skins' })).toBeInTheDocument()
  })

  it('renders one skin card per entry in the skins registry (including hidden)', () => {
    renderPage()
    // Each skin gets a [data-skin] wrapper for CSS scoping — count those.
    const skinCards = document.querySelectorAll('[data-skin]')
    expect(skinCards).toHaveLength(skins.length)
  })

  it('applies data-skin attribute to each skin card for CSS scoping', () => {
    renderPage()
    for (const skin of skins) {
      // The scoped data-skin wrapper must be present in the DOM
      const el = document.querySelector(`[data-skin="${skin.name}"]`)
      expect(el).not.toBeNull()
    }
  })

  it('shows "default" badge for the default skin', () => {
    renderPage()
    const skinList = screen.getByRole('list', { name: 'Skins' })
    const defaultItem = within(skinList)
      .getAllByRole('listitem')
      .find((li) => li.textContent?.includes(defaultSkin.label))
    expect(defaultItem).toBeDefined()
    expect(within(defaultItem!).getByText('default')).toBeInTheDocument()
  })

  it('shows a "CI torture skin" note for hidden skins', () => {
    renderPage()
    const debugSkin = skins.find((s) => s.hidden)
    if (!debugSkin) return // no hidden skins — skip
    expect(screen.getByText(/CI torture skin/i)).toBeInTheDocument()
  })

  it('renders a palette strip for each skin with aria-label', () => {
    renderPage()
    for (const skin of skins) {
      expect(screen.getByRole('list', { name: `${skin.label} color palette` })).toBeInTheDocument()
    }
  })

  it('renders the additive-skin contract section', () => {
    renderPage()
    expect(screen.getByRole('heading', { name: 'Additive-skin contract' })).toBeInTheDocument()
    expect(screen.getByText(/one JSON file/)).toBeInTheDocument()
  })

  it('renders a link to /system/tokens', () => {
    renderPage()
    expect(screen.getByRole('link', { name: 'Tokens' })).toHaveAttribute('href', '/system/tokens')
  })

  it('shows the default skin name in the footer', () => {
    renderPage()
    expect(screen.getByText(defaultSkin.label, { selector: 'strong' })).toBeInTheDocument()
  })
})
